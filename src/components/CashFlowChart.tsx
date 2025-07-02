import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useTheme } from '@mui/material/styles';
import { formatCurrency } from '../utils/formatting';

interface CashFlowChartProps {
    data: { name: string; cashFlow: number }[];
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ data }) => {
    const theme = useTheme();

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorCashFlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.text.secondary} strokeOpacity={0.2} />
                <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} tickFormatter={(tick) => formatCurrency(tick as number)} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.primary.main}`,
                        borderRadius: '12px',
                    }}
                    formatter={(value) => [formatCurrency(value as number), 'Cash Flow']}
                />
                <Area type="monotone" dataKey="cashFlow" stroke={theme.palette.primary.main} fillOpacity={1} fill="url(#colorCashFlow)" />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default CashFlowChart; 