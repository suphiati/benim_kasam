import type { AssetType } from '../types';

export interface AssetConfig {
  label: string;
  icon: string;
  unit: string;
  color: string;
  truncgilKey: string;
  category: 'currency' | 'gold' | 'commodity';
}

export const ASSET_CONFIG: Record<AssetType, AssetConfig> = {
  // Dövizler
  USD: {
    label: 'Amerikan Doları',
    icon: 'DollarSign',
    unit: '$',
    color: '#16a34a',
    truncgilKey: 'USD',
    category: 'currency',
  },
  EUR: {
    label: 'Euro',
    icon: 'Euro',
    unit: '€',
    color: '#2563eb',
    truncgilKey: 'EUR',
    category: 'currency',
  },
  GBP: {
    label: 'İngiliz Sterlini',
    icon: 'PoundSterling',
    unit: '£',
    color: '#7c3aed',
    truncgilKey: 'GBP',
    category: 'currency',
  },
  CHF: {
    label: 'İsviçre Frangı',
    icon: 'Banknote',
    unit: 'CHF',
    color: '#dc2626',
    truncgilKey: 'CHF',
    category: 'currency',
  },
  CAD: {
    label: 'Kanada Doları',
    icon: 'DollarSign',
    unit: 'C$',
    color: '#ea580c',
    truncgilKey: 'CAD',
    category: 'currency',
  },
  AUD: {
    label: 'Avustralya Doları',
    icon: 'DollarSign',
    unit: 'A$',
    color: '#0891b2',
    truncgilKey: 'AUD',
    category: 'currency',
  },
  JPY: {
    label: 'Japon Yeni',
    icon: 'JapaneseYen',
    unit: '¥',
    color: '#e11d48',
    truncgilKey: 'JPY',
    category: 'currency',
  },
  SAR: {
    label: 'Suudi Riyali',
    icon: 'Banknote',
    unit: 'SAR',
    color: '#059669',
    truncgilKey: 'SAR',
    category: 'currency',
  },
  AED: {
    label: 'BAE Dirhemi',
    icon: 'Banknote',
    unit: 'AED',
    color: '#0284c7',
    truncgilKey: 'AED',
    category: 'currency',
  },
  RUB: {
    label: 'Rus Rublesi',
    icon: 'Banknote',
    unit: '₽',
    color: '#4338ca',
    truncgilKey: 'RUB',
    category: 'currency',
  },
  CNY: {
    label: 'Çin Yuanı',
    icon: 'Banknote',
    unit: '¥',
    color: '#be123c',
    truncgilKey: 'CNY',
    category: 'currency',
  },
  // Altınlar
  GRAM_ALTIN: {
    label: 'Gram Altın',
    icon: 'Coins',
    unit: 'gr',
    color: '#d4a017',
    truncgilKey: 'GRA',
    category: 'gold',
  },
  CEYREK_ALTIN: {
    label: 'Çeyrek Altın',
    icon: 'CircleDot',
    unit: 'adet',
    color: '#e6b422',
    truncgilKey: 'CEYREKALTIN',
    category: 'gold',
  },
  YARIM_ALTIN: {
    label: 'Yarım Altın',
    icon: 'Circle',
    unit: 'adet',
    color: '#f0c94d',
    truncgilKey: 'YARIMALTIN',
    category: 'gold',
  },
  TAM_ALTIN: {
    label: 'Tam Altın',
    icon: 'Disc',
    unit: 'adet',
    color: '#b8860b',
    truncgilKey: 'TAMALTIN',
    category: 'gold',
  },
  CUMHURIYET_ALTINI: {
    label: 'Cumhuriyet Altını',
    icon: 'Medal',
    unit: 'adet',
    color: '#ca8a04',
    truncgilKey: 'CUMHURIYETALTINI',
    category: 'gold',
  },
  ATA_ALTIN: {
    label: 'Ata Altın',
    icon: 'Medal',
    unit: 'adet',
    color: '#a16207',
    truncgilKey: 'ATAALTIN',
    category: 'gold',
  },
  RESAT_ALTIN: {
    label: 'Reşat Altın',
    icon: 'Medal',
    unit: 'adet',
    color: '#92400e',
    truncgilKey: 'RESATALTIN',
    category: 'gold',
  },
  // Değerli Maden
  GUMUS: {
    label: 'Gümüş',
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
  // Altınlar
  'GRAM_ALTIN', 'CEYREK_ALTIN', 'YARIM_ALTIN', 'TAM_ALTIN', 'CUMHURIYET_ALTINI', 'ATA_ALTIN', 'RESAT_ALTIN',
  // Değerli Maden
  'GUMUS',
];
