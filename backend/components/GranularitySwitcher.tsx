import React from 'react';
import { Granularity } from '../../types.ts';

interface GranularitySwitcherProps {
    activeGranularity: Granularity;
    setGranularity: (granularity: Granularity) => void;
}

const tabs: { id: Granularity; label: string }[] = [
    { id: 'day', label: 'Дни' },
    { id: 'week', label: 'Недели' },
    { id: 'month', label: 'Месяцы' },
];

const GranularitySwitcher: React.FC<GranularitySwitcherProps> = ({ activeGranularity, setGranularity }) => {
    return (
        <div className="flex items-center gap-1">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setGranularity(tab.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${activeGranularity === tab.id
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

export default GranularitySwitcher;
