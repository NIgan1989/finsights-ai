/**
 * Реализация функций для вычисления формул в финансовой модели
 */
import { getCellValue } from './formulaUtils';

/**
 * Получить значение ячейки с учётом ссылок на другие листы
 * @param ref Ссылка на ячейку (например, Sheet1!A1)
 * @param sheets Массив листов модели
 * @param currentSheetData Данные текущего листа
 * @param visitedCells Множество посещенных ячеек (для обнаружения циклических ссылок)
 * @returns Числовое значение ячейки
 */
export function getCellValueGlobal(
  ref: string, 
  sheets: { id: string; name?: string; data: (string | number)[][] }[], 
  currentSheetData: (string | number)[][], 
  visitedCells: Set<string> = new Set<string>()
): number {
  // Проверка на циклические ссылки
  if (visitedCells.has(ref)) {
    return 0;
  }
  
  visitedCells.add(ref);
  
  const parts = ref.split('!');
  let cellRef = ref;
  let data = currentSheetData;
  
  if (parts.length === 2) {
    const [sheetPart, cellPart] = parts;
    cellRef = cellPart;
    const targetSheet = sheets.find(s => s.id === sheetPart || s.name === sheetPart);
    if (targetSheet) {
      data = targetSheet.data;
    } else {
      visitedCells.delete(ref);
      return 0;
    }
  }
  
  // Получаем координаты ячейки
  const match = cellRef.match(/([A-Z]+)(\d+)/);
  if (!match) {
    visitedCells.delete(ref);
    return 0;
  }
  
  let col = 0;
  for (let i = 0; i < match[1].length; i++) {
    col = col * 26 + (match[1].charCodeAt(i) - 64);
  }
  col = col - 1;
  const row = parseInt(match[2], 10) - 1;
  
  if (row < 0 || col < 0 || row >= data.length || col >= (data[row]?.length || 0)) {
    visitedCells.delete(ref);
    return 0;
  }
  
  const val = data[row]?.[col];
  
  // Если это формула, рекурсивно вычисляем её
  if (typeof val === 'string' && val.startsWith('=')) {
    const result = evaluateFormula(val, sheets, data, new Set(visitedCells));
    visitedCells.delete(ref);
    return typeof result === 'number' ? result : 0;
  }
  
  // Обычное значение
  visitedCells.delete(ref);
  if (typeof val === 'number') {
    return val;
  }
  
  const strVal = String(val || '');
  
  // Обработка процентных значений
  if (strVal.includes('%')) {
    const percentVal = parseFloat(strVal.replace(/[^\d.-]/g, ''));
    return isNaN(percentVal) ? 0 : percentVal / 100;
  }
  
  const numVal = parseFloat(strVal.replace(/[^\d.-]/g, ''));
  return isNaN(numVal) ? 0 : numVal;
}

/**
 * Улучшенная функция для вычисления формул с валидацией и расширенным набором функций
 * @param formula Формула для вычисления
 * @param sheets Массив листов модели
 * @param currentSheetData Данные текущего листа
 * @param visitedCells Множество посещенных ячеек (для обнаружения циклических ссылок)
 * @returns Результат вычисления формулы
 */
