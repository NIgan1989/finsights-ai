import { Transaction } from '../types';
import { AdvancedFinanceService, AdvancedFinancialMetrics } from './advancedFinanceService';

// Интерфейсы для экспорта
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts: boolean;
  includeAnalysis: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  template?: 'standard' | 'executive' | 'detailed' | 'minimal';
  language?: 'ru' | 'en' | 'kk';
}

export interface ExportData {
  transactions: Transaction[];
  metrics: AdvancedFinancialMetrics;
  metadata: {
    generatedAt: string;
    totalTransactions: number;
    dateRange: {
      start: string;
      end: string;
    };
    reportType: string;
  };
}

export class EnhancedExportService {
  
  // Экспорт в CSV с расширенными данными
  static exportToCSV(data: ExportData, options: ExportOptions): string {
    const { transactions, metrics } = data;
    
    let csvContent = '';
    
    // Заголовок отчета
    csvContent += 'FinSights AI - Финансовый отчет\n';
    csvContent += `Сгенерирован: ${data.metadata.generatedAt}\n`;
    csvContent += `Период: ${data.metadata.dateRange.start} - ${data.metadata.dateRange.end}\n`;
    csvContent += `Общее количество транзакций: ${data.metadata.totalTransactions}\n\n`;
    
    // Ключевые показатели
    csvContent += 'КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ\n';
    csvContent += 'Метрика,Значение,Единица измерения\n';
    csvContent += `Выручка,${metrics.revenue.toFixed(2)},₸\n`;
    csvContent += `Расходы,${metrics.expenses.toFixed(2)},₸\n`;
    csvContent += `Чистая прибыль,${metrics.netIncome.toFixed(2)},₸\n`;
    csvContent += `Рентабельность (%),"${metrics.profitability.netMargin.toFixed(2)}","%"\n`;
    csvContent += `ROA (%),"${metrics.profitability.roa.toFixed(2)}","%"\n`;
    csvContent += `ROE (%),"${metrics.profitability.roe.toFixed(2)}","%"\n`;
    csvContent += `Текущая ликвидность,"${metrics.liquidity.currentRatio.toFixed(2)}","коэфф."\n\n`;
    
    if (options.includeAnalysis) {
      // Коэффициенты рентабельности
      csvContent += 'КОЭФФИЦИЕНТЫ РЕНТАБЕЛЬНОСТИ\n';
      csvContent += 'Показатель,Значение (%)\n';
      csvContent += `Валовая маржа,${metrics.profitability.grossMargin.toFixed(2)}\n`;
      csvContent += `Чистая маржа,${metrics.profitability.netMargin.toFixed(2)}\n`;
      csvContent += `EBITDA маржа,${metrics.profitability.ebitdaMargin.toFixed(2)}\n`;
      csvContent += `ROA,${metrics.profitability.roa.toFixed(2)}\n`;
      csvContent += `ROE,${metrics.profitability.roe.toFixed(2)}\n`;
      csvContent += `ROIC,${metrics.profitability.roic.toFixed(2)}\n\n`;
      
      // Коэффициенты ликвидности
      csvContent += 'КОЭФФИЦИЕНТЫ ЛИКВИДНОСТИ\n';
      csvContent += 'Показатель,Значение\n';
      csvContent += `Текущая ликвидность,${metrics.liquidity.currentRatio.toFixed(2)}\n`;
      csvContent += `Быстрая ликвидность,${metrics.liquidity.quickRatio.toFixed(2)}\n`;
      csvContent += `Абсолютная ликвидность,${metrics.liquidity.cashRatio.toFixed(2)}\n`;
      csvContent += `Операционный денежный поток,${metrics.liquidity.operatingCashFlowRatio.toFixed(2)}\n\n`;
      
      // Прогнозы
      csvContent += 'ПРОГНОЗЫ\n';
      csvContent += 'Показатель,Прогнозное значение,Уровень доверия (%)\n';
      csvContent += `Выручка,${metrics.forecast.expectedRevenue.toFixed(2)},${metrics.forecast.confidence.toFixed(0)}\n`;
      csvContent += `Прибыль,${metrics.forecast.expectedProfit.toFixed(2)},${metrics.forecast.confidence.toFixed(0)}\n`;
      csvContent += `Денежный поток,${metrics.forecast.expectedCashFlow.toFixed(2)},${metrics.forecast.confidence.toFixed(0)}\n\n`;
    }
    
    // Детальные транзакции
    csvContent += 'ДЕТАЛЬНЫЕ ТРАНЗАКЦИИ\n';
    csvContent += 'ID,Дата,Описание,Категория,Сумма (₸),Тип\n';
    
    transactions.forEach(tx => {
      const date = new Date(tx.date).toLocaleDateString('ru-RU');
      const type = tx.amount > 0 ? 'Доход' : 'Расход';
      csvContent += `"${tx.id}","${date}","${tx.description.replace(/"/g, '""')}","${tx.category}",${tx.amount.toFixed(2)},"${type}"\n`;
    });
    
    return csvContent;
  }
  
