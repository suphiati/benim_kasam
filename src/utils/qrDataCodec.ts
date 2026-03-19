import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { Transaction, TransactionType } from '../types';

const QR_MAX_ALPHANUMERIC = 4296;
const VERSION_PREFIX = '1:';

interface MinifiedTransaction {
  i: string;       // id
  t: 0 | 1;        // type: 0=buy, 1=sell
  a: string;        // assetType
  d: string;        // date
  m: number;        // amount
  p: number;        // unitPrice
  n?: string;       // note
  c: string;        // createdAt
}

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
  return m;
}

function expand(m: MinifiedTransaction): Transaction {
  return {
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
}

export function encodeTransactions(transactions: Transaction[]): string {
  const minified = transactions.map(minify);
  const json = JSON.stringify(minified);
  const compressed = compressToEncodedURIComponent(json);
  return VERSION_PREFIX + compressed;
}

export function decodeTransactions(data: string): Transaction[] {
  if (!data.startsWith(VERSION_PREFIX)) {
    throw new Error('Desteklenmeyen QR veri formatı');
  }
  const compressed = data.slice(VERSION_PREFIX.length);
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
