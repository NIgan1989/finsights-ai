
import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
// PDF and related imports are now dynamically imported in handleDownload
import { FinancialReport, ForecastData, Transaction, Granularity, BusinessProfile, CounterpartyData } from '../../types';
import StatCard from './StatCard.tsx';
import ChartCard from './ChartCard.tsx';
import CategoryChartCard from './CategoryChartCard.tsx';
import FinancialStatementCard from './FinancialStatementCard.tsx';
import ReportTabs from './ReportTabs.tsx';
import GranularitySwitcher from './GranularitySwitcher.tsx';
// import { generateReportSummary, generateFinancialForecast } from '../services/geminiService.ts';
import Loader from './Loader.tsx';
import { useTheme } from './ThemeProvider';
// Добавляю декларации для pdfmake и vfs_fonts
// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore
import vfsFonts from 'pdfmake/build/vfs_fonts';
import html2canvas from 'html2canvas';
(pdfMake as any).vfs = (vfsFonts as any).vfs;

import AdvancedFinancialDashboard from './AdvancedFinancialDashboard.tsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { generateAdvancedFinancialReport } from '../../services/advancedFinancialService';
import { generateAdvancedPdfReport } from '../../services/advancedPdfService';
import CreateDebtModal from './CreateDebtModal.tsx';
import { useUser } from './UserContext';
import { subscriptionService } from '../../services/subscriptionService';
import { formatLocalDate, getCurrentLocalDate, parseLocalDate } from '../../utils/dateUtils';
import { formatCurrency as formatCurrencyUtil, formatNumber } from '../../utils/formatUtils';

interface DashboardProps {
    report: FinancialReport;
    dateRange: { start: string; end: string };
    transactions: Transaction[];
    profile: BusinessProfile | null;
    onAddTransaction?: (transaction: Transaction) => void;
}

type ReportView = 'pnl' | 'cashflow' | 'balance' | 'forecast' | 'counterparties' | 'debts' | 'advanced';

const formatCurrency = (value: number) => formatCurrencyUtil(Math.round(value));

