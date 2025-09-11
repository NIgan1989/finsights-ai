import { useState, useEffect, useCallback } from 'react';
import { Theme, themes, defaultTheme, getTheme } from '../config/themes.config';

const THEME_STORAGE_KEY = 'finsights-theme';

// Функция для конвертации hex в hsl
const hexToHsl = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

export interface UseThemeReturn {
  theme: Theme;
  themeName: string;
  setTheme: (themeName: string) => void;
  toggleTheme: () => void;
  availableThemes: Theme[];
}

export const useTheme = (): UseThemeReturn => {
  const [themeName, setThemeName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(THEME_STORAGE_KEY) || defaultTheme;
    }
    return defaultTheme;
  });

  const theme = getTheme(themeName);

  const setTheme = useCallback((newThemeName: string) => {
    if (themes[newThemeName]) {
      setThemeName(newThemeName);
      localStorage.setItem(THEME_STORAGE_KEY, newThemeName);
      
      // Применяем тему к документу
      applyThemeToDocument(getTheme(newThemeName));
    }
  }, []);

  const toggleTheme = useCallback(() => {
    // Переключение только между светлой и темной темой
    const nextTheme = themeName === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  }, [themeName, setTheme]);

  useEffect(() => {
    // Применяем тему при инициализации
    applyThemeToDocument(theme);
  }, [theme]);

  return {
    theme,
    themeName,
    setTheme,
    toggleTheme,
    availableThemes: Object.values(themes),
  };
};

