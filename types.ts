





export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  counterparty?: string;
  transactionType: 'operating' | 'investing' | 'financing';
  isCapitalized: boolean;
  needsClarification?: boolean;
}

export interface BusinessProfile {
  id: string;
  businessName: string;
  businessType: string;
  businessModel: string;
  typicalIncomeSources: string;
  typicalExpenseCategories: string;
  ownerName: string;
}

export interface PnLData {
  totalRevenue: number;
  totalOperatingExpenses: number;
  depreciation: number;
  operatingProfit: number;
  netProfit: number;
  monthlyData: { month: string; Доход: number; Расход: number; Прибыль: number }[];
  expenseByCategory: { name: string; value: number }[];
}

export interface CashFlowData {
    netCashFlow: number;
    operatingActivities: number;
    investingActivities: number;
    financingActivities: number;
    monthlyData: { month: string; Поступления: number; Выбытия: number; 'Чистый поток': number }[];
}

export interface BalanceSheetData {
    assets: {
        cash: number;
        receivables: number; 
        equipment: number;
        accumulatedDepreciation: number;
        netEquipment: number;
        totalAssets: number;
    };
    liabilities: { 
        payables: number;
        totalLiabilities: number;
    };
    equity: {
        retainedEarnings: number;
        totalEquity: number;
    };
    totalLiabilitiesAndEquity: number;
}


export interface CounterpartyData {
    name: string;
    income: number;
    expense: number;
    balance: number;
}

export interface DebtData {
    counterparty: string;
    amount: number;
}

export interface DebtReport {
    receivables: DebtData[];
    payables: DebtData[];
    totalReceivables: number;
    totalPayables: number;
}

export type FinancialReport = {
    pnl: PnLData,
    cashFlow: CashFlowData,
    balanceSheet: BalanceSheetData,
    counterpartyReport: CounterpartyData[],
    debtReport: DebtReport,
}

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

export interface ForecastData {
  monthlyForecast: { 
    month: string; 
    forecastRevenue: number; 
    forecastExpenses: number; 
    forecastProfit: number;
  }[];
  summary: string;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

export type Granularity = 'day' | 'week' | 'month';

export type Theme = 'light' | 'dark';