  // Экспорт в JSON с полной структурой
  static exportToJSON(data: ExportData, options: ExportOptions): string {
    const exportObject = {
      metadata: {
        ...data.metadata,
        exportOptions: options,
        version: '2.0',
        format: 'FinSights Enhanced Export'
      },
      summary: {
        totalRevenue: data.metrics.revenue,
        totalExpenses: data.metrics.expenses,
        netIncome: data.metrics.netIncome,
        profitMargin: data.metrics.profitability.netMargin,
        totalTransactions: data.transactions.length
      },
      financialMetrics: data.metrics,
      transactions: data.transactions.map(tx => ({
        ...tx,
        formattedDate: new Date(tx.date).toLocaleDateString('ru-RU'),
        type: tx.amount > 0 ? 'income' : 'expense',
        absAmount: Math.abs(tx.amount)
      })),
      categoryAnalysis: this.getCategoryAnalysis(data.transactions),
      monthlyBreakdown: this.getMonthlyBreakdown(data.transactions)
    };
    
    return JSON.stringify(exportObject, null, 2);
  }
  
  // Генерация Excel-подобной структуры (возвращает данные для библиотеки xlsx)
  static prepareExcelData(data: ExportData, options: ExportOptions): any {
    const workbook = {
      SheetNames: ['Сводка', 'Коэффициенты', 'Транзакции', 'Анализ категорий'],
      Sheets: {} as any
    };
    
    // Лист "Сводка"
    const summaryData = [
      ['FinSights AI - Финансовый отчет'],
      [`Сгенерирован: ${data.metadata.generatedAt}`],
      [`Период: ${data.metadata.dateRange.start} - ${data.metadata.dateRange.end}`],
      [],
      ['КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ'],
      ['Метрика', 'Значение', 'Единица'],
      ['Выручка', data.metrics.revenue, '₸'],
      ['Расходы', data.metrics.expenses, '₸'],
      ['Чистая прибыль', data.metrics.netIncome, '₸'],
      ['Рентабельность', data.metrics.profitability.netMargin, '%'],
      ['ROA', data.metrics.profitability.roa, '%'],
      ['ROE', data.metrics.profitability.roe, '%'],
      [],
      ['ПРОГНОЗЫ'],
      ['Показатель', 'Прогноз', 'Доверие (%)'],
      ['Выручка', data.metrics.forecast.expectedRevenue, data.metrics.forecast.confidence],
      ['Прибыль', data.metrics.forecast.expectedProfit, data.metrics.forecast.confidence],
      ['Денежный поток', data.metrics.forecast.expectedCashFlow, data.metrics.forecast.confidence]
    ];
    
    workbook.Sheets['Сводка'] = this.arrayToSheet(summaryData);
    
    // Лист "Коэффициенты"
    const ratiosData = [
      ['КОЭФФИЦИЕНТЫ РЕНТАБЕЛЬНОСТИ'],
      ['Показатель', 'Значение (%)'],
      ['Валовая маржа', data.metrics.profitability.grossMargin],
      ['Чистая маржа', data.metrics.profitability.netMargin],
      ['EBITDA маржа', data.metrics.profitability.ebitdaMargin],
      ['ROA', data.metrics.profitability.roa],
      ['ROE', data.metrics.profitability.roe],
      ['ROIC', data.metrics.profitability.roic],
      [],
      ['КОЭФФИЦИЕНТЫ ЛИКВИДНОСТИ'],
      ['Показатель', 'Значение'],
      ['Текущая ликвидность', data.metrics.liquidity.currentRatio],
      ['Быстрая ликвидность', data.metrics.liquidity.quickRatio],
      ['Абсолютная ликвидность', data.metrics.liquidity.cashRatio],
      ['Операционный CF', data.metrics.liquidity.operatingCashFlowRatio],
      [],
      ['КОЭФФИЦИЕНТЫ ЭФФЕКТИВНОСТИ'],
      ['Показатель', 'Значение'],
      ['Оборачиваемость активов', data.metrics.efficiency.assetTurnover],
      ['Оборачиваемость запасов', data.metrics.efficiency.inventoryTurnover],
      ['Цикл конвертации (дни)', data.metrics.efficiency.cashConversionCycle]
    ];
    
    workbook.Sheets['Коэффициенты'] = this.arrayToSheet(ratiosData);
    
    // Лист "Транзакции"
    const transactionsHeader = ['ID', 'Дата', 'Описание', 'Категория', 'Сумма (₸)', 'Тип'];
    const transactionsData = [
      transactionsHeader,
      ...data.transactions.map(tx => [
        tx.id,
        new Date(tx.date).toLocaleDateString('ru-RU'),
        tx.description,
        tx.category,
        tx.amount,
        tx.amount > 0 ? 'Доход' : 'Расход'
      ])
    ];
    
    workbook.Sheets['Транзакции'] = this.arrayToSheet(transactionsData);
    
    // Лист "Анализ категорий"
    const categoryAnalysis = this.getCategoryAnalysis(data.transactions);
    const categoryHeader = ['Категория', 'Сумма (₸)', 'Доля (%)', 'Количество транзакций'];
    const categoryData = [
      categoryHeader,
      ...categoryAnalysis.map(cat => [
        cat.category,
        cat.totalAmount,
        cat.percentage,
        cat.count
      ])
    ];
    
    workbook.Sheets['Анализ категорий'] = this.arrayToSheet(categoryData);
    
    return workbook;
  }
  
