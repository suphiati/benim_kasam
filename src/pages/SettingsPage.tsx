import { useRef, useEffect } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { Download, Upload, Trash2, Smartphone, Wifi, WifiOff, Unlink, Fingerprint, Coins } from 'lucide-react';
import { useState } from 'react';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { syncService } from '../services/firebaseSyncService';
import { isNative, getBiometricStatus, isLockEnabled, setLockEnabled, authenticate } from '../services/biometric';
import { BASE_CURRENCIES, CURRENCY_META } from '../utils/currency';

interface SettingsPageProps {
  isConnected: boolean;
  onDisconnect: () => void;
}

export function SettingsPage({ isConnected, onDisconnect }: SettingsPageProps) {
  const exportData = useVaultStore((s) => s.exportData);
  const importData = useVaultStore((s) => s.importData);
  const transactions = useVaultStore((s) => s.transactions);
  const baseCurrency = useVaultStore((s) => s.baseCurrency);
  const setBaseCurrency = useVaultStore((s) => s.setBaseCurrency);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Biyometrik kilit (yalnız native)
  const [lockSupported, setLockSupported] = useState(false);
  const [lockEnabled, setLockEnabledState] = useState(false);

  useEffect(() => {
    if (!isNative()) return;
    (async () => {
      const status = await getBiometricStatus();
      setLockSupported(status.deviceSecure);
      setLockEnabledState(await isLockEnabled());
    })();
  }, []);

  const handleToggleLock = async () => {
    // Kilidi kapatmadan önce kimlik doğrula (yetkisiz kapatmayı önle)
    if (lockEnabled) {
      const ok = await authenticate();
      if (!ok) return;
    }
    const next = !lockEnabled;
    await setLockEnabled(next);
    setLockEnabledState(next);
  };

  const vaultId = syncService.getVaultId();

  // PWA install prompt
  useState(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  });

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benim-kasam-yedek-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importData(text);
      setImportStatus(`Başarıyla içe aktarıldı!`);
      setTimeout(() => setImportStatus(null), 3000);
    } catch {
      setImportStatus('Hata: Dosya okunamadı veya geçersiz format.');
      setTimeout(() => setImportStatus(null), 3000);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearAll = async () => {
    const store = useVaultStore.getState();
    for (const tx of store.transactions) {
      await store.deleteTransaction(tx.id);
    }
    setShowClearConfirm(false);
  };

  const handleDisconnect = () => {
    onDisconnect();
    setShowDisconnectConfirm(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setDeferredPrompt(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Ayarlar</h2>

      <div className="space-y-3">
        {/* PWA Yükle */}
        {deferredPrompt && (
          <div className="bg-vault-50 border border-vault-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Smartphone size={24} className="text-vault-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Uygulamayı Yükle</p>
                <p className="text-xs text-gray-500">Ana ekranınıza ekleyerek daha hızlı erişin</p>
              </div>
              <button
                type="button"
                onClick={handleInstall}
                className="px-4 py-2 bg-vault-800 text-white rounded-lg text-sm font-medium hover:bg-vault-700 transition-colors"
              >
                Yükle
              </button>
            </div>
          </div>
        )}

        {/* Taban para birimi */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Coins size={24} className="text-vault-600" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Para Birimi</p>
              <p className="text-xs text-gray-500">Kasanızın raporlanacağı para birimi. İşlem girişi ₺ olarak kalır.</p>
            </div>
          </div>
          <div className="flex gap-2">
            {BASE_CURRENCIES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={baseCurrency === c}
                onClick={() => setBaseCurrency(c)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  baseCurrency === c ? 'bg-vault-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {CURRENCY_META[c].symbol} {c}
              </button>
            ))}
          </div>
        </div>

        {/* Biyometrik Kilit (yalnız native) */}
        {lockSupported && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Fingerprint size={24} className="text-vault-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Biyometrik Kilit</p>
                <p className="text-xs text-gray-500">Uygulamayı açarken parmak izi / yüz veya PIN iste</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={lockEnabled}
                onClick={handleToggleLock}
                className={`relative w-11 h-6 rounded-full transition-colors ${lockEnabled ? 'bg-vault-700' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${lockEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {/* Senkronizasyon */}
        {vaultId && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Senkronizasyon</h3>
              <div className="flex items-center gap-2 mt-1">
                {isConnected ? (
                  <>
                    <Wifi size={14} className="text-green-500" />
                    <p className="text-xs text-green-600">Bağlı - Otomatik senkronizasyon aktif</p>
                  </>
                ) : (
                  <>
                    <WifiOff size={14} className="text-gray-400" />
                    <p className="text-xs text-gray-500">Bağlantı kurulamadı</p>
                  </>
                )}
              </div>
            </div>

            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs text-gray-500">Kasa ID</p>
              <p className="text-sm font-mono text-gray-700 mt-0.5">
                {vaultId.slice(0, 8)}...{vaultId.slice(-4)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDisconnectConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left"
            >
              <Unlink size={20} className="text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-600">Eşleştirmeyi Kaldır</p>
                <p className="text-xs text-gray-500">Cihazlar arası senkronizasyonu durdur</p>
              </div>
            </button>
          </div>
        )}

        {/* Veri Yönetimi */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Veri Yönetimi</h3>
            <p className="text-xs text-gray-500 mt-0.5">Toplam {transactions.length} işlem kaydı</p>
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50"
          >
            <Download size={20} className="text-vault-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Verileri Dışa Aktar</p>
              <p className="text-xs text-gray-500">Tüm işlemlerinizi JSON dosyası olarak indirin</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50"
          >
            <Upload size={20} className="text-vault-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Verileri İçe Aktar</p>
              <p className="text-xs text-gray-500">Daha önce dışa aktarılmış JSON dosyasını yükleyin</p>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left"
          >
            <Trash2 size={20} className="text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-600">Tüm Verileri Sil</p>
              <p className="text-xs text-gray-500">Bu işlem geri alınamaz</p>
            </div>
          </button>
        </div>

        {importStatus && (
          <div className={`rounded-lg p-3 text-sm ${importStatus.includes('Hata') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {importStatus}
          </div>
        )}

        {/* Uygulama Bilgisi */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="font-bold text-vault-800 text-lg">BenimKasam</p>
          <p className="text-xs text-gray-400 mt-1">Kişisel Kasa Takip Uygulaması</p>
          <p className="text-[10px] text-gray-300 mt-2">v1.1.0</p>
        </div>
      </div>

      {showClearConfirm && (
        <ConfirmModal
          title="Tüm Verileri Sil"
          message="Tüm işlem kayıtlarınız kalıcı olarak silinecek. Bu işlem geri alınamaz!"
          confirmLabel="Hepsini Sil"
          onConfirm={handleClearAll}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}

      {showDisconnectConfirm && (
        <ConfirmModal
          title="Eşleştirmeyi Kaldır"
          message="Cihazlar arası otomatik senkronizasyon durdurulacak. Yerel verileriniz silinmez."
          confirmLabel="Kaldır"
          onConfirm={handleDisconnect}
          onCancel={() => setShowDisconnectConfirm(false)}
        />
      )}
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}
