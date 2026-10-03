import { useEffect, useState, useCallback, useMemo } from 'react';
import { syncService, type SyncHandlers } from '../services/firebaseSyncService';
import { useVaultStore } from '../store/vaultStore';

// Bu kadar arka planda kalınca dönüşte bağlantı tazelenir (kısa geçişlerde gereksiz kopma olmasın).
const RESUME_RECONNECT_MS = 30 * 1000;

export function useFirebaseSync() {
  // Kayıtlı kasa varsa yerel veri yüklenince bağlanılacak: rozet ilk karede doğru görünsün.
  const [isConnected, setIsConnected] = useState(() => syncService.getVaultId() !== null);
  const isInitialized = useVaultStore((s) => s.isInitialized);
  const applyRemoteUpdate = useVaultStore((s) => s.applyRemoteUpdate);
  const applyRemoteDelete = useVaultStore((s) => s.applyRemoteDelete);

  const handlers = useMemo<SyncHandlers>(
    () => ({
      onRemoteChange: (type, tx) => {
        if (type === 'removed') applyRemoteDelete(tx.id);
        else applyRemoteUpdate(tx); // added/changed: upsert
      },
      getLocal: () => useVaultStore.getState().transactions,
      onBlocked: () => setIsConnected(false),
    }),
    [applyRemoteUpdate, applyRemoteDelete],
  );

  // QR ile katılım (üreten ya da okuyan taraf).
  const connect = useCallback(
    (id: string) => {
      syncService.connect(id, handlers);
      setIsConnected(true);
    },
    [handlers],
  );

  const disconnect = useCallback(() => {
    // Sunucudaki üyelik kaydını da sil: yalnız yerel vaultId silinince cihaz
    // Firebase'de kasanın üyesi olarak kalıyor ve "senkronize cihaz" sayılmaya
    // devam ediyordu. Önce id'yi oku (clearVaultId onu sıfırlar), sonra temizle.
    const id = syncService.getVaultId();
    syncService.disconnect();
    syncService.clearVaultId();
    setIsConnected(false);
    if (id) void syncService.leaveVault(id);
  }, []);

  // Kayıtlı kasaya otomatik bağlan - ama yerel veri yüklendikten SONRA: uzlaştırma yereldeki
  // kayıtlara bakarak karar verir, boş liste görürse hiçbir şeyi yükleyemez.
  useEffect(() => {
    if (!isInitialized) return;
    const existingVaultId = syncService.getVaultId();
    if (existingVaultId) syncService.connect(existingVaultId, handlers);
    return () => {
      syncService.disconnect();
    };
  }, [isInitialized, handlers]);

  useEffect(() => {
    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt >= RESUME_RECONNECT_MS) syncService.reconnect();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return { isConnected, connect, disconnect };
}