  // Подготовка данных для PDF (расширенная версия)
  static preparePDFData(data: ExportData, options: ExportOptions) {
    return {
      title: 'FinSights AI - Расширенный финансовый отчет',
      subtitle: `Период: ${data.metadata.dateRange.start} - ${data.metadata.dateRange.end}`,
      generatedAt: data.metadata.generatedAt,
      
      // Исполнительное резюме
      executiveSummary: {
        totalRevenue: data.metrics.revenue,
        totalExpenses: data.metrics.expenses,
        netIncome: data.metrics.netIncome,
        profitMargin: data.metrics.profitability.netMargin,
        riskLevel: this.assessRiskLevel(data.metrics),
        keyInsights: this.generateKeyInsights(data.metrics)
      },
      
      // Детальные метрики
      metrics: data.metrics,
      
      // Графики и диаграммы (данные для рендеринга)
      charts: options.includeCharts ? {
        monthlyTrend: this.getMonthlyBreakdown(data.transactions),
        categoryBreakdown: this.getCategoryAnalysis(data.transactions),
        profitabilityTrend: this.getProfitabilityTrend(data.transactions)
      } : null,
      
      // Рекомендации
      recommendations: this.generateRecommendations(data.metrics),
      
      // Сравнение с отраслевыми показателями
      benchmarking: {
        industryComparison: data.metrics.benchmarks,
        performanceRating: this.calculatePerformanceRating(data.metrics)
      }
    };
  }
  
  // Вспомогательные методы
  private static arrayToSheet(data: any[][]): any {
    const sheet: any = {};
    const range = { s: { c: 0, r: 0 }, e: { c: 0, r: 0 } };
    
    for (let R = 0; R < data.length; R++) {
      for (let C = 0; C < data[R].length; C++) {
        if (range.s.r > R) range.s.r = R;
        if (range.s.c > C) range.s.c = C;
        if (range.e.r < R) range.e.r = R;
        if (range.e.c < C) range.e.c = C;
        
        const cell = { v: data[R][C] };
        if (cell.v === null) continue;
        
        const cellRef = this.encodeCellAddress({ c: C, r: R });
        
        if (typeof cell.v === 'number') {
          (cell as any).t = 'n';
        } else if (typeof cell.v === 'boolean') {
          (cell as any).t = 'b';
        } else {
          (cell as any).t = 's';
        }
        
        sheet[cellRef] = cell;
      }
    }
    
    if (range.s.c < 10000000) sheet['!ref'] = this.encodeRange(range);
    return sheet;
  }
  
  private static encodeCellAddress(cell: { c: number; r: number }): string {
    let col = '';
    let c = cell.c;
    while (c >= 0) {
      col = String.fromCharCode(65 + (c % 26)) + col;
      c = Math.floor(c / 26) - 1;
    }
    return col + (cell.r + 1);
  }
  
  private static encodeRange(range: any): string {
    return this.encodeCellAddress(range.s) + ':' + this.encodeCellAddress(range.e);
  }
  
