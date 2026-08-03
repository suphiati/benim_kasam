import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RateItem {
  Buying: number;
  Selling: number;
  Type?: string;
}

// ============================================================
// YARDIMCI FONKSİYONLAR
// ============================================================

function parseNum(val: string | number): number {
  if (typeof val === 'number') return val;
  // Virgül varsa Türkçe format (1.234,56), yoksa standart (1234.56)
  if (val.includes(',')) {
    return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
  }
  return parseFloat(val) || 0;
}

function validRate(buy: number, sell: number): boolean {
  return buy > 0 && sell > 0 && sell >= buy;
}

// Toleranslı JSON parse (Truncgil bazen kesilmiş JSON döndürüyor)
function safeJsonParse(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text);
  } catch {
    const lastBrace = text.lastIndexOf('}');
    if (lastBrace > 0) {
      let truncated = text.substring(0, lastBrace + 1);
      const openBraces = (truncated.match(/\{/g) || []).length;
      const closeBraces = (truncated.match(/\}/g) || []).length;
      for (let i = 0; i < openBraces - closeBraces; i++) {
        truncated += '}';
      }
      return JSON.parse(truncated);
    }
    throw new Error('JSON completely invalid');
  }
}

/**
 * Truncgil ölçek düzeltmesi. v4 JPY'yi 1/100 ölçekte kote ediyordu; v3'te JPY
 * DOĞRU ölçekte (1 yen ~0,30 TL) geldiği için artık düzeltme YOK. Tablo boş -
 * ileride bir birim yanlış ölçeğe kayarsa buraya iç anahtarıyla eklenir.
 * NOT: src/services/apiMappers.ts'te aynı tablo var - birlikte güncellenmeli.
 */
const TRUNCGIL_SCALE: Record<string, number> = {};

// Döviz kodları v3'te de aynı (USD, EUR...): kaynak anahtarı == iç anahtar.
const CURRENCY_KEYS = ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'SAR', 'AED', 'RUB', 'CNY', 'NOK', 'SEK', 'KWD', 'BGN', 'GEL'];

/**
 * v3 altın: KAYNAK anahtarı (tireli, 'gram-altin') -> İÇ anahtar (çıktı, apiMappers'ın
 * config.truncgilKey'i ile eşleşir: 'GRA'). v4 (finans.truncgil.com/v4) sessizce BOŞ
 * dönüyordu; v3 tam Kapalıçarşı altınını veriyor. NOT: apiMappers.ts'te ters yönlü
 * eşleme (TRUNCGIL_V3_GOLD) var - birlikte güncellenmeli.
 */
const TRUNCGIL_V3_GOLD: Record<string, string> = {
  'gram-altin': 'GRA',
  'ceyrek-altin': 'CEYREKALTIN',
  'yarim-altin': 'YARIMALTIN',
  'tam-altin': 'TAMALTIN',
  'cumhuriyet-altini': 'CUMHURIYETALTINI',
  'ata-altin': 'ATAALTIN',
  '14-ayar-altin': '14AYARALTIN',
  '22-ayar-bilezik': 'YIA',
  'gumus': 'GUMUS',
};

// Tam snapshot için beklenen altın/gümüş iç anahtarları (tamlık kapısı kullanır).
const EXPECTED_METAL_KEYS = Object.values(TRUNCGIL_V3_GOLD);

// ============================================================
// KAYNAK 1 (BİRİNCİL): Truncgil API - Altın + Döviz + Gümüş
// ============================================================
async function fetchTruncgil(): Promise<{ data: Record<string, unknown>; timestamp: string }> {
  const res = await fetch('https://finans.truncgil.com/v3/today.json', {
    headers: { 'User-Agent': 'BenimKasam/1.0' },
  });
  if (!res.ok) throw new Error(`Truncgil HTTP ${res.status}`);
  const text = await res.text();
  const data = safeJsonParse(text);
  return { data, timestamp: (data.Update_Date as string) || new Date().toISOString() };
}

