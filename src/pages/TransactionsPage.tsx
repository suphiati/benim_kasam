import { useState, useMemo } from 'react';
import type { AssetType, Transaction } from '../types';
import { useVaultStore } from '../store/vaultStore';
import { ASSET_CONFIG } from '../constants/assets';
import { FilterBar } from '../components/transactions/FilterBar';
import { TransactionCard } from '../components/transactions/TransactionCard';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { TransactionForm } from '../components/form/TransactionForm';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { List, X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

export function TransactionsPage() {
  const transactions = useVaultStore((s) => s.transactions);
  const deleteTransaction = useVaultStore((s) => s.deleteTransaction);

  const [filter, setFilter] = useState<AssetType | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    let result = transactions;
    if (filter) result = result.filter((t) => t.assetType === filter);
    if (typeFilter === 'buy') result = result.filter((t) => t.type === 'buy' || !t.type);
    if (typeFilter === 'sell') result = result.filter((t) => t.type === 'sell');
    return [...result].sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filter, typeFilter]);

  // Filtrelenmiş toplamlar
  const filterSummary = useMemo(() => {
    if (filtered.length === 0) return null;
    const buys = filtered.filter((t) => t.type === 'buy' || !t.type);
    const sells = filtered.filter((t) => t.type === 'sell');
    const totalBuyCost = buys.reduce((s, t) => s + t.totalCost, 0);
    const totalSellRevenue = sells.reduce((s, t) => s + t.totalCost, 0);
    const totalBuyAmount = buys.reduce((s, t) => s + t.amount, 0);
    const totalSellAmount = sells.reduce((s, t) => s + t.amount, 0);

    const unit = filter ? ASSET_CONFIG[filter].unit : null;
    return { totalBuyCost, totalSellRevenue, totalBuyAmount, totalSellAmount, unit, buyCount: buys.length, sellCount: sells.length };
  }, [filtered, filter]);

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
      <h2 className="text-lg font-bold text-gray-900 mb-3">İşlemlerim ({transactions.length})</h2>

      {/* Varlık filtresi */}
      <FilterBar selected={filter} onSelect={setFilter} />

      {/* Alım/Satım filtresi */}
      <div className="flex gap-2 mt-2">
        {(['all', 'buy', 'sell'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              typeFilter === t ? 'bg-vault-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === 'all' ? 'Tümü' : t === 'buy' ? 'Alımlar' : 'Satımlar'}
          </button>
        ))}
      </div>

      {/* Filtrelenmiş toplamlar */}
      {filterSummary && (
        <div className="mt-3 bg-gray-50 rounded-xl p-3 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-medium">Filtrelenmiş Özet ({filtered.length} işlem)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <ArrowDownCircle size={12} className="text-green-500" />
              <span className="text-gray-600">
                {filterSummary.buyCount} alım
                {filterSummary.unit && ` (${formatNumber(filterSummary.totalBuyAmount)} ${filterSummary.unit})`}
              </span>
            </div>
            <div className="text-right font-medium text-gray-800">
              {formatCurrency(filterSummary.totalBuyCost)}
            </div>
            {filterSummary.sellCount > 0 && (
              <>
                <div className="flex items-center gap-1">
                  <ArrowUpCircle size={12} className="text-red-500" />
                  <span className="text-gray-600">
                    {filterSummary.sellCount} satım
                    {filterSummary.unit && ` (${formatNumber(filterSummary.totalSellAmount)} ${filterSummary.unit})`}
                  </span>
                </div>
                <div className="text-right font-medium text-gray-800">
                  {formatCurrency(filterSummary.totalSellRevenue)}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {filtered.map((tx) => (
          <TransactionCard
            key={tx.id}
            transaction={tx}
            onDelete={setDeleteId}
            onEdit={setEditingTx}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-gray-400 mt-8">
          Bu filtrelere uygun işlem bulunmuyor.
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
              <button type="button" onClick={() => setEditingTx(null)} className="p-1 text-gray-400 hover:text-gray-600" title="Kapat">
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
