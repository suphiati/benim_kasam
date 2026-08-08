import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useVaultStore } from './store/vaultStore';
import { useRatePolling } from './hooks/useRatePolling';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { useAppLock } from './hooks/useAppLock';
import { useAppUpdate } from './hooks/useAppUpdate';
import { Header } from './components/layout/Header';
import { TabBar, type TabId } from './components/layout/TabBar';
import { VaultPage } from './pages/VaultPage';
import { AddTransactionPage } from './pages/AddTransactionPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { BiometricLock } from './components/common/BiometricLock';
import { PrivacyCover } from './components/common/PrivacyCover';
import { UpdatePrompt } from './components/common/UpdatePrompt';
import { useT } from './hooks/useT';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('vault');
  const init = useVaultStore((s) => s.init);
  const isInitialized = useVaultStore((s) => s.isInitialized);
  const { isConnected, connect, disconnect } = useFirebaseSync();
  const { locked, covered, unlock } = useAppLock();
  const { decision, busy, update, dismiss } = useAppUpdate();
  const { t } = useT();

  useEffect(() => {
    init();
  }, [init]);

  // Edge-to-edge (targetSdk 36): status bar WebView'in altına uzanır. Header koyu
  // (vault-800) olduğundan ikonları BEYAZ yap (Style.Dark = koyu zemin/açık içerik).
  // Header'ın üst safe-area dolgusu status bar alanını vault-800 ile boyar; ikonlar okunur kalır.
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    }
  }, []);

  useRatePolling();

  return (
    <>
      {!isInitialized ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-vault-500 font-medium">{t('common.loading')}</div>
        </div>
      ) : (
        <>
          <Header />
          <main className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'vault' && (
              <VaultPage isConnected={isConnected} onConnect={connect} />
            )}
            {activeTab === 'add' && <AddTransactionPage />}
            {activeTab === 'transactions' && <TransactionsPage />}
            {activeTab === 'settings' && (
              <SettingsPage isConnected={isConnected} onDisconnect={disconnect} />
            )}
          </main>
          {/* Opsiyonel güncelleme şeridi: main ile TabBar arasında. Kilit ekranındayken gizli. */}
          {!locked && <UpdatePrompt decision={decision} busy={busy} onUpdate={update} onDismiss={dismiss} />}
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}
      {/* Açılış kilidi: tüm ekranı kapatan opak katman + biyometri (kasa görünmez) */}
      {locked && <BiometricLock onUnlock={unlock} />}
      {/* Arka plan gizlilik örtüsü: kilit yokken, uygulama arka plandayken kasayı gizler. */}
      {!locked && covered && <PrivacyCover />}
    </>
  );
}
