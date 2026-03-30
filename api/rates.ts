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

// ============================================================
// KAYNAK 1 (BİRİNCİL): Truncgil API - Altın + Döviz + ONS
// ============================================================
async function fetchTruncgil(): Promise<{ data: Record<string, unknown>; timestamp: string }> {
  const res = await fetch('https://finans.truncgil.com/v4/today.json', {
    headers: { 'User-Agent': 'BenimKasam/1.0' },
  });
  if (!res.ok) throw new Error(`Truncgil HTTP ${res.status}`);
  const text = await res.text();
  const data = safeJsonParse(text);
  return { data, timestamp: (data.Update_Date as string) || new Date().toISOString() };
}

// ============================================================
// KAYNAK 2 (ONS YEDEK): Yahoo Finance - Altın spot fiyatı (USD/oz)
// ============================================================
async function fetchYahooGold(): Promise<{ usdPerOz: number }> {
  const res = await fetch(
    'https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=1d',
    { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BenimKasam/1.0)' } },
  );
  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status}`);
  const json = await res.json() as { chart?: { result?: Array<{ meta?: { regularMarketPrice?: number } }> } };
  const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (!price || price <= 0) throw new Error('Yahoo Finance: geçersiz ONS fiyatı');
  return { usdPerOz: price };
}

// ============================================================
// KAYNAK 3 (DÖVİZ YEDEK): ExchangeRate API
// ============================================================
async function fetchExchangeRateAPI(): Promise<Record<string, RateItem>> {
  const res = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
  if (!res.ok) throw new Error(`ExchangeRate API HTTP ${res.status}`);
  const json = await res.json();
  const rates: Record<string, RateItem> = {};

  const currencyCodes = ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'SAR', 'AED', 'RUB', 'CNY'];
  for (const code of currencyCodes) {
    if (json.rates?.[code]) {
      const midRate = 1 / json.rates[code];
      const spread = midRate * 0.005;
      rates[code] = { Buying: midRate - spread, Selling: midRate + spread, Type: 'Currency' };
    }
  }
  return rates;
}

// ============================================================
// KUYUMCU FORMÜLÜ: Gram Altın = (ONS / 31.1035) × USD/TRY
// ============================================================
function calculateGoldFromFormula(
  onsData: { buy: number; sell: number },
  usdData: { buy: number; sell: number },
): Record<string, RateItem> {
  const TROY_OUNCE = 31.1035;
  const rates: Record<string, RateItem> = {};

  // Gram altın (has altın bazlı)
  const gramBuy = (onsData.buy / TROY_OUNCE) * usdData.buy;
  const gramSell = (onsData.sell / TROY_OUNCE) * usdData.sell;

  if (validRate(gramBuy, gramSell)) {
    rates['GRA'] = { Buying: gramBuy, Selling: gramSell, Type: 'Gold' };

    // Çeyrek, yarım, tam altın katsayıları (piyasa standartları)
    const ceyrekMultiplier = 1.75;  // ~1.75 gram altın
    const yarimMultiplier = 3.50;   // ~3.50 gram altın
    const tamMultiplier = 7.00;     // ~7.00 gram altın
    const cumhuriyetMultiplier = 7.216; // ~7.216 gram altın

    rates['CEYREKALTIN'] = {
      Buying: gramBuy * ceyrekMultiplier,
      Selling: gramSell * ceyrekMultiplier,
      Type: 'Gold',
    };
    rates['YARIMALTIN'] = {
      Buying: gramBuy * yarimMultiplier,
      Selling: gramSell * yarimMultiplier,
      Type: 'Gold',
    };
    rates['TAMALTIN'] = {
      Buying: gramBuy * tamMultiplier,
      Selling: gramSell * tamMultiplier,
      Type: 'Gold',
    };
    rates['CUMHURIYETALTINI'] = {
      Buying: gramBuy * cumhuriyetMultiplier,
      Selling: gramSell * cumhuriyetMultiplier,
      Type: 'Gold',
    };
    rates['ATAALTIN'] = {
      Buying: gramBuy * cumhuriyetMultiplier,
      Selling: gramSell * cumhuriyetMultiplier,
      Type: 'Gold',
    };
    rates['RESATALTIN'] = {
      Buying: gramBuy * cumhuriyetMultiplier,
      Selling: gramSell * cumhuriyetMultiplier,
      Type: 'Gold',
    };
  }

  return rates;
}

// ============================================================
// ANA HANDLER
// ============================================================
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const sources: string[] = [];
  const failures: string[] = [];
  const finalData: Record<string, RateItem> = {};
  let timestamp = new Date().toISOString();

  try {
    // Tüm kaynakları paralel çek
    const [truncgilResult, yahooResult, exchangeResult] = await Promise.allSettled([
      fetchTruncgil(),
      fetchYahooGold(),
      fetchExchangeRateAPI(),
    ]);

    // Hata logla
    if (truncgilResult.status === 'rejected') failures.push(`truncgil: ${truncgilResult.reason}`);
    if (yahooResult.status === 'rejected') failures.push(`yahoo: ${yahooResult.reason}`);
    if (exchangeResult.status === 'rejected') failures.push(`exchangerate: ${exchangeResult.reason}`);
    if (failures.length > 0) console.warn('Failed sources:', failures.join(' | '));

    // ========== 1. TRUNCGIL (birincil - altın + döviz) ==========
    let onsData: { buy: number; sell: number } | null = null;
    let usdData: { buy: number; sell: number } | null = null;

    if (truncgilResult.status === 'fulfilled') {
      const trData = truncgilResult.value.data;
      timestamp = truncgilResult.value.timestamp;

      // Altın + döviz key'leri
      const allKeys = [
        'USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'SAR', 'AED', 'RUB', 'CNY',
        'GRA', 'CEYREKALTIN', 'YARIMALTIN', 'TAMALTIN', 'CUMHURIYETALTINI', 'ATAALTIN', 'RESATALTIN', 'GUMUS',
      ];

      for (const key of allKeys) {
        const item = trData[key] as Record<string, string | number> | undefined;
        if (!item) continue;
        const buy = parseNum(item['Buying'] || '0');
        const sell = parseNum(item['Selling'] || '0');
        if (validRate(buy, sell)) {
          finalData[key] = { Buying: buy, Selling: sell, Type: (item['Type'] as string) || 'Unknown' };
        }
      }

      // ONS ve USD verilerini kuyumcu formülü için sakla
      // Not: Truncgil ONS değeri genellikle 0 gelir, Yahoo Finance yedek olarak kullanılır
      const onsItem = trData['ONS'] as Record<string, string | number> | undefined;
      if (onsItem) {
        const onsBuy = parseNum(onsItem['Buying'] || '0');
        const onsSell = parseNum(onsItem['Selling'] || '0');
        if (onsBuy > 0 && onsSell > 0) {
          onsData = { buy: onsBuy, sell: onsSell };
        }
      }
      const usdItem = trData['USD'] as Record<string, string | number> | undefined;
      if (usdItem) {
        const usdBuy = parseNum(usdItem['Buying'] || '0');
        const usdSell = parseNum(usdItem['Selling'] || '0');
        if (usdBuy > 0 && usdSell > 0) {
          usdData = { buy: usdBuy, sell: usdSell };
        }
      }

      if (Object.keys(finalData).length > 0) sources.push('truncgil');
    }

    // ========== 2. YAHOO FINANCE ONS YEDEK ==========
    // Truncgil ONS 0 gelirse Yahoo Finance'ten gerçek spot fiyatını kullan
    if (!onsData && yahooResult.status === 'fulfilled') {
      const usdPerOz = yahooResult.value.usdPerOz;
      // onsData birimi: USD/oz (kuyumcu formülü USD * USD_TRY / TROY_OUNCE kullanır)
      const spread = usdPerOz * 0.002; // %0.2 spread
      onsData = { buy: usdPerOz - spread, sell: usdPerOz + spread };
      console.info(`Yahoo Finance ONS: ${usdPerOz.toFixed(2)} USD/oz`);
    }

    // ========== 3. KUYUMCU FORMÜLÜ CROSS-CHECK ==========
    if (onsData && usdData) {
      const formulaRates = calculateGoldFromFormula(onsData, usdData);
      const formulaGRA = formulaRates['GRA'];

      if (formulaGRA) {
        // Truncgil'den GRA geldiyse cross-check yap
        if (finalData['GRA']) {
          const trSell = finalData['GRA'].Selling;
          const fSell = formulaGRA.Selling;
          const diff = Math.abs(trSell - fSell) / Math.max(trSell, fSell) * 100;

          if (diff > 3) {
            // %3'ten fazla sapma - formül sonucunu kullan
            console.warn(`GRA cross-check: Truncgil=${trSell.toFixed(2)}, Formula=${fSell.toFixed(2)}, diff=${diff.toFixed(1)}%`);
            // Formül sonuçlarını tercih et
            for (const [key, val] of Object.entries(formulaRates)) {
              finalData[key] = val;
            }
            sources.push('formula');
          }
        } else {
          // Truncgil'den altın gelmemişse formülü kullan
          for (const [key, val] of Object.entries(formulaRates)) {
            if (!finalData[key]) {
              finalData[key] = val;
            }
          }
          sources.push('formula');
        }
      }
    }

    // ========== 4. EXCHANGERATE API (döviz yedek) ==========
    if (exchangeResult.status === 'fulfilled') {
      const exRates = exchangeResult.value;
      let exUsed = false;
      for (const [key, val] of Object.entries(exRates)) {
        if (!finalData[key]) {
          finalData[key] = val;
          exUsed = true;
        }
      }
      if (exUsed) sources.push('exchangerate-api');
    }

    // ========== SONUÇ ==========
    if (sources.length === 0) {
      return res.status(503).json({ error: 'All sources failed', sources: [], failures });
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({
      ...finalData,
      _meta: {
        sources,
        failures,
        timestamp,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Rate fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch rates', sources, failures });
  }
}
