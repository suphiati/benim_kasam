import {
  ref, set, get, update, remove, onValue, onChildAdded, onChildChanged, onChildRemoved, goOffline, goOnline,
  type Unsubscribe, type Database, type DataSnapshot,
} from 'firebase/database';
import { getFirebaseDb, ensureAuth, getCurrentUid } from '../config/firebase';
import type { FxSnapshot, Transaction } from '../types';

const VAULT_ID_KEY = 'benim_kasam_vault_id';
// Sunucunun henüz onaylamadığı yerel değişiklikler (id -> 'put' | 'del'). RTDB web SDK'sı
// yazma kuyruğunu yalnızca bellekte tutar: bağlantı yokken ya da kopukken girilen kayıt,
// uygulama kapanınca kayboluyor ve diğer cihaza hiç ulaşmıyordu. Onay gelene kadar burada
// kalır, her bağlanışta yeniden gönderilir.
const OUTBOX_KEY = 'benim_kasam_sync_outbox';
// Kasa başına, sunucuda olduğu bilinen işlem id'leri. Uzlaştırmada "yerelde var, sunucuda
// yok" kaydı ayırt eder: burada varsa başka cihaz silmiştir, yoksa sunucuya hiç ulaşmamıştır.
const KNOWN_KEY_PREFIX = 'benim_kasam_sync_known_';

type OutboxOp = 'put' | 'del';
// Nesne olarak tutulur: ack, kuyruktaki kayıt hâlâ AYNI nesneyse siler. Bu arada aynı id
// yeniden işaretlendiyse (ör. art arda düzenleme) eski ack yeni değişikliği silmez.
interface OutboxEntry { op: OutboxOp }

/**
 * id RTDB yol parçası olur: '.', '#', '$', '[', ']', '/' ve kontrol karakterleri ref()'i
 * fırlatır, boş id ise tüm transactions düğümünü hedefler (iyimser yazım diğer kayıtları
 * yerelde sildirir). RTDB'nin kendi anahtar kuralı; içe aktarılan dosyalara karşı korur.
 */
