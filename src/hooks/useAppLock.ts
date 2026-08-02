import { useState, useEffect, useCallback, useRef } from 'react';
import { App } from '@capacitor/app';
import { isNative, isLockEnabled, getBiometricStatus, authenticate } from '../services/biometric';

/**
 * Uygulama kilidi: native'de YALNIZCA açılışta (cold start) biyometrik/PIN ister.
 *
 * Arka plandan dönüşte tekrar SORMAZ — eskiden her dönüşte (bildirime bakmak, 2 sn
 * başka uygulamaya geçmek) parmak izi istiyordu ve itici oluyordu. Bunun yerine arka
 * plandayken bir gizlilik ÖRTÜSÜ gösterilir (kasa recent-apps önizlemesinde görünmesin);
 * dönüşte örtü otomatik kalkar, biyometri gerekmez.
 *
 * Web/PWA'da tamamen devre dışı. Native'de `locked` baştan true ki kasa bir an bile
 * görünmesin (flash yok).
 */
export function useAppLock() {
  const [locked, setLocked] = useState(() => isNative());
  const [covered, setCovered] = useState(false);
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

  // Arka plana geçince gizlilik örtüsü göster; öne dönünce kaldır. Biyometri İSTEMEZ.
  // (Kilit yalnızca açılışta; burada setLocked yok.)
  useEffect(() => {
    if (!isNative()) return;
    let handle: { remove: () => void } | undefined;
    App.addListener('appStateChange', ({ isActive }) => {
      if (!shouldLockRef.current) return;
      setCovered(!isActive);
    }).then((h) => { handle = h; });
    return () => { handle?.remove(); };
  }, []);

  const unlock = useCallback(async () => {
    const ok = await authenticate();
    if (ok) setLocked(false);
    return ok;
  }, []);

  return { locked, covered, ready, unlock };
}
