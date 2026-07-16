import type { BaseCurrency } from '../types';

// Para birimi başına formatter cache'i. Modül seviyesinde tek bir TRY formatter'ı
// donduramayız: taban para birimi çalışma anında değişebiliyor.
// Locale tr-TR sabit (Faz 3 i18n ile birlikte gelecek) - yalnızca kod değişir.
const currencyFormatters = new Map<BaseCurrency, Intl.NumberFormat>();

function getCurrencyFormatter(currency: BaseCurrency): Intl.NumberFormat {
  let fmt = currencyFormatters.get(currency);
  if (!fmt) {
    fmt = new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    currencyFormatters.set(currency, fmt);
  }
  return fmt;
}

const numberFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/** Bileşenlerde doğrudan çağırmak yerine useCurrency() hook'unu tercih et - taban parayı o geçirir. */
export function formatCurrency(value: number, currency: BaseCurrency = 'TRY'): string {
  return getCurrencyFormatter(currency).format(value);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDate(dateStr: string): string {
  return dateFormatter.format(new Date(dateStr));
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
