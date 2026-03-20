import { create } from 'zustand';
import type { Transaction, LiveRate } from '../types';
import * as db from '../db/indexedDb';
import { fetchLiveRates } from '../services/rateService';
import { syncService } from '../services/firebaseSyncService';

interface VaultState {
  transactions: Transaction[];
  liveRates: LiveRate[];
  lastRateUpdate: string | null;
  isLoadingRates: boolean;
  isInitialized: boolean;

  init: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'totalCost'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  editTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => Promise<void>;
  refreshRates: () => Promise<void>;
  exportData: () => string;
  importData: (json: string) => Promise<void>;
  mergeTransactions: (incoming: Transaction[]) => Promise<{ added: number; skipped: number }>;
  applyRemoteAdd: (tx: Transaction) => Promise<void>;
  applyRemoteUpdate: (tx: Transaction) => Promise<void>;
  applyRemoteDelete: (id: string) => Promise<void>;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  transactions: [],
  liveRates: [],
  lastRateUpdate: null,
  isLoadingRates: false,
  isInitialized: false,

  init: async () => {
    if (get().isInitialized) return;
    const transactions = await db.getAllTransactions();
    set({ transactions, isInitialized: true });
    get().refreshRates();
  },

  addTransaction: async (input) => {
    const tx: Transaction = {
      ...input,
      id: crypto.randomUUID(),
      totalCost: input.amount * input.unitPrice,
      createdAt: new Date().toISOString(),
    };
    await db.addTransaction(tx);
    set((s) => ({ transactions: [...s.transactions, tx] }));
    syncService.pushTransaction(tx);
  },

  deleteTransaction: async (id) => {
    await db.deleteTransaction(id);
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
    syncService.pushTransactionDelete(id);
  },

  editTransaction: async (id, updates) => {
    const existing = get().transactions.find((t) => t.id === id);
    if (!existing) return;
    const updated: Transaction = {
      ...existing,
      ...updates,
      totalCost: (updates.amount ?? existing.amount) * (updates.unitPrice ?? existing.unitPrice),
    };
    await db.updateTransaction(updated);
    set((s) => ({
      transactions: s.transactions.map((t) => (t.id === id ? updated : t)),
    }));
    syncService.pushTransactionUpdate(updated);
  },

  refreshRates: async () => {
    set({ isLoadingRates: true });
    const rates = await fetchLiveRates();
    set({
      liveRates: rates.length > 0 ? rates : get().liveRates,
      lastRateUpdate: rates.length > 0 ? new Date().toISOString() : get().lastRateUpdate,
      isLoadingRates: false,
    });
  },

  exportData: () => {
    const { transactions } = get();
    return JSON.stringify({
      version: 1,
      exportDate: new Date().toISOString(),
      transactions,
    }, null, 2);
  },

  importData: async (json: string) => {
    const data = JSON.parse(json);
    const txs: Transaction[] = data.transactions || [];
    for (const tx of txs) {
      if (!tx.type) tx.type = 'buy';
      await db.addTransaction(tx);
    }
    const all = await db.getAllTransactions();
    set({ transactions: all });
  },

  mergeTransactions: async (incoming) => {
    const existingIds = new Set(get().transactions.map((t) => t.id));
    let added = 0;
    let skipped = 0;
    for (const tx of incoming) {
      if (existingIds.has(tx.id)) {
        skipped++;
      } else {
        await db.addTransaction(tx);
        added++;
      }
    }
    const all = await db.getAllTransactions();
    set({ transactions: all });
    return { added, skipped };
  },

  // Remote actions - no Firebase push (prevents loop)
  applyRemoteAdd: async (tx) => {
    const exists = get().transactions.some((t) => t.id === tx.id);
    if (exists) return;
    await db.addTransaction(tx);
    set((s) => ({ transactions: [...s.transactions, tx] }));
  },

  applyRemoteUpdate: async (tx) => {
    await db.updateTransaction(tx);
    set((s) => ({
      transactions: s.transactions.some((t) => t.id === tx.id)
        ? s.transactions.map((t) => (t.id === tx.id ? tx : t))
        : [...s.transactions, tx],
    }));
  },

  applyRemoteDelete: async (id) => {
    await db.deleteTransaction(id);
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
  },
}));
