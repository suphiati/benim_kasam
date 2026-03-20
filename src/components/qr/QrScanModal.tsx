import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, CheckCircle, AlertCircle, Camera, Loader2 } from 'lucide-react';

interface QrScanModalProps {
  onClose: () => void;
  onConnect: (vaultId: string) => void;
}

type ScanState =
  | { status: 'scanning' }
  | { status: 'connecting' }
  | { status: 'success'; vaultId: string }
  | { status: 'error'; message: string };

export function QrScanModal({ onClose, onConnect }: QrScanModalProps) {
  const [state, setState] = useState<ScanState>({ status: 'scanning' });
  const processedRef = useRef(false);

  useEffect(() => {
    const readerId = 'qr-reader';
    const scanner = new Html5Qrcode(readerId);

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
            const data = JSON.parse(decodedText);
            if (data.v !== 1 || !data.vault) {
              throw new Error('Invalid format');
            }
            setState({ status: 'connecting' });
            onConnect(data.vault);
            setState({ status: 'success', vaultId: data.vault });
          } catch {
            setState({ status: 'error', message: 'Geçersiz QR kodu. BenimKasam QR kodu olduğundan emin olun.' });
          }
        },
        () => {
          // no QR found in frame - ignore
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
  }, [onConnect]);

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

      {state.status === 'connecting' && (
        <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full text-center">
          <Loader2 size={48} className="text-vault-600 animate-spin mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Bağlanıyor...</h3>
          <p className="text-sm text-gray-600">Veriler senkronize ediliyor</p>
        </div>
      )}

      {state.status === 'success' && (
        <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Eşleştirme Başarılı!</h3>
          <p className="text-sm text-gray-600">
            Cihazlar senkronize edildi. Artık yapılan değişiklikler otomatik olarak diğer cihaza aktarılacak.
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
