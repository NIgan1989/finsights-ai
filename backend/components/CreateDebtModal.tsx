import React, { useState } from 'react';
import { Transaction } from '../../types';

interface CreateDebtModalProps {
    open: boolean;
    onClose: () => void;
    onAdd: (transaction: Transaction) => void;
}

const CreateDebtModal: React.FC<CreateDebtModalProps> = ({ open, onClose, onAdd }) => {
    const [counterparty, setCounterparty] = useState('');
    const [amount, setAmount] = useState('');
    const [debtType, setDebtType] = useState<'debt' | 'credit'>('debt'); // debt = вам должны, credit = вы должны
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!counterparty.trim() || !amount || parseFloat(amount) <= 0) {
            return;
        }

        setIsSubmitting(true);

        try {
            const transaction: Transaction = {
                id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                date: new Date().toISOString().split('T')[0],
                description: debtType === 'debt' 
                    ? `Выдача займа: ${counterparty.trim()}`
                    : `Получение кредита: ${counterparty.trim()}`,
                amount: parseFloat(amount),
                type: 'expense', // Для займов и кредитов используем expense
                counterparty: counterparty.trim(),
                category: debtType === 'debt' ? 'Выдача займа' : 'Получение кредита',
                transactionType: 'financing',
                isCapitalized: false,
                needsClarification: false,
            };

            onAdd(transaction);
            
            // Сброс формы
            setCounterparty('');
            setAmount('');
            setDebtType('debt');
            onClose();
        } catch (error) {
            console.error('Ошибка при создании обязательства:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setCounterparty('');
            setAmount('');
            setDebtType('debt');
            onClose();
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-text-primary">Создать обязательство</h2>
                        <button
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Контрагент
                            </label>
                            <input
                                type="text"
                                value={counterparty}
                                onChange={(e) => setCounterparty(e.target.value)}
                                placeholder="Введите имя контрагента"
                                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Сумма (₸)
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Тип обязательства
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="debt"
                                        checked={debtType === 'debt'}
                                        onChange={(e) => setDebtType(e.target.value as 'debt' | 'credit')}
                                        className="mr-2 text-primary focus:ring-primary"
                                        disabled={isSubmitting}
                                    />
                                    <span className="text-text-primary">Долг (мне должны)</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="credit"
                                        checked={debtType === 'credit'}
                                        onChange={(e) => setDebtType(e.target.value as 'debt' | 'credit')}
                                        className="mr-2 text-primary focus:ring-primary"
                                        disabled={isSubmitting}
                                    />
                                    <span className="text-text-primary">Кредит (я должен)</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 border border-border rounded-md text-text-secondary hover:bg-surface-accent transition-colors disabled:opacity-50"
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !counterparty.trim() || !amount || parseFloat(amount) <= 0}
                                className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Создание...' : 'Создать'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateDebtModal;