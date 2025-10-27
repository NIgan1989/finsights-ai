import React from 'react';
import { formatNumber } from '../../utils/formatUtils';

const formatCurrency = (value: number) => {
  return formatNumber(Math.round(value), { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ₸';
};

// --- Sub-components for structure ---

interface RowProps {
    label: string;
    value: number;
    level?: number;
}
const Row: React.FC<RowProps> = ({ label, value, level = 0 }) => (
    <div className="flex justify-between items-center py-3 px-4 text-sm hover:bg-muted/30 transition-all duration-300 rounded-lg border border-transparent hover:border-border group" style={{ paddingLeft: `${level * 1}rem`}}>
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-gradient-to-r from-primary to-secondary rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-muted-foreground font-medium group-hover:text-foreground transition-colors">{label}</span>
        </div>
        <span className={`font-mono font-bold text-right text-lg ${value >= 0 ? 'text-success' : 'text-destructive'} group-hover:scale-105 transition-transform`}>{formatCurrency(value)}</span>
    </div>
);

interface SectionProps {
    title?: string;
    children: React.ReactNode;
}
const Section: React.FC<SectionProps> = ({ title, children }) => (
    <div className="py-1.5">
        {title && (
            <div className="flex items-center gap-1 mb-2">
                <div className="w-0.5 h-4 bg-primary rounded-full"></div>
                <h4 className="font-bold text-base text-text-primary">{title}</h4>
            </div>
        )}
        <div className="space-y-1">{children}</div>
    </div>
);

interface SubSectionProps {
    title: string;
    children: React.ReactNode;
}
const SubSection: React.FC<SubSectionProps> = ({ title, children }) => (
    <div className="ml-3 py-1.5 border-l border-primary/30 pl-2 bg-chart-card/30 rounded-r-md">
        {title && (
            <div className="flex items-center gap-1 mb-1.5">
                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full"></div>
                <h5 className="font-semibold text-sm text-foreground">{title}</h5>
            </div>
        )}
        <div className="space-y-1">{children}</div>
    </div>
);

interface SubTotalProps {
    label: string;
    value: number;
}

const SubTotal: React.FC<SubTotalProps> = ({ label, value }) => (
    <div className="flex justify-between items-center py-3 px-4 border-t-2 border-primary/20 bg-chart-card/50 rounded-lg font-semibold text-text-primary shadow-sm">
        <span className="text-base font-bold">{label}</span>
        <span className="text-base font-bold text-primary">{formatCurrency(value)}</span>
    </div>
);


interface TotalProps {
    label: string;
    value: number;
}
const Total: React.FC<TotalProps> = ({ label, value }) => {
    const isPositive = value >= 0;
    return (
        <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-xl"></div>
            <div className="relative flex justify-between items-center py-6 px-6 border-2 border-border bg-chart-card/20 backdrop-blur-sm rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-gradient-to-r from-accent to-accent/80 rounded-full animate-pulse"></div>
                    <span className="text-text-primary font-bold text-xl group-hover:text-primary transition-colors">{label}</span>
                </div>
                <span className={`font-mono font-black text-2xl ${isPositive ? 'text-success' : 'text-destructive'} group-hover:scale-110 transition-transform drop-shadow-lg`}>
                    {formatCurrency(value)}
                </span>
            </div>
        </div>
    );
};


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
    <div className="relative group bg-chart-card backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden animate-slide-up">
      <div className="absolute -inset-0.5 bg-gradient-primary rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
      <div className="relative z-10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-8 bg-gradient-to-b from-primary via-secondary to-accent rounded-full shadow-lg"></div>
          <h3 className="text-2xl font-bold text-text-primary tracking-tight">{title}</h3>
          <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent"></div>
        </div>
        <div className="space-y-3">
          {children}
        </div>
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
