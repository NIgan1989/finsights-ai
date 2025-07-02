import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Font, pdf } from '@react-pdf/renderer';
import { FinancialReport } from '../types';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

// Загрузка шрифта
Font.register({
    family: 'Roboto',
    src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
});

// Стили для PDF
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Roboto',
    },
    title: {
        fontSize: 20,
        marginBottom: 10,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
        marginTop: 15,
        marginBottom: 10,
        fontWeight: 'bold',
        paddingBottom: 2,
        borderBottom: '1px solid #555555',
    },
    subsection: {
        fontSize: 14,
        marginTop: 10,
        marginBottom: 5,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        flex: 2,
        fontSize: 10,
    },
    value: {
        flex: 1,
        fontSize: 10,
        textAlign: 'right',
    },
    boldValue: {
        flex: 1,
        fontSize: 10,
        textAlign: 'right',
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#555555',
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#555555',
        paddingBottom: 3,
        marginBottom: 5,
        fontWeight: 'bold',
        fontSize: 10,
    },
    tableCell: {
        flex: 1,
        fontSize: 9,
    },
    tableCellRight: {
        flex: 1,
        fontSize: 9,
        textAlign: 'right',
    },
    indentedLabel: {
        flex: 2,
        fontSize: 10,
        marginLeft: 10,
    },
    doubleIndentedLabel: {
        flex: 2,
        fontSize: 10,
        marginLeft: 20,
    },
});

// Форматирование чисел
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'KZT',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

// Форматирование процентов
const formatPercent = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(value);
};

export interface FinancialReportPDFProps {
    report: FinancialReport;
    dateRange: { start: string; end: string };
    t: TFunction;
}

export const FinancialReportContent: React.FC<FinancialReportPDFProps> = ({ report, dateRange, t }) => {
    const { pnl, cashFlow, balanceSheet } = report;

    // Форматируем даты для заголовка
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU');
    };

    const title = t('financialReport.title');
    const subtitle = `${t('financialReport.period')}: ${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;

    return (
        <>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>{title}</Text>
                <Text style={{ fontSize: 12, marginBottom: 15, textAlign: 'center' }}>{subtitle}</Text>

                {/* Отчет о прибылях и убытках */}
                <Text style={styles.subtitle}>{t('financialReport.incomeStatement')}</Text>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('financialReport.revenue')}</Text>
                    <Text style={styles.value}>{formatCurrency(pnl.totalRevenue)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.costOfGoodsSold')}</Text>
                    <Text style={styles.value}>({formatCurrency(pnl.costOfGoodsSold)})</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('financialReport.grossProfit')}</Text>
                    <Text style={styles.boldValue}>{formatCurrency(pnl.grossProfit)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.grossMargin')}</Text>
                    <Text style={styles.value}>{formatPercent(pnl.ratios.grossMargin)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.operatingExpenses')}</Text>
                    <Text style={styles.value}>({formatCurrency(pnl.totalOperatingExpenses)})</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('financialReport.ebitda')}</Text>
                    <Text style={styles.boldValue}>{formatCurrency(pnl.ebitda)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.depreciation')}</Text>
                    <Text style={styles.value}>({formatCurrency(pnl.depreciation)})</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('financialReport.ebit')} (EBIT)</Text>
                    <Text style={styles.boldValue}>{formatCurrency(pnl.ebit)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.operatingMargin')}</Text>
                    <Text style={styles.value}>{formatPercent(pnl.ratios.operatingMargin)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.financialIncome')}</Text>
                    <Text style={styles.value}>{formatCurrency(pnl.financialIncome)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.financialExpense')}</Text>
                    <Text style={styles.value}>({formatCurrency(pnl.financialExpense)})</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('financialReport.ebt')} (EBT)</Text>
                    <Text style={styles.boldValue}>{formatCurrency(pnl.ebt)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.taxes')}</Text>
                    <Text style={styles.value}>({formatCurrency(pnl.taxes)})</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('financialReport.netProfit')}</Text>
                    <Text style={styles.boldValue}>{formatCurrency(pnl.netProfit)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.netMargin')}</Text>
                    <Text style={styles.value}>{formatPercent(pnl.ratios.netMargin)}</Text>
                </View>

                {/* Расходы по категориям */}
                <Text style={styles.subsection}>{t('financialReport.expensesByCategory')}</Text>
                {pnl.expenseByCategory.slice(0, 5).map((expense, index) => (
                    <View key={index} style={styles.row}>
                        <Text style={styles.indentedLabel}>{expense.name}</Text>
                        <Text style={styles.value}>{formatCurrency(expense.value)}</Text>
                    </View>
                ))}

                {/* Отчет о движении денежных средств */}
                <Text style={styles.subtitle}>{t('financialReport.cashFlowStatement')}</Text>

                <Text style={styles.subsection}>{t('financialReport.operatingActivities')}</Text>
                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.netProfit')}</Text>
                    <Text style={styles.value}>{formatCurrency(cashFlow.operatingDetails.fromNetIncome)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.depreciation')}</Text>
                    <Text style={styles.value}>{formatCurrency(cashFlow.operatingDetails.depreciation)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.workingCapitalChanges')}</Text>
                    <Text style={styles.value}>{formatCurrency(cashFlow.operatingDetails.workingCapitalChanges)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('financialReport.netCashFromOperations')}</Text>
                    <Text style={styles.boldValue}>{formatCurrency(cashFlow.operatingActivities)}</Text>
                </View>

                <Text style={styles.subsection}>{t('financialReport.investingActivities')}</Text>
                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.capitalExpenditures')}</Text>
                    <Text style={styles.value}>{formatCurrency(cashFlow.investingDetails.capitalExpenditures)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.assetDisposals')}</Text>
                    <Text style={styles.value}>{formatCurrency(cashFlow.investingDetails.assetDisposals)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.investments')}</Text>
                    <Text style={styles.value}>{formatCurrency(cashFlow.investingDetails.investments)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('financialReport.netCashFromInvesting')}</Text>
                    <Text style={styles.boldValue}>{formatCurrency(cashFlow.investingActivities)}</Text>
                </View>

                <Text style={styles.subsection}>{t('financialReport.financingActivities')}</Text>
                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.debtProceeds')}</Text>
                    <Text style={styles.value}>{formatCurrency(cashFlow.financingDetails.debtProceeds)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.debtRepayments')}</Text>
                    <Text style={styles.value}>{formatCurrency(cashFlow.financingDetails.debtRepayments)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.dividends')}</Text>
                    <Text style={styles.value}>{formatCurrency(cashFlow.financingDetails.dividends)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.equityChanges')}</Text>
                    <Text style={styles.value}>{formatCurrency(cashFlow.financingDetails.equityChanges)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('financialReport.netCashFromFinancing')}</Text>
                    <Text style={styles.boldValue}>{formatCurrency(cashFlow.financingActivities)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('financialReport.netCashFlow')}</Text>
                    <Text style={styles.boldValue}>{formatCurrency(cashFlow.netCashFlow)}</Text>
                </View>
            </Page>

            <Page size="A4" style={styles.page}>
                {/* Продолжение со второй страницы */}
                <Text style={styles.title}>{title}</Text>
                <Text style={{ fontSize: 12, marginBottom: 15, textAlign: 'center' }}>{subtitle}</Text>

                {/* Баланс */}
                <Text style={styles.subtitle}>{t('financialReport.balanceSheet')}</Text>

                <Text style={styles.subsection}>{t('financialReport.assets')}</Text>

                <Text style={{ ...styles.subsection, fontSize: 12, marginLeft: 10 }}>{t('financialReport.currentAssets')}</Text>
                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.cash')}</Text>
                    <Text style={styles.value}>{formatCurrency(balanceSheet.assets.cash)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.accountsReceivable')}</Text>
                    <Text style={styles.value}>{formatCurrency(balanceSheet.assets.accountsReceivable)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.inventory')}</Text>
                    <Text style={styles.value}>{formatCurrency(balanceSheet.assets.inventory)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.prepaidExpenses')}</Text>
                    <Text style={styles.value}>{formatCurrency(balanceSheet.assets.prepaidExpenses)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('financialReport.totalCurrentAssets')}</Text>
                    <Text style={styles.boldValue}>{formatCurrency(balanceSheet.assets.totalCurrentAssets)}</Text>
                </View>

                <Text style={{ ...styles.subsection, fontSize: 12, marginLeft: 10 }}>{t('financialReport.nonCurrentAssets')}</Text>
                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.equipment')}</Text>
                    <Text style={styles.value}>{formatCurrency(balanceSheet.assets.equipment)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.accumulatedDepreciation')}</Text>
                    <Text style={styles.value}>{formatCurrency(balanceSheet.assets.accumulatedDepreciation)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.netEquipment')}</Text>
                    <Text style={styles.value}>{formatCurrency(balanceSheet.assets.netEquipment)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('financialReport.totalNonCurrentAssets')}</Text>
                    <Text style={styles.boldValue}>{formatCurrency(balanceSheet.assets.totalNonCurrentAssets)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('financialReport.totalAssets')}</Text>
                    <Text style={styles.boldValue}>{formatCurrency(balanceSheet.assets.totalAssets)}</Text>
                </View>

                <Text style={styles.subsection}>{t('financialReport.liabilities')}</Text>

                <Text style={{ ...styles.subsection, fontSize: 12, marginLeft: 10 }}>{t('financialReport.currentLiabilities')}</Text>
                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.accountsPayable')}</Text>
                    <Text style={styles.value}>{formatCurrency(balanceSheet.liabilities.accountsPayable)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.accruedExpenses')}</Text>
                    <Text style={styles.value}>{formatCurrency(balanceSheet.liabilities.accruedExpenses)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.taxesPayable')}</Text>
                    <Text style={styles.value}>{formatCurrency(balanceSheet.liabilities.taxesPayable)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('financialReport.totalCurrentLiabilities')}</Text>
                    <Text style={styles.boldValue}>{formatCurrency(balanceSheet.liabilities.totalCurrentLiabilities)}</Text>
                </View>

                <Text style={{ ...styles.subsection, fontSize: 12, marginLeft: 10 }}>{t('financialReport.nonCurrentLiabilities')}</Text>
                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.loansPayable')}</Text>
                    <Text style={styles.value}>{formatCurrency(balanceSheet.liabilities.loansPayable)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('financialReport.totalNonCurrentLiabilities')}</Text>
                    <Text style={styles.boldValue}>{formatCurrency(balanceSheet.liabilities.totalNonCurrentLiabilities)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('financialReport.totalLiabilities')}</Text>
                    <Text style={styles.boldValue}>{formatCurrency(balanceSheet.liabilities.totalLiabilities)}</Text>
                </View>

                <Text style={styles.subsection}>{t('financialReport.equity')}</Text>
                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.authorizedCapital')}</Text>
                    <Text style={styles.value}>{formatCurrency(balanceSheet.equity.authorizedCapital)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.retainedEarnings')}</Text>
                    <Text style={styles.value}>{formatCurrency(balanceSheet.equity.retainedEarnings)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('financialReport.totalEquity')}</Text>
                    <Text style={styles.boldValue}>{formatCurrency(balanceSheet.equity.totalEquity)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('financialReport.totalLiabilitiesAndEquity')}</Text>
                    <Text style={styles.boldValue}>{formatCurrency(balanceSheet.totalLiabilitiesAndEquity)}</Text>
                </View>

                {/* Финансовые коэффициенты */}
                <Text style={styles.subtitle}>{t('financialReport.financialRatios')}</Text>

                <Text style={styles.subsection}>{t('financialReport.profitabilityRatios')}</Text>
                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.grossMargin')}</Text>
                    <Text style={styles.value}>{formatPercent(pnl.ratios.grossMargin)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.operatingMargin')}</Text>
                    <Text style={styles.value}>{formatPercent(pnl.ratios.operatingMargin)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.netMargin')}</Text>
                    <Text style={styles.value}>{formatPercent(pnl.ratios.netMargin)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.roa')}</Text>
                    <Text style={styles.value}>{formatPercent(pnl.ratios.roa)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.roe')}</Text>
                    <Text style={styles.value}>{formatPercent(pnl.ratios.roe)}</Text>
                </View>

                <Text style={styles.subsection}>{t('financialReport.liquidityRatios')}</Text>
                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.currentRatio')}</Text>
                    <Text style={styles.value}>{balanceSheet.ratios.currentRatio.toFixed(2)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.quickRatio')}</Text>
                    <Text style={styles.value}>{balanceSheet.ratios.quickRatio.toFixed(2)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.operatingCashFlowRatio')}</Text>
                    <Text style={styles.value}>{cashFlow.liquidity.operatingCashFlowRatio.toFixed(2)}</Text>
                </View>

                <Text style={styles.subsection}>{t('financialReport.debtRatios')}</Text>
                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.debtToEquity')}</Text>
                    <Text style={styles.value}>{balanceSheet.ratios.debtToEquity.toFixed(2)}</Text>
                </View>

                <Text style={styles.subsection}>{t('financialReport.efficiencyRatios')}</Text>
                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.assetTurnover')}</Text>
                    <Text style={styles.value}>{balanceSheet.ratios.assetTurnover.toFixed(2)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.indentedLabel}>{t('financialReport.cashConversionCycle')}</Text>
                    <Text style={styles.value}>{cashFlow.liquidity.cashConversionCycle.toFixed(0)} {t('financialReport.days')}</Text>
                </View>

                <Text style={styles.footer}>
                    {t('financialReport.generatedBy')} © FinSights AI {new Date().getFullYear()}
                </Text>
            </Page>
        </>
    );
};

const FinancialReportPDF: React.FC<FinancialReportPDFProps> = ({ report, dateRange }) => {
    const { t } = useTranslation();

    return (
        <div>
            <PDFViewer style={{ width: '100%', height: '80vh' }}>
                <FinancialReportContent report={report} dateRange={dateRange} t={t} />
            </PDFViewer>
        </div>
    );
};

export default FinancialReportPDF;