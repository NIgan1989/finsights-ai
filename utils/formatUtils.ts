export type NumberFormatOptions = {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export const formatNumber = (value: number, opts: NumberFormatOptions = {}): string => {
  const { locale = 'ru-RU', minimumFractionDigits, maximumFractionDigits } = opts;
  const options: Intl.NumberFormatOptions = {};
  if (typeof minimumFractionDigits === 'number') options.minimumFractionDigits = minimumFractionDigits;
  if (typeof maximumFractionDigits === 'number') options.maximumFractionDigits = maximumFractionDigits;
  return new Intl.NumberFormat(locale, options).format(value);
};

export type CurrencyFormatOptions = NumberFormatOptions & {
  currency?: string;
};

export const formatCurrency = (value: number, opts: CurrencyFormatOptions = {}): string => {
  const { locale = 'ru-RU', currency = 'KZT', minimumFractionDigits = 0, maximumFractionDigits = 0 } = opts;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
};

export const formatPercentage = (value: number, opts: { fraction?: boolean; digits?: number; locale?: string } = {}): string => {
  const { fraction = false, digits = 1, locale = 'ru-RU' } = opts;
  const v = fraction ? value * 100 : value;
  return new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v) + '%';
};