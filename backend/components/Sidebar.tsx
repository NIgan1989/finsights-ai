
import React from 'react';
import { DashboardIcon, TransactionsIcon, AiAssistantIcon, LogoIcon, UploadIcon, ProfileIcon, SunIcon, MoonIcon } from './icons.tsx';
import { Theme } from '../../types.ts';

type View = 'dashboard' | 'transactions' | 'ai_assistant' | 'profile';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  hasData: boolean;
  onResetData: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}> = ({ icon, label, isActive, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${isActive
        ? 'bg-primary text-primary-foreground shadow-md'
        : 'text-text-secondary hover:bg-surface-accent hover:text-text-primary'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {icon}
    <span className="ml-4">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, hasData, onResetData, theme, onToggleTheme }) => {
  return (
    <div className="flex flex-col w-64 h-screen px-4 py-8 bg-surface border-r border-border">
      <div className="flex items-center mb-10 px-2">
        <LogoIcon className="w-8 h-8 text-primary" />
        <h2 className="ml-3 text-2xl font-bold text-text-primary">FinSights AI</h2>
      </div>

      <div className="flex flex-col justify-between flex-1">
        <nav className="space-y-2">
          <NavItem
            icon={<ProfileIcon className="w-6 h-6" />}
            label="Профиль"
            isActive={activeView === 'profile'}
            onClick={() => setActiveView('profile')}
            disabled={false}
          />
          <hr className="my-2 border-border" />
          <NavItem
            icon={<DashboardIcon className="w-6 h-6" />}
            label="Дашборд"
            isActive={activeView === 'dashboard'}
            onClick={() => setActiveView('dashboard')}
            disabled={!hasData}
          />
          <NavItem
            icon={<TransactionsIcon className="w-6 h-6" />}
            label="Транзакции"
            isActive={activeView === 'transactions'}
            onClick={() => setActiveView('transactions')}
            disabled={!hasData}
          />
          <NavItem
            icon={<AiAssistantIcon className="w-6 h-6" />}
            label="ИИ Ассистент"
            isActive={activeView === 'ai_assistant'}
            onClick={() => setActiveView('ai_assistant')}
            disabled={!hasData}
          />
        </nav>

        <div className="space-y-2">
          {hasData && (
            <button
              onClick={onResetData}
              className="flex items-center w-full px-4 py-3 mt-4 text-sm font-medium text-text-secondary rounded-lg hover:bg-surface-accent hover:text-text-primary transition-colors duration-200"
            >
              <UploadIcon className="w-6 h-6" />
              <span className="ml-4">Загрузить или заменить файл</span>
            </button>
          )}
          <button
            onClick={onToggleTheme}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-text-secondary rounded-lg hover:bg-surface-accent hover:text-text-primary transition-colors duration-200"
            aria-label={`Переключить на ${theme === 'light' ? 'темную' : 'светлую'} тему`}
          >
            {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
            <span className="ml-4">Сменить тему</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
