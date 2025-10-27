
import React, { useState, useEffect, useMemo } from 'react';
import { BusinessProfile, Transaction, FinancialReport } from '../../types';
import ChartCard from './ChartCard';
import StatCard from './StatCard';
import { useUser } from './UserContext';
import { subscriptionService } from '../../services/subscriptionService';
import { useTheme } from './ThemeProvider';

interface ProfileProps {
    allProfiles: BusinessProfile[];
    activeProfile: BusinessProfile | null;
    onSave: (profile: BusinessProfile | Omit<BusinessProfile, 'id'>) => void;
    onSwitch: (profileId: string) => void;
    onDelete: (profileId: string) => void;
    onNew: () => void;
    transactions?: Transaction[];
    report?: FinancialReport;
}

const newBlankProfile: Omit<BusinessProfile, 'id'> = {
    businessName: '',
    businessType: '',
    businessModel: '',
    typicalIncomeSources: '',
    typicalExpenseCategories: '',
    ownerName: '',
};

const PROFILE_TABS = [
    { key: 'main', label: 'Основное', icon: 'user' },
    { key: 'summary', label: 'Финансовое резюме', icon: 'chart' },
    { key: 'settings', label: 'Настройки', icon: 'settings' },
    { key: 'help', label: 'Помощь', icon: 'help' },
];

function useSubscriptionStatus() {
    const { email } = useUser();
    if (email && email.includes('pro')) return 'pro';
    return 'free';
}

const getTabIcon = (iconType: string) => {
    switch (iconType) {
        case 'user':
            return (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
            );
        case 'chart':
            return (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
            );
        case 'settings':
            return (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
            );
        case 'help':
            return (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
            );
        default:
            return null;
    }
};

