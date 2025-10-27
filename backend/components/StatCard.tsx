import React from 'react';
import { formatNumber } from '../../utils/formatUtils';

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
    ? `${formatNumber(Math.abs(value), { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₸`
    : formatNumber(value);

  const getValueStyles = () => {
    if (!isCurrency) return 'text-muted-foreground';
    if (trend) {
      switch (trend) {
        case 'up': return 'text-success-foreground';
        case 'down': return 'text-destructive-foreground';
        case 'neutral': return 'text-muted-foreground';
      }
    }
    return value >= 0 
      ? 'text-success-foreground' 
      : 'text-destructive-foreground';
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
  } as const;

  const valueClasses = {
    'default': 'text-xl font-bold',
    'compact': 'text-sm font-semibold',
    'ultra-compact': 'text-xs font-semibold',
    'large': 'text-4xl font-bold',
  } as const;

  const titleClasses = {
    'default': 'text-sm font-medium',
    'compact': 'text-xs font-medium',
    'ultra-compact': 'text-2xs font-medium',
    'large': 'text-base font-medium',
  } as const;

  return (
    <div className={`relative group bg-chart-card backdrop-blur-xl border border-border rounded-2xl ${cardClasses[variant]} shadow-lg overflow-hidden animate-fade-in min-w-0`}>
      <div className="absolute -inset-0.5 bg-primary/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
      <div className="absolute top-2 right-2 text-2xl opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-300">
        {icon}
      </div>
      
      <div className="relative z-10 min-w-0">
        <div className="mb-2 min-w-0">
          <h4 className={`${titleClasses[variant]} text-foreground group-hover:text-primary transition-colors duration-300 truncate min-w-0 pr-8`} title={title}>
            {title}
          </h4>
          {subtitle && (
            <p className="text-2xs text-muted-foreground mt-1 truncate min-w-0 pr-8" title={subtitle}>
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="flex items-baseline gap-2 min-w-0">
          <p className={`${valueClasses[variant]} font-display ${getValueStyles()} group-hover:scale-105 transition-transform duration-300 truncate min-w-0 flex-1`} title={`${isCurrency && value < 0 ? '−' : ''}${formattedValue}`}>
            {isCurrency && value < 0 && '−'}{formattedValue}
          </p>
          {isCurrency && trend && (
            <span className={`text-2xs font-medium px-2 py-0.5 rounded-full ${
              trend === 'up'
                ? 'bg-chart-card text-success-foreground'
                : trend === 'down'
                ? 'bg-chart-card text-destructive-foreground'
                : 'bg-chart-card text-muted-foreground'
            }`}>
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
            </span>
          )}
        </div>
        
        {variant !== 'compact' && variant !== 'ultra-compact' && (
          <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 delay-300 ${
              (trend || (value >= 0 ? 'up' : 'down')) === 'up'
                ? 'bg-success'
                : (trend || (value >= 0 ? 'up' : 'down')) === 'down'
                ? 'bg-destructive'
                : 'bg-muted-foreground'
            } w-0 group-hover:w-full`}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
