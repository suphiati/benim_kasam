import { useState } from 'react';
import { useAssetSummaries } from '../hooks/useAssetSummary';
import { useVaultStore } from '../store/vaultStore';
import { TotalVaultCard } from '../components/vault/TotalVaultCard';
import { LiveRatesBar } from '../components/vault/LiveRatesBar';
import { AssetSummaryCard } from '../components/vault/AssetSummaryCard';
import { QrGenerateModal } from '../components/qr/QrGenerateModal';
import { QrScanModal } from '../components/qr/QrScanModal';
import { Vault, QrCode, ScanLine } from 'lucide-react';
import { InstallGuide } from '../components/common/InstallGuide';

export function VaultPage() {
  const transactions = useVaultStore((s) => s.transactions);
  const exportData = useVaultStore((s) => s.exportData);
  const { summaries, totals } = useAssetSummaries();
  const [showQrGenerate, setShowQrGenerate] = useState(false);
  const [showQrScan, setShowQrScan] = useState(false);

  const handleExportFallback = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benim-kasam-yedek-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (transactions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <InstallGuide />
        <Vault size={64} className="text-gray-300 mb-4 mt-4" />
        <h2 className="text-lg font-semibold text-gray-500 mb-1">Kasanız Boş</h2>
        <p className="text-sm text-gray-400">
          İlk varlığınızı eklemek için "Ekle" sekmesine gidin.
        </p>
        <button
          onClick={() => setShowQrScan(true)}
          className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-vault-50 border border-vault-200 rounded-xl text-vault-800 text-sm font-medium hover:bg-vault-100 transition-colors"
        >
          <ScanLine size={18} />
          QR Oku
        </button>
        {showQrScan && <QrScanModal onClose={() => setShowQrScan(false)} />}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-4">
      <InstallGuide />
      <TotalVaultCard
        totalValue={totals.totalValue}
        totalCost={totals.totalCost}
        totalRealizedPL={totals.totalRealizedPL}
        totalUnrealizedPL={totals.totalUnrealizedPL}
        totalPL={totals.totalPL}
        totalPLPercent={totals.totalPLPercent}
      />
      <div className="flex gap-3 px-4 mt-3">
        <button
          onClick={() => setShowQrGenerate(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-vault-50 border border-vault-200 rounded-xl text-vault-800 text-sm font-medium hover:bg-vault-100 transition-colors"
        >
          <QrCode size={18} />
          QR Oluştur
        </button>
        <button
          onClick={() => setShowQrScan(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-vault-50 border border-vault-200 rounded-xl text-vault-800 text-sm font-medium hover:bg-vault-100 transition-colors"
        >
          <ScanLine size={18} />
          QR Oku
        </button>
      </div>
      {showQrGenerate && (
        <QrGenerateModal
          onClose={() => setShowQrGenerate(false)}
          onExportFallback={handleExportFallback}
        />
      )}
      {showQrScan && <QrScanModal onClose={() => setShowQrScan(false)} />}
      <LiveRatesBar />
      <div className="px-4 mt-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Varlıklarım ({summaries.length} kalem)
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
