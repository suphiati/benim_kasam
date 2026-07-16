import type { FxSnapshot } from '../types';

/**
 * Geçmiş tarihli işlemler için TRY/USD ve TRY/EUR kuru.
 *
 * Kaynak: Frankfurter (ECB referans kurları) — ücretsiz, API anahtarı yok, kotasız.
 * ECB mid kuru bizim Kapalıçarşı alış kurumuzdan ~%0,5 sapar; maliyet bazı aylar/yıllar
 * ölçeğinde değerlendiği ve ₺ hareketi %30+ olduğu için bu fark ihmal edilebilir.
 * Bugünkü işlemler zaten canlı kurdan damgalanır — burası yalnızca geçmiş içindir.
 *
 * ECB hafta sonu/tatilde yayın yapmaz; Frankfurter en yakın önceki iş gününü döner
 * (yanıttaki `date` hangi güne düştüğünü söyler). İstenen tarih altında cache'leriz.
 */

// Kanonik alan adı .dev/v1 (.app oraya yönleniyor). CORS açık — proxy gerekmiyor,
// tarayıcıdan doğrudan çağrılabilir (benim-kasam.vercel.app origin'inden doğrulandı).
const API_BASE = 'https://api.frankfurter.dev/v1';
const CACHE_KEY = 'benimkasam_fx_history';
const TIMEOUT_MS = 8000;

type FxCache = Record<string, FxSnapshot>; // 'YYYY-MM-DD' -> snapshot

function loadCache(): FxCache {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCache(cache: FxCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // kota dolu olabilir - kur cache'i kritik değil, sessizce geç
  }
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

interface FrankfurterResponse {
  date?: string;
  rates?: { TRY?: number; USD?: number };
}

/**
 * Verilen tarihteki kur damgası. Ağ/veri yoksa null döner (çağıran bugünkü kura düşer
 * ve damga yazılmaz — böylece sonraki açılışta backfill tekrar dener).
 */
export async function getFxForDate(date: string): Promise<FxSnapshot | null> {
  const cache = loadCache();
  if (cache[date]) return cache[date];

  try {
    // EUR bazlı sorgu: TRY/EUR doğrudan, TRY/USD çaprazdan.
    const res = await fetchWithTimeout(`${API_BASE}/${date}?base=EUR&symbols=TRY,USD`);
    if (!res.ok) return null;
    const json = (await res.json()) as FrankfurterResponse;

    const tryPerEur = json.rates?.TRY;
    const usdPerEur = json.rates?.USD;
    if (!tryPerEur || !usdPerEur || tryPerEur <= 0 || usdPerEur <= 0) return null;

    const snapshot: FxSnapshot = {
      EUR: tryPerEur,
      USD: tryPerEur / usdPerEur,
    };

    cache[date] = snapshot;
    saveCache(cache);
    return snapshot;
  } catch {
    return null;
  }
}
