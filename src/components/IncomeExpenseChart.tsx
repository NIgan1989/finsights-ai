import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useTheme } from '@mui/material/styles';
import { formatCurrency } from '../utils/formatting';

interface IncomeExpenseChartProps {
    data: { name: string; income: number; expense: number }[];
}

const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ data }) => {
    const theme = useTheme();

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.text.secondary} strokeOpacity={0.2} />
                <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} tickFormatter={(tick) => formatCurrency(tick as number)} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '12px',
                    }}
                    formatter={(value) => formatCurrency(value as number)}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                />
                <Legend wrapperStyle={{ color: theme.palette.text.primary }} />
                <Bar dataKey="income" fill={theme.palette.primary.main} name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill={theme.palette.secondary.main} name="Expense" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default IncomeExpenseChart; 