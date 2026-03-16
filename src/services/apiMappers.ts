import type { LiveRate, AssetType } from '../types';
import { ASSET_CONFIG, ASSET_TYPES } from '../constants/assets';

function parsePrice(val: string | number): number {
  if (typeof val === 'number') return val;
  return parseFloat(val.replace('.', '').replace(',', '.')) || 0;
}

export function mapTruncgilResponse(data: Record<string, Record<string, string | number>>): LiveRate[] {
  const rates: LiveRate[] = [];
  for (const assetType of ASSET_TYPES) {
    const config = ASSET_CONFIG[assetType];
    const item = data[config.truncgilKey];
    if (item) {
      rates.push({
        assetType: assetType as AssetType,
        buyPrice: parsePrice(item['Buying'] || '0'),
        sellPrice: parsePrice(item['Selling'] || '0'),
      });
    }
  }
  return rates;
}
