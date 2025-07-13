import { Transaction, FinancialReport, BusinessProfile } from '../types';
import { generateFinancialReport } from './financeService';

// Расширенные типы для передовой финансовой отчетности
export interface AdvancedFinancialMetrics {
  // Показатели ликвидности
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  
  // Показатели рентабельности
  grossProfitMargin: number;
  operatingProfitMargin: number;
  netProfitMargin: number;
  returnOnAssets: number;
  returnOnEquity: number;
  
  // Показатели эффективности
  assetTurnover: number;
  inventoryTurnover: number;
  receivablesTurnover: number;
  
  // Показатели финансовой устойчивости
  debtToEquityRatio: number;
  debtToAssetsRatio: number;
  interestCoverageRatio: number;
  
  // Показатели роста
  revenueGrowthRate: number;
  profitGrowthRate: number;
  assetGrowthRate: number;
  
  // Показатели денежных потоков
  operatingCashFlowRatio: number;
  cashFlowCoverageRatio: number;
  freeCashFlow: number;
  
  // Показатели риска
  volatilityOfReturns: number;
  cashFlowVolatility: number;
  concentrationRisk: number;
}

export interface CashFlowAnalysis {
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  freeCashFlow: number;
  cashFlowFromOperations: number;
  workingCapitalChange: number;
  capitalExpenditure: number;
  dividendPayments: number;
  debtRepayments: number;
  newDebtIssued: number;
}

export interface ProfitabilityAnalysis {
  grossProfit: number;
  grossProfitMargin: number;
  operatingProfit: number;
  operatingProfitMargin: number;
  ebitda: number;
  ebitdaMargin: number;
  netProfit: number;
  netProfitMargin: number;
  contributionMargin: number;
  breakEvenPoint: number;
}

export interface EfficiencyMetrics {
  assetTurnover: number;
  inventoryTurnover: number;
  receivablesTurnover: number;
  payablesTurnover: number;
  workingCapitalTurnover: number;
  fixedAssetTurnover: number;
  employeeProductivity: number;
  costPerTransaction: number;
}

export interface RiskMetrics {
  liquidityRisk: number;
  solvencyRisk: number;
  operationalRisk: number;
  marketRisk: number;
  creditRisk: number;
  concentrationRisk: number;
  volatilityRisk: number;
}

export interface TrendAnalysis {
  revenueTrend: 'increasing' | 'decreasing' | 'stable';
  profitTrend: 'increasing' | 'decreasing' | 'stable';
  cashFlowTrend: 'increasing' | 'decreasing' | 'stable';
  expenseTrend: 'increasing' | 'decreasing' | 'stable';
  seasonality: {
    peakMonths: string[];
    lowMonths: string[];
    seasonalityIndex: number;
  };
}

export interface AdvancedFinancialReport extends FinancialReport {
  advancedMetrics: AdvancedFinancialMetrics;
  cashFlowAnalysis: CashFlowAnalysis;
  profitabilityAnalysis: ProfitabilityAnalysis;
  efficiencyMetrics: EfficiencyMetrics;
  riskMetrics: RiskMetrics;
  trendAnalysis: TrendAnalysis;
  kpis: {
    revenuePerEmployee: number;
    profitPerTransaction: number;
    cashConversionCycle: number;
    daysSalesOutstanding: number;
    daysPayablesOutstanding: number;
    daysInventoryOutstanding: number;
  };
  recommendations: string[];
  alerts: {
    critical: string[];
    warning: string[];
    info: string[];
  };
}

// Утилиты для расчетов
const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const calculateVolatility = (values: number[]): number => {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
};