export function isSyncableId(id: string): boolean {
  if (id.length === 0 || id.length > 256 || /[.#$[\]/]/.test(id)) return false;
  for (let i = 0; i < id.length; i++) {
    const c = id.charCodeAt(i);
    if (c < 32 || c === 127) return false;
  }
  return true;
}

export interface SyncHandlers {
  onRemoteChange: RemoteChangeCallback;
  /** Cihazdaki işlemler (yüklenmiş olmalı): uzlaştırma ve yankı ayıklama için. */
  getLocal: () => Transaction[];
  /** Kimlik yok ya da kural okumayı reddetti: cihaz senkronize DEĞİL, arayüz bunu göstermeli. */
  onBlocked: () => void;
}

function loadOutbox(): Map<string, OutboxEntry> {
  try {
    const raw = JSON.parse(localStorage.getItem(OUTBOX_KEY) || '{}') as Record<string, unknown>;
    return new Map(
      Object.entries(raw)
        .filter(([, op]) => op === 'put' || op === 'del')
        .map(([id, op]) => [id, { op: op as OutboxOp }]),
    );
  } catch {
    return new Map();
  }
}

function loadKnown(vaultId: string): Set<string> | null {
  try {
    const raw = localStorage.getItem(KNOWN_KEY_PREFIX + vaultId);
    return raw ? new Set(JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

function saveKnown(vaultId: string, ids: Iterable<string>): void {
  try {
    localStorage.setItem(KNOWN_KEY_PREFIX + vaultId, JSON.stringify([...ids]));
  } catch {
    // kota dolu: taban eksik kalırsa en kötü ihtimalle silinmiş kayıt geri yüklenir, veri kaybolmaz
  }
}

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

function sameTransaction(a: FirebaseTransaction, b: FirebaseTransaction): boolean {
  return a.type === b.type && a.assetType === b.assetType && a.date === b.date
    && a.amount === b.amount && a.unitPrice === b.unitPrice && (a.note ?? '') === (b.note ?? '')
    && a.createdAt === b.createdAt
    && a.fxSnapshot?.USD === b.fxSnapshot?.USD && a.fxSnapshot?.EUR === b.fxSnapshot?.EUR;
}

class FirebaseSyncService {
  private static readonly INVITE_WINDOW_MS = 15 * 60 * 1000; // Faz-2 davet penceresi: 15 dk
  private vaultId: string | null = null;
  private unsubscribes: Unsubscribe[] = [];
  private handlers: SyncHandlers | null = null;
  private connectSeq = 0; // async connect'i disconnect/yeniden-connect'e karşı korur
  private live = false; // dinleyiciler kurulu: yeni değişiklik beklemeden gönderilir
  private outbox = loadOutbox();
  private known: Set<string> | null = null; // bağlı kasanın tabanı (sunucuda görülen id'ler)
  private knownVaultId: string | null = null;
  private knownSaveQueued = false;
  // Kuyrukta bekleyen id için gelen son sunucu hâli (null = silindi). Bekleme sırasında
  // uygulanmaz (reddedilen yazımın geri alınması yerel düzenlemeyi ezmesin); ack'ten sonra
  // uygulanır - onay anında başka cihazın değişikliği geldiyse kaçmasın.
  private shadow = new Map<string, FirebaseTransaction | null>();
  private pendingLeave: string | null = null; // geçilen eski kasa: yeni kasa okununca üyelikten çıkılır

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
    const id = this.getVaultId();
    if (id) this.forget(id);
    this.vaultId = null;
    localStorage.removeItem(VAULT_ID_KEY);
  }

  /**
   * Ayrılınca ya da başka kasaya geçince o kasanın senkron izlerini siler: bekleyen işlemler
   * yeni kasaya taşınmaz, yeniden katılım birleştirmeyle başlar, vault id anahtar adında kalmaz.
   */
  private forget(vaultId: string): void {
    try {
      localStorage.removeItem(KNOWN_KEY_PREFIX + vaultId);
    } catch {
      // yok say
    }
    this.outbox.clear();
    this.saveOutbox();
    this.shadow.clear();
    if (this.knownVaultId === vaultId) {
      this.known = null;
      this.knownVaultId = null;
    }
  }

  isConnected(): boolean {
    return this.unsubscribes.length > 0;
  }

  connect(vaultId: string, handlers: SyncHandlers): void {
    this.disconnect();
    // Eşleşmişken başka kasanın QR'ı okundu: eskisinin izlerini sil. Üyelikten ise yeni kasa
    // okunabildiğinde çık (uzlaştırma): süresi geçmiş QR'la iki kasadan da düşülmesin.
    const previous = this.getVaultId();
    if (previous && previous !== vaultId) {
      this.forget(previous);
      this.pendingLeave = previous;
    }
    this.setVaultId(vaultId);
    this.handlers = handlers;

    // Kurallar auth != null istiyor: önce anonim oturumu garantile, sonra dinle.
    const token = ++this.connectSeq;
    ensureAuth().then(async (ok) => {
      if (token !== this.connectSeq) return; // bu arada disconnect/yeniden-connect olduysa iptal
      const db = getFirebaseDb();
      if (!ok || !db) {
        handlers.onBlocked();
        return;
      }
      // Üyeliği ÖNCE yaz, SONRA dinle: Faz-2'de (yalnız-üye okuma) dinleyici, üyelik
      // kaydı tamamlanmadan başlarsa okuma reddedilirdi. await bu sırayı garantiler.
      await this.registerMember(db, vaultId);
      if (token !== this.connectSeq) return; // await sırasında disconnect/yeniden-connect olduysa iptal
      // Taban yoksa (ilk katılım, ayrılıp dönme ya da bu sürüme ilk geçiş) boş sayılır:
      // sunucuda olmayan yerel kayıtlar yüklenir, iki cihaz birleşik veriyi görür. Bedeli:
      // bu cihaz kapalıyken başka cihazda silinmiş kayıt bir kez geri gelebilir (veri kaybı yok).
      this.known = loadKnown(vaultId) ?? new Set();
      this.knownVaultId = vaultId;
      this.live = true;
      // Bekleyenleri DİNLEMEDEN ÖNCE gönder: SDK onları yerel görünüme hemen bindirir, ilk
      // yüklemede sunucunun eski kopyası henüz onaylanmamış yerel değişikliği ezmez.
      for (const [id, entry] of this.outbox) this.send(db, vaultId, id, entry);
      this.attachListeners(db, vaultId, token);
    });
  }

  /**
   * Arka plandan dönüşte bağlantıyı tazeler. Mobilde soket arka planda sessizce ölebilir;
   * SDK bunu ancak dakikalar sonra fark ediyor ve o sırada diğer cihazın kayıtları görünmüyordu.
   * Bekleyen yazımlar ve dinleyiciler korunur; yeniden bağlanınca SDK farkları getirir.
   */
  reconnect(): void {
    const db = getFirebaseDb();
    if (!db || !this.live) return;
    goOffline(db);
    goOnline(db);
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

  private attachListeners(db: Database, vaultId: string, token: number): void {
    const txRef = ref(db, `vaults/${vaultId}/transactions`);

    // Kuyrukta bekleyen id'nin olayı (kendi yankımız, reddedilen yazımın geri alınması ya da
    // onay anında gelen başka değişiklik) şimdi uygulanmaz, gölgeye yazılır; ack'te uygulanır.
    const onServerState = (id: string | null, data: FirebaseTransaction | null) => {
      if (!id) return;
      if (this.outbox.has(id)) {
        this.shadow.set(id, data);
        return;
      }
      this.markKnown(id, data !== null);
      this.applyRemote(id, data);
    };

    // İptal = kural okumayı reddetti (ör. üyelik kilidi): rozet "senkronize" demeye devam etmesin.
    const unsub1 = onChildAdded(txRef, (s) => onServerState(s.key, s.val()), () => this.handlers?.onBlocked());
    const unsub2 = onChildChanged(txRef, (s) => onServerState(s.key, s.val()));
    const unsub3 = onChildRemoved(txRef, (s) => onServerState(s.key, null));
    // İlk tam görünüm geldiğinde bir kez: kapalıyken kaçan silmeleri ve sunucuya hiç
    // ulaşmamış yerel kayıtları uzlaştır (child olayları yalnızca sunucudakileri bildirir).
    const unsub4 = onValue(txRef, (snapshot) => {
      if (token === this.connectSeq) this.reconcile(snapshot);
    }, { onlyOnce: true });

    this.unsubscribes = [unsub1, unsub2, unsub3, unsub4];
  }

  /** Sunucu hâlini yerele uygular; aynıysa (kendi yazımımızın yankısı dahil) dokunmaz. */
  private applyRemote(id: string, data: FirebaseTransaction | null): void {
    const local = this.findLocal(id);
    if (!data) {
      if (local) this.handlers?.onRemoteChange('removed', local);
      return;
    }
    if (local && sameTransaction(toFirebase(local), data)) return;
    this.handlers?.onRemoteChange(local ? 'changed' : 'added', fromFirebase(data, id));
  }

  private reconcile(snapshot: DataSnapshot): void {
    const remote = (snapshot.val() as Record<string, FirebaseTransaction> | null) ?? {};
    const known = this.known ?? new Set<string>();
    for (const tx of this.handlers?.getLocal() ?? []) {
      if (remote[tx.id] !== undefined || this.outbox.has(tx.id)) continue;
      if (known.has(tx.id)) this.handlers?.onRemoteChange('removed', tx); // başka cihaz silmiş
      else this.enqueue(tx.id, 'put', tx); // sunucuya hiç ulaşmamış
    }
    this.known = new Set(Object.keys(remote).filter((id) => !this.outbox.has(id)));
    if (this.knownVaultId) saveKnown(this.knownVaultId, this.known);
    if (this.pendingLeave) {
      void this.leaveVault(this.pendingLeave);
      this.pendingLeave = null;
    }
  }

  private markKnown(id: string, present: boolean): void {
    if (!this.known) return; // taban henüz yok: uzlaştırma kuracak
    if (present) this.known.add(id);
    else this.known.delete(id);
    if (this.knownSaveQueued) return;
    // İlk yüklemedeki olay patlamasını tek yazıma topla.
    this.knownSaveQueued = true;
    setTimeout(() => {
      this.knownSaveQueued = false;
      if (this.known && this.knownVaultId) saveKnown(this.knownVaultId, this.known);
    }, 0);
  }

  // skinflint: olay başına doğrusal arama (ilk yüklemede O(n²)); ~5 bin kaydı aşarsa id'ye göre indeksle.
  private findLocal(id: string): Transaction | undefined {
    return this.handlers?.getLocal().find((t) => t.id === id);
  }

  disconnect(): void {
    this.connectSeq++; // bekleyen async connect'i geçersiz kıl
    for (const unsub of this.unsubscribes) {
      unsub();
    }
    this.unsubscribes = [];
    this.handlers = null;
    this.live = false;
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
      if (isSyncableId(tx.id)) payload[tx.id] = toFirebase(tx); // eski içe aktarımdaki bozuk id tüm yüklemeyi düşürmesin
    }
    await update(ref(db, `vaults/${id}/transactions`), payload);
  }

  pushTransaction(tx: Transaction): void {
    this.enqueue(tx.id, 'put', tx);
  }

  pushTransactionUpdate(tx: Transaction): void {
    this.enqueue(tx.id, 'put', tx); // set üzerine yazar: ekleme ile aynı işlem
  }

  pushTransactionDelete(id: string): void {
    this.enqueue(id, 'del');
  }

  /** Değişikliği önce kalıcı kuyruğa yazar, bağlıysa hemen gönderir; değilse connect() gönderir. */
  private enqueue(id: string, op: OutboxOp, tx?: Transaction): void {
    if (!this.getVaultId()) return; // eşleşmemiş cihaz: eşleşince uzlaştırma yükler
    const entry: OutboxEntry = { op };
    this.outbox.set(id, entry);
    this.saveOutbox();
    const db = getFirebaseDb();
    if (this.live && db && this.vaultId) this.send(db, this.vaultId, id, entry, tx);
  }

  private send(db: Database, vaultId: string, id: string, entry: OutboxEntry, tx?: Transaction): void {
    if (!isSyncableId(id)) {
      this.settle(id, entry); // yol olamaz (bkz. isSyncableId): yerelde kalır, gönderilmez
      return;
    }
    this.shadow.delete(id); // yalnızca bu yazım beklerken gelen olaylar ack'te uygulansın
    let write: Promise<void>;
    try {
      const node = ref(db, `vaults/${vaultId}/transactions/${id}`);
      if (entry.op === 'put') {
        const data = tx ?? this.findLocal(id);
        if (!data) {
          this.settle(id, entry); // yerelde artık yok: gönderilecek bir şey kalmadı
          return;
        }
        write = set(node, toFirebase(data));
      } else {
        write = remove(node);
      }
    } catch {
      this.settle(id, entry); // SDK doğrulaması (ör. NaN) eşzamanlı fırlatır: kuyruğu tıkamasın
      return;
    }
    // set/remove yalnızca sunucu onayıyla çözülür; bağlantı yokken bekler, kopunca SDK
    // yeniden gönderir. Uygulama ondan önce kapanırsa kayıt kuyrukta kalır.
    write.then(() => {
      if (!this.settle(id, entry) || this.knownVaultId !== vaultId) return;
      this.markKnown(id, entry.op === 'put');
      // Beklerken gelen son sunucu hâli: kendi yankımızsa değişiklik yok, onay anında başka
      // cihazın düzenlemesi/silmesi geldiyse şimdi uygulanır.
      if (this.shadow.has(id)) {
        const latest = this.shadow.get(id) ?? null;
        this.shadow.delete(id);
        this.applyRemote(id, latest);
      }
    }).catch(() => {
      // Kural reddi (ör. üyelik kilidi): kuyrukta kalır, sonraki bağlanışta yeniden denenir -
      // yeniden eşleşen cihazın arada yaptığı değişiklik kaybolmasın. Yerel veriye dokunma.
    });
  }

  /** Kuyruktaki kayıt hâlâ bu işlemse siler; bu arada yeniden işaretlendiyse false. */
  private settle(id: string, entry: OutboxEntry): boolean {
    if (this.outbox.get(id) !== entry) return false;
    this.outbox.delete(id);
    this.saveOutbox();
    return true;
  }

  private saveOutbox(): void {
    try {
      const raw: Record<string, OutboxOp> = {};
      for (const [id, entry] of this.outbox) raw[id] = entry.op;
      localStorage.setItem(OUTBOX_KEY, JSON.stringify(raw));
    } catch {
      // kota dolu: bellekteki kuyruk bu oturumda yine gönderilir
    }
  }
}

export const syncService = new FirebaseSyncService();
