import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RateItem {
  Buying: string | number;
  Selling: string | number;
  Type?: string;
}

function parseNum(val: string | number): number {
  if (typeof val === 'number') return val;
  return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
}

function pricesClose(a: number, b: number, tolerancePct: number): boolean {
  if (a === 0 || b === 0) return false;
  const diff = (Math.abs(a - b) / Math.max(a, b)) * 100;
  return diff < tolerancePct;
}

function validRate(buy: number, sell: number): boolean {
  return buy > 0 && sell > 0 && sell >= buy;
}

// ========================
// ALTIN KAYNAKLARI
// ========================

// Kaynak 1 (Altın - Birincil): GenelPara API - Kapalıçarşı fiyatları
async function fetchGenelParaGold(): Promise<Record<string, RateItem>> {
  const res = await fetch('https://api.genelpara.com/json/?list=altin&sembol=GA,C,Y,T,CMR,ATA,RA,GAG', {
    headers: { 'User-Agent': 'BenimKasam/1.0' },
  });
  if (!res.ok) throw new Error(`GenelPara HTTP ${res.status}`);
  const json = await res.json();
  const rates: Record<string, RateItem> = {};

  // GenelPara sembol -> internal key mapping
  const keyMap: Record<string, string> = {
    'GA': 'GRA',           // Gram Altın
    'C': 'CEYREKALTIN',    // Çeyrek Altın
    'Y': 'YARIMALTIN',     // Yarım Altın
    'T': 'TAMALTIN',       // Tam Altın
    'CMR': 'CUMHURIYETALTINI', // Cumhuriyet Altını
    'ATA': 'ATAALTIN',     // Ata Altın
    'RA': 'RESATALTIN',    // Reşat Altın
    'GAG': 'GUMUS',        // Gümüş
  };

  const goldData = json?.data || json;
  if (json?.success !== false) {
    for (const [symbol, mappedKey] of Object.entries(keyMap)) {
      const item = goldData[symbol];
      if (item) {
        const buying = parseNum(item.alis || '0');
        const selling = parseNum(item.satis || '0');
        if (validRate(buying, selling)) {
          rates[mappedKey] = { Buying: buying, Selling: selling, Type: 'Gold' };
        }
      }
    }
  }
  return rates;
}

// Kaynak 2 (Altın - Yedek): BigPara (Hürriyet)
async function fetchBigParaGold(): Promise<Record<string, RateItem>> {
  const res = await fetch('https://bigpara.hurriyet.com.tr/api/v1/datas/gold', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Referer': 'https://bigpara.hurriyet.com.tr/',
    },
  });
  if (!res.ok) throw new Error(`BigPara gold HTTP ${res.status}`);
  const json = await res.json();
  const rates: Record<string, RateItem> = {};

  const goldKeyMap: Record<string, string> = {
    'gram-altin': 'GRA',
    'ceyrek-altin': 'CEYREKALTIN',
    'yarim-altin': 'YARIMALTIN',
    'tam-altin': 'TAMALTIN',
    'cumhuriyet-altini': 'CUMHURIYETALTINI',
    'ata-altin': 'ATAALTIN',
    'resat-altin': 'RESATALTIN',
    'gumus': 'GUMUS',
  };

  if (json?.data && Array.isArray(json.data)) {
    for (const item of json.data) {
      const slug = item.code || item.slug || '';
      const mappedKey = goldKeyMap[slug];
      if (mappedKey) {
        const buying = parseNum(item.buying || item.alis || '0');
        const selling = parseNum(item.selling || item.satis || '0');
        if (validRate(buying, selling)) {
          rates[mappedKey] = { Buying: buying, Selling: selling, Type: 'Gold' };
        }
      }
    }
  }
  return rates;
}

// ========================
// DÖVİZ KAYNAKLARI
// ========================

// Kaynak 1 (Döviz - Birincil): BigPara (Hürriyet) - Serbest piyasa
async function fetchBigParaCurrency(): Promise<Record<string, RateItem>> {
  const res = await fetch('https://bigpara.hurriyet.com.tr/api/v1/datas/currency/serbest', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Referer': 'https://bigpara.hurriyet.com.tr/',
    },
  });
  if (!res.ok) throw new Error(`BigPara currency HTTP ${res.status}`);
  const json = await res.json();
  const rates: Record<string, RateItem> = {};

  if (json?.data && Array.isArray(json.data)) {
    for (const item of json.data) {
      const code = item.code || item.CurrencyCode;
      if (code) {
        const buying = parseNum(item.buying || item.alis || '0');
        const selling = parseNum(item.selling || item.satis || '0');
        if (validRate(buying, selling)) {
          rates[code] = { Buying: buying, Selling: selling, Type: 'Currency' };
        }
      }
    }
  }
  return rates;
}

// Kaynak 2 (Döviz - Yedek): GenelPara API
async function fetchGenelParaCurrency(): Promise<Record<string, RateItem>> {
  const res = await fetch('https://api.genelpara.com/json/?list=doviz&sembol=USD,EUR,GBP,CHF', {
    headers: { 'User-Agent': 'BenimKasam/1.0' },
  });
  if (!res.ok) throw new Error(`GenelPara currency HTTP ${res.status}`);
  const json = await res.json();
  const rates: Record<string, RateItem> = {};

  const currData = json?.data || json;
  const symbols = ['USD', 'EUR', 'GBP', 'CHF'];
  for (const sym of symbols) {
    const item = currData[sym];
    if (item) {
      const buying = parseNum(item.alis || '0');
      const selling = parseNum(item.satis || '0');
      if (validRate(buying, selling)) {
        rates[sym] = { Buying: buying, Selling: selling, Type: 'Currency' };
      }
    }
  }
  return rates;
}

