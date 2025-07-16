
import React, { useState, useMemo, useRef } from 'react';
// PDF and related imports are now dynamically imported in handleDownload
import { FinancialReport, ForecastData, Transaction, Granularity, BusinessProfile, CounterpartyData, Theme } from '../../types.ts';
import StatCard from './StatCard.tsx';
import ChartCard from './ChartCard.tsx';
import CategoryChartCard from './CategoryChartCard.tsx';
import FinancialStatementCard from './FinancialStatementCard.tsx';
import ReportTabs from './ReportTabs.tsx';
import GranularitySwitcher from './GranularitySwitcher.tsx';
// import { generateReportSummary, generateFinancialForecast } from '../services/geminiService.ts';
import Loader from './Loader.tsx';
// Добавляю декларации для pdfmake и vfs_fonts
// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore
import vfsFonts from 'pdfmake/build/vfs_fonts';
import html2canvas from 'html2canvas';
(pdfMake as any).vfs = (vfsFonts as any).vfs;

import WaterfallChart from './WaterfallChart.tsx';
import AdvancedFinancialDashboard from './AdvancedFinancialDashboard.tsx';
import { generateAdvancedFinancialReport } from '../../services/advancedFinancialService.ts';
import { generateAdvancedPdfReport } from '../../services/advancedPdfService';

interface DashboardProps {
    report: FinancialReport;
    dateRange: { start: string; end: string };
    transactions: Transaction[];
    profile: BusinessProfile | null;
    theme: Theme;
}

type ReportView = 'pnl' | 'cashflow' | 'balance' | 'forecast' | 'counterparties' | 'debts' | 'advanced';

const formatCurrency = (value: number) => new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';

