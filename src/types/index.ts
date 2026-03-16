export type AssetType =
  | 'USD' | 'EUR' | 'GBP' | 'CHF' | 'CAD' | 'AUD' | 'JPY' | 'SAR' | 'AED' | 'RUB' | 'CNY'
  | 'GRAM_ALTIN' | 'CEYREK_ALTIN' | 'YARIM_ALTIN' | 'TAM_ALTIN'
  | 'CUMHURIYET_ALTINI' | 'ATA_ALTIN' | 'RESAT_ALTIN'
  | 'GUMUS';

export type TransactionType = 'buy' | 'sell';

export interface Transaction {
  id: string;
  type: TransactionType;
  assetType: AssetType;
  date: string;
  amount: number;
  unitPrice: number;
  totalCost: number;
  note?: string;
  createdAt: string;
}

export interface LiveRate {
  assetType: AssetType;
  buyPrice: number;
  sellPrice: number;
}

export interface AssetSummary {
  assetType: AssetType;
  totalAmount: number;
  totalBought: number;
  totalSold: number;
  totalCost: number;
  totalSellRevenue: number;
  realizedPL: number;
  avgUnitPrice: number;
  currentUnitPrice: number;
  currentValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  totalPL: number;
  buyCount: number;
  sellCount: number;
}
