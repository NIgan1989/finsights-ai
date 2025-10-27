/**
 * Модели данных для финансовых моделей
 * Содержит типы и интерфейсы для работы с финансовыми моделями и шаблонами
 */

/**
 * Интерфейс для шаблона финансовой модели
 */
export interface FinancialTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  complexity: string;
  timeframe: string;
  features: string[];
  implemented: boolean;
  industry: string;
  preview: string;
}

/**
 * Интерфейс для листа финансовой модели
 */
export interface ModelSheet {
  id: string;
  name: string;
  type: 'assumptions' | 'revenue' | 'expenses' | 'pnl' | 'cashflow' | 'balance' | 'results';
  icon: string;
  data: (string | number)[][];
  formulas?: Record<string, string>;
  validations?: Record<string, any>;
}

/**
 * Интерфейс для финансовой модели
 */
export interface FinancialModel {
  id: string;
  name: string;
  industry: string;
  template: string;
  assumptions: Record<string, any>;
  sheets: ModelSheet[];
  createdAt: string;
  lastModified: string;
}

/**
 * Интерфейс для контекстного меню
 */
export interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  cellValue: string | number;
  rowIndex: number;
  colIndex: number;
}

/**
 * Интерфейс для состояния перетаскивания
 */
export interface DragState {
  isDragging: boolean;
  draggedRow: number | null;
  targetRow: number | null;
}

/**
 * Интерфейс для ячейки
 */
export interface CellPosition {
  row: number;
  col: number;
  value: string;
}

/**
 * Функция для адаптации шаблонов из общего источника данных
 * @param template Шаблон из общего источника данных
 * @returns Адаптированный шаблон для использования в FinancialPage
 */
export const adaptTemplate = (template: any): FinancialTemplate => ({
  ...template,
  industry: template.category === 'food' ? 'Food & Beverage' :
            template.category === 'tech' ? 'Technology' :
            template.category === 'retail' ? 'Retail' :
            template.category === 'production' ? 'Manufacturing' :
            template.category === 'services' ? 'Professional Services' :
            template.category === 'healthcare' ? 'Healthcare' :
            template.category === 'education' ? 'Education' :
            template.category === 'logistics' ? 'Logistics' :
            template.category === 'tourism' ? 'Tourism' :
            template.category === 'automotive' ? 'Automotive' :
            template.category === 'beauty' ? 'Beauty' : 'Other',
  preview: `/templates/${template.id}-preview.png`
});

/**
 * Функция для создания пустой финансовой модели
 * @returns Пустая финансовая модель
 */
