import type { LiveRate, AssetType } from '../types';

const TRUNCGIL_KEY_MAP: Record<string, AssetType> = {
  'Dolar': 'USD',
  'Euro': 'EUR',
  'Gram Altın': 'GRAM_ALTIN',
  'Çeyrek Altın': 'CEYREK_ALTIN',
  'Yarım Altın': 'YARIM_ALTIN',
  'Tam Altın': 'TAM_ALTIN',
};

function parsePrice(val: string | number): number {
  if (typeof val === 'number') return val;
  return parseFloat(val.replace('.', '').replace(',', '.')) || 0;
}

export function mapTruncgilResponse(data: Record<string, Record<string, string>>): LiveRate[] {
  const rates: LiveRate[] = [];
  for (const [key, assetType] of Object.entries(TRUNCGIL_KEY_MAP)) {
    const item = data[key];
    if (item) {
      rates.push({
        assetType,
        buyPrice: parsePrice(item['Alış'] || item['alis'] || '0'),
        sellPrice: parsePrice(item['Satış'] || item['satis'] || '0'),
      });
    }
  }
  return rates;
}
