import { useState, useEffect } from 'react';
import { useVaultStore } from './store/vaultStore';
import { useRatePolling } from './hooks/useRatePolling';
import { Header } from './components/layout/Header';
import { TabBar, type TabId } from './components/layout/TabBar';
import { VaultPage } from './pages/VaultPage';
import { AddTransactionPage } from './pages/AddTransactionPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('vault');
  const init = useVaultStore((s) => s.init);
  const isInitialized = useVaultStore((s) => s.isInitialized);

  useEffect(() => {
    init();
  }, [init]);

  useRatePolling();

  if (!isInitialized) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-vault-500 font-medium">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'vault' && <VaultPage />}
        {activeTab === 'add' && <AddTransactionPage />}
        {activeTab === 'transactions' && <TransactionsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );
}
