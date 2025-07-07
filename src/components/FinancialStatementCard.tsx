import React from 'react';
import { Card, CardContent, CardHeader, Typography, Box, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid } from '@mui/material';
import { formatCurrency } from '../utils/formatting';
import { useTranslation } from 'react-i18next';
import { BalanceSheetData } from '../types';

export interface FinancialStatementCardProps {
    summary: {
        totalIncome: number;
        totalExpense: number;
        netIncome: number;
    };
    balanceSheet?: BalanceSheetData;
}

const FinancialStatementCard: React.FC<FinancialStatementCardProps> = ({ summary, balanceSheet }) => {
    const { t } = useTranslation();

    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader
                title={t('financialReport.balanceSheet')}
                titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
            />
            <Divider />
            <CardContent>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <Box mb={3}>
                            <Typography variant="h6" gutterBottom>
                                {t('financialReport.incomeStatement')}
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>{t('financialReport.revenue')}</TableCell>
                                            <TableCell align="right">{formatCurrency(summary.totalIncome)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>{t('financialReport.operatingExpenses')}</TableCell>
                                            <TableCell align="right">({formatCurrency(summary.totalExpense)})</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold' }}>{t('financialReport.netProfit')}</TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: summary.netIncome >= 0 ? 'success.main' : 'error.main'
                                                }}
                                            >
                                                {formatCurrency(summary.netIncome)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Grid>

                    {balanceSheet && (
                        <Grid item xs={12} md={6}>
                            <Box mb={3}>
                                <Typography variant="h6" gutterBottom>
                                    {t('financialReport.balanceSheet')}
                                </Typography>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableBody>
                                            <TableRow>
                                                <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                                                    {t('financialReport.assets')}
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>{t('financialReport.cash')}</TableCell>
                                                <TableCell align="right">{formatCurrency(balanceSheet.assets.cash)}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>{t('financialReport.totalCurrentAssets')}</TableCell>
                                                <TableCell align="right">{formatCurrency(balanceSheet.assets.totalCurrentAssets)}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>{t('financialReport.totalNonCurrentAssets')}</TableCell>
                                                <TableCell align="right">{formatCurrency(balanceSheet.assets.totalNonCurrentAssets)}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>{t('financialReport.totalAssets')}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                    {formatCurrency(balanceSheet.assets.totalAssets)}
                                                </TableCell>
                                            </TableRow>

                                            <TableRow>
                                                <TableCell colSpan={2} sx={{ fontWeight: 'bold', pt: 2 }}>
                                                    {t('financialReport.liabilities')}
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>{t('financialReport.totalCurrentLiabilities')}</TableCell>
                                                <TableCell align="right">{formatCurrency(balanceSheet.liabilities.totalCurrentLiabilities)}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>{t('financialReport.totalLiabilities')}</TableCell>
                                                <TableCell align="right">{formatCurrency(balanceSheet.liabilities.totalLiabilities)}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>{t('financialReport.totalEquity')}</TableCell>
                                                <TableCell align="right">{formatCurrency(balanceSheet.equity.totalEquity)}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Grid>
                    )}
                </Grid>

                {balanceSheet && (
                    <Box mt={3}>
                        <Typography variant="h6" gutterBottom>
                            {t('financialReport.financialRatios')}
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {t('financialReport.currentRatio')}
                                        </Typography>
                                        <Typography variant="h6">
                                            {balanceSheet.ratios.currentRatio.toFixed(2)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {t('financialReport.quickRatio')}
                                        </Typography>
                                        <Typography variant="h6">
                                            {balanceSheet.ratios.quickRatio.toFixed(2)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {t('financialReport.debtToEquity')}
                                        </Typography>
                                        <Typography variant="h6">
                                            {balanceSheet.ratios.debtToEquity.toFixed(2)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {t('financialReport.assetTurnover')}
                                        </Typography>
                                        <Typography variant="h6">
                                            {balanceSheet.ratios.assetTurnover.toFixed(2)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default FinancialStatementCard;
