import React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  isCurrency?: boolean;
  variant?: 'default' | 'compact' | 'large' | 'ultra-compact';
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  change?: number;
  changeType?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  isCurrency = true, 
  variant = 'default',
  trend,
  subtitle,
  change,
  changeType 
}) => {
  const formattedValue = isCurrency
    ? `${new Intl.NumberFormat('ru-RU').format(Math.abs(value))} ₸`
    : new Intl.NumberFormat('ru-RU').format(value);

  const getValueStyles = () => {
    if (!isCurrency) return 'text-slate-300';
    if (trend) {
      switch (trend) {
        case 'up': return 'text-emerald-400';
        case 'down': return 'text-red-400';
        case 'neutral': return 'text-slate-300';
      }
    }
    return value >= 0 
      ? 'text-emerald-400' 
      : 'text-red-400';
  };

  const getIcon = () => {
    if (!isCurrency) return '📊';
    const trendValue = trend || (value >= 0 ? 'up' : 'down');
    switch (trendValue) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '📊';
    }
  };

  const icon = getIcon();

  const cardClasses = {
    'default': 'p-4',
    'compact': 'p-3',
    'ultra-compact': 'p-2',
    'large': 'p-6',
  };

  const valueClasses = {
    'default': 'text-xl font-bold',
    'compact': 'text-sm font-semibold',
    'ultra-compact': 'text-xs font-semibold',
    'large': 'text-4xl font-bold',
  };

  const titleClasses = {
    'default': 'text-sm font-medium',
    'compact': 'text-xs font-medium',
    'ultra-compact': 'text-2xs font-medium',
    'large': 'text-base font-medium',
  };

  return (
    <div className={`relative group bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl ${cardClasses[variant]} shadow-lg overflow-hidden animate-fade-in`}>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
      <div className="absolute top-2 right-2 text-2xl opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-300">
        {icon}
      </div>
      
      <div className="relative z-10">
        <div className="mb-2">
          <h4 className={`${titleClasses[variant]} text-slate-400 group-hover:text-slate-300 transition-colors duration-300`}>
            {title}
          </h4>
          {subtitle && (
            <p className="text-2xs text-slate-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="flex items-baseline gap-2">
          <p className={`${valueClasses[variant]} font-display ${getValueStyles()} group-hover:scale-105 transition-transform duration-300`}>
            {isCurrency && value < 0 && '−'}{formattedValue}
          </p>
          {isCurrency && trend && (
            <span className={`text-2xs font-medium px-2 py-0.5 rounded-full ${
              trend === 'up'
                ? 'bg-emerald-900/50 text-emerald-300'
                : trend === 'down'
                ? 'bg-red-900/50 text-red-300'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
            </span>
          )}
        </div>
        
        {variant !== 'compact' && variant !== 'ultra-compact' && (
          <div className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 delay-300 ${
              (trend || (value >= 0 ? 'up' : 'down')) === 'up'
                ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                : (trend || (value >= 0 ? 'up' : 'down')) === 'down'
                ? 'bg-gradient-to-r from-red-500 to-rose-400'
                : 'bg-gradient-to-r from-slate-500 to-slate-400'
            } w-0 group-hover:w-full`}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
