// Централизованная конфигурация тем
export interface ThemeColors {
  // Primary colors - Enhanced blue palette for financial trust
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryLight: string;
  primaryDark: string;
  
  // Secondary colors - Complementary accent colors
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  secondaryLight: string;
  secondaryDark: string;
  
  // Text colors - High contrast for accessibility
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  textAccent: string;
  textWhite: string;
  
  // Surface colors - Layered depth system
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  surfaceElevated: string;
  
  // Border colors - Subtle definition
  border: string;
  borderHover: string;
  borderActive: string;
  borderLight: string;
  borderDark: string;
  borderFocus: string;
  
  // Background colors - Clean foundation
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  backgroundOverlay: string;
  
  // Financial status colors - Semantic meaning
  success: string;
  successHover: string;
  successLight: string;
  successDark: string;
  warning: string;
  warningHover: string;
  warningLight: string;
  warningDark: string;
  error: string;
  errorHover: string;
  errorLight: string;
  errorDark: string;
  info: string;
  infoHover: string;
  infoLight: string;
  infoDark: string;
  
  // Financial data colors - Specialized for metrics
  profit: string;
  profitLight: string;
  loss: string;
  lossLight: string;
  neutral: string;
  neutralLight: string;
  growth: string;
  growthLight: string;
  decline: string;
  declineLight: string;
  
  // Chart colors - Data visualization palette
  chartPrimary: string;
  chartSecondary: string;
  chartTertiary: string;
  chartQuaternary: string;
  chartAccent: string;
  chartMuted: string;
  
  // Chart line settings - Enhanced visibility
  chartLinePrimary: string;
  chartLineSecondary: string;
  chartLineTertiary: string;
  chartLineAccent: string;
  chartLineGrid: string;
  chartLineAxis: string;
  
  // Page container background colors
  pageDashboard: string;
  pageAnalytics: string;
  pageTransactions: string;
  pageReports: string;
  pageSettings: string;
  
  // Sidebar colors - distinct from page backgrounds
  sidebarBackground: string;
  sidebarSurface: string;
  sidebarBorder: string;
  sidebarCard: string;
  sidebarHover: string;
  
  // Standard theme colors for compatibility
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primaryForeground: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  input: string;
  ring: string;
  surfaceSubtle: string;
  textSuccess: string;
  textWarning: string;
  textError: string;
  textInfo: string;
  
  // Градиенты
  gradients: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    profit: string;
    loss: string;
    neutral: string;
    chart: string;
    chartHover: string;
    statBlue: string;
    statPurple: string;
    statGreen: string;
    statOrange: string;
    sidebarHeader: string;
    sidebarActive: string;
    sidebarLogo: string;
    sidebarStatusPro: string;
    sidebarStatusGuest: string;
    sidebarPageProfile: string;
    sidebarPageDashboard: string;
    sidebarPageTransactions: string;
    sidebarPageAiAssistant: string;
    sidebarPageFinancialModel: string;
    // Дополнительные градиенты для компонентов
    resultsHeader: string;
    backgroundLight: string;
    pricingBackground: string;
    pricingTitle: string;
    pricingPopular: string;
    pricingIconPro: string;
    pricingIconFree: string;
    pricingButtonPro: string;
    pricingButtonProHover: string;
    pricingPayment: string;
    pricingPaymentIcon: string;
    pricingPaymentButton: string;
    pricingPaymentButtonHover: string;
    uploadBackground: string;
    uploadDragActive: string;
    uploadDragHover: string;
    uploadProcessing: string;
    uploadDrop: string;
    uploadDefault: string;
    uploadSelected: string;
    uploadError: string;
    uploadErrorIcon: string;
    uploadFilePdf: string;
    uploadFileCsv: string;
    uploadFileImage: string;
  };
  
  // Логотипы и брендинг
  logos: {
    // Основной логотип в сайдбаре
    sidebarMainBackground: string;
    sidebarMainText: string;
    sidebarMainBorder: string;
    // Компактный логотип профиля
    profileAvatarBackground: string;
    profileAvatarText: string;
    profileAvatarBorder: string;
    // Мобильный логотип
    mobileHeaderBackground: string;
    mobileHeaderText: string;
    mobileHeaderBorder: string;
    // Статусные бейджи
    statusProBackground: string;
    statusProText: string;
    statusFreeBackground: string;
    statusFreeText: string;
    statusGuestBackground: string;
    statusGuestText: string;
  };
  
  // Тени
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    card: string;
    cardHover: string;
  };
}

