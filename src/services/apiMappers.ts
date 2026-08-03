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
 * Truncgil ölçek düzeltmesi. v4 JPY'yi 1/100 ölçekte kote ediyordu; v3'te JPY
 * DOĞRU ölçekte geliyor (1 yen ~0,30 TL), bu yüzden artık düzeltme YOK. Tablo
 * boş bırakıldı (ileride bir birim yine yanlış ölçeğe kayarsa buraya eklenir).
 * NOT: api/rates.ts'te aynı tablo var (proxy yolu için) - birlikte güncellenmeli.
 */
export const TRUNCGIL_SCALE: Record<string, number> = {};

/**
 * RAW Truncgil v3 altın anahtarları. Proxy yanıtı iç anahtarları (config.truncgilKey:
 * 'GRA', 'YIA'...) kullanır; ham v3 ise tireli adlar ('gram-altin', '22-ayar-bilezik').
 * Döviz kodları iki tarafta da aynı (USD=USD), bu yüzden sadece altın eşlenir.
 * NOT: api/rates.ts'te aynı eşleme var (ters yönde) - birlikte güncellenmeli.
 */
const TRUNCGIL_V3_GOLD: Partial<Record<AssetType, string>> = {
  GRAM_ALTIN: 'gram-altin',
  CEYREK_ALTIN: 'ceyrek-altin',
  YARIM_ALTIN: 'yarim-altin',
  TAM_ALTIN: 'tam-altin',
  CUMHURIYET_ALTINI: 'cumhuriyet-altini',
  ATA_ALTIN: 'ata-altin',
  AYAR14_ALTIN: '14-ayar-altin',
  AYAR22_BILEZIK: '22-ayar-bilezik',
  GUMUS: 'gumus',
};

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
    // Ham v3 altın anahtarları tireli ('gram-altin'); proxy yanıtı iç anahtar ('GRA').
    const sourceKey = isRawTruncgil ? (TRUNCGIL_V3_GOLD[assetType] ?? config.truncgilKey) : config.truncgilKey;
    const item = data[sourceKey] as Record<string, string | number> | undefined;
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
