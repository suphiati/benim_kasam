import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { Transaction, TransactionType } from '../types';

// QR Version 40, Error Correction Level M: max 3391 alphanumeric chars
const QR_MAX_ALPHANUMERIC = 3391;

// v2: kur damgası (f) eklendi. v1 QR'ları hâlâ okunur - damgasız gelirler, backfill çözer.
// Ters yön çalışmaz: v1 sürümündeki bir cihaz v2 QR'ında throw eder. Kapalı testte kabul edildi.
const VERSION_PREFIX = '2:';
const SUPPORTED_PREFIXES = ['2:', '1:'];

interface MinifiedTransaction {
  i: string;       // id
  t: 0 | 1;        // type: 0=buy, 1=sell
  a: string;        // assetType
  d: string;        // date
  m: number;        // amount
  p: number;        // unitPrice
  n?: string;       // note
  c: string;        // createdAt
  f?: [number, number]; // fxSnapshot [USD, EUR] - QR kapasitesi için 4 haneye yuvarlı
}

const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

const typeToNum = (t: TransactionType): 0 | 1 => t === 'buy' ? 0 : 1;
const numToType = (n: 0 | 1): TransactionType => n === 0 ? 'buy' : 'sell';

function minify(tx: Transaction): MinifiedTransaction {
  const m: MinifiedTransaction = {
    i: tx.id,
    t: typeToNum(tx.type),
    a: tx.assetType,
    d: tx.date,
    m: tx.amount,
    p: tx.unitPrice,
    c: tx.createdAt,
  };
  if (tx.note) m.n = tx.note;
  if (tx.fxSnapshot) m.f = [round4(tx.fxSnapshot.USD), round4(tx.fxSnapshot.EUR)];
  return m;
}

function expand(m: MinifiedTransaction): Transaction {
  const tx: Transaction = {
    id: m.i,
    type: numToType(m.t),
    assetType: m.a as Transaction['assetType'],
    date: m.d,
    amount: m.m,
    unitPrice: m.p,
    totalCost: m.m * m.p,
    note: m.n || undefined,
    createdAt: m.c,
  };
  if (m.f?.length === 2 && m.f[0] > 0 && m.f[1] > 0) {
    tx.fxSnapshot = { USD: m.f[0], EUR: m.f[1] };
  }
  return tx;
}

export function encodeTransactions(transactions: Transaction[]): string {
  const minified = transactions.map(minify);
  const json = JSON.stringify(minified);
  const compressed = compressToEncodedURIComponent(json);
  return VERSION_PREFIX + compressed;
}

export function decodeTransactions(data: string): Transaction[] {
  const prefix = SUPPORTED_PREFIXES.find((p) => data.startsWith(p));
  if (!prefix) {
    throw new Error('Desteklenmeyen QR veri formatı');
  }
  const compressed = data.slice(prefix.length);
  const json = decompressFromEncodedURIComponent(compressed);
  if (!json) {
    throw new Error('QR verisi çözülemedi');
  }
  const minified: MinifiedTransaction[] = JSON.parse(json);
  return minified.map(expand);
}

export function checkQrFit(encodedData: string): { fits: boolean; length: number; maxLength: number } {
  return {
    fits: encodedData.length <= QR_MAX_ALPHANUMERIC,
    length: encodedData.length,
    maxLength: QR_MAX_ALPHANUMERIC,
  };
}
