
import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface CategoryChartCardProps {
    data: { name: string; value: number }[];
}

const COLORS = ['#3b82f6', '#ef4444', '#f97316', '#eab308', '#8b5cf6', '#ec4899', '#14b8a6', '#6b7280', '#d946ef', '#22c55e', '#a855f7', '#06b6d4'];

const formatNumber = (num: number) => new Intl.NumberFormat('ru-RU').format(Math.round(num));

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        const percent = (data.payload.percent * 100).toFixed(1);
        return (
            <div className="bg-surface-accent p-3 rounded-lg border border-border shadow-lg">
                <p className="font-bold text-text-primary">{data.name}</p>
                <p style={{ color: data.payload.fill }}>
                    {formatNumber(data.value)} ₸ ({percent}%)
                </p>
            </div>
        );
    }
    return null;
};


const CategoryChartCard: React.FC<CategoryChartCardProps> = ({ data }) => {
    
    const totalExpenses = useMemo(() => data.reduce((sum, entry) => sum + entry.value, 0), [data]);

    return (
        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-border h-full flex flex-col">
            <div className="flex justify-between items-baseline mb-6">
                <h3 className="text-xl font-bold text-text-primary">Расходы по категориям</h3>
                <span className="text-lg font-semibold text-text-secondary">{formatNumber(totalExpenses)} ₸</span>
            </div>
            <div className="w-full flex-grow" style={{ minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius="90%"
                            innerRadius="60%"
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            paddingAngle={2}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            iconType="circle"
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                            wrapperStyle={{ paddingLeft: '20px', color: 'hsl(var(--color-text-secondary))', fontSize: '14px' }}
                            formatter={(value) => value}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CategoryChartCard;
