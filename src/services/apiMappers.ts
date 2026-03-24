import type { LiveRate, AssetType } from '../types';
import { ASSET_CONFIG, ASSET_TYPES } from '../constants/assets';

function parsePrice(val: string | number): number {
  if (typeof val === 'number') return val;
  return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
}

export interface RatesMeta {
  sources: string[];
  timestamp: string;
  fetchedAt: string;
}

export interface RatesWithMeta {
  rates: LiveRate[];
  meta: RatesMeta;
}

export function mapTruncgilResponse(data: Record<string, unknown>): RatesWithMeta {
  const rates: LiveRate[] = [];
  const meta: RatesMeta = (data._meta as RatesMeta) || {
    sources: ['truncgil'],
    timestamp: (data.Update_Date as string) || new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
  };

  for (const assetType of ASSET_TYPES) {
    const config = ASSET_CONFIG[assetType];
    const item = data[config.truncgilKey] as Record<string, string | number> | undefined;
    if (item) {
      const buyPrice = parsePrice(item['Buying'] || '0');
      const sellPrice = parsePrice(item['Selling'] || '0');

      // Fiyat doğrulama: 0/negatif ve ters spread kontrolü
      if (buyPrice > 0 && sellPrice > 0 && sellPrice >= buyPrice) {
        rates.push({
          assetType: assetType as AssetType,
          buyPrice,
          sellPrice,
        });
      }
    }
  }
  return { rates, meta };
}