const Profile: React.FC<ProfileProps> = React.memo(({ allProfiles, activeProfile, onSave, onSwitch, onDelete, onNew, transactions = [], report }) => {
    const { subscriptionInfo, email, displayName, photoUrl, logout } = useUser();
    const { themeName } = useTheme();
    const [formData, setFormData] = useState<BusinessProfile | Omit<BusinessProfile, 'id'>>(activeProfile || newBlankProfile);
    const [isSaved, setIsSaved] = useState(false);
    const [activeTab, setActiveTab] = useState('main');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const status = subscriptionInfo?.status || 'free';

    useEffect(() => {
        setFormData(activeProfile || newBlankProfile);
    }, [activeProfile]);

    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setIsSaved(false);
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = React.useCallback((e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    }, [formData, onSave]);

    // KPI и топ-3 категории доходов/расходов
    const incomeByCategory = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];
        const map: { [cat: string]: number } = {};
        transactions.forEach(tx => {
            if (tx.type === 'income') {
                map[tx.category] = (map[tx.category] || 0) + tx.amount;
            }
        });
        return Object.entries(map)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 3);
    }, [transactions]);
    
    const expenseByCategory = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];
        const map: { [cat: string]: number } = {};
        transactions.forEach(tx => {
            if (tx.type === 'expense') {
                map[tx.category] = (map[tx.category] || 0) + tx.amount;
            }
        });
        return Object.entries(map)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 3);
    }, [transactions]);

    // Google профиль блок удалён - больше не используется
    
    const ChangePasswordForm = () => (
        <div className="bg-card backdrop-blur-xl border border-border rounded-3xl p-8 shadow-lg mb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                    <div className="w-24 h-24 rounded-2xl text-4xl font-bold overflow-hidden flex items-center justify-center border" style={{
                        backgroundColor: 'var(--logo-profile-avatar-bg)',
                        color: 'var(--logo-profile-avatar-text)',
                        borderColor: 'var(--logo-profile-avatar-border)'
                    }}>
                        {photoUrl ? (
                            <img src={photoUrl} alt="avatar" className="w-24 h-24 object-cover rounded-2xl" />
                        ) : (
                            displayName ? displayName[0] : (email ? email[0] : '?')
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-xs font-bold border" style={{
                        backgroundColor: status === 'pro' || status === 'admin'
                            ? 'var(--logo-status-pro-bg)'
                            : 'var(--logo-status-free-bg)',
                        color: status === 'pro' || status === 'admin'
                            ? 'var(--logo-status-pro-text)'
                            : 'var(--logo-status-free-text)',
                        borderColor: status === 'pro' || status === 'admin'
                            ? 'var(--logo-status-pro-bg)'
                            : 'var(--logo-status-free-bg)'
                    }}>
                        {status === 'pro' || status === 'admin' ? 'PRO' : 'FREE'}
                    </div>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                    <div className="text-3xl font-bold text-foreground mb-2">{displayName || 'Пользователь'}</div>
                    <div className="mb-4 text-muted-foreground">{email}</div>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <div className="flex items-center gap-2 px-4 py-2 bg-surface/50 backdrop-blur-sm rounded-xl">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Активен</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-surface/50 backdrop-blur-sm rounded-xl">
                    <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-muted-foreground">Защищено</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col gap-3">
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-6 py-3 bg-destructive text-destructive-foreground rounded-xl font-semibold hover:bg-destructive/90 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg border border-destructive/20"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                        </svg>
                        Выйти
                    </button>
                </div>
            </div>
        </div>
    );

    // Вкладка "Основное" — бизнес-профиль
    const MainTab = () => (
        <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-8 shadow-lg">
            <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">Бизнес-профиль</h3>
                <p className="text-muted-foreground">Настройте информацию о вашем бизнесе для более точного анализа</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-foreground">Название бизнеса</label>
                        <input
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-surface/50 backdrop-blur-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                            placeholder="Введите название вашего бизнеса"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-foreground">Имя владельца</label>
                        <input
                            type="text"
                            name="ownerName"
                            value={formData.ownerName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-surface/50 backdrop-blur-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                            placeholder="Ваше имя"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-foreground">Тип бизнеса</label>
                        <input
                            type="text"
                            name="businessType"
                            value={formData.businessType}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-surface/50 backdrop-blur-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                            placeholder="ТОО, ИП, ИТ-аутсорсинг..."
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-foreground">Бизнес-модель</label>
                        <input
                            type="text"
                            name="businessModel"
                            value={formData.businessModel}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-surface/50 backdrop-blur-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                            placeholder="SaaS, Консалтинг, Ритейл..."
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground">Источники доходов</label>
                    <textarea
                        name="typicalIncomeSources"
                        value={formData.typicalIncomeSources}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-surface/50 backdrop-blur-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Опишите основные источники доходов вашего бизнеса..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground">Категории расходов</label>
                    <textarea
                        name="typicalExpenseCategories"
                        value={formData.typicalExpenseCategories}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-surface/50 backdrop-blur-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Опишите основные категории расходов..."
                    />
                </div>

                <div className="flex items-center gap-4 pt-6">
                    <button
                        type="submit"
                        className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl font-semibold hover:from-primary/90 hover:to-secondary/90 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        Сохранить профиль
                    </button>
                    
                    {isSaved && (
                        <div className="flex items-center gap-2 text-success">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Сохранено!</span>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );

    // Вкладка "Финансовое резюме"
    const SummaryTab = () => {
        const kpi = useMemo(() => {
            if (!report) return null;
            const totalIncome = transactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
            const totalExpenses = transactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
            const profit = totalIncome - totalExpenses;
            const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
            return { totalIncome, totalExpenses, profit, profitMargin };
        }, [report, transactions]);

        const chartSeries = useMemo(() => [
            { key: 'value', type: 'area' as const, color: 'var(--primary)' }
        ], []);

        return (
            <div className="space-y-8">
                {kpi && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard 
                            title="Общий доход" 
                            value={kpi.totalIncome} 
                            isCurrency={true}
                            trend="up"
                            subtitle="За период"
                        />
                        <StatCard 
                            title="Общие расходы" 
                            value={kpi.totalExpenses} 
                            isCurrency={true}
                            trend="down"
                            subtitle="За период"
                        />
                        <StatCard 
                            title="Чистая прибыль" 
                            value={kpi.profit} 
                            isCurrency={true}
                            trend={kpi.profit >= 0 ? "up" : "down"}
                            subtitle="За период"
                        />
                        <StatCard 
                            title="Маржа прибыли" 
                            value={kpi.profitMargin} 
                            isCurrency={false}
                            trend={kpi.profitMargin >= 0 ? "up" : "down"}
                            subtitle="Процент"
                        />
                    </div>
                )}
                
                {(incomeByCategory.length > 0 || expenseByCategory.length > 0) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {incomeByCategory.length > 0 && (
                            <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6 shadow-lg">
                                <ChartCard
                                    title="Топ-3 источника доходов"
                                    data={incomeByCategory}
                                    series={chartSeries}
                                />
                            </div>
                        )}
                        {expenseByCategory.length > 0 && (
                            <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6 shadow-lg">
                                <ChartCard
                                    title="Топ-3 категории расходов"
                                    data={expenseByCategory}
                                    series={chartSeries}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Вкладка "Настройки"
    const SettingsTab = () => (
        <div className="space-y-6">
            <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-foreground mb-6">Управление профилями</h3>
                
                <div className="flex flex-wrap gap-4 items-center">
                    <button 
                        className="flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-success to-success-foreground text-primary-foreground font-semibold hover:from-success/90 hover:to-success-foreground/90 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg" 
                        onClick={() => {
                            const limitCheck = subscriptionService.checkProfileLimit(allProfiles.length);
                            if (!limitCheck.allowed) {
                                subscriptionService.showUpgradeModal(limitCheck.reason || 'Лимит профилей достигнут');
                                return;
                            }
                            onNew();
                        }}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Добавить новый профиль
                        {status === 'free' && <span className="text-xs opacity-80">({allProfiles.length}/1)</span>}
                    </button>
                    
                    {allProfiles.length > 1 && (
                        <select 
                        className="px-4 py-3 rounded-xl border border-border bg-surface/50 backdrop-blur-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200" 
                        value={activeProfile?.id} 
                        onChange={e => onSwitch(e.target.value)}
                    >
                            {allProfiles.map(p => (
                                <option key={p.id} value={p.id}>{p.businessName || 'Без названия'}</option>
                            ))}
                        </select>
                    )}
                    
                    <button 
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-destructive to-destructive-foreground text-primary-foreground font-semibold hover:from-destructive/90 hover:to-destructive-foreground/90 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg" 
                        onClick={() => setShowDeleteConfirm(true)}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Удалить профиль
                    </button>
                </div>
            </div>
            
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                    <div className="bg-modal-card backdrop-blur-sm border border-border p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-destructive/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-destructive-foreground" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold mb-4 text-foreground">Удалить профиль?</h2>
                            <p className="mb-6 text-muted-foreground">
                                Вы уверены, что хотите удалить профиль <span className="font-semibold text-foreground">{activeProfile?.businessName}</span>? 
                                Это действие необратимо.
                            </p>
                                <div className="flex gap-4 justify-center">
                                    <button 
                                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-destructive to-destructive-foreground text-primary-foreground font-semibold hover:from-destructive/90 hover:to-destructive-foreground/90 transition-all duration-200" 
                                        onClick={() => { 
                                            setShowDeleteConfirm(false); 
                                            onDelete(activeProfile!.id); 
                                        }}
                                    >
                                        Удалить
                                    </button>
                                    <button 
                                        className="px-6 py-3 rounded-xl bg-surface border-2 border-border text-muted-foreground font-semibold hover:border-primary hover:text-primary transition-all duration-200" 
                                        onClick={() => setShowDeleteConfirm(false)}
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );

    // Вкладка "Помощь"
    const HelpTab = () => (
        <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-foreground">Помощь и поддержка</h3>
                    <p className="text-muted-foreground">Полезная информация для работы с профилем</p>
                </div>
            </div>
            
            <div className="space-y-6">
                <div className="bg-surface/30 backdrop-blur-sm border border-border rounded-xl p-6">
                    <h4 className="font-semibold text-foreground mb-3">📋 Управление профилем</h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li>• Ваши данные профиля (имя, email, аватар) берутся из аккаунта и не редактируются вручную</li>
                        <li>• Для смены аккаунта выйдите и войдите снова</li>
                        <li>• Бизнес-профили помогают настроить аналитику под ваш тип деятельности</li>
                    </ul>
                </div>
                
                <div className="bg-surface/30 backdrop-blur-sm border border-border rounded-xl p-6">
                    <h4 className="font-semibold text-foreground mb-3">💡 Советы по использованию</h4>
                    <ul className="space-y-2 text-muted-foreground">
                        <li>• Заполните все поля бизнес-профиля для более точных рекомендаций</li>
                        <li>• Используйте несколько профилей для разных проектов (PRO)</li>
                        <li>• Регулярно проверяйте финансовое резюме для отслеживания динамики</li>
                    </ul>
                </div>
                
                <div className="bg-surface/30 backdrop-blur-sm border border-border rounded-xl p-6">
                    <h4 className="font-semibold text-foreground mb-3">📞 Нужна помощь?</h4>
                    <p className="mb-4 text-muted-foreground">
                        Если у вас возникли вопросы или нужна техническая поддержка, свяжитесь с нами:
                    </p>
                    <a 
                        href="mailto:support@finsights.ai" 
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl font-semibold hover:from-primary/90 hover:to-secondary/90 transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        Написать в поддержку
                    </a>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated p-6">
            <div className="max-w-6xl mx-auto">
                <ChangePasswordForm />
                
                {/* Tabs Navigation */}
                <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-2 shadow-lg mb-8">
                    <div className="flex flex-wrap gap-2">
                        {PROFILE_TABS.map(tab => (
                            <button
                                key={tab.key}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                                    activeTab === tab.key
                                        ? `bg-gradient-to-r from-primary to-secondary shadow-lg ${
                                            'text-foreground'
                                        }`
                                        : 'text-foreground/70 hover:text-foreground hover:bg-surface/50'
                                }`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {getTabIcon(tab.icon)}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Tab Content */}
                <div>
                    {activeTab === 'main' && <MainTab />}
                    {activeTab === 'summary' && <SummaryTab />}
                    {activeTab === 'settings' && <SettingsTab />}
                    {activeTab === 'help' && <HelpTab />}
                </div>
            </div>
        </div>
    );
});

export default Profile;
