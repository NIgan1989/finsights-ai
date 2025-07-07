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

// New types for user management and profiles

export type UserRole = 'owner' | 'admin' | 'editor' | 'accountant' | 'viewer';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
  permissions: Permission[];
}

export interface Permission {
  module: 'transactions' | 'reports' | 'budget' | 'settings' | 'users' | 'analytics';
  actions: ('read' | 'write' | 'delete' | 'manage')[];
}

export interface Company {
  id: string;
  name: string;
  legalName: string;
  taxId: string;
  registrationNumber: string;
  address: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
  industry: string;
  size: 'micro' | 'small' | 'medium' | 'large';
  currency: string;
  fiscalYearStart: string; // MM-DD format
  logo?: string;
  website?: string;
  phone?: string;
  createdAt: string;
  settings: CompanySettings;
}

export interface CompanySettings {
  language: 'en' | 'ru' | 'kk';
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  notifications: {
    email: boolean;
    push: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
    budgetAlerts: boolean;
    goalAlerts: boolean;
  };
  categories: {
    income: Category[];
    expense: Category[];
  };
  integrations: {
    openBanking: boolean;
    stripe: boolean;
    paypal: boolean;
  };
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
  isDefault: boolean;
  parentId?: string;
}

export interface Budget {
  id: string;
  name: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  categories: BudgetCategory[];
  status: 'draft' | 'active' | 'completed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategory {
  categoryId: string;
  budgetedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercentage: number;
}

export interface FinancialGoal {
  id: string;
  name: string;
  description: string;
  type: 'revenue' | 'profit' | 'expense_reduction' | 'cash_flow';
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  status: 'in_progress' | 'achieved' | 'overdue' | 'cancelled';
  category?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  budgetExceeded: boolean;
  goalDeadlineApproaching: boolean;
  unusualSpending: boolean;
  monthlyReport: boolean;
  taxDeadlines: boolean;
  lowCashFlow: boolean;
}

export interface UserProfile {
  userId: string;
  preferences: {
    dashboardLayout: 'grid' | 'list';
    defaultReportPeriod: 'month' | 'quarter' | 'year';
    currency: string;
    language: 'en' | 'ru' | 'kk';
    theme: 'light' | 'dark' | 'auto';
  };
  notifications: NotificationSettings;
  lastActiveCompany?: string;
}

export interface AuthState {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  industry: string;
  companySize: 'micro' | 'small' | 'medium' | 'large';
}

export interface BudgetAnalysis {
  totalBudgeted: number;
  totalActual: number;
  totalVariance: number;
  variancePercentage: number;
  categoriesOverBudget: number;
  categoriesUnderBudget: number;
  monthlyTrend: {
    month: string;
    budgeted: number;
    actual: number;
    variance: number;
  }[];
}