const calculateSeasonality = (monthlyData: { month: string; value: number }[]): TrendAnalysis['seasonality'] => {
  const monthlyAverages = new Array(12).fill(0);
  const monthlyCounts = new Array(12).fill(0);
  
  monthlyData.forEach(({ month, value }) => {
    const monthIndex = new Date(month).getMonth();
    monthlyAverages[monthIndex] += value;
    monthlyCounts[monthIndex]++;
  });
  
  monthlyAverages.forEach((sum, index) => {
    if (monthlyCounts[index] > 0) {
      monthlyAverages[index] = sum / monthlyCounts[index];
    }
  });
  
  const overallAverage = monthlyAverages.reduce((sum, val) => sum + val, 0) / 12;
  const seasonalityIndex = monthlyAverages.reduce((sum, val) => sum + Math.abs(val - overallAverage), 0) / 12;
  
  const peakMonths = monthlyAverages
    .map((avg, index) => ({ avg, month: index }))
    .filter(({ avg }) => avg > overallAverage * 1.1)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3)
    .map(({ month }) => new Date(2024, month).toLocaleDateString('ru-RU', { month: 'long' }));
  
  const lowMonths = monthlyAverages
    .map((avg, index) => ({ avg, month: index }))
    .filter(({ avg }) => avg < overallAverage * 0.9)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3)
    .map(({ month }) => new Date(2024, month).toLocaleDateString('ru-RU', { month: 'long' }));
  
  return { peakMonths, lowMonths, seasonalityIndex };
};