export function evaluateFormula(
  formula: string, 
  sheets: { id: string; name?: string; data: (string | number)[][] }[], 
  currentSheetData: (string | number)[][], 
  visitedCells: Set<string> = new Set<string>()
): string | number {
  // Валидация входных данных
  if (!formula || typeof formula !== 'string' || !formula.startsWith('=')) {
    return formula;
  }

  // Убираем = и пробелы
  const expr = formula.slice(1).replace(/\s+/g, '');
  
  // Проверка на пустую формулу
  if (!expr) {
    return 0;
  }

  try {
    // Проверка циклических ссылок
    const cellRefs = expr.match(/([A-Za-z0-9_\- ]+!)?[A-Z]+\d+/g) || [];
    for (const ref of cellRefs) {
      if (visitedCells.has(ref)) {
        console.warn(`Обнаружена циклическая ссылка: ${ref}`);
        return '#CYCLE!';
      }
    }

    // SUM функция с улучшенной обработкой
    const sumMatch = expr.match(/^SUM\(((?:[A-Za-z0-9_\- ]+!)?([A-Z]+)(\d+):([A-Z]+)(\d+))\)$/i);
    if (sumMatch) {
      return evaluateSumFunction(sumMatch, sheets, currentSheetData);
    }

    // AVERAGE функция
    const avgMatch = expr.match(/^AVERAGE\(((?:[A-Za-z0-9_\- ]+!)?([A-Z]+)(\d+):([A-Z]+)(\d+))\)$/i);
    if (avgMatch) {
      return evaluateAverageFunction(avgMatch, sheets, currentSheetData);
    }

    // MAX функция
    const maxMatch = expr.match(/^MAX\(((?:[A-Za-z0-9_\- ]+!)?([A-Z]+)(\d+):([A-Z]+)(\d+))\)$/i);
    if (maxMatch) {
      return evaluateMaxFunction(maxMatch, sheets, currentSheetData);
    }

    // MIN функция
    const minMatch = expr.match(/^MIN\(((?:[A-Za-z0-9_\- ]+!)?([A-Z]+)(\d+):([A-Z]+)(\d+))\)$/i);
    if (minMatch) {
      return evaluateMinFunction(minMatch, sheets, currentSheetData);
    }

    // ROUND функция
    const roundMatch = expr.match(/^ROUND\(([^,]+),?([^)]*)\)$/i);
    if (roundMatch) {
      return evaluateRoundFunction(roundMatch, sheets, currentSheetData, visitedCells);
    }

    // IF функция
    const ifMatch = expr.match(/^IF\(([^,]+),([^,]+),([^)]+)\)$/i);
    if (ifMatch) {
      return evaluateIfFunction(ifMatch, sheets, currentSheetData, visitedCells);
    }

    // Арифметические формулы с улучшенной валидацией
    return evaluateArithmeticFormula(expr, sheets, currentSheetData, visitedCells);
    
  } catch (e) {
    console.warn('Ошибка вычисления формулы:', formula, e);
    return '#ERROR!';
  }
}

/**
 * Вычисление функции SUM
 */
function evaluateSumFunction(
  match: RegExpMatchArray, 
  sheets: { id: string; name?: string; data: (string | number)[][] }[], 
  currentSheetData: (string | number)[][]
): number | string {
  const [, rangeStr, startCol, startRow, endCol, endRow] = match;
  let sheetData = currentSheetData;
  
  // Обработка межлистовых ссылок
  if (rangeStr.includes('!')) {
    const sheetName = rangeStr.split('!')[0];
    const targetSheet = sheets.find(s => s.id === sheetName || s.name === sheetName);
    if (targetSheet) {
      sheetData = targetSheet.data;
    } else {
      console.warn(`Лист не найден: ${sheetName}`);
      return '#REF!';
    }
  }
  
  const startRowIdx = parseInt(startRow, 10) - 1;
  const endRowIdx = parseInt(endRow, 10) - 1;
  const startColIdx = startCol.toUpperCase().charCodeAt(0) - 65;
  const endColIdx = endCol.toUpperCase().charCodeAt(0) - 65;
  
  // Валидация диапазона
  if (startRowIdx < 0 || endRowIdx < 0 || startColIdx < 0 || endColIdx < 0) {
    return '#VALUE!';
  }
  
  let sum = 0;
  for (let r = startRowIdx; r <= endRowIdx; r++) {
    for (let c = startColIdx; c <= endColIdx; c++) {
      const val = sheetData[r]?.[c];
      const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d.-]/g, ''));
      if (!isNaN(num)) sum += num;
    }
  }
  return sum;
}

/**
 * Вычисление функции AVERAGE
 */
