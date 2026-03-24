import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RateItem {
  Buying: string | number;
  Selling: string | number;
  Type?: string;
  Change?: string | number;
}

interface RatesResponse {
  source: string;
  timestamp: string;
  data: Record<string, RateItem>;
}

// Kaynak 1: Truncgil API (altın + döviz)
async function fetchTruncgil(): Promise<RatesResponse> {
  const res = await fetch('https://finans.truncgil.com/v4/today.json', {
    headers: { 'User-Agent': 'BenimKasam/1.0' },
  });
  if (!res.ok) throw new Error(`Truncgil HTTP ${res.status}`);
  const data = await res.json();
  return { source: 'truncgil', timestamp: data.Update_Date || new Date().toISOString(), data };
}

// Kaynak 2: BigPara (Hürriyet) - server-side'da CORS yok
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

  // BigPara response: { data: [ { code, buying, selling, ... } ] }
  if (json?.data && Array.isArray(json.data)) {
    for (const item of json.data) {
      const code = item.code || item.CurrencyCode;
      if (code) {
        rates[code] = {
          Buying: item.buying || item.alis || '0',
          Selling: item.selling || item.satis || '0',
          Type: 'Currency',
        };
      }
    }
  }
  return rates;
}

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

  // BigPara gold key mapping
  const goldKeyMap: Record<string, string> = {
    'gram-altin': 'GRA',
    'gram-has-altin': 'HAS',
    'ceyrek-altin': 'CEYREKALTIN',
    'yarim-altin': 'YARIMALTIN',
    'tam-altin': 'TAMALTIN',
    'cumhuriyet-altini': 'CUMHURIYETALTINI',
    'ata-altin': 'ATAALTIN',
    'resat-altin': 'RESATALTIN',
    'gumus': 'GUMUS',
    '14-ayar-altin': '14AYARALTIN',
    '18-ayar-altin': '18AYARALTIN',
    '22-ayar-bilezik': 'YIA',
  };

  if (json?.data && Array.isArray(json.data)) {
    for (const item of json.data) {
      const slug = item.code || item.slug || '';
      const mappedKey = goldKeyMap[slug];
      if (mappedKey) {
        rates[mappedKey] = {
          Buying: item.buying || item.alis || '0',
          Selling: item.selling || item.satis || '0',
          Type: 'Gold',
        };
      }
    }
  }
  return rates;
}

// Kaynak 3: ExchangeRate API (sadece döviz, çok güvenilir)
async function fetchExchangeRateAPI(): Promise<Record<string, RateItem>> {
  const res = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
  if (!res.ok) throw new Error(`ExchangeRate API HTTP ${res.status}`);
  const json = await res.json();
  const rates: Record<string, RateItem> = {};

  // Bu API sadece mid-rate verir (alış/satış ayrımı yok)
  // 1 TRY = X foreign currency, biz 1 foreign = Y TRY istiyoruz
  const currencyCodes = ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'SAR', 'AED', 'RUB', 'CNY'];
  for (const code of currencyCodes) {
    if (json.rates?.[code]) {
      const midRate = 1 / json.rates[code]; // TRY cinsinden fiyat
      // Alış-satış spread tahmini: %0.5
      const spread = midRate * 0.005;
      rates[code] = {
        Buying: (midRate - spread).toFixed(4),
        Selling: (midRate + spread).toFixed(4),
        Type: 'Currency',
      };
    }
  }
  return rates;
}

function parseNum(val: string | number): number {
  if (typeof val === 'number') return val;
  return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
}

// İki fiyatın makul ölçüde yakın olup olmadığını kontrol et (% tolerans)
function pricesClose(a: number, b: number, tolerancePct: number = 3): boolean {
  if (a === 0 || b === 0) return false;
  const diff = Math.abs(a - b) / Math.max(a, b) * 100;
  return diff < tolerancePct;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const sources: string[] = [];
  let finalData: Record<string, RateItem> = {};
  let timestamp = new Date().toISOString();

  try {
    // Paralel olarak tüm kaynakları dene
    const [truncgilResult, bigParaCurrResult, bigParaGoldResult, exchangeResult] = await Promise.allSettled([
      fetchTruncgil(),
      fetchBigParaCurrency(),
      fetchBigParaGold(),
      fetchExchangeRateAPI(),
    ]);

    // 1. Truncgil verisini al (temel)
    if (truncgilResult.status === 'fulfilled') {
      finalData = { ...truncgilResult.value.data };
      timestamp = truncgilResult.value.timestamp;
      sources.push('truncgil');
    }

    // 2. BigPara altın verileri varsa cross-check/override yap
    if (bigParaGoldResult.status === 'fulfilled') {
      const bigParaGold = bigParaGoldResult.value;
      const goldKeys = Object.keys(bigParaGold);
      if (goldKeys.length > 0) {
        sources.push('bigpara-gold');
        for (const key of goldKeys) {
          const bp = bigParaGold[key];
          const tr = finalData[key];
          if (bp && tr) {
            // Her iki kaynakta da varsa, BigPara'yı öncelikle al (genelde daha güncel)
            const bpSell = parseNum(bp.Selling);
            const trSell = parseNum(tr.Selling);
            if (bpSell > 0) {
              // Eğer fiyatlar %5'ten fazla farklıysa BigPara'yı kullan
              if (!pricesClose(bpSell, trSell, 5)) {
                finalData[key] = bp;
              } else {
                // Yakınsa ortalama al
                finalData[key] = {
                  Buying: ((parseNum(bp.Buying) + parseNum(tr.Buying)) / 2).toFixed(4),
                  Selling: ((bpSell + trSell) / 2).toFixed(4),
                  Type: tr.Type || 'Gold',
                };
              }
            }
          } else if (bp && !tr) {
            finalData[key] = bp;
          }
        }
      }
    }

    // 3. BigPara döviz verileri varsa cross-check yap
    if (bigParaCurrResult.status === 'fulfilled') {
      const bigParaCurr = bigParaCurrResult.value;
      const currKeys = Object.keys(bigParaCurr);
      if (currKeys.length > 0) {
        sources.push('bigpara-currency');
        for (const key of currKeys) {
          const bp = bigParaCurr[key];
          const tr = finalData[key];
          if (bp && tr) {
            const bpSell = parseNum(bp.Selling);
            const trSell = parseNum(tr.Selling);
            if (bpSell > 0 && !pricesClose(bpSell, trSell, 3)) {
              // Fiyatlar farklıysa BigPara'yı kullan
              finalData[key] = bp;
            }
          }
        }
      }
    }

    // 4. ExchangeRate API ile döviz cross-check
    if (exchangeResult.status === 'fulfilled') {
      const exRates = exchangeResult.value;
      const exKeys = Object.keys(exRates);
      if (exKeys.length > 0) {
        sources.push('exchangerate-api');
        for (const key of exKeys) {
          const ex = exRates[key];
          const current = finalData[key];
          if (!current && ex) {
            // Truncgil'de yoksa ExchangeRate'i kullan
            finalData[key] = ex;
          }
          // ExchangeRate mid-rate olduğu için sadece yoksa kullan
        }
      }
    }

    // Hiçbir kaynak çalışmadıysa hata dön
    if (sources.length === 0) {
      return res.status(503).json({ error: 'All sources failed', sources: [] });
    }

    res.setHeader('Cache-Control', 's-maxage=90, stale-while-revalidate=180');
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
