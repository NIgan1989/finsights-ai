import { Transaction } from '../types';

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
        const month = new Date(tx.date).toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!monthlyData[month]) {
            monthlyData[month] = 0;
        }
        monthlyData[month] += (tx.type === 'income' ? tx.amount : -tx.amount);
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
        const dateA = new Date(`01 ${a}`);
        const dateB = new Date(`01 ${b}`);
        return dateA.getTime() - dateB.getTime();
    });

    return sortedMonths.map(month => ({
        name: month,
        cashFlow: monthlyData[month],
    }));
};


export const getMonthlyIncomeExpense = (transactions: Transaction[]) => {
    const monthlyData: { [key: string]: { income: number, expense: number } } = {};
    transactions.forEach(tx => {
        const month = new Date(tx.date).toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!monthlyData[month]) {
            monthlyData[month] = { income: 0, expense: 0 };
        }
        if (tx.type === 'income') {
            monthlyData[month].income += tx.amount;
        } else {
            monthlyData[month].expense += tx.amount;
        }
    });

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
        const dateA = new Date(`01 ${a}`);
        const dateB = new Date(`01 ${b}`);
        return dateA.getTime() - dateB.getTime();
    });

    return sortedMonths.map(month => ({
        name: month,
        income: monthlyData[month].income,
        expense: monthlyData[month].expense,
    }));
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