function evaluateAverageFunction(
  match: RegExpMatchArray, 
  sheets: { id: string; name?: string; data: (string | number)[][] }[], 
  currentSheetData: (string | number)[][]
): number | string {
  const [, rangeStr, startCol, startRow, endCol, endRow] = match;
  let sheetData = currentSheetData;
  
  if (rangeStr.includes('!')) {
    const sheetName = rangeStr.split('!')[0];
    const targetSheet = sheets.find(s => s.id === sheetName || s.name === sheetName);
    if (targetSheet) sheetData = targetSheet.data;
    else return '#REF!';
  }
  
  const startRowIdx = parseInt(startRow, 10) - 1;
  const endRowIdx = parseInt(endRow, 10) - 1;
  const startColIdx = startCol.toUpperCase().charCodeAt(0) - 65;
  const endColIdx = endCol.toUpperCase().charCodeAt(0) - 65;
  
  if (startRowIdx < 0 || endRowIdx < 0 || startColIdx < 0 || endColIdx < 0) {
    return '#VALUE!';
  }
  
  let sum = 0;
  let count = 0;
  for (let r = startRowIdx; r <= endRowIdx; r++) {
    for (let c = startColIdx; c <= endColIdx; c++) {
      const val = sheetData[r]?.[c];
      const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d.-]/g, ''));
      if (!isNaN(num)) {
        sum += num;
        count++;
      }
    }
  }
  return count > 0 ? sum / count : 0;
}

/**
 * Вычисление функции MAX
 */
function evaluateMaxFunction(
  match: RegExpMatchArray, 
  sheets: { id: string; name?: string; data: (string | number)[][] }[], 
  currentSheetData: (string | number)[][]
): number | string {
  const [, rangeStr, startCol, startRow, endCol, endRow] = match;
  let sheetData = currentSheetData;
  
  if (rangeStr.includes('!')) {
    const sheetName = rangeStr.split('!')[0];
    const targetSheet = sheets.find(s => s.id === sheetName || s.name === sheetName);
    if (targetSheet) sheetData = targetSheet.data;
    else return '#REF!';
  }
  
  const startRowIdx = parseInt(startRow, 10) - 1;
  const endRowIdx = parseInt(endRow, 10) - 1;
  const startColIdx = startCol.toUpperCase().charCodeAt(0) - 65;
  const endColIdx = endCol.toUpperCase().charCodeAt(0) - 65;
  
  if (startRowIdx < 0 || endRowIdx < 0 || startColIdx < 0 || endColIdx < 0) {
    return '#VALUE!';
  }
  
  let max = -Infinity;
  for (let r = startRowIdx; r <= endRowIdx; r++) {
    for (let c = startColIdx; c <= endColIdx; c++) {
      const val = sheetData[r]?.[c];
      const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d.-]/g, ''));
      if (!isNaN(num)) {
        max = Math.max(max, num);
      }
    }
  }
  return max === -Infinity ? 0 : max;
}

/**
 * Вычисление функции MIN
 */
function evaluateMinFunction(
  match: RegExpMatchArray, 
  sheets: { id: string; name?: string; data: (string | number)[][] }[], 
  currentSheetData: (string | number)[][]
): number | string {
  const [, rangeStr, startCol, startRow, endCol, endRow] = match;
  let sheetData = currentSheetData;
  
  if (rangeStr.includes('!')) {
    const sheetName = rangeStr.split('!')[0];
    const targetSheet = sheets.find(s => s.id === sheetName || s.name === sheetName);
    if (targetSheet) sheetData = targetSheet.data;
    else return '#REF!';
  }
  
  const startRowIdx = parseInt(startRow, 10) - 1;
  const endRowIdx = parseInt(endRow, 10) - 1;
  const startColIdx = startCol.toUpperCase().charCodeAt(0) - 65;
  const endColIdx = endCol.toUpperCase().charCodeAt(0) - 65;
  
  if (startRowIdx < 0 || endRowIdx < 0 || startColIdx < 0 || endColIdx < 0) {
    return '#VALUE!';
  }
  
  let min = Infinity;
  for (let r = startRowIdx; r <= endRowIdx; r++) {
    for (let c = startColIdx; c <= endColIdx; c++) {
      const val = sheetData[r]?.[c];
      const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d.-]/g, ''));
      if (!isNaN(num)) {
        min = Math.min(min, num);
      }
    }
  }
  return min === Infinity ? 0 : min;
}

