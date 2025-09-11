import React from 'react';
import { Granularity } from '../../types';

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
        <div className="flex flex-wrap items-center gap-1 min-w-0">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setGranularity(tab.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 whitespace-nowrap min-w-0 ${activeGranularity === tab.id
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default GranularitySwitcher;
