import { Capacitor } from '@capacitor/core';
import type { LiveRate } from '../types';
import { ASSET_TYPES, ASSET_CONFIG } from '../constants/assets';
import { mapTruncgilResponse, type RatesMeta, type RatesWithMeta } from './apiMappers';

// v3: v4 (finans.truncgil.com/v4) sessizce BOŞ dönüyor ({"Update_Date":...} - fiyat yok).
// v3 tam veri veriyor (döviz + Kapalıçarşı altın, JPY doğru ölçekte). Ham v3 anahtar
// eşlemesi apiMappers.mapTruncgilResponse içinde (TRUNCGIL_V3_GOLD).
const TRUNCGIL_DIRECT = 'https://finans.truncgil.com/v3/today.json';

export interface FetchRatesResult extends RatesWithMeta {
  /**
   * true => gösterilen değerler CANLI piyasa DEĞİL. Ya piyasa kapalı (veri donmuş)
   * ya da yalnızca döviz veren yedek kaynak (exchangerate-api) yanıt verdi. Bu
   * durumda değerler kapanış öncesi son TAM anlık görüntüden gelir ve UI "piyasalar
   * kapalı - son verilere göre" uyarısını gösterir.
   */
  marketClosed: boolean;
}

const CACHE_KEY = 'benimkasam_rates_cache';
const CACHE_MAX_AGE_MS = 10 * 60 * 1000; // 10 dakika
const FETCH_TIMEOUT_MS = 8000; // asılı kalan isteği kes, yedek zincire geç

// Piyasa verisi bu yaştan eskiyse piyasa kapalı kabul edilir: Truncgil Update_Date
// piyasa kapanınca donar, dolayısıyla yaş kendiliğinden büyür.
const MARKET_STALE_MS = 45 * 60 * 1000;

/**
 * Gerçek Türk piyasası (Kapalıçarşı) kaynakları. exchangerate-api son çare olup
 * YALNIZCA döviz verir - altın/gümüş YOK. Tek başına kalırsa altın kalemleri
 * fiyatsız kalır (calculations.ts currentUnitPrice=0) ve kasa yanlışlıkla dev
 * bir "zarar" gösterir. Bu yüzden bu kaynaklar yoksa veri "canlı değil" sayılır.
 */
const REAL_MARKET_SOURCES = ['truncgil', 'genelpara'];

function hasRealMarketSource(sources: string[]): boolean {
  return sources.some((s) => REAL_MARKET_SOURCES.includes(s));
}

/**
 * Kaynak adının "gerçek" olması YETMEZ: ad, snapshot'ta altının TAMAMININ bulunduğunu
 * garanti etmez. GenelPara 14/22 ayarı vermez ama sources'a 'genelpara' yazılır;
 * Truncgil ise 9 altın/gümüş kaleminin hepsini verir. Eksik altın kalemi değerlemede
 * 0'lanacağından (calculations.ts currentUnitPrice=0 -> yanlış "büyük zarar"), bir
 * snapshot ancak TÜM altın/gümüş kalemlerini içeriyorsa "tam" sayılır: yalnızca tam
 * snapshot cache'lenir ve canlı gösterilebilir.
 */
const EXPECTED_METAL_ASSETS = ASSET_TYPES.filter(
  (t) => ASSET_CONFIG[t].category === 'gold' || ASSET_CONFIG[t].category === 'commodity',
);

function hasFullGoldCoverage(rates: LiveRate[]): boolean {
  const present = new Set(rates.map((r) => r.assetType));
  return EXPECTED_METAL_ASSETS.every((t) => present.has(t));
}

// Truncgil Update_Date ("2026-07-13 19:59:01") OFSSİZ İstanbul saatidir (UTC+3, yaz saati
// yok). Ofis eklemezsek new Date() cihaz yerel saatinde yorumlar; İstanbul dışı cihazlarda
// (UTC emülatör/CI, seyahat) yaş saatlerce kayıp 45 dk eşiğini yanlış tetikler. Header'daki
// getAgeMinutes ile aynı mantık - ikisi birlikte güncellenmeli.
function marketAgeMs(timestamp: string): number {
  const iso = timestamp.includes('T') ? timestamp : timestamp.replace(' ', 'T');
  const hasTz = /([Zz]|[+-]\d{2}:?\d{2})$/.test(iso);
  const t = new Date(hasTz ? iso : `${iso}+03:00`).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Date.now() - t);
}

/**
 * Gösterilecek veri canlı piyasa değil mi? İki durumda evet:
 *  1) Gerçek kaynak (Truncgil/GenelPara) yok - yalnızca döviz veren yedek döndü.
 *  2) Gerçek kaynak var ama verisi MARKET_STALE_MS'ten eski (piyasa kapalı, donmuş).
 */
function isMarketDataStale(meta: RatesMeta): boolean {
  if (!hasRealMarketSource(meta.sources)) return true;
  return marketAgeMs(meta.timestamp) >= MARKET_STALE_MS;
}

// Timeout'lu fetch: kaynak yanıt vermezse 8 sn sonra iptal edip yedeğe düşeriz
async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function getApiUrl(): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');
  // Native app (Capacitor): mutlak Vercel proxy URL'i gerekir (relatif /api/rates çalışmaz).
  // VITE_API_BASE_URL tanımlıysa çoklu kaynaklı proxy'yi kullan, yoksa doğrudan Truncgil'e düş.
  if (Capacitor.isNativePlatform()) {
    return base ? `${base}/api/rates` : TRUNCGIL_DIRECT;
  }
  // Web deploy: aynı origin proxy
  if (window.location.hostname !== 'localhost') {
    return base ? `${base}/api/rates` : '/api/rates';
  }
  // Localhost geliştirme: doğrudan Truncgil
  return TRUNCGIL_DIRECT;
}

