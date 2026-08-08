import { useEffect, useState, useCallback } from 'react';
import {
  checkForUpdate,
  runForcedUpdate,
  runOptionalUpdate,
  type UpdateDecision,
} from '../services/updateService';

/**
 * Açılışta bir kez güncelleme kontrolü yapar (hibrit: Firebase eşiği + Play In-App Update).
 * Web/PWA'da checkForUpdate zaten 'none' döner (SW autoUpdate yeterli), bu yüzden yalnızca
 * native'de anlamlı çalışır. Sonuç UI'a (UpdatePrompt) verilir.
 */
export function useAppUpdate() {
  const [decision, setDecision] = useState<UpdateDecision>({ kind: 'none' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    checkForUpdate()
      .then((d) => { if (mounted) setDecision(d); })
      .catch(() => { /* sessiz: güncelleme kontrolü uygulamanın çalışmasını engellemez */ });
    return () => { mounted = false; };
  }, []);

  const update = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (decision.kind === 'forced') await runForcedUpdate(decision.canImmediate);
      else if (decision.kind === 'optional') await runOptionalUpdate(decision.canFlexible);
    } finally {
      setBusy(false);
    }
  }, [decision, busy]);

  // Yalnızca OPSİYONEL güncelleme kapatılabilir; zorunlu (forced) kapatılamaz.
  const dismiss = useCallback(() => {
    setDecision((d) => (d.kind === 'optional' ? { kind: 'none' } : d));
  }, []);

  return { decision, busy, update, dismiss };
}
