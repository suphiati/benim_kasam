import { useEffect, useState, useCallback } from 'react';
import { syncService, type RemoteChangeType } from '../services/firebaseSyncService';
import { useVaultStore } from '../store/vaultStore';
import type { Transaction } from '../types';

export function useFirebaseSync() {
  const [isConnected, setIsConnected] = useState(false);
  const [vaultId, setVaultIdState] = useState<string | null>(null);
  const applyRemoteAdd = useVaultStore((s) => s.applyRemoteAdd);
  const applyRemoteUpdate = useVaultStore((s) => s.applyRemoteUpdate);
  const applyRemoteDelete = useVaultStore((s) => s.applyRemoteDelete);

  const handleRemoteChange = useCallback(
    (type: RemoteChangeType, tx: Transaction) => {
      switch (type) {
        case 'added':
          applyRemoteAdd(tx);
          break;
        case 'changed':
          applyRemoteUpdate(tx);
          break;
        case 'removed':
          applyRemoteDelete(tx.id);
          break;
      }
    },
    [applyRemoteAdd, applyRemoteUpdate, applyRemoteDelete],
  );

  const connect = useCallback(
    (id: string) => {
      syncService.connect(id, handleRemoteChange);
      setVaultIdState(id);
      setIsConnected(true);
    },
    [handleRemoteChange],
  );

  const disconnect = useCallback(() => {
    syncService.disconnect();
    syncService.clearVaultId();
    setVaultIdState(null);
    setIsConnected(false);
  }, []);

  // Auto-connect on mount if vault ID exists
  useEffect(() => {
    const existingVaultId = syncService.getVaultId();
    if (existingVaultId) {
      connect(existingVaultId);
    }
    return () => {
      syncService.disconnect();
    };
  }, [connect]);

  return { isConnected, vaultId, connect, disconnect };
}
