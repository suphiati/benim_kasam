import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, CheckCircle, AlertCircle, Camera, Loader2 } from 'lucide-react';
import { useT } from '../../hooks/useT';
import type { TKey } from '../../i18n';

interface QrScanModalProps {
  onClose: () => void;
  onConnect: (vaultId: string) => void;
}

// State çevrilmiş METİN değil ANAHTAR tutar: metin tutsaydı `t` effect'in
// bağımlılığı olurdu ve dil değişiminde kamera tarayıcısı yeniden başlardı.
type ScanState =
  | { status: 'scanning' }
  | { status: 'connecting' }
  | { status: 'success'; vaultId: string }
  | { status: 'error'; messageKey: TKey };

export function QrScanModal({ onClose, onConnect }: QrScanModalProps) {
  const { t } = useT();
  const [state, setState] = useState<ScanState>({ status: 'scanning' });
  const processedRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    let stopped = false;

    // Tarayıcıyı güvenle durdur + temizle. clear() html5-qrcode'un #qr-reader'a
    // enjekte ettiği <video>/<canvas> düğümlerini KENDİSİ kaldırır; böylece React
    // unmount ederken div'i boş görür ve removeChild uyuşmazlığı (beyaz ekran) olmaz.
    const safeStop = async () => {
      if (stopped) return;
      stopped = true;
      try { await scanner.stop(); } catch { /* zaten durmuş */ }
      try { scanner.clear(); } catch { /* yok say */ }
    };

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 5, qrbox: { width: 280, height: 280 }, aspectRatio: 1 },
        async (decodedText) => {
          if (processedRef.current) return;
          processedRef.current = true;
          await safeStop();

          try {
            // Yeni format: {"v":1,"vault":"uuid"}
            const data = JSON.parse(decodedText);
            if (data.v !== 1 || !data.vault) {
              throw new Error('Invalid format');
            }
            setState({ status: 'connecting' });
            onConnect(data.vault);
            setState({ status: 'success', vaultId: data.vault });
          } catch {
            // Eski format olabilir (1:compressed...) veya geçersiz QR
            if (decodedText.startsWith('1:')) {
              setState({ status: 'error', messageKey: 'qr.errorOldFormat' });
            } else {
              setState({ status: 'error', messageKey: 'qr.errorInvalid' });
            }
          }
        },
        () => {
          // no QR found in frame - ignore
        },
      )
      .catch(() => {
        setState({
          status: 'error',
          messageKey: 'qr.errorCamera',
        });
      });

    return () => { safeStop(); };
  }, [onConnect]);

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[100]">
      <div className="absolute top-4 right-4 z-20">
        <button onClick={onClose} className="p-2 text-white/80 hover:text-white">
          <X size={24} />
        </button>
      </div>

      {/* #qr-reader HER ZAMAN mount'ta kalır; state değişince React ile kaldırılmaz
          (html5-qrcode DOM'u ile unmount yarışı beyaz ekrana yol açıyordu). Tarama
          dışında CSS ile gizlenir, ilgili durum katmanı üste biner. */}
      <div className={state.status === 'scanning' ? 'flex flex-col items-center' : 'hidden'}>
        <div className="flex items-center gap-2 text-white mb-4">
          <Camera size={20} />
          <p className="text-sm font-medium">{t('qr.showToCamera')}</p>
        </div>
        <div
          id="qr-reader"
          className="w-[320px] h-[320px] overflow-hidden rounded-2xl"
        />
        <button
          onClick={onClose}
          className="mt-6 px-6 py-2.5 border border-white/30 text-white rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
        >
          {t('common.cancel')}
        </button>
      </div>

      {state.status === 'connecting' && (
        <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full text-center">
          <Loader2 size={48} className="text-vault-600 animate-spin mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">{t('qr.connecting')}</h3>
          <p className="text-sm text-gray-600">{t('qr.connectingDesc')}</p>
        </div>
      )}

      {state.status === 'success' && (
        <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">{t('qr.successTitle')}</h3>
          <p className="text-sm text-gray-600">
            {t('qr.successDesc')}
          </p>
          <button
            onClick={onClose}
            className="w-full mt-4 py-2.5 bg-vault-800 text-white rounded-xl text-sm font-medium hover:bg-vault-700 transition-colors"
          >
            {t('common.ok')}
          </button>
        </div>
      )}

      {state.status === 'error' && (
        <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">{t('common.error')}</h3>
          <p className="text-sm text-gray-600">{t(state.messageKey)}</p>
          <button
            onClick={onClose}
            className="w-full mt-4 py-2.5 bg-vault-800 text-white rounded-xl text-sm font-medium hover:bg-vault-700 transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      )}
    </div>
  );
}
