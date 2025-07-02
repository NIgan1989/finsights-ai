import React, { useState } from 'react';
import { Grid, Typography, Box, ToggleButton, ToggleButtonGroup, Paper, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ViewModule, ViewList, Analytics, TrendingUp } from '@mui/icons-material';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import TransactionsTable from './TransactionsTable';
import CashFlowChart from './CashFlowChart';
import IncomeExpenseChart from './IncomeExpenseChart';
import CategoryChartCard from './CategoryChartCard';
import ReportTabs from './ReportTabs';
import FinancialStatementCard from './FinancialStatementCard';
import FinancialKPIGrid from './FinancialKPIGrid';
import { Transaction } from '../types';
import { generateFinancialReport } from '../services/financeService';
import { calculateSummary, getMonthlyCashFlow, getMonthlyIncomeExpense, getExpenseByCategory } from '../utils/finance';
import { formatCurrency } from '../utils/formatting';

interface DashboardProps {
    transactions: Transaction[];
    onUpdateTransaction: (originalTx: Transaction, updates: { description: string; category: string; }, applyToAll: boolean) => void;
}

type ReportView = 'pnl' | 'cashflow' | 'balance';
type ViewMode = 'overview' | 'detailed' | 'kpi';

const Dashboard: React.FC<DashboardProps> = ({ transactions, onUpdateTransaction }) => {
    const { t } = useTranslation();
    const [activeReport, setActiveReport] = useState<ReportView>('pnl');
    const [viewMode, setViewMode] = useState<ViewMode>('overview');
    
    const summary = calculateSummary(transactions);
    const monthlyCashFlow = getMonthlyCashFlow(transactions);
    const monthlyIncomeExpense = getMonthlyIncomeExpense(transactions);
    const expenseByCategory = getExpenseByCategory(transactions);
    
    // Генерируем полный финансовый отчет для KPI
    const financialReport = generateFinancialReport(transactions);

    const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
        if (newMode) {
            setViewMode(newMode);
        }
    };

    const renderReportContent = () => {
        switch (activeReport) {
            case 'pnl':
                return (
                    <>
                        <Grid item xs={12} lg={8}>
                            <ChartCard 
                                title="Анализ доходов и расходов"
                                subtitle="Динамика финансовых показателей по месяцам"
                                height={500}
                                onRefresh={() => window.location.reload()}
                                onExport={() => console.log('Export chart data')}
                            >
                                <IncomeExpenseChart 
                                    data={monthlyIncomeExpense} 
                                    title="Доходы vs Расходы"
                                    showNetProfit={true}
                                />
                            </ChartCard>
                        </Grid>
                        <Grid item xs={12} lg={4}>
                            <ChartCard 
                                title="Структура расходов"
                                subtitle="Распределение по категориям"
                                height={500}
                            >
                                <CategoryChartCard data={expenseByCategory} />
                            </ChartCard>
                        </Grid>
                    </>
                );
            case 'cashflow':
                return (
                    <Grid item xs={12}>
                        <ChartCard 
                            title="Анализ денежных потоков"
                            subtitle="Движение денежных средств по месяцам"
                            height={400}
                            onRefresh={() => window.location.reload()}
                        >
                            <CashFlowChart data={monthlyCashFlow} />
                        </ChartCard>
                    </Grid>
                );
            case 'balance':
                return (
                    <Grid item xs={12}>
                        <FinancialStatementCard summary={{
                            totalIncome: summary.revenue,
                            totalExpense: summary.expenses,
                            netIncome: summary.net
                        }} />
                    </Grid>
                );
            default:
                return null;
        }
    };

    const renderOverviewMode = () => (
        <>
            {/* Quick Stats */}
            <Grid item xs={12} md={4}>
                <StatCard
                    title={t('dashboard.total_revenue')}
                    value={formatCurrency(summary.revenue)}
                    type="revenue"
                />
            </Grid>
            <Grid item xs={12} md={4}>
                <StatCard
                    title={t('dashboard.total_expenses')}
                    value={formatCurrency(summary.expenses)}
                    type="expense"
                />
            </Grid>
            <Grid item xs={12} md={4}>
                <StatCard
                    title={t('dashboard.net_income')}
                    value={formatCurrency(summary.net)}
                    type="net"
                />
            </Grid>

            {/* Report Tabs */}
            <Grid item xs={12}>
                <ReportTabs activeReport={activeReport} setActiveReport={setActiveReport} />
            </Grid>

            {/* Charts based on active report */}
            {renderReportContent()}
        </>
    );

    const renderKPIMode = () => (
        <Grid item xs={12}>
            <FinancialKPIGrid 
                data={{
                    revenue: financialReport.pnl.totalRevenue,
                    expenses: financialReport.pnl.costOfGoodsSold + financialReport.pnl.totalOperatingExpenses,
                    netProfit: financialReport.pnl.netProfit,
                    grossMargin: financialReport.pnl.ratios.grossMargin,
                    operatingMargin: financialReport.pnl.ratios.operatingMargin,
                    netMargin: financialReport.pnl.ratios.netMargin,
                    roa: financialReport.pnl.ratios.roa,
                    roe: financialReport.pnl.ratios.roe,
                    currentRatio: financialReport.balanceSheet.ratios.currentRatio,
                    quickRatio: financialReport.balanceSheet.ratios.quickRatio,
                    debtToEquity: financialReport.balanceSheet.ratios.debtToEquity,
                    cashFlow: financialReport.cashFlow.operatingActivities,
                    // Можно добавить трендовые данные если есть исторические данные
                    revenueTrend: Math.random() * 20 - 10, // Mock data
                    profitTrend: Math.random() * 15 - 7.5, // Mock data
                    expensesTrend: Math.random() * 10 - 5, // Mock data
                }}
            />
        </Grid>
    );

    const renderDetailedMode = () => (
        <>
            {renderOverviewMode()}
            <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                    Подробная аналитика
                </Typography>
            </Grid>
            {renderKPIMode()}
        </>
    );

    const renderContent = () => {
        switch (viewMode) {
            case 'overview':
                return renderOverviewMode();
            case 'kpi':
                return renderKPIMode();
            case 'detailed':
                return renderDetailedMode();
            default:
                return renderOverviewMode();
        }
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            {/* Header with View Mode Toggle */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 4,
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {t('dashboard.title')}
                </Typography>
                
                <Paper sx={{ p: 0.5 }}>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewModeChange}
                        size="small"
                    >
                        <ToggleButton value="overview">
                            <ViewModule sx={{ mr: 1 }} />
                            Обзор
                        </ToggleButton>
                        <ToggleButton value="kpi">
                            <Analytics sx={{ mr: 1 }} />
                            KPI
                        </ToggleButton>
                        <ToggleButton value="detailed">
                            <TrendingUp sx={{ mr: 1 }} />
                            Детально
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Paper>
            </Box>

            <Grid container spacing={3}>
                {renderContent()}

                {/* Transactions Table (always shown) */}
                <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Транзакции
                    </Typography>
                    <TransactionsTable 
                        transactions={transactions} 
                        onUpdateTransaction={onUpdateTransaction} 
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;