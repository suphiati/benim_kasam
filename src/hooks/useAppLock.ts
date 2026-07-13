import { useState, useEffect, useCallback, useRef } from 'react';
import { App } from '@capacitor/app';
import { isNative, isLockEnabled, getBiometricStatus, authenticate } from '../services/biometric';

/**
 * Uygulama kilidi: native'de açılışta ve arka plandan dönünce biyometrik/PIN
 * doğrulaması ister. Web/PWA'da devre dışı. Native'de state baştan `true`
 * başlar ki kasa bir an bile görünmesin (flash yok).
 */
export function useAppLock() {
  const [locked, setLocked] = useState(() => isNative());
  const [ready, setReady] = useState(false);
  const shouldLockRef = useRef(false);

  // Kilit uygulanmalı mı? (native + ayar açık + cihazda PIN/biyometri var)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isNative()) {
        if (mounted) { setLocked(false); setReady(true); }
        return;
      }
      const [enabled, status] = await Promise.all([isLockEnabled(), getBiometricStatus()]);
      const shouldLock = enabled && status.deviceSecure;
      shouldLockRef.current = shouldLock;
      if (mounted) {
        setLocked(shouldLock);
        setReady(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Arka plana geçince yeniden kilitle
  useEffect(() => {
    if (!isNative()) return;
    let handle: { remove: () => void } | undefined;
    App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive && shouldLockRef.current) setLocked(true);
    }).then((h) => { handle = h; });
    return () => { handle?.remove(); };
  }, []);

  const unlock = useCallback(async () => {
    const ok = await authenticate();
    if (ok) setLocked(false);
    return ok;
  }, []);

  return { locked, ready, unlock };
}
