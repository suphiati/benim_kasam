import type { AssetType } from '../types';

export interface AssetConfig {
  label: string;
  icon: string;
  unit: string;
  color: string;
  truncgilKey: string;
}

export const ASSET_CONFIG: Record<AssetType, AssetConfig> = {
  USD: {
    label: 'Amerikan Doları',
    icon: 'DollarSign',
    unit: '$',
    color: '#16a34a',
    truncgilKey: 'Dolar',
  },
  EUR: {
    label: 'Euro',
    icon: 'Euro',
    unit: '€',
    color: '#2563eb',
    truncgilKey: 'Euro',
  },
  GRAM_ALTIN: {
    label: 'Gram Altın',
    icon: 'Coins',
    unit: 'gr',
    color: '#d4a017',
    truncgilKey: 'Gram Altın',
  },
  CEYREK_ALTIN: {
    label: 'Çeyrek Altın',
    icon: 'CircleDot',
    unit: 'adet',
    color: '#e6b422',
    truncgilKey: 'Çeyrek Altın',
  },
  YARIM_ALTIN: {
    label: 'Yarım Altın',
    icon: 'Circle',
    unit: 'adet',
    color: '#f0c94d',
    truncgilKey: 'Yarım Altın',
  },
  TAM_ALTIN: {
    label: 'Tam Altın',
    icon: 'Disc',
    unit: 'adet',
    color: '#b8860b',
    truncgilKey: 'Tam Altın',
  },
};

export const ASSET_TYPES: AssetType[] = ['USD', 'EUR', 'GRAM_ALTIN', 'CEYREK_ALTIN', 'YARIM_ALTIN', 'TAM_ALTIN'];