  private static getCategoryAnalysis(transactions: Transaction[]) {
    const categoryMap = new Map<string, { totalAmount: number; count: number }>();
    
    transactions.forEach(tx => {
      const category = tx.category || 'Прочие';
      const existing = categoryMap.get(category) || { totalAmount: 0, count: 0 };
      
      categoryMap.set(category, {
        totalAmount: existing.totalAmount + Math.abs(tx.amount),
        count: existing.count + 1
      });
    });
    
    const total = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.totalAmount, 0);
    
    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        totalAmount: data.totalAmount,
        percentage: total > 0 ? (data.totalAmount / total) * 100 : 0,
        count: data.count
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }
  
  private static getMonthlyBreakdown(transactions: Transaction[]) {
    const monthlyMap = new Map<string, { revenue: number; expenses: number }>();
    
    transactions.forEach(tx => {
      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const existing = monthlyMap.get(monthKey) || { revenue: 0, expenses: 0 };
      
      if (tx.amount > 0) {
        existing.revenue += tx.amount;
      } else {
        existing.expenses += Math.abs(tx.amount);
      }
      
      monthlyMap.set(monthKey, existing);
    });
    
    return Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses,
        margin: data.revenue > 0 ? ((data.revenue - data.expenses) / data.revenue) * 100 : 0
      }));
  }
  
  private static getProfitabilityTrend(transactions: Transaction[]) {
    const monthly = this.getMonthlyBreakdown(transactions);
    return monthly.map(m => ({
      period: m.month,
      grossMargin: m.margin,
      netMargin: m.margin * 0.85, // Примерное значение
      ebitdaMargin: m.margin * 1.1
    }));
  }
  
  private static assessRiskLevel(metrics: AdvancedFinancialMetrics): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    if (metrics.liquidity.currentRatio < 1) riskScore += 30;
    else if (metrics.liquidity.currentRatio < 1.5) riskScore += 15;
    
    if (metrics.profitability.netMargin < 0) riskScore += 35;
    else if (metrics.profitability.netMargin < 5) riskScore += 20;
    
    if (metrics.leverage.debtToEquity > 2) riskScore += 25;
    else if (metrics.leverage.debtToEquity > 1) riskScore += 10;
    
    return riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : 'high';
  }
  
  private static generateKeyInsights(metrics: AdvancedFinancialMetrics): string[] {
    const insights: string[] = [];
    
    if (metrics.profitability.netMargin > 15) {
      insights.push('Отличная рентабельность - компания демонстрирует высокую эффективность');
    } else if (metrics.profitability.netMargin < 5) {
      insights.push('Низкая рентабельность требует внимания к оптимизации расходов');
    }
    
    if (metrics.liquidity.currentRatio > 2) {
      insights.push('Высокая ликвидность обеспечивает финансовую стабильность');
    } else if (metrics.liquidity.currentRatio < 1) {
      insights.push('Критически низкая ликвидность - требуется срочное внимание');
    }
    
    if (metrics.growth.revenueGrowth > 20) {
      insights.push('Впечатляющий рост выручки свидетельствует о сильной рыночной позиции');
    } else if (metrics.growth.revenueGrowth < 0) {
      insights.push('Снижение выручки требует пересмотра стратегии');
    }
    
    return insights;
  }
  
  private static generateRecommendations(metrics: AdvancedFinancialMetrics): string[] {
    const recommendations: string[] = [];
    
    if (metrics.profitability.netMargin < 10) {
      recommendations.push('Рассмотрите возможности для увеличения цен или снижения затрат');
    }
    
    if (metrics.liquidity.currentRatio < 1.5) {
      recommendations.push('Улучшите управление оборотным капиталом');
    }
    
    if (metrics.efficiency.assetTurnover < 1) {
      recommendations.push('Повысьте эффективность использования активов');
    }
    
    if (metrics.leverage.debtToEquity > 1.5) {
      recommendations.push('Рассмотрите снижение долговой нагрузки');
    }
    
    return recommendations;
  }
  
  private static calculatePerformanceRating(metrics: AdvancedFinancialMetrics): string {
    let score = 0;
    
    // Рентабельность (40%)
    if (metrics.profitability.netMargin > 15) score += 40;
    else if (metrics.profitability.netMargin > 10) score += 30;
    else if (metrics.profitability.netMargin > 5) score += 20;
    else if (metrics.profitability.netMargin > 0) score += 10;
    
    // Ликвидность (30%)
    if (metrics.liquidity.currentRatio > 2) score += 30;
    else if (metrics.liquidity.currentRatio > 1.5) score += 25;
    else if (metrics.liquidity.currentRatio > 1) score += 15;
    else score += 5;
    
    // Эффективность (30%)
    if (metrics.efficiency.assetTurnover > 1.5) score += 30;
    else if (metrics.efficiency.assetTurnover > 1) score += 20;
    else if (metrics.efficiency.assetTurnover > 0.5) score += 10;
    
    if (score >= 80) return 'Отлично';
    if (score >= 60) return 'Хорошо';
    if (score >= 40) return 'Удовлетворительно';
    return 'Требует улучшения';
  }
}