// Kaynak 3 (Döviz - Son çare): Truncgil API
async function fetchTruncgil(): Promise<{ data: Record<string, RateItem>; timestamp: string }> {
  const res = await fetch('https://finans.truncgil.com/v4/today.json', {
    headers: { 'User-Agent': 'BenimKasam/1.0' },
  });
  if (!res.ok) throw new Error(`Truncgil HTTP ${res.status}`);
  const data = await res.json();
  return { data, timestamp: data.Update_Date || new Date().toISOString() };
}

// Kaynak 4 (Döviz - Fallback): ExchangeRate API (mid-rate)
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
      rates[code] = {
        Buying: midRate - spread,
        Selling: midRate + spread,
        Type: 'Currency',
      };
    }
  }
  return rates;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const sources: string[] = [];
  const finalData: Record<string, RateItem> = {};
  let timestamp = new Date().toISOString();

  try {
    // Tüm kaynakları paralel çek
    const [
      genelParaGoldResult,
      bigParaGoldResult,
      bigParaCurrResult,
      genelParaCurrResult,
      truncgilResult,
      exchangeResult,
    ] = await Promise.allSettled([
      fetchGenelParaGold(),
      fetchBigParaGold(),
      fetchBigParaCurrency(),
      fetchGenelParaCurrency(),
      fetchTruncgil(),
      fetchExchangeRateAPI(),
    ]);

    // ========== ALTIN ==========
    // Birincil: GenelPara (Kapalıçarşı fiyatları)
    if (genelParaGoldResult.status === 'fulfilled') {
      const gpGold = genelParaGoldResult.value;
      for (const [key, val] of Object.entries(gpGold)) {
        finalData[key] = val;
      }
      if (Object.keys(gpGold).length > 0) sources.push('genelpara-gold');
    }

    // Yedek: BigPara (sadece GenelPara'da eksik olanlar + cross-check)
    if (bigParaGoldResult.status === 'fulfilled') {
      const bpGold = bigParaGoldResult.value;
      const goldKeys = ['GRA', 'CEYREKALTIN', 'YARIMALTIN', 'TAMALTIN', 'CUMHURIYETALTINI', 'ATAALTIN', 'RESATALTIN', 'GUMUS'];
      let bpUsed = false;
      for (const key of goldKeys) {
        if (!finalData[key] && bpGold[key]) {
          finalData[key] = bpGold[key];
          bpUsed = true;
        } else if (finalData[key] && bpGold[key]) {
          // Cross-check: %2'den fazla fark varsa logla
          const gpSell = parseNum(finalData[key].Selling);
          const bpSell = parseNum(bpGold[key].Selling);
          if (!pricesClose(gpSell, bpSell, 2)) {
            console.warn(`Gold price divergence ${key}: GenelPara=${gpSell}, BigPara=${bpSell}`);
          }
        }
      }
      if (bpUsed) sources.push('bigpara-gold');
    }

    // ========== DÖVİZ ==========
    // Birincil: BigPara (serbest piyasa)
    if (bigParaCurrResult.status === 'fulfilled') {
      const bpCurr = bigParaCurrResult.value;
      for (const [key, val] of Object.entries(bpCurr)) {
        finalData[key] = val;
      }
      if (Object.keys(bpCurr).length > 0) sources.push('bigpara-currency');
    }

    // GenelPara döviz ile eksikleri doldur
    if (genelParaCurrResult.status === 'fulfilled') {
      const gpCurr = genelParaCurrResult.value;
      let gpUsed = false;
      for (const [key, val] of Object.entries(gpCurr)) {
        if (!finalData[key]) {
          finalData[key] = val;
          gpUsed = true;
        }
      }
      if (gpUsed) sources.push('genelpara-currency');
    }

    // Truncgil ile kalan eksikleri doldur
    if (truncgilResult.status === 'fulfilled') {
      const truncgilData = truncgilResult.value.data;
      timestamp = truncgilResult.value.timestamp;

      const allKeys = [
        'USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'SAR', 'AED', 'RUB', 'CNY',
        'GRA', 'CEYREKALTIN', 'YARIMALTIN', 'TAMALTIN', 'CUMHURIYETALTINI', 'ATAALTIN', 'RESATALTIN', 'GUMUS',
      ];

      let trUsed = false;
      for (const key of allKeys) {
        if (finalData[key]) continue; // Zaten var, atla
        const trItem = truncgilData[key] as Record<string, string | number> | undefined;
        if (!trItem) continue;
        const trBuy = parseNum(trItem['Buying'] || '0');
        const trSell = parseNum(trItem['Selling'] || '0');
        if (validRate(trBuy, trSell)) {
          finalData[key] = { Buying: trBuy, Selling: trSell, Type: trItem['Type']?.toString() };
          trUsed = true;
        }
      }
      if (trUsed) sources.push('truncgil');
    }

    // ExchangeRate API - son çare
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

    if (sources.length === 0) {
      return res.status(503).json({ error: 'All sources failed', sources: [] });
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({
      ...finalData,
      _meta: {
        sources,
        timestamp,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Rate fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch rates', sources });
  }
}
