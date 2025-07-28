
import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types.ts';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants.ts';
import { useTheme } from './ThemeProvider';

interface TransactionsTableProps {
    transactions: Transaction[];
    onUpdateTransaction: (originalTx: Transaction, updates: Partial<Pick<Transaction, 'description' | 'category' | 'counterparty'>>, applyToAll: boolean) => void;
    onAddTransaction: (tx: Transaction) => void;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('ru-RU').format(amount) + ' ₸';

const darkCategoryColorMap: { [key: string]: string } = {
    // Operating
    'Зарплата': 'bg-yellow-500/20 text-yellow-300',
    'Аренда': 'bg-red-500/20 text-red-300',
    'Закупка товаров': 'bg-purple-500/20 text-purple-300',
    'Реклама и маркетинг': 'bg-pink-500/20 text-pink-300',
    'Коммунальные услуги': 'bg-sky-500/20 text-sky-300',
    'Связь и интернет': 'bg-indigo-500/20 text-indigo-300',
    'Транспортные расходы': 'bg-emerald-500/20 text-emerald-300',
    'Ремонт и обслуживание': 'bg-amber-500/20 text-amber-300',
    'Канцтовары': 'bg-lime-500/20 text-lime-300',
    'Представительские расходы': 'bg-violet-500/20 text-violet-300',
    'Командировочные расходы': 'bg-blue-500/20 text-blue-300',
    'Подписки на сервисы': 'bg-teal-500/20 text-teal-300',
    'Страхование': 'bg-cyan-500/20 text-cyan-300',
    'Банковские комиссии': 'bg-gray-400/20 text-gray-300',
    'Налоги': 'bg-orange-600/20 text-orange-400',
    'Штрафы и пени': 'bg-red-700/20 text-red-500',

    // CAPEX
    'Оборудование': 'bg-rose-500/20 text-rose-300',

    // Financing
    'Проценты по кредитам': 'bg-orange-500/20 text-orange-300',
    'Погашение кредита': 'bg-fuchsia-500/20 text-fuchsia-300',
    'Выдача займа': 'bg-pink-600/20 text-pink-400',
    'Лизинговые платежи': 'bg-pink-600/20 text-pink-400',
    'Выплата дивидендов': 'bg-fuchsia-600/20 text-fuchsia-400',
    'Накопления и сбережения': 'bg-sky-400/20 text-sky-300',
    'Личные траты': 'bg-rose-600/20 text-rose-400',

    // Income
    'Операционный доход': 'bg-green-500/20 text-green-300',
    'Получение кредита': 'bg-green-600/20 text-green-400',
    'Взнос учредителя': 'bg-teal-500/20 text-teal-300',
    'Возврат долга': 'bg-emerald-600/20 text-emerald-400',
    'Прочие поступления': 'bg-emerald-600/20 text-emerald-400',

    // Дополнительные категории
    'Детский сад': 'bg-blue-500/20 text-blue-300',
    'Аптека и здоровье': 'bg-green-500/20 text-green-300',
    'Красота и здоровье': 'bg-pink-500/20 text-pink-300',
    'Магазины': 'bg-purple-500/20 text-purple-300',
    'Кафе и рестораны': 'bg-orange-500/20 text-orange-300',
    'Развлечения': 'bg-indigo-500/20 text-indigo-300',
    'Банкоматы': 'bg-cyan-500/20 text-cyan-300',
    'Недвижимость': 'bg-red-600/20 text-red-400',
    'Бизнес/Поставщики': 'bg-gray-600/20 text-gray-400',
    'Переводы между своими счетами': 'bg-teal-500/20 text-teal-300',
    'Переводы': 'bg-emerald-500/20 text-emerald-300',

    // Default
    'Прочее': 'bg-gray-500/20 text-gray-300',
};

const lightCategoryColorMap: { [key: string]: string } = {
    // Operating
    'Зарплата': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    'Аренда': 'bg-red-100 text-red-800 border border-red-200',
    'Закупка товаров': 'bg-purple-100 text-purple-800 border border-purple-200',
    'Реклама и маркетинг': 'bg-pink-100 text-pink-800 border border-pink-200',
    'Коммунальные услуги': 'bg-sky-100 text-sky-800 border border-sky-200',
    'Связь и интернет': 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    'Транспортные расходы': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    'Ремонт и обслуживание': 'bg-amber-100 text-amber-800 border border-amber-200',
    'Канцтовары': 'bg-lime-100 text-lime-800 border border-lime-200',
    'Представительские расходы': 'bg-violet-100 text-violet-800 border border-violet-200',
    'Командировочные расходы': 'bg-blue-100 text-blue-800 border border-blue-200',
    'Подписки на сервисы': 'bg-teal-100 text-teal-800 border border-teal-200',
    'Страхование': 'bg-cyan-100 text-cyan-800 border border-cyan-200',
    'Банковские комиссии': 'bg-gray-200 text-gray-800 border border-gray-300',
    'Налоги': 'bg-orange-100 text-orange-800 border border-orange-200',
    'Штрафы и пени': 'bg-red-200 text-red-900 border border-red-300',

    // CAPEX
    'Оборудование': 'bg-rose-100 text-rose-800 border border-rose-200',

    // Financing
    'Проценты по кредитам': 'bg-orange-100 text-orange-800 border border-orange-200',
    'Погашение кредита': 'bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200',
    'Выдача займа': 'bg-pink-200 text-pink-900 border border-pink-300',
    'Лизинговые платежи': 'bg-pink-200 text-pink-900 border border-pink-300',
    'Выплата дивидендов': 'bg-fuchsia-200 text-fuchsia-900 border border-fuchsia-300',
    'Накопления и сбережения': 'bg-sky-100 text-sky-800 border border-sky-200',
    'Личные траты': 'bg-rose-200 text-rose-900 border border-rose-300',

    // Income
    'Операционный доход': 'bg-green-100 text-green-800 border border-green-200',
    'Получение кредита': 'bg-green-200 text-green-900 border border-green-300',
    'Взнос учредителя': 'bg-teal-100 text-teal-800 border border-teal-200',
    'Возврат долга': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    'Прочие поступления': 'bg-emerald-100 text-emerald-800 border border-emerald-200',

    // Дополнительные категории
    'Детский сад': 'bg-blue-100 text-blue-800 border border-blue-200',
    'Аптека и здоровье': 'bg-green-100 text-green-800 border border-green-200',
    'Красота и здоровье': 'bg-pink-100 text-pink-800 border border-pink-200',
    'Магазины': 'bg-purple-100 text-purple-800 border border-purple-200',
    'Кафе и рестораны': 'bg-orange-100 text-orange-800 border border-orange-200',
    'Развлечения': 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    'Банкоматы': 'bg-cyan-100 text-cyan-800 border border-cyan-200',
    'Недвижимость': 'bg-red-200 text-red-900 border border-red-300',
    'Бизнес/Поставщики': 'bg-gray-300 text-gray-900 border border-gray-400',
    'Переводы между своими счетами': 'bg-teal-100 text-teal-800 border border-teal-200',
    'Переводы': 'bg-emerald-100 text-emerald-800 border border-emerald-200',

    // Default
    'Прочее': 'bg-gray-200 text-gray-800 border border-gray-300',
};


const getCategoryClass = (category: string, theme: 'light' | 'dark') => {
    const map = theme === 'dark' ? darkCategoryColorMap : lightCategoryColorMap;
    // Special handling for income categories that might not be in the expense map
    if (!map[category]) {
        if (category.includes('доход') || category.includes('Поступления')) {
            return theme === 'dark' ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800 border border-green-200';
        }
        if (category === 'Получение кредита' || category === 'Взнос учредителя' || category === 'Возврат долга') {
            return theme === 'dark' ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-800 border border-teal-200';
        }
    }
    return map[category] || map['Прочее'];
};

const ClarificationForm: React.FC<{
    transaction: Transaction;
    similarTransactionsCount: number;
    onSave: (updates: Partial<Pick<Transaction, 'description' | 'category' | 'counterparty'>>, applyToAll: boolean) => void;
    onCancel: () => void;
}> = ({ transaction, onSave, onCancel, similarTransactionsCount }) => {
    const [description, setDescription] = useState(transaction.description);
    const [category, setCategory] = useState(transaction.category);
    const [counterparty, setCounterparty] = useState(transaction.counterparty || '');
    const [applyToAll, setApplyToAll] = useState(true);

    const categoryList = useMemo(() => {
        return transaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    }, [transaction.type]);

    const handleSave = () => {
        if (!description.trim() || !category.trim()) return;
        const shouldApplyToAll = similarTransactionsCount > 0 ? applyToAll : false;
        onSave({ description, category, counterparty }, shouldApplyToAll);
    };

    return (
        <div className="p-4 bg-surface-accent space-y-4">
            <h4 className="font-semibold text-text-primary">Редактирование транзакции</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor={`desc-${transaction.id}`} className="block text-sm font-medium text-text-secondary mb-1">
                        Описание
                    </label>
                    <input
                        id={`desc-${transaction.id}`}
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                    />
                </div>
                <div>
                    <label htmlFor={`counterparty-${transaction.id}`} className="block text-sm font-medium text-text-secondary mb-1">
                        Контрагент (необязательно)
                    </label>
                    <input
                        id={`counterparty-${transaction.id}`}
                        type="text"
                        value={counterparty}
                        onChange={(e) => setCounterparty(e.target.value)}
                        className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                    />
                </div>
            </div>
            <div>
                <label htmlFor={`cat-${transaction.id}`} className="block text-sm font-medium text-text-secondary mb-1">
                    Категория
                </label>
                <select
                    id={`cat-${transaction.id}`}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                >
                    {!categoryList.includes(category) && <option value={category} disabled>{category}</option>}
                    {categoryList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>
            {similarTransactionsCount > 0 && (
                <div className="flex items-center pt-2">
                    <input
                        type="checkbox"
                        id={`apply-all-${transaction.id}`}
                        checked={applyToAll}
                        onChange={(e) => setApplyToAll(e.target.checked)}
                        className="h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary"
                    />
                    <label htmlFor={`apply-all-${transaction.id}`} className="ml-3 text-sm text-text-secondary">
                        Применить ко всем {similarTransactionsCount + 1} транзакциям с таким же описанием
                    </label>
                </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-text-primary bg-surface-accent rounded-lg hover:bg-border transition-colors"
                >
                    Отмена
                </button>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary-hover transition-colors shadow-md"
                >
                    Сохранить
                </button>
            </div>
        </div>
    );
};

const AddTransactionModal: React.FC<{
    open: boolean;
    onClose: () => void;
    onAdd: (tx: Transaction) => void;
}> = ({ open, onClose, onAdd }) => {
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number>(0);
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [category, setCategory] = useState('');
    const [counterparty, setCounterparty] = useState('');
    const [transactionType, setTransactionType] = useState<'operating' | 'investing' | 'financing'>('operating');
    const [isCapitalized, setIsCapitalized] = useState(false);

    const categoryList = useMemo(() => type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES, [type]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim() || !category.trim() || !date || !amount) return;
        onAdd({
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            date,
            description,
            amount: Math.abs(amount),
            type,
            category,
            counterparty,
            transactionType,
            isCapitalized,
        });
        setDescription(''); setAmount(0); setCategory(''); setCounterparty(''); setIsCapitalized(false);
        onClose();
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-8 w-full max-w-lg shadow-xl space-y-4 border border-border">
                <h2 className="text-xl font-bold mb-2">Добавить транзакцию</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm mb-1">Дата</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 rounded-lg border border-border bg-background text-text-primary" required />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Тип</label>
                        <select value={type} onChange={e => setType(e.target.value as any)} className="w-full p-2 rounded-lg border border-border bg-background text-text-primary">
                            <option value="expense">Расход</option>
                            <option value="income">Доход</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Сумма</label>
                        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full p-2 rounded-lg border border-border bg-background text-text-primary" required min="0.01" step="0.01" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Категория</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 rounded-lg border border-border bg-background text-text-primary" required>
                            <option value="">Выберите...</option>
                            {categoryList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Описание</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 rounded-lg border border-border bg-background text-text-primary" required />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Контрагент</label>
                        <input type="text" value={counterparty} onChange={e => setCounterparty(e.target.value)} className="w-full p-2 rounded-lg border border-border bg-background text-text-primary" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Тип транзакции</label>
                        <select value={transactionType} onChange={e => setTransactionType(e.target.value as any)} className="w-full p-2 rounded-lg border border-border bg-background text-text-primary">
                            <option value="operating">Операционная</option>
                            <option value="investing">Инвестиционная</option>
                            <option value="financing">Финансовая</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                        <input type="checkbox" id="isCapitalized" checked={isCapitalized} onChange={e => setIsCapitalized(e.target.checked)} />
                        <label htmlFor="isCapitalized" className="text-sm">Капитализировать</label>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-primary bg-surface-accent rounded-lg hover:bg-border transition-colors">Отмена</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary-hover transition-colors shadow-md">Добавить</button>
                </div>
            </form>
        </div>
    );
};


const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions, onUpdateTransaction, onAddTransaction }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const { theme } = useTheme();

    const sortedTransactions = useMemo(() => {
        let sortableItems = [...transactions];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (sortConfig.key === 'date') {
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
                    return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
                }
                const valA = a[sortConfig.key] || '';
                const valB = b[sortConfig.key] || '';

                if (valA < valB) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (valA > valB) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [transactions, sortConfig]);

    const filteredTransactions = useMemo(() => {
        const lowercasedTerm = searchTerm.toLowerCase();
        return sortedTransactions.filter(tx =>
            tx.description.toLowerCase().includes(lowercasedTerm) ||
            tx.category.toLowerCase().includes(lowercasedTerm) ||
            (tx.counterparty || '').toLowerCase().includes(lowercasedTerm)
        );
    }, [sortedTransactions, searchTerm]);

    const similarTransactionsMap = useMemo(() => {
        const counts: { [key: string]: number } = {};
        transactions.forEach(tx => {
            counts[tx.description] = (counts[tx.description] || 0) + 1;
        });
        return counts;
    }, [transactions]);


    const requestSort = (key: keyof Transaction) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: keyof Transaction) => {
        if (!sortConfig || sortConfig.key !== key) {
            return '↕';
        }
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    const toggleRowExpansion = (txId: string) => {
        setExpandedRowId(prevId => (prevId === txId ? null : txId));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                        Список транзакций
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-text-secondary">
                        Управляйте и анализируйте все ваши финансовые операции
                    </p>
                </div>

                {/* Filters and Actions */}
                <div className="bg-white/80 dark:bg-surface/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 dark:border-border/50 mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Поиск по описанию, категории или контрагенту..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-border bg-white/70 dark:bg-surface/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex gap-2">
                                <button className="px-4 py-3 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-border text-slate-700 dark:text-text-primary hover:border-blue-500 hover:text-blue-600 transition-all duration-200 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                                    </svg>
                                    Фильтры
                                </button>
                                
                                <button className="px-4 py-3 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-border text-slate-700 dark:text-text-primary hover:border-blue-500 hover:text-blue-600 transition-all duration-200 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h4a1 1 0 110 2H4a1 1 0 01-1-1z" />
                                    </svg>
                                    Сортировка
                                </button>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => setAddModalOpen(true)}
                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Добавить транзакцию
                        </button>
                    </div>
                </div>
                <AddTransactionModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onAdd={onAddTransaction} />
                
                {/* Transactions Table */}
                <div className="bg-white/80 dark:bg-surface/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg border border-white/50 dark:border-border/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-full">
                            <thead className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-surface-accent dark:to-surface">
                                <tr>
                                    <th className="p-4 md:p-6 cursor-pointer whitespace-nowrap text-slate-700 dark:text-text-primary font-semibold hover:text-blue-600 transition-colors" onClick={() => requestSort('date')}>
                                        <div className="flex items-center gap-1 md:gap-2">
                                            <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm md:text-base">Дата {getSortIndicator('date')}</span>
                                        </div>
                                    </th>
                                    <th className="p-4 md:p-6 cursor-pointer whitespace-nowrap text-slate-700 dark:text-text-primary font-semibold hover:text-blue-600 transition-colors" onClick={() => requestSort('description')}>
                                        <div className="flex items-center gap-1 md:gap-2">
                                            <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm md:text-base">Описание {getSortIndicator('description')}</span>
                                        </div>
                                    </th>
                                    <th className="p-4 md:p-6 cursor-pointer whitespace-nowrap text-slate-700 dark:text-text-primary font-semibold hover:text-blue-600 transition-colors hidden sm:table-cell" onClick={() => requestSort('counterparty')}>
                                        <div className="flex items-center gap-1 md:gap-2">
                                            <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm md:text-base">Контрагент {getSortIndicator('counterparty')}</span>
                                        </div>
                                    </th>
                                    <th className="p-4 md:p-6 cursor-pointer whitespace-nowrap text-right text-slate-700 dark:text-text-primary font-semibold hover:text-blue-600 transition-colors" onClick={() => requestSort('amount')}>
                                        <div className="flex items-center justify-end gap-1 md:gap-2">
                                            <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm md:text-base">Сумма {getSortIndicator('amount')}</span>
                                        </div>
                                    </th>
                                    <th className="p-4 md:p-6 cursor-pointer whitespace-nowrap text-slate-700 dark:text-text-primary font-semibold hover:text-blue-600 transition-colors" onClick={() => requestSort('category')}>
                                        <div className="flex items-center gap-1 md:gap-2">
                                            <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                            </svg>
                                            <span className="text-sm md:text-base">Категория {getSortIndicator('category')}</span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                        <tbody>
                            {filteredTransactions.map(tx => (
                                <React.Fragment key={tx.id}>
                                    <tr className={`border-t border-slate-200 dark:border-border transition-colors hover:bg-slate-50/50 dark:hover:bg-surface-accent ${tx.needsClarification ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''} ${expandedRowId === tx.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                        <td className="p-4 md:p-6 whitespace-nowrap text-slate-600 dark:text-text-secondary text-sm">
                                            {new Date(tx.date).toLocaleDateString('ru-RU')}
                                        </td>
                                        <td className="p-4 md:p-6 text-slate-900 dark:text-text-primary font-medium">
                                            <div className="max-w-[200px] md:max-w-none truncate">
                                                {tx.description}
                                            </div>
                                        </td>
                                        <td className="p-4 md:p-6 text-slate-600 dark:text-text-secondary hidden sm:table-cell">
                                            <div className="max-w-[150px] truncate">
                                                {tx.counterparty}
                                            </div>
                                        </td>
                                        <td className={`p-4 md:p-6 text-right font-mono whitespace-nowrap font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            <div className="text-sm md:text-base">
                                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </div>
                                        </td>
                                        <td className="p-4 md:p-6 whitespace-nowrap">
                                            {tx.needsClarification ? (
                                                <button
                                                    onClick={() => toggleRowExpansion(tx.id)}
                                                    className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-xl bg-yellow-500 text-white hover:bg-yellow-600 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                                                >
                                                    <span className="hidden sm:inline">Уточнить</span>
                                                    <span className="sm:hidden">!</span>
                                                    {expandedRowId === tx.id ? '▲' : '▼'}
                                                </button>
                                            ) : (
                                                <span
                                                    className={`px-2 md:px-3 py-1 text-xs font-medium rounded-xl ${getCategoryClass(tx.category, theme)} cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all block truncate max-w-[100px] sm:max-w-none text-center sm:text-left`}
                                                    onClick={() => toggleRowExpansion(tx.id)}
                                                    title={tx.category}
                                                >
                                                    <span className="hidden sm:inline">{tx.category}</span>
                                                    <span className="sm:hidden">📂</span>
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                    {expandedRowId === tx.id && (
                                        <tr className="border-t border-border bg-surface-accent">
                                            <td colSpan={5} className="p-0">
                                                <ClarificationForm
                                                    transaction={tx}
                                                    similarTransactionsCount={similarTransactionsMap[tx.description] - 1}
                                                    onSave={(updates, applyToAll) => {
                                                        onUpdateTransaction(tx, updates, applyToAll);
                                                        setExpandedRowId(null);
                                                    }}
                                                    onCancel={() => setExpandedRowId(null)}
                                                />
                                            </td>
                                        </tr>
                                                        )}
                </React.Fragment>
            ))}
        </tbody>
    </table>
</div>
</div>
</div>
</div>
);
};

export default TransactionsTable;
