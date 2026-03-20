import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { decodeTransactions } from '../../utils/qrDataCodec';
import { useVaultStore } from '../../store/vaultStore';

interface QrScanModalProps {
  onClose: () => void;
}

type ScanState =
  | { status: 'scanning' }
  | { status: 'success'; added: number; skipped: number }
  | { status: 'error'; message: string };

export function QrScanModal({ onClose }: QrScanModalProps) {
  const mergeTransactions = useVaultStore((s) => s.mergeTransactions);
  const [state, setState] = useState<ScanState>({ status: 'scanning' });
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    const readerId = 'qr-reader';
    const scanner = new Html5Qrcode(readerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 5, qrbox: { width: 280, height: 280 }, aspectRatio: 1 },
        async (decodedText) => {
          if (processedRef.current) return;
          processedRef.current = true;

          try {
            await scanner.stop();
          } catch {
            // already stopped
          }

          try {
            const transactions = decodeTransactions(decodedText);
            const result = await mergeTransactions(transactions);
            setState({ status: 'success', added: result.added, skipped: result.skipped });
          } catch {
            setState({ status: 'error', message: 'Geçersiz QR kodu. BenimKasam QR kodu olduğundan emin olun.' });
          }
        },
        () => {
          // scan error (no QR found in frame) - ignore
        },
      )
      .catch(() => {
        setState({
          status: 'error',
          message: 'Kamera açılamadı. Tarayıcı ayarlarından kamera iznini kontrol edin.',
        });
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [mergeTransactions]);

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[100]">
      <div className="absolute top-4 right-4">
        <button onClick={onClose} className="p-2 text-white/80 hover:text-white">
          <X size={24} />
        </button>
      </div>

      {state.status === 'scanning' && (
        <>
          <div className="flex items-center gap-2 text-white mb-4">
            <Camera size={20} />
            <p className="text-sm font-medium">QR kodu kameraya gösterin</p>
          </div>
          <div
            id="qr-reader"
            className="w-[320px] h-[320px] overflow-hidden rounded-2xl"
          />
          <button
            onClick={onClose}
            className="mt-6 px-6 py-2.5 border border-white/30 text-white rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
          >
            İptal
          </button>
        </>
      )}

      {state.status === 'success' && (
        <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Aktarım Başarılı!</h3>
          <p className="text-sm text-gray-600">
            {state.added > 0 && <>{state.added} yeni işlem eklendi.<br /></>}
            {state.skipped > 0 && <>{state.skipped} işlem zaten mevcut (atlandı).</>}
            {state.added === 0 && state.skipped > 0 && 'Tüm işlemler zaten mevcut.'}
          </p>
          <button
            onClick={onClose}
            className="w-full mt-4 py-2.5 bg-vault-800 text-white rounded-xl text-sm font-medium hover:bg-vault-700 transition-colors"
          >
            Tamam
          </button>
        </div>
      )}

      {state.status === 'error' && (
        <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Hata</h3>
          <p className="text-sm text-gray-600">{state.message}</p>
          <button
            onClick={onClose}
            className="w-full mt-4 py-2.5 bg-vault-800 text-white rounded-xl text-sm font-medium hover:bg-vault-700 transition-colors"
          >
            Kapat
          </button>
        </div>
      )}
    </div>
  );
}
