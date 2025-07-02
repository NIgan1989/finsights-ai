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
        const d = new Date(tx.date);
        if (isNaN(d.getTime())) return; // skip invalid
        const monthKey = d.toISOString().slice(0,7); // YYYY-MM
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
        const monthKey = d.toISOString().slice(0,7); // YYYY-MM
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