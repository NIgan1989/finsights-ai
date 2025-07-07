import React, { useState } from 'react';
import {
    Grid, Typography, Box, ToggleButton, ToggleButtonGroup, Paper,
    Divider, Card, Chip, Tabs, Tab, Button, useTheme, alpha, LinearProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
    ViewModule, ViewList, Analytics, TrendingUp,
    Business, AccountBalance, Assessment, CalendarToday,
    CloudDownload, AccountBalanceWallet, CompareArrows
} from '@mui/icons-material';
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
import {
    calculateSummary,
    getMonthlyCashFlow,
    getMonthlyIncomeExpense,
    getExpenseByCategory,
    getTaxEstimates,
    getBusinessMetrics
} from '../utils/finance';
import { formatCurrency } from '../utils/formatting';

interface DashboardProps {
    transactions: Transaction[];
    onUpdateTransaction: (originalTx: Transaction, updates: { description: string; category: string; }, applyToAll: boolean) => void;
}

type ReportView = 'pnl' | 'cashflow' | 'balance' | 'tax' | 'business';
type ViewMode = 'overview' | 'detailed' | 'kpi' | 'analytical';

const Dashboard: React.FC<DashboardProps> = ({ transactions, onUpdateTransaction }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const [activeReport, setActiveReport] = useState<ReportView>('pnl');
    const [viewMode, setViewMode] = useState<ViewMode>('overview');
    const [periodType, setPeriodType] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

    const summary = calculateSummary(transactions);
    const monthlyCashFlow = getMonthlyCashFlow(transactions);
    const monthlyIncomeExpense = getMonthlyIncomeExpense(transactions);
    const expenseByCategory = getExpenseByCategory(transactions);

    // Generate full financial report for KPIs
    const financialReport = generateFinancialReport(transactions);

    // Calculate tax estimates (new feature)
    const taxEstimates = getTaxEstimates ? getTaxEstimates(transactions, financialReport) : {
        vatPayable: summary.revenue * 0.12,
        incomeTaxEstimate: summary.net * 0.1,
        socialTax: summary.revenue * 0.035,
        pensionContributions: summary.revenue * 0.05
    };

    // Calculate business metrics (new feature)
    const businessMetrics = getBusinessMetrics ? getBusinessMetrics(transactions, financialReport) : {
        avgTransactionValue: summary.revenue / (transactions.filter(t => t.type === 'income').length || 1),
        topExpenseCategories: expenseByCategory.slice(0, 3),
        cashBalance: summary.revenue - summary.expenses,
        daysWithTransactions: new Set(transactions.map(t => t.date.substring(0, 10))).size
    };

    const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
        if (newMode) {
            setViewMode(newMode);
        }
    };

    const handlePeriodChange = (_: React.MouseEvent<HTMLElement>, newPeriod: 'monthly' | 'quarterly' | 'yearly' | null) => {
        if (newPeriod) {
            setPeriodType(newPeriod);
        }
    };

    const renderReportContent = () => {
        switch (activeReport) {
            case 'pnl':
                return (
                    <>
                        <Grid item xs={12} lg={8}>
                            <ChartCard
                                title={t('dashboard.income_expense_analysis')}
                                subtitle={t('dashboard.financial_metrics_by_period')}
                                height={500}
                                onRefresh={() => window.location.reload()}
                                onExport={() => console.log('Export chart data')}
                            >
                                <IncomeExpenseChart
                                    data={monthlyIncomeExpense}
                                    title={t('income_vs_expense')}
                                    showNetProfit={true}
                                    period={periodType}
                                />
                            </ChartCard>
                        </Grid>
                        <Grid item xs={12} lg={4}>
                            <ChartCard
                                title={t('expense_by_category')}
                                subtitle={t('dashboard.distribution_by_categories')}
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
                            title={t('dashboard.cash_flow_analysis')}
                            subtitle={t('dashboard.cash_movement_by_period')}
                            height={400}
                            onRefresh={() => window.location.reload()}
                        >
                            <CashFlowChart
                                data={monthlyCashFlow}
                                period={periodType}
                            />
                        </ChartCard>
                    </Grid>
                );
            case 'balance':
                return (
                    <Grid item xs={12}>
                        <FinancialStatementCard
                            summary={{
                                totalIncome: summary.revenue,
                                totalExpense: summary.expenses,
                                netIncome: summary.net
                            }}
                            balanceSheet={financialReport.balanceSheet}
                        />
                    </Grid>
                );
            case 'tax':
                return (
                    <Grid item xs={12}>
                        <Card sx={{ p: 3, boxShadow: theme.shadows[3] }}>
                            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                                {t('dashboard.tax_estimates')}
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6} lg={3}>
                                    <StatCard
                                        title={t('dashboard.vat_payable')}
                                        value={formatCurrency(taxEstimates.vatPayable)}
                                        type="expense"
                                        icon={<AccountBalance />}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6} lg={3}>
                                    <StatCard
                                        title={t('dashboard.income_tax')}
                                        value={formatCurrency(taxEstimates.incomeTaxEstimate)}
                                        type="expense"
                                        icon={<Business />}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6} lg={3}>
                                    <StatCard
                                        title={t('dashboard.social_tax')}
                                        value={formatCurrency(taxEstimates.socialTax)}
                                        type="expense"
                                        icon={<CompareArrows />}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6} lg={3}>
                                    <StatCard
                                        title={t('dashboard.pension_contributions')}
                                        value={formatCurrency(taxEstimates.pensionContributions)}
                                        type="expense"
                                        icon={<AccountBalanceWallet />}
                                    />
                                </Grid>
                            </Grid>
                            <Box sx={{ mt: 4 }}>
                                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                                    {t('dashboard.tax_calendar')}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Chip
                                        icon={<CalendarToday />}
                                        label="НДС - 25 апреля"
                                        color="primary"
                                        variant="outlined"
                                    />
                                    <Chip
                                        icon={<CalendarToday />}
                                        label="Авансовый КПН - 20 мая"
                                        color="secondary"
                                        variant="outlined"
                                    />
                                    <Chip
                                        icon={<CalendarToday />}
                                        label="Социальный налог - 25 апреля"
                                        color="info"
                                        variant="outlined"
                                    />
                                </Box>
                            </Box>
                        </Card>
                    </Grid>
                );
            case 'business':
                return (
                    <>
                        <Grid item xs={12} md={6}>
                            <Card sx={{ p: 3, height: '100%', boxShadow: theme.shadows[3] }}>
                                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                                    {t('dashboard.business_metrics')}
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {t('dashboard.avg_transaction')}
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                            {formatCurrency(businessMetrics.avgTransactionValue)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {t('dashboard.cash_balance')}
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                            {formatCurrency(businessMetrics.cashBalance)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {t('dashboard.transaction_days')}
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                            {businessMetrics.daysWithTransactions}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {t('dashboard.transactions_count')}
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                            {transactions.length}
                                        </Typography>
                                    </Grid>
                                </Grid>
                                <Divider sx={{ my: 3 }} />
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                                    {t('dashboard.top_expenses')}
                                </Typography>
                                {businessMetrics.topExpenseCategories.map((category, idx) => (
                                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                        <Typography variant="body2">{category.name}</Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {formatCurrency(category.value)}
                                        </Typography>
                                    </Box>
                                ))}
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card sx={{ p: 3, height: '100%', boxShadow: theme.shadows[3] }}>
                                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                                    {t('dashboard.quick_actions')}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<CloudDownload />}
                                        sx={{ justifyContent: 'flex-start' }}
                                    >
                                        {t('dashboard.export_for_accounting')}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Assessment />}
                                        sx={{ justifyContent: 'flex-start' }}
                                    >
                                        {t('dashboard.generate_tax_report')}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Business />}
                                        sx={{ justifyContent: 'flex-start' }}
                                    >
                                        {t('dashboard.business_registration_check')}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<CompareArrows />}
                                        sx={{ justifyContent: 'flex-start' }}
                                    >
                                        {t('dashboard.compare_periods')}
                                    </Button>
                                </Box>
                            </Card>
                        </Grid>
                    </>
                );
            default:
                return null;
        }
    };

    const renderOverviewMode = () => (
        <>
            {/* Quick Stats */}
            <Grid item xs={12} md={3}>
                <StatCard
                    title={t('dashboard.total_revenue')}
                    value={formatCurrency(summary.revenue)}
                    type="revenue"
                    icon={<TrendingUp />}
                />
            </Grid>
            <Grid item xs={12} md={3}>
                <StatCard
                    title={t('dashboard.total_expenses')}
                    value={formatCurrency(summary.expenses)}
                    type="expense"
                    icon={<CompareArrows />}
                />
            </Grid>
            <Grid item xs={12} md={3}>
                <StatCard
                    title={t('dashboard.net_income')}
                    value={formatCurrency(summary.net)}
                    type="net"
                    icon={<AccountBalance />}
                />
            </Grid>
            <Grid item xs={12} md={3}>
                <StatCard
                    title={t('dashboard.cash_balance')}
                    value={formatCurrency(summary.revenue - summary.expenses)}
                    type={summary.revenue - summary.expenses >= 0 ? "revenue" : "expense"}
                    icon={<AccountBalanceWallet />}
                />
            </Grid>

            {/* Period Toggle */}
            <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {t('dashboard.financial_reports')}
                    </Typography>
                    <Paper sx={{ p: 0.5 }}>
                        <ToggleButtonGroup
                            value={periodType}
                            exclusive
                            onChange={handlePeriodChange}
                            size="small"
                        >
                            <ToggleButton value="monthly">
                                {t('dashboard.monthly')}
                            </ToggleButton>
                            <ToggleButton value="quarterly">
                                {t('dashboard.quarterly')}
                            </ToggleButton>
                            <ToggleButton value="yearly">
                                {t('dashboard.yearly')}
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Paper>
                </Box>
            </Grid>

            {/* Report Tabs */}
            <Grid item xs={12}>
                <Tabs
                    value={activeReport}
                    onChange={(_, newValue) => setActiveReport(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        mb: 3,
                        '& .MuiTab-root': {
                            minWidth: 0,
                            px: 3,
                            py: 1.5,
                            borderRadius: 1,
                            mx: 0.5,
                            textTransform: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                        },
                        '& .Mui-selected': {
                            backgroundColor: theme => alpha(theme.palette.primary.main, 0.1),
                        }
                    }}
                >
                    <Tab
                        label={t('financialReport.incomeStatement')}
                        value="pnl"
                        icon={<TrendingUp />}
                        iconPosition="start"
                    />
                    <Tab
                        label={t('financialReport.cashFlowStatement')}
                        value="cashflow"
                        icon={<CompareArrows />}
                        iconPosition="start"
                    />
                    <Tab
                        label={t('financialReport.balanceSheet')}
                        value="balance"
                        icon={<AccountBalance />}
                        iconPosition="start"
                    />
                    <Tab
                        label={t('dashboard.tax_analysis')}
                        value="tax"
                        icon={<Assessment />}
                        iconPosition="start"
                    />
                    <Tab
                        label={t('dashboard.business_insights')}
                        value="business"
                        icon={<Business />}
                        iconPosition="start"
                    />
                </Tabs>
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
                    revenueTrend: 5.2, // Example value
                    profitTrend: 3.8, // Example value
                    expensesTrend: 2.5, // Example value
                }}
            />
        </Grid>
    );

    const renderAnalyticalMode = () => (
        <>
            <Grid item xs={12}>
                <Card sx={{ p: 3, boxShadow: theme.shadows[3], mb: 3 }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                        {t('dashboard.financial_health_analysis')}
                    </Typography>
                    <Grid container spacing={3}>
                        {/* Financial Health Score */}
                        <Grid item xs={12} md={4}>
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                                    78
                                </Typography>
                                <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
                                    {t('dashboard.financial_health_score')}
                                </Typography>
                                <Box sx={{ mt: 2, px: 4 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={78}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            backgroundColor: alpha(theme.palette.success.main, 0.2),
                                            '& .MuiLinearProgress-bar': {
                                                backgroundColor: theme.palette.success.main,
                                                borderRadius: 4,
                                            }
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Grid>

                        {/* Strengths & Weaknesses */}
                        <Grid item xs={12} md={8}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                    {t('dashboard.financial_strengths')}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                    <Chip label="Стабильный доход" color="success" size="small" />
                                    <Chip label="Хорошая маржа" color="success" size="small" />
                                    <Chip label="Низкий уровень долга" color="success" size="small" />
                                </Box>

                                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                    {t('dashboard.financial_weaknesses')}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip label="Высокие операционные расходы" color="error" size="small" />
                                    <Chip label="Низкая ликвидность" color="warning" size="small" />
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Card>
            </Grid>

            <Grid item xs={12}>
                <Card sx={{ p: 3, boxShadow: theme.shadows[3] }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                        {t('dashboard.business_recommendations')}
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                    {t('dashboard.cost_optimization')}
                                </Typography>
                                <Typography variant="body2">
                                    Оптимизируйте расходы на категорию "Офисные расходы" - они выше средних на 23% для вашего типа бизнеса.
                                </Typography>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                    {t('dashboard.cash_flow_management')}
                                </Typography>
                                <Typography variant="body2">
                                    Рассмотрите возможность создания резервного фонда в размере 3-месячных операционных расходов для повышения финансовой устойчивости.
                                </Typography>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                    {t('dashboard.tax_optimization')}
                                </Typography>
                                <Typography variant="body2">
                                    Проанализируйте возможность перехода на упрощенный режим налогообложения для снижения налоговой нагрузки на 8-12%.
                                </Typography>
                            </Card>
                        </Grid>
                    </Grid>
                </Card>
            </Grid>
        </>
    );

    const renderDetailedMode = () => (
        <>
            {renderOverviewMode()}
            <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                    {t('dashboard.detailed_analysis')}
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
            case 'analytical':
                return renderAnalyticalMode();
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

                <Paper sx={{ p: 0.5, boxShadow: theme.shadows[2] }}>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewModeChange}
                        size="small"
                    >
                        <ToggleButton value="overview">
                            <ViewModule sx={{ mr: 1 }} />
                            {t('dashboard.overview')}
                        </ToggleButton>
                        <ToggleButton value="kpi">
                            <Analytics sx={{ mr: 1 }} />
                            {t('dashboard.kpi')}
                        </ToggleButton>
                        <ToggleButton value="analytical">
                            <Assessment sx={{ mr: 1 }} />
                            {t('dashboard.analytical')}
                        </ToggleButton>
                        <ToggleButton value="detailed">
                            <TrendingUp sx={{ mr: 1 }} />
                            {t('dashboard.detailed')}
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Paper>
            </Box>

            <Grid container spacing={3}>
                {renderContent()}

                {/* Transactions Table (always shown) */}
                <Grid item xs={12}>
                    <Divider sx={{ my: 3 }} />
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2
                    }}>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            {t('transactions')}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CloudDownload />}
                            >
                                {t('dashboard.export')}
                            </Button>
                        </Box>
                    </Box>
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