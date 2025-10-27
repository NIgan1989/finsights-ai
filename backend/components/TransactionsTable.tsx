
import React, { useState, useMemo } from 'react';
import { getCurrentLocalDate, parseLocalDate, formatFullDate, formatWeekdayLong } from '../../utils/dateUtils';
import { Transaction } from '../../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants';
import EditableCell from './EditableCell';
import { formatNumber } from '../../utils/formatUtils';
// Функция для получения цвета категории с использованием CSS переменных
const getCategoryColor = (category: string): string => {
  const categoryColors: Record<string, string> = {
    // Operating
    'Зарплата': 'bg-warning/10 text-warning border-warning/20',
    'Аренда': 'bg-destructive/10 text-destructive border-destructive/20',
    'Закупка товаров': 'bg-accent/10 text-accent border-accent/20',
    'Реклама и маркетинг': 'bg-primary/10 text-primary border-primary/20',
    'Коммунальные услуги': 'bg-info/10 text-info border-info/20',
    'Связь и интернет': 'bg-primary/10 text-primary border-primary/20',
    'Транспортные расходы': 'bg-success/10 text-success border-success/20',
    'Ремонт и обслуживание': 'bg-warning/10 text-warning border-warning/20',
    'Канцтовары': 'bg-success/10 text-success border-success/20',
    'Представительские расходы': 'bg-accent/10 text-accent border-accent/20',
    'Командировочные расходы': 'bg-primary/10 text-primary border-primary/20',
    'Подписки на сервисы': 'bg-info/10 text-info border-info/20',
    'Страхование': 'bg-info/10 text-info border-info/20',
    'Банковские комиссии': 'bg-muted/10 text-muted-foreground border-muted/20',
    'Налоги': 'bg-warning/10 text-warning border-warning/20',
    'Штрафы и пени': 'bg-destructive/10 text-destructive border-destructive/20',
    
    // CAPEX
    'Оборудование': 'bg-accent/10 text-accent border-accent/20',
    
    // Financing
    'Проценты по кредитам': 'bg-warning/10 text-warning border-warning/20',
    'Погашение кредита': 'bg-accent/10 text-accent border-accent/20',
    'Выдача займа': 'bg-primary/10 text-primary border-primary/20',
    'Лизинговые платежи': 'bg-primary/10 text-primary border-primary/20',
    'Выплата дивидендов': 'bg-accent/10 text-accent border-accent/20',
    'Накопления и сбережения': 'bg-info/10 text-info border-info/20',
    'Личные траты': 'bg-destructive/10 text-destructive border-destructive/20',
    
    // Income
    'Операционный доход': 'bg-success/10 text-success border-success/20',
    'Получение кредита': 'bg-success/10 text-success border-success/20',
    'Взнос учредителя': 'bg-info/10 text-info border-info/20',
    'Возврат долга': 'bg-success/10 text-success border-success/20',
    'Прочие поступления': 'bg-success/10 text-success border-success/20',
    
    // Дополнительные категории
    'Детский сад': 'bg-primary/10 text-primary border-primary/20',
    'Аптека и здоровье': 'bg-success/10 text-success border-success/20',
    'Красота и здоровье': 'bg-primary/10 text-primary border-primary/20',
    'Магазины': 'bg-accent/10 text-accent border-accent/20',
    'Кафе и рестораны': 'bg-warning/10 text-warning border-warning/20',
    'Развлечения': 'bg-accent/10 text-accent border-accent/20',
    'Спорт и фитнес': 'bg-success/10 text-success border-success/20',
    'Образование': 'bg-info/10 text-info border-info/20',
    'Подарки': 'bg-accent/10 text-accent border-accent/20',
    'Благотворительность': 'bg-success/10 text-success border-success/20',
    'Путешествия': 'bg-primary/10 text-primary border-primary/20',
    'Хобби': 'bg-accent/10 text-accent border-accent/20',
  };
  
  return categoryColors[category] || 'bg-muted/10 text-muted-foreground border-muted/20';
};
import { useTheme } from './ThemeProvider';

