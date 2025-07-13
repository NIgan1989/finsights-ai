





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
  role: 'user' | 'model';
  content: string;
}

export type Granularity = 'day' | 'week' | 'month';

export type Theme = 'light' | 'dark';