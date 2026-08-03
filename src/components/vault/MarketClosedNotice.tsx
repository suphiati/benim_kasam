import { Info } from 'lucide-react';
import { useVaultStore } from '../../store/vaultStore';
import { useT } from '../../hooks/useT';

/**
 * Piyasa kapalıyken (hafta sonu / kapanış saatleri) canlı fiyat gelmez.
 * rateService bu durumu saptayıp kapanış öncesi son TAM anlık görüntüyü servis
 * eder ve marketClosed=true işaretler - böylece altın kalemleri 0'lanmaz.
 * Bu uyarı yalnızca o durumda görünür ve değerlerin "son veriye göre" olduğunu söyler.
 */
export function MarketClosedNotice() {
  const marketClosed = useVaultStore((s) => s.marketClosed);
  const hasRates = useVaultStore((s) => s.liveRates.length > 0);
  const { t } = useT();

  if (!marketClosed || !hasRates) return null;

  return (
    <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
      <Info size={14} className="mt-0.5 flex-shrink-0 text-amber-500" />
      <p className="text-xs leading-snug text-amber-800">{t('vault.marketClosedNotice')}</p>
    </div>
  );
}
