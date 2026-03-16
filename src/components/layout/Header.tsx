import { RefreshCw, Vault } from 'lucide-react';
import { useVaultStore } from '../../store/vaultStore';

export function Header() {
  const refreshRates = useVaultStore((s) => s.refreshRates);
  const isLoadingRates = useVaultStore((s) => s.isLoadingRates);
  const lastRateUpdate = useVaultStore((s) => s.lastRateUpdate);

  const lastUpdateText = lastRateUpdate
    ? new Date(lastRateUpdate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <header className="bg-vault-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Vault size={24} className="text-gold-400" />
        <h1 className="text-lg font-bold tracking-tight">BenimKasam</h1>
      </div>
      <div className="flex items-center gap-3">
        {lastUpdateText && (
          <span className="text-xs text-vault-300">{lastUpdateText}</span>
        )}
        <button
          onClick={refreshRates}
          disabled={isLoadingRates}
          className="p-1.5 rounded-lg hover:bg-vault-700 transition-colors disabled:opacity-50"
          title="Kurları Güncelle"
        >
          <RefreshCw size={18} className={isLoadingRates ? 'animate-spin' : ''} />
        </button>
      </div>
    </header>
  );
}