interface TransactionsTableProps {
    transactions: Transaction[];
    onUpdateTransaction: (originalTx: Transaction, updates: Partial<Pick<Transaction, 'description' | 'category' | 'counterparty'>>, applyToAll: boolean) => void;
    onAddTransaction: (tx: Transaction) => void;
    onDeleteTransaction: (tx: Transaction) => void;
    onClearAllData?: () => void;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('ru-RU').format(amount) + ' ₸';

// Удалены дублирующиеся цветовые карты - теперь используется утилитарная функция из config/theme.config.ts

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
            <h4 className="font-semibold text-foreground">Редактирование транзакции</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor={`desc-${transaction.id}`} className="block text-sm font-medium text-muted-foreground mb-1">
                        Описание
                    </label>
                    <input
                        id={`desc-${transaction.id}`}
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                </div>
                <div>
                    <label htmlFor={`counterparty-${transaction.id}`} className="block text-sm font-medium text-muted-foreground mb-1">
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
                <label htmlFor={`cat-${transaction.id}`} className="block text-sm font-medium text-muted-foreground mb-1">
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
                    <label htmlFor={`apply-all-${transaction.id}`} className="ml-3 text-sm text-muted-foreground">
                        Применить ко всем {similarTransactionsCount + 1} транзакциям с таким же описанием
                    </label>
                </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-foreground bg-surface-accent rounded-lg hover:bg-border transition-colors"
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
    const [date, setDate] = useState(() => getCurrentLocalDate());
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<string>('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [category, setCategory] = useState('');
    const [counterparty, setCounterparty] = useState('');
    const [transactionType, setTransactionType] = useState<'operating' | 'investing' | 'financing'>('operating');
    const [isCapitalized, setIsCapitalized] = useState(false);

    const categoryList = useMemo(() => type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES, [type]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim() || !category.trim() || !date || !amount.trim()) return;
        onAdd({
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            date,
            description,
            amount: Math.abs(Number(amount)),
            type,
            category,
            counterparty,
            transactionType,
            isCapitalized,
        });
        setDescription(''); setAmount(''); setCategory(''); setCounterparty(''); setIsCapitalized(false);
        onClose();
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40">
            <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-8 w-full max-w-lg shadow-xl space-y-4 border border-border">
                <h2 className="text-xl font-bold mb-2">Добавить транзакцию</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm mb-1">Дата</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 rounded-lg border border-border bg-background text-foreground" required />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Тип</label>
                        <select value={type} onChange={e => setType(e.target.value as any)} className="w-full p-2 rounded-lg border border-border bg-background text-foreground">
                            <option value="expense">Расход</option>
                            <option value="income">Доход</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Сумма</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full p-2 rounded-lg border border-border bg-background text-foreground" required min="0.01" step="0.01" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Категория</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 rounded-lg border border-border bg-background text-foreground" required>
                            <option value="">Выберите...</option>
                            {categoryList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Описание</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 rounded-lg border border-border bg-background text-foreground" required />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Контрагент</label>
                        <input type="text" value={counterparty} onChange={e => setCounterparty(e.target.value)} className="w-full p-2 rounded-lg border border-border bg-background text-foreground" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Тип транзакции</label>
                        <select value={transactionType} onChange={e => setTransactionType(e.target.value as any)} className="w-full p-2 rounded-lg border border-border bg-background text-foreground">
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
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-foreground bg-surface-accent rounded-lg hover:bg-border transition-colors">Отмена</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary-hover transition-colors shadow-md">Добавить</button>
                </div>
            </form>
        </div>
    );
};


const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions, onUpdateTransaction, onAddTransaction, onDeleteTransaction, onClearAllData }) => {
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
                    const parsedA = parseLocalDate(a.date);
                    const parsedB = parseLocalDate(b.date);
                    const dateA = (parsedA ? parsedA.getTime() : new Date(a.date).getTime());
                    const dateB = (parsedB ? parsedB.getTime() : new Date(b.date).getTime());
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
        <div className="min-h-screen bg-background p-4 lg:p-6">
            <div className="max-w-full mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                        Список операций
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Управляйте и анализируйте все ваши финансовые операции
                    </p>
                </div>

                {/* Filters and Actions */}
                <div className="bg-surface-80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50 mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Поиск по описанию, категории или контрагенту..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex gap-2">
                                <button className="px-4 py-3 rounded-xl bg-surface border border-border text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                                    </svg>
                                    Фильтры
                                </button>
                                
                                <button className="px-4 py-3 rounded-xl bg-surface border border-border text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h4a1 1 0 110 2H4a1 1 0 01-1-1z" />
                                    </svg>
                                    Сортировка
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    if (window.confirm('Вы уверены, что хотите очистить все данные? Это действие нельзя отменить.')) {
                                        if (onClearAllData) {
                                            onClearAllData();
                                        } else {
                                            // Fallback: очищаем все транзакции по одной
                                            transactions.forEach(tx => onDeleteTransaction && onDeleteTransaction(tx));
                                        }
                                    }
                                }}
                                className="px-6 py-3 bg-destructive text-destructive-foreground rounded-xl font-semibold hover:bg-destructive/90 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V7zM12 7a1 1 0 10-2 0v4a1 1 0 102 0V7z" clipRule="evenodd" />
                                </svg>
                                Очистить данные
                            </button>
                            <button
                                onClick={() => setAddModalOpen(true)}
                                className="px-6 py-3 bg-success text-success-foreground rounded-xl font-semibold hover:bg-success/90 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Добавить операцию
                            </button>
                        </div>
                    </div>
                </div>
                <AddTransactionModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onAdd={onAddTransaction} />
                
                {/* Transactions Table */}
                <div className="bg-surface border border-border rounded-2xl shadow-lg overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                        <table className="w-full text-left min-w-[600px] md:min-w-[800px]">
                            <thead className="bg-surface border-b border-border sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 md:p-4 whitespace-nowrap text-foreground font-semibold tracking-wide uppercase text-xs w-16">
                                        <div className="flex items-center justify-center">
                                            <span className="text-sm md:text-base">№</span>
                                        </div>
                                    </th>
                                    <th className="p-3 md:p-4 cursor-pointer whitespace-nowrap text-foreground font-semibold tracking-wide uppercase text-xs hover:text-primary transition-colors" onClick={() => requestSort('date')}>
                                        <div className="flex items-center gap-1 md:gap-2">
                                            <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm md:text-base">Дата {getSortIndicator('date')}</span>
                                        </div>
                                    </th>
                                    <th className="p-3 md:p-4 cursor-pointer whitespace-nowrap text-foreground font-semibold tracking-wide uppercase text-xs hover:text-primary transition-colors" onClick={() => requestSort('description')}>
                                        <div className="flex items-center gap-1 md:gap-2">
                                            <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm md:text-base">Описание {getSortIndicator('description')}</span>
                                        </div>
                                    </th>
                                    <th className="p-3 md:p-4 cursor-pointer whitespace-nowrap text-foreground font-semibold tracking-wide uppercase text-xs hover:text-primary transition-colors hidden sm:table-cell" onClick={() => requestSort('counterparty')}>
                                        <div className="flex items-center gap-1 md:gap-2">
                                            <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm md:text-base">Контрагент {getSortIndicator('counterparty')}</span>
                                        </div>
                                    </th>
                                    <th className="p-3 md:p-4 cursor-pointer whitespace-nowrap text-right text-foreground font-semibold tracking-wide uppercase text-xs hover:text-primary transition-colors" onClick={() => requestSort('amount')}>
                                        <div className="flex items-center justify-end gap-1 md:gap-2">
                                            <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm md:text-base">Сумма {getSortIndicator('amount')}</span>
                                        </div>
                                    </th>
                                    <th className="p-3 md:p-4 cursor-pointer whitespace-nowrap text-foreground font-semibold tracking-wide uppercase text-xs hover:text-primary transition-colors" onClick={() => requestSort('category')}>
                                        <div className="flex items-center gap-1 md:gap-2">
                                            <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                            </svg>
                                            <span className="text-sm md:text-base">Категория {getSortIndicator('category')}</span>
                                        </div>
                                    </th>
                                    <th className="p-3 md:p-4 whitespace-nowrap text-foreground font-semibold tracking-wide uppercase text-xs">
                                        <div className="flex items-center gap-1 md:gap-2">
                                            <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 8a2 2 0 110 4 2 2 0 010-4zM10 16a2 2 0 110-4 2 2 0 010 4z" />
                                            </svg>
                                            <span className="text-sm md:text-base">Действия</span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                        <tbody>
                            {filteredTransactions.map((tx, index) => (
                                <React.Fragment key={tx.id}>
                                    <tr className={`border-t border-border transition-all duration-200 hover:bg-surface-elevated hover:shadow-sm group ${tx.needsClarification ? 'bg-warning-10' : ''} ${expandedRowId === tx.id ? 'bg-primary-10' : ''}`}>
                                        <td className="p-3 md:p-6 whitespace-nowrap text-center">
                                            <div className="text-sm md:text-base font-medium text-foreground">
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="p-3 md:p-6 whitespace-nowrap">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div className="w-8 h-8 md:w-10 md:h-10 bg-primary-10 rounded-xl flex items-center justify-center group-hover:bg-primary-20 transition-colors">
                                                    <svg className="w-4 h-4 md:w-5 md:h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="text-xs md:text-sm font-semibold text-foreground">
                                                        {formatFullDate(tx.date)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground font-medium hidden md:block">
                                                        {formatWeekdayLong(tx.date)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 md:p-6">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div className="w-8 h-8 md:w-10 md:h-10 bg-primary-10 rounded-xl flex items-center justify-center group-hover:bg-primary-20 transition-colors">
                                                    <svg className="w-4 h-4 md:w-5 md:h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-xs md:text-sm font-semibold text-foreground truncate max-w-[150px] md:max-w-[250px]" title={tx.description}>
                                                        {tx.description}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1 hidden md:block">
                                                        {tx.transactionType === 'operating' ? 'Операционная' : tx.transactionType === 'investing' ? 'Инвестиционная' : 'Финансовая'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 md:p-6 hidden sm:table-cell">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div className="w-6 h-6 md:w-8 md:h-8 bg-success-10 rounded-lg flex items-center justify-center">
                                                    <svg className="w-3 h-3 md:w-4 md:h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs md:text-sm font-medium text-foreground truncate max-w-[80px] md:max-w-[120px]" title={tx.counterparty || 'Не указан'}>
                                                        {tx.counterparty || 'Не указан'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 md:p-6 text-right whitespace-nowrap">
                                            <div className={`inline-flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-2 rounded-xl font-mono font-bold text-xs md:text-sm ${tx.type === 'income' ? 'bg-success-10 text-success' : 'bg-destructive-10 text-destructive'}`}>
                                                <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${tx.type === 'income' ? 'bg-success' : 'bg-destructive'}`}></span>
                                                <span className="truncate max-w-[80px] md:max-w-none">
                                                    {tx.type === 'income' ? '+' : '-'}{formatNumber(tx.amount)} ₸
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-3 md:p-6 whitespace-nowrap">
                                            <div className="flex items-center gap-1 md:gap-2">
                                                {tx.needsClarification ? (
                                                    <button
                                                        onClick={() => toggleRowExpansion(tx.id)}
                                                        className="px-2 md:px-4 py-1 md:py-2 text-xs font-bold rounded-xl bg-warning text-warning-foreground hover:bg-warning/90 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-1 md:gap-2 w-full sm:w-auto justify-center"
                                                    >
                                                        <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="hidden sm:inline">Уточнить</span>
                                                        <span className="sm:hidden">!</span>
                                                        {expandedRowId === tx.id ? '▲' : '▼'}
                                                    </button>
                                                ) : (
                                                    <span
                                                        className={`inline-flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-2 text-xs font-semibold rounded-xl border ${getCategoryColor(tx.category)} cursor-pointer hover:ring-2 hover:ring-primary hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 max-w-[80px] md:max-w-[120px]`}
                                                        onClick={() => toggleRowExpansion(tx.id)}
                                                        title={tx.category}
                                                    >
                                                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-current opacity-70"></span>
                                                        <span className="hidden sm:inline truncate">{tx.category}</span>
                                                        <span className="sm:hidden">📂</span>
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => setExpandedRowId(expandedRowId === tx.id ? null : tx.id)}
                                                    className="group p-1.5 md:p-2.5 text-primary hover:text-primary-foreground hover:bg-primary rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg border border-primary/20 hover:border-primary"
                                                    title="Редактировать транзакцию"
                                                >
                                                    <svg className="w-3 h-3 md:w-4 md:h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => onDeleteTransaction(tx)}
                                                    className="group p-1.5 md:p-2.5 text-destructive hover:text-destructive-foreground hover:bg-destructive rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg border border-destructive/20 hover:border-destructive"
                                                    title="Удалить транзакцию"
                                                >
                                                    <svg className="w-3 h-3 md:w-4 md:h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedRowId === tx.id && (
                                        <tr className="border-t border-border bg-surface-accent">
                                            <td colSpan={7} className="p-0">
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
