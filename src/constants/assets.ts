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
  NOK: {
    label: 'Norveç Kronu',
    icon: 'Banknote',
    unit: 'kr',
    color: '#0ea5e9',
    truncgilKey: 'NOK',
    category: 'currency',
  },
  SEK: {
    label: 'İsveç Kronu',
    icon: 'Banknote',
    unit: 'kr',
    color: '#3b82f6',
    truncgilKey: 'SEK',
    category: 'currency',
  },
  KWD: {
    label: 'Kuveyt Dinarı',
    icon: 'Banknote',
    unit: 'KD',
    color: '#059669',
    truncgilKey: 'KWD',
    category: 'currency',
  },
  BGN: {
    label: 'Bulgar Levası',
    icon: 'Banknote',
    unit: 'лв',
    color: '#8b5cf6',
    truncgilKey: 'BGN',
    category: 'currency',
  },
  GEL: {
    label: 'Gürcistan Larisi',
    icon: 'Banknote',
    unit: '₾',
    color: '#ef4444',
    truncgilKey: 'GEL',
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
  AYAR14_ALTIN: {
    label: '14 Ayar Altın',
    icon: 'Coins',
    unit: 'gr',
    color: '#c2872a',
    truncgilKey: '14AYARALTIN',
    category: 'gold',
  },
  AYAR22_BILEZIK: {
    label: '22 Ayar Bilezik',
    icon: 'CircleDot',
    unit: 'gr',
    color: '#dba43a',
    truncgilKey: 'YIA',
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
  'NOK', 'SEK', 'KWD', 'BGN', 'GEL',
  // Altınlar
  'GRAM_ALTIN', 'CEYREK_ALTIN', 'YARIM_ALTIN', 'TAM_ALTIN', 'CUMHURIYET_ALTINI', 'ATA_ALTIN', 'AYAR14_ALTIN', 'AYAR22_BILEZIK',
  // Değerli Maden
  'GUMUS',
];
