import React from 'react';

const formatCurrency = (value: number) => {
  const formatted = new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
  return formatted + ' KZT'; // неразрывный пробел
};

// --- Sub-components for structure ---

interface RowProps {
    label: string;
    value: number;
    level?: number;
}
const Row: React.FC<RowProps> = ({ label, value, level = 0 }) => (
    <div className="flex justify-between items-center py-2 text-sm" style={{ paddingLeft: `${level * 1.5}rem`}}>
        <span className="text-text-secondary">{label}</span>
        <span className="font-mono text-text-primary text-right">{formatCurrency(value)}</span>
    </div>
);

interface SectionProps {
    title?: string;
    children: React.ReactNode;
}
const Section: React.FC<SectionProps> = ({ title, children }) => (
    <div className="py-2">
        {title && <h4 className="font-semibold text-md text-text-primary mb-1">{title}</h4>}
        {children}
    </div>
);

interface SubSectionProps {
    title: string;
    children: React.ReactNode;
}
const SubSection: React.FC<SubSectionProps> = ({ title, children }) => (
     <div className="py-2 pl-4 border-l border-border ml-2">
        <h5 className="font-medium text-sm text-text-secondary mb-1">{title}</h5>
        {children}
    </div>
);

interface SubTotalProps {
    label: string;
    value: number;
}

const SubTotal: React.FC<SubTotalProps> = ({ label, value }) => (
     <div className="flex justify-between items-center py-2 text-sm font-semibold border-t border-border mt-2">
        <span className="text-text-primary">{label}</span>
        <span className="font-mono text-text-primary">{formatCurrency(value)}</span>
    </div>
);


interface TotalProps {
    label: string;
    value: number;
}
const Total: React.FC<TotalProps> = ({ label, value }) => (
    <div className="flex justify-between items-center mt-4 pt-3 border-t-2 border-border font-bold text-lg">
        <span className="text-text-primary">{label}</span>
        <span className={`font-mono text-right ${value >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(value)}</span>
    </div>
);


// --- Main Card Component ---

interface FinancialStatementCardProps {
  title: string;
  children: React.ReactNode;
}

type FinancialStatementCardComponent = React.FC<FinancialStatementCardProps> & {
    Row: React.FC<RowProps>;
    Section: React.FC<SectionProps>;
    SubSection: React.FC<SubSectionProps>;
    SubTotal: React.FC<SubTotalProps>;
    Total: React.FC<TotalProps>;
};


const FinancialStatementCard: FinancialStatementCardComponent = ({ title, children }) => {
  return (
    <div className="bg-surface p-6 rounded-2xl shadow-lg border border-border w-full min-w-0 max-w-none md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto">
      <h3 className="text-xl font-bold text-text-primary mb-4">{title}</h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
};


FinancialStatementCard.Row = Row;
FinancialStatementCard.Section = Section;
FinancialStatementCard.SubSection = SubSection;
FinancialStatementCard.SubTotal = SubTotal;
FinancialStatementCard.Total = Total;


export default FinancialStatementCard;