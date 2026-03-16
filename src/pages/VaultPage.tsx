import { useAssetSummaries } from '../hooks/useAssetSummary';
import { useVaultStore } from '../store/vaultStore';
import { TotalVaultCard } from '../components/vault/TotalVaultCard';
import { LiveRatesBar } from '../components/vault/LiveRatesBar';
import { AssetSummaryCard } from '../components/vault/AssetSummaryCard';
import { Vault } from 'lucide-react';

export function VaultPage() {
  const transactions = useVaultStore((s) => s.transactions);
  const { summaries, totals } = useAssetSummaries();

  if (transactions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Vault size={64} className="text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-500 mb-1">Kasanız Boş</h2>
        <p className="text-sm text-gray-400">
          İlk varlığınızı eklemek için "Ekle" sekmesine gidin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-4">
      <TotalVaultCard
        totalValue={totals.totalValue}
        totalCost={totals.totalCost}
        totalProfitLoss={totals.totalProfitLoss}
        totalProfitLossPercent={totals.totalProfitLossPercent}
      />
      <LiveRatesBar />
      <div className="px-4 mt-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Varlıklarım
        </h3>
        <div className="space-y-3">
          {summaries.map((summary) => (
            <AssetSummaryCard key={summary.assetType} summary={summary} />
          ))}
        </div>
      </div>
    </div>
  );
}
