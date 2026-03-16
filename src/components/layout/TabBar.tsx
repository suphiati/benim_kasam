import { LayoutDashboard, List, PlusCircle } from 'lucide-react';

export type TabId = 'vault' | 'transactions' | 'add';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs = [
  { id: 'vault' as TabId, label: 'Kasam', icon: LayoutDashboard },
  { id: 'add' as TabId, label: 'Ekle', icon: PlusCircle },
  { id: 'transactions' as TabId, label: 'İşlemler', icon: List },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="bg-white border-t border-gray-200 flex sticky bottom-0 z-50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 transition-colors ${
              isActive
                ? 'text-vault-800 border-t-2 border-vault-800 -mt-px'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
