
import React, { useState, useEffect, useMemo } from 'react';
import { BusinessProfile, Transaction, FinancialReport } from '../../types.ts';
import { TrashIcon, PlusCircleIcon } from './icons.tsx';
import ChartCard from './ChartCard';
import { useUser } from './UserContext';

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
    { key: 'main', label: 'Основное' },
    { key: 'summary', label: 'Финансовое резюме' },
    { key: 'settings', label: 'Настройки' },
    { key: 'help', label: 'Помощь' },
];

function useSubscriptionStatus() {
    const { email } = useUser();
    if (email && email.includes('pro')) return 'pro';
    return 'free';
}

const KpiCard: React.FC<{ label: string; value: string | number; sub?: string }> = ({ label, value, sub }) => (
    <div className="bg-surface rounded-xl p-4 shadow border border-border flex flex-col items-start min-w-[140px]">
        <span className="text-sm text-text-secondary mb-1">{label}</span>
        <span className="text-2xl font-bold text-text-primary">{value}</span>
        {sub && <span className="text-xs text-text-secondary mt-1">{sub}</span>}
    </div>
);

const Profile: React.FC<ProfileProps> = ({ allProfiles, activeProfile, onSave, onSwitch, onDelete, onNew, transactions = [], report }) => {
    const { email, displayName, googleId, photoUrl, logout } = useUser();
    const [formData, setFormData] = useState<BusinessProfile | Omit<BusinessProfile, 'id'>>(activeProfile || newBlankProfile);
    const [isSaved, setIsSaved] = useState(false);
    const [activeTab, setActiveTab] = useState('main');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const status = useSubscriptionStatus();

    useEffect(() => {
        setFormData(activeProfile || newBlankProfile);
    }, [activeProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setIsSaved(false);
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

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
            .map(([name, value]) => ({ name, value }))
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
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 3);
    }, [transactions]);

    // Google профиль блок
    const GoogleProfileBlock = () => (
        <div className="flex items-center gap-6 mb-6 p-6 bg-surface rounded-2xl shadow border border-border">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary text-primary-foreground text-3xl font-bold overflow-hidden">
                {photoUrl ? <img src={photoUrl} alt="avatar" className="w-20 h-20 object-cover rounded-full" /> : (displayName ? displayName[0] : (email ? email[0] : '?'))}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold text-text-primary truncate mb-1">{displayName || 'Пользователь'}</div>
                <div className="text-text-secondary truncate mb-1">{email}</div>
                {googleId && <div className="text-xs text-text-disabled truncate">Google ID: {googleId}</div>}
            </div>
            <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${status === 'pro' ? 'bg-primary text-primary-foreground' : 'bg-border text-text-secondary'}`}>{status === 'pro' ? 'PRO' : 'Бесплатно'}</span>
                <button onClick={logout} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:bg-red-700 transition">Выйти</button>
            </div>
        </div>
    );

    // Вкладка "Основное" — бизнес-профиль
    const MainTab = () => (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Название компании / ИП</label>
                    <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Например, Ai KV" className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Вид деятельности</label>
                    <input type="text" name="businessType" value={formData.businessType} onChange={handleChange} placeholder="аренда жилья, IT, розница..." className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Модель заработка (как вы получаете доход?)</label>
                <textarea name="businessModel" value={formData.businessModel} onChange={handleChange} rows={2} placeholder="Опишите, например: сдача квартир, консалтинг, онлайн-услуги..." className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Основные источники дохода</label>
                    <textarea name="typicalIncomeSources" value={formData.typicalIncomeSources} onChange={handleChange} rows={2} placeholder="Клиенты, переводы, наличка..." className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Основные статьи расходов</label>
                    <textarea name="typicalExpenseCategories" value={formData.typicalExpenseCategories} onChange={handleChange} rows={2} placeholder="Коммуналка, аренда, закупки..." className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Владелец бизнеса</label>
                <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="Ваше имя или ФИО" className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary" />
            </div>
            <div className="flex gap-4 items-center mt-4">
                <button type="submit" className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition">Сохранить</button>
                {isSaved && <span className="text-green-600 text-sm">Сохранено!</span>}
            </div>
        </form>
    );

    // Вкладка "Финансовое резюме"
    const SummaryTab = () => {
        // Готовим данные для графика, если есть report.pnl.monthlyData
        let chartData: any[] = [];
        let chartSeries: any[] = [];
        if (report && report.pnl && Array.isArray(report.pnl.monthlyData)) {
            chartData = report.pnl.monthlyData.map((d: any) => ({
                label: d.month,
                'Доход': d['Доход'],
                'Расход': d['Расход'],
                'Прибыль': d['Прибыль'],
            }));
            chartSeries = [
                { key: 'Доход', type: 'area', color: '#22c55e' },
                { key: 'Расход', type: 'area', color: '#ef4444' },
                { key: 'Прибыль', type: 'line', color: '#3b82f6' },
            ];
        }
        return (
            <div className="space-y-6">
                <div className="flex flex-wrap gap-4 mb-6">
                    <KpiCard label="Всего доходов" value={transactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()} />
                    <KpiCard label="Всего расходов" value={transactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()} />
                    <KpiCard label="Чистая прибыль" value={(transactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0) - transactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)).toLocaleString()} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold text-text-primary mb-2">Топ-3 категории доходов</h3>
                        <ul className="list-disc list-inside text-text-secondary">
                            {incomeByCategory.length === 0 ? <li>Нет данных</li> : incomeByCategory.map(cat => <li key={cat.name}>{cat.name}: {cat.value.toLocaleString()}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-text-primary mb-2">Топ-3 категории расходов</h3>
                        <ul className="list-disc list-inside text-text-secondary">
                            {expenseByCategory.length === 0 ? <li>Нет данных</li> : expenseByCategory.map(cat => <li key={cat.name}>{cat.name}: {cat.value.toLocaleString()}</li>)}
                        </ul>
                    </div>
                </div>
                {chartData.length > 0 && (
                    <ChartCard
                        title="Динамика доходов, расходов и прибыли по месяцам"
                        data={chartData}
                        series={chartSeries}
                    />
                )}
            </div>
        );
    };

    // Вкладка "Настройки"
    const SettingsTab = () => (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-accent text-text-primary border border-border hover:bg-surface transition" onClick={onNew}>
                    <PlusCircleIcon className="w-5 h-5" /> Добавить новый профиль
                </button>
                {allProfiles.length > 1 && (
                    <select className="p-2 rounded border border-border bg-background text-text-primary" value={activeProfile?.id} onChange={e => onSwitch(e.target.value)}>
                        {allProfiles.map(p => <option key={p.id} value={p.id}>{p.businessName || 'Без названия'}</option>)}
                    </select>
                )}
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-red-700 transition" onClick={() => setShowDeleteConfirm(true)}>
                    <TrashIcon className="w-5 h-5" /> Удалить профиль
                </button>
            </div>
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-surface p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                        <h2 className="text-xl font-bold mb-4 text-text-primary">Удалить профиль?</h2>
                        <p className="mb-6 text-text-secondary">Вы уверены, что хотите удалить профиль <b>{activeProfile?.businessName}</b>? Это действие необратимо.</p>
                        <div className="flex gap-4 justify-center">
                            <button className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-red-700" onClick={() => { setShowDeleteConfirm(false); onDelete(activeProfile!.id); }}>Удалить</button>
                            <button className="px-4 py-2 rounded-lg bg-surface-accent text-text-primary border border-border" onClick={() => setShowDeleteConfirm(false)}>Отмена</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Вкладка "Помощь"
    const HelpTab = () => (
        <div className="space-y-4 text-text-secondary">
            <h3 className="font-semibold text-text-primary mb-2">Помощь и поддержка</h3>
            <ul className="list-disc list-inside">
                <li>Ваши данные профиля (имя, email, аватар) берутся из Google и не редактируются вручную.</li>
                <li>Для смены Google-аккаунта — выйдите и войдите снова.</li>
                <li>Для вопросов и поддержки пишите на <a href="mailto:support@finsights.ai" className="text-primary underline">support@finsights.ai</a></li>
            </ul>
        </div>
    );

    return (
        <div className="p-8 space-y-6 max-w-3xl mx-auto">
            <GoogleProfileBlock />
            <div className="flex gap-4 border-b border-border mb-6">
                {PROFILE_TABS.map(tab => (
                    <button
                        key={tab.key}
                        className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-primary'}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div>
                {activeTab === 'main' && <MainTab />}
                {activeTab === 'summary' && <SummaryTab />}
                {activeTab === 'settings' && <SettingsTab />}
                {activeTab === 'help' && <HelpTab />}
            </div>
        </div>
    );
};

export default Profile;
