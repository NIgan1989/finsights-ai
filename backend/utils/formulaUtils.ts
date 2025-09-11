/**
 * Утилитарные функции для работы с формулами в финансовой модели
 */

/**
 * Функция для превращения ссылки на ячейку (например, A1) в числовое значение
 * @param ref Ссылка на ячейку (например, A1)
 * @param data Данные таблицы
 * @returns Числовое значение ячейки
 */
export function getCellValue(ref: string, data: (string | number)[][]): number {
  const match = ref.match(/([A-Z]+)(\d+)/);
  if (!match) return 0;
  
  const colLetters = match[1];
  const row = parseInt(match[2], 10) - 1; // строки в данных с 0
  
  // Правильное преобразование букв колонки в индекс (A=0, B=1, ..., Z=25, AA=26, etc.)
  let col = 0;
  for (let i = 0; i < colLetters.length; i++) {
    col = col * 26 + (colLetters.charCodeAt(i) - 64);
  }
  col = col - 1; // Приводим к 0-индексации
  
  if (row < 0 || col < 0 || row >= data.length || col >= (data[row]?.length || 0)) {
    return 0;
  }
  
  const val = data[row]?.[col];
  if (typeof val === 'number') {
    return val;
  }
  
  const strVal = String(val || '');
  // Если это формула, не пытаемся её парсить как число
  if (strVal.startsWith('=')) {
    return 0;
  }
  
  // Обработка процентных значений
  if (strVal.includes('%')) {
    const percentVal = parseFloat(strVal.replace(/[^\d.-]/g, ''));
    return isNaN(percentVal) ? 0 : percentVal / 100;
  }
  
  // Парсим числовое значение, убирая все нечисловые символы кроме точки и минуса
  const numVal = parseFloat(strVal.replace(/[^\d.-]/g, ''));
  return isNaN(numVal) ? 0 : numVal;
}

// Функции getCellValueGlobal и evaluateFormula реализованы в formulaEvaluator.ts