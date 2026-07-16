import { create } from 'zustand';
import type { Transaction, LiveRate, BaseCurrency } from '../types';
import * as db from '../db/indexedDb';
import { fetchLiveRates } from '../services/rateService';
import { syncService } from '../services/firebaseSyncService';
import { getFxForDate } from '../services/fxHistoryService';
import { getFxToday } from '../utils/currency';
import { todayISO } from '../utils/formatters';

const BASE_CURRENCY_KEY = 'benimkasam_base_currency';

// Senkron oku: async olsaydı açılışta bir kare ₺ görünüp sonra $/€'ya atlardı.
function loadBaseCurrency(): BaseCurrency {
  try {
    const v = localStorage.getItem(BASE_CURRENCY_KEY);
    if (v === 'TRY' || v === 'USD' || v === 'EUR') return v;
  } catch {
    // private mode / kota - varsayılana düş
  }
  return 'TRY';
}

interface VaultState {
  transactions: Transaction[];
  liveRates: LiveRate[];
  lastRateUpdate: string | null;   // istemcinin son fetch (kontrol) zamanı
  marketTimestamp: string | null;  // piyasa verisinin gerçek güncellenme zamanı (Truncgil Update_Date)
  rateSources: string[];
  isLoadingRates: boolean;
  isInitialized: boolean;
  baseCurrency: BaseCurrency;      // yalnızca sunum: fiyatlar kaynakta hep TRY

  init: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'totalCost'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  editTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => Promise<void>;
  refreshRates: () => Promise<void>;
  setBaseCurrency: (currency: BaseCurrency) => void;
  backfillFxSnapshots: () => Promise<void>;
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
  marketTimestamp: null,
  rateSources: [],
  isLoadingRates: false,
  isInitialized: false,
  baseCurrency: loadBaseCurrency(),

  init: async () => {
    if (get().isInitialized) return;
    const transactions = await db.getAllTransactions();
    set({ transactions, isInitialized: true });
    // Backfill'i kurlardan SONRA çalıştır: bugüne ait damgalar canlı kurdan gelsin.
    get().refreshRates().then(() => get().backfillFxSnapshots());
  },

  addTransaction: async (input) => {
    // Bugüne aitse canlı kurdan damgala (bedava ve kesin). Geriye tarihliyse damgasız
    // bırak; backfill ECB'den çözer. Damgayı burada beklemiyoruz - kayıt anında ağ beklenmez.
    const fxToday = input.date === todayISO() ? getFxToday(get().liveRates) : null;
    const tx: Transaction = {
      ...input,
      id: crypto.randomUUID(),
      totalCost: input.amount * input.unitPrice,
      createdAt: new Date().toISOString(),
      ...(fxToday ? { fxSnapshot: fxToday } : {}),
    };
    await db.addTransaction(tx);
    set((s) => ({ transactions: [...s.transactions, tx] }));
    syncService.pushTransaction(tx);
    if (!tx.fxSnapshot) get().backfillFxSnapshots();
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

    // Tarih değiştiyse eski damga artık yanlış tarihi gösteriyor - tazele.
    if (updates.date !== undefined && updates.date !== existing.date) {
      const fx = updated.date === todayISO() ? getFxToday(get().liveRates) : null;
      if (fx) updated.fxSnapshot = fx;
      else delete updated.fxSnapshot; // backfill çözecek
    }

    await db.updateTransaction(updated);
    set((s) => ({
      transactions: s.transactions.map((t) => (t.id === id ? updated : t)),
    }));
    syncService.pushTransactionUpdate(updated);
    if (!updated.fxSnapshot) get().backfillFxSnapshots();
  },

  refreshRates: async () => {
    set({ isLoadingRates: true });
    const result = await fetchLiveRates();
    const hasRates = result.rates.length > 0;
    set({
      liveRates: hasRates ? result.rates : get().liveRates,
      lastRateUpdate: hasRates ? new Date().toISOString() : get().lastRateUpdate,
      marketTimestamp: hasRates ? (result.meta.timestamp || get().marketTimestamp) : get().marketTimestamp,
      rateSources: result.meta.sources,
      isLoadingRates: false,
    });
  },

  setBaseCurrency: (currency) => {
    try {
      localStorage.setItem(BASE_CURRENCY_KEY, currency);
    } catch {
      // saklayamasak da oturum içinde çalışsın
    }
    set({ baseCurrency: currency });
  },

  /**
   * Kur damgası olmayan işlemleri tarihsel kurla doldurur.
   * Aynı tarihli işlemler tek istekte toplanır. Ağ yoksa damga yazılmaz;
   * işlem "yaklaşık" kalır ve sonraki açılışta yeniden denenir (kendi kendini onarır).
   */
  backfillFxSnapshots: async () => {
    const pending = get().transactions.filter((t) => !t.fxSnapshot);
    if (pending.length === 0) return;

    const byDate = new Map<string, Transaction[]>();
    for (const t of pending) {
      const list = byDate.get(t.date) ?? [];
      list.push(t);
      byDate.set(t.date, list);
    }

    const today = todayISO();
    const resolved: Transaction[] = [];
    for (const [date, txs] of byDate) {
      // Bugün için canlı kur (Kapalıçarşı alış) ECB'ye tercih edilir - değerlemeyle aynı kaynak.
      const fx = (date === today ? getFxToday(get().liveRates) : null) ?? (await getFxForDate(date));
      if (!fx) continue;
      for (const t of txs) resolved.push({ ...t, fxSnapshot: fx });
    }
    if (resolved.length === 0) return;

    for (const t of resolved) {
      await db.updateTransaction(t);
      syncService.pushTransactionUpdate(t);
    }
    const byId = new Map(resolved.map((t) => [t.id, t]));
    set((s) => ({ transactions: s.transactions.map((t) => byId.get(t.id) ?? t) }));
  },

  exportData: () => {
    const { transactions } = get();
    return JSON.stringify({
      version: 2, // v2: Transaction.fxSnapshot eklendi
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
    get().backfillFxSnapshots(); // v1 export'unda fxSnapshot yok
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
    if (added > 0) get().backfillFxSnapshots(); // eski sürüm QR'ında damga yok
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
