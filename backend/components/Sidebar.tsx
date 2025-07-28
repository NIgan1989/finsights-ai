
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
  { name: 'Транзакции', icon: <FaTable />, view: 'transactions', description: 'Список операций' },
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
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const status = subscriptionInfo?.status || 'free';
  const isLifetimeAdmin = email?.toLowerCase().trim() === 'dulat280489@gmail.com';
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
  const themeClasses = {
    sidebar: theme === 'light' 
      ? 'bg-gradient-to-b from-white to-slate-50 text-slate-800 border-r border-slate-200' 
      : 'bg-gradient-to-b from-slate-800 to-slate-900 text-slate-100',
    sidebarMobile: theme === 'light'
      ? 'bg-white/95 backdrop-blur-lg text-slate-800 border-r border-slate-200'
      : 'bg-slate-800/95 backdrop-blur-lg text-slate-100 border-r border-slate-700',
    border: theme === 'light' ? 'border-slate-200' : 'border-white/10',
    textPrimary: theme === 'light' ? 'text-slate-800' : 'text-white',
    textSecondary: theme === 'light' ? 'text-slate-600' : 'text-white/60',
    textMuted: theme === 'light' ? 'text-slate-500' : 'text-gray-400',
    bgCard: theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-white/5 border-white/10',
    bgCardHover: theme === 'light' ? 'bg-white hover:bg-slate-50' : 'bg-white/5 hover:bg-white/10',
    bgButton: theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 hover:border-slate-300' : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20',
    textButton: theme === 'light' ? 'text-slate-700 hover:text-slate-900' : 'text-gray-300 hover:text-white',
  };

  const SidebarContent = ({ isMobile = false }) => (
    <div className={`${isMobile ? 'h-full' : 'h-screen'} flex flex-col`}>
      {/* Декоративный элемент */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600"></div>
      
      {/* Header с логотипом */}
      <div className="p-6 border-b border-slate-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <div>
              <h1 className={`text-xl font-bold ${themeClasses.textPrimary}`}>FinSights AI</h1>
              <p className={`text-xs ${themeClasses.textMuted}`}>Финансовый ассистент</p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={toggleMobileMenu}
              className={`p-2 rounded-lg ${themeClasses.bgButton} ${themeClasses.textButton} transition-colors`}
            >
              <FaTimes size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Профиль пользователя */}
      <div className="p-4 border-b border-slate-200/50">
        <div className={`p-4 rounded-xl border ${themeClasses.bgCard} backdrop-blur-sm`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {displayName ? displayName[0] : (email ? email[0] : '?')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${themeClasses.textPrimary}`}>
                {displayName || 'Пользователь'}
              </p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  status === 'pro' || isLifetimeAdmin
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : isGuest
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {isGuest ? 'ГОСТЬ' : status === 'pro' || isLifetimeAdmin ? 'PRO' : 'FREE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Навигационное меню */}
      <nav className="flex-1 p-4 space-y-2">
        {menu.map((item) => {
          const isActive = activeView === item.view;
          const isProItem = item.isPro === true;
          const isDisabled = (isProItem && status !== 'pro' && !isLifetimeAdmin) || 
                            (item.view === 'ai_assistant' && isGuest);
          
          return (
            <button
              key={item.view}
              onClick={() => handleMenuClick(item.view, item.isPro)}
              disabled={isDisabled}
              className={`w-full text-left p-3 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : isDisabled
                  ? `${themeClasses.textMuted} opacity-50 cursor-not-allowed`
                  : `${themeClasses.textButton} ${themeClasses.bgCardHover} hover:scale-[1.02] hover:shadow-md`
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-lg ${isActive ? 'text-white' : isDisabled ? themeClasses.textMuted : themeClasses.textSecondary}`}>
                  {item.icon}
                </span>
                <div className="flex-1">
                  <span className={`font-medium ${isActive ? 'text-white' : themeClasses.textPrimary}`}>
                    {item.name}
                  </span>
                  <p className={`text-xs ${isActive ? 'text-white/80' : themeClasses.textMuted}`}>
                    {item.description}
                  </p>
                </div>
                {item.isPro && (
                  <FaCrown className={`text-sm ${isActive ? 'text-yellow-300' : 'text-yellow-500'}`} />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Нижние действия */}
      <div className="p-4 border-t border-slate-200/50 space-y-3">
        {hasData && (
          <button
            onClick={onResetData}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${themeClasses.bgButton} ${themeClasses.textButton}`}
          >
            <FaUpload />
            <span className="font-medium">Загрузить новые данные</span>
          </button>
        )}
        
        <button
                          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${themeClasses.bgButton} ${themeClasses.textButton}`}
        >
          {theme === 'light' ? <FaMoon /> : <FaSun />}
          <span className="font-medium">{theme === 'light' ? 'Темная тема' : 'Светлая тема'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex w-72 ${themeClasses.sidebar} shadow-2xl fixed left-0 top-0 h-full z-30 overflow-hidden`}>
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className={`lg:hidden ${themeClasses.sidebar} border-b ${themeClasses.border} relative z-50`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">F</span>
            </div>
            <h1 className={`text-lg font-bold ${themeClasses.textPrimary}`}>FinSights AI</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Индикатор статуса */}
            <span className={`px-2 py-1 text-xs rounded-full ${
              status === 'pro' || isLifetimeAdmin
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                : isGuest
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}>
              {isGuest ? 'ГОСТЬ' : status === 'pro' || isLifetimeAdmin ? 'PRO' : 'FREE'}
            </span>
            
            <button
              onClick={toggleMobileMenu}
              className={`p-2 rounded-lg ${themeClasses.bgButton} ${themeClasses.textButton} transition-colors`}
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
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={toggleMobileMenu}
          />
          
          {/* Mobile Sidebar */}
          <aside className={`lg:hidden fixed top-0 right-0 w-80 max-w-[85vw] ${themeClasses.sidebarMobile} shadow-2xl z-50 transform transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <SidebarContent isMobile={true} />
          </aside>
        </>
      )}
    </>
  );
}
