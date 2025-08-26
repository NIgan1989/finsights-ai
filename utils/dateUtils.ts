/**
 * Утилиты для работы с датами без проблем с часовыми поясами
 */

/**
 * Форматирует дату в формат YYYY-MM-DD используя локальное время (без смещения UTC)
 * Решает проблему с toISOString(), который может сдвигать дату на день назад
 * 
 * @param date - Дата для форматирования
 * @returns Строка в формате YYYY-MM-DD
 */
export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Получает текущую дату в формате YYYY-MM-DD в локальном времени
 * 
 * @returns Строка с текущей датой в формате YYYY-MM-DD
 */
export const getCurrentLocalDate = (): string => {
  return formatLocalDate(new Date());
};

/**
 * Создает дату из строки YYYY-MM-DD в локальном времени
 * 
 * @param dateString - Строка даты в формате YYYY-MM-DD
 * @returns Объект Date или null если формат неверный
 */
export const parseLocalDate = (dateString: string): Date | null => {
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // month is 0-indexed
  const day = parseInt(match[3], 10);
  
  const date = new Date(year, month, day);
  
  // Проверяем, что дата валидна
  if (date.getFullYear() !== year || 
      date.getMonth() !== month || 
      date.getDate() !== day) {
    return null;
  }
  
  return date;
};

/**
 * Добавляет время T00:00:00 к дате для корректного сравнения
 * 
 * @param dateString - Строка даты в формате YYYY-MM-DD
 * @returns Строка даты с временем T00:00:00
 */
export const addStartOfDayTime = (dateString: string): string => {
  return `${dateString}T00:00:00`;
};

/**
 * Добавляет время T23:59:59 к дате для корректного сравнения (конец дня)
 * 
 * @param dateString - Строка даты в формате YYYY-MM-DD
 * @returns Строка даты с временем T23:59:59
 */
export const addEndOfDayTime = (dateString: string): string => {
  return `${dateString}T23:59:59`;
};

/**
 * Форматирует дату в формат YYYY-MM используя локальное время
 * Решает проблему с toISOString().slice(0, 7), который может сдвигать месяц
 * 
 * @param date - Дата для форматирования
 * @returns Строка в формате YYYY-MM
 */
export const formatLocalMonth = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Новые универсальные форматтеры дат для ru-RU
export const formatRuDate = (dateOrString: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const date = typeof dateOrString === 'string'
    ? (parseLocalDate(dateOrString) || new Date(dateOrString))
    : dateOrString;
  return date.toLocaleDateString('ru-RU', options);
};

export const formatMonthYearShort = (dateOrString: Date | string): string => {
  return formatRuDate(dateOrString, { month: 'short', year: 'numeric' });
};

export const formatMonthYearLong = (dateOrString: Date | string): string => {
  return formatRuDate(dateOrString, { month: 'long', year: 'numeric' });
};

export const formatDayMonthShort = (dateOrString: Date | string): string => {
  return formatRuDate(dateOrString, { day: '2-digit', month: 'short' });
};

export const formatWeekdayLong = (dateOrString: Date | string): string => {
  return formatRuDate(dateOrString, { weekday: 'long' });
};

export const formatFullDate = (dateOrString: Date | string): string => {
  return formatRuDate(dateOrString);
};