const Dashboard: React.FC<DashboardProps> = ({ report, dateRange, transactions, profile, onAddTransaction }) => {
    const { userId, email, subscriptionInfo, refreshSubscription } = useUser();
    const { pnl, cashFlow, balanceSheet, counterpartyReport, debtReport } = report;
    const [activeReport, setActiveReport] = useState<ReportView>('pnl');
    const [forecastData, setForecastData] = useState<ForecastData | null>(null);
    const [isForecasting, setIsForecasting] = useState(false);
    const [forecastError, setForecastError] = useState<string | null>(null);
    const [granularity, setGranularity] = useState<Granularity>('month');
    const [isCreateDebtModalOpen, setIsCreateDebtModalOpen] = useState(false);
    const { theme } = useTheme();

    const [isCashflowModalOpen, setIsCashflowModalOpen] = useState(false);
    const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);

    // Refs to capture charts as images
    const pnlChartRef = useRef<HTMLDivElement>(null);
    const categoryChartRef = useRef<HTMLDivElement>(null);
    const cashflowChartRef = useRef<HTMLDivElement>(null);
    const forecastChartRef = useRef<HTMLDivElement>(null);

    const aggregatedChartData = useMemo(() => {
        if (!transactions) return { pnlData: [], cashFlowData: [] };

        if (granularity === 'month') {
            return {
                pnlData: report.pnl.monthlyData.map(d => ({ ...d, label: d.month })),
                cashFlowData: report.cashFlow.monthlyData.map(d => ({ ...d, label: d.month }))
            };
        }

        const getGroupKey = (dateStr: string, gran: Granularity): string => {
            const d = parseLocalDate(dateStr) || new Date(dateStr);
            if (gran === 'day') {
                return formatLocalDate(d);
            }
            if (gran === 'week') {
                const startOfWeek = new Date(d);
                startOfWeek.setDate(d.getDate() - d.getDay());
                return formatLocalDate(startOfWeek);
            }
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        };

        const getLabel = (dateStr: string, gran: Granularity): string => {
            const d = parseLocalDate(dateStr) || new Date(dateStr);
            if (gran === 'day') return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
            if (gran === 'week') return `Нед. ${d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}`;
            return d.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
        };

        const summary: Record<string, { cashInflow: number; cashOutflow: number; revenue: number; expenses: number; profit: number }> = {};

        transactions.forEach(t => {
            const key = getGroupKey(t.date, granularity);
            if (!summary[key]) {
                summary[key] = { cashInflow: 0, cashOutflow: 0, revenue: 0, expenses: 0, profit: 0 };
            }

            if (t.type === 'income') {
                summary[key].cashInflow += t.amount;
                summary[key].revenue += t.amount;
            } else {
                summary[key].cashOutflow += t.amount;
                summary[key].expenses += t.amount;
            }
            summary[key].profit = summary[key].revenue - summary[key].expenses;
        });

        const pnlData = Object.keys(summary).sort().map(key => ({
            label: getLabel(key, granularity),
            'Доход': summary[key].revenue,
            'Расход': summary[key].expenses,
            'Прибыль': summary[key].profit,
        }));

        const cashFlowData = Object.keys(summary).sort().map(key => ({
            label: getLabel(key, granularity),
            'Поступления': summary[key].cashInflow,
            'Выбытия': summary[key].cashOutflow,
            'Чистый поток': summary[key].cashInflow - summary[key].cashOutflow,
        }));

        return { pnlData, cashFlowData };

    }, [transactions, granularity, report]);

    // Функция для погашения долга
    const handleRepayDebt = (counterparty: string, amount: number, isReceivable: boolean) => {
        if (!onAddTransaction) return;

        const transaction: Transaction = {
            id: `repay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            date: getCurrentLocalDate(),
            description: isReceivable 
                ? `Возврат долга: ${counterparty}`
                : `Погашение кредита: ${counterparty}`,
            amount: Math.abs(amount),
            type: isReceivable ? 'income' : 'expense',
            counterparty: counterparty,
            category: isReceivable ? 'Возврат долга' : 'Погашение кредита',
            transactionType: 'financing',
            isCapitalized: false,
            needsClarification: false,
        };

        onAddTransaction(transaction);
    };

    // Функция для создания нового обязательства
    const handleCreateDebt = (transaction: Transaction) => {
        if (onAddTransaction) {
            onAddTransaction(transaction);
        }
    };
    
    // Используем theme для адаптации цветов графиков
    const chartColors = useMemo(() => {
        return {
            revenue: 'var(--chart-1)',     // Синий для доходов
            expense: 'var(--chart-3)',     // Красный для расходов
            profit: 'var(--chart-2)',      // Зеленый для прибыли
            background: 'var(--background)'
        };
    }, [theme]);

    const kpi = useMemo(() => {
        const quickRatio = (balanceSheet.assets.cash + balanceSheet.assets.receivables) / (balanceSheet.liabilities.payables || 1);
        const currentRatio = balanceSheet.assets.totalAssets / (balanceSheet.liabilities.totalLiabilities || 1);
        const profitMargin = pnl.totalRevenue ? (pnl.netProfit / pnl.totalRevenue) * 100 : 0;
        // Динамика прибыли
        let profitDelta = 0;
        if (pnl.monthlyData.length > 1) {
            const last = pnl.monthlyData[pnl.monthlyData.length - 1].Прибыль;
            const prev = pnl.monthlyData[pnl.monthlyData.length - 2].Прибыль;
            profitDelta = last - prev;
        }
        return { quickRatio, currentRatio, profitMargin, profitDelta };
    }, [balanceSheet, pnl]);

    const explanations = useMemo(() => {
        const result: string[] = [];
        const data = pnl.monthlyData;
        for (let i = 1; i < data.length; i++) {
            const prev = data[i - 1];
            const curr = data[i];
            // Прибыль
            if (prev.Прибыль !== 0) {
                const profitChange = ((curr.Прибыль - prev.Прибыль) / Math.abs(prev.Прибыль)) * 100;
                if (Math.abs(profitChange) > 30) {
                    result.push(`В ${curr.month} прибыль ${profitChange > 0 ? 'выросла' : 'упала'} на ${profitChange.toFixed(1)}% по сравнению с предыдущим месяцем.`);
                }
            }
            // Расходы
            if (prev.Расход !== 0) {
                const expenseChange = ((curr.Расход - prev.Расход) / Math.abs(prev.Расход)) * 100;
                if (Math.abs(expenseChange) > 30) {
                    result.push(`В ${curr.month} расходы ${expenseChange > 0 ? 'выросли' : 'снизились'} на ${expenseChange.toFixed(1)}% по сравнению с предыдущим месяцем.`);
                }
            }
        }
        return result.length ? result : ['Существенных изменений не обнаружено.'];
    }, [pnl.monthlyData]);

    const ExplanationsSection = () => (
        <div className="bg-card backdrop-blur-xl border border-border p-6 rounded-2xl shadow-lg">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-info/20 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-info" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-foreground">Инсайты и пояснения</h3>
                    <p className="text-muted-foreground">Автоматический анализ ключевых изменений</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {explanations.slice(0, 3).map((explanation, index) => (
                    <div key={index} className="relative group bg-card backdrop-blur-xl border border-border p-6 rounded-2xl shadow-lg h-full flex flex-col hover:border-border/80 transition-colors">
                         <div className="relative z-10 flex items-start gap-4">
                            <div className="w-12 h-12 bg-info/20 rounded-lg flex items-center justify-center shrink-0 mt-1">
                                <svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed">{explanation}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    type KPI = {
    quickRatio: number;
    currentRatio: number;
    profitMargin: number;
    profitDelta: number;
};

const ExecutiveSummary: React.FC<{ kpi: KPI }> = ({ kpi }) => (
        <div className="bg-card backdrop-blur-xl border border-border p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Ключевые показатели</h2>
                    <p className="text-muted-foreground">Обзор основных финансовых метрик</p>
                </div>
            </div>
            
            {/* Основные KPI в сетке */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 min-w-0">
                <StatCard title="Коэффициент быстрой ликвидности" value={kpi.quickRatio} change={kpi.quickRatio > 1 ? 1 : -1} changeType={kpi.quickRatio > 1 ? 'increase' : 'decrease'} subtitle={kpi.quickRatio > 1 ? 'Отличная' : 'Требует внимания'} />
                <StatCard title="Коэффициент текущей ликвидности" value={kpi.currentRatio} change={kpi.currentRatio > 2 ? 1 : -1} changeType={kpi.currentRatio > 2 ? 'increase' : 'decrease'} subtitle={kpi.currentRatio > 2 ? 'Высокая' : 'Норма'} />
                <StatCard title="Рентабельность" value={kpi.profitMargin} change={0} changeType="increase" subtitle="по сравнению с прошлым месяцем" />
                <StatCard title="Динамика прибыли" value={kpi.profitDelta} change={kpi.profitDelta} changeType={kpi.profitDelta >= 0 ? 'increase' : 'decrease'} subtitle="по сравнению с прошлым месяцем" isCurrency={true} />
            </div>

            {/* Дополнительные метрики в компактной сетке */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 min-w-0">
                <StatCard 
                    title="Рентабельность продаж" 
                    value={kpi.profitMargin} 
                    isCurrency={false}
                    variant="compact"
                    trend={kpi.profitMargin > 10 ? 'up' : 'neutral'}
                    subtitle={kpi.profitMargin > 10 ? 'Высокая' : 'Средняя'}
                />
                
                <StatCard 
                    title="Рентабельность инвестиций" 
                    value={((kpi.profitMargin * kpi.currentRatio) / 10)} 
                    isCurrency={false}
                    variant="compact"
                    trend={((kpi.profitMargin * kpi.currentRatio) / 10) > 0 ? 'up' : 'down'}
                    subtitle="Рентабельность"
                />
                
                <StatCard 
                    title="Коэффициент задолженности" 
                    value={(1 - kpi.quickRatio)} 
                    isCurrency={false}
                    variant="compact"
                    trend={(1 - kpi.quickRatio) < 0.5 ? 'up' : 'down'}
                    subtitle="Долговая нагрузка"
                />
                
                <StatCard 
                    title="Денежный поток" 
                    value={report.cashFlow.netCashFlow} 
                    isCurrency={true}
                    variant="compact"
                    trend={report.cashFlow.netCashFlow > 0 ? 'up' : 'down'}
                    subtitle="Чистый поток"
                />
                
                <StatCard 
                    title="Статус" 
                    value={kpi.profitDelta} 
                    isCurrency={false}
                    variant="compact"
                    trend={kpi.profitDelta > 0 ? 'up' : kpi.profitDelta < 0 ? 'down' : 'neutral'}
                    subtitle="Динамика"
                />
            </div>

            {/* Сводка аналитики */}
            <div className="bg-card backdrop-blur-xl border border-border rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner ${
                        kpi.profitDelta > 0 ? 'bg-success/20 text-success-foreground' :
                kpi.profitDelta < 0 ? 'bg-destructive/20 text-destructive-foreground' : 
                        'bg-muted/20 text-muted-foreground'
                    }`}>
                        {kpi.profitDelta > 0 ? '📈' : kpi.profitDelta < 0 ? '📉' : '📊'}
                    </div>
                    <div className="flex-1">
                        <div className={`text-base font-semibold ${
                            kpi.profitDelta > 0 ? 'text-success-foreground' :
                kpi.profitDelta < 0 ? 'text-destructive-foreground' : 
                            'text-muted-foreground'
                        }`}>
                            {kpi.profitDelta > 0 ? 'Позитивная динамика' : 
                             kpi.profitDelta < 0 ? 'Требует внимания' : 
                             'Стабильные показатели'}
                        </div>
                        <div className="text-muted-foreground text-sm">
                            {forecastData?.summary || 'Аналитика по итогам периода'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );


    // Все объявления функций перемещены перед return statement

    const handleGenerateForecast = async () => {
        if (isForecasting) return;
        setIsForecasting(true);
        setForecastError(null);
        setForecastData(null);
        try {
            const response = await fetch('http://localhost:3001/api/openai/forecast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pnlMonthlyData: pnl.monthlyData })
            });
            if (!response.ok) throw new Error('Ошибка сервера');
            let data = await response.json();
            // Если data — строка, пробуем распарсить как JSON
            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    setForecastError('Ошибка парсинга ответа: ' + data);
                    return;
                }
            }
            if (!Array.isArray(data.forecastedRevenue)) {
                setForecastError('Некорректный формат ответа: ' + JSON.stringify(data));
                return;
            }
            // Преобразуем ответ к нужному формату
            const now = new Date();
            const months = Array.from({ length: data.forecastedRevenue.length }, (_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth() + 1 + i, 1);
                return d.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
            });
            const monthlyForecast = data.forecastedRevenue.map((rev: number, i: number) => ({
                month: months[i],
                forecastRevenue: rev,
                forecastExpenses: data.forecastedExpenses[i],
                forecastProfit: data.forecastedProfit[i],
            }));
            setForecastData({
                monthlyForecast,
                summary: data.assumptions || ''
            });
        } catch (e: any) {
            setForecastError(e.message || "Произошла ошибка при генерации прогноза.");
        } finally {
            setIsForecasting(false);
        }
    };

    const getChartImage = async (ref: React.RefObject<HTMLDivElement>) => {
        if (!ref.current) return null;
        const canvas = await html2canvas(ref.current, { backgroundColor: 'var(--background)', scale: 2 });
        return canvas.toDataURL('image/png');
    };



    const handleDownloadAdvancedReport = async () => {
        const currentUserId = userId ?? email;
        if (!currentUserId) {
            subscriptionService.showUpgradeModal('Войдите, чтобы скачивать отчеты');
            return;
        }
        
        // Обновляем информацию о подписке перед проверкой лимитов
        if (!subscriptionInfo) {
            try {
                await refreshSubscription();
            } catch (error) {
                console.warn('Не удалось обновить информацию о подписке:', error);
            }
        }
        
        const reportLimit = subscriptionService.checkReportDownloadLimit();
        if (!reportLimit.allowed) {
            subscriptionService.showUpgradeModal(reportLimit.reason || 'Лимит скачивания отчетов достигнут');
            return;
        }
        const advancedReport = generateAdvancedFinancialReport(transactions);
        const pdf = generateAdvancedPdfReport(advancedReport, profile?.businessName || 'Бизнес');
        pdf.download(`advanced-financial-report-${getCurrentLocalDate()}.pdf`);
        await subscriptionService.incrementReportDownloads(currentUserId);
    };

    const handleDownloadFullReport = async () => {
        const currentUserId = userId ?? email;
        if (!currentUserId) {
            subscriptionService.showUpgradeModal('Войдите, чтобы скачивать отчеты');
            return;
        }
        
        // Обновляем информацию о подписке перед проверкой лимитов
        if (!subscriptionInfo) {
            try {
                await refreshSubscription();
            } catch (error) {
                console.warn('Не удалось обновить информацию о подписке:', error);
            }
        }
        
        const reportLimit = subscriptionService.checkReportDownloadLimit();
        if (!reportLimit.allowed) {
            subscriptionService.showUpgradeModal(reportLimit.reason || 'Лимит скачивания отчетов достигнут');
            return;
        }
        const { pnl, cashFlow, balanceSheet, counterpartyReport, debtReport } = report;
        const start = (parseLocalDate(dateRange.start) || new Date(dateRange.start)).toLocaleDateString('ru-RU');
        const end = (parseLocalDate(dateRange.end) || new Date(dateRange.end)).toLocaleDateString('ru-RU');
        const now = new Date().toLocaleString('ru-RU');

        // Получаем изображения графиков через html2canvas
        const [pnlChartImg, cashflowChartImg, categoryChartImg] = await Promise.all([
            getChartImage(pnlChartRef),
            getChartImage(cashflowChartRef),
            getChartImage(categoryChartRef)
        ]);

        const executiveSummaryTable = {
            table: {
                headerRows: 1,
                widths: ['*', 'auto'],
                body: [
                    [
                        { text: 'Показатель', style: 'tableHeader', alignment: 'center' },
                        { text: 'Значение', style: 'tableHeader', alignment: 'center' }
                    ],
                    [
                        'Quick Ratio',
                        { text: kpi.quickRatio.toFixed(2), color: kpi.quickRatio > 1 ? 'green' : 'red', bold: true }
                    ],
                    [
                        'Current Ratio',
                        { text: kpi.currentRatio.toFixed(2), color: kpi.currentRatio > 1 ? 'green' : 'red', bold: true }
                    ],
                    [
                        'Profit Margin %',
                        { text: kpi.profitMargin.toFixed(2) + '%', color: kpi.profitMargin > 0 ? 'green' : 'red', bold: true }
                    ]
                ]
            },
            layout: {
                fillColor: (row: number) => row === 0 ? 'var(--gray-100)' : null,
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => 'var(--gray-300)',
                vLineColor: () => 'var(--gray-300)',
                paddingLeft: () => 4,
                paddingRight: () => 4,
                paddingTop: () => 2,
                paddingBottom: () => 2,
            },
            alignment: 'center',
            margin: [0, 0, 0, 9]
        };
        const executiveSummarySection = [
            { text: 'Executive Summary', style: 'header', alignment: 'center', margin: [0, 0, 0, 6] },
            executiveSummaryTable,
            { text: kpi.profitDelta > 0 ? 'Чистая прибыль растет' : kpi.profitDelta < 0 ? 'Чистая прибыль снижается' : 'Без изменений', color: kpi.profitDelta > 0 ? 'var(--financial-positive)' : kpi.profitDelta < 0 ? 'var(--financial-negative)' : 'var(--financial-neutral)', alignment: 'center', margin: [0, 0, 0, 8] },
            { text: forecastData?.summary || 'Аналитика по итогам периода.', style: 'meta', alignment: 'center', margin: [0, 0, 0, 8] },
            { text: `Сформировано автоматически • ${now}`, style: 'meta', alignment: 'right', margin: [0, 0, 0, 8] },
        ];

        // ГОСТ-поля: левое 85, верх/низ 57, правое 28 (в pt)
        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [85, 57, 28, 57],
            content: [
                ...executiveSummarySection,
                { text: 'Финансовый отчет', style: 'header', alignment: 'center', margin: [0, 0, 0, 12] },
                profile?.businessName ? { text: profile.businessName, style: 'subheader', alignment: 'center', margin: [0, 0, 0, 12] } : {},
                { text: `Период: с ${start} по ${end}`, alignment: 'center', style: 'meta', margin: [0, 0, 0, 6] },
                { text: `Дата формирования: ${now}`, alignment: 'center', style: 'meta', margin: [0, 0, 0, 18] },
                { text: 'Ключевые KPI', style: 'sectionHeader' },
                { text: `Quick Ratio: ${kpi.quickRatio.toFixed(2)}`, color: kpi.quickRatio > 1 ? 'var(--financial-positive)' : 'var(--financial-negative)' },
            { text: `Current Ratio: ${kpi.currentRatio.toFixed(2)}`, color: kpi.currentRatio > 1 ? 'var(--financial-positive)' : 'var(--financial-negative)' },
            { text: `Profit Margin: ${kpi.profitMargin.toFixed(2)}%`, color: kpi.profitMargin > 0 ? 'var(--financial-positive)' : 'var(--financial-negative)' },
                { text: 'Динамика прибыли и убытков', style: 'sectionHeader', margin: [0, 0, 0, 8] },
                pnlChartImg ? { image: pnlChartImg, width: 382, alignment: 'center', margin: [0, 0, 0, 12] } : {},
                { text: 'Отчет о прибылях и убытках (ОПиУ)', style: 'sectionHeader', margin: [0, 0, 0, 8] },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto'],
                        body: [
                            [
                                { text: 'Показатель', style: 'tableHeader', alignment: 'center' },
                                { text: 'Сумма', style: 'tableHeader', alignment: 'center' }
                            ],
                            ['Выручка', format(pnl.totalRevenue)],
                            ['Операционные расходы', format(pnl.totalOperatingExpenses)],
                            ['Операционная прибыль', format(pnl.operatingProfit)],
                            ['Амортизация', format(pnl.depreciation)],
                            ['Чистая прибыль', format(pnl.netProfit)],
                        ]
                    },
                    layout: {
                        fillColor: (row: number) => row === 0 ? 'var(--muted)' : null,
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => 'var(--border)',
        vLineColor: () => 'var(--border)',
                        paddingLeft: () => 8,
                        paddingRight: () => 8,
                        paddingTop: () => 4,
                        paddingBottom: () => 4,
                    },
                    alignment: 'center',
                    margin: [0, 0, 0, 18]
                },
                pnl.monthlyData.length > 0 ? { text: 'Динамика П&У по месяцам', style: 'sectionHeader', margin: [0, 0, 0, 8] } : {},
                pnl.monthlyData.length > 0 ? {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto'],
                        body: [
                            [
                                { text: 'Месяц', style: 'tableHeader', alignment: 'center' },
                                { text: 'Доход', style: 'tableHeader', alignment: 'center' },
                                { text: 'Расход', style: 'tableHeader', alignment: 'center' },
                                { text: 'Прибыль', style: 'tableHeader', alignment: 'center' }
                            ],
                            ...pnl.monthlyData.map(d => [d.month, format(d['Доход']), format(d['Расход']), format(d['Прибыль'])])
                        ]
                    },
                    layout: {
                        fillColor: (row: number) => row === 0 ? 'var(--muted)' : null,
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => 'var(--border)',
        vLineColor: () => 'var(--border)',
                        paddingLeft: () => 8,
                        paddingRight: () => 8,
                        paddingTop: () => 4,
                        paddingBottom: () => 4,
                    },
                    alignment: 'center',
                    margin: [0, 0, 0, 18]
                } : {},
                { text: 'Динамика Cash Flow', style: 'sectionHeader', margin: [0, 0, 0, 8] },
                cashflowChartImg ? { image: cashflowChartImg, width: 382, alignment: 'center', margin: [0, 0, 0, 12] } : {},
                { text: 'Движение денежных средств (ДДС)', style: 'sectionHeader', margin: [0, 0, 0, 8] },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto'],
                        body: [
                            [
                                { text: 'Показатель', style: 'tableHeader', alignment: 'center' },
                                { text: 'Сумма', style: 'tableHeader', alignment: 'center' }
                            ],
                            ['Операционная деятельность', format(cashFlow.operatingActivities)],
                            ['Инвестиционная деятельность', format(cashFlow.investingActivities)],
                            ['Финансовая деятельность', format(cashFlow.financingActivities)],
                            ['Чистый денежный поток', format(cashFlow.netCashFlow)],
                        ]
                    },
                    layout: {
                        fillColor: (row: number) => row === 0 ? 'var(--muted)' : null,
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => 'var(--border)',
        vLineColor: () => 'var(--border)',
                        paddingLeft: () => 8,
                        paddingRight: () => 8,
                        paddingTop: () => 4,
                        paddingBottom: () => 4,
                    },
                    alignment: 'center',
                    margin: [0, 0, 0, 18]
                },
                cashFlow.monthlyData.length > 0 ? { text: 'Динамика ДДС по месяцам', style: 'sectionHeader', margin: [0, 0, 0, 8] } : {},
                cashFlow.monthlyData.length > 0 ? {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto'],
                        body: [
                            [
                                { text: 'Месяц', style: 'tableHeader', alignment: 'center' },
                                { text: 'Поступления', style: 'tableHeader', alignment: 'center' },
                                { text: 'Выбытия', style: 'tableHeader', alignment: 'center' },
                                { text: 'Чистый поток', style: 'tableHeader', alignment: 'center' }
                            ],
                            ...cashFlow.monthlyData.map(d => [d.month, format(d['Поступления']), format(d['Выбытия']), format(d['Чистый поток'])])
                        ]
                    },
                    layout: {
                        fillColor: (row: number) => row === 0 ? 'var(--muted)' : null,
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => 'var(--border)',
        vLineColor: () => 'var(--border)',
                        paddingLeft: () => 8,
                        paddingRight: () => 8,
                        paddingTop: () => 4,
                        paddingBottom: () => 4,
                    },
                    alignment: 'center',
                    margin: [0, 0, 0, 18]
                } : {},
                { text: 'Структура расходов', style: 'sectionHeader', margin: [0, 0, 0, 8] },
                categoryChartImg ? { image: categoryChartImg, width: 300, alignment: 'center', margin: [0, 0, 0, 12] } : {},
                pnl.expenseByCategory.length > 0 ? {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto'],
                        body: [
                            [
                                { text: 'Категория', style: 'tableHeader', alignment: 'center' },
                                { text: 'Сумма', style: 'tableHeader', alignment: 'center' }
                            ],
                            ...pnl.expenseByCategory.map(item => [item.name, format(item.value)])
                        ]
                    },
                    layout: {
                        fillColor: (row: number) => row === 0 ? 'var(--surface-accent)' : null,
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => 'var(--border)',
        vLineColor: () => 'var(--border)',
                        paddingLeft: () => 8,
                        paddingRight: () => 8,
                        paddingTop: () => 4,
                        paddingBottom: () => 4,
                    },
                    alignment: 'center',
                    margin: [0, 0, 0, 18]
                } : {},
                { text: 'Балансовый отчет', style: 'sectionHeader', margin: [0, 0, 0, 8] },
                {
                    columns: [
                        {
                            width: '50%',
                            stack: [
                                { text: 'Активы', style: 'tableHeader', alignment: 'center', margin: [0, 0, 0, 4] },
                                {
                                    table: {
                                        widths: ['*', 'auto'],
                                        body: [
                                            ['Денежные средства', format(balanceSheet.assets.cash)],
                                            ['Дебиторская задолженность', format(balanceSheet.assets.receivables)],
                                            ['Оборудование', format(balanceSheet.assets.equipment)],
                                            ['Амортизация', format(-balanceSheet.assets.accumulatedDepreciation)],
                                            ['Чистая стоимость ОС', format(balanceSheet.assets.netEquipment)],
                                            [{ text: 'Итого активы', bold: true }, { text: format(balanceSheet.assets.totalAssets), bold: true }],
                                        ]
                                    },
                                    layout: {
                                        fillColor: (row: number) => row === 0 ? 'var(--surface-accent)' : null,
                                        hLineWidth: () => 0.5,
                                        vLineWidth: () => 0.5,
                                        hLineColor: () => 'var(--border)',
                        vLineColor: () => 'var(--border)',
                                        paddingLeft: () => 8,
                                        paddingRight: () => 8,
                                        paddingTop: () => 4,
                                        paddingBottom: () => 4,
                                    },
                                    alignment: 'center',
                                    margin: [0, 0, 0, 8]
                                }
                            ]
                        },
                        {
                            width: '50%',
                            stack: [
                                { text: 'Капитал и обязательства', style: 'tableHeader', alignment: 'center', margin: [0, 0, 0, 4] },
                                {
                                    table: {
                                        widths: ['*', 'auto'],
                                        body: [
                                            ['Кредиторская задолженность', format(balanceSheet.liabilities.payables)],
                                            ['Итого обязательства', format(balanceSheet.liabilities.totalLiabilities)],
                                            ['Нераспределенная прибыль', format(balanceSheet.equity.retainedEarnings)],
                                            ['Итого капитал', format(balanceSheet.equity.totalEquity)],
                                            [{ text: 'Итого капитал и обязательства', bold: true }, { text: format(balanceSheet.totalLiabilitiesAndEquity), bold: true }],
                                        ]
                                    },
                                    layout: {
                                        fillColor: (row: number) => row === 0 ? 'var(--surface-accent)' : null,
                                        hLineWidth: () => 0.5,
                                        vLineWidth: () => 0.5,
                                        hLineColor: () => 'var(--border)',
                        vLineColor: () => 'var(--border)',
                                        paddingLeft: () => 8,
                                        paddingRight: () => 8,
                                        paddingTop: () => 4,
                                        paddingBottom: () => 4,
                                    },
                                    alignment: 'center',
                                    margin: [0, 0, 0, 8]
                                }
                            ]
                        }
                    ],
                    columnGap: 24,
                    margin: [0, 0, 0, 18]
                },
                { text: 'Отчет по контрагентам', style: 'sectionHeader', margin: [0, 0, 0, 8] },
                counterpartyReport.length > 0 ? {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto'],
                        body: [
                            [
                                { text: 'Контрагент', style: 'tableHeader', alignment: 'center' },
                                { text: 'Доход', style: 'tableHeader', alignment: 'center' },
                                { text: 'Расход', style: 'tableHeader', alignment: 'center' },
                                { text: 'Баланс', style: 'tableHeader', alignment: 'center' }
                            ],
                            ...counterpartyReport.map(c => [c.name, format(c.income), format(c.expense), format(c.balance)])
                        ]
                    },
                    layout: {
                        fillColor: (row: number) => row === 0 ? 'var(--surface-accent)' : null,
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => 'var(--border)',
        vLineColor: () => 'var(--border)',
                        paddingLeft: () => 8,
                        paddingRight: () => 8,
                        paddingTop: () => 4,
                        paddingBottom: () => 4,
                    },
                    alignment: 'center',
                    margin: [0, 0, 0, 18]
                } : {},
                (debtReport.receivables.length > 0 || debtReport.payables.length > 0) ? { text: 'Долги и займы', style: 'sectionHeader', margin: [0, 0, 0, 8] } : {},
                debtReport.receivables.length > 0 ? {
                    text: 'Дебиторская задолженность (кто должен мне)', style: 'tableHeader', alignment: 'center', margin: [0, 6, 0, 2]
                } : {},
                debtReport.receivables.length > 0 ? {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto'],
                        body: [
                            [
                                { text: 'Контрагент', style: 'tableHeader', alignment: 'center' },
                                { text: 'Сумма', style: 'tableHeader', alignment: 'center' }
                            ],
                            ...debtReport.receivables.map(d => [d.counterparty, format(d.amount)])
                        ]
                    },
                    layout: {
                        fillColor: (row: number) => row === 0 ? 'var(--surface-accent)' : null,
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => 'var(--border)',
        vLineColor: () => 'var(--border)',
                        paddingLeft: () => 8,
                        paddingRight: () => 8,
                        paddingTop: () => 4,
                        paddingBottom: () => 4,
                    },
                    alignment: 'center',
                    margin: [0, 0, 0, 12]
                } : {},
                debtReport.payables.length > 0 ? {
                    text: 'Кредиторская задолженность (кому должен я)', style: 'tableHeader', alignment: 'center', margin: [0, 6, 0, 2]
                } : {},
                debtReport.payables.length > 0 ? {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto'],
                        body: [
                            [
                                { text: 'Контрагент', style: 'tableHeader', alignment: 'center' },
                                { text: 'Сумма', style: 'tableHeader', alignment: 'center' }
                            ],
                            ...debtReport.payables.map(d => [d.counterparty, format(d.amount)])
                        ]
                    },
                    layout: {
                        fillColor: (row: number) => row === 0 ? 'hsl(var(--surface-accent))' : null,
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => 'var(--border)',
                        vLineColor: () => 'var(--border)',
                        paddingLeft: () => 8,
                        paddingRight: () => 8,
                        paddingTop: () => 4,
                        paddingBottom: () => 4,
                    },
                    alignment: 'center',
                    margin: [0, 0, 0, 12]
                } : {},
                { text: 'Пояснения', style: 'sectionHeader', margin: [0, 0, 0, 8] },
                {
                    ul: explanations.map(e => ({ text: e, margin: [0, 0, 0, 2], color: 'hsl(var(--muted-foreground))' }))
                },
            ],
            styles: {
                header: { fontSize: 16, bold: true, lineHeight: 1.5, margin: [0, 0, 0, 12] },
                subheader: { fontSize: 13, bold: true, lineHeight: 1.5, margin: [0, 0, 0, 12] },
                sectionHeader: { fontSize: 12, bold: true, color: 'hsl(var(--primary))', lineHeight: 1.5, margin: [0, 18, 0, 6] },
        tableHeader: { fontSize: 11, bold: true, color: 'hsl(var(--primary))', lineHeight: 1.2 },
        meta: { fontSize: 10, italics: true, color: 'hsl(var(--muted-foreground))', lineHeight: 1.2 },
                paragraph: { fontSize: 11, lineHeight: 1.5, margin: [35, 0, 0, 6] }, // абзацный отступ 35pt
            },
            defaultStyle: {
                font: 'Roboto',
                fontSize: 11,
                lineHeight: 1.5
            }
        };
        pdfMake.createPdf(docDefinition).download('FinSights_Full_Report.pdf');
        await subscriptionService.incrementReportDownloads(currentUserId);
    };

    const handleExportToExcel = async () => {
        const currentUserId = userId ?? email;
        if (!currentUserId) {
            subscriptionService.showUpgradeModal('Войдите, чтобы экспортировать данные');
            return;
        }
        
        const exportLimit = subscriptionService.checkDashboardExportLimit();
        if (!exportLimit.allowed) {
            subscriptionService.showUpgradeModal(exportLimit.reason || 'Лимит экспорта дашборда достигнут');
            return;
        }

        try {
            const { pnl, cashFlow, counterpartyReport } = report;
            
            const exportData = {
                financialReport: {
                    totalRevenue: pnl.totalRevenue,
                    totalExpenses: pnl.totalOperatingExpenses,
                    netProfit: pnl.netProfit,
                    monthlyData: pnl.monthlyData
                },
                cashFlow: {
                    operatingActivities: cashFlow.operatingActivities,
                    investingActivities: cashFlow.investingActivities,
                    financingActivities: cashFlow.financingActivities,
                    netCashFlow: cashFlow.netCashFlow,
                    monthlyData: cashFlow.monthlyData
                },
                counterparties: counterpartyReport,
                transactions: transactions
            };

            const response = await fetch('/api/export/excel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(exportData)
            });

            if (!response.ok) {
                throw new Error('Ошибка при создании Excel файла');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `FinSights_Dashboard_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            await subscriptionService.incrementDashboardExports(currentUserId);
        } catch (error) {
            console.error('Ошибка экспорта в Excel:', error);
            alert('Произошла ошибка при экспорте в Excel');
        }
    };

    const handleExportToCSV = async () => {
        const currentUserId = userId ?? email;
        if (!currentUserId) {
            subscriptionService.showUpgradeModal('Войдите, чтобы экспортировать данные');
            return;
        }
        
        const exportLimit = subscriptionService.checkDashboardExportLimit();
        if (!exportLimit.allowed) {
            subscriptionService.showUpgradeModal(exportLimit.reason || 'Лимит экспорта дашборда достигнут');
            return;
        }

        try {
            const csvData = transactions.map(t => ({
                Дата: t.date,
                Описание: t.description,
                Категория: t.category,
                Сумма: t.amount,
                Тип: t.type === 'income' ? 'Доход' : 'Расход',
                Контрагент: t.counterparty || ''
            }));

            const headers = Object.keys(csvData[0] || {});
            const csvContent = [
                headers.join(','),
                ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `FinSights_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            await subscriptionService.incrementDashboardExports(currentUserId);
        } catch (error) {
            console.error('Ошибка экспорта в CSV:', error);
            alert('Произошла ошибка при экспорте в CSV');
        }
    };

    const PnlView = () => (
        <div className="space-y-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 grid-ultra-compact">
                <StatCard 
                title="Выручка" 
                value={pnl.totalRevenue} 
                variant="default"
                trend="up"
                subtitle="Общий доход"
              />
              <StatCard 
                title="Операционные Расходы" 
                value={-pnl.totalOperatingExpenses} 
                variant="default"
                trend="down"
                subtitle="Операционные затраты"
              />
              <StatCard 
                title="Амортизация" 
                value={-pnl.depreciation} 
                isCurrency={true} 
                variant="default"
                trend="neutral"
                subtitle="Износ активов"
              />
              <StatCard 
                title="Чистая Прибыль" 
                value={pnl.netProfit} 
                variant="default"
                trend={pnl.netProfit > 0 ? "up" : "down"}
                subtitle="Итоговый результат"
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">
                <div className="lg:col-span-3" ref={pnlChartRef}>
                    <ChartCard
                        title={<span className="text-primary">Отчет о прибылях и убытках</span>}
                        data={aggregatedChartData.pnlData}
                        series={[
                            { key: 'Доход', type: 'area', color: chartColors.revenue },
                            { key: 'Расход', type: 'area', color: chartColors.expense },
                            { key: 'Прибыль', type: 'line', color: chartColors.profit },
                        ]}
                    />
                </div>
                <div className="lg:col-span-2" ref={categoryChartRef}>
                    <CategoryChartCard data={pnl.expenseByCategory} title="Структура расходов" />
                </div>
            </div>
        </div>
    );

    const CashflowView = () => {
        return (
            <div className="space-y-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <StatCard 
                title="Денежный поток от операций" 
                value={cashFlow.operatingActivities} 
                variant="default"
                trend={cashFlow.operatingActivities > 0 ? "up" : "down"}
                subtitle="Операционная деятельность"
              />
              <StatCard 
                title="Денежный поток от инвестиций" 
                value={cashFlow.investingActivities} 
                variant="default"
                trend={cashFlow.investingActivities > 0 ? "up" : "down"}
                subtitle="Инвестиционная деятельность"
              />
              <StatCard 
                title="Денежный поток от финансов" 
                value={cashFlow.financingActivities} 
                variant="default"
                trend={cashFlow.financingActivities > 0 ? "up" : "down"}
                subtitle="Финансовая деятельность"
              />
              <StatCard 
                title="Чистый денежный поток" 
                value={cashFlow.netCashFlow} 
                variant="default"
                trend={cashFlow.netCashFlow > 0 ? "up" : "down"}
                subtitle="Общий денежный поток"
              />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">
                    <div className="lg:col-span-3" ref={cashflowChartRef}>
                        <ChartCard
                            title="Движение денежных средств (ДДС)"
                            data={aggregatedChartData.cashFlowData}
                            series={[
                                { key: 'Поступления', type: 'area', color: chartColors.revenue },
                                { key: 'Выбытия', type: 'area', color: chartColors.expense },
                                { key: 'Чистый поток', type: 'line', color: chartColors.profit },
                            ]}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <div 
                            className="relative group bg-chart-card backdrop-blur-xl border border-border rounded-2xl p-4 shadow-lg h-full flex flex-col cursor-pointer"
                            onClick={() => setIsCashflowModalOpen(true)}
                        >
                            <div className="absolute -inset-0.5 bg-primary/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-foreground">Структура денежного потока</h3>
                                    <button 
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={(e) => { e.stopPropagation(); setIsCashflowModalOpen(true); }}
                                        title="Развернуть"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={300}>
                                        <BarChart data={[{name: 'Операции', value: cashFlow.operatingActivities}, {name: 'Инвестиции', value: cashFlow.investingActivities}, {name: 'Финансы', value: cashFlow.financingActivities}, {name: 'Итого', value: cashFlow.netCashFlow}]}
                                            margin={{ top: 10, right: 5, left: -10, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-line-grid)" opacity={0.4} />
                <XAxis dataKey="name" stroke="var(--chart-line-axis)" tick={{ fontSize: 12, fill: 'var(--chart-line-axis)' }} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--chart-line-axis)" tick={{ fontSize: 12, fill: 'var(--chart-line-axis)' }} tickLine={false} axisLine={false} width={60} domain={[0, 'dataMax']} />
                <Tooltip cursor={{ fill: 'var(--muted)', opacity: 0.08 }} formatter={(v:number)=> formatCurrencyUtil(Number(v), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                                            <Bar dataKey="value" radius={[8,8,8,8]} isAnimationActive={false}>
                                                {['Операции','Инвестиции','Финансы','Итого'].map((name, idx) => (
                                                    <Cell key={idx} fill={name==='Итого' ? 'var(--primary)' : name==='Операции' ? 'var(--success)' : name==='Инвестиции' ? 'var(--warning)' : 'var(--chart-4)'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                        {isCashflowModalOpen && createPortal(
                            <div className="fixed inset-0 bg-card/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setIsCashflowModalOpen(false)}>
                                <div className="bg-chart-card border border-border p-6 rounded-xl w-[95vw] h-[95vh] max-w-7xl max-h-[95vh] relative flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                    <div className="mb-4 pr-12">
                                        <h3 className="text-2xl font-bold text-foreground">Структура денежного потока</h3>
                                        <button 
                                            className="absolute top-4 right-4 z-[70] w-9 h-9 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-2xl font-bold transition-colors duration-200"
                                            onClick={() => setIsCashflowModalOpen(false)}
                                            title="Закрыть"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <div className="flex-1">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={400} minHeight={400}>
                                            <BarChart data={[{name: 'Операции', value: cashFlow.operatingActivities}, {name: 'Инвестиции', value: cashFlow.investingActivities}, {name: 'Финансы', value: cashFlow.financingActivities}, {name: 'Итого', value: cashFlow.netCashFlow}]}
                                                margin={{ top: 20, right: 30, left: 0, bottom: 40 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-line-grid)" opacity={0.4} />
                                                <XAxis dataKey="name" stroke="var(--chart-line-axis)" tick={{ fontSize: 14, fill: 'var(--chart-line-axis)' }} tickLine={false} axisLine={false} tickMargin={15} />
                                                <YAxis stroke="var(--chart-line-axis)" tick={{ fontSize: 14, fill: 'var(--chart-line-axis)' }} tickLine={false} axisLine={false} width={80} domain={[0, 'dataMax']} />
                                                <Tooltip cursor={{ fill: 'var(--muted) / 0.1' }} formatter={(v:number)=> formatCurrencyUtil(Number(v), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                                                <Bar dataKey="value" radius={[10,10,10,10]} isAnimationActive={false}>
                                                    {['Операции','Инвестиции','Финансы','Итого'].map((name, idx) => (
                                                        <Cell key={idx} fill={name==='Итого' ? 'var(--primary)' : name==='Операции' ? 'var(--success)' : name==='Инвестиции' ? 'var(--chart-3)' : 'var(--chart-4)'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        , document.body)}
                    </div>
                </div>
                <FinancialStatementCard title="Итоговый ДДС">
                    <FinancialStatementCard.Section>
                        <FinancialStatementCard.Row label="От операционной деятельности" value={cashFlow.operatingActivities} />
                        <FinancialStatementCard.Row label="От инвестиционной деятельности" value={cashFlow.investingActivities} />
                        <FinancialStatementCard.Row label="От финансовой деятельности" value={cashFlow.financingActivities} />
                    </FinancialStatementCard.Section>
                    <FinancialStatementCard.Total label="Чистое изменение ден. средств" value={cashFlow.netCashFlow} />
                </FinancialStatementCard>
            </div>
        );
    };

    const BalanceView = () => {
        return (
            <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <FinancialStatementCard title="Активы">
                        <FinancialStatementCard.Section>
                            <FinancialStatementCard.Row label="Денежные средства" value={balanceSheet.assets.cash} />
                            <FinancialStatementCard.Row label="Дебиторская задолженность" value={balanceSheet.assets.receivables} />
                            <FinancialStatementCard.SubSection title="Основные средства">
                                <FinancialStatementCard.Row label="Первоначальная стоимость" value={balanceSheet.assets.equipment} />
                                <FinancialStatementCard.Row label="Накопленная амортизация" value={-balanceSheet.assets.accumulatedDepreciation} />
                                <FinancialStatementCard.SubTotal label="Чистая стоимость ОС" value={balanceSheet.assets.netEquipment} />
                            </FinancialStatementCard.SubSection>
                        </FinancialStatementCard.Section>
                        <FinancialStatementCard.Total label="Итого активы" value={balanceSheet.assets.totalAssets} />
                    </FinancialStatementCard>
                    <FinancialStatementCard title="Капитал и Обязательства">
                        <FinancialStatementCard.Section title="Обязательства">
                            <FinancialStatementCard.Row label="Кредиторская задолженность" value={balanceSheet.liabilities.payables} />
                            <FinancialStatementCard.Total label="Итого обязательства" value={balanceSheet.liabilities.totalLiabilities} />
                        </FinancialStatementCard.Section>
                        <FinancialStatementCard.Section title="Капитал">
                            <FinancialStatementCard.Row label="Нераспределенная прибыль" value={balanceSheet.equity.retainedEarnings} />
                            <FinancialStatementCard.Total label="Итого капитал" value={balanceSheet.equity.totalEquity} />
                        </FinancialStatementCard.Section>
                        <FinancialStatementCard.Total label="Итого капитал и обязательства" value={balanceSheet.totalLiabilitiesAndEquity} />
                    </FinancialStatementCard>
                </div>
                <div>
                    <div 
                        className="relative group bg-chart-card backdrop-blur-xl border border-border rounded-2xl p-4 shadow-lg h-full flex flex-col cursor-pointer"
                        onClick={() => setIsBalanceModalOpen(true)}
                    >
                        <div className="absolute -inset-0.5 bg-primary/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-foreground">Структура баланса</h3>
                                <button 
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={(e) => { e.stopPropagation(); setIsBalanceModalOpen(true); }}
                                    title="Развернуть"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={300}>
                                    <BarChart data={[
                                        {name: 'Активы', value: balanceSheet.assets.totalAssets},
                                        {name: 'Обязательства', value: balanceSheet.liabilities.totalLiabilities},
                                        {name: 'Капитал', value: balanceSheet.equity.totalEquity},
                                        {name: 'Итого', value: balanceSheet.totalLiabilitiesAndEquity}
                                    ]} margin={{ top: 10, right: 5, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-line-grid)" opacity={0.4} />
                                        <XAxis dataKey="name" stroke="var(--chart-line-axis)" tick={{ fontSize: 12, fill: 'var(--chart-line-axis)' }} tickLine={false} axisLine={false} />
                                        <YAxis stroke="var(--chart-line-axis)" tick={{ fontSize: 12, fill: 'var(--chart-line-axis)' }} tickLine={false} axisLine={false} width={60} domain={[0, 'dataMax']} />
                                        <Tooltip cursor={{ fill: 'var(--muted) / 0.1' }} formatter={(v:number)=> formatCurrencyUtil(Number(v), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                                        <Bar dataKey="value" radius={[8,8,8,8]} isAnimationActive={false}>
                                            {['Активы','Обязательства','Капитал','Итого'].map((name, idx) => (
                                                <Cell key={idx} fill={name==='Итого' ? 'var(--primary)' : name==='Активы' ? 'var(--success)' : name==='Обязательства' ? 'var(--destructive)' : 'var(--primary)'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    {isBalanceModalOpen && createPortal(
                        <div className="fixed inset-0 bg-card/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setIsBalanceModalOpen(false)}>
                            <div className="bg-chart-card border border-border p-6 rounded-xl w-[95vw] h-[95vh] max-w-7xl max-h-[95vh] relative flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                <div className="mb-4 pr-12">
                                    <h3 className="text-2xl font-bold text-foreground">Структура баланса</h3>
                                    <button 
                                        className="absolute top-4 right-4 z-[70] w-9 h-9 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-2xl font-bold transition-colors duration-200"
                                        onClick={() => setIsBalanceModalOpen(false)}
                                        title="Закрыть"
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={400} minHeight={400}>
                                        <BarChart data={[
                                            {name: 'Активы', value: balanceSheet.assets.totalAssets},
                                            {name: 'Обязательства', value: balanceSheet.liabilities.totalLiabilities},
                                            {name: 'Капитал', value: balanceSheet.equity.totalEquity},
                                            {name: 'Итого', value: balanceSheet.totalLiabilitiesAndEquity}
                                        ]} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-line-grid)" opacity={0.4} />
                                            <XAxis dataKey="name" stroke="var(--chart-line-axis)" tick={{ fontSize: 14, fill: 'var(--chart-line-axis)' }} tickLine={false} axisLine={false} tickMargin={15} />
                                            <YAxis stroke="var(--chart-line-axis)" tick={{ fontSize: 14, fill: 'var(--chart-line-axis)' }} tickLine={false} axisLine={false} width={80} domain={[0, 'dataMax']} />
                                            <Tooltip cursor={{ fill: 'hsl(var(--muted) / 0.1)' }} formatter={(v:number)=> new Intl.NumberFormat('ru-RU', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v as number) + ' KZT'} />
                                            <Bar dataKey="value" radius={[10,10,10,10]} isAnimationActive={false}>
                                                {['Активы','Обязательства','Капитал','Итого'].map((name, idx) => (
                                                    <Cell key={idx} fill={name==='Итого' ? 'hsl(var(--primary))' : name==='Активы' ? 'hsl(var(--success))' : name==='Обязательства' ? 'hsl(var(--destructive))' : 'hsl(var(--chart-1))'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    , document.body)}
                </div>
            </div>
        );
    };

    const CounterpartyView = () => {
        const [sortConfig, setSortConfig] = useState<{ key: keyof CounterpartyData; direction: 'asc' | 'desc' } | null>({ key: 'balance', direction: 'desc' });

        const sortedData = useMemo(() => {
            if (!counterpartyReport) return [];
            const sortableItems = [...counterpartyReport];
            if (sortConfig !== null) {
                sortableItems.sort((a, b) => {
                    if (a[sortConfig.key] < b[sortConfig.key]) {
                        return sortConfig.direction === 'asc' ? -1 : 1;
                    }
                    if (a[sortConfig.key] > b[sortConfig.key]) {
                        return sortConfig.direction === 'asc' ? 1 : -1;
                    }
                    return 0;
                });
            }
            return sortableItems;
        }, [counterpartyReport, sortConfig]);

        const requestSort = (key: keyof CounterpartyData) => {
            let direction: 'asc' | 'desc' = 'asc';
            if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
                direction = 'desc';
            }
            setSortConfig({ key, direction });
        };

        const getSortIndicator = (key: keyof CounterpartyData) => {
            if (!sortConfig || sortConfig.key !== key) {
                return '↕';
            }
            return sortConfig.direction === 'asc' ? '↑' : '↓';
        };

        const topClient = useMemo(() => counterpartyReport.reduce((max, p) => p.income > max.income ? p : max, { name: 'N/A', income: -1, expense: 0, balance: 0 }), [counterpartyReport]);
        const topSupplier = useMemo(() => counterpartyReport.reduce((max, p) => p.expense > max.expense ? p : max, { name: 'N/A', expense: -1, income: 0, balance: 0 }), [counterpartyReport]);

        return (
            <div className="space-y-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16">
                    <StatCard 
                title="Всего контрагентов" 
                value={counterpartyReport.length} 
                isCurrency={false} 
                variant="compact"
                trend="neutral"
                subtitle="Общее количество"
              />
              <StatCard 
                title="Клиентов (с доходом)" 
                value={counterpartyReport.filter(c => c.income > 0).length} 
                isCurrency={false} 
                variant="compact"
                trend="up"
                subtitle="Активные клиенты"
              />
              <StatCard 
                title="Топ клиент" 
                value={topClient.income} 
                isCurrency={true} 
                variant="compact"
                trend="up"
                subtitle={topClient.name}
              />
              <StatCard 
                title="Топ поставщик" 
                value={-topSupplier.expense} 
                isCurrency={true} 
                variant="compact"
                trend="down"
                subtitle={topSupplier.name}
              />
                </div>
                <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-full">
                            <thead className="bg-card">
                                <tr>
                                    <th className="p-4 cursor-pointer whitespace-nowrap text-muted-foreground" onClick={() => requestSort('name')}>Контрагент {getSortIndicator('name')}</th>
                                    <th className="p-4 cursor-pointer whitespace-nowrap text-right text-muted-foreground" onClick={() => requestSort('income')}>Доход {getSortIndicator('income')}</th>
                                    <th className="p-4 cursor-pointer whitespace-nowrap text-right text-muted-foreground" onClick={() => requestSort('expense')}>Расход {getSortIndicator('expense')}</th>
                                    <th className="p-4 cursor-pointer whitespace-nowrap text-right text-muted-foreground" onClick={() => requestSort('balance')}>Баланс {getSortIndicator('balance')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedData.map((c) => (
                                    <tr key={c.name} className="border-t border-border transition-colors hover:bg-card/50">
                                        <td className="p-4 text-foreground font-medium max-w-[200px]">
                                            <div className="truncate" title={c.name}>{c.name}</div>
                                        </td>
                                        <td className="p-4 text-right font-mono whitespace-nowrap text-success-foreground">{formatCurrency(c.income)}</td>
                <td className="p-4 text-right font-mono whitespace-nowrap text-destructive-foreground">{formatCurrency(-c.expense)}</td>
                <td className={`p-4 text-right font-mono whitespace-nowrap font-semibold ${c.balance >= 0 ? 'text-success-foreground' : 'text-destructive-foreground'}`}>{formatCurrency(c.balance)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    const DebtsView = () => (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">Управление долгами</h2>
                {onAddTransaction && (
                    <button
                        onClick={() => setIsCreateDebtModalOpen(true)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Создать обязательство
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                title="Дебиторская задолженность" 
                value={debtReport.totalReceivables} 
                variant="default"
                trend={debtReport.totalReceivables > 0 ? "up" : "neutral"}
                subtitle="Кто должен мне"
              />
              <StatCard 
                title="Кредиторская задолженность" 
                value={-debtReport.totalPayables} 
                variant="default"
                trend={debtReport.totalPayables > 0 ? "down" : "neutral"}
                subtitle="Кому должен я"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-lg">
                    <h3 className="text-xl font-bold text-foreground p-4">Кто должен мне</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-full">
                            <thead className="bg-card">
                                <tr>
                                    <th className="px-4 py-3 whitespace-nowrap text-muted-foreground">Контрагент</th>
                <th className="px-4 py-3 whitespace-nowrap text-right text-muted-foreground">Сумма</th>
                {onAddTransaction && <th className="px-4 py-3 whitespace-nowrap text-center text-muted-foreground">Действия</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {debtReport.receivables.map((d) => (
                                    <tr key={d.counterparty} className="border-t border-border transition-colors hover:bg-card/50">
                                        <td className="px-4 py-3 whitespace-nowrap text-foreground font-medium">{d.counterparty}</td>
                                        <td className="px-4 py-3 text-right font-mono whitespace-nowrap text-success-foreground">{formatCurrency(d.amount)}</td>
                                        {onAddTransaction && (
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleRepayDebt(d.counterparty, d.amount, true)}
                                                    className="px-3 py-1 bg-success text-success-foreground rounded hover:bg-success/90 transition-colors text-sm"
                                                    title="Погасить долг"
                                                >
                                                    Погасить
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {debtReport.receivables.length === 0 && (
                                    <tr className="border-t border-border">
                                        <td colSpan={onAddTransaction ? 3 : 2} className="px-4 py-3 text-center text-muted-foreground">Нет данных</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-lg">
                    <h3 className="text-xl font-bold text-foreground p-4">Кому должен я</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-full">
                            <thead className="bg-card">
                                <tr>
                                    <th className="px-4 py-3 whitespace-nowrap text-muted-foreground">Контрагент</th>
                                    <th className="px-4 py-3 whitespace-nowrap text-right text-muted-foreground">Сумма</th>
                                    {onAddTransaction && <th className="px-4 py-3 whitespace-nowrap text-center text-muted-foreground">Действия</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {debtReport.payables.map((d) => (
                                    <tr key={d.counterparty} className="border-t border-border transition-colors hover:bg-card/50">
                                        <td className="px-4 py-3 whitespace-nowrap text-foreground font-medium">{d.counterparty}</td>
                                        <td className="px-4 py-3 text-right font-mono whitespace-nowrap text-destructive-foreground">{formatCurrency(-d.amount)}</td>
                                        {onAddTransaction && (
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleRepayDebt(d.counterparty, d.amount, false)}
                                                    className="px-3 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors text-sm"
                                                    title="Погасить кредит"
                                                >
                                                    Погасить
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {debtReport.payables.length === 0 && (
                                    <tr className="border-t border-border">
                                        <td colSpan={onAddTransaction ? 3 : 2} className="px-4 py-3 text-center text-muted-foreground">Нет данных</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );


    const ForecastView = () => {
        const forecastStats = useMemo(() => {
            if (!forecastData || !forecastData.monthlyForecast) return null;
            const totalForecastRevenue = forecastData.monthlyForecast.reduce((sum, item) => sum + item.forecastRevenue, 0);
            const totalForecastProfit = forecastData.monthlyForecast.reduce((sum, item) => sum + item.forecastProfit, 0);
            return { totalForecastRevenue, totalForecastProfit };
        }, [forecastData]);

        const combinedChartData = useMemo(() => {
            if (!forecastData || !forecastData.monthlyForecast) return [];
            const historicalPart = pnl.monthlyData.map(d => ({
                label: d.month,
                'Доход': d['Доход'],
                'Расход': d['Расход'],
                'Прибыль': d['Прибыль'],
            }));

            const forecastPart = forecastData.monthlyForecast.map(d => ({
                label: d.month,
                'Прогнозируемый доход': d.forecastRevenue,
                'Прогнозируемые расходы': d.forecastExpenses,
                'Прогнозируемая прибыль': d.forecastProfit,
            }));

            return [...historicalPart, ...forecastPart];

        }, [pnl.monthlyData, forecastData]);

        if (isForecasting) {
            return (
                <div className="flex justify-center items-center h-96">
                    <Loader message="AI анализирует ваши данные и строит прогноз..." />
                </div>
            );
        }

        if (forecastError) {
            return (
                <div className="text-center p-10 bg-destructive/10 border border-destructive/20 rounded-xl">
              <h3 className="text-xl font-bold text-destructive-foreground">Ошибка</h3>
              <p className="text-destructive-foreground/80 mt-2">{forecastError}</p>
                    <button onClick={handleGenerateForecast} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Попробовать снова</button>
                </div>
            )
        }

        if (!forecastData || !forecastStats) {
            return (
                <div className="text-center p-10 bg-card border border-dashed border-border rounded-xl">
                    <h3 className="text-2xl font-bold text-foreground">Готовы заглянуть в будущее?</h3>
                    <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Нажмите кнопку ниже, чтобы наш ИИ проанализировал ваши исторические данные и построил финансовый прогноз на следующие 6 месяцев.</p>
                    <button
                        onClick={handleGenerateForecast}
                        disabled={isForecasting}
                        className="mt-6 inline-flex items-center gap-2 mx-auto px-6 py-3 text-lg font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary-hover transition-colors disabled:bg-muted shadow-lg"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m6.364-2.364l-.707.707M4.343 17.657l-.707.707M21 12h-1M4 12H3m16.364-4.364l-.707-.707M4.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        <span>Сгенерировать прогноз</span>
                    </button>
                </div>
            );
        }

        return (
            <div className="dashboard-section">
                <div className="dashboard-grid grid-cols-1 md:grid-cols-3">
                    <StatCard 
                        title="Прогнозируемая выручка (6 мес.)" 
                        value={forecastStats.totalForecastRevenue}
                        variant="ultra-compact"
                        change={12.5}
                        changeType="percentage"
                    />
                    <StatCard 
                        title="Прогнозируемая прибыль (6 мес.)" 
                        value={forecastStats.totalForecastProfit}
                        variant="ultra-compact"
                        change={8.3}
                        changeType="percentage"
                    />
                    <StatCard 
                        title="Среднемес. прог. прибыль" 
                        value={forecastStats.totalForecastProfit / 6}
                        variant="ultra-compact"
                        change={-2.1}
                        changeType="percentage"
                    />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-3" ref={forecastChartRef}>
                        <ChartCard
                            title="Прогноз доходов и расходов"
                            data={combinedChartData}
                            series={[
                                { key: 'Доход', type: 'area', color: 'hsl(var(--color-success))' },
                                { key: 'Прогнозируемый доход', type: 'area', color: 'hsl(var(--color-success))', dashed: true },
                                { key: 'Расход', type: 'area', color: 'hsl(var(--color-destructive))' },
                                { key: 'Прогнозируемые расходы', type: 'area', color: 'hsl(var(--color-destructive))', dashed: true },
                                { key: 'Прибыль', type: 'line', color: 'hsl(var(--color-primary))' },
                                { key: 'Прогнозируемая прибыль', type: 'line', color: 'hsl(var(--color-primary))', dashed: true },
                            ]}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <FinancialStatementCard title="Анализ прогноза от ИИ">
                            <FinancialStatementCard.Section>
                                {typeof forecastData.summary === 'string'
                                    ? <p className="text-muted-foreground text-sm leading-relaxed">{forecastData.summary}</p>
                                    : Array.isArray(forecastData.summary)
                                        ? (forecastData.summary as any[]).map((item: any, i: number) => <p key={i}>{String(item)}</p>)
                                        : typeof forecastData.summary === 'object' && forecastData.summary !== null
                                            ? <ul className="text-muted-foreground text-sm leading-relaxed">
                                                {Object.entries(forecastData.summary).map(([key, value]) => (
                                                    <li key={key}><b>{key}:</b> {String(value)}</li>
                                                ))}
                                            </ul>
                                            : null
                                }
                            </FinancialStatementCard.Section>
                            <div className="pt-4 mt-4 border-t border-border">
                                <button onClick={handleGenerateForecast} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-foreground bg-primary/90 rounded-lg hover:bg-primary transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m6.364-2.364l-.707.707M4.343 17.657l-.707.707M21 12h-1M4 12H3m16.364-4.364l-.707-.707M4.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    Пересчитать прогноз
                                </button>
                            </div>
                        </FinancialStatementCard>
                    </div>
                </div>
            </div>
        );
    }

    const reportContainerStyle = (view: ReportView) => ({
        ...(activeReport !== view ? {
            visibility: 'hidden' as const,
            position: 'absolute' as const,
            top: '-9999px',
            left: '-9999px',
        } : {}),
    });

    const showGranularitySwitcher = activeReport === 'pnl' || activeReport === 'cashflow';

    return (
        <div className="min-h-screen bg-page-dashboard">
            <div className="max-w-7xl mx-auto space-y-16 p-16">
                {/* Header Section */}
                <div className="p-6 bg-card backdrop-blur-sm border border-border rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-8 animate-fade-in shadow-lg">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-primary rounded-xl shadow-lg border border-primary/30">
                            <svg className="w-16 h-16 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Финансовый Дашборд
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Комплексный анализ финансовых показателей
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex flex-wrap items-center gap-1 p-1 bg-card border border-border rounded-full shadow-md min-w-0">
                            {showGranularitySwitcher && (
                                <div className="flex items-center gap-1 min-w-0">
                                    <GranularitySwitcher activeGranularity={granularity} setGranularity={setGranularity} />
                                </div>
                            )}
                            <div className="flex items-center gap-1 min-w-0">
                                <ReportTabs activeReport={activeReport} setActiveReport={setActiveReport} />
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDownloadAdvancedReport}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg shadow-lg hover:bg-primary/90 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                aria-label="Скачать передовой PDF-отчет"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>PDF отчет</span>
                            </button>
                            
                            <button
                                onClick={handleExportToExcel}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-success-foreground bg-success rounded-lg shadow-lg hover:bg-success/90 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success"
                                aria-label="Экспорт в Excel"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Excel</span>
                            </button>
                            
                            <button
                                onClick={handleExportToCSV}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-foreground bg-secondary rounded-lg shadow-lg hover:bg-secondary/90 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                                aria-label="Экспорт в CSV"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>CSV</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Executive Summary with KPI Cards */}
                <div className="animate-slide-up">
                    <ExecutiveSummary kpi={kpi} />
                </div>


                
                {/* Main Content */}
                <div className="dashboard-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    {/* Render all views with smooth transitions */}
                    <div className={`transition-all duration-500 ${activeReport === 'pnl' ? 'opacity-100' : 'opacity-0 hidden'}`}><PnlView /></div>
                    <div className={`transition-all duration-500 ${activeReport === 'cashflow' ? 'opacity-100' : 'opacity-0 hidden'}`}><CashflowView /></div>
                    <div className={`transition-all duration-500 ${activeReport === 'balance' ? 'opacity-100' : 'opacity-0 hidden'}`}><BalanceView /></div>
                    <div className={`transition-all duration-500 ${activeReport === 'forecast' ? 'opacity-100' : 'opacity-0 hidden'}`}><ForecastView /></div>
                    <div className={`transition-all duration-500 ${activeReport === 'counterparties' ? 'opacity-100' : 'opacity-0 hidden'}`}><CounterpartyView /></div>
                    <div className={`transition-all duration-500 ${activeReport === 'debts' ? 'opacity-100' : 'opacity-0 hidden'}`}><DebtsView /></div>
                    <div className={`transition-all duration-500 ${activeReport === 'advanced' ? 'opacity-100' : 'opacity-0 hidden'}`}>
                        <AdvancedFinancialDashboard report={generateAdvancedFinancialReport(transactions)} />
                    </div>
                </div>
                
                {/* Explanations Section */}
                <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <ExplanationsSection />
                </div>
            </div>
            
            {/* Модальное окно создания обязательства */}
            <CreateDebtModal
                open={isCreateDebtModalOpen}
                onClose={() => setIsCreateDebtModalOpen(false)}
                onAdd={handleCreateDebt}
            />
        </div>
    );
};

function format(value: number) {
    return new Intl.NumberFormat('ru-RU').format(Math.round(value));
}

export default Dashboard;
