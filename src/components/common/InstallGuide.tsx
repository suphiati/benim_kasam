import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Smartphone, Share, PlusSquare, MoreVertical, Download, X } from 'lucide-react';
import { useT } from '../../hooks/useT';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

function getDeviceInfo() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isSamsung = /SamsungBrowser/.test(ua);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone);
  return { isIOS, isAndroid, isSamsung, isStandalone };
}

export function InstallGuide() {
  const { t } = useT();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const { isIOS, isAndroid, isSamsung, isStandalone } = getDeviceInfo();

  useEffect(() => {
    if (isStandalone) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => setInstalled(true);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, [isStandalone]);

  // Native app (Capacitor) zaten kurulu — PWA yükleme rehberi anlamsız
  if (Capacitor.isNativePlatform()) return null;

  // Zaten yüklü veya kapatıldı
  if (installed || dismissed) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setDeferredPrompt(null);
  };

  // Chrome/Edge: Otomatik yükleme butonu
  if (deferredPrompt) {
    return (
      <div className="bg-gradient-to-r from-vault-700 to-vault-800 text-white rounded-2xl p-4 mx-4 mt-4 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-400/20 rounded-xl flex items-center justify-center">
              <Download size={20} className="text-gold-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">{t('install.title')}</p>
              <p className="text-vault-300 text-xs mt-0.5">{t('install.subtitleAuto')}</p>
            </div>
          </div>
          <button type="button" title={t('common.close')} onClick={() => setDismissed(true)} className="text-vault-400 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>
        <button
          type="button"
          onClick={handleInstall}
          className="mt-3 w-full bg-gold-400 text-vault-900 py-2.5 rounded-xl font-bold text-sm hover:bg-gold-300 transition-colors"
        >
          {t('install.action')}
        </button>
      </div>
    );
  }

  // iOS Safari: Manuel talimat
  if (isIOS) {
    return (
      <div className="bg-gradient-to-r from-vault-700 to-vault-800 text-white rounded-2xl p-4 mx-4 mt-4 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-400/20 rounded-xl flex items-center justify-center">
              <Smartphone size={20} className="text-gold-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">{t('install.title')}</p>
              <p className="text-vault-300 text-xs mt-0.5">{t('install.subtitleIos')}</p>
            </div>
          </div>
          <button type="button" title={t('common.close')} onClick={() => setDismissed(true)} className="text-vault-400 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>
        {/* Adımlar iOS'un GERÇEK buton adlarını alıntılar - İngilizcesi birebir
            çeviri değil, Safari'nin kendi metni ("Add to Home Screen" / "Add"). */}
        <div className="mt-3 space-y-2">
          <Step num={1} icon={<Share size={14} />} text={t('install.ios.step1')} />
          <Step num={2} icon={<PlusSquare size={14} />} text={t('install.ios.step2')} />
          <Step num={3} icon={<Smartphone size={14} />} text={t('install.ios.step3')} />
        </div>
      </div>
    );
  }

  // Android (Samsung/diğer): Manuel talimat
  if (isAndroid) {
    return (
      <div className="bg-gradient-to-r from-vault-700 to-vault-800 text-white rounded-2xl p-4 mx-4 mt-4 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-400/20 rounded-xl flex items-center justify-center">
              <Smartphone size={20} className="text-gold-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">{t('install.title')}</p>
              <p className="text-vault-300 text-xs mt-0.5">{t('install.subtitleAndroid')}</p>
            </div>
          </div>
          <button type="button" title={t('common.close')} onClick={() => setDismissed(true)} className="text-vault-400 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>
        {/* Adım 2 Android menüsünün GERÇEK metnini alıntılar
            ("Add to Home screen" / "Install app") - birebir çeviri değil. */}
        <div className="mt-3 space-y-2">
          <Step num={1} icon={<MoreVertical size={14} />} text={isSamsung ? t('install.android.step1Samsung') : t('install.android.step1Other')} />
          <Step num={2} icon={<Download size={14} />} text={t('install.android.step2')} />
        </div>
      </div>
    );
  }

  // Desktop veya bilinmeyen cihaz - gösterme
  return null;
}

function Step({ num, icon, text }: { num: number; icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
      <div className="w-5 h-5 rounded-full bg-gold-400 text-vault-900 flex items-center justify-center text-[10px] font-bold shrink-0">
        {num}
      </div>
      <span className="text-vault-300">{icon}</span>
      <span className="text-xs">{text}</span>
    </div>
  );
}
