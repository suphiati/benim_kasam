import { openDB, type DBSchema } from 'idb';
import type { Transaction } from '../types';

interface BenimKasamDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      'by-asset': string;
      'by-date': string;
    };
  };
}

const DB_NAME = 'benim_kasam_db';
const DB_VERSION = 1;

function getDB() {
  return openDB<BenimKasamDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore('transactions', { keyPath: 'id' });
      store.createIndex('by-asset', 'assetType');
      store.createIndex('by-date', 'date');
    },
  });
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  return db.getAll('transactions');
}

export async function addTransaction(tx: Transaction): Promise<void> {
  const db = await getDB();
  await db.put('transactions', tx);
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('transactions', id);
}

export async function updateTransaction(tx: Transaction): Promise<void> {
  const db = await getDB();
  await db.put('transactions', tx);
}
