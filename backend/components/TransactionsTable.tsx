
import React, { useState, useMemo } from 'react';
import { Transaction, Theme } from '../../types.ts';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants.ts';

interface TransactionsTableProps {
    transactions: Transaction[];
    onUpdateTransaction: (originalTx: Transaction, updates: Partial<Pick<Transaction, 'description' | 'category' | 'counterparty'>>, applyToAll: boolean) => void;
    onAddTransaction: (tx: Transaction) => void;
    theme: Theme;
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


const getCategoryClass = (category: string, theme: Theme) => {
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


const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions, onUpdateTransaction, onAddTransaction, theme }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [addModalOpen, setAddModalOpen] = useState(false);

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
        <div className="p-8">
            <h1 className="text-3xl font-bold text-text-primary mb-6">Список Транзакций</h1>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <input
                    type="text"
                    placeholder="Поиск по описанию, категории или контрагенту..."
                    className="w-full max-w-sm p-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                    onClick={() => setAddModalOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-primary-foreground bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                    + Добавить транзакцию
                </button>
            </div>
            <AddTransactionModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onAdd={onAddTransaction} />
            <div className="bg-surface rounded-2xl overflow-hidden border border-border shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-full">
                        <thead className="bg-surface-accent">
                            <tr>
                                <th className="p-4 cursor-pointer whitespace-nowrap text-text-secondary" onClick={() => requestSort('date')}>Дата {getSortIndicator('date')}</th>
                                <th className="p-4 cursor-pointer whitespace-nowrap text-text-secondary" onClick={() => requestSort('description')}>Описание {getSortIndicator('description')}</th>
                                <th className="p-4 cursor-pointer whitespace-nowrap text-text-secondary" onClick={() => requestSort('counterparty')}>Контрагент {getSortIndicator('counterparty')}</th>
                                <th className="p-4 cursor-pointer whitespace-nowrap text-right text-text-secondary" onClick={() => requestSort('amount')}>Сумма {getSortIndicator('amount')}</th>
                                <th className="p-4 cursor-pointer whitespace-nowrap text-text-secondary" onClick={() => requestSort('category')}>Категория {getSortIndicator('category')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map(tx => (
                                <React.Fragment key={tx.id}>
                                    <tr className={`border-t border-border transition-colors ${tx.needsClarification ? (theme === 'dark' ? 'bg-yellow-900/20' : 'bg-yellow-50') : ''} ${expandedRowId === tx.id ? 'bg-surface-accent' : 'hover:bg-surface-accent/50'}`}>
                                        <td className="p-4 whitespace-nowrap text-text-secondary">{new Date(tx.date).toLocaleDateString('ru-RU')}</td>
                                        <td className="p-4 text-text-primary">{tx.description}</td>
                                        <td className="p-4 text-text-secondary">{tx.counterparty}</td>
                                        <td className={`p-4 text-right font-mono whitespace-nowrap ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            {tx.needsClarification ? (
                                                <button
                                                    onClick={() => toggleRowExpansion(tx.id)}
                                                    className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-500 text-black hover:bg-yellow-400 transition-colors flex items-center gap-2"
                                                >
                                                    Уточнить {expandedRowId === tx.id ? '▲' : '▼'}
                                                </button>
                                            ) : (
                                                <span
                                                    className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryClass(tx.category, theme)} cursor-pointer hover:ring-2 hover:ring-primary transition-all`}
                                                    onClick={() => toggleRowExpansion(tx.id)}
                                                >
                                                    {tx.category}
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
    );
};

export default TransactionsTable;