export interface Theme {
  name: string;
  displayName: string;
  colors: ThemeColors;
}

// Светлая тема
const lightTheme: Theme = {
  name: 'light',
  displayName: 'Светлая',
  colors: {
    // Primary colors - Enhanced blue palette for financial trust
    primary: '#1e40af', // blue-800 - Professional trust color
    primaryHover: '#1d4ed8', // blue-700
    primaryActive: '#1e3a8a', // blue-900
    primaryLight: '#3b82f6', // blue-500
    primaryDark: '#1e3a8a', // blue-900
    
    // Secondary colors - Complementary accent colors
    secondary: '#64748b', // slate-500
    secondaryHover: '#475569', // slate-600
    secondaryActive: '#334155', // slate-700
    secondaryLight: '#94a3b8', // slate-400
    secondaryDark: '#334155', // slate-700
    
    // Text colors - High contrast for accessibility
    textPrimary: '#0f172a', // slate-900 - High contrast 4.5:1+
    textSecondary: '#475569', // slate-600
    textMuted: '#64748b', // slate-500 - Improved contrast
    textInverse: '#ffffff',
    textAccent: '#1e40af', // blue-800
    textWhite: '#ffffff', // white - Always white regardless of theme
    
    // Surface colors - Layered depth system
    surface: '#ffffff',
    surfaceHover: '#f8fafc', // slate-50
    surfaceActive: '#f1f5f9', // slate-100
    surfaceSecondary: '#f8fafc', // slate-50
    surfaceTertiary: '#f1f5f9', // slate-100
    surfaceElevated: '#ffffff', // Elevated cards
    
    // Border colors - Subtle definition
    border: '#e2e8f0', // slate-200
    borderHover: '#cbd5e1', // slate-300
    borderActive: '#94a3b8', // slate-400
    borderLight: '#f1f5f9', // slate-100
    borderDark: '#64748b', // slate-500
    borderFocus: '#3b82f6', // blue-500 - Focus indicator
    
    // Background colors - Clean foundation
    background: '#ffffff',
    backgroundSecondary: '#f8fafc', // slate-50
    backgroundTertiary: '#f1f5f9', // slate-100
    backgroundOverlay: 'rgba(15, 23, 42, 0.5)', // slate-900 with opacity
    
    // Financial status colors - Semantic meaning
    success: '#059669', // emerald-600 - Profit/positive
    successHover: '#047857', // emerald-700
    successLight: '#d1fae5', // emerald-100
    successDark: '#065f46', // emerald-800
    warning: '#d97706', // amber-600 - Caution/neutral
    warningHover: '#b45309', // amber-700
    warningLight: '#fef3c7', // amber-100
    warningDark: '#92400e', // amber-800
    error: '#dc2626', // red-600 - Loss/negative
    errorHover: '#b91c1c', // red-700
    errorLight: '#fee2e2', // red-100
    errorDark: '#991b1b', // red-800
    info: '#2563eb', // blue-600 - Information
    infoHover: '#1d4ed8', // blue-700
    infoLight: '#dbeafe', // blue-100
    infoDark: '#1e40af', // blue-800
    
    // Financial data colors - Specialized for metrics
    profit: '#10b981', // emerald-500 - Clear profit indicator
    profitLight: '#a7f3d0', // emerald-200
    loss: '#ef4444', // red-500 - Clear loss indicator
    lossLight: '#fecaca', // red-200
    neutral: '#6b7280', // gray-500 - Neutral/break-even
    neutralLight: '#d1d5db', // gray-300
    growth: '#22c55e', // green-500 - Positive trend
    growthLight: '#bbf7d0', // green-200
    decline: '#f59e0b', // amber-500 - Negative trend
    declineLight: '#fed7aa', // amber-200
    
    // Chart colors - Data visualization palette
    chartPrimary: '#1e40af', // blue-800
    chartSecondary: '#059669', // emerald-600
    chartTertiary: '#d97706', // amber-600
    chartQuaternary: '#7c3aed', // violet-600
    chartAccent: '#dc2626', // red-600
    chartMuted: '#64748b', // slate-500
    
    // Chart line settings - Enhanced visibility for light theme
    chartLinePrimary: '#1e3a8a', // blue-900 - более темный и заметный
    chartLineSecondary: '#065f46', // emerald-800 - более контрастный
    chartLineTertiary: '#b45309', // amber-700 - более насыщенный
    chartLineAccent: '#991b1b', // red-800 - более глубокий
    chartLineGrid: 'rgba(30, 64, 175, 0.15)', // blue с прозрачностью
    chartLineAxis: 'rgba(30, 64, 175, 0.3)', // blue с большей прозрачностью
    
    // Page container background colors
    pageDashboard: '#f8fafc', // slate-50
    pageAnalytics: '#f1f5f9', // slate-100
    pageTransactions: '#ffffff', // white
    pageReports: '#f8fafc', // slate-50
    pageSettings: '#f1f5f9', // slate-100
    
    // Sidebar colors for light theme - distinct from page backgrounds
    sidebarBackground: '#ffffff', // white - different from page backgrounds
    sidebarSurface: '#f8fafc', // slate-50 - lighter than pages
    sidebarBorder: '#e2e8f0', // slate-200 - subtle border
    sidebarCard: '#ffffff', // white - elevated cards in sidebar
    sidebarHover: '#f1f5f9', // slate-100 - hover states
    
    // Standard theme colors for compatibility
    foreground: '#0f172a', // slate-900
    card: '#ffffff',
    cardForeground: '#0f172a', // slate-900
    popover: '#ffffff',
    popoverForeground: '#0f172a', // slate-900
    primaryForeground: '#ffffff',
    secondaryForeground: '#ffffff',
    muted: '#f1f5f9', // slate-100
    mutedForeground: '#64748b', // slate-500
    accent: '#f1f5f9', // slate-100
    accentForeground: '#0f172a', // slate-900
    destructive: '#dc2626', // red-600
    destructiveForeground: '#ffffff',
    input: '#ffffff',
    ring: '#3b82f6', // blue-500
    surfaceSubtle: '#f8fafc', // slate-50
    textSuccess: '#059669', // emerald-600
    textWarning: '#d97706', // amber-600
    textError: '#dc2626', // red-600
    textInfo: '#2563eb', // blue-600
    
    gradients: {
      // Enhanced gradients for financial applications
      primary: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e3a8a 100%)',
      secondary: 'linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #475569 100%)',
      success: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #047857 100%)',
      warning: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #b45309 100%)',
      error: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #b91c1c 100%)',
      // Financial data gradients
      profit: 'linear-gradient(135deg, #10b981 0%, #22c55e 50%, #059669 100%)',
      loss: 'linear-gradient(135deg, #ef4444 0%, #f87171 50%, #dc2626 100%)',
      neutral: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 50%, #4b5563 100%)',
      // Chart gradients for data visualization
      chart: 'linear-gradient(135deg, #1e40af 0%, #059669 25%, #d97706 50%, #7c3aed 75%, #dc2626 100%)',
      chartHover: 'linear-gradient(135deg, #3b82f6 0%, #10b981 25%, #f59e0b 50%, #8b5cf6 75%, #ef4444 100%)',
      statBlue: 'linear-gradient(135deg, hsl(220 40% 94%) 0%, hsl(220 40% 86%) 100%)',
      statPurple: 'linear-gradient(135deg, hsl(262.1 40% 92%) 0%, hsl(262.1 40% 84%) 100%)',
      statGreen: 'linear-gradient(135deg, hsl(142.1 40% 92%) 0%, hsl(142.1 40% 84%) 100%)',
      statOrange: 'linear-gradient(135deg, hsl(38 40% 92%) 0%, hsl(38 40% 84%) 100%)',
      sidebarHeader: 'linear-gradient(135deg, hsl(220 98% 97%) 0%, hsl(220 95% 94%) 100%)', // Very light blue
      sidebarActive: 'linear-gradient(135deg, hsl(220 90% 96%) 0%, hsl(220 85% 92%) 100%)', // Light active state
      sidebarLogo: 'linear-gradient(135deg, hsl(220 95% 96%) 0%, hsl(220 90% 92%) 100%)', // Ultra light logo
      sidebarStatusPro: 'linear-gradient(135deg, hsl(142 90% 96%) 0%, hsl(142 85% 92%) 100%)', // Light green
      sidebarStatusGuest: 'linear-gradient(135deg, hsl(38 90% 96%) 0%, hsl(38 85% 92%) 100%)', // Light amber
      sidebarPageProfile: 'linear-gradient(135deg, hsl(220 90% 96%) 0%, hsl(220 85% 92%) 100%)', // Light blue profile
      sidebarPageDashboard: 'linear-gradient(135deg, hsl(142 90% 96%) 0%, hsl(142 85% 92%) 100%)', // Light green dashboard
      sidebarPageTransactions: 'linear-gradient(135deg, hsl(262 90% 96%) 0%, hsl(262 85% 92%) 100%)', // Light purple transactions
      sidebarPageAiAssistant: 'linear-gradient(135deg, hsl(38 90% 96%) 0%, hsl(38 85% 92%) 100%)', // Light amber AI
      sidebarPageFinancialModel: 'linear-gradient(135deg, hsl(300 90% 96%) 0%, hsl(300 85% 92%) 100%)', // Light pink financial
      // Дополнительные градиенты для компонентов
      resultsHeader: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e3a8a 100%)',
      backgroundLight: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
      pricingBackground: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)',
      pricingTitle: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #059669 100%)',
      pricingPopular: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      pricingIconPro: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
      pricingIconFree: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
      pricingButtonPro: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
      pricingButtonProHover: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
      pricingPayment: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)',
      pricingPaymentIcon: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      pricingPaymentButton: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      pricingPaymentButtonHover: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
      uploadBackground: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)',
      uploadDragActive: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      uploadDragHover: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
      uploadProcessing: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
      uploadDrop: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      uploadDefault: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
      uploadSelected: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      uploadError: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      uploadErrorIcon: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
      uploadFilePdf: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      uploadFileCsv: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      uploadFileImage: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    },
    
    // Логотипы и брендинг для светлой темы
    logos: {
      // Основной логотип в сайдбаре
      sidebarMainBackground: '#1e40af', // blue-800 - синий фон
      sidebarMainText: '#ffffff', // белый текст
      sidebarMainBorder: '#1d4ed8', // blue-700 - темнее для границы
      // Компактный логотип профиля
      profileAvatarBackground: '#1e40af', // blue-800
      profileAvatarText: '#ffffff', // белый текст
      profileAvatarBorder: '#dbeafe', // blue-100 - светлая граница
      // Мобильный логотип
      mobileHeaderBackground: '#1e40af', // blue-800
      mobileHeaderText: '#ffffff', // белый текст
      mobileHeaderBorder: '#1d4ed8', // blue-700
      // Статусные бейджи
      statusProBackground: '#059669', // emerald-600 для PRO
      statusProText: '#ffffff', // белый текст
      statusFreeBackground: '#6b7280', // gray-500 для FREE
      statusFreeText: '#ffffff', // белый текст
      statusGuestBackground: '#d97706', // amber-600 для GUEST
      statusGuestText: '#ffffff', // белый текст
    },
    
    shadows: {
      // Enhanced shadows for depth and elevation
      sm: '0 1px 2px 0 rgba(30, 64, 175, 0.05)',
      md: '0 4px 6px -1px rgba(30, 64, 175, 0.1), 0 2px 4px -1px rgba(30, 64, 175, 0.06)',
      lg: '0 10px 15px -3px rgba(30, 64, 175, 0.1), 0 4px 6px -2px rgba(30, 64, 175, 0.05)',
      xl: '0 20px 25px -5px rgba(30, 64, 175, 0.1), 0 10px 10px -5px rgba(30, 64, 175, 0.04)',
      '2xl': '0 25px 50px -12px rgba(30, 64, 175, 0.25)',
      card: '0 4px 6px -1px rgba(30, 64, 175, 0.1), 0 2px 4px -1px rgba(30, 64, 175, 0.06)',
      cardHover: '0 10px 15px -3px rgba(30, 64, 175, 0.1), 0 4px 6px -2px rgba(30, 64, 175, 0.05)',
    },
  },
};

