import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { formatNumber, formatCurrency as formatCurrencyUtil } from '../../utils/formatUtils.ts';

interface WaterfallDataPoint {
  name: string;
  value: number;
  isTotal?: boolean;
}

interface WaterfallChartProps {
  data: WaterfallDataPoint[];
  width?: number;
  height?: number;
  colorScheme?: 'cashflow' | 'balance';
  title?: string;
}

const formatCurrency = (value: number) => formatCurrencyUtil(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const originalValue = payload[0]?.payload?.originalValue ?? payload[1]?.payload?.originalValue ?? 0;
    return (
      <div style={{
        background: '#1e293b',
        color: '#fff',
        padding: 8,
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        border: '1px solid #334155',
        minWidth: 100
      }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{label}</div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{formatCurrency(originalValue)}</div>
      </div>
    );
  }
  return null;
};

const COLOR_SCHEMES = {
  cashflow: {
    'Операции': '#22c55e', // зелёный
    'Инвестиции': '#fbbf24', // оранжевый
    'Финансы': '#a78bfa', // фиолетовый
    'Итого': '#2563eb', // насыщенный синий
  },
  balance: {
    'Активы': '#22c55e', // зелёный
    'Обязательства': '#ef4444', // красный
    'Капитал': '#3b82f6', // синий
    'Итого': '#2563eb', // насыщенный синий
  },
  default: {
    up: '#22c55e',
    down: '#ef4444',
    total: '#2563eb',
    other: '#64748b',
  }
};

const WaterfallChart: React.FC<WaterfallChartProps> = ({ data, width = '100%', height = 300, colorScheme = 'cashflow', title = 'Водопадная диаграмма' }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Обработка данных: отрицательные значения показываем как положительные столбцы,
  // но сохраняем исходное значение для тултипов и подписей
  const processedData = data.map((point) => ({
    ...point,
    originalValue: point.value, // сохраняем исходное значение
    value: Math.abs(point.value) // для отображения используем абсолютное значение
  }));

  const scheme = COLOR_SCHEMES[colorScheme] as Record<string, string>;
  const getBarColor = (entry: any) => {
    if (entry.isTotal) return scheme['Итого'] || COLOR_SCHEMES.default.total;
    const name = entry && entry.name ? String(entry.name) : '';
    if (name && Object.prototype.hasOwnProperty.call(scheme, name)) return scheme[name];
    const sign = typeof entry.originalValue === 'number' ? entry.originalValue : entry.value;
    return sign >= 0 ? COLOR_SCHEMES.default.up : COLOR_SCHEMES.default.down;
  };

  return (
    <>
    <div 
      className="relative group bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-lg cursor-pointer h-full flex flex-col"
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
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
      <ResponsiveContainer width={width} height={height} minWidth={300} minHeight={300}>
        <BarChart
          data={processedData}
          margin={{ top: 10, right: 5, left: -20, bottom: 5 }}
          barSize={Math.min(35, 250 / processedData.length)}
          onMouseMove={state => {
            if (state && state.activeTooltipIndex !== undefined && state.activeTooltipIndex !== null) {
              setActiveIndex(state.activeTooltipIndex);
            }
          }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" tickFormatter={(value) => {
            const v = Number(value);
            if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + 'M';
            if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + 'K';
            return formatNumber(Math.round(v));
          }} tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={60} domain={[0, 'dataMax']} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,116,139,0.08)' }} />
          <Bar dataKey="value" radius={[8, 8, 8, 8]} isAnimationActive={false}>
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
            ))}
            <LabelList dataKey="value" content={({ x = 0, y = 0, width = 0, height = 0, value, index }) => {
              if (typeof index !== 'number' || index < 0 || index >= processedData.length) return null;
              const bar = processedData[index];
              if (!bar) return null;
              // Определяем положение подписи по исходному знаку
              const isPositiveOriginal = Number(bar.originalValue) >= 0;
              const xNum = Number(x);
              const yNum = Number(y);
              const widthNum = Number(width);
              const heightNum = Number(height);
              const labelY = isPositiveOriginal ? yNum - 10 : yNum + Math.abs(heightNum) + 22;
              const labelColor = '#94a3b8';
              const original = Number(bar.originalValue) || 0;
              return (
                <text
                  x={xNum + widthNum / 2}
                  y={labelY}
                  fill={labelColor}
                  fontWeight={bar.isTotal ? 'bold' : 'normal'}
                  fontSize={bar.isTotal ? 16 : 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {formatCurrency(original)}
                </text>
              );
            }} />
          </Bar>
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.10" />
            </filter>
          </defs>
        </BarChart>
      </ResponsiveContainer>
          </div>
          {/* Легенда */}
          <div className="flex justify-center gap-4 mt-3 text-xs text-slate-300">
            {Object.entries(scheme).map(([key, color]: [string, string]) => (
              key !== 'other' && <div key={key} className={`flex items-center gap-1${key === 'Итого' ? ' font-bold' : ''}`}><span style={{width:10,height:10,background:color,display:'inline-block',borderRadius:2}}></span> {key}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
    
    {/* Модальное окно */}
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
            <ResponsiveContainer width="100%" height="100%" minWidth={400} minHeight={400}>
              <BarChart
                data={processedData}
                margin={{ top: 20, right: 30, left: 0, bottom: 40 }}
                barSize={Math.min(80, 600 / processedData.length)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 14, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickMargin={15} />
                <YAxis stroke="#94a3b8" tickFormatter={(v:number)=>formatCurrency(v)} tick={{ fontSize: 14, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={80} tickMargin={10} domain={[0, 'dataMax']} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,116,139,0.08)' }} />
                
                <Bar dataKey="value" radius={[8, 8, 8, 8]} isAnimationActive={false}>
                  {processedData.map((entry, index) => (
                    <Cell key={`cell-modal-${index}`} fill={getBarColor(entry)} />
                  ))}
                  <LabelList dataKey="value" content={({ x = 0, y = 0, width = 0, height = 0, value, index }) => {
                    if (typeof index !== 'number' || index < 0 || index >= processedData.length) return null;
                    const bar = processedData[index];
                    if (!bar) return null;
                    const isPositive = Number(value) >= 0;
                    const xNum = Number(x);
                    const yNum = Number(y);
                    const widthNum = Number(width);
                    const heightNum = Number(height);
                    const labelY = isPositive ? yNum - 8 : yNum + Math.abs(heightNum) + 18;
                    const labelColor = '#94a3b8';
                    return (
                      <text
                        x={xNum + widthNum / 2}
                        y={labelY}
                        fill={labelColor}
                        fontWeight={bar.isTotal ? 'bold' : 'normal'}
                        fontSize={bar.isTotal ? 16 : 14}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {formatCurrency(Number(value) || 0)}
                      </text>
                    );
                  }} />
                </Bar>
                <defs>
                  <filter id="shadow-modal" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.10" />
                  </filter>
                </defs>
              </BarChart>
            </ResponsiveContainer>
            {/* Легенда в модальном окне */}
            <div className="flex justify-center gap-6 mt-4 text-sm text-slate-300">
              {Object.entries(scheme).map(([key, color]: [string, string]) => (
                key !== 'other' && <div key={key} className={`flex items-center gap-2${key === 'Итого' ? ' font-bold' : ''}`}><span style={{width:14,height:14,background:color,display:'inline-block',borderRadius:3}}></span> {key}</div>
              ))}
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default WaterfallChart;
