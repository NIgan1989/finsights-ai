import { Transaction, FinancialReport } from '../types';

export const calculateSummary = (transactions: Transaction[]) => {
    let revenue = 0;
    let expenses = 0;

    transactions.forEach(tx => {
        if (tx.type === 'income') {
            revenue += tx.amount;
        } else {
            expenses += tx.amount;
        }
    });

    return {
        revenue,
        expenses,
        net: revenue - expenses,
    };
};

export const getMonthlyCashFlow = (transactions: Transaction[]) => {
    const monthlyData: { [key: string]: number } = {};
    transactions.forEach(tx => {
        const d = new Date(tx.date);
        if (isNaN(d.getTime())) return; // skip invalid
        const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = 0;
        }
        monthlyData[monthKey] += (tx.type === 'income' ? tx.amount : -tx.amount);
    });

    const sortedKeys = Object.keys(monthlyData).sort();

    return sortedKeys.map(key => {
        const label = new Date(`${key}-01`).toLocaleDateString('default', { month: 'short', year: '2-digit' });
        return {
            name: label,
            cashFlow: monthlyData[key],
        };
    });
};

export const getMonthlyIncomeExpense = (transactions: Transaction[]) => {
    const monthlyData: { [key: string]: { income: number, expense: number } } = {};
    transactions.forEach(tx => {
        const d = new Date(tx.date);
        if (isNaN(d.getTime())) return; // skip invalid
        const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expense: 0 };
        }
        if (tx.type === 'income') {
            monthlyData[monthKey].income += tx.amount;
        } else {
            monthlyData[monthKey].expense += tx.amount;
        }
    });

    const sortedKeys = Object.keys(monthlyData).sort();

    return sortedKeys.map(key => {
        const label = new Date(`${key}-01`).toLocaleDateString('default', { month: 'short', year: '2-digit' });
        return {
            name: label,
            income: monthlyData[key].income,
            expense: monthlyData[key].expense,
        };
    });
};

export const getExpenseByCategory = (transactions: Transaction[]) => {
    const categoryData: { [key: string]: number } = {};
    transactions.filter(tx => tx.type === 'expense').forEach(tx => {
        const category = tx.category || 'Uncategorized';
        if (!categoryData[category]) {
            categoryData[category] = 0;
        }
        categoryData[category] += tx.amount;
    });

    return Object.keys(categoryData).map(category => ({
        name: category,
        value: categoryData[category],
    })).sort((a, b) => b.value - a.value);
};

// New function for tax calculations specifically for Kazakhstan
export const getTaxEstimates = (
    transactions: Transaction[],
    financialReport: FinancialReport
) => {
    // Calculate total revenue and expenses
    const revenue = financialReport.pnl.totalRevenue;
    const netProfit = financialReport.pnl.netProfit;

    // Corporate Income Tax (CIT) - Standard rate in Kazakhstan is 20%
    const incomeTaxEstimate = netProfit * 0.2;

    // Value Added Tax (VAT) - Standard rate in Kazakhstan is 12%
    // Not all businesses are VAT payers, but we'll calculate it anyway
    const vatPayable = revenue * 0.12;

    // Social Tax - Based on employee count/salary (simplified calculation)
    // Using 3.5% of revenue as an estimate for a typical business
    const socialTax = revenue * 0.035;

    // Mandatory Pension Contributions - 10% of salary (simplified)
    // Using 5% of revenue as an estimate for pension contributions
    const pensionContributions = revenue * 0.05;

    // Property Tax - 1.5% of average annual value of fixed assets
    // Using a simplified calculation based on balance sheet
    const propertyTax = financialReport.balanceSheet.assets.equipment * 0.015;

    // Simplified tax regimes - for small businesses (SMEs)
    // 3% of revenue for simplified tax regime
    const simplifiedTaxRegime = revenue * 0.03;

    // Calculate monthly tax provisions
    const monthlyTaxProvision = incomeTaxEstimate / 12;

    // Tax calendar - important dates for tax filings in Kazakhstan
    const taxCalendar = [
        { name: 'CIT - Quarterly Advance Payments', date: '25th of each month' },
        { name: 'VAT Payment & Declaration', date: 'By 25th of the following month' },
        { name: 'Individual Income Tax & Social Tax', date: 'By 25th of the following month' },
        { name: 'Annual CIT Declaration', date: 'March 31' },
        { name: 'Property Tax Declaration', date: 'February 15' }
    ];

    // Business optimization - tax advice
    const taxOptimizationAdvice = [
        'Consider using investment tax preferences for equipment purchases',
        'Review expense categories to maximize allowable deductions',
        'Evaluate eligibility for special economic zone tax benefits',
        'Consider simplified tax regime if eligible (revenue < 25M tenge)'
    ];

    return {
        vatPayable,
        incomeTaxEstimate,
        socialTax,
        pensionContributions,
        propertyTax,
        simplifiedTaxRegime,
        monthlyTaxProvision,
        taxCalendar,
        taxOptimizationAdvice
    };
};

