import { createTheme, ThemeOptions } from '@mui/material/styles';

// Современная цветовая палитра для финансовой аналитики
const colors = {
  // Основные цвета
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3',
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },
  
  // Цвета для финансовых данных
  financial: {
    profit: '#00C853',      // Зеленый для прибыли
    loss: '#F44336',        // Красный для убытков
    revenue: '#4CAF50',     // Светло-зеленый для доходов
    expense: '#FF5722',     // Оранжево-красный для расходов
    neutral: '#9E9E9E',     // Серый для нейтральных значений
    warning: '#FF9800',     // Оранжевый для предупреждений
    info: '#2196F3',        // Синий для информации
  },
  
  // Градиенты для графиков
  gradients: {
    profit: 'linear-gradient(135deg, #00C853 0%, #4CAF50 100%)',
    loss: 'linear-gradient(135deg, #F44336 0%, #FF5722 100%)',
    revenue: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
    expense: 'linear-gradient(135deg, #FF5722 0%, #FF9800 100%)',
    neutral: 'linear-gradient(135deg, #9E9E9E 0%, #BDBDBD 100%)',
  },
  
  // Серые оттенки
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Фоновые цвета
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    paper: '#FFFFFF',
    elevated: '#FFFFFF',
    surface: '#F1F5F9',
  },
};

// Типографика
const typography = {
  fontFamily: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),
  
  // Финансовые числа
  financial: {
    fontFamily: 'Inter, monospace',
    fontFeatureSettings: '"tnum"',
    fontVariantNumeric: 'tabular-nums',
  },
};

// Тени для карточек
const shadows = {
  card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  cardHover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  elevated: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

// Анимации
const animations = {
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195,
  },
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
};

// Создание темы
export const createFinancialTheme = (mode: 'light' | 'dark' = 'light'): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: colors.primary[600],
      light: colors.primary[400],
      dark: colors.primary[800],
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: colors.financial.profit,
      light: colors.financial.revenue,
      dark: '#388E3C',
      contrastText: '#FFFFFF',
    },
    error: {
      main: colors.financial.loss,
      light: '#EF5350',
      dark: '#C62828',
    },
    warning: {
      main: colors.financial.warning,
      light: '#FFB74D',
      dark: '#F57C00',
    },
    info: {
      main: colors.financial.info,
      light: '#42A5F5',
      dark: '#1565C0',
    },
    success: {
      main: colors.financial.profit,
      light: colors.financial.revenue,
      dark: '#388E3C',
    },
    background: {
      default: mode === 'light' ? colors.background.secondary : '#0A0E27',
      paper: mode === 'light' ? colors.background.paper : '#1E293B',
    },
    text: {
      primary: mode === 'light' ? colors.gray[900] : '#F1F5F9',
      secondary: mode === 'light' ? colors.gray[600] : '#94A3B8',
    },
  },
  
  typography: {
    fontFamily: typography.fontFamily,
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      color: mode === 'light' ? colors.gray[600] : '#94A3B8',
    },
  },
  
  shape: {
    borderRadius: 12,
  },
  
  shadows: [
    'none',
    shadows.card,
    shadows.card,
    shadows.cardHover,
    shadows.cardHover,
    shadows.elevated,
    shadows.elevated,
    shadows.elevated,
    shadows.modal,
    shadows.modal,
    shadows.modal,
    shadows.modal,
    shadows.modal,
    shadows.modal,
    shadows.modal,
    shadows.modal,
    shadows.modal,
    shadows.modal,
    shadows.modal,
    shadows.modal,
    shadows.modal,
    shadows.modal,
    shadows.modal,
    shadows.modal,
    shadows.modal,
  ],
  
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: shadows.card,
          border: mode === 'light' ? `1px solid ${colors.gray[200]}` : '1px solid #334155',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: shadows.cardHover,
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: shadows.card,
          },
        },
      },
    },
    
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: shadows.card,
        },
        elevation2: {
          boxShadow: shadows.cardHover,
        },
      },
    },
    
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? colors.background.paper : '#1E293B',
          color: mode === 'light' ? colors.gray[900] : '#F1F5F9',
          boxShadow: shadows.card,
          borderBottom: mode === 'light' ? `1px solid ${colors.gray[200]}` : '1px solid #334155',
        },
      },
    },
    
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? colors.background.surface : '#334155',
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.875rem',
            color: mode === 'light' ? colors.gray[700] : '#E2E8F0',
          },
        },
      },
    },
  },
});

// Экспорт цветов и утилит
export { colors, typography, shadows, animations };

// Утилиты для работы с финансовыми цветами
export const getFinancialColor = (value: number, type: 'profit' | 'general' = 'general') => {
  if (type === 'profit') {
    return value >= 0 ? colors.financial.profit : colors.financial.loss;
  }
  return value >= 0 ? colors.financial.revenue : colors.financial.expense;
};

export const getFinancialGradient = (value: number) => {
  return value >= 0 ? colors.gradients.profit : colors.gradients.loss;
};