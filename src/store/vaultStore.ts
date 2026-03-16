import { create } from 'zustand';
import type { Transaction, LiveRate } from '../types';
import * as db from '../db/indexedDb';
import { fetchLiveRates } from '../services/rateService';

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
  },

  deleteTransaction: async (id) => {
    await db.deleteTransaction(id);
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
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
}));
