import { Transaction } from '../types';

// Расширенные финансовые метрики
export interface AdvancedFinancialMetrics {
  // Основные показатели
  revenue: number;
  expenses: number;
  netIncome: number;
  grossProfit: number;
  
  // Коэффициенты рентабельности
  profitability: {
    grossMargin: number;        // Валовая рентабельность
    netMargin: number;          // Чистая рентабельность
    ebitdaMargin: number;       // EBITDA рентабельность
    roa: number;                // Рентабельность активов
    roe: number;                // Рентабельность собственного капитала
    roic: number;               // Рентабельность инвестированного капитала
  };
  
  // Коэффициенты эффективности
  efficiency: {
    assetTurnover: number;      // Оборачиваемость активов
    inventoryTurnover: number;  // Оборачиваемость запасов
    receivablesTurnover: number; // Оборачиваемость дебиторской задолженности
    cashConversionCycle: number; // Цикл конвертации денежных средств
    workingCapitalTurnover: number; // Оборачиваемость оборотного капитала
  };
  
  // Коэффициенты ликвидности
  liquidity: {
    currentRatio: number;       // Коэффициент текущей ликвидности
    quickRatio: number;         // Коэффициент быстрой ликвидности
    cashRatio: number;          // Коэффициент абсолютной ликвидности
    operatingCashFlowRatio: number; // Коэффициент операционного денежного потока
  };
  
  // Коэффициенты долговой нагрузки
  leverage: {
    debtToEquity: number;       // Долг к собственному капиталу
    debtToAssets: number;       // Долг к активам
    interestCoverage: number;   // Покрытие процентов
    debtServiceCoverage: number; // Покрытие обслуживания долга
  };
  
  // Показатели роста
  growth: {
    revenueGrowth: number;      // Рост выручки
    profitGrowth: number;       // Рост прибыли
    assetGrowth: number;        // Рост активов
    equityGrowth: number;       // Рост собственного капитала
  };
  
  // Прогнозные показатели
  forecast: {
    expectedRevenue: number;    // Прогнозная выручка
    expectedProfit: number;     // Прогнозная прибыль
    expectedCashFlow: number;   // Прогнозный денежный поток
    confidence: number;         // Уровень доверия прогноза (0-100%)
  };
  
  // Бенчмарки отрасли
  benchmarks: {
    industryMedianROA: number;
    industryMedianROE: number;
    industryMedianMargin: number;
    companyVsIndustry: 'above' | 'below' | 'inline';
  };
}

// Детальный анализ категорий расходов
export interface CategoryAnalysis {
  category: string;
  amount: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: number; // -1 до 1
  prediction: number;  // Прогноз на следующий период
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

// Анализ денежных потоков
export interface CashFlowAnalysis {
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  
  // Детализация операционного потока
  operatingDetails: {
    netIncome: number;
    depreciation: number;
    workingCapitalChanges: number;
    otherOperatingActivities: number;
  };
  
  // Детализация инвестиционного потока
  investingDetails: {
    capitalExpenditures: number;
    assetDisposals: number;
    acquisitions: number;
    investments: number;
  };
  
  // Детализация финансового потока
  financingDetails: {
    debtProceeds: number;
    debtRepayments: number;
    equityProceeds: number;
    dividends: number;
  };
  
  // Показатели качества денежного потока
  quality: {
    operatingCashFlowToNetIncome: number;
    freeCashFlow: number;
    freeCashFlowYield: number;
    cashFlowCoverage: number;
  };
}

// Анализ рисков
export interface RiskAnalysis {
  overallRisk: 'low' | 'medium' | 'high';
  riskScore: number; // 0-100
  
  factors: {
    liquidityRisk: number;      // Риск ликвидности
    creditRisk: number;         // Кредитный риск
    operationalRisk: number;    // Операционный риск
    marketRisk: number;         // Рыночный риск
  };
  
  recommendations: string[];
  alerts: Array<{
    type: 'warning' | 'critical';
    message: string;
    action: string;
  }>;
}

export class AdvancedFinanceService {
  