export const createEmptyModel = (): FinancialModel => ({
  id: `model_${Date.now()}`,
  name: 'Новая финансовая модель',
  industry: 'Other',
  template: 'custom',
  assumptions: {},
  sheets: [
    {
      id: 'assumptions',
      name: 'Предпосылки',
      type: 'assumptions',
      icon: '📋',
      data: [
        ['Параметр', 'Значение', 'Комментарий'],
        ['Ставка налога', '20%', 'Корпоративный подоходный налог'],
        ['Ставка дисконтирования', '15%', 'WACC для малого бизнеса'],
        ['Горизонт планирования', '5 лет', 'Период прогнозирования'],
        ['Валюта', 'KZT', 'Тенге']
      ]
    },
    {
      id: 'revenue',
      name: 'Доходы',
      type: 'revenue',
      icon: '💰',
      data: [
        ['Статья дохода', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
        ['Основные продажи', '0', '0', '0', '0', '0'],
        ['Дополнительные услуги', '0', '0', '0', '0', '0']
      ]
    },
    {
      id: 'expenses',
      name: 'Расходы',
      type: 'expenses',
      icon: '💸',
      data: [
        ['Статья расхода', 'Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'],
        ['Аренда помещения', '0', '0', '0', '0', '0'],
        ['Зарплата персонала', '0', '0', '0', '0', '0']
      ]
    }
  ],
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString()
});

// Импортируем функцию для вычисления формул
import { evaluateFormula } from '../utils/formulaEvaluator';

/**
 * Функция для генерации данных результатов с поддержкой формул
 * @param model Финансовая модель
 * @returns Данные для листа результатов
 */
export const generateResultsData = (model: FinancialModel): (string | number)[][] => {
  if (!model?.sheets) return [] as (string | number)[][];

  const revenueSheet = model.sheets.find(s => s.type === 'revenue');
  const expensesSheet = model.sheets.find(s => s.type === 'expenses');

  // Определяем количество лет по количеству колонок (за вычетом колонки с названием показателя)
  const revYears = (revenueSheet?.data?.[0]?.length || 1) - 1;
  const expYears = (expensesSheet?.data?.[0]?.length || 1) - 1;
  const yearCount = Math.max(revYears, expYears, 4); // Минимум 4 года, по умолчанию — как в данных
  const yearLabels = Array.from({ length: yearCount }, (_, i) => `Год ${i + 1}`);

  // Заготовка пустой строки нужной длины
  const blankRow = Array(yearCount).fill('');

  const results: (string | number)[][] = [
    ['Итоговые показатели модели', ...blankRow],
    ['Создано:', new Date().toLocaleDateString('ru-RU'), ...blankRow.slice(1)],
    ['Модель:', model.name || 'Без названия', ...blankRow.slice(1)],
    ['Отрасль:', model.industry || 'Общая', ...blankRow.slice(1)],
    ['', ...blankRow],
    ['ФИНАНСОВЫЕ ПОКАЗАТЕЛИ', ...yearLabels],
    ['', ...blankRow]
  ];

  // ИСПРАВЛЕНИЕ: Используем централизованную функцию getCellValueGlobal
  // вместо дублирования логики
  const getCellValue = (cellValue: string | number, sheet: any): number => {
    if (typeof cellValue === 'string' && cellValue.startsWith('=')) {
      try {
        const result = evaluateFormula(cellValue, model.sheets, sheet.data, new Set());
        return typeof result === 'number' ? result : 0;
      } catch (error) {
        console.warn(`Ошибка при вычислении формулы ${cellValue}:`, error);
        return 0;
      }
    }
    
    if (typeof cellValue === 'number') {
      return cellValue;
    }
    
    if (typeof cellValue === 'string') {
      // Обработка процентных значений
      if (cellValue.includes('%')) {
        const percentVal = parseFloat(cellValue.replace(/[^\d.-]/g, ''));
        return isNaN(percentVal) ? 0 : percentVal / 100;
      }
      
      const numValue = parseFloat(cellValue.replace(/[^\d.-]/g, ''));
      return isNaN(numValue) ? 0 : numValue;
    }
    
    return 0;
  };

  // Добавляем суммарные данные по годам
  if (revenueSheet?.data && expensesSheet?.data) {
    // Суммируем выручку
    const revenueTotals = ['Общая выручка'];
    const expensesTotals = ['Общие расходы'];
    const profitTotals = ['Чистая прибыль'];
    
    for (let year = 1; year <= yearCount; year++) {
      let revenueTotal = 0;
      let expensesTotal = 0;
      
      // Суммируем выручку за год с поддержкой формул
      revenueSheet.data.forEach((row, index) => {
        if (index > 0 && row[year]) {
          const value = getCellValue(row[year], revenueSheet);
          revenueTotal += value;
        }
      });
      
      // Суммируем расходы за год с поддержкой формул
      expensesSheet.data.forEach((row, index) => {
        if (index > 0 && row[year]) {
          const value = getCellValue(row[year], expensesSheet);
          expensesTotal += value;
        }
      });
      
      revenueTotals.push(Math.round(revenueTotal).toLocaleString('ru-RU'));
      expensesTotals.push(Math.round(expensesTotal).toLocaleString('ru-RU'));
      profitTotals.push(Math.round(revenueTotal - expensesTotal).toLocaleString('ru-RU'));
    }
    
    results.push(revenueTotals, expensesTotals, profitTotals);
  }

  results.push(
    ['', ...blankRow],
    ['КЛЮЧЕВЫЕ МЕТРИКИ', ...blankRow],
    ['Средняя маржинальность', ...blankRow.map(()=>'')],
    ['Темп роста выручки', ...blankRow.map(()=>'')],
    ['ROI (возврат инвестиций)', ...blankRow.map(()=>'')],
    ['', ...blankRow],
    ['РЕКОМЕНДАЦИИ', ...blankRow],
    ['• Отслеживать ключевые показатели ежемесячно', ...blankRow],
    ['• Обновлять прогнозы каждый квартал', ...blankRow],
    ['• Анализировать отклонения план/факт', ...blankRow],
    ['• Корректировать стратегию при необходимости', ...blankRow]
  );

  return results;
};