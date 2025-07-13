
import React, { useState, useMemo, useRef } from 'react';
// PDF and related imports are now dynamically imported in handleDownload
import { FinancialReport, ForecastData, Transaction, Granularity, BusinessProfile, CounterpartyData } from '../../types.ts';
import StatCard from './StatCard.tsx';
import ChartCard from './ChartCard.tsx';
import CategoryChartCard from './CategoryChartCard.tsx';
import FinancialStatementCard from './FinancialStatementCard.tsx';
import ReportTabs from './ReportTabs.tsx';
import GranularitySwitcher from './GranularitySwitcher.tsx';
import { DownloadIcon, LightbulbIcon } from './icons.tsx';
// import { generateReportSummary, generateFinancialForecast } from '../services/geminiService.ts';
import Loader from './Loader.tsx';
// Добавляю декларации для pdfmake и vfs_fonts
// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore
import vfsFonts from 'pdfmake/build/vfs_fonts';
import html2canvas from 'html2canvas';
(pdfMake as any).vfs = (vfsFonts as any).vfs;

interface DashboardProps {
    report: FinancialReport;
    dateRange: { start: string; end: string };
    transactions: Transaction[];
    profile: BusinessProfile | null;
}

type ReportView = 'pnl' | 'cashflow' | 'balance' | 'forecast' | 'counterparties' | 'debts';

const formatCurrency = (value: number) => new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';

const Dashboard: React.FC<DashboardProps> = ({ report, dateRange, transactions, profile }) => {
    const { pnl, cashFlow, balanceSheet, counterpartyReport, debtReport } = report;
    const [activeReport, setActiveReport] = useState<ReportView>('pnl');
    const [forecastData, setForecastData] = useState<ForecastData | null>(null);
    const [isForecasting, setIsForecasting] = useState(false);
    const [forecastError, setForecastError] = useState<string | null>(null);
    const [granularity, setGranularity] = useState<Granularity>('month');

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
            const data = await response.json();
            setForecastData(data);
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

        // ГОСТ-поля: левое 85, верх/низ 57, правое 28 (в pt)
        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [85, 57, 28, 57],
            content: [
                { text: 'Финансовый отчет', style: 'header', alignment: 'center', margin: [0, 0, 0, 12] },
                profile?.businessName ? { text: profile.businessName, style: 'subheader', alignment: 'center', margin: [0, 0, 0, 12] } : {},
                { text: `Период: с ${start} по ${end}`, alignment: 'center', style: 'meta', margin: [0, 0, 0, 6] },
                { text: `Дата формирования: ${now}`, alignment: 'center', style: 'meta', margin: [0, 0, 0, 18] },
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                            { key: 'Доход', type: 'area', color: 'hsl(var(--color-success))' },
                            { key: 'Расход', type: 'area', color: 'hsl(var(--color-destructive))' },
                            { key: 'Прибыль', type: 'line', color: 'hsl(var(--color-primary))' },
                        ]}
                    />
                </div>
                <div className="lg:col-span-2" ref={categoryChartRef}>
                    <CategoryChartCard data={pnl.expenseByCategory} />
                </div>
            </div>
        </div>
    );

    const CashflowView = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Денежный поток от операций" value={cashFlow.operatingActivities} />
                <StatCard title="Денежный поток от инвестиций" value={cashFlow.investingActivities} />
                <StatCard title="Денежный поток от финансов" value={cashFlow.financingActivities} />
                <StatCard title="Чистый денежный поток" value={cashFlow.netCashFlow} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3" ref={cashflowChartRef}>
                    <ChartCard
                        title="Движение денежных средств (ДДС)"
                        data={aggregatedChartData.cashFlowData}
                        series={[
                            { key: 'Поступления', type: 'area', color: 'hsl(var(--color-success))' },
                            { key: 'Выбытия', type: 'area', color: 'hsl(var(--color-destructive))' },
                            { key: 'Чистый поток', type: 'line', color: 'hsl(var(--color-primary))' },
                        ]}
                    />
                </div>
                <div className="lg:col-span-2">
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

    const BalanceView = () => (
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
        </div>
    );

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            if (!forecastData) return null;
            const totalForecastRevenue = forecastData.monthlyForecast.reduce((sum, item) => sum + item.forecastRevenue, 0);
            const totalForecastProfit = forecastData.monthlyForecast.reduce((sum, item) => sum + item.forecastProfit, 0);
            return { totalForecastRevenue, totalForecastProfit };
        }, [forecastData]);

        const combinedChartData = useMemo(() => {
            if (!forecastData) return [];
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
                        <LightbulbIcon className="w-6 h-6" />
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
                                <p className="text-text-secondary text-sm leading-relaxed">{forecastData.summary}</p>
                            </FinancialStatementCard.Section>
                            <div className="pt-4 mt-4 border-t border-border">
                                <button onClick={handleGenerateForecast} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-foreground bg-primary/90 rounded-lg hover:bg-primary transition-colors">
                                    <LightbulbIcon className="w-5 h-5" />
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
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-text-primary">Финансовый Дашборд</h1>
                <div className="flex items-center gap-4">
                    {showGranularitySwitcher && <GranularitySwitcher activeGranularity={granularity} setGranularity={setGranularity} />}
                    <ReportTabs activeReport={activeReport} setActiveReport={setActiveReport} />
                    <button
                        onClick={handleDownloadFullReport}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary-hover transition-colors shadow-md"
                        aria-label="Скачать полный PDF-отчет"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        <span>Скачать полный PDF-отчет</span>
                    </button>
                </div>
            </div>
            <div>
                {/* Render all views to ensure refs are populated, but only show the active one */}
                <div style={reportContainerStyle('pnl')}><PnlView /></div>
                <div style={reportContainerStyle('cashflow')}><CashflowView /></div>
                <div style={reportContainerStyle('balance')}><BalanceView /></div>
                <div style={reportContainerStyle('forecast')}><ForecastView /></div>
                <div style={reportContainerStyle('counterparties')}><CounterpartyView /></div>
                <div style={reportContainerStyle('debts')}><DebtsView /></div>
            </div>
        </div>
    );
};

function format(value: number) {
    return new Intl.NumberFormat('ru-RU').format(Math.round(value));
}

export default Dashboard;
