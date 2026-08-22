import { useState, useEffect, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Share2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useVaultStore } from '../../store/vaultStore';
import { syncService } from '../../services/firebaseSyncService';
import { useT } from '../../hooks/useT';

interface QrGenerateModalProps {
  onClose: () => void;
  onConnect: (vaultId: string) => void;
}

type Status = 'preparing' | 'ready' | 'paired' | 'error';

// Hazırlık takılırsa ekran sonsuza kadar dönmesin: RTDB set/update sunucu onayını
// bekler ve ağ yoksa promise HİÇ çözülmez. Bu süre sonunda hata + "tekrar dene".
const PREPARE_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

export function QrGenerateModal({ onClose, onConnect }: QrGenerateModalProps) {
  const transactions = useVaultStore((s) => s.transactions);
  const { t, tp } = useT();
  const [status, setStatus] = useState<Status>('preparing');
  const [attempt, setAttempt] = useState(0);

  // Eşleşme GERÇEKTEN oldu mu? Sadece QR ekranını açmak cihazı senkron saymamalı.
  const pairedRef = useRef(false);
  // Şu an hangi kasa hazırlanıyor. StrictMode effect'i mount→cleanup→mount diye iki
  // kez çalıştırır; bu olmadan cleanup, ikinci geçişin AYNI kasasını silerdi.
  const activeIdRef = useRef<string | null>(null);

  // Zaten eşleşmiş bir kasa varsa onu kullan; yoksa YENİ kimlik üret. Yeni kimlik,
  // karşı cihaz QR'ı okuyana kadar localStorage'a YAZILMAZ (aşağıdaki commit).
  // Render sırasında türetilir: QR, hazırlık daha bitmeden çizilebilir hale gelir.
  const { id: vaultId, isFresh } = useMemo(() => {
    const existing = syncService.getVaultId();
    return { id: existing ?? crypto.randomUUID(), isFresh: !existing };
  }, [attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = vaultId;
    activeIdRef.current = id;
    let cancelled = false;
    let stopWatch: (() => void) | null = null;
    let refresh: ReturnType<typeof setInterval> | null = null;

    const commit = () => {
      if (pairedRef.current) return;
      pairedRef.current = true;
      syncService.setVaultId(id);
      onConnect(id);
    };

    const prepare = async () => {
      try {
        // Kasayı hazırla: üyelik + veri + davet penceresi. Hepsi tek bir zaman
        // sınırı altında; biri takılırsa kullanıcı hata görür, spinner değil.
        await withTimeout(
          (async () => {
            const ok = await syncService.joinVault(id);
            if (!ok) throw new Error('sync-unavailable');
            await syncService.uploadAllTransactions(transactions, id);
          })(),
          PREPARE_TIMEOUT_MS,
        );
        if (cancelled) return;

        // Davet penceresini aç: bu QR açıkken okuyan yeni cihaz kasaya katılabilir (Faz-2).
        syncService.openInviteWindow(id);
        // QR ekranı uzun süre açık kalırsa pencereyi tazele; kullanıcı "birkaç dakika
        // içinde okut" baskısı hissetmesin. Modal kapanınca interval durur.
        refresh = setInterval(() => syncService.openInviteWindow(id), 10 * 60 * 1000);

        if (isFresh) {
          // Yeni kasa: bağlanmak için karşı cihazın QR'ı okumasını BEKLE.
          setStatus('ready');
          stopWatch = syncService.watchPeerJoin(id, () => {
            if (cancelled) return;
            commit();
            setStatus('paired');
          });
        } else {
          // Zaten eşleşmiş kasaya 3. cihaz davet ediliyor: bu cihaz hâlâ üye,
          // bağlantısını sürdür (davranış eskisiyle aynı).
          commit();
          setStatus('ready');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    };
    prepare();

    return () => {
      cancelled = true;
      if (refresh) clearInterval(refresh);
      stopWatch?.();
      // Kimse okumadıysa geriye sahipsiz kasa BIRAKMA. Eskiden ekran açılır açılmaz
      // vaultId localStorage'a yazıldığı için, QR'ı kimseye okutmadan kapatan cihaz
      // kendi kendine "senkronize" görünmeye devam ediyordu.
      if (!isFresh || pairedRef.current) return;
      if (activeIdRef.current === id) activeIdRef.current = null;
      // Bir sonraki tick'e ertele: effect aynı id ile yeniden kurulduysa (StrictMode)
      // activeIdRef geri dolar ve silme atlanır.
      setTimeout(() => {
        if (activeIdRef.current !== id && !pairedRef.current) syncService.abandonVault(id);
      }, 0);
    };
  }, [vaultId, isFresh]); // eslint-disable-line react-hooks/exhaustive-deps

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
          <h3 className="text-lg font-bold text-gray-900">{t('qr.pairTitle')}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {status === 'preparing' ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 size={32} className="text-vault-600 animate-spin mb-3" />
            <p className="text-sm text-gray-500">{t('qr.uploading')}</p>
          </div>
        ) : status === 'error' ? (
          <div className="flex flex-col items-center py-6 text-center">
            <AlertCircle size={40} className="text-red-500 mb-3" />
            <p className="text-sm text-gray-600">{t('qr.errorPrepare')}</p>
            <button
              onClick={() => { setStatus('preparing'); setAttempt((n) => n + 1); }}
              className="w-full mt-4 py-2.5 bg-vault-800 text-white rounded-xl text-sm font-medium hover:bg-vault-700 transition-colors"
            >
              {t('qr.retry')}
            </button>
          </div>
        ) : status === 'paired' ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle size={40} className="text-green-500 mb-3" />
            <h4 className="text-base font-bold text-gray-900 mb-1">{t('qr.successTitle')}</h4>
            <p className="text-sm text-gray-600">{t('qr.successDesc')}</p>
            <button
              onClick={onClose}
              className="w-full mt-4 py-2.5 bg-vault-800 text-white rounded-xl text-sm font-medium hover:bg-vault-700 transition-colors"
            >
              {t('common.ok')}
            </button>
          </div>
        ) : qrContent ? (
          <>
            <div className="flex justify-center p-4 bg-white rounded-xl border border-gray-100">
              <QRCodeSVG value={qrContent} size={280} level="M" />
            </div>
            <p className="text-center text-sm text-gray-500 mt-3">
              {tp('qr.synced', transactions.length)}
            </p>
            <p className="text-center text-xs text-gray-400 mt-1">
              {t('qr.scanHint')}
            </p>
            {'share' in navigator && (
              <button
                onClick={handleShare}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-vault-800 text-white rounded-xl text-sm font-medium hover:bg-vault-700 transition-colors"
              >
                <Share2 size={16} />
                {t('qr.share')}
              </button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
