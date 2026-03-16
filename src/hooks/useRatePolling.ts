import { useEffect } from 'react';
import { useVaultStore } from '../store/vaultStore';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 dakika

export function useRatePolling() {
  const refreshRates = useVaultStore((s) => s.refreshRates);

  useEffect(() => {
    const interval = setInterval(refreshRates, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refreshRates]);
}
