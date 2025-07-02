export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  transactionType: 'operating' | 'investing' | 'financing';
  isCapitalized: boolean;
  needsClarification?: boolean;
}

export interface PnLData {
  totalRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  totalOperatingExpenses: number;
  ebitda: number;
  depreciation: number;
  ebit: number;
  financialExpense: number;
  financialIncome: number;
  ebt: number;
  taxes: number;
  netProfit: number;
  monthlyData: { month: string; Доход: number; Себестоимость: number; ОперРасходы: number; Амортизация: number; Прибыль: number }[];
  expenseByCategory: { name: string; value: number }[];
  ratios: {
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    roa: number;
    roe: number;
  };
}

export interface CashFlowData {
  operatingActivities: number;
  investingActivities: number;
  financingActivities: number;
  netCashFlow: number;
  operatingDetails: {
    fromNetIncome: number;
    depreciation: number;
    workingCapitalChanges: number;
  };
  investingDetails: {
    capitalExpenditures: number;
    assetDisposals: number;
    investments: number;
  };
  financingDetails: {
    debtProceeds: number;
    debtRepayments: number;
    equityChanges: number;
    dividends: number;
  };
  monthlyData: { month: string; Поступления: number; Выбытия: number; 'Чистый поток': number }[];
  liquidity: {
    operatingCashFlowRatio: number;
    cashConversionCycle: number;
  };
}

export interface BalanceSheetData {
  assets: {
    cash: number;
    accountsReceivable: number;
    inventory: number;
    shortTermInvestments: number;
    prepaidExpenses: number;
    totalCurrentAssets: number;
    equipment: number;
    realEstate: number;
    intangibleAssets: number;
    longTermInvestments: number;
    accumulatedDepreciation: number;
    netEquipment: number;
    totalNonCurrentAssets: number;
    totalAssets: number;
  };
  liabilities: {
    accountsPayable: number;
    shortTermLoans: number;
    accruedExpenses: number;
    taxesPayable: number;
    totalCurrentLiabilities: number;
    loansPayable: number;
    deferredTaxes: number;
    totalNonCurrentLiabilities: number;
    totalLiabilities: number;
  };
  equity: {
    authorizedCapital: number;
    retainedEarnings: number;
    ownerContributions: number;
    ownerWithdrawals: number;
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
  ratios: {
    currentRatio: number;
    quickRatio: number;
    debtToEquity: number;
    assetTurnover: number;
  };
}


export type FinancialReport = {
  pnl: PnLData,
  cashFlow: CashFlowData,
  balanceSheet: BalanceSheetData,
  dateRange?: {
    start: string;
    end: string;
  }
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}