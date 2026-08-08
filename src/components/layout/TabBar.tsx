import { LayoutDashboard, List, PlusCircle, Settings, type LucideIcon } from 'lucide-react';
import { useT } from '../../hooks/useT';
import type { TKey } from '../../i18n';

export type TabId = 'vault' | 'transactions' | 'add' | 'settings';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

// Metin değil ANAHTAR tut: modül seviyesinde çevirsek dil değişince donardı.
// Boş-durum cümleleri de bu anahtarları kullanır (VaultPage/TransactionsPage),
// yani sekme adı tek yerden gelir - biri çevrilip diğeri kalamaz.
const tabs: { id: TabId; labelKey: TKey; icon: LucideIcon }[] = [
  { id: 'vault', labelKey: 'nav.vault', icon: LayoutDashboard },
  { id: 'add', labelKey: 'nav.add', icon: PlusCircle },
  { id: 'transactions', labelKey: 'nav.transactions', icon: List },
  { id: 'settings', labelKey: 'nav.settings', icon: Settings },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const { t } = useT();

  return (
    <nav
      className="bg-white border-t border-gray-200 flex sticky bottom-0 z-50"
      // Edge-to-edge: navigation bar alanı kadar alttan güvenli boşluk (butonlar çubuğun altına girmesin).
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 transition-colors ${
              isActive
                ? 'text-vault-800 border-t-2 border-vault-800 -mt-px'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{t(tab.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
