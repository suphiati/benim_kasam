import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Share2, Loader2 } from 'lucide-react';
import { useVaultStore } from '../../store/vaultStore';
import { syncService } from '../../services/firebaseSyncService';

interface QrGenerateModalProps {
  onClose: () => void;
  onConnect: (vaultId: string) => void;
}

export function QrGenerateModal({ onClose, onConnect }: QrGenerateModalProps) {
  const transactions = useVaultStore((s) => s.transactions);
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const init = async () => {
      let id = syncService.getVaultId();
      if (!id) {
        id = crypto.randomUUID();
      }
      setVaultId(id);

      setUploading(true);
      syncService.setVaultId(id);
      await syncService.uploadAllTransactions(transactions);
      onConnect(id);
      setUploading(false);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const qrContent = vaultId ? JSON.stringify({ v: 1, vault: vaultId }) : null;

  const handleShare = async () => {
    if (!qrContent || !navigator.share) return;
    try {
      await navigator.share({ title: 'BenimKasam Sync', text: qrContent });
    } catch {
      // user cancelled
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">QR ile Eşleştir</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {uploading ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 size={32} className="text-vault-600 animate-spin mb-3" />
            <p className="text-sm text-gray-500">Veriler yükleniyor...</p>
          </div>
        ) : qrContent ? (
          <>
            <div className="flex justify-center p-4 bg-white rounded-xl border border-gray-100">
              <QRCodeSVG value={qrContent} size={280} level="M" />
            </div>
            <p className="text-center text-sm text-gray-500 mt-3">
              {transactions.length} işlem senkronize edildi
            </p>
            <p className="text-center text-xs text-gray-400 mt-1">
              Diğer telefondaki BenimKasam'dan bu QR'ı okutun
            </p>
            {'share' in navigator && (
              <button
                onClick={handleShare}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-vault-800 text-white rounded-xl text-sm font-medium hover:bg-vault-700 transition-colors"
              >
                <Share2 size={16} />
                Paylaş
              </button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
