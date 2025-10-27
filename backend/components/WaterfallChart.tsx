import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { formatNumber, formatCurrency as formatCurrencyUtil } from '../../utils/formatUtils';
// Цветовые схемы для графиков с использованием CSS переменных
const COLOR_SCHEMES = {
  default: {
    up: 'hsl(var(--success))',
    down: 'hsl(var(--destructive))',
    total: 'hsl(var(--primary))'
  },
  blue: {
    'Операционный доход': 'hsl(var(--primary))',
    'Зарплата': 'hsl(var(--destructive))',
    'Аренда': 'hsl(var(--warning))',
    'Закупка товаров': 'hsl(var(--accent))',
    'Итого': 'hsl(var(--primary))'
  },
  green: {
    'Операционный доход': 'hsl(var(--success))',
    'Зарплата': 'hsl(var(--destructive))',
    'Аренда': 'hsl(var(--warning))',
    'Закупка товаров': 'hsl(var(--accent))',
    'Итого': 'hsl(var(--success))'
  },
  purple: {
    'Операционный доход': 'hsl(var(--accent))',
    'Зарплата': 'hsl(var(--destructive))',
    'Аренда': 'hsl(var(--warning))',
    'Закупка товаров': 'hsl(var(--info))',
    'Итого': 'hsl(var(--accent))'
  },
  cashflow: {
    'Операционный доход': 'hsl(var(--success))',
    'Зарплата': 'hsl(var(--destructive))',
    'Аренда': 'hsl(var(--warning))',
    'Закупка товаров': 'hsl(var(--accent))',
    'Налоги': 'hsl(var(--warning))',
    'Итого': 'hsl(var(--primary))'
  },
  balance: {
    'Активы': 'hsl(var(--success))',
    'Обязательства': 'hsl(var(--destructive))',
    'Капитал': 'hsl(var(--primary))'
  }
};

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
        background: 'var(--popover)',
        color: 'var(--popover-foreground)',
        padding: 12,
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: '2px solid var(--border)',
        minWidth: 120,
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{label}</div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{formatCurrency(originalValue)}</div>
      </div>
    );
  }
  return null;
};

// Цветовые схемы теперь импортируются из config/theme.config.ts

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

  const scheme = COLOR_SCHEMES[colorScheme as keyof typeof COLOR_SCHEMES] as Record<string, string>;
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
      className="relative group bg-chart-card backdrop-blur-xl border border-border rounded-2xl p-4 shadow-lg cursor-pointer h-full flex flex-col"
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
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-line-grid)" opacity={0.4} />
          <XAxis dataKey="name" stroke="var(--chart-line-axis)" tick={{ fontSize: 12, fill: 'var(--chart-line-axis)' }} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--chart-line-axis)" tickFormatter={(value) => {
            const v = Number(value);
            if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + 'M';
            if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + 'K';
            return formatNumber(Math.round(v));
          }} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={60} domain={[0, 'dataMax']} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted) / 0.08' }} />
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
              const labelColor = 'var(--muted-foreground)';
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
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="var(--shadow)" floodOpacity="0.10" />
            </filter>
          </defs>
        </BarChart>
      </ResponsiveContainer>
          </div>
          {/* Легенда */}
          <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
            {Object.entries(scheme).map(([key, color]: [string, string]) => (
              key !== 'other' && <div key={key} className={`flex items-center gap-1${key === 'Итого' ? ' font-bold' : ''}`}><span style={{width:10,height:10,background:color,display:'inline-block',borderRadius:2}}></span> {key}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
    
    {/* Модальное окно */}
    {isModalOpen && createPortal(
      <div className="fixed inset-0 bg-card/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
        <div className="bg-modal-card border border-border p-6 rounded-xl w-[95vw] h-[95vh] max-w-7xl max-h-[95vh] relative flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 pr-12">
            <h3 className="text-2xl font-bold text-foreground">{title}</h3>
            <button 
              className="absolute top-4 right-4 z-[70] w-9 h-9 flex items-center justify-center rounded-full bg-surface-elevated hover:bg-surface-hover text-muted-foreground hover:text-foreground text-2xl font-bold transition-colors duration-200"
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
                <CartesianGrid strokeDasharray="3 3" stroke="var(--muted-foreground)" opacity={0.3} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" tick={{ fontSize: 14, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} tickMargin={15} />
                <YAxis stroke="var(--muted-foreground)" tickFormatter={(v:number)=>formatCurrency(v)} tick={{ fontSize: 14, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={80} tickMargin={10} domain={[0, 'dataMax']} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted) / 0.08' }} />
                
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
                    const labelColor = 'var(--muted-foreground)';
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
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="var(--shadow)" floodOpacity="0.10" />
                  </filter>
                </defs>
              </BarChart>
            </ResponsiveContainer>
            {/* Легенда в модальном окне */}
            <div className="flex justify-center gap-6 mt-4 text-sm text-muted-foreground">
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