// Функция для применения темы к документу
const applyThemeToDocument = (theme: Theme) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  
  // Устанавливаем атрибут темы
  root.setAttribute('data-theme', theme.name);
  
  // Применяем CSS переменные
  const { colors } = theme;
  
  // Основные цвета
  root.style.setProperty('--background', colors.background);
  root.style.setProperty('--foreground', colors.foreground);
  root.style.setProperty('--card', colors.card);
  root.style.setProperty('--chart-card', colors.card);
  root.style.setProperty('--card-foreground', colors.cardForeground);
  // Конвертируем hex в hsl для popover
  const popoverHsl = hexToHsl(colors.popover);
  const popoverForegroundHsl = hexToHsl(colors.popoverForeground);
  root.style.setProperty('--popover', `${popoverHsl.h} ${popoverHsl.s}% ${popoverHsl.l}%`);
  root.style.setProperty('--popover-foreground', `${popoverForegroundHsl.h} ${popoverForegroundHsl.s}% ${popoverForegroundHsl.l}%`);
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-foreground', colors.primaryForeground);
  root.style.setProperty('--secondary', colors.secondary);
  root.style.setProperty('--secondary-foreground', colors.secondaryForeground);
  root.style.setProperty('--muted', colors.muted);
  root.style.setProperty('--muted-foreground', colors.mutedForeground);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-foreground', colors.accentForeground);
  root.style.setProperty('--destructive', colors.destructive);
  root.style.setProperty('--destructive-foreground', colors.destructiveForeground);
  root.style.setProperty('--border', colors.border);
  root.style.setProperty('--input', colors.input);
  root.style.setProperty('--ring', colors.ring);
  
  // Текстовые цвета
  root.style.setProperty('--text-primary', colors.textPrimary);
  root.style.setProperty('--text-secondary', colors.textSecondary);
  root.style.setProperty('--text-muted', colors.textMuted);
  root.style.setProperty('--text-white', colors.textWhite);
  root.style.setProperty('--text-success', colors.textSuccess);
  root.style.setProperty('--text-warning', colors.textWarning);
  root.style.setProperty('--text-error', colors.textError);
  root.style.setProperty('--text-info', colors.textInfo);
  
  // Поверхности
  root.style.setProperty('--surface', colors.surface);
  root.style.setProperty('--surface-subtle', colors.surfaceSubtle);
  root.style.setProperty('--surface-hover', colors.surfaceHover);
  
  // Статусные цвета
  root.style.setProperty('--success', colors.success);
  root.style.setProperty('--warning', colors.warning);
  root.style.setProperty('--error', colors.error);
  root.style.setProperty('--info', colors.info);
  
  // Финансовые цвета
  root.style.setProperty('--profit', colors.profit);
  root.style.setProperty('--loss', colors.loss);
  root.style.setProperty('--neutral', colors.neutral);
  root.style.setProperty('--growth', colors.growth);
  root.style.setProperty('--decline', colors.decline);
  
  // Цвета графиков
  root.style.setProperty('--chart-primary', colors.chartPrimary);
  root.style.setProperty('--chart-secondary', colors.chartSecondary);
  root.style.setProperty('--chart-tertiary', colors.chartTertiary);
  root.style.setProperty('--chart-quaternary', colors.chartQuaternary);
  root.style.setProperty('--chart-accent', colors.chartAccent);
  root.style.setProperty('--chart-muted', colors.chartMuted);
  
  // Дополнительные переменные для совместимости с компонентами
  root.style.setProperty('--chart-1', colors.chartPrimary);
  root.style.setProperty('--chart-2', colors.chartSecondary);
  root.style.setProperty('--chart-3', colors.chartTertiary);
  root.style.setProperty('--chart-4', colors.chartQuaternary);
  root.style.setProperty('--chart-5', colors.chartAccent);
  root.style.setProperty('--chart-6', colors.chartMuted);
  
  // Настройки линий графиков - Enhanced visibility
  root.style.setProperty('--chart-line-primary', colors.chartLinePrimary);
  root.style.setProperty('--chart-line-secondary', colors.chartLineSecondary);
  root.style.setProperty('--chart-line-tertiary', colors.chartLineTertiary);
  root.style.setProperty('--chart-line-accent', colors.chartLineAccent);
  root.style.setProperty('--chart-line-grid', colors.chartLineGrid);
  root.style.setProperty('--chart-line-axis', colors.chartLineAxis);
  
  // Фоновые цвета контейнеров
  root.style.setProperty('--page-dashboard', colors.pageDashboard);
  root.style.setProperty('--page-analytics', colors.pageAnalytics);
  root.style.setProperty('--page-transactions', colors.pageTransactions);
  root.style.setProperty('--page-reports', colors.pageReports);
  root.style.setProperty('--page-settings', colors.pageSettings);
  
  // Цвета сайдбара
  root.style.setProperty('--sidebar-background', colors.sidebarBackground);
  root.style.setProperty('--sidebar-surface', colors.sidebarSurface);
  root.style.setProperty('--sidebar-border', colors.sidebarBorder);
  root.style.setProperty('--sidebar-card', colors.sidebarCard);
  root.style.setProperty('--sidebar-hover', colors.sidebarHover);
  
  // Градиенты
  root.style.setProperty('--gradient-primary', colors.gradients.primary);
  root.style.setProperty('--gradient-secondary', colors.gradients.secondary);
  root.style.setProperty('--gradient-success', colors.gradients.success);
  root.style.setProperty('--gradient-warning', colors.gradients.warning);
  root.style.setProperty('--gradient-error', colors.gradients.error);
  root.style.setProperty('--gradient-profit', colors.gradients.profit);
  root.style.setProperty('--gradient-loss', colors.gradients.loss);
  root.style.setProperty('--gradient-neutral', colors.gradients.neutral);
  root.style.setProperty('--gradient-chart', colors.gradients.chart);
  root.style.setProperty('--gradient-chart-hover', colors.gradients.chartHover);
  root.style.setProperty('--gradient-stat-blue', colors.gradients.statBlue);
  root.style.setProperty('--gradient-stat-purple', colors.gradients.statPurple);
  root.style.setProperty('--gradient-stat-green', colors.gradients.statGreen);
  root.style.setProperty('--gradient-stat-orange', colors.gradients.statOrange);
  root.style.setProperty('--gradient-sidebar-header', colors.gradients.sidebarHeader);
  root.style.setProperty('--gradient-sidebar-active', colors.gradients.sidebarActive);
  root.style.setProperty('--gradient-sidebar-logo', colors.gradients.sidebarLogo);
  root.style.setProperty('--gradient-sidebar-status-pro', colors.gradients.sidebarStatusPro);
  root.style.setProperty('--gradient-sidebar-status-guest', colors.gradients.sidebarStatusGuest);
  root.style.setProperty('--gradient-sidebar-page-profile', colors.gradients.sidebarPageProfile);
  root.style.setProperty('--gradient-sidebar-page-dashboard', colors.gradients.sidebarPageDashboard);
  root.style.setProperty('--gradient-sidebar-page-transactions', colors.gradients.sidebarPageTransactions);
  root.style.setProperty('--gradient-sidebar-page-ai-assistant', colors.gradients.sidebarPageAiAssistant);
  root.style.setProperty('--gradient-sidebar-page-financial-model', colors.gradients.sidebarPageFinancialModel);
  
  // Дополнительные градиенты
  root.style.setProperty('--gradient-results-header', colors.gradients.resultsHeader);
  root.style.setProperty('--gradient-background-light', colors.gradients.backgroundLight);
  root.style.setProperty('--gradient-pricing-background', colors.gradients.pricingBackground);
  root.style.setProperty('--gradient-pricing-title', colors.gradients.pricingTitle);
  root.style.setProperty('--gradient-pricing-popular', colors.gradients.pricingPopular);
  root.style.setProperty('--gradient-pricing-icon-pro', colors.gradients.pricingIconPro);
  root.style.setProperty('--gradient-pricing-icon-free', colors.gradients.pricingIconFree);
  root.style.setProperty('--gradient-pricing-button-pro', colors.gradients.pricingButtonPro);
  root.style.setProperty('--gradient-pricing-button-pro-hover', colors.gradients.pricingButtonProHover);
  root.style.setProperty('--gradient-pricing-payment', colors.gradients.pricingPayment);
  root.style.setProperty('--gradient-pricing-payment-icon', colors.gradients.pricingPaymentIcon);
  root.style.setProperty('--gradient-pricing-payment-button', colors.gradients.pricingPaymentButton);
  root.style.setProperty('--gradient-pricing-payment-button-hover', colors.gradients.pricingPaymentButtonHover);
  root.style.setProperty('--gradient-upload-background', colors.gradients.uploadBackground);
  root.style.setProperty('--gradient-upload-drag-active', colors.gradients.uploadDragActive);
  root.style.setProperty('--gradient-upload-drag-hover', colors.gradients.uploadDragHover);
  root.style.setProperty('--gradient-upload-processing', colors.gradients.uploadProcessing);
  root.style.setProperty('--gradient-upload-drop', colors.gradients.uploadDrop);
  root.style.setProperty('--gradient-upload-default', colors.gradients.uploadDefault);
  root.style.setProperty('--gradient-upload-selected', colors.gradients.uploadSelected);
  root.style.setProperty('--gradient-upload-error', colors.gradients.uploadError);
  root.style.setProperty('--gradient-upload-error-icon', colors.gradients.uploadErrorIcon);
  root.style.setProperty('--gradient-upload-file-pdf', colors.gradients.uploadFilePdf);
  root.style.setProperty('--gradient-upload-file-csv', colors.gradients.uploadFileCsv);
  root.style.setProperty('--gradient-upload-file-image', colors.gradients.uploadFileImage);
  
  // Логотипы и брендинг
  root.style.setProperty('--logo-sidebar-main-bg', colors.logos.sidebarMainBackground);
  root.style.setProperty('--logo-sidebar-main-text', colors.logos.sidebarMainText);
  root.style.setProperty('--logo-sidebar-main-border', colors.logos.sidebarMainBorder);
  root.style.setProperty('--logo-profile-avatar-bg', colors.logos.profileAvatarBackground);
  root.style.setProperty('--logo-profile-avatar-text', colors.logos.profileAvatarText);
  root.style.setProperty('--logo-profile-avatar-border', colors.logos.profileAvatarBorder);
  root.style.setProperty('--logo-mobile-header-bg', colors.logos.mobileHeaderBackground);
  root.style.setProperty('--logo-mobile-header-text', colors.logos.mobileHeaderText);
  root.style.setProperty('--logo-mobile-header-border', colors.logos.mobileHeaderBorder);
  root.style.setProperty('--logo-status-pro-bg', colors.logos.statusProBackground);
  root.style.setProperty('--logo-status-pro-text', colors.logos.statusProText);
  root.style.setProperty('--logo-status-free-bg', colors.logos.statusFreeBackground);
  root.style.setProperty('--logo-status-free-text', colors.logos.statusFreeText);
  root.style.setProperty('--logo-status-guest-bg', colors.logos.statusGuestBackground);
  root.style.setProperty('--logo-status-guest-text', colors.logos.statusGuestText);
  
  // Тени
  root.style.setProperty('--shadow-sm', colors.shadows.sm);
  root.style.setProperty('--shadow-md', colors.shadows.md);
  root.style.setProperty('--shadow-lg', colors.shadows.lg);
  root.style.setProperty('--shadow-xl', colors.shadows.xl);
  root.style.setProperty('--shadow-card', colors.shadows.card);
  root.style.setProperty('--shadow-card-hover', colors.shadows.cardHover);
};