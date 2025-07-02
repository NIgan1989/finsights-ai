import React, { createContext, useState, useContext, ReactNode } from 'react';

interface DateRange {
    startDate: Date | null;
    endDate: Date | null;
}

interface DateRangeContextType {
    startDate: Date | null;
    endDate: Date | null;
    setDateRange: (dates: DateRange) => void;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export const DateRangeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [dateRange, setDateRangeState] = useState<DateRange>({ startDate: null, endDate: null });

    const setDateRange = (dates: DateRange) => {
        setDateRangeState(dates);
    };

    return (
        <DateRangeContext.Provider value={{ ...dateRange, setDateRange }}>
            {children}
        </DateRangeContext.Provider>
    );
};

export const useDateRange = () => {
    const context = useContext(DateRangeContext);
    if (context === undefined) {
        throw new Error('useDateRange must be used within a DateRangeProvider');
    }
    return context;
}; 