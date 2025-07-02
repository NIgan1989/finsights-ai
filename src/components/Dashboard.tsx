import React, { useState } from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import TransactionsTable from './TransactionsTable';
import CashFlowChart from './CashFlowChart';
import IncomeExpenseChart from './IncomeExpenseChart';
import CategoryChartCard from './CategoryChartCard';
import ReportTabs from './ReportTabs';
import FinancialStatementCard from './FinancialStatementCard';
import { Transaction } from '../types';
import { calculateSummary, getMonthlyCashFlow, getMonthlyIncomeExpense, getExpenseByCategory } from '../utils/finance';
import { formatCurrency } from '../utils/formatting';

interface DashboardProps {
    transactions: Transaction[];
    onUpdateTransaction: (originalTx: Transaction, updates: { description: string; category: string; }, applyToAll: boolean) => void;
}

type ReportView = 'pnl' | 'cashflow' | 'balance';

const Dashboard: React.FC<DashboardProps> = ({ transactions, onUpdateTransaction }) => {
    const { t } = useTranslation();
    const [activeReport, setActiveReport] = useState<ReportView>('pnl');
    const summary = calculateSummary(transactions);
    const monthlyCashFlow = getMonthlyCashFlow(transactions);
    const monthlyIncomeExpense = getMonthlyIncomeExpense(transactions);
    const expenseByCategory = getExpenseByCategory(transactions);

    const renderReportContent = () => {
        switch (activeReport) {
            case 'pnl':
                return (
                    <>
                        <Grid item xs={12} lg={6}>
                            <ChartCard title={t('income_vs_expense')}>
                                <IncomeExpenseChart data={monthlyIncomeExpense} />
                            </ChartCard>
                        </Grid>
                        <Grid item xs={12}>
                            <CategoryChartCard data={expenseByCategory} />
                        </Grid>
                    </>
                );
            case 'cashflow':
                return (
                    <Grid item xs={12} lg={12}>
                        <ChartCard title={t('cash_flow')}>
                            <CashFlowChart data={monthlyCashFlow} />
                        </ChartCard>
                    </Grid>
                );
            case 'balance':
                return (
                    <Grid item xs={12} lg={12}>
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

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
                {t('dashboard.title')}
            </Typography>
            <Grid container spacing={3}>
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

                <Grid item xs={12}>
                    <ReportTabs activeReport={activeReport} setActiveReport={setActiveReport} />
                </Grid>

                {renderReportContent()}

                <Grid item xs={12}>
                    <TransactionsTable transactions={transactions} onUpdateTransaction={onUpdateTransaction} />
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;