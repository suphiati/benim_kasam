import { RefreshCw, Vault, Clock } from 'lucide-react';
import { useVaultStore } from '../../store/vaultStore';
import { useState, useEffect } from 'react';

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Az önce';
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  return `${hours} saat önce`;
}

export function Header() {
  const refreshRates = useVaultStore((s) => s.refreshRates);
  const isLoadingRates = useVaultStore((s) => s.isLoadingRates);
  const lastRateUpdate = useVaultStore((s) => s.lastRateUpdate);
  const liveRates = useVaultStore((s) => s.liveRates);
  const [, setTick] = useState(0);

  // Her 30 saniyede "X dk önce" metnini güncelle
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const timeAgo = lastRateUpdate ? getTimeAgo(lastRateUpdate) : null;
  const hasRates = liveRates.length > 0;

  return (
    <header className="bg-vault-800 text-white px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Vault size={24} className="text-gold-400" />
          <h1 className="text-lg font-bold tracking-tight">BenimKasam</h1>
        </div>
        <button
          type="button"
          onClick={refreshRates}
          disabled={isLoadingRates}
          className="p-1.5 rounded-lg hover:bg-vault-700 transition-colors disabled:opacity-50"
          title="Kurları Güncelle"
        >
          <RefreshCw size={18} className={isLoadingRates ? 'animate-spin' : ''} />
        </button>
      </div>
      {timeAgo && (
        <div className="flex items-center gap-1 mt-1">
          <Clock size={10} className="text-vault-400" />
          <span className={`text-[10px] ${hasRates ? 'text-vault-300' : 'text-red-400'}`}>
            {hasRates ? `Kurlar güncellendi: ${timeAgo}` : 'Kur verileri alınamadı'}
          </span>
          {!hasRates && (
            <button type="button" onClick={refreshRates} className="text-[10px] text-gold-400 underline ml-1">
              Tekrar dene
            </button>
          )}
        </div>
      )}
    </header>
  );
}
