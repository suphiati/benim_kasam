import type { AssetType } from '../types';
import type { TKey } from '../i18n';

/** Sözlükteki `unit.*` anahtarları. tr.ts'ten türer - elle listelenmez. */
export type UnitKey = Extract<TKey, `unit.${string}`>;
/** Sözlükteki `asset.*` anahtarları. tr.ts'ten türer - elle listelenmez. */
export type AssetLabelKey = Extract<TKey, `asset.${string}`>;

export interface AssetConfig {
  icon: string;
  /**
   * ROZET kaynağı - ekranda birim olarak GÖSTERİLMEZ, çevrilmez.
   * AssetTypePicker ve TransactionCard rozeti bundan türetiyor
   * (ICON_MAP / kategori / ilk 2 harf). Çevirirsen rozet bozulur:
   * 'adet' -> 'pcs' rozeti "ad" -> "pc" yapardı. Görünen birim `unitKey`.
   */
  unit: string;
  /**
   * Ekranda görünen birim (çeviri anahtarı). Yoksa `unit` aynen basılır:
   * para sembolleri ve 'gr' evrensel, çevrilmez. Bkz. assetUnit().
   */
  unitKey?: UnitKey;
  color: string;
  /** API sözleşmesi (Truncgil alan adı) - dile göre DEĞİŞMEZ. */
  truncgilKey: string;
  category: 'currency' | 'gold' | 'commodity';
}

/**
 * Varlık adının çeviri anahtarı. Dönüş tipi tr.ts'ten türediği için bir
 * AssetType'ın `asset.*` karşılığı eksikse burada DERLEME hatası alınır.
 */
export const assetLabelKey = (type: AssetType): AssetLabelKey => `asset.${type}`;

/** Ekranda görünen birim. `t`yi dışarıdan alır - bu modül hook bilmez. */
export function assetUnit(type: AssetType, t: (key: TKey) => string): string {
  const { unit, unitKey } = ASSET_CONFIG[type];
  return unitKey ? t(unitKey) : unit;
}

export const ASSET_CONFIG: Record<AssetType, AssetConfig> = {
  // Dövizler
  USD: {
    icon: 'DollarSign',
    unit: '$',
    color: '#16a34a',
    truncgilKey: 'USD',
    category: 'currency',
  },
  EUR: {
    icon: 'Euro',
    unit: '€',
    color: '#2563eb',
    truncgilKey: 'EUR',
    category: 'currency',
  },
  GBP: {
    icon: 'PoundSterling',
    unit: '£',
    color: '#7c3aed',
    truncgilKey: 'GBP',
    category: 'currency',
  },
  CHF: {
    icon: 'Banknote',
    unit: 'CHF',
    color: '#dc2626',
    truncgilKey: 'CHF',
    category: 'currency',
  },
  CAD: {
    icon: 'DollarSign',
    unit: 'C$',
    color: '#ea580c',
    truncgilKey: 'CAD',
    category: 'currency',
  },
  AUD: {
    icon: 'DollarSign',
    unit: 'A$',
    color: '#0891b2',
    truncgilKey: 'AUD',
    category: 'currency',
  },
  JPY: {
    icon: 'JapaneseYen',
    unit: '¥',
    color: '#e11d48',
    truncgilKey: 'JPY',
    category: 'currency',
  },
  SAR: {
    icon: 'Banknote',
    unit: 'SAR',
    color: '#059669',
    truncgilKey: 'SAR',
    category: 'currency',
  },
  AED: {
    icon: 'Banknote',
    unit: 'AED',
    color: '#0284c7',
    truncgilKey: 'AED',
    category: 'currency',
  },
  RUB: {
    icon: 'Banknote',
    unit: '₽',
    color: '#4338ca',
    truncgilKey: 'RUB',
    category: 'currency',
  },
  CNY: {
    icon: 'Banknote',
    unit: '¥',
    color: '#be123c',
    truncgilKey: 'CNY',
    category: 'currency',
  },
  NOK: {
    icon: 'Banknote',
    unit: 'kr',
    color: '#0ea5e9',
    truncgilKey: 'NOK',
    category: 'currency',
  },
  SEK: {
    icon: 'Banknote',
    unit: 'kr',
    color: '#3b82f6',
    truncgilKey: 'SEK',
    category: 'currency',
  },
  KWD: {
    icon: 'Banknote',
    unit: 'KD',
    color: '#059669',
    truncgilKey: 'KWD',
    category: 'currency',
  },
  BGN: {
    icon: 'Banknote',
    unit: 'лв',
    color: '#8b5cf6',
    truncgilKey: 'BGN',
    category: 'currency',
  },
  GEL: {
    icon: 'Banknote',
    unit: '₾',
    color: '#ef4444',
    truncgilKey: 'GEL',
    category: 'currency',
  },
  // Altınlar
  GRAM_ALTIN: {
    icon: 'Coins',
    unit: 'gr',
    color: '#d4a017',
    truncgilKey: 'GRA',
    category: 'gold',
  },
  CEYREK_ALTIN: {
    icon: 'CircleDot',
    unit: 'adet',
    unitKey: 'unit.pcs',
    color: '#e6b422',
    truncgilKey: 'CEYREKALTIN',
    category: 'gold',
  },
  YARIM_ALTIN: {
    icon: 'Circle',
    unit: 'adet',
    unitKey: 'unit.pcs',
    color: '#f0c94d',
    truncgilKey: 'YARIMALTIN',
    category: 'gold',
  },
  TAM_ALTIN: {
    icon: 'Disc',
    unit: 'adet',
    unitKey: 'unit.pcs',
    color: '#b8860b',
    truncgilKey: 'TAMALTIN',
    category: 'gold',
  },
  CUMHURIYET_ALTINI: {
    icon: 'Medal',
    unit: 'adet',
    unitKey: 'unit.pcs',
    color: '#ca8a04',
    truncgilKey: 'CUMHURIYETALTINI',
    category: 'gold',
  },
  ATA_ALTIN: {
    icon: 'Medal',
    unit: 'adet',
    unitKey: 'unit.pcs',
    color: '#a16207',
    truncgilKey: 'ATAALTIN',
    category: 'gold',
  },
  AYAR14_ALTIN: {
    icon: 'Coins',
    unit: 'gr',
    color: '#c2872a',
    truncgilKey: '14AYARALTIN',
    category: 'gold',
  },
  AYAR22_BILEZIK: {
    icon: 'CircleDot',
    unit: 'gr',
    color: '#dba43a',
    truncgilKey: 'YIA',
    category: 'gold',
  },
  // Değerli Maden
  GUMUS: {
    icon: 'Gem',
    unit: 'gr',
    color: '#9ca3af',
    truncgilKey: 'GUMUS',
    category: 'commodity',
  },
};

export const ASSET_TYPES: AssetType[] = [
  // Dövizler
  'USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'SAR', 'AED', 'RUB', 'CNY',
  'NOK', 'SEK', 'KWD', 'BGN', 'GEL',
  // Altınlar
  'GRAM_ALTIN', 'CEYREK_ALTIN', 'YARIM_ALTIN', 'TAM_ALTIN', 'CUMHURIYET_ALTINI', 'ATA_ALTIN', 'AYAR14_ALTIN', 'AYAR22_BILEZIK',
  // Değerli Maden
  'GUMUS',
];