// Светлая зеленая тема
const darkTheme: Theme = {
  name: 'dark',
  displayName: 'Светлая зеленая',
  colors: {
    // Primary colors - Enhanced green palette for fresh look
    primary: '#059669', // emerald-600 - Fresh green primary
    primaryHover: '#047857', // emerald-700
    primaryActive: '#065f46', // emerald-800
    primaryLight: '#10b981', // emerald-500
    primaryDark: '#064e3b', // emerald-900
    
    // Secondary colors - Complementary warm colors
    secondary: '#d97706', // amber-600
    secondaryHover: '#b45309', // amber-700
    secondaryActive: '#92400e', // amber-800
    secondaryLight: '#f59e0b', // amber-500
    secondaryDark: '#78350f', // amber-900
    
    // Text colors - High contrast for dark background
    textPrimary: '#f9fafb', // gray-50 - светлый текст
    textSecondary: '#e5e7eb', // gray-200
    textMuted: '#d1d5db', // gray-300 - достаточный контраст
    textInverse: '#1f2937', // gray-800
    textAccent: '#10b981', // emerald-500
    textWhite: '#ffffff', // white - Always white regardless of theme
    
    // Surface colors - Dark system
    surface: '#374151', // gray-700
    surfaceHover: '#4b5563', // gray-600
    surfaceActive: '#6b7280', // gray-500
    surfaceSecondary: '#4b5563', // gray-600
    surfaceTertiary: '#6b7280', // gray-500
    surfaceElevated: '#4b5563', // gray-600 - Elevated cards
    
    // Border colors - Dark theme borders
    border: '#6b7280', // gray-500
    borderHover: '#9ca3af', // gray-400
    borderActive: '#d1d5db', // gray-300
    borderLight: '#4b5563', // gray-600
    borderDark: '#374151', // gray-700
    borderFocus: '#10b981', // emerald-500 - Focus indicator
    
    // Background colors - Darker foundation
    background: '#1f2937', // gray-800 - темный фон
    backgroundSecondary: '#374151', // gray-700
    backgroundTertiary: '#4b5563', // gray-600
    backgroundOverlay: 'rgba(6, 78, 59, 0.3)', // emerald-900 with opacity
    
    // Financial status colors - Semantic meaning
    success: '#10b981', // emerald-500 - Profit/positive
    successHover: '#059669', // emerald-600
    successLight: '#064e3b', // emerald-900
    successDark: '#022c22', // emerald-950
    warning: '#f59e0b', // amber-500 - Caution/neutral
    warningHover: '#d97706', // amber-600
    warningLight: '#78350f', // amber-900
    warningDark: '#451a03', // amber-950
    error: '#ef4444', // red-500 - Loss/negative
    errorHover: '#dc2626', // red-600
    errorLight: '#7f1d1d', // red-900
    errorDark: '#450a0a', // red-950
    info: '#3b82f6', // blue-500 - Information
    infoHover: '#2563eb', // blue-600
    infoLight: '#1e3a8a', // blue-900
    infoDark: '#172554', // blue-950
    
    // Financial data colors - Specialized for metrics
    profit: '#22c55e', // green-500 - Clear profit indicator
    profitLight: '#166534', // green-800
    loss: '#f87171', // red-400 - Clear loss indicator
    lossLight: '#991b1b', // red-800
    neutral: '#9ca3af', // gray-400 - Neutral/break-even
    neutralLight: '#374151', // gray-700
    growth: '#34d399', // emerald-400 - Positive trend
    growthLight: '#047857', // emerald-700
    decline: '#fbbf24', // amber-400 - Negative trend
    declineLight: '#b45309', // amber-700
    
    // Chart colors - Data visualization palette
    chartPrimary: '#3b82f6', // blue-500
    chartSecondary: '#10b981', // emerald-500
    chartTertiary: '#f59e0b', // amber-500
    chartQuaternary: '#8b5cf6', // violet-500
    chartAccent: '#ef4444', // red-500
    chartMuted: '#64748b', // slate-500
    
    // Chart line settings - Enhanced visibility for dark theme
    chartLinePrimary: '#60a5fa', // blue-400 - более светлый и заметный
    chartLineSecondary: '#34d399', // emerald-400 - более яркий
    chartLineTertiary: '#fbbf24', // amber-400 - более насыщенный
    chartLineAccent: '#f87171', // red-400 - более контрастный
    chartLineGrid: 'rgba(96, 165, 250, 0.2)', // blue-400 с прозрачностью
    chartLineAxis: 'rgba(96, 165, 250, 0.4)', // blue-400 с большей прозрачностью
    
    // Page container background colors
    pageDashboard: '#1f2937', // gray-800 - темный фон
    pageAnalytics: '#374151', // gray-700
    pageTransactions: '#1f2937', // gray-800
    pageReports: '#1f2937', // gray-800
    pageSettings: '#374151', // gray-700
    
    // Sidebar colors for dark green theme
    sidebarBackground: '#374151', // gray-700
    sidebarSurface: '#4b5563', // gray-600
    sidebarBorder: '#6b7280', // gray-500
    sidebarCard: '#4b5563', // gray-600
    sidebarHover: '#6b7280', // gray-500
    
    // Standard theme colors for compatibility
    foreground: '#f9fafb', // gray-50 - светлый текст на темном фоне
    card: '#374151', // gray-700 - темные карточки
    cardForeground: '#f9fafb', // gray-50
    popover: '#374151', // gray-700
    popoverForeground: '#f9fafb', // gray-50
    primaryForeground: '#ffffff', // white
    secondaryForeground: '#ffffff', // white
    muted: '#4b5563', // gray-600
    mutedForeground: '#d1d5db', // gray-300
    accent: '#4b5563', // gray-600
    accentForeground: '#f9fafb', // gray-50
    destructive: '#dc2626', // red-600
    destructiveForeground: '#ffffff', // white
    input: '#374151', // gray-700
    ring: '#10b981', // emerald-500
    surfaceSubtle: '#4b5563', // gray-600
    textSuccess: '#10b981', // emerald-500
    textWarning: '#f59e0b', // amber-500
    textError: '#ef4444', // red-500
    textInfo: '#3b82f6', // blue-500
    
    gradients: {
      // Enhanced gradients for light green theme
      primary: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #047857 100%)',
      secondary: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #b45309 100%)',
      success: 'linear-gradient(135deg, #10b981 0%, #22c55e 50%, #059669 100%)',
      warning: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%)',
      error: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #b91c1c 100%)',
      // Financial data gradients for light green theme
      profit: 'linear-gradient(135deg, #10b981 0%, #22c55e 50%, #059669 100%)',
      loss: 'linear-gradient(135deg, #ef4444 0%, #f87171 50%, #dc2626 100%)',
      neutral: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 50%, #4b5563 100%)',
      // Chart gradients for data visualization in light green theme
      chart: 'linear-gradient(135deg, #059669 0%, #10b981 25%, #f59e0b 50%, #7c3aed 75%, #dc2626 100%)',
      chartHover: 'linear-gradient(135deg, #10b981 0%, #22c55e 25%, #fbbf24 50%, #8b5cf6 75%, #ef4444 100%)',
      statBlue: 'linear-gradient(135deg, hsl(220 40% 94%) 0%, hsl(220 40% 86%) 100%)',
       statPurple: 'linear-gradient(135deg, hsl(262.1 40% 92%) 0%, hsl(262.1 40% 84%) 100%)',
       statGreen: 'linear-gradient(135deg, hsl(142.1 40% 92%) 0%, hsl(142.1 40% 84%) 100%)',
       statOrange: 'linear-gradient(135deg, hsl(38 40% 92%) 0%, hsl(38 40% 84%) 100%)',
      sidebarHeader: 'linear-gradient(135deg, hsl(142 98% 97%) 0%, hsl(142 95% 94%) 100%)',
       sidebarActive: 'linear-gradient(135deg, hsl(142 90% 96%) 0%, hsl(142 85% 92%) 100%)',
       sidebarLogo: 'linear-gradient(135deg, hsl(142 95% 96%) 0%, hsl(142 90% 92%) 100%)',
       sidebarStatusPro: 'linear-gradient(135deg, hsl(142 90% 96%) 0%, hsl(142 85% 92%) 100%)',
       sidebarStatusGuest: 'linear-gradient(135deg, hsl(38 90% 96%) 0%, hsl(38 85% 92%) 100%)',
      sidebarPageProfile: 'linear-gradient(135deg, hsl(220 90% 96%) 0%, hsl(220 85% 92%) 100%)',
       sidebarPageDashboard: 'linear-gradient(135deg, hsl(142 90% 96%) 0%, hsl(142 85% 92%) 100%)',
       sidebarPageTransactions: 'linear-gradient(135deg, hsl(262 90% 96%) 0%, hsl(262 85% 92%) 100%)',
       sidebarPageAiAssistant: 'linear-gradient(135deg, hsl(38 90% 96%) 0%, hsl(38 85% 92%) 100%)',
       sidebarPageFinancialModel: 'linear-gradient(135deg, hsl(300 90% 96%) 0%, hsl(300 85% 92%) 100%)',
      // Дополнительные градиенты для компонентов
       resultsHeader: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #047857 100%)',
       backgroundLight: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #dcfce7 100%)',
       pricingBackground: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #dcfce7 100%)',
       pricingTitle: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #d97706 100%)',
       pricingPopular: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
       pricingIconPro: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
       pricingIconFree: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
       pricingButtonPro: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
       pricingButtonProHover: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
      pricingPayment: 'linear-gradient(135deg, #78350f 0%, #92400e 100%)',
      pricingPaymentIcon: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      pricingPaymentButton: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      pricingPaymentButtonHover: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      uploadBackground: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #dcfce7 100%)',
       uploadDragActive: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
       uploadDragHover: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
       uploadProcessing: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
       uploadDrop: 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)',
       uploadDefault: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
       uploadSelected: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
       uploadError: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
       uploadErrorIcon: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
       uploadFilePdf: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
       uploadFileCsv: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
       uploadFileImage: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    },
    
    // Логотипы и брендинг для темной темы
    logos: {
      // Основной логотип в сайдбаре
      sidebarMainBackground: '#059669', // emerald-600 - зеленый фон
      sidebarMainText: '#ffffff', // белый текст
      sidebarMainBorder: '#047857', // emerald-700 - темнее для границы
      // Компактный логотип профиля
      profileAvatarBackground: '#059669', // emerald-600
      profileAvatarText: '#ffffff', // белый текст
      profileAvatarBorder: '#4b5563', // gray-600 - темная граница
      // Мобильный логотип
      mobileHeaderBackground: '#059669', // emerald-600
      mobileHeaderText: '#ffffff', // белый текст
      mobileHeaderBorder: '#047857', // emerald-700
      // Статусные бейджи
      statusProBackground: '#059669', // emerald-600 для PRO
      statusProText: '#ffffff', // белый текст
      statusFreeBackground: '#6b7280', // gray-500 для FREE
      statusFreeText: '#ffffff', // белый текст
      statusGuestBackground: '#d97706', // amber-600 для GUEST
      statusGuestText: '#ffffff', // белый текст
    },
    
    shadows: {
      // Enhanced shadows for light green theme with subtle green tint
      sm: '0 1px 2px 0 rgba(5, 150, 105, 0.05)',
      md: '0 4px 6px -1px rgba(5, 150, 105, 0.1), 0 2px 4px -1px rgba(5, 150, 105, 0.06)',
      lg: '0 10px 15px -3px rgba(5, 150, 105, 0.1), 0 4px 6px -2px rgba(5, 150, 105, 0.05)',
      xl: '0 20px 25px -5px rgba(5, 150, 105, 0.1), 0 10px 10px -5px rgba(5, 150, 105, 0.04)',
       '2xl': '0 25px 50px -12px rgba(5, 150, 105, 0.25)',
       card: '0 4px 6px -1px rgba(5, 150, 105, 0.1), 0 2px 4px -1px rgba(5, 150, 105, 0.06)',
       cardHover: '0 10px 15px -3px rgba(5, 150, 105, 0.1), 0 4px 6px -2px rgba(5, 150, 105, 0.05)',
    },
  },
};


