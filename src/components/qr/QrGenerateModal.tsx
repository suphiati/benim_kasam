import { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Share2, AlertTriangle, Download } from 'lucide-react';
import { useVaultStore } from '../../store/vaultStore';
import { encodeTransactions, checkQrFit } from '../../utils/qrDataCodec';

interface QrGenerateModalProps {
  onClose: () => void;
  onExportFallback: () => void;
}

export function QrGenerateModal({ onClose, onExportFallback }: QrGenerateModalProps) {
  const transactions = useVaultStore((s) => s.transactions);

  const { qrData, overflow, txCount } = useMemo(() => {
    const encoded = encodeTransactions(transactions);
    const fit = checkQrFit(encoded);
    return {
      qrData: fit.fits ? encoded : null,
      overflow: !fit.fits,
      txCount: transactions.length,
    };
  }, [transactions]);

  const handleShare = async () => {
    if (!qrData || !navigator.share) return;
    try {
      await navigator.share({ title: 'BenimKasam Veri', text: qrData });
    } catch {
      // user cancelled share
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">QR ile Paylaş</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {qrData ? (
          <>
            <div className="flex justify-center p-4 bg-white rounded-xl border border-gray-100">
              <QRCodeSVG value={qrData} size={240} level="L" />
            </div>
            <p className="text-center text-sm text-gray-500 mt-3">
              {txCount} işlem kodlandı
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
        ) : overflow ? (
          <>
            <div className="flex flex-col items-center p-4">
              <AlertTriangle size={48} className="text-amber-500 mb-3" />
              <p className="text-sm text-gray-700 text-center font-medium">
                Veri QR koda sığmıyor
              </p>
              <p className="text-xs text-gray-500 text-center mt-1">
                {txCount} işleminiz QR kod kapasitesini aşıyor. JSON dosyası olarak dışa aktarabilirsiniz.
              </p>
            </div>
            <button
              onClick={() => { onExportFallback(); onClose(); }}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-vault-800 text-white rounded-xl text-sm font-medium hover:bg-vault-700 transition-colors"
            >
              <Download size={16} />
              JSON Olarak Dışa Aktar
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
