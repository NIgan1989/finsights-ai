
import React from 'react';
import { useTheme } from './ThemeProvider';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  minDate: string;
  maxDate: string;
  onDateChange: (start: string, end: string) => void;
}

const toYyyyMmDd = (dateString: string) => {
  if (!dateString) return '';
  try {
    // Формируем локальную дату без смещения: YYYY-MM-DD
    // Если уже YYYY-MM-DD, не трогаем
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

    const [d, m, y] = dateString.includes('.') ? dateString.split('.') : ["", "", ""];
    if (d && m && y) {
      const year = y.length === 2 ? (parseInt(y, 10) < 50 ? 2000 + parseInt(y, 10) : 1900 + parseInt(y, 10)) : parseInt(y, 10);
      const mm = String(parseInt(m, 10)).padStart(2, '0');
      const dd = String(parseInt(d, 10)).padStart(2, '0');
      return `${year}-${mm}-${dd}`;
    }

    // Фоллбек: парсим как есть, но возвращаем локальный YYYY-MM-DD без использования UTC
    const date = new Date(dateString + 'T00:00:00');
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return '';
  }
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ startDate, endDate, minDate, maxDate, onDateChange }) => {
  const { theme } = useTheme();
  
  return (
    <div className="bg-surface p-4 border-b border-border flex items-center gap-4 sticky top-0 z-20 shadow-md">
      <span className="text-muted-foreground font-medium">Период:</span>
      <div className="flex items-center gap-2">
        <label htmlFor="start-date" className="text-sm text-muted-foreground">С</label>
        <input
          type="date"
          id="start-date"
          value={toYyyyMmDd(startDate)}
          min={toYyyyMmDd(minDate)}
          max={toYyyyMmDd(endDate)}
          onChange={(e) => onDateChange(e.target.value, endDate)}
          className="bg-background border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          style={{ colorScheme: theme.name }}
        />
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="end-date" className="text-sm text-muted-foreground">По</label>
        <input
          type="date"
          id="end-date"
          value={toYyyyMmDd(endDate)}
          min={toYyyyMmDd(startDate)}
          max={toYyyyMmDd(maxDate)}
          onChange={(e) => onDateChange(startDate, e.target.value)}
          className="bg-background border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          style={{ colorScheme: theme.name }}
        />
      </div>
    </div>
  );
};

export default DateRangeFilter;
