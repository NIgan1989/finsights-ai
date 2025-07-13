import React from 'react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, Line } from 'recharts';

interface ChartCardProps {
    title: string;
    data: any[];
    series: { key: string; type: 'area' | 'line'; color: string; dashed?: boolean }[];
}

const formatNumber = (num: number) => new Intl.NumberFormat('ru-RU').format(Math.round(num));

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface-accent p-3 rounded-lg border border-border shadow-lg">
                <p className="font-bold text-text-primary">{label}</p>
                {payload.map((pld: any) => (
                    <div key={pld.dataKey} style={{ color: pld.color }}>
                        {pld.name}: {formatNumber(pld.value)} ₸ 
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const ChartCard: React.FC<ChartCardProps> = ({ title, data, series }) => {
    return (
        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-border">
            <h3 className="text-xl font-bold text-text-primary mb-6">{title}</h3>
            <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                    <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                        <defs>
                            {series.map(s => (
                                s.type === 'area' && (
                                    <linearGradient key={`grad-${s.key}`} id={`color-${s.key.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={s.color} stopOpacity={0.7}/>
                                        <stop offset="95%" stopColor={s.color} stopOpacity={0}/>
                                    </linearGradient>
                                )
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-chart-grid))" />
                        <XAxis dataKey="label" stroke="hsl(var(--color-chart-axis))" />
                        <YAxis stroke="hsl(var(--color-chart-axis))" tickFormatter={formatNumber} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--color-chart-axis))', strokeWidth: 1, strokeDasharray: '3 3' }}/>
                        <Legend wrapperStyle={{ color: 'hsl(var(--color-text-secondary))' }}/>
                        {series.map(s => {
                            if (s.type === 'area') {
                                return (
                                    <Area 
                                        key={s.key} 
                                        type="monotone" 
                                        dataKey={s.key} 
                                        stroke={s.color}
                                        strokeWidth={2}
                                        strokeDasharray={s.dashed ? '5 5' : 'none'}
                                        fillOpacity={1} 
                                        fill={s.dashed ? 'none' : `url(#color-${s.key.replace(/\s/g, '')})`}
                                        name={s.key}
                                    />
                                );
                            }
                            if (s.type === 'line') {
                                return (
                                    <Line 
                                        key={s.key} 
                                        type="monotone" 
                                        dataKey={s.key} 
                                        stroke={s.color} 
                                        strokeWidth={3} 
                                        strokeDasharray={s.dashed ? '5 5' : 'none'}
                                        dot={false}
                                        activeDot={{ r: 6 }}
                                        name={s.key}
                                    />
                                );
                            }
                            return null;
                        })}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ChartCard;