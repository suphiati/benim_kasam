import { Capacitor } from '@capacitor/core';
import type { LiveRate } from '../types';
import { mapTruncgilResponse, type RatesMeta } from './apiMappers';

const TRUNCGIL_DIRECT = 'https://finans.truncgil.com/v4/today.json';

export interface FetchRatesResult {
  rates: LiveRate[];
  meta: RatesMeta;
}

const CACHE_KEY = 'benimkasam_rates_cache';
const CACHE_MAX_AGE_MS = 10 * 60 * 1000; // 10 dakika
const FETCH_TIMEOUT_MS = 8000; // asılı kalan isteği kes, yedek zincire geç

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

// LocalStorage'a cache'le (offline fallback)
function cacheRates(result: FetchRatesResult): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      ...result,
      cachedAt: Date.now(),
    }));
  } catch { /* ignore */ }
}

function getCachedRates(): FetchRatesResult | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    // 10 dakikadan eski cache'i kullanma (çok zorunlu değilse)
    if (Date.now() - cached.cachedAt > CACHE_MAX_AGE_MS) return null;
    return { rates: cached.rates, meta: { ...cached.meta, sources: [...cached.meta.sources, 'cache'] } };
  } catch {
    return null;
  }
}

function getStaleCache(): FetchRatesResult | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    return { rates: cached.rates, meta: { ...cached.meta, sources: ['stale-cache'] } };
  } catch {
    return null;
  }
}

async function fetchFromProxy(): Promise<FetchRatesResult> {
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

async function fetchDirectTruncgil(): Promise<FetchRatesResult> {
  const res = await fetchWithTimeout(TRUNCGIL_DIRECT);
  if (!res.ok) throw new Error('Direct Truncgil failed');
  const text = await res.text();
  const data = safeJsonParse(text);
  return mapTruncgilResponse(data);
}

export async function fetchLiveRates(): Promise<FetchRatesResult> {
  // 1. Proxy'den dene (çoklu kaynak backend)
  try {
    const result = await fetchFromProxy();
    if (result.rates.length > 0) {
      cacheRates(result);
      return result;
    }
  } catch (err) {
    console.warn('Proxy fetch failed:', err);
  }

  // 2. Doğrudan Truncgil dene
  try {
    const result = await fetchDirectTruncgil();
    if (result.rates.length > 0) {
      cacheRates(result);
      return result;
    }
  } catch (err) {
    console.warn('Direct Truncgil failed:', err);
  }

  // 3. Taze cache varsa kullan
  const cached = getCachedRates();
  if (cached && cached.rates.length > 0) {
    console.info('Using cached rates');
    return cached;
  }

  // 4. Eski cache bile varsa kullan (offline durumu)
  const stale = getStaleCache();
  if (stale && stale.rates.length > 0) {
    console.info('Using stale cached rates');
    return stale;
  }

  // 5. Hiçbir şey çalışmadı
  return {
    rates: [],
    meta: { sources: ['none'], timestamp: new Date().toISOString(), fetchedAt: new Date().toISOString() },
  };
}
