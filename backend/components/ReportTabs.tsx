import React from 'react';

type ReportView = 'pnl' | 'cashflow' | 'balance' | 'forecast' | 'counterparties' | 'debts' | 'advanced';

interface ReportTabsProps {
    activeReport: ReportView;
    setActiveReport: (report: ReportView) => void;
}

const tabs: { id: ReportView; label: string }[] = [
    { id: 'pnl', label: 'ОПиУ' },
    { id: 'cashflow', label: 'ДДС' },
    { id: 'balance', label: 'Баланс' },
    { id: 'counterparties', label: 'Контрагенты' },
    { id: 'debts', label: 'Долги' },
    { id: 'forecast', label: 'Прогноз' },
    { id: 'advanced', label: 'Аналитика' },
];

const ReportTabs: React.FC<ReportTabsProps> = ({ activeReport, setActiveReport }) => {
    return (
        <div className="flex items-center gap-1">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveReport(tab.id)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        activeReport === tab.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default ReportTabs;
