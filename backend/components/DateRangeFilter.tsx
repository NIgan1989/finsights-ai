
import React from 'react';
import { Theme } from '../../types.ts';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  minDate: string;
  maxDate: string;
  onDateChange: (start: string, end: string) => void;
  theme: Theme;
}

const toYyyyMmDd = (dateString: string) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    // Adjust for timezone offset to prevent date from shifting
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timezoneOffset).toISOString().split('T')[0];
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return '';
  }
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ startDate, endDate, minDate, maxDate, onDateChange, theme }) => {
  return (
    <div className="bg-surface p-4 border-b border-border flex items-center gap-4 sticky top-0 z-20 shadow-md">
      <span className="text-text-secondary font-medium">Период:</span>
      <div className="flex items-center gap-2">
        <label htmlFor="start-date" className="text-sm text-text-secondary">С</label>
        <input
          type="date"
          id="start-date"
          value={toYyyyMmDd(startDate)}
          min={toYyyyMmDd(minDate)}
          max={toYyyyMmDd(endDate)}
          onChange={(e) => onDateChange(e.target.value, endDate)}
          className="bg-background border border-border rounded-lg px-2 py-1 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          style={{ colorScheme: theme }}
        />
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="end-date" className="text-sm text-text-secondary">По</label>
        <input
          type="date"
          id="end-date"
          value={toYyyyMmDd(endDate)}
          min={toYyyyMmDd(startDate)}
          max={toYyyyMmDd(maxDate)}
          onChange={(e) => onDateChange(startDate, e.target.value)}
          className="bg-background border border-border rounded-lg px-2 py-1 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          style={{ colorScheme: theme }}
        />
      </div>
    </div>
  );
};

export default DateRangeFilter;
