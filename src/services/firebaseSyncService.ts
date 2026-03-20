import { ref, set, remove, onChildAdded, onChildChanged, onChildRemoved, type Unsubscribe } from 'firebase/database';
import { getFirebaseDb } from '../config/firebase';
import type { Transaction } from '../types';

const VAULT_ID_KEY = 'benim_kasam_vault_id';

export type RemoteChangeType = 'added' | 'changed' | 'removed';

export interface RemoteChangeCallback {
  (type: RemoteChangeType, tx: Transaction): void;
}

interface FirebaseTransaction {
  type: string;
  assetType: string;
  date: string;
  amount: number;
  unitPrice: number;
  note?: string;
  createdAt: string;
}

function toFirebase(tx: Transaction): FirebaseTransaction {
  const data: FirebaseTransaction = {
    type: tx.type,
    assetType: tx.assetType,
    date: tx.date,
    amount: tx.amount,
    unitPrice: tx.unitPrice,
    createdAt: tx.createdAt,
  };
  if (tx.note) data.note = tx.note;
  return data;
}

function fromFirebase(data: FirebaseTransaction, id: string): Transaction {
  return {
    id,
    type: data.type as Transaction['type'],
    assetType: data.assetType as Transaction['assetType'],
    date: data.date,
    amount: data.amount,
    unitPrice: data.unitPrice,
    totalCost: data.amount * data.unitPrice,
    note: data.note || undefined,
    createdAt: data.createdAt,
  };
}

class FirebaseSyncService {
  private vaultId: string | null = null;
  private pendingLocalWrites = new Set<string>();
  private pendingLocalDeletes = new Set<string>();
  private unsubscribes: Unsubscribe[] = [];
  private onRemoteChange: RemoteChangeCallback | null = null;
  private initialLoadDone = false;

  getVaultId(): string | null {
    if (!this.vaultId) {
      this.vaultId = localStorage.getItem(VAULT_ID_KEY);
    }
    return this.vaultId;
  }

  setVaultId(id: string): void {
    this.vaultId = id;
    localStorage.setItem(VAULT_ID_KEY, id);
  }

  clearVaultId(): void {
    this.vaultId = null;
    localStorage.removeItem(VAULT_ID_KEY);
  }

  isConnected(): boolean {
    return this.unsubscribes.length > 0;
  }

  connect(vaultId: string, onRemoteChange: RemoteChangeCallback): void {
    this.disconnect();
    this.setVaultId(vaultId);
    this.onRemoteChange = onRemoteChange;
    this.initialLoadDone = false;

    const db = getFirebaseDb();
    if (!db) return;

    const txRef = ref(db, `vaults/${vaultId}/transactions`);

    // Use a timeout to mark initial load as done
    // onChildAdded fires for all existing children first, then for new ones
    let initialTimeout: ReturnType<typeof setTimeout>;

    const resetInitialTimeout = () => {
      clearTimeout(initialTimeout);
      initialTimeout = setTimeout(() => {
        this.initialLoadDone = true;
      }, 2000);
    };

    resetInitialTimeout();

    const unsub1 = onChildAdded(txRef, (snapshot) => {
      const id = snapshot.key;
      if (!id) return;

      if (this.pendingLocalWrites.has(id)) {
        this.pendingLocalWrites.delete(id);
        return;
      }

      const data = snapshot.val() as FirebaseTransaction;
      if (data) {
        const tx = fromFirebase(data, id);
        this.onRemoteChange?.('added', tx);
      }

      if (!this.initialLoadDone) {
        resetInitialTimeout();
      }
    });

    const unsub2 = onChildChanged(txRef, (snapshot) => {
      const id = snapshot.key;
      if (!id) return;

      if (this.pendingLocalWrites.has(id)) {
        this.pendingLocalWrites.delete(id);
        return;
      }

      const data = snapshot.val() as FirebaseTransaction;
      if (data) {
        const tx = fromFirebase(data, id);
        this.onRemoteChange?.('changed', tx);
      }
    });

    const unsub3 = onChildRemoved(txRef, (snapshot) => {
      const id = snapshot.key;
      if (!id) return;

      if (this.pendingLocalDeletes.has(id)) {
        this.pendingLocalDeletes.delete(id);
        return;
      }

      const data = snapshot.val() as FirebaseTransaction;
      if (data) {
        const tx = fromFirebase(data, id);
        this.onRemoteChange?.('removed', tx);
      }
    });

    this.unsubscribes = [unsub1, unsub2, unsub3];
  }

  disconnect(): void {
    for (const unsub of this.unsubscribes) {
      unsub();
    }
    this.unsubscribes = [];
    this.onRemoteChange = null;
    this.pendingLocalWrites.clear();
    this.pendingLocalDeletes.clear();
    this.initialLoadDone = false;
  }

  async uploadAllTransactions(transactions: Transaction[]): Promise<void> {
    const db = getFirebaseDb();
    if (!db || !this.vaultId) return;

    for (const tx of transactions) {
      this.pendingLocalWrites.add(tx.id);
      const txRef = ref(db, `vaults/${this.vaultId}/transactions/${tx.id}`);
      await set(txRef, toFirebase(tx));
    }
  }

  pushTransaction(tx: Transaction): void {
    const db = getFirebaseDb();
    if (!db || !this.vaultId) return;

    this.pendingLocalWrites.add(tx.id);
    const txRef = ref(db, `vaults/${this.vaultId}/transactions/${tx.id}`);
    set(txRef, toFirebase(tx));
  }

  pushTransactionUpdate(tx: Transaction): void {
    this.pushTransaction(tx); // same operation: set overwrites
  }

  pushTransactionDelete(id: string): void {
    const db = getFirebaseDb();
    if (!db || !this.vaultId) return;

    this.pendingLocalDeletes.add(id);
    const txRef = ref(db, `vaults/${this.vaultId}/transactions/${id}`);
    remove(txRef);
  }
}

export const syncService = new FirebaseSyncService();
