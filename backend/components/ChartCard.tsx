import React, { ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, Line } from 'recharts';

interface ChartCardProps {
    title: ReactNode;
    data: any[];
    series: { key: string; type: 'area' | 'line'; color: string; dashed?: boolean }[];
}

const formatNumber = (num: number) => new Intl.NumberFormat('ru-RU').format(Math.round(num));

const abbreviatedNumber = (num: number) => {
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return formatNumber(num);
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/80 backdrop-blur-sm p-3 rounded-lg border border-slate-700 shadow-lg animate-fade-in">
                <p className="font-bold text-slate-200 mb-2">{label}</p>
                {payload.map((pld: any) => (
                    <div key={pld.dataKey} className="flex items-center space-x-2 py-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pld.color }}></div>
                        <span className="font-medium text-sm" style={{ color: pld.color }}>
                            {pld.name}: <span className="font-bold">{formatNumber(pld.value)} ₸</span>
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const ChartCard: React.FC<ChartCardProps> = ({ title, data, series }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <>
            <div 
                className="relative group bg-slate-900/70 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl shadow-lg h-full flex flex-col cursor-pointer"
                onClick={() => setIsModalOpen(true)}
            >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                        <button 
                            className="text-slate-400 hover:text-white transition-colors"
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
                            <div className="w-full h-[280px]">
                        <ResponsiveContainer>
                            <ComposedChart data={data} margin={{ top: 10, right: 5, left: -20, bottom: 5 }}>
                                <defs>
                                    {series.map(s => 
                                        s.type === 'area' ? (
                                            <linearGradient key={`grad-${s.key}`} id={`color-${s.key.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={s.color} stopOpacity={0.6}/>
                                                <stop offset="95%" stopColor={s.color} stopOpacity={0.1}/>
                                            </linearGradient>
                                        ) : null
                                    )}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                <XAxis 
                                    dataKey="label" 
                                    stroke="#94a3b8" 
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickMargin={10}
                                />
                                <YAxis 
                                    stroke="#94a3b8" 
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    tickFormatter={abbreviatedNumber} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    width={60}
                                    tickMargin={5}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 3' }}/>
                                <Legend 
                                    verticalAlign="top"
                                    wrapperStyle={{ color: '#cbd5e1', fontSize: '12px', paddingBottom: '20px' }}
                                    iconType="circle"
                                    iconSize={8}
                                />
                                {series.map(s => {
                                    if (s.type === 'area') {
                                        return (
                                            <Area 
                                                key={s.key} 
                                                type="monotone" 
                                                dataKey={s.key} 
                                                stroke={s.color}
                                                strokeWidth={3}
                                                strokeDasharray={s.dashed ? '5 5' : 'none'}
                                                fillOpacity={1} 
                                                fill={s.dashed ? 'none' : `url(#color-${s.key.replace(/\s/g, '')})`}
                                                name={s.key}
                                                animationDuration={1500}
                                                activeDot={{ r: 8, strokeWidth: 0, fill: s.color }}
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
                                                strokeWidth={4} 
                                                strokeDasharray={s.dashed ? '5 5' : 'none'}
                                                dot={false}
                                                activeDot={{ r: 8, strokeWidth: 0, fill: s.color }}
                                                name={s.key}
                                                animationDuration={1500}
                                            />
                                        );
                                    }
                                    return null;
                                })}
                            </ComposedChart>
                        </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
             {isModalOpen && createPortal(
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-[95vw] h-[95vh] max-w-7xl max-h-[95vh] relative flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-4 pr-12">
                            <h3 className="text-2xl font-bold text-white">{title}</h3>
                            <button 
                                className="absolute top-4 right-4 z-[70] w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-2xl font-bold transition-colors duration-200"
                                onClick={() => setIsModalOpen(false)}
                                title="Закрыть"
                            >
                                ×
                            </button>
                        </div>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                                <defs>
                                    {series.map(s => 
                                        s.type === 'area' ? (
                                            <linearGradient key={`grad-modal-${s.key}`} id={`color-modal-${s.key.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={s.color} stopOpacity={0.7}/>
                                                <stop offset="95%" stopColor={s.color} stopOpacity={0.1}/>
                                            </linearGradient>
                                        ) : null
                                    )}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                <XAxis 
                                    dataKey="label" 
                                    stroke="#94a3b8" 
                                    tick={{ fill: '#94a3b8', fontSize: 14 }}
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickMargin={15}
                                />
                                <YAxis 
                                    stroke="#94a3b8" 
                                    tick={{ fill: '#94a3b8', fontSize: 14 }}
                                    tickFormatter={formatNumber} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    width={80}
                                    tickMargin={10}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 3' }}/>
                                <Legend 
                                    wrapperStyle={{ color: '#cbd5e1', fontSize: '14px', paddingTop: '20px' }}
                                    iconType="circle"
                                    iconSize={10}
                                />
                                {series.map(s => {
                                    if (s.type === 'area') {
                                        return (
                                            <Area 
                                                key={s.key} 
                                                type="monotone" 
                                                dataKey={s.key} 
                                                stroke={s.color}
                                                strokeWidth={3}
                                                strokeDasharray={s.dashed ? '5 5' : 'none'}
                                                fillOpacity={1} 
                                                fill={s.dashed ? 'none' : `url(#color-modal-${s.key.replace(/\s/g, '')})`}
                                                name={s.key}
                                                animationDuration={1500}
                                                activeDot={{ r: 8, strokeWidth: 2, fill: '#1e293b', stroke: s.color }}
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
                                                strokeWidth={4} 
                                                strokeDasharray={s.dashed ? '5 5' : 'none'}
                                                dot={false}
                                                activeDot={{ r: 8, strokeWidth: 2, fill: '#1e293b', stroke: s.color }}
                                                name={s.key}
                                                animationDuration={1500}
                                            />
                                        );
                                    }
                                    return null;
                                })}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>,
            document.body
            )}
        </>
    );
};

export default ChartCard;
