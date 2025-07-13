import React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  isCurrency?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, isCurrency = true }) => {
  const formattedValue = isCurrency
    ? `${new Intl.NumberFormat('ru-RU').format(value)} ₸`
    : value;

  const valueColor = value >= 0 ? 'text-success' : 'text-destructive';

  return (
    <div className="bg-surface p-6 rounded-2xl shadow-lg border border-border">
      <h4 className="text-text-secondary text-sm font-medium mb-2">{title}</h4>
      <p className={`text-3xl font-bold ${isCurrency ? valueColor : 'text-text-primary'}`}>{formattedValue}</p>
    </div>
  );
};

export default StatCard;