export type AssetType = 'USD' | 'EUR' | 'GRAM_ALTIN' | 'CEYREK_ALTIN' | 'YARIM_ALTIN' | 'TAM_ALTIN';

export interface Transaction {
  id: string;
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
  totalCost: number;
  avgUnitPrice: number;
  currentUnitPrice: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
}