  // Расчет продвинутых финансовых метрик
  static calculateAdvancedMetrics(
    transactions: Transaction[],
    assets: number = 1000000,
    equity: number = 500000,
    previousPeriodData?: {
      revenue: number;
      profit: number;
      assets: number;
      equity: number;
    }
  ): AdvancedFinancialMetrics {
    
    const revenue = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = Math.abs(transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));
    
    const netIncome = revenue - expenses;
    const grossProfit = revenue * 0.7; // Предполагаем 30% себестоимость
    const ebitda = netIncome + (expenses * 0.1); // Примерная амортизация
    
    // Коэффициенты рентабельности
    const profitability = {
      grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      netMargin: revenue > 0 ? (netIncome / revenue) * 100 : 0,
      ebitdaMargin: revenue > 0 ? (ebitda / revenue) * 100 : 0,
      roa: assets > 0 ? (netIncome / assets) * 100 : 0,
      roe: equity > 0 ? (netIncome / equity) * 100 : 0,
      roic: (assets - equity) > 0 ? (netIncome / (assets - equity)) * 100 : 0,
    };
    
    // Коэффициенты эффективности
    const efficiency = {
      assetTurnover: assets > 0 ? revenue / assets : 0,
      inventoryTurnover: 12, // Примерное значение
      receivablesTurnover: 8, // Примерное значение
      cashConversionCycle: 30, // Примерное значение в днях
      workingCapitalTurnover: revenue > 0 ? revenue / (assets * 0.3) : 0,
    };
    
    // Коэффициенты ликвидности
    const currentAssets = assets * 0.6;
    const currentLiabilities = (assets - equity) * 0.4;
    const cash = assets * 0.1;
    const quickAssets = currentAssets - (assets * 0.2); // Исключаем запасы
    
    const liquidity = {
      currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
      quickRatio: currentLiabilities > 0 ? quickAssets / currentLiabilities : 0,
      cashRatio: currentLiabilities > 0 ? cash / currentLiabilities : 0,
      operatingCashFlowRatio: currentLiabilities > 0 ? Math.max(netIncome, 0) / currentLiabilities : 0,
    };
    
    // Коэффициенты долговой нагрузки
    const totalDebt = assets - equity;
    const interestExpense = totalDebt * 0.05; // Примерная ставка 5%
    
    const leverage = {
      debtToEquity: equity > 0 ? totalDebt / equity : 0,
      debtToAssets: assets > 0 ? totalDebt / assets : 0,
      interestCoverage: interestExpense > 0 ? ebitda / interestExpense : 0,
      debtServiceCoverage: interestExpense > 0 ? ebitda / (interestExpense + totalDebt * 0.1) : 0,
    };
    
    // Показатели роста
    const growth = {
      revenueGrowth: previousPeriodData?.revenue ? 
        ((revenue - previousPeriodData.revenue) / previousPeriodData.revenue) * 100 : 0,
      profitGrowth: previousPeriodData?.profit ? 
        ((netIncome - previousPeriodData.profit) / Math.abs(previousPeriodData.profit)) * 100 : 0,
      assetGrowth: previousPeriodData?.assets ? 
        ((assets - previousPeriodData.assets) / previousPeriodData.assets) * 100 : 0,
      equityGrowth: previousPeriodData?.equity ? 
        ((equity - previousPeriodData.equity) / previousPeriodData.equity) * 100 : 0,
    };
    
    // Прогнозные показатели (простая линейная экстраполяция)
    const forecast = {
      expectedRevenue: revenue * (1 + growth.revenueGrowth / 100),
      expectedProfit: netIncome * (1 + growth.profitGrowth / 100),
      expectedCashFlow: netIncome * 1.1, // Предполагаем положительный денежный поток
      confidence: Math.min(80, Math.max(30, 100 - Math.abs(growth.revenueGrowth))),
    };
    
    // Бенчмарки отрасли (примерные значения)
    const benchmarks = {
      industryMedianROA: 8.5,
      industryMedianROE: 15.2,
      industryMedianMargin: 12.3,
      companyVsIndustry: profitability.netMargin > 12.3 ? 'above' as const : 
                        profitability.netMargin < 8 ? 'below' as const : 'inline' as const,
    };
    
