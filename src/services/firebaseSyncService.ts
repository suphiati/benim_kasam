import { ref, set, remove, onChildAdded, onChildChanged, onChildRemoved, type Unsubscribe, type Database } from 'firebase/database';
import { getFirebaseDb, ensureAuth, getCurrentUid } from '../config/firebase';
import type { FxSnapshot, Transaction } from '../types';

const VAULT_ID_KEY = 'benim_kasam_vault_id';

export type RemoteChangeType = 'added' | 'changed' | 'removed';

export interface RemoteChangeCallback {
  (type: RemoteChangeType, tx: Transaction): void;
}

// DİKKAT: database.rules.json'da "$other": { ".validate": false } var - beyaz liste katı.
// Buraya alan eklerken KURALLARI DA güncelleyip deploy etmek şart, yoksa yazma reddedilir.
// (id RTDB key'i, totalCost türetilmiş: ikisi de gövdede yok.)
interface FirebaseTransaction {
  type: string;
  assetType: string;
  date: string;
  amount: number;
  unitPrice: number;
  note?: string;
  createdAt: string;
  fxSnapshot?: FxSnapshot;
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
  if (tx.fxSnapshot) data.fxSnapshot = tx.fxSnapshot; // RTDB undefined kabul etmez
  return data;
}

function fromFirebase(data: FirebaseTransaction, id: string): Transaction {
  const tx: Transaction = {
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
  // Eski kayıtlarda yok - damgasız gelir, backfill çözer.
  if (data.fxSnapshot) tx.fxSnapshot = data.fxSnapshot;
  return tx;
}

class FirebaseSyncService {
  private static readonly INVITE_WINDOW_MS = 15 * 60 * 1000; // Faz-2 davet penceresi: 15 dk
  private vaultId: string | null = null;
  private pendingLocalWrites = new Set<string>();
  private pendingLocalDeletes = new Set<string>();
  private unsubscribes: Unsubscribe[] = [];
  private onRemoteChange: RemoteChangeCallback | null = null;
  private initialLoadDone = false;
  private connectSeq = 0; // async connect'i disconnect/yeniden-connect'e karşı korur

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

    // Kurallar auth != null istiyor: önce anonim oturumu garantile, sonra dinle.
    const token = ++this.connectSeq;
    ensureAuth().then(async (ok) => {
      // auth yoksa ya da bu arada disconnect/yeniden-connect olduysa iptal
      if (!ok || token !== this.connectSeq) return;
      const db = getFirebaseDb();
      if (!db) return;
      // Üyeliği ÖNCE yaz, SONRA dinle: Faz-2'de (yalnız-üye okuma) dinleyici, üyelik
      // kaydı tamamlanmadan başlarsa okuma reddedilirdi. await bu sırayı garantiler.
      await this.registerMember(db, vaultId);
      if (token !== this.connectSeq) return; // await sırasında disconnect/yeniden-connect olduysa iptal
      this.attachListeners(db, vaultId);
    });
  }

  /**
   * Bu cihazın anonim UID'sini kasanın üye listesine yazar (Faz-1).
   *
   * Şu an kurallar hâlâ `auth != null`, yani bu yazım kimseyi etkilemez ve hiçbir
   * mevcut akışı bozmaz; amacı üyelik verisini TOPLAMAYA başlamaktır. İleride kurallar
   * "yalnızca üye okur/yazar" kilidine (Faz-2) geçirildiğinde, o güne kadar bağlanmış
   * tüm gerçek cihazlar zaten kayıtlı olacağı için geçiş sorunsuz olur.
   *
   * Hata (ör. eski kural sürümü members'ı reddederse) sessizce yutulur: senkronun
   * kendisi bundan bağımsız çalışmaya devam eder.
   */
  private async registerMember(db: Database, vaultId: string): Promise<void> {
    const uid = getCurrentUid();
    if (!uid) return;
    try {
      await set(ref(db, `vaults/${vaultId}/members/${uid}`), true);
    } catch {
      // Eski kural sürümü members'ı reddedebilir; senkron yine de çalışır.
    }
  }

  /**
   * Yeni bir cihazın katılabilmesi için kısa süreli "davet penceresi" açar (Faz-2).
   *
   * QR paylaşım ekranı açıkken çağrılır: pencere (openUntil) boyunca QR'ı okuyan yeni
   * cihaz, henüz üye olmasa da kendini members'a yazabilir; pencere kapanınca kasaya
   * yalnızca mevcut üyeler erişir. Yalnızca zaten üye olan (QR üreten) cihaz pencereyi
   * açabilir - saldırgan vaultId'yi bilse bile pencereyi kendisi açamaz.
   *
   * Faz-1'de (kural henüz yalnız-üye değil) bu yazım işlevsel olarak etkisizdir ama
   * zararsızdır; kilit kuralı deploy edildiğinde otomatik olarak devreye girer.
   */
  openInviteWindow(): void {
    ensureAuth().then((ok) => {
      const db = getFirebaseDb();
      if (!ok || !db || !this.vaultId) return;
      const until = Date.now() + FirebaseSyncService.INVITE_WINDOW_MS;
      set(ref(db, `vaults/${this.vaultId}/openUntil`), until).catch(() => {});
    });
  }

  private attachListeners(db: Database, vaultId: string): void {
    const txRef = ref(db, `vaults/${vaultId}/transactions`);

    // onChildAdded önce mevcut tüm kayıtlar için, sonra yenilerde tetiklenir;
    // ilk yüklemeyi bitmiş saymak için timeout kullan
    let initialTimeout: ReturnType<typeof setTimeout>;
    const resetInitialTimeout = () => {
      clearTimeout(initialTimeout);
      initialTimeout = setTimeout(() => { this.initialLoadDone = true; }, 2000);
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
      if (data) this.onRemoteChange?.('added', fromFirebase(data, id));
      if (!this.initialLoadDone) resetInitialTimeout();
    });

    const unsub2 = onChildChanged(txRef, (snapshot) => {
      const id = snapshot.key;
      if (!id) return;
      if (this.pendingLocalWrites.has(id)) {
        this.pendingLocalWrites.delete(id);
        return;
      }
      const data = snapshot.val() as FirebaseTransaction;
      if (data) this.onRemoteChange?.('changed', fromFirebase(data, id));
    });

    const unsub3 = onChildRemoved(txRef, (snapshot) => {
      const id = snapshot.key;
      if (!id) return;
      if (this.pendingLocalDeletes.has(id)) {
        this.pendingLocalDeletes.delete(id);
        return;
      }
      const data = snapshot.val() as FirebaseTransaction;
      if (data) this.onRemoteChange?.('removed', fromFirebase(data, id));
    });

    this.unsubscribes = [unsub1, unsub2, unsub3];
  }

  disconnect(): void {
    this.connectSeq++; // bekleyen async connect'i geçersiz kıl
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
    const ok = await ensureAuth();
    const db = getFirebaseDb();
    if (!ok || !db || !this.vaultId) return;

    for (const tx of transactions) {
      this.pendingLocalWrites.add(tx.id);
      const txRef = ref(db, `vaults/${this.vaultId}/transactions/${tx.id}`);
      await set(txRef, toFirebase(tx));
    }
  }

  pushTransaction(tx: Transaction): void {
    ensureAuth().then((ok) => {
      const db = getFirebaseDb();
      if (!ok || !db || !this.vaultId) return;
      this.pendingLocalWrites.add(tx.id);
      set(ref(db, `vaults/${this.vaultId}/transactions/${tx.id}`), toFirebase(tx));
    });
  }

  pushTransactionUpdate(tx: Transaction): void {
    this.pushTransaction(tx); // same operation: set overwrites
  }

  pushTransactionDelete(id: string): void {
    ensureAuth().then((ok) => {
      const db = getFirebaseDb();
      if (!ok || !db || !this.vaultId) return;
      this.pendingLocalDeletes.add(id);
      remove(ref(db, `vaults/${this.vaultId}/transactions/${id}`));
    });
  }
}

export const syncService = new FirebaseSyncService();
