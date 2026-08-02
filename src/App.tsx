import { useState, useEffect } from 'react';
import { useVaultStore } from './store/vaultStore';
import { useRatePolling } from './hooks/useRatePolling';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { useAppLock } from './hooks/useAppLock';
import { Header } from './components/layout/Header';
import { TabBar, type TabId } from './components/layout/TabBar';
import { VaultPage } from './pages/VaultPage';
import { AddTransactionPage } from './pages/AddTransactionPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { BiometricLock } from './components/common/BiometricLock';
import { PrivacyCover } from './components/common/PrivacyCover';
import { useT } from './hooks/useT';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('vault');
  const init = useVaultStore((s) => s.init);
  const isInitialized = useVaultStore((s) => s.isInitialized);
  const { isConnected, connect, disconnect } = useFirebaseSync();
  const { locked, covered, unlock } = useAppLock();
  const { t } = useT();

  useEffect(() => {
    init();
  }, [init]);

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
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}
      {/* Açılış kilidi: tüm ekranı kapatan opak katman + biyometri (kasa görünmez) */}
      {locked && <BiometricLock onUnlock={unlock} />}
      {/* Arka plan gizlilik örtüsü: kilit yokken, uygulama arka plandayken kasayı gizler.
          Biyometri istemez; öne dönünce kalkar. */}
      {!locked && covered && <PrivacyCover />}
    </>
  );
}
