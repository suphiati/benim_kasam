import { useEffect, useRef } from 'react';
import { useVaultStore } from '../store/vaultStore';

const POLL_INTERVAL = 5 * 60 * 1000; // arka plan yoklaması: 5 dakika
const MIN_REFRESH_GAP = 30 * 1000;   // olay tetikli yenilemede en az 30 sn ara

export function useRatePolling() {
  const refreshRates = useVaultStore((s) => s.refreshRates);
  const lastTriggered = useRef(0);

  useEffect(() => {
    // Aşırı isteği önlemek için throttle'lı yenileme
    const throttledRefresh = () => {
      const now = Date.now();
      if (now - lastTriggered.current < MIN_REFRESH_GAP) return;
      lastTriggered.current = now;
      refreshRates();
    };

    // Arka plan yoklaması
    const interval = setInterval(throttledRefresh, POLL_INTERVAL);

    // Kullanıcı uygulamaya geri döndüğünde anında taze veri
    const onVisibility = () => {
      if (document.visibilityState === 'visible') throttledRefresh();
    };
    const onFocus = () => throttledRefresh();
    const onOnline = () => {
      // Çevrimiçi olunca throttle'ı atla, hemen dene
      lastTriggered.current = 0;
      throttledRefresh();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
    };
  }, [refreshRates]);
}
