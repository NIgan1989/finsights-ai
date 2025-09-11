
import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { createPortal } from 'react-dom';
import { formatNumber } from '../../utils/formatUtils';

type CategoryData = {
    name: string;
    value: number;
};

type CategoryChartCardProps = {
    data: CategoryData[];
    title: string;
};

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
  'var(--chart-9)',
  'var(--chart-10)'
];

const formatNumberLocal = (value: number) => {
    if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return formatNumber(Math.round(value));
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        return (
            <div className="bg-popover backdrop-blur-md p-4 rounded-xl shadow-2xl border-2 border-border">
                <p className="font-bold text-lg mb-1 text-popover-foreground">{data.name}</p>
                <p style={{ color: data.payload.fill }} className="text-base font-semibold">
                    {formatNumberLocal(data.value)}
                </p>
                <p className="text-sm text-muted-foreground">{`Доля: ${(data.payload.percent * 100).toFixed(2)}%`}</p>
            </div>
        );
    }
    return null;
};

const CategoryChartCard = ({ data, title }: CategoryChartCardProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div 
                className="relative group bg-chart-card backdrop-blur-xl border border-border p-6 rounded-2xl shadow-lg h-full flex flex-col cursor-pointer"
                onClick={() => setIsModalOpen(true)}
            >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-foreground">{title}</h3>
                        <button 
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                            title="Развернуть"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-grow flex flex-col">
                        <div className="flex-1 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height={280} minWidth={300} minHeight={280}>
                                <PieChart>
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted) / 0.5' }} />
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={90}
                                        innerRadius={60}
                                        fill="var(--primary)"
                                        dataKey="value"
                                        nameKey="name"
                                        animationDuration={1500}
                                        strokeWidth={2}
                                        stroke={'var(--chart-line-primary)'}
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        
                        {/* Компактная легенда внизу */}
                        <div className="mt-4 pt-4 border-t border-border">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                                {data.slice(0, 8).map((entry, index) => (
                                    <div key={`legend-${index}`} className="flex items-center gap-2 text-muted-foreground">
                                        <div 
                                            className="w-3 h-3 rounded-full flex-shrink-0" 
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        ></div>
                                        <span className="truncate" title={entry.name}>
                                            {entry.name.length > 12 ? `${entry.name.substring(0, 12)}...` : entry.name}
                                        </span>
                                    </div>
                                ))}
                                {data.length > 8 && (
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                        <span>+{data.length - 8} еще</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {isModalOpen && createPortal(
                <div className="fixed inset-0 bg-card/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-chart-card border border-border p-6 rounded-xl w-[95vw] h-[95vh] max-w-7xl max-h-[95vh] relative flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="mb-4 pr-12">
                        <h3 className="text-2xl font-bold text-foreground">{title}</h3>
                        <button 
                            className="absolute top-4 right-4 z-[70] w-9 h-9 flex items-center justify-center rounded-full bg-card hover:bg-card/80 text-muted-foreground hover:text-foreground text-2xl font-bold transition-colors duration-200"
                                onClick={() => setIsModalOpen(false)}
                                title="Закрыть"
                            >
                                ×
                            </button>
                        </div>
                        <div className="flex-1 flex flex-col">
                            <div className="flex-1 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="70%" minWidth={400} minHeight={300}>
                                    <PieChart>
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} />
                                        <Pie
                                            data={data}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={'60%'}
                                            innerRadius={'35%'}
                                            fill="var(--chart-1)"
                                            dataKey="value"
                                            nameKey="name"
                                            animationDuration={1500}
                                            strokeWidth={3}
                                            stroke={'var(--chart-line-primary)'}
                                        >
                                            {data.map((entry, index) => (
                                                <Cell key={`cell-modal-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            
                            {/* Расширенная легенда для модального окна */}
                            <div className="mt-6 pt-6 border-t border-border">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                    {data.map((entry, index) => (
                                        <div key={`modal-legend-${index}`} className="flex items-center gap-3 text-foreground">
                                            <div 
                                                className="w-4 h-4 rounded-full flex-shrink-0" 
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            ></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate" title={entry.name}>
                                                    {entry.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {formatNumberLocal(entry.value)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default CategoryChartCard;
