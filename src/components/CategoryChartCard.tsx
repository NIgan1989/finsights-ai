import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useTheme } from '@mui/material/styles';
import { formatCurrency } from '../utils/formatting';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface CategoryChartCardProps {
    data: { name: string; value: number }[];
}

const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
    '#AF19FF', '#FF1943', '#19D7FF', '#FFD719'
];

const CategoryChartCard: React.FC<CategoryChartCardProps> = ({ data }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <Box sx={{ height: 400 }}>
            <Typography variant="h6" gutterBottom>
                {t('expense_by_category')}
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.secondary.main}`,
                            borderRadius: '12px',
                        }}
                        formatter={(value) => formatCurrency(value as number)}
                    />
                    <Legend />
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={'80%'}
                        fill="#8884d8"
                        labelLine={false}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default CategoryChartCard;