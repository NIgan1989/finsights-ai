import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LabelList } from 'recharts';

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
}

const formatCurrency = (value: number) => {
  const formatted = new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
  return formatted + ' KZT'; // неразрывный пробел
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
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
        <div style={{ fontWeight: 600, fontSize: 14 }}>{formatCurrency(payload[0].value)}</div>
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

const WaterfallChart: React.FC<WaterfallChartProps> = ({ data, width = '100%', height = 300, colorScheme = 'cashflow' }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  let cumulative = 0;
  const processedData = data.map((point) => {
    const start = cumulative;
    cumulative += point.value;
    return { ...point, start, end: cumulative };
  });

  const scheme = COLOR_SCHEMES[colorScheme] as Record<string, string>;
  const getBarColor = (entry: any) => {
    if (entry.isTotal) return scheme['Итого'] || COLOR_SCHEMES.default.total;
    const name = entry && entry.name ? String(entry.name) : '';
    if (name && Object.prototype.hasOwnProperty.call(scheme, name)) return scheme[name];
    return entry.value >= 0 ? COLOR_SCHEMES.default.up : COLOR_SCHEMES.default.down;
  };

  return (
    <div className="bg-surface rounded-2xl p-4 shadow-lg border border-border" style={{background: 'rgba(40,60,100,0.10)'}}> {/* светлый фон */}
      <ResponsiveContainer width={width} height={height}>
        <BarChart
          data={processedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barSize={Math.min(40, 300 / processedData.length)}
          onMouseMove={state => {
            if (state && state.activeTooltipIndex !== undefined && state.activeTooltipIndex !== null) {
              setActiveIndex(state.activeTooltipIndex);
            }
          }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={COLOR_SCHEMES.default.other} />
          <XAxis dataKey="name" stroke={COLOR_SCHEMES.default.other} tick={{ fontSize: 14, fill: COLOR_SCHEMES.default.other }} />
          <YAxis stroke={COLOR_SCHEMES.default.other} tickFormatter={formatCurrency} tick={{ fontSize: 14, fill: COLOR_SCHEMES.default.other }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,116,139,0.08)' }} />
          <Bar dataKey="value" radius={[8, 8, 8, 8]} isAnimationActive={false} fill="#8884d8">
            <LabelList dataKey="value" content={({ x = 0, y = 0, width = 0, height = 0, value, index }) => {
              if (typeof index !== 'number' || index < 0 || index >= processedData.length) return null;
              const bar = processedData[index];
              if (!bar) return null;
              const barColor = getBarColor(bar);
              const isPositive = Number(value) >= 0;
              const xNum = Number(x);
              const yNum = Number(y);
              const widthNum = Number(width);
              const heightNum = Number(height);
              // Стандартное положение подписи: над положительным столбцом, под отрицательным
              const labelY = isPositive ? yNum - 8 : yNum + Math.abs(heightNum) + 18;
              const labelColor = isPositive && heightNum > 24 ? '#fff' : barColor;
              return (
                <text
                  x={xNum + widthNum / 2}
                  y={labelY}
                  fill={labelColor}
                  fontWeight={bar.isTotal ? 'bold' : 'normal'}
                  fontSize={bar.isTotal ? 16 : 13}
                  textAnchor="middle"
                  filter="url(#shadow)"
                  dominantBaseline="middle"
                >
                  {formatCurrency(Number(value) || 0)}
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
      {/* Легенда */}
      <div className="flex justify-center gap-6 mt-2 text-sm text-text-secondary">
        {Object.entries(scheme).map(([key, color]: [string, string]) => (
          key !== 'other' && <div key={key} className={`flex items-center gap-1${key === 'Итого' ? ' font-bold' : ''}`}><span style={{width:12,height:12,background:color,display:'inline-block',borderRadius:2}}></span> {key}</div>
        ))}
      </div>
    </div>
  );
};

export default WaterfallChart; 