const Dashboard: React.FC<DashboardProps> = ({ report, dateRange, transactions, profile, theme }) => {
    const { pnl, cashFlow, balanceSheet, counterpartyReport, debtReport } = report;
    const [activeReport, setActiveReport] = useState<ReportView>('pnl');
    const [forecastData, setForecastData] = useState<ForecastData | null>(null);
    const [isForecasting, setIsForecasting] = useState(false);
    const [forecastError, setForecastError] = useState<string | null>(null);
    const [granularity, setGranularity] = useState<Granularity>('month');
    
    // Используем theme для адаптации цветов графиков
    const chartColors = useMemo(() => {
        return theme === 'dark' 
            ? { 
                revenue: '#4ade80', // зеленый для темной темы
                expense: '#f87171', // красный для темной темы
                profit: '#60a5fa', // синий для темной темы
                background: '#1e293b' // темный фон
              }
            : {
                revenue: '#22c55e', // зеленый для светлой темы
                expense: '#ef4444', // красный для светлой темы
                profit: '#3b82f6', // синий для светлой темы
                background: '#ffffff' // светлый фон
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
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-900">Пояснения</h3>
                    <p className="text-slate-600 text-sm">Расшифровка финансовых терминов и показателей</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {explanations.map((explanation, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <p className="text-slate-700 text-sm leading-relaxed">{explanation}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    const ExecutiveSummary = () => (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Ключевые показатели</h2>
                <p className="text-slate-600">Основные финансовые метрики за выбранный период</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium opacity-90">Quick Ratio</h3>
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-3xl font-bold">{kpi.quickRatio.toFixed(2)}</div>
                    <div className="text-sm opacity-75 mt-1">
                        {kpi.quickRatio > 1 ? 'Отличная ликвидность' : 'Требует внимания'}
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium opacity-90">Current Ratio</h3>
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-3xl font-bold">{kpi.currentRatio.toFixed(2)}</div>
                    <div className="text-sm opacity-75 mt-1">
                        {kpi.currentRatio > 1 ? 'Стабильное покрытие' : 'Нужна оптимизация'}
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium opacity-90">Profit Margin</h3>
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-3xl font-bold">{kpi.profitMargin.toFixed(1)}%</div>
                    <div className="text-sm opacity-75 mt-1">
                        {kpi.profitMargin > 10 ? 'Высокая маржинальность' : 'Средняя рентабельность'}
                    </div>
                </div>
            </div>
            
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        kpi.profitDelta > 0 ? 'bg-green-100 text-green-600' : 
                        kpi.profitDelta < 0 ? 'bg-red-100 text-red-600' : 
                        'bg-gray-100 text-gray-600'
                    }`}>
                        {kpi.profitDelta > 0 ? '📈' : kpi.profitDelta < 0 ? '📉' : '📊'}
                    </div>
                    <div className="flex-1">
                        <div className={`text-lg font-semibold ${
                            kpi.profitDelta > 0 ? 'text-green-700' : 
                            kpi.profitDelta < 0 ? 'text-red-700' : 
                            'text-gray-700'
                        }`}>
                            {kpi.profitDelta > 0 ? 'Позитивная динамика' : 
                             kpi.profitDelta < 0 ? 'Требует внимания' : 
                             'Стабильные показатели'}
                        </div>
                        <div className="text-slate-600 text-sm mt-1">
                            {forecastData?.summary || 'Аналитика по итогам периода показывает текущие тренды развития бизнеса.'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

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
            const d = new Date(dateStr);
            if (gran === 'day') {
                return d.toISOString().split('T')[0];
            }
            // For week, get the date of the preceding Monday
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            const monday = new Date(d.setDate(diff));
            return monday.toISOString().split('T')[0];
        };

        const getLabel = (dateStr: string, gran: Granularity): string => {
            const d = new Date(dateStr);
            if (gran === 'day') return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
            if (gran === 'week') return `Нед. ${d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}`;
            return d.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
        };

        const summary: { [key: string]: { pnlRevenue: number, pnlOpEx: number, cashInflow: number, cashOutflow: number } } = {};

        transactions.forEach(tx => {
            const key = getGroupKey(tx.date, granularity);
            if (!summary[key]) {
                summary[key] = { pnlRevenue: 0, pnlOpEx: 0, cashInflow: 0, cashOutflow: 0 };
            }

            if (tx.type === 'income') {
                summary[key].cashInflow += tx.amount;
                if (tx.transactionType === 'operating') {
                    summary[key].pnlRevenue += tx.amount;
                }
            } else { // Expense
                summary[key].cashOutflow += tx.amount;
                if (tx.transactionType === 'operating' && !tx.isCapitalized) {
                    summary[key].pnlOpEx += tx.amount;
                }
            }
        });

        const sortedKeys = Object.keys(summary).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        // Note: Depreciation is not included in this granular view for simplicity.
        const pnlData = sortedKeys.map(key => ({
            label: getLabel(key, granularity),
            'Доход': summary[key].pnlRevenue,
            'Расход': summary[key].pnlOpEx,
            'Прибыль': summary[key].pnlRevenue - summary[key].pnlOpEx,
        }));

        const cashFlowData = sortedKeys.map(key => ({
            label: getLabel(key, granularity),
            'Поступления': summary[key].cashInflow,
            'Выбытия': summary[key].cashOutflow,
            'Чистый поток': summary[key].cashInflow - summary[key].cashOutflow,
        }));

        return { pnlData, cashFlowData };

    }, [transactions, granularity, report]);

    // Удалена функция getCanvasImage, так как она больше не используется

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
            console.log('Forecast API response:', data);
            // Если data — строка, пробуем распарсить как JSON
            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                    console.log('Parsed string data:', data);
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
        const canvas = await html2canvas(ref.current, { backgroundColor: '#fff', scale: 2 });
        return canvas.toDataURL('image/png');
    };



    const handleDownloadAdvancedReport = async () => {
        const advancedReport = generateAdvancedFinancialReport(transactions);
        const pdf = generateAdvancedPdfReport(advancedReport, profile?.businessName || 'Бизнес');
        pdf.download(`advanced-financial-report-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleDownloadFullReport = async () => {
        const { pnl, cashFlow, balanceSheet, counterpartyReport, debtReport } = report;
        const start = new Date(dateRange.start).toLocaleDateString('ru-RU');
        const end = new Date(dateRange.end).toLocaleDateString('ru-RU');
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
                fillColor: (row: number) => row === 0 ? '#f3f4f6' : null,
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => '#d1d5db',
                vLineColor: () => '#d1d5db',
                paddingLeft: () => 8,
                paddingRight: () => 8,
                paddingTop: () => 4,
                paddingBottom: () => 4,
            },
            alignment: 'center',
            margin: [0, 0, 0, 18]
        };
        const executiveSummarySection = [
            { text: 'Executive Summary', style: 'header', alignment: 'center', margin: [0, 0, 0, 12] },
            executiveSummaryTable,
            { text: kpi.profitDelta > 0 ? 'Чистая прибыль растет' : kpi.profitDelta < 0 ? 'Чистая прибыль снижается' : 'Без изменений', color: kpi.profitDelta > 0 ? 'green' : kpi.profitDelta < 0 ? 'red' : 'gray', alignment: 'center', margin: [0, 0, 0, 8] },
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
                { text: `Quick Ratio: ${kpi.quickRatio.toFixed(2)}`, color: kpi.quickRatio > 1 ? 'green' : 'red' },
                { text: `Current Ratio: ${kpi.currentRatio.toFixed(2)}`, color: kpi.currentRatio > 1 ? 'green' : 'red' },
                { text: `Profit Margin: ${kpi.profitMargin.toFixed(2)}%`, color: kpi.profitMargin > 0 ? 'green' : 'red' },
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
                        fillColor: (row: number) => row === 0 ? '#f3f4f6' : null,
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => '#d1d5db',
                        vLineColor: () => '#d1d5db',
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
                        fillColor: (row: number) => row === 0 ? '#f3f4f6' : null,
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => '#d1d5db',
                        vLineColor: () => '#d1d5db',
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
                        fillColor: (row: number) => row === 0 ? '#f3f4f6' : null,
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => '#d1d5db',
                        vLineColor: () => '#d1d5db',
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
                        fillColor: (row: number) => row === 0 ? '#f3f4f6' : null,
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => '#d1d5db',
                        vLineColor: () => '#d1d5db',
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
                        fillColor: (row: number) => row === 0 ? '#f3f4f6' : null,
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => '#d1d5db',
                        vLineColor: () => '#d1d5db',
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
                                        fillColor: (row: number) => row === 0 ? '#f3f4f6' : null,
                                        hLineWidth: () => 0.5,
                                        vLineWidth: () => 0.5,
                                        hLineColor: () => '#d1d5db',
                                        vLineColor: () => '#d1d5db',
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
                                        fillColor: (row: number) => row === 0 ? '#f3f4f6' : null,
                                        hLineWidth: () => 0.5,
                                        vLineWidth: () => 0.5,
                                        hLineColor: () => '#d1d5db',
                                        vLineColor: () => '#d1d5db',
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
                        fillColor: (row: number) => row === 0 ? '#f3f4f6' : null,
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => '#d1d5db',
                        vLineColor: () => '#d1d5db',
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
                        fillColor: (row: number) => row === 0 ? '#f3f4f6' : null,
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => '#d1d5db',
                        vLineColor: () => '#d1d5db',
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
                        fillColor: (row: number) => row === 0 ? '#f3f4f6' : null,
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => '#d1d5db',
                        vLineColor: () => '#d1d5db',
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
                    ul: explanations.map(e => ({ text: e, margin: [0, 0, 0, 2] }))
                },
            ],
            styles: {
                header: { fontSize: 16, bold: true, lineHeight: 1.5, margin: [0, 0, 0, 12] },
                subheader: { fontSize: 13, bold: true, lineHeight: 1.5, margin: [0, 0, 0, 12] },
                sectionHeader: { fontSize: 12, bold: true, color: '#2563eb', lineHeight: 1.5, margin: [0, 18, 0, 6] },
                tableHeader: { fontSize: 11, bold: true, color: '#2563eb', lineHeight: 1.2 },
                meta: { fontSize: 10, italics: true, color: '#555', lineHeight: 1.2 },
                paragraph: { fontSize: 11, lineHeight: 1.5, margin: [35, 0, 0, 6] }, // абзацный отступ 35pt
            },
            defaultStyle: {
                font: 'Roboto',
                fontSize: 11,
                lineHeight: 1.5
            }
        };
        pdfMake.createPdf(docDefinition).download('FinSights_Full_Report.pdf');
    };

    const PnlView = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Выручка" value={pnl.totalRevenue} />
                <StatCard title="Операционные Расходы" value={-pnl.totalOperatingExpenses} />
                <StatCard title="Амортизация" value={-pnl.depreciation} isCurrency={true} />
                <StatCard title="Чистая Прибыль" value={pnl.netProfit} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3" ref={pnlChartRef}>
                    <ChartCard
                        title="Отчет о прибылях и убытках (ОПиУ)"
                        data={aggregatedChartData.pnlData}
                        series={[
                            { key: 'Доход', type: 'area', color: chartColors.revenue },
                            { key: 'Расход', type: 'area', color: chartColors.expense },
                            { key: 'Прибыль', type: 'line', color: chartColors.profit },
                        ]}
                    />
                </div>
                <div className="lg:col-span-2" ref={categoryChartRef}>
                    <CategoryChartCard data={pnl.expenseByCategory} />
                </div>
            </div>
        </div>
    );

    const CashflowView = () => {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Денежный поток от операций" value={cashFlow.operatingActivities} />
                    <StatCard title="Денежный поток от инвестиций" value={cashFlow.investingActivities} />
                    <StatCard title="Денежный поток от финансов" value={cashFlow.financingActivities} />
                    <StatCard title="Чистый денежный поток" value={cashFlow.netCashFlow} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
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
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        <WaterfallChart data={[{name: 'Операции', value: cashFlow.operatingActivities}, {name: 'Инвестиции', value: cashFlow.investingActivities}, {name: 'Финансы', value: cashFlow.financingActivities}, {name: 'Итого', value: cashFlow.netCashFlow, isTotal: true}]} />
                        <FinancialStatementCard title="Итоговый ДДС">
                            <FinancialStatementCard.Section>
                                <FinancialStatementCard.Row label="От операционной деятельности" value={cashFlow.operatingActivities} />
                                <FinancialStatementCard.Row label="От инвестиционной деятельности" value={cashFlow.investingActivities} />
                                <FinancialStatementCard.Row label="От финансовой деятельности" value={cashFlow.financingActivities} />
                            </FinancialStatementCard.Section>
                            <FinancialStatementCard.Total label="Чистое изменение ден. средств" value={cashFlow.netCashFlow} />
                        </FinancialStatementCard>
                    </div>
                </div>
            </div>
        );
    };

    const BalanceView = () => {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    <WaterfallChart data={[{name: 'Активы', value: balanceSheet.assets.totalAssets}, {name: 'Обязательства', value: -balanceSheet.liabilities.totalLiabilities}, {name: 'Капитал', value: balanceSheet.equity.totalEquity}, {name: 'Итого', value: balanceSheet.totalLiabilitiesAndEquity, isTotal: true}]} />
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
            <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Всего контрагентов" value={counterpartyReport.length} isCurrency={false} />
                    <StatCard title="Клиентов (с доходом)" value={counterpartyReport.filter(c => c.income > 0).length} isCurrency={false} />
                    <StatCard title="Топ клиент" value={topClient.income} isCurrency={true} />
                    <StatCard title="Топ поставщик" value={-topSupplier.expense} isCurrency={true} />
                </div>
                <div className="bg-surface rounded-2xl overflow-hidden border border-border shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-full">
                            <thead className="bg-surface-accent">
                                <tr>
                                    <th className="p-4 cursor-pointer whitespace-nowrap text-text-secondary" onClick={() => requestSort('name')}>Контрагент {getSortIndicator('name')}</th>
                                    <th className="p-4 cursor-pointer whitespace-nowrap text-right text-text-secondary" onClick={() => requestSort('income')}>Доход {getSortIndicator('income')}</th>
                                    <th className="p-4 cursor-pointer whitespace-nowrap text-right text-text-secondary" onClick={() => requestSort('expense')}>Расход {getSortIndicator('expense')}</th>
                                    <th className="p-4 cursor-pointer whitespace-nowrap text-right text-text-secondary" onClick={() => requestSort('balance')}>Баланс {getSortIndicator('balance')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedData.map((c) => (
                                    <tr key={c.name} className="border-t border-border transition-colors hover:bg-surface-accent/50">
                                        <td className="p-4 whitespace-nowrap text-text-primary font-medium">{c.name}</td>
                                        <td className="p-4 text-right font-mono whitespace-nowrap text-success">{formatCurrency(c.income)}</td>
                                        <td className="p-4 text-right font-mono whitespace-nowrap text-destructive">{formatCurrency(-c.expense)}</td>
                                        <td className={`p-4 text-right font-mono whitespace-nowrap font-semibold ${c.balance >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(c.balance)}</td>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Дебиторская задолженность (кто должен мне)" value={debtReport.totalReceivables} />
                <StatCard title="Кредиторская задолженность (кому должен я)" value={-debtReport.totalPayables} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-surface rounded-2xl overflow-hidden border border-border shadow-lg">
                    <h3 className="text-xl font-bold text-text-primary p-6">Кто должен мне</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-full">
                            <thead className="bg-surface-accent">
                                <tr>
                                    <th className="p-4 whitespace-nowrap text-text-secondary">Контрагент</th>
                                    <th className="p-4 whitespace-nowrap text-right text-text-secondary">Сумма</th>
                                </tr>
                            </thead>
                            <tbody>
                                {debtReport.receivables.map((d) => (
                                    <tr key={d.counterparty} className="border-t border-border transition-colors hover:bg-surface-accent/50">
                                        <td className="p-4 whitespace-nowrap text-text-primary font-medium">{d.counterparty}</td>
                                        <td className="p-4 text-right font-mono whitespace-nowrap text-success">{formatCurrency(d.amount)}</td>
                                    </tr>
                                ))}
                                {debtReport.receivables.length === 0 && (
                                    <tr className="border-t border-border"><td colSpan={2} className="p-4 text-center text-text-secondary">Нет данных</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-surface rounded-2xl overflow-hidden border border-border shadow-lg">
                    <h3 className="text-xl font-bold text-text-primary p-6">Кому должен я</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-full">
                            <thead className="bg-surface-accent">
                                <tr>
                                    <th className="p-4 whitespace-nowrap text-text-secondary">Контрагент</th>
                                    <th className="p-4 whitespace-nowrap text-right text-text-secondary">Сумма</th>
                                </tr>
                            </thead>
                            <tbody>
                                {debtReport.payables.map((d) => (
                                    <tr key={d.counterparty} className="border-t border-border transition-colors hover:bg-surface-accent/50">
                                        <td className="p-4 whitespace-nowrap text-text-primary font-medium">{d.counterparty}</td>
                                        <td className="p-4 text-right font-mono whitespace-nowrap text-destructive">{formatCurrency(-d.amount)}</td>
                                    </tr>
                                ))}
                                {debtReport.payables.length === 0 && (
                                    <tr className="border-t border-border"><td colSpan={2} className="p-4 text-center text-text-secondary">Нет данных</td></tr>
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
                    <h3 className="text-xl font-bold text-destructive">Ошибка</h3>
                    <p className="text-destructive/80 mt-2">{forecastError}</p>
                    <button onClick={handleGenerateForecast} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Попробовать снова</button>
                </div>
            )
        }

        if (!forecastData || !forecastStats) {
            return (
                <div className="text-center p-10 bg-surface border border-dashed border-border rounded-xl">
                    <h3 className="text-2xl font-bold text-text-primary">Готовы заглянуть в будущее?</h3>
                    <p className="text-text-secondary mt-2 max-w-xl mx-auto">Нажмите кнопку ниже, чтобы наш ИИ проанализировал ваши исторические данные и построил финансовый прогноз на следующие 6 месяцев.</p>
                    <button
                        onClick={handleGenerateForecast}
                        disabled={isForecasting}
                        className="mt-6 inline-flex items-center gap-2 mx-auto px-6 py-3 text-lg font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary-hover transition-colors disabled:bg-gray-600 shadow-lg"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m6.364-2.364l-.707.707M4.343 17.657l-.707.707M21 12h-1M4 12H3m16.364-4.364l-.707-.707M4.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        <span>Сгенерировать прогноз</span>
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Прогнозируемая выручка (6 мес.)" value={forecastStats.totalForecastRevenue} />
                    <StatCard title="Прогнозируемая прибыль (6 мес.)" value={forecastStats.totalForecastProfit} />
                    <StatCard title="Среднемес. прог. прибыль" value={forecastStats.totalForecastProfit / 6} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
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
                                    ? <p className="text-text-secondary text-sm leading-relaxed">{forecastData.summary}</p>
                                    : Array.isArray(forecastData.summary)
                                        ? (forecastData.summary as any[]).map((item: any, i: number) => <p key={i}>{String(item)}</p>)
                                        : typeof forecastData.summary === 'object' && forecastData.summary !== null
                                            ? <ul className="text-text-secondary text-sm leading-relaxed">
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Финансовый Дашборд
                        </h1>
                        <p className="text-slate-600 mt-2">
                            Комплексный анализ финансовых показателей вашего бизнеса
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        {showGranularitySwitcher && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-white/50">
                                <GranularitySwitcher activeGranularity={granularity} setGranularity={setGranularity} />
                            </div>
                        )}
                        
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-white/50">
                            <ReportTabs activeReport={activeReport} setActiveReport={setActiveReport} />
                        </div>
                        
                        <button
                            onClick={handleDownloadAdvancedReport}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
                            aria-label="Скачать передовой PDF-отчет"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4 4m0 0l4-4m-4 4V4" />
                            </svg>
                            <span>Скачать отчет</span>
                        </button>
                    </div>
                </div>

                {/* Executive Summary */}
                <ExecutiveSummary />
                {/* Content Section */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
                    {/* Render all views to ensure refs are populated, but only show the active one */}
                    <div style={reportContainerStyle('pnl')}><PnlView /></div>
                    <div style={reportContainerStyle('cashflow')}><CashflowView /></div>
                    <div style={reportContainerStyle('balance')}><BalanceView /></div>
                    <div style={reportContainerStyle('forecast')}><ForecastView /></div>
                    <div style={reportContainerStyle('counterparties')}><CounterpartyView /></div>
                    <div style={reportContainerStyle('debts')}><DebtsView /></div>
                    <div style={reportContainerStyle('advanced')}>
                        <AdvancedFinancialDashboard report={generateAdvancedFinancialReport(transactions)} />
                    </div>
                </div>

                {/* Explanations Section */}
                <ExplanationsSection />
            </div>
        </div>
    );
};

function format(value: number) {
    return new Intl.NumberFormat('ru-RU').format(Math.round(value));
}

export default Dashboard;
