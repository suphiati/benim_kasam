import type { BaseCurrency } from '../types';

export type Locale = 'tr-TR' | 'en-US';
export const DEFAULT_LOCALE: Locale = 'tr-TR';

// Formatter cache'leri. Anahtar locale'i İÇERMELİ: yoksa ilk render'da kullanılan dil
// sonsuza kadar yapışır ve dil değişince sayılar/tarihler eski locale'de kalır.
// Bileşenler bunları doğrudan çağırmaz; useCurrency() / useT() locale'i geçirir.
const currencyFormatters = new Map<string, Intl.NumberFormat>();
const numberFormatters = new Map<Locale, Intl.NumberFormat>();
const percentFormatters = new Map<Locale, Intl.NumberFormat>();
const dateFormatters = new Map<Locale, Intl.DateTimeFormat>();

function getCurrencyFormatter(locale: Locale, currency: BaseCurrency): Intl.NumberFormat {
  const key = `${locale}:${currency}`;
  let fmt = currencyFormatters.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    currencyFormatters.set(key, fmt);
  }
  return fmt;
}

function getNumberFormatter(locale: Locale): Intl.NumberFormat {
  let fmt = numberFormatters.get(locale);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    numberFormatters.set(locale, fmt);
  }
  return fmt;
}

function getPercentFormatter(locale: Locale): Intl.NumberFormat {
  let fmt = percentFormatters.get(locale);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, {
      style: 'percent',
      signDisplay: 'exceptZero',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    percentFormatters.set(locale, fmt);
  }
  return fmt;
}

function getDateFormatter(locale: Locale): Intl.DateTimeFormat {
  let fmt = dateFormatters.get(locale);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    dateFormatters.set(locale, fmt);
  }
  return fmt;
}

export function formatCurrency(
  value: number,
  currency: BaseCurrency = 'TRY',
  locale: Locale = DEFAULT_LOCALE,
): string {
  return getCurrencyFormatter(locale, currency).format(value);
}

export function formatNumber(value: number, locale: Locale = DEFAULT_LOCALE): string {
  return getNumberFormatter(locale).format(value);
}

/**
 * Yüzde. Girdi zaten yüzde ölçeğinde (92.93 = %92,93) ama Intl 100 ile çarptığı için
 * bölüyoruz. Intl kullanmak locale kurallarını da getiriyor: TR'de işaret/yüzde önde
 * (%12,34), EN'de arkada (12.34%). Eskiden toFixed(2) ile elle kuruluyordu; o hep NOKTA
 * basıyordu, yani Türkçede yan yandaki formatNumber (1.234,56) ile tutarsızdı.
 */
export function formatPercent(value: number, locale: Locale = DEFAULT_LOCALE): string {
  return getPercentFormatter(locale).format(value / 100);
}

/**
 * 'YYYY-MM-DD' -> locale'e göre görünen tarih.
 * new Date('2024-01-15') UTC gece yarısı olarak parse edilir; UTC'nin BATISINDAKİ bir
 * kullanıcıda bir gün geriye kayardı (New York'ta 14 Ocak görünürdü). Parçalayıp
 * yerel tarih kuruyoruz.
 */
export function formatDate(dateStr: string, locale: Locale = DEFAULT_LOCALE): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = y && m && d ? new Date(y, m - 1, d) : new Date(dateStr);
  return getDateFormatter(locale).format(date);
}

/**
 * Bugünün yerel tarihi (YYYY-MM-DD).
 * toISOString() UTC verir: İstanbul'da 00:00-03:00 arası DÜNÜN tarihini döndürüyordu.
 * Bu değer hem tarih seçicinin varsayılanı hem de fxSnapshot damgasının "bugün mü"
 * karşılaştırması olduğu için işlemler yanlış güne yazılıyordu.
 */
export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