function extractTruncgil(data: Record<string, unknown>): Record<string, RateItem> {
  const rates: Record<string, RateItem> = {};
  // Döviz: kaynak==iç anahtar. Altın: tireli kaynak -> iç anahtar (v3 eşlemesi).
  const pairs: Array<[string, string]> = [
    ...CURRENCY_KEYS.map((k) => [k, k] as [string, string]),
    ...Object.entries(TRUNCGIL_V3_GOLD),
  ];
  for (const [srcKey, outKey] of pairs) {
    const item = data[srcKey] as Record<string, string | number> | undefined;
    if (!item) continue;
    const scale = TRUNCGIL_SCALE[outKey] ?? 1;
    const buy = parseNum(item['Buying'] ?? '0') * scale;
    const sell = parseNum(item['Selling'] ?? '0') * scale;
    if (validRate(buy, sell)) {
      rates[outKey] = { Buying: buy, Selling: sell, Type: (item['Type'] as string) || 'Unknown' };
    }
  }
  return rates;
}

// ============================================================
// SUNUCU TARAFI SON-İYİ DEPOSU (Upstash Redis - opsiyonel)
// Env yoksa sessizce atlanır: o durumda dayanıklılığı CDN stale-if-error sağlar.
// Kurulum: Vercel > Storage > Upstash for Redis (ücretsiz) -> env otomatik gelir.
// ============================================================
const KV_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const LAST_GOOD_KEY = 'benimkasam:rates:lastgood';
const LAST_GOOD_TTL = 7 * 24 * 60 * 60; // 7 gün

interface LastGood { data: Record<string, RateItem>; timestamp: string; sources: string[] }

async function kvCommand(cmd: unknown[]): Promise<{ result?: string | null } | null> {
  if (!KV_URL || !KV_TOKEN) return null;
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  if (!res.ok) throw new Error(`KV HTTP ${res.status}`);
  return res.json();
}

async function kvGetLastGood(): Promise<LastGood | null> {
  try {
    const out = await kvCommand(['GET', LAST_GOOD_KEY]);
    if (!out?.result) return null;
    return JSON.parse(out.result) as LastGood;
  } catch {
    return null;
  }
}

async function kvSetLastGood(payload: LastGood): Promise<void> {
  try {
    await kvCommand(['SET', LAST_GOOD_KEY, JSON.stringify(payload), 'EX', String(LAST_GOOD_TTL)]);
  } catch {
    /* ignore - depo yoksa/hata olursa CDN stale-if-error devrede */
  }
}

// ============================================================
// KAYNAK 2 (İKİNCİL - GERÇEK FİYAT): GenelPara API
// Ücretsiz, API anahtarı gerektirmez, Kapalıçarşı/kuyumcu alış-satışları.
// Truncgil'deki eksik ürünleri doldurur + çapraz kontrol sağlar.
// ============================================================

// GenelPara sembolü -> iç anahtar
const GENELPARA_GOLD: Record<string, string> = {
  GA: 'GRA',            // Gram Altın
  C: 'CEYREKALTIN',     // Çeyrek
  Y: 'YARIMALTIN',      // Yarım
  T: 'TAMALTIN',        // Tam
  CMR: 'CUMHURIYETALTINI',
  ATA: 'ATAALTIN',
  GAG: 'GUMUS',         // Gram Gümüş
};
// JPY GenelPara'da 100 birim üzerinden kote edildiği için skala uyumsuzluğu olmasın diye hariç.
const GENELPARA_CURR = ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD'];

interface GenelParaItem { alis: string; satis: string }
interface GenelParaResponse { success?: boolean; data?: Record<string, GenelParaItem> }