// LocalStorage'a cache'le (offline fallback). YALNIZCA TAM anlık görüntüler (gerçek
// piyasa kaynağı içeren) cache'lenir - degraded döviz-yalnız yanıt cache'i EZMEZ,
// yoksa "kapanış öncesi son veri" kaybolurdu. Bkz. fetchLiveRates.
function cacheRates(result: RatesWithMeta): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      rates: result.rates,
      meta: result.meta,
      cachedAt: Date.now(),
    }));
  } catch { /* ignore */ }
}

function getCachedRates(): RatesWithMeta | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.rates?.length) return null;
    // 10 dakikadan eski cache'i kullanma (çok zorunlu değilse)
    if (Date.now() - cached.cachedAt > CACHE_MAX_AGE_MS) return null;
    return { rates: cached.rates, meta: { ...cached.meta, sources: [...cached.meta.sources, 'cache'] } };
  } catch {
    return null;
  }
}

// Yaşa bakmadan son cache. Orijinal kaynak adları KORUNUR ('stale-cache' eklenir):
// böylece snapshot Truncgil'den geliyorsa hasRealMarketSource yine true kalır ve
// (degraded döviz-yalnız yedeğin aksine) altın fiyatları burada MEVCUTtur.
function getStaleCache(): RatesWithMeta | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.rates?.length) return null;
    return { rates: cached.rates, meta: { ...cached.meta, sources: [...cached.meta.sources, 'stale-cache'] } };
  } catch {
    return null;
  }
}

async function fetchFromProxy(): Promise<RatesWithMeta> {
  const url = getApiUrl();
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return mapTruncgilResponse(data);
}

// Truncgil bazen kırpılmış JSON döndürüyor - toleranslı parse (api/rates.ts ile aynı mantık)
function safeJsonParse(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const lastBrace = text.lastIndexOf('}');
    if (lastBrace > 0) {
      let truncated = text.substring(0, lastBrace + 1);
      const openBraces = (truncated.match(/\{/g) || []).length;
      const closeBraces = (truncated.match(/\}/g) || []).length;
      for (let i = 0; i < openBraces - closeBraces; i++) {
        truncated += '}';
      }
      return JSON.parse(truncated) as Record<string, unknown>;
    }
    throw new Error('JSON tamamen geçersiz');
  }
}

async function fetchDirectTruncgil(): Promise<RatesWithMeta> {
  const res = await fetchWithTimeout(TRUNCGIL_DIRECT);
  if (!res.ok) throw new Error('Direct Truncgil failed');
  const text = await res.text();
  const data = safeJsonParse(text);
  return mapTruncgilResponse(data);
}

export async function fetchLiveRates(): Promise<FetchRatesResult> {
  /**
   * Taze bir sonucu değerlendirir:
   *  - TAM ise (gerçek kaynak + TÜM altın/gümüş kalemleri): cache'ler, canlılığı yaşa göre işaretler.
   *  - EKSİK ise (yalnızca döviz veren yedek YA DA altın kalemleri eksik gerçek kaynak,
   *    ör. GenelPara 14/22 ayarı vermez): bu veriyle devam edersek eksik altın 0'lanır ->
   *    yanlış "büyük zarar". Kapanış öncesi son TAM snapshot'ı tercih et (altın orada
   *    mevcut), degraded'ı CACHE'LEME (iyi snapshot'ı ezmesin). İyi snapshot da yoksa null
   *    döndür: çağıran sıradaki yönteme (doğrudan Truncgil / cache / "kur alınamadı") düşer.
   *    Eksik veriyi asla "canlı/son veri" gibi göstermeyiz.
   */
  const preferComplete = (fresh: RatesWithMeta): FetchRatesResult | null => {
    if (fresh.rates.length === 0) return null;
    if (hasRealMarketSource(fresh.meta.sources) && hasFullGoldCoverage(fresh.rates)) {
      cacheRates(fresh);
      return { ...fresh, marketClosed: isMarketDataStale(fresh.meta) };
    }
    const lastGood = getStaleCache();
    if (lastGood && hasRealMarketSource(lastGood.meta.sources) && hasFullGoldCoverage(lastGood.rates)) {
      return { ...lastGood, marketClosed: true };
    }
    return null;
  };

  // 1. Proxy'den dene (çoklu kaynak backend)
  try {
    const out = preferComplete(await fetchFromProxy());
    if (out) return out;
  } catch (err) {
    console.warn('Proxy fetch failed:', err);
  }

  // 2. Doğrudan Truncgil dene (tam veri kaynağı)
  try {
    const out = preferComplete(await fetchDirectTruncgil());
    if (out) return out;
  } catch (err) {
    console.warn('Direct Truncgil failed:', err);
  }

  // 3. Taze cache varsa kullan (canlı fetch başarısız - veri en fazla 10 dk eski).
  // Cache yalnızca TAM snapshot tutar (preferComplete öyle yazar), altın burada mevcut.
  const cached = getCachedRates();
  if (cached && cached.rates.length > 0) {
    console.info('Using cached rates');
    return { ...cached, marketClosed: isMarketDataStale(cached.meta) };
  }

  // 4. Eski cache bile varsa kullan (offline durumu)
  const stale = getStaleCache();
  if (stale && stale.rates.length > 0) {
    console.info('Using stale cached rates');
    return { ...stale, marketClosed: isMarketDataStale(stale.meta) };
  }

  // 5. Hiçbir şey çalışmadı
  return {
    rates: [],
    meta: { sources: ['none'], timestamp: new Date().toISOString(), fetchedAt: new Date().toISOString() },
    marketClosed: false,
  };
}
