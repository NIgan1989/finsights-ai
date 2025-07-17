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
        <div className="flex items-center bg-surface-accent rounded-lg p-1">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setGranularity(tab.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeGranularity === tab.id
                            ? 'bg-primary/70 text-primary-foreground'
                            : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default GranularitySwitcher;