export const themes: Record<string, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};

export const defaultTheme = 'light';

// Токены для Tailwind CSS
export const THEME_TOKENS = {
  spacing: {
    '0': '0px',
    '1': '0.25rem', // 4px
    '2': '0.5rem',  // 8px
    '3': '0.75rem', // 12px
    '4': '1rem',    // 16px
    '5': '1.25rem', // 20px
    '6': '1.5rem',  // 24px
    '8': '2rem',    // 32px
    '10': '2.5rem', // 40px
    '12': '3rem',   // 48px
    '16': '4rem',   // 64px
    '20': '5rem',   // 80px
    '24': '6rem',   // 96px
    '32': '8rem',   // 128px
  },
  fontSize: {
    'xs': '0.75rem',   // 12px
    'sm': '0.875rem',  // 14px
    'base': '1rem',    // 16px
    'lg': '1.125rem',  // 18px
    'xl': '1.25rem',   // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  fontWeight: {
    'thin': '100',
    'light': '300',
    'normal': '400',
    'medium': '500',
    'semibold': '600',
    'bold': '700',
    'extrabold': '800',
    'black': '900',
  },
  letterSpacing: {
    'tighter': '-0.05em',
    'tight': '-0.025em',
    'normal': '0em',
    'wide': '0.025em',
    'wider': '0.05em',
    'widest': '0.1em',
  },
  };

// Утилиты для работы с темами
export const getTheme = (themeName: string): Theme => {
  return themes[themeName] || themes[defaultTheme];
};

export const getThemeNames = (): string[] => {
  return Object.keys(themes);
};

export const getThemeDisplayNames = (): Array<{ name: string; displayName: string }> => {
  return Object.values(themes).map(theme => ({
    name: theme.name,
    displayName: theme.displayName,
  }));
};