export const generateAdvancedFinancialReport = (
  transactions: Transaction[], 
  profile?: BusinessProfile
): AdvancedFinancialReport => {
  // Базовая отчетность
  const baseReport = generateFinancialReport(transactions);
  
  if (transactions.length === 0) {
    return {
      ...baseReport,
      advancedMetrics: {
        currentRatio: 0, quickRatio: 0, cashRatio: 0,
        grossProfitMargin: 0, operatingProfitMargin: 0, netProfitMargin: 0,
        returnOnAssets: 0, returnOnEquity: 0,
        assetTurnover: 0, inventoryTurnover: 0, receivablesTurnover: 0,
        debtToEquityRatio: 0, debtToAssetsRatio: 0, interestCoverageRatio: 0,
        revenueGrowthRate: 0, profitGrowthRate: 0, assetGrowthRate: 0,
        operatingCashFlowRatio: 0, cashFlowCoverageRatio: 0, freeCashFlow: 0,
        volatilityOfReturns: 0, cashFlowVolatility: 0, concentrationRisk: 0
      },
      cashFlowAnalysis: {
        operatingCashFlow: 0, investingCashFlow: 0, financingCashFlow: 0,
        freeCashFlow: 0, cashFlowFromOperations: 0, workingCapitalChange: 0,
        capitalExpenditure: 0, dividendPayments: 0, debtRepayments: 0, newDebtIssued: 0
      },
      profitabilityAnalysis: {
        grossProfit: 0, grossProfitMargin: 0, operatingProfit: 0, operatingProfitMargin: 0,
        ebitda: 0, ebitdaMargin: 0, netProfit: 0, netProfitMargin: 0,
        contributionMargin: 0, breakEvenPoint: 0
      },
      efficiencyMetrics: {
        assetTurnover: 0, inventoryTurnover: 0, receivablesTurnover: 0,
        payablesTurnover: 0, workingCapitalTurnover: 0, fixedAssetTurnover: 0,
        employeeProductivity: 0, costPerTransaction: 0
      },
      riskMetrics: {
        liquidityRisk: 0, solvencyRisk: 0, operationalRisk: 0,
        marketRisk: 0, creditRisk: 0, concentrationRisk: 0, volatilityRisk: 0
      },
      trendAnalysis: {
        revenueTrend: 'stable', profitTrend: 'stable', cashFlowTrend: 'stable',
        expenseTrend: 'stable', seasonality: { peakMonths: [], lowMonths: [], seasonalityIndex: 0 }
      },
      kpis: {
        revenuePerEmployee: 0, profitPerTransaction: 0, cashConversionCycle: 0,
        daysSalesOutstanding: 0, daysPayablesOutstanding: 0, daysInventoryOutstanding: 0
      },
      recommendations: [],
      alerts: { critical: [], warning: [], info: [] }
    };
  }

  // Расчет расширенных метрик
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Группировка по месяцам для анализа трендов
  const monthlyData = new Map<string, {
    revenue: number;
    expenses: number;
    profit: number;
    cashFlow: number;
    transactions: number;
  }>();

  sortedTransactions.forEach(tx => {
    const month = new Date(tx.date).toISOString().slice(0, 7);
    const current = monthlyData.get(month) || {
      revenue: 0, expenses: 0, profit: 0, cashFlow: 0, transactions: 0
    };
    
    if (tx.type === 'income') {
      current.revenue += tx.amount;
      current.cashFlow += tx.amount;
    } else {
      current.expenses += tx.amount;
      current.cashFlow -= tx.amount;
    }
    
    current.profit = current.revenue - current.expenses;
    current.transactions++;
    monthlyData.set(month, current);
  });

  const monthlyArray = Array.from(monthlyData.entries()).sort();
  const revenueValues = monthlyArray.map(([, data]) => data.revenue);
  const profitValues = monthlyArray.map(([, data]) => data.profit);
  const cashFlowValues = monthlyArray.map(([, data]) => data.cashFlow);

  // Расчет трендов
  const revenueTrend = monthlyArray.length >= 2 
    ? (revenueValues[revenueValues.length - 1] > revenueValues[revenueValues.length - 2] ? 'increasing' : 'decreasing')
    : 'stable';
  
  const profitTrend = monthlyArray.length >= 2
    ? (profitValues[profitValues.length - 1] > profitValues[profitValues.length - 2] ? 'increasing' : 'decreasing')
    : 'stable';

  const cashFlowTrend = monthlyArray.length >= 2
    ? (cashFlowValues[cashFlowValues.length - 1] > cashFlowValues[cashFlowValues.length - 2] ? 'increasing' : 'decreasing')
    : 'stable';

  // Расчет сезонности
  const seasonalityData = monthlyArray.map(([month, data]) => ({
    month: new Date(month + '-01').toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
    value: data.revenue
  }));

  // Показатели ликвидности
  const currentAssets = baseReport.balanceSheet.assets.cash + baseReport.balanceSheet.assets.receivables;
  const currentLiabilities = baseReport.balanceSheet.liabilities.payables;
  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
  const quickRatio = currentLiabilities > 0 ? (currentAssets - 0) / currentLiabilities : 0; // Предполагаем 0 запасов
  const cashRatio = currentLiabilities > 0 ? baseReport.balanceSheet.assets.cash / currentLiabilities : 0;

  // Показатели рентабельности
  const totalRevenue = baseReport.pnl.totalRevenue;
  const totalExpenses = baseReport.pnl.totalOperatingExpenses;
  const netProfit = baseReport.pnl.netProfit;
  const totalAssets = baseReport.balanceSheet.assets.totalAssets;
  const totalEquity = baseReport.balanceSheet.equity.totalEquity;

  const grossProfitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
  const operatingProfitMargin = totalRevenue > 0 ? (baseReport.pnl.operatingProfit / totalRevenue) * 100 : 0;
  const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const returnOnAssets = totalAssets > 0 ? (netProfit / totalAssets) * 100 : 0;
  const returnOnEquity = totalEquity > 0 ? (netProfit / totalEquity) * 100 : 0;

  // Показатели эффективности
  const assetTurnover = totalAssets > 0 ? totalRevenue / totalAssets : 0;
  const receivablesTurnover = baseReport.balanceSheet.assets.receivables > 0 
    ? totalRevenue / baseReport.balanceSheet.assets.receivables : 0;

  // Показатели финансовой устойчивости
  const debtToEquityRatio = totalEquity > 0 ? currentLiabilities / totalEquity : 0;
  const debtToAssetsRatio = totalAssets > 0 ? currentLiabilities / totalAssets : 0;

  // Показатели роста
  const revenueGrowthRate = monthlyArray.length >= 2 
    ? calculateGrowthRate(revenueValues[revenueValues.length - 1], revenueValues[revenueValues.length - 2])
    : 0;
  const profitGrowthRate = monthlyArray.length >= 2
    ? calculateGrowthRate(profitValues[profitValues.length - 1], profitValues[profitValues.length - 2])
    : 0;

  // Показатели денежных потоков
  const operatingCashFlowRatio = currentLiabilities > 0 
    ? baseReport.cashFlow.operatingActivities / currentLiabilities : 0;
  const freeCashFlow = baseReport.cashFlow.operatingActivities - Math.abs(baseReport.cashFlow.investingActivities);

  // Показатели риска
  const volatilityOfReturns = calculateVolatility(profitValues);
  const cashFlowVolatility = calculateVolatility(cashFlowValues);
  
  // Концентрационный риск (доля крупнейших контрагентов)
  const totalCounterpartyVolume = baseReport.counterpartyReport.reduce((sum: number, cp: any) => 
    sum + Math.abs(cp.income) + Math.abs(cp.expense), 0);
  const topCounterpartyVolume = baseReport.counterpartyReport
    .slice(0, 3)
    .reduce((sum: number, cp: any) => sum + Math.abs(cp.income) + Math.abs(cp.expense), 0);
  const concentrationRisk = totalCounterpartyVolume > 0 ? (topCounterpartyVolume / totalCounterpartyVolume) * 100 : 0;

  // EBITDA
  const ebitda = baseReport.pnl.operatingProfit + baseReport.pnl.depreciation;
  const ebitdaMargin = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;

  // KPI
  const totalTransactions = transactions.length;
  const revenuePerTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const profitPerTransaction = totalTransactions > 0 ? netProfit / totalTransactions : 0;

  // Цикл конвертации денежных средств
  const daysSalesOutstanding = receivablesTurnover > 0 ? 365 / receivablesTurnover : 0;
  const daysPayablesOutstanding = 30; // Упрощенный расчет
  const daysInventoryOutstanding = 0; // Предполагаем 0 запасов
  const cashConversionCycle = daysSalesOutstanding + daysInventoryOutstanding - daysPayablesOutstanding;

  // Анализ денежных потоков
  const cashFlowAnalysis: CashFlowAnalysis = {
    operatingCashFlow: baseReport.cashFlow.operatingActivities,
    investingCashFlow: baseReport.cashFlow.investingActivities,
    financingCashFlow: baseReport.cashFlow.financingActivities,
    freeCashFlow,
    cashFlowFromOperations: baseReport.cashFlow.operatingActivities,
    workingCapitalChange: 0, // Упрощенный расчет
    capitalExpenditure: Math.abs(baseReport.cashFlow.investingActivities),
    dividendPayments: transactions
      .filter(tx => tx.category === 'Выплата дивидендов')
      .reduce((sum, tx) => sum + tx.amount, 0),
    debtRepayments: transactions
      .filter(tx => tx.category === 'Погашение кредита')
      .reduce((sum, tx) => sum + tx.amount, 0),
    newDebtIssued: transactions
      .filter(tx => tx.category === 'Получение кредита')
      .reduce((sum, tx) => sum + tx.amount, 0)
  };

  // Анализ рентабельности
  const profitabilityAnalysis: ProfitabilityAnalysis = {
    grossProfit: totalRevenue - totalExpenses,
    grossProfitMargin,
    operatingProfit: baseReport.pnl.operatingProfit,
    operatingProfitMargin,
    ebitda,
    ebitdaMargin,
    netProfit,
    netProfitMargin,
    contributionMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
    breakEvenPoint: totalExpenses // Упрощенный расчет
  };

  // Метрики эффективности
  const efficiencyMetrics: EfficiencyMetrics = {
    assetTurnover,
    inventoryTurnover: 0, // Предполагаем 0 запасов
    receivablesTurnover,
    payablesTurnover: 12, // Упрощенный расчет
    workingCapitalTurnover: currentAssets > 0 ? totalRevenue / currentAssets : 0,
    fixedAssetTurnover: baseReport.balanceSheet.assets.netEquipment > 0 
      ? totalRevenue / baseReport.balanceSheet.assets.netEquipment : 0,
    employeeProductivity: totalRevenue, // Упрощенный расчет
    costPerTransaction: totalTransactions > 0 ? totalExpenses / totalTransactions : 0
  };

  // Метрики риска
  const riskMetrics: RiskMetrics = {
    liquidityRisk: currentRatio < 1 ? 1 : 0,
    solvencyRisk: debtToEquityRatio > 1 ? 1 : 0,
    operationalRisk: netProfitMargin < 0 ? Math.abs(netProfitMargin) / 100 : 0,
    marketRisk: volatilityOfReturns / 100,
    creditRisk: baseReport.balanceSheet.assets.receivables / totalAssets,
    concentrationRisk: concentrationRisk / 100,
    volatilityRisk: cashFlowVolatility / 100
  };

  // Рекомендации и алерты
  const recommendations: string[] = [];
  const alerts = { critical: [] as string[], warning: [] as string[], info: [] as string[] };

  if (currentRatio < 1) {
    alerts.critical.push('Критически низкий коэффициент текущей ликвидности');
    recommendations.push('Увеличить оборотный капитал для покрытия краткосрочных обязательств');
  }

  if (netProfitMargin < 0) {
    alerts.critical.push('Отрицательная рентабельность');
    recommendations.push('Оптимизировать структуру расходов и увеличить доходы');
  }

  if (debtToEquityRatio > 1) {
    alerts.warning.push('Высокий уровень задолженности');
    recommendations.push('Рассмотреть возможность рефинансирования долга');
  }

  if (concentrationRisk > 50) {
    alerts.warning.push('Высокий концентрационный риск');
    recommendations.push('Диверсифицировать клиентскую базу');
  }

  if (cashFlowVolatility > 50) {
    alerts.warning.push('Высокая волатильность денежных потоков');
    recommendations.push('Создать резервный фонд для стабилизации денежных потоков');
  }

  if (revenueGrowthRate > 20) {
    alerts.info.push('Высокий рост выручки - отличные результаты!');
  }

  if (returnOnEquity > 15) {
    alerts.info.push('Высокая рентабельность собственного капитала');
  }

  return {
    ...baseReport,
    advancedMetrics: {
      currentRatio, quickRatio, cashRatio,
      grossProfitMargin, operatingProfitMargin, netProfitMargin,
      returnOnAssets, returnOnEquity,
      assetTurnover, inventoryTurnover: 0, receivablesTurnover,
      debtToEquityRatio, debtToAssetsRatio, interestCoverageRatio: 0,
      revenueGrowthRate, profitGrowthRate, assetGrowthRate: 0,
      operatingCashFlowRatio, cashFlowCoverageRatio: 0, freeCashFlow,
      volatilityOfReturns, cashFlowVolatility, concentrationRisk
    },
    cashFlowAnalysis,
    profitabilityAnalysis,
    efficiencyMetrics,
    riskMetrics,
    trendAnalysis: {
      revenueTrend, profitTrend, cashFlowTrend, expenseTrend: 'stable',
      seasonality: calculateSeasonality(seasonalityData)
    },
    kpis: {
      revenuePerEmployee: totalRevenue,
      profitPerTransaction,
      cashConversionCycle,
      daysSalesOutstanding,
      daysPayablesOutstanding,
      daysInventoryOutstanding
    },
    recommendations,
    alerts
  };
};