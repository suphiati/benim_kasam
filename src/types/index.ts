export type AssetType =
  | 'USD' | 'EUR' | 'GBP' | 'CHF' | 'CAD' | 'AUD' | 'JPY' | 'SAR' | 'AED' | 'RUB' | 'CNY'
  | 'NOK' | 'SEK' | 'KWD' | 'BGN' | 'GEL'
  | 'GRAM_ALTIN' | 'CEYREK_ALTIN' | 'YARIM_ALTIN' | 'TAM_ALTIN'
  | 'CUMHURIYET_ALTINI' | 'ATA_ALTIN' | 'AYAR14_ALTIN' | 'AYAR22_BILEZIK'
  | 'GUMUS';

export type TransactionType = 'buy' | 'sell';

/** Kasanın raporlanacağı para birimi. Fiyatlar kaynakta hep TRY; bu yalnızca sunum katmanı. */
export type BaseCurrency = 'TRY' | 'USD' | 'EUR';

/**
 * İşlemin TARİHİNDEKİ kur damgası: 1 birim yabancı para kaç TRY idi.
 * Maliyet bazını doğru çevirmek için şart — bugünkü kurla çevirmek K/Z'yi bozar
 * (₺ enflasyonu geçmiş maliyeti olduğundan ucuz gösterir).
 * Yokluğu "henüz çözülmedi" demektir: bugünkü kura düşülür ve sonra backfill denenir.
 */
export interface FxSnapshot {
  USD: number;
  EUR: number;
}

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
  fxSnapshot?: FxSnapshot;
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
