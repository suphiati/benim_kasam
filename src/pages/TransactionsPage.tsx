import { useState } from 'react';
import type { AssetType, Transaction } from '../types';
import { useVaultStore } from '../store/vaultStore';
import { FilterBar } from '../components/transactions/FilterBar';
import { TransactionCard } from '../components/transactions/TransactionCard';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { TransactionForm } from '../components/form/TransactionForm';
import { List, X } from 'lucide-react';

export function TransactionsPage() {
  const transactions = useVaultStore((s) => s.transactions);
  const deleteTransaction = useVaultStore((s) => s.deleteTransaction);

  const [filter, setFilter] = useState<AssetType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const filtered = filter
    ? transactions.filter((t) => t.assetType === filter)
    : transactions;

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  const handleDelete = () => {
    if (deleteId) {
      deleteTransaction(deleteId);
      setDeleteId(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <List size={64} className="text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-500 mb-1">Henüz İşlem Yok</h2>
        <p className="text-sm text-gray-400">
          İlk işleminizi eklemek için "Ekle" sekmesine gidin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-3">İşlemlerim</h2>
      <FilterBar selected={filter} onSelect={setFilter} />

      <div className="mt-3 space-y-2">
        {sorted.map((tx) => (
          <TransactionCard
            key={tx.id}
            transaction={tx}
            onDelete={setDeleteId}
            onEdit={setEditingTx}
          />
        ))}
      </div>

      {sorted.length === 0 && filter && (
        <p className="text-center text-sm text-gray-400 mt-8">
          Bu kategoride işlem bulunmuyor.
        </p>
      )}

      {deleteId && (
        <ConfirmModal
          title="İşlemi Sil"
          message="Bu işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {editingTx && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[100]" onClick={() => setEditingTx(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">İşlemi Düzenle</h3>
              <button onClick={() => setEditingTx(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <TransactionForm
              editingTransaction={editingTx}
              onSaved={() => setEditingTx(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