async function fetchGenelParaList(list: 'altin' | 'doviz', symbols: string[]): Promise<Record<string, GenelParaItem>> {
  const url = `https://api.genelpara.com/json/?list=${list}&sembol=${symbols.join(',')}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'BenimKasam/1.0' } });
  if (!res.ok) throw new Error(`GenelPara ${list} HTTP ${res.status}`);
  const json = (await res.json()) as GenelParaResponse;
  return json?.data ?? {};
}

async function fetchGenelPara(): Promise<Record<string, RateItem>> {
  const rates: Record<string, RateItem> = {};
  const [goldRes, currRes] = await Promise.allSettled([
    fetchGenelParaList('altin', Object.keys(GENELPARA_GOLD)),
    fetchGenelParaList('doviz', GENELPARA_CURR),
  ]);

  if (goldRes.status === 'fulfilled') {
    for (const [sym, key] of Object.entries(GENELPARA_GOLD)) {
      const it = goldRes.value[sym];
      if (!it) continue;
      const buy = parseNum(it.alis);
      const sell = parseNum(it.satis);
      if (validRate(buy, sell)) {
        rates[key] = { Buying: buy, Selling: sell, Type: key === 'GUMUS' ? 'Silver' : 'Gold' };
      }
    }
  }

  if (currRes.status === 'fulfilled') {
    for (const code of GENELPARA_CURR) {
      const it = currRes.value[code];
      if (!it) continue;
      const buy = parseNum(it.alis);
      const sell = parseNum(it.satis);
      if (validRate(buy, sell)) {
        rates[code] = { Buying: buy, Selling: sell, Type: 'Currency' };
      }
    }
  }

  if (Object.keys(rates).length === 0) throw new Error('GenelPara: veri yok');
  return rates;
}

// ============================================================
// KAYNAK 3 (DÖVİZ SON ÇARE): ExchangeRate API
// ============================================================
async function fetchExchangeRateAPI(): Promise<Record<string, RateItem>> {
  const res = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
  if (!res.ok) throw new Error(`ExchangeRate API HTTP ${res.status}`);
  const json = await res.json();
  const rates: Record<string, RateItem> = {};

  for (const code of CURRENCY_KEYS) {
    if (json.rates?.[code]) {
      const midRate = 1 / json.rates[code];
      const spread = midRate * 0.005;
      rates[code] = { Buying: midRate - spread, Selling: midRate + spread, Type: 'Currency' };
    }
  }
  return rates;
}

// ============================================================
// ANA HANDLER
// Strateji: Truncgil (birincil) -> GenelPara (eksikleri doldur + çapraz
// kontrol) -> ExchangeRate (döviz son çare). Sabit katsayılı "formül"
// kaldırıldı: iki gerçek kaynak her ürünün fiyatını doğrudan veriyor.
// ============================================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS: native uygulama (Capacitor origin https://localhost) bu proxy'yi CROSS-ORIGIN
  // çağırıyor. Başlık olmadan WebView "Failed to fetch" ile bloke ediyordu ve native
  // hiç kur alamıyordu. Veri herkese açık (kimlik/sır yok) - '*' güvenli.
  // PWA aynı origin'den çağırdığı için bundan etkilenmez.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const sources: string[] = [];
  const failures: string[] = [];
  const divergences: string[] = [];
  const finalData: Record<string, RateItem> = {};
  let timestamp = new Date().toISOString();

  try {
    // Kaynakları paralel çek
    const [truncgilResult, genelParaResult, exchangeResult] = await Promise.allSettled([
      fetchTruncgil(),
      fetchGenelPara(),
      fetchExchangeRateAPI(),
    ]);

    if (truncgilResult.status === 'rejected') failures.push(`truncgil: ${truncgilResult.reason}`);
    if (genelParaResult.status === 'rejected') failures.push(`genelpara: ${genelParaResult.reason}`);
    if (exchangeResult.status === 'rejected') failures.push(`exchangerate: ${exchangeResult.reason}`);
    if (failures.length > 0) console.warn('Failed sources:', failures.join(' | '));

    // ========== 1. TRUNCGIL (birincil) ==========
    if (truncgilResult.status === 'fulfilled') {
      timestamp = truncgilResult.value.timestamp;
      const trRates = extractTruncgil(truncgilResult.value.data);
      for (const [key, val] of Object.entries(trRates)) {
        finalData[key] = val;
      }
      if (Object.keys(trRates).length > 0) sources.push('truncgil');
    }

    // ========== 2. GENELPARA (eksikleri doldur + çapraz kontrol) ==========
    if (genelParaResult.status === 'fulfilled') {
      const gpRates = genelParaResult.value;
      let filled = false;
      for (const [key, gp] of Object.entries(gpRates)) {
        if (!finalData[key]) {
          // Truncgil'de yok -> GenelPara ile doldur
          finalData[key] = gp;
          filled = true;
        } else {
          // İki gerçek kaynak da var -> sadece büyük sapmayı logla (veriyi değiştirme)
          const a = finalData[key].Selling;
          const b = gp.Selling;
          const diff = (Math.abs(a - b) / Math.max(a, b)) * 100;
          if (diff > 5) divergences.push(`${key}: truncgil=${a.toFixed(2)} genelpara=${b.toFixed(2)} (%${diff.toFixed(1)})`);
        }
      }
      if (filled || Object.keys(gpRates).length > 0) sources.push('genelpara');
    }

    // ========== 3. EXCHANGERATE (döviz son çare) ==========
    if (exchangeResult.status === 'fulfilled') {
      let exUsed = false;
      for (const [key, val] of Object.entries(exchangeResult.value)) {
        if (!finalData[key]) {
          finalData[key] = val;
          exUsed = true;
        }
      }
      if (exUsed) sources.push('exchangerate-api');
    }

    if (divergences.length > 0) console.warn('Kaynak sapmaları:', divergences.join(' | '));

    // ========== TAMLIK KAPISI + SONUÇ ==========
    // Altın kalemlerinin TAMAMI yoksa (ör. yalnızca exchangerate döndü) döviz-yalnız
    // 200 SUNMA: yoksa istemcide altın 0'lanır -> sahte "büyük zarar". Sıralama:
    //   1) Taze TAM veri -> son-iyi deposunu güncelle, dön.
    //   2) Eksikse -> sunucudaki son TAM snapshot'ı (Upstash) dön (herkese, ilk açılışta bile).
    //   3) O da yoksa -> 503. CDN stale-if-error son TAM 200'ü 24 saat servis eder;
    //      istemci de kendi yedek zincirine (doğrudan v3 / cache) düşer.
    const goldComplete = EXPECTED_METAL_KEYS.every((k) => finalData[k]);

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120, stale-if-error=86400');

    if (sources.length > 0 && goldComplete) {
      kvSetLastGood({ data: finalData, timestamp, sources }).catch(() => {});
      return res.status(200).json({
        ...finalData,
        _meta: { sources, failures, divergences, timestamp, fetchedAt: new Date().toISOString() },
      });
    }

    const lastGood = await kvGetLastGood();
    if (lastGood && EXPECTED_METAL_KEYS.every((k) => lastGood.data[k])) {
      // sources'a gerçek kaynağı (truncgil/genelpara) koruyup 'last-good' ekliyoruz:
      // istemci bunu TAM veri sayar (altın var) ama eski timestamp -> "piyasalar kapalı".
      return res.status(200).json({
        ...lastGood.data,
        _meta: {
          sources: [...(lastGood.sources?.length ? lastGood.sources : ['truncgil']), 'last-good'],
          failures,
          timestamp: lastGood.timestamp,
          fetchedAt: new Date().toISOString(),
          degraded: true,
        },
      });
    }

    // Ne taze tam veri ne de son-iyi snapshot -> 503 (CDN stale-if-error / istemci yedeği devreye girsin).
    return res.status(503).json({ error: 'Incomplete data (gold missing) and no last-good snapshot', sources, failures });
  } catch (error) {
    console.error('Rate fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch rates', sources, failures });
  }
}
