import type { LiveRate, AssetType } from '../types';
import { ASSET_CONFIG, ASSET_TYPES } from '../constants/assets';

function parsePrice(val: string | number): number {
  if (typeof val === 'number') return val;
  // Virgül varsa Türkçe format (1.234,56), yoksa standart format (1234.56)
  if (val.includes(',')) {
    return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
  }
  return parseFloat(val) || 0;
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

/**
 * Truncgil ölçek düzeltmesi: JPY'yi 1/100 ölçekte kote ediyor (Buying 0.002899
 * diyor ama 1 yen ~0.29 TL). ECB ile çapraz doğrulandı: oran 100.07; diğer tüm
 * para birimleri 1.00, yani sorun yalnızca JPY'de.
 * NOT: api/rates.ts'te aynı tablo var (proxy yolu için) - birlikte güncellenmeli.
 */
export const TRUNCGIL_SCALE: Record<string, number> = { JPY: 100 };

export function mapTruncgilResponse(data: Record<string, unknown>): RatesWithMeta {
  const rates: LiveRate[] = [];
  const proxyMeta = data._meta as RatesMeta | undefined;

  /**
   * Ölçek düzeltmesi VERİDEN anlaşılır, çağırandan değil: proxy yanıtı `_meta`
   * taşır ve api/rates.ts orada zaten kaynak sınırında normalize etmiştir
   * (üstelik JPY oradan ExchangeRate yedeğiyle de gelebilir - o doğru ölçekte;
   * tekrar çarpmak 100 kat BÜYÜK yapardı). `_meta` yoksa elimizdeki HAM Truncgil'dir.
   *
   * Bayrağı çağırana bırakmak kırılgandı: getApiUrl() localhost'ta ve
   * VITE_API_BASE_URL'siz native'de TRUNCGIL_DIRECT döndürüyor, yani
   * "proxy" yolu da ham Truncgil servis edebiliyor.
   */
  const isRawTruncgil = !proxyMeta;

  const meta: RatesMeta = proxyMeta || {
    sources: ['truncgil'],
    timestamp: (data.Update_Date as string) || new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
  };

  for (const assetType of ASSET_TYPES) {
    const config = ASSET_CONFIG[assetType];
    const item = data[config.truncgilKey] as Record<string, string | number> | undefined;
    if (item) {
      const scale = isRawTruncgil ? (TRUNCGIL_SCALE[config.truncgilKey] ?? 1) : 1;
      const buyPrice = parsePrice(item['Buying'] || '0') * scale;
      const sellPrice = parsePrice(item['Selling'] || '0') * scale;

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