/**
 * Вычисление функции ROUND
 */
function evaluateRoundFunction(
  match: RegExpMatchArray, 
  sheets: { id: string; name?: string; data: (string | number)[][] }[], 
  currentSheetData: (string | number)[][], 
  visitedCells: Set<string>
): number | string {
  const [, value, digits] = match;
  
  // Заменяем ссылки на ячейки в значении
  const valueReplaced = value.replace(/([A-Za-z0-9_\- ]+!)?[A-Z]+\d+/g, (ref) => {
    const newVisited = new Set(visitedCells);
    return getCellValueGlobal(ref, sheets, currentSheetData, newVisited).toString();
  });
  
  try {
    const numValue = Function(`"use strict";return (${valueReplaced})`)();
    const numDigits = digits ? parseInt(digits.trim(), 10) : 0;
    
    if (typeof numValue === 'number' && !isNaN(numValue)) {
      return Math.round(numValue * Math.pow(10, numDigits)) / Math.pow(10, numDigits);
    }
    return '#VALUE!';
  } catch (e) {
    console.warn('Ошибка в функции ROUND:', e);
    return '#VALUE!';
  }
}

/**
 * Вычисление функции IF
 */
function evaluateIfFunction(
  match: RegExpMatchArray, 
  sheets: { id: string; name?: string; data: (string | number)[][] }[], 
  currentSheetData: (string | number)[][], 
  visitedCells: Set<string>
): number | string {
  const [, condition, trueValue, falseValue] = match;
  
  // Заменяем ссылки на ячейки в условии
  const conditionReplaced = condition.replace(/([A-Za-z0-9_\- ]+!)?[A-Z]+\d+/g, (ref) => {
    const newVisited = new Set(visitedCells);
    return getCellValueGlobal(ref, sheets, currentSheetData, newVisited).toString();
  });
  
  try {
    // Безопасная оценка условия
    const conditionResult = Function(`"use strict";return (${conditionReplaced})`)();
    
    if (conditionResult) {
      // Если условие истинно, возвращаем trueValue
      if (trueValue.match(/^[A-Z]+\d+$/)) {
        return getCellValueGlobal(trueValue, sheets, currentSheetData, new Set(visitedCells));
      }
      return isNaN(Number(trueValue)) ? trueValue.replace(/"/g, '') : Number(trueValue);
    } else {
      // Если условие ложно, возвращаем falseValue
      if (falseValue.match(/^[A-Z]+\d+$/)) {
        return getCellValueGlobal(falseValue, sheets, currentSheetData, new Set(visitedCells));
      }
      return isNaN(Number(falseValue)) ? falseValue.replace(/"/g, '') : Number(falseValue);
    }
  } catch (e) {
    console.warn('Ошибка в условии IF:', e);
    return '#VALUE!';
  }
}

/**
 * Вычисление арифметической формулы
 */
function evaluateArithmeticFormula(
  expr: string, 
  sheets: { id: string; name?: string; data: (string | number)[][] }[], 
  currentSheetData: (string | number)[][], 
  visitedCells: Set<string>
): number | string {
  const newVisited = new Set(visitedCells);
  const replaced = expr.replace(/([A-Za-z0-9_\- ]+!)?[A-Z]+\d+/g, (ref) => {
    return getCellValueGlobal(ref, sheets, currentSheetData, newVisited).toString();
  });
  
  // Проверяем, что формула содержит только безопасные символы
  if (!/^[\d+\-*/.()\s]+$/.test(replaced)) {
    console.warn('Небезопасная формула:', replaced);
    return '#VALUE!';
  }
  
  const result = Function(`"use strict";return (${replaced})`)();
  
  if (typeof result === 'number' && !isNaN(result)) {
    return result;
  }
  
  return '#VALUE!';
}