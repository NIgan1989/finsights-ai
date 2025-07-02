export const formatCurrency = (
    amount: number,
    options: { currency?: string; locale?: string; minimumFractionDigits?: number } = {}
): string => {
    const {
        currency = 'KZT', // Tenge по умолчанию
        locale = 'ru-KZ',
        minimumFractionDigits = 0,
    } = options;

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits,
    }).format(amount);
}; 