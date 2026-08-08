import { Download, X } from 'lucide-react';
import { useT } from '../../hooks/useT';
import type { UpdateDecision } from '../../services/updateService';

interface UpdatePromptProps {
  decision: UpdateDecision;
  busy: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

/**
 * ZORUNLU güncelleme => tüm ekranı kaplayan, kapatılamaz katman.
 * OPSİYONEL güncelleme => main ile TabBar arasında, kapatılabilir şerit.
 * 'none' => hiçbir şey.
 */
export function UpdatePrompt({ decision, busy, onUpdate, onDismiss }: UpdatePromptProps) {
  const { t } = useT();

  if (decision.kind === 'forced') {
    return (
      <div className="fixed inset-0 z-[300] bg-vault-900/95 flex flex-col items-center justify-center text-white p-8">
        <div className="w-20 h-20 rounded-3xl bg-vault-800 flex items-center justify-center mb-6">
          <Download size={40} className="text-gold-400" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-center">{t('update.forcedTitle')}</h1>
        <p className="text-vault-300 text-sm mt-2 text-center max-w-xs">{t('update.forcedDesc')}</p>
        <button
          type="button"
          onClick={onUpdate}
          disabled={busy}
          className="mt-8 flex items-center gap-2 px-6 py-3 bg-gold-400 text-vault-900 rounded-2xl font-bold text-sm hover:bg-gold-300 transition-colors disabled:opacity-60"
        >
          <Download size={20} />
          {busy ? t('update.updating') : t('update.action')}
        </button>
      </div>
    );
  }

  if (decision.kind === 'optional') {
    return (
      <div className="bg-vault-800 text-white px-4 py-3 flex items-center gap-3">
        <Download size={22} className="text-gold-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{t('update.optionalTitle')}</p>
          <p className="text-vault-300 text-xs mt-0.5 truncate">{t('update.optionalDesc')}</p>
        </div>
        <button
          type="button"
          onClick={onUpdate}
          disabled={busy}
          className="px-3 py-1.5 bg-gold-400 text-vault-900 rounded-lg text-xs font-bold hover:bg-gold-300 transition-colors disabled:opacity-60 shrink-0"
        >
          {busy ? t('update.updating') : t('update.action')}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 text-white/60 hover:text-white transition-colors shrink-0"
          aria-label={t('update.later')}
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return null;
}