    return {
      revenue,
      expenses,
      netIncome,
      grossProfit,
      profitability,
      efficiency,
      liquidity,
      leverage,
      growth,
      forecast,
      benchmarks,
    };
  }
  
  // Анализ категорий расходов
  static analyzeCategorySpending(transactions: Transaction[]): CategoryAnalysis[] {
    const categoryMap = new Map<string, number[]>();
    
    // Группировка по категориям
    transactions
      .filter(t => t.amount < 0)
      .forEach(t => {
        const category = t.category || 'Прочие';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, []);
        }
        categoryMap.get(category)!.push(Math.abs(t.amount));
      });
    
    const totalExpenses = Array.from(categoryMap.values())
      .flat()
      .reduce((sum, amount) => sum + amount, 0);
    
    // Анализ каждой категории
    return Array.from(categoryMap.entries()).map(([category, amounts]) => {
      const amount = amounts.reduce((sum, a) => sum + a, 0);
      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
      
      // Простой анализ тренда (по количеству транзакций)
      const avgAmount = amount / amounts.length;
      const recentAvg = amounts.slice(-Math.ceil(amounts.length / 3)).reduce((sum, a) => sum + a, 0) / 
                       Math.ceil(amounts.length / 3);
      
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (recentAvg > avgAmount * 1.1) trend = 'increasing';
      if (recentAvg < avgAmount * 0.9) trend = 'decreasing';
      
      // Генерация рекомендаций
      let recommendation = '';
      let priority: 'high' | 'medium' | 'low' = 'low';
      
      if (percentage > 30) {
        recommendation = 'Высокая доля расходов. Рассмотрите возможность оптимизации.';
        priority = 'high';
      } else if (percentage > 15 && trend === 'increasing') {
        recommendation = 'Растущие расходы требуют внимания и контроля.';
        priority = 'medium';
      } else if (trend === 'decreasing') {
        recommendation = 'Хорошее управление расходами. Продолжайте в том же духе.';
        priority = 'low';
      }
      
      return {
        category,
        amount,
        percentage,
        trend,
        seasonality: (Math.random() - 0.5) * 0.4, // Примерная сезонность
        prediction: amount * (trend === 'increasing' ? 1.1 : trend === 'decreasing' ? 0.9 : 1),
        recommendation,
        priority,
      };
    }).sort((a, b) => b.amount - a.amount);
  }
  
  // Анализ денежных потоков
  static analyzeCashFlow(transactions: Transaction[], assets: number = 1000000): CashFlowAnalysis {
    const revenue = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
    const netIncome = revenue - expenses;
    
    // Операционный денежный поток
    const depreciation = expenses * 0.05; // Примерная амортизация
    const workingCapitalChanges = netIncome * 0.1; // Примерное изменение оборотного капитала
    const operatingCashFlow = netIncome + depreciation - workingCapitalChanges;
    
    // Инвестиционный денежный поток
    const capitalExpenditures = revenue * 0.08; // Примерные капвложения
    const assetDisposals = capitalExpenditures * 0.1;
    const investingCashFlow = assetDisposals - capitalExpenditures;
    
    // Финансовый денежный поток
    const debtProceeds = Math.max(0, -investingCashFlow - operatingCashFlow);
    const financingCashFlow = debtProceeds;
    
    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
    
    return {
      operatingCashFlow,
      investingCashFlow,
      financingCashFlow,
      netCashFlow,
      operatingDetails: {
        netIncome,
        depreciation,
        workingCapitalChanges,
        otherOperatingActivities: 0,
      },
      investingDetails: {
        capitalExpenditures,
        assetDisposals,
        acquisitions: 0,
        investments: 0,
      },
      financingDetails: {
        debtProceeds,
        debtRepayments: 0,
        equityProceeds: 0,
        dividends: 0,
      },
      quality: {
        operatingCashFlowToNetIncome: netIncome !== 0 ? operatingCashFlow / netIncome : 0,
        freeCashFlow: operatingCashFlow - capitalExpenditures,
        freeCashFlowYield: assets > 0 ? (operatingCashFlow - capitalExpenditures) / assets : 0,
        cashFlowCoverage: expenses > 0 ? operatingCashFlow / expenses : 0,
      },
    };
  }
  
  // Анализ рисков
  static analyzeRisks(metrics: AdvancedFinancialMetrics, transactions: Transaction[]): RiskAnalysis {
    let riskScore = 0;
    const alerts: Array<{ type: 'warning' | 'critical'; message: string; action: string; }> = [];
    const recommendations: string[] = [];
    
    // Риск ликвидности
    let liquidityRisk = 0;
    if (metrics.liquidity.currentRatio < 1) {
      liquidityRisk = 30;
      alerts.push({
        type: 'critical',
        message: 'Критически низкий коэффициент текущей ликвидности',
        action: 'Увеличить оборотные активы или снизить краткосрочные обязательства'
      });
    } else if (metrics.liquidity.currentRatio < 1.5) {
      liquidityRisk = 15;
      alerts.push({
        type: 'warning',
        message: 'Низкий коэффициент текущей ликвидности',
        action: 'Мониторить денежные потоки'
      });
    }
    
    // Кредитный риск
    let creditRisk = 0;
    if (metrics.leverage.debtToEquity > 2) {
      creditRisk = 25;
      recommendations.push('Снизить долговую нагрузку');
    } else if (metrics.leverage.debtToEquity > 1) {
      creditRisk = 10;
    }
    
    // Операционный риск
    let operationalRisk = 0;
    if (metrics.profitability.netMargin < 0) {
      operationalRisk = 35;
      alerts.push({
        type: 'critical',
        message: 'Отрицательная рентабельность',
        action: 'Срочно пересмотреть операционную модель'
      });
    } else if (metrics.profitability.netMargin < 5) {
      operationalRisk = 20;
      recommendations.push('Повысить операционную эффективность');
    }
    
    // Рыночный риск (на основе волатильности доходов)
    const revenueTransactions = transactions.filter(t => t.amount > 0);
    const revenueVolatility = this.calculateVolatility(revenueTransactions.map(t => t.amount));
    let marketRisk = Math.min(30, revenueVolatility * 10);
    
    riskScore = liquidityRisk + creditRisk + operationalRisk + marketRisk;
    
    // Общие рекомендации
    if (riskScore < 30) {
      recommendations.push('Поддерживать текущую финансовую стратегию');
    } else if (riskScore < 60) {
      recommendations.push('Усилить финансовый контроль и мониторинг');
    } else {
      recommendations.push('Требуется немедленное вмешательство в финансовое управление');
    }
    
    return {
      overallRisk: riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : 'high',
      riskScore,
      factors: {
        liquidityRisk,
        creditRisk,
        operationalRisk,
        marketRisk,
      },
      recommendations,
      alerts,
    };
  }
  
  // Расчет волатильности
  private static calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance) / mean;
  }
  
  // Прогнозирование доходов (простая линейная регрессия)
  static forecastRevenue(transactions: Transaction[], periods: number = 3): number[] {
    const monthlyRevenue = this.getMonthlyRevenue(transactions);
    
    if (monthlyRevenue.length < 3) {
      // Недостаточно данных для прогноза
      return Array(periods).fill(monthlyRevenue[monthlyRevenue.length - 1] || 0);
    }
    
    // Простая линейная регрессия
    const n = monthlyRevenue.length;
    const x = Array.from({ length: n }, (_, i) => i + 1);
    const y = monthlyRevenue;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Генерация прогноза
    return Array.from({ length: periods }, (_, i) => {
      const futureX = n + i + 1;
      return Math.max(0, slope * futureX + intercept);
    });
  }
  
  // Получение месячной выручки
  private static getMonthlyRevenue(transactions: Transaction[]): number[] {
    const monthlyMap = new Map<string, number>();
    
    transactions
      .filter(t => t.amount > 0)
      .forEach(t => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + t.amount);
      });
    
    return Array.from(monthlyMap.values()).sort();
  }
}