// New function for business metrics calculation
export const getBusinessMetrics = (
    transactions: Transaction[],
    financialReport: FinancialReport
) => {
    // Basic transaction analytics
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const avgTransactionValue = incomeTransactions.length > 0
        ? incomeTransactions.reduce((sum, t) => sum + t.amount, 0) / incomeTransactions.length
        : 0;

    const avgExpenseValue = expenseTransactions.length > 0
        ? expenseTransactions.reduce((sum, t) => sum + t.amount, 0) / expenseTransactions.length
        : 0;

    // Cash balance
    const cashBalance = financialReport.pnl.totalRevenue -
        (financialReport.pnl.costOfGoodsSold + financialReport.pnl.totalOperatingExpenses);

    // Days with transactions
    const uniqueDays = new Set(transactions.map(t => t.date.substring(0, 10)));
    const daysWithTransactions = uniqueDays.size;

    // Top expense categories
    const expenseByCategory = getExpenseByCategory(transactions);
    const topExpenseCategories = expenseByCategory.slice(0, 5);

    // Cash flow consistency
    const monthlyCashFlow = getMonthlyCashFlow(transactions);
    const cashFlowVariability = monthlyCashFlow.length > 1
        ? calculateStandardDeviation(monthlyCashFlow.map(m => m.cashFlow))
        : 0;

    // Expense to revenue ratio
    const expenseToRevenueRatio = financialReport.pnl.totalRevenue > 0
        ? (financialReport.pnl.costOfGoodsSold + financialReport.pnl.totalOperatingExpenses) / financialReport.pnl.totalRevenue
        : 0;

    // Business growth metrics
    const monthlyRevenue = getMonthlyIncomeExpense(transactions);
    const revenueGrowthRate = calculateGrowthRate(monthlyRevenue.map(m => m.income));

    // Business recommendations based on metrics
    const recommendations = generateBusinessRecommendations({
        expenseToRevenueRatio,
        cashFlowVariability,
        revenueGrowthRate,
        topExpenseCategories
    });

    return {
        avgTransactionValue,
        avgExpenseValue,
        topExpenseCategories,
        cashBalance,
        daysWithTransactions,
        cashFlowVariability,
        expenseToRevenueRatio,
        revenueGrowthRate,
        recommendations
    };
};

// Helper function to calculate standard deviation
const calculateStandardDeviation = (values: number[]) => {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
};

// Helper function to calculate growth rate
const calculateGrowthRate = (values: number[]) => {
    if (values.length < 2) return 0;

    // Filter out zero values to avoid division by zero
    const nonZeroValues = values.filter(v => v > 0);
    if (nonZeroValues.length < 2) return 0;

    const firstValue = nonZeroValues[0];
    const lastValue = nonZeroValues[nonZeroValues.length - 1];

    return ((lastValue - firstValue) / firstValue) * 100;
};

// Helper function to generate business recommendations
const generateBusinessRecommendations = (metrics: any) => {
    const recommendations = [];

    if (metrics.expenseToRevenueRatio > 0.7) {
        recommendations.push('Высокие расходы относительно выручки. Рассмотрите возможность оптимизации затрат.');
    }

    if (metrics.cashFlowVariability > 0.3 * Math.abs(metrics.cashFlowVariability)) {
        recommendations.push('Нестабильный денежный поток. Рассмотрите стратегии стабилизации доходов.');
    }

    if (metrics.revenueGrowthRate < 0) {
        recommendations.push('Отрицательный рост выручки. Необходимо пересмотреть стратегию продаж или маркетинга.');
    }

    if (metrics.topExpenseCategories && metrics.topExpenseCategories[0]?.value > metrics.expenseToRevenueRatio * 0.5) {
        recommendations.push(`Категория "${metrics.topExpenseCategories[0]?.name}" составляет значительную часть расходов. Рассмотрите возможность оптимизации.`);
    }

    // Add general recommendations if specific ones are not enough
    if (recommendations.length < 2) {
        recommendations.push('Рассмотрите возможность диверсификации источников дохода для повышения финансовой устойчивости.');
        recommendations.push('Создайте резервный фонд в размере не менее 3-месячных операционных расходов.');
    }

    return recommendations;
};

// Add quarterly and yearly data aggregation
export const aggregateDataByPeriod = (
    data: { name: string, income?: number, expense?: number, cashFlow?: number }[],
    period: 'monthly' | 'quarterly' | 'yearly'
) => {
    if (period === 'monthly' || data.length <= 3) {
        return data; // Return original data for monthly view or if there's too little data
    }

    const aggregated: { [key: string]: { income: number, expense: number, cashFlow: number } } = {};

    data.forEach(item => {
        // Parse date from "Jan'23" format or similar
        const dateParts = item.name.split("'");
        const month = dateParts[0].trim();
        const year = '20' + (dateParts[1] || new Date().getFullYear().toString().substr(2));

        let periodKey: string;

        if (period === 'quarterly') {
            // Get quarter from month name
            const monthToQuarterMap: { [key: string]: number } = {
                'Jan': 1, 'Feb': 1, 'Mar': 1,
                'Apr': 2, 'May': 2, 'Jun': 2,
                'Jul': 3, 'Aug': 3, 'Sep': 3,
                'Oct': 4, 'Nov': 4, 'Dec': 4
            };
            const quarter = monthToQuarterMap[month.substring(0, 3)] || 1;
            periodKey = `Q${quarter}'${year.substring(2)}`;
        } else {
            // Yearly
            periodKey = year;
        }

        if (!aggregated[periodKey]) {
            aggregated[periodKey] = { income: 0, expense: 0, cashFlow: 0 };
        }

        if (item.income !== undefined) aggregated[periodKey].income += item.income;
        if (item.expense !== undefined) aggregated[periodKey].expense += item.expense;
        if (item.cashFlow !== undefined) aggregated[periodKey].cashFlow += item.cashFlow;
    });

    // Convert back to array and sort
    return Object.keys(aggregated).map(key => ({
        name: key,
        income: aggregated[key].income,
        expense: aggregated[key].expense,
        cashFlow: aggregated[key].cashFlow
    })).sort((a, b) => {
        // Sort by year and quarter/month
        const aYear = parseInt(a.name.split("'")[1] || '0');
        const bYear = parseInt(b.name.split("'")[1] || '0');

        if (aYear !== bYear) return aYear - bYear;

        // If quarters, sort by quarter number
        if (a.name.startsWith('Q') && b.name.startsWith('Q')) {
            return parseInt(a.name[1]) - parseInt(b.name[1]);
        }

        return 0;
    });
}; 