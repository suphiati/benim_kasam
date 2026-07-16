import { useEffect, useRef, useState } from 'react';
import { Vault, Fingerprint } from 'lucide-react';
import { useT } from '../../hooks/useT';

interface BiometricLockProps {
  onUnlock: () => Promise<boolean>;
}

export function BiometricLock({ onUnlock }: BiometricLockProps) {
  const { t } = useT();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const attempted = useRef(false);

  const tryUnlock = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    const ok = await onUnlock();
    if (!ok) setFailed(true);
    setBusy(false);
  };

  // Açılışta bir kez otomatik dene (overlay boyansın diye kısa gecikmeyle)
  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    const t = setTimeout(() => { tryUnlock(); }, 150);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-[200] bg-vault-900 flex flex-col items-center justify-center text-white p-8">
      <div className="w-20 h-20 rounded-3xl bg-vault-800 flex items-center justify-center mb-6">
        <Vault size={40} className="text-gold-400" />
      </div>
      <h1 className="text-xl font-bold tracking-tight">BenimKasam</h1>
      <p className="text-vault-300 text-sm mt-1">{t('lock.subtitle')}</p>

      <button
        type="button"
        onClick={tryUnlock}
        disabled={busy}
        className="mt-8 flex items-center gap-2 px-6 py-3 bg-gold-400 text-vault-900 rounded-2xl font-bold text-sm hover:bg-gold-300 transition-colors disabled:opacity-60"
      >
        <Fingerprint size={20} />
        {busy ? t('lock.verifying') : t('lock.unlock')}
      </button>

      {failed && (
        <p className="text-red-400 text-xs mt-4 text-center">
          {t('lock.failed')}
        </p>
      )}
    </div>
  );
}
