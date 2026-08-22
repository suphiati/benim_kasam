import { ref, set, get, update, remove, onValue, onChildAdded, onChildChanged, onChildRemoved, type Unsubscribe, type Database } from 'firebase/database';
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
   * Bu cihazı verilen kasanın üyesi yapar (QR üretim akışı için genel giriş noktası).
   * connect() dışında da üyelik gerekir: QR ekranı, eşleşme HENÜZ olmadan kasayı
   * hazırlar; üyelik olmadan Faz-2 kuralında "kasanın sahibi yok" durumu oluşur ve
   * vaultId'yi bilen herkes yazabilir.
   */
  async joinVault(vaultId: string): Promise<boolean> {
    const ok = await ensureAuth();
    const db = getFirebaseDb();
    if (!ok || !db) return false;
    await this.registerMember(db, vaultId);
    return true;
  }

  /**
   * Bu cihazın üyelik kaydını kasadan siler (eşleştirmeyi kaldırma).
   *
   * Yalnız yerelde vaultId silmek yetmiyordu: cihaz Firebase'de members altında
   * kayıtlı kalıyor, yani "senkronize cihaz" olarak görünmeye devam ediyordu.
   * Sunucudaki iz de temizlenmeli. Hata sessizce yutulur - yerel kopma yine olur.
   */
  async leaveVault(vaultId?: string): Promise<void> {
    const id = vaultId ?? this.vaultId ?? localStorage.getItem(VAULT_ID_KEY);
    if (!id) return;
    try {
      const ok = await ensureAuth();
      const db = getFirebaseDb();
      const uid = getCurrentUid();
      if (!ok || !db || !uid) return;
      await remove(ref(db, `vaults/${id}/members/${uid}`));
    } catch {
      // Ağ/kural hatası: yerel kopma yeterli, sunucu kaydı sonraki denemede silinir.
    }
  }

  /**
   * Bu cihazdan BAŞKA bir üye var mı? QR ekranı gerçek eşleşmeyi böyle anlar:
   * ikinci bir uid members'a düştüğü an karşı cihaz QR'ı okumuş demektir.
   */
  async hasPeerMember(vaultId: string): Promise<boolean> {
    const ok = await ensureAuth();
    const db = getFirebaseDb();
    if (!ok || !db) return false;
    const uid = getCurrentUid();
    const snap = await get(ref(db, `vaults/${vaultId}/members`));
    const members = (snap.val() as Record<string, boolean> | null) || {};
    return Object.keys(members).some((k) => k !== uid);
  }

  /**
   * members düğümünü izler; başka bir cihaz katıldığında bir kez callback çağırır.
   * Dönen fonksiyon dinlemeyi bırakır.
   */
  watchPeerJoin(vaultId: string, onPeerJoined: () => void): () => void {
    let stopped = false;
    let unsub: Unsubscribe | null = null;
    ensureAuth().then((ok) => {
      const db = getFirebaseDb();
      if (stopped || !ok || !db) return;
      const uid = getCurrentUid();
      unsub = onValue(ref(db, `vaults/${vaultId}/members`), (snap) => {
        const members = (snap.val() as Record<string, boolean> | null) || {};
        if (Object.keys(members).some((k) => k !== uid)) onPeerJoined();
      });
    });
    return () => {
      stopped = true;
      unsub?.();
    };
  }

  /**
   * QR ekranında oluşturulmuş ama kimsenin okumadığı kasayı sunucudan siler.
   *
   * QR ekranı açılır açılmaz kasa oluşturulup veriler yükleniyor; kullanıcı QR'ı
   * kimseye okutmadan kapatırsa geriye sahipsiz bir kasa ve "eşleşmiş" görünen bir
   * cihaz kalırdı. Silmeden önce son bir kez üye kontrolü yapılır: tam o anda
   * katılan bir cihazın verisi yanlışlıkla silinmesin.
   */
  async abandonVault(vaultId: string): Promise<void> {
    try {
      if (await this.hasPeerMember(vaultId)) return;
      const db = getFirebaseDb();
      if (!db) return;
      await remove(ref(db, `vaults/${vaultId}`));
    } catch {
      // Silinemezse de zararsız: yerelde vaultId yazılmadığı için cihaz bağlanmaz.
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
  openInviteWindow(vaultId?: string): void {
    ensureAuth().then((ok) => {
      const db = getFirebaseDb();
      const id = vaultId ?? this.vaultId;
      if (!ok || !db || !id) return;
      const until = Date.now() + FirebaseSyncService.INVITE_WINDOW_MS;
      set(ref(db, `vaults/${id}/openUntil`), until).catch(() => {});
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

  /**
   * Tüm işlemleri kasaya yükler. TEK multi-path update ile: eskiden işlem başına
   * ayrı `await set(...)` vardı, yani 200 kayıtlı bir kasada 200 gidiş-dönüş -
   * yavaş bağlantıda QR ekranı dakikalarca "yükleniyor"da kalıyordu.
   *
   * Başarısızlıkta ARTIK SESSİZ DEĞİL: promise reject eder ki çağıran hata
   * gösterebilsin (auth kapalı / kural reddi / ağ yok).
   */
  async uploadAllTransactions(transactions: Transaction[], vaultId?: string): Promise<void> {
    const ok = await ensureAuth();
    const db = getFirebaseDb();
    const id = vaultId ?? this.vaultId;
    if (!ok) throw new Error('auth-unavailable');
    if (!db || !id) throw new Error('sync-unavailable');
    if (transactions.length === 0) return;

    const payload: Record<string, FirebaseTransaction> = {};
    for (const tx of transactions) {
      this.pendingLocalWrites.add(tx.id);
      payload[tx.id] = toFirebase(tx);
    }
    await update(ref(db, `vaults/${id}/transactions`), payload);
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
