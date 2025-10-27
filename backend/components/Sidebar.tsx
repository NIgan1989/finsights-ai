
import React, { useState } from 'react';
import { FaUser, FaChartBar, FaTable, FaRobot, FaMagic, FaUpload, FaMoon, FaCrown, FaSun, FaBars, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';
import { useTheme } from './ThemeProvider';
import { View } from '../../types';
import { subscriptionService } from '../../services/subscriptionService';

interface MenuItem {
  name: string;
  icon: JSX.Element;
  view: string;
  description: string;
  isPro?: boolean;
  isAdmin?: boolean;
}

const baseMenu: MenuItem[] = [
  { name: 'Профиль', icon: <FaUser />, view: 'profile', description: 'Управление профилями' },
  { name: 'Дашборд', icon: <FaChartBar />, view: 'dashboard', description: 'Аналитика и отчеты' },
  { name: 'Операции', icon: <FaTable />, view: 'transactions', description: 'Список операций' },
  { name: 'ИИ Ассистент', icon: <FaRobot />, view: 'ai_assistant', description: 'Умный помощник' },
  { name: 'Финансовая модель', icon: <FaMagic />, view: 'financial_model', description: 'ИИ конструктор моделей', isPro: true },
];

interface SidebarProps {
  activeView: string;
  setActiveView: (view: View) => void;
  hasData: boolean;
  onResetData: () => void;
}

export default function Sidebar({ activeView, setActiveView, hasData, onResetData }: SidebarProps) {
  const { subscriptionInfo, email, role, displayName } = useUser();
  const { theme, themeName, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const status = subscriptionInfo?.status || 'free';
  const isLifetimeAdmin = subscriptionService.checkIsLifetimeAdmin((email?.toLowerCase().trim()) || '');
  const isGuest = role === 'guest';

  // Отладка для диагностики проблем
  console.log('[Sidebar] Render debug:', {
    email,
    subscriptionInfo,
    status,
    isLifetimeAdmin,
    isGuest,
    role
  });

  // Формируем финальный массив меню
  const menu: MenuItem[] = isLifetimeAdmin 
    ? [...baseMenu, { name: 'Админ', icon: <FaCrown />, view: 'admin', description: 'Панель администратора', isAdmin: true }]
    : baseMenu;
  
  const handleMenuClick = (view: string, isPro?: boolean) => {
    console.log('[Sidebar] handleMenuClick:', {
      view, 
      isPro, 
      status, 
      isLifetimeAdmin, 
      email: email?.toLowerCase().trim(),
      subscriptionInfo
    });
    
    if (isPro && status !== 'pro' && !isLifetimeAdmin) {
      console.log('[Sidebar] Blocking PRO feature access');
      subscriptionService.showUpgradeModal('Финансовая модель доступна только в PRO версии');
      return;
    }
    // Запрет для гостей на ИИ
    if (view === 'ai_assistant' && isGuest) {
      subscriptionService.showUpgradeModal('ИИ Ассистент недоступен в гостевом режиме');
      return;
    }

    // Переход в админку
    if (view === 'admin') {
      console.log('[Sidebar] Navigating to admin panel, isLifetimeAdmin:', isLifetimeAdmin, 'email:', email);
      console.log('[Sidebar] Setting activeView to admin');
      // Открываем админ панель как обычный view в дашборде
      setActiveView('admin' as View);
      setIsMobileMenuOpen(false);
      console.log('[Sidebar] Admin view set, closing mobile menu');
      return;
    }
    
    // Для financial_model остаемся в дашборде
    if (view === 'financial_model') {
      setActiveView(view as View);
      setIsMobileMenuOpen(false);
      return;
    }
    
    setActiveView(view as View);
    setIsMobileMenuOpen(false); // Закрываем мобильное меню при выборе
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Адаптивные классы для тем
  // Используем CSS переменные вместо старых themeClasses

  const SidebarContent = ({ isMobile = false }) => (
    <div className={`${isMobile ? 'h-full' : 'h-screen'} flex flex-col`}>
      {/* Декоративный элемент */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-sidebar-header"></div>
      
      {/* Header с логотипом */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-sidebar-logo rounded-lg flex items-center justify-center">
              <span className="text-primary font-bold text-sm">F</span>
            </div>
            <div>
              <h1 className={`text-lg font-bold text-foreground`}>FinSights AI</h1>
              <p className={`text-xs ${themeName === 'light' ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Финансовый ассистент</p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg bg-card hover:bg-muted/50 text-foreground hover:text-foreground transition-colors"
            >
              <FaTimes size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Профиль пользователя */}
      <div className="profile-card-compact border-b border-border/50">
        <div className="p-3 rounded-lg border border-border bg-card backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-md flex items-center justify-center border" style={{
              backgroundColor: 'var(--logo-profile-avatar-bg)',
              borderColor: 'var(--logo-profile-avatar-border)'
            }}>
              <span className="font-bold text-xs" style={{ color: 'var(--logo-profile-avatar-text)' }}>
                {displayName ? displayName[0] : (email ? email[0] : '?')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate text-sm text-foreground`}>
                {displayName || 'Пользователь'}
              </p>
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 text-xs rounded-md" style={{
                  backgroundColor: status === 'pro' || isLifetimeAdmin
                    ? 'var(--logo-status-pro-bg)'
                    : isGuest
                    ? 'var(--logo-status-guest-bg)'
                    : 'var(--logo-status-free-bg)',
                  color: status === 'pro' || isLifetimeAdmin
                    ? 'var(--logo-status-pro-text)'
                    : isGuest
                    ? 'var(--logo-status-guest-text)'
                    : 'var(--logo-status-free-text)'
                }}>
                  {isGuest ? 'ГОСТЬ' : status === 'pro' || isLifetimeAdmin ? 'PRO' : 'FREE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Навигационное меню */}
      <nav className="flex-1 p-3 space-y-1">
        {menu.map((item) => {
          const isActive = activeView === item.view;
          const isProItem = item.isPro === true;
          const isDisabled = (isProItem && status !== 'pro' && !isLifetimeAdmin) || 
                            (item.view === 'ai_assistant' && isGuest);
          
          // Определяем градиент для каждой страницы
          const getPageGradient = (view: string): string => {
    switch (view) {
      case 'profile': return 'bg-gradient-sidebar-page-profile';
      case 'dashboard': return 'bg-gradient-sidebar-page-dashboard';
      case 'transactions': return 'bg-gradient-sidebar-page-transactions';
      case 'ai_assistant': return 'bg-gradient-sidebar-page-ai-assistant';
      case 'financial_model': return 'bg-gradient-sidebar-page-financial-model';
      case 'admin': return 'bg-gradient-sidebar-active';
      default: return 'bg-gradient-sidebar-active';
    }
  };
          
          return (
            <button
              key={item.view}
              onClick={() => handleMenuClick(item.view, item.isPro)}
              disabled={isDisabled}
              className={`w-full text-left sidebar-item-compact rounded-lg transition-all duration-200 group relative ${
                isActive
                  ? `${getPageGradient(item.view)} shadow-md text-foreground`
                  : isDisabled
                  ? "text-muted-foreground opacity-50 cursor-not-allowed"
        : "text-foreground bg-card hover:bg-muted/50 hover:scale-[1.01] hover:shadow-sm hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`sidebar-icon-compact ${isActive ? 'text-primary-foreground' : isDisabled ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {item.icon}
                </span>
                <div className="flex-1">
                  <span className={`sidebar-text-compact font-medium ${isActive ? 'text-foreground' : 'text-foreground group-hover:text-foreground'}`}>
                    {item.name}
                </span>
                <p className={`sidebar-description-compact ${isActive ? 'text-foreground/90' : 'text-muted-foreground group-hover:text-foreground/80'}`}>
                    {item.description}
                </p>
                </div>
                {item.isPro && (
                  <FaCrown className={`text-xs ${isActive ? (themeName === 'light' ? 'text-warning' : 'text-warning/80') : 'text-warning'}`} />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Нижние действия */}
      <div className="p-3 border-t border-border/50 space-y-2">
        {hasData && (
          <button
            onClick={onResetData}
            className="w-full flex items-center gap-2 sidebar-item-compact rounded-lg border transition-all duration-200 hover:scale-[1.01] bg-card hover:bg-muted text-foreground hover:text-foreground"
          >
            <FaUpload className="sidebar-icon-compact" />
            <span className="sidebar-text-compact font-medium">Загрузить новые данные</span>
          </button>
        )}
        
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2 sidebar-item-compact rounded-lg border transition-all duration-200 hover:scale-[1.01] bg-card hover:bg-muted text-foreground hover:text-foreground"
        >
          {themeName === 'light' ? <FaMoon className="sidebar-icon-compact" /> : <FaSun className="sidebar-icon-compact" />}
          <span className="sidebar-text-compact font-medium">{themeName === 'light' ? 'Темная тема' : 'Светлая тема'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex sidebar-compact bg-sidebar-background border-r border-sidebar-border shadow-2xl fixed left-0 top-0 h-full z-30 overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden bg-card border-b border-border relative z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{
              backgroundColor: 'var(--logo-mobile-header-bg)',
              borderColor: 'var(--logo-mobile-header-border)'
            }}>
              <span className="font-bold" style={{ color: 'var(--logo-mobile-header-text)' }}>F</span>
            </div>
            <h1 className={`text-lg font-bold text-foreground`}>FinSights AI</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Индикатор статуса */}
            <span className="px-2 py-1 text-xs rounded-full" style={{
              backgroundColor: status === 'pro' || isLifetimeAdmin
                ? 'var(--logo-status-pro-bg)'
                : isGuest
                ? 'var(--logo-status-guest-bg)'
                : 'var(--logo-status-free-bg)',
              color: status === 'pro' || isLifetimeAdmin
                ? 'var(--logo-status-pro-text)'
                : isGuest
                ? 'var(--logo-status-guest-text)'
                : 'var(--logo-status-free-text)'
            }}>
              {isGuest ? 'ГОСТЬ' : status === 'pro' || isLifetimeAdmin ? 'PRO' : 'FREE'}
            </span>
            
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg bg-card hover:bg-muted text-foreground hover:text-foreground transition-colors"
            >
              <FaBars size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="lg:hidden fixed inset-0 bg-background-80 backdrop-blur-sm z-40"
            onClick={toggleMobileMenu}
          />
          
          {/* Mobile Sidebar */}
          <aside className={`lg:hidden fixed top-0 right-0 w-80 max-w-[85vw] bg-sidebar-background border-l border-sidebar-border shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
            <SidebarContent isMobile={true} />
          </aside>
        </>
      )}
    </>
  );
}
