import { useState, useEffect } from 'react';
import type { AssetType, Transaction } from '../../types';
import { useVaultStore } from '../../store/vaultStore';
import { AssetTypePicker } from './AssetTypePicker';
import { todayISO } from '../../utils/formatters';
import { Save } from 'lucide-react';

interface TransactionFormProps {
  editingTransaction?: Transaction | null;
  onSaved?: () => void;
}

export function TransactionForm({ editingTransaction, onSaved }: TransactionFormProps) {
  const addTransaction = useVaultStore((s) => s.addTransaction);
  const editTransaction = useVaultStore((s) => s.editTransaction);
  const liveRates = useVaultStore((s) => s.liveRates);

  const [assetType, setAssetType] = useState<AssetType | null>(editingTransaction?.assetType ?? null);
  const [date, setDate] = useState(editingTransaction?.date ?? todayISO());
  const [amount, setAmount] = useState(editingTransaction?.amount.toString() ?? '');
  const [unitPrice, setUnitPrice] = useState(editingTransaction?.unitPrice.toString() ?? '');
  const [note, setNote] = useState(editingTransaction?.note ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (assetType && !editingTransaction) {
      const rate = liveRates.find((r) => r.assetType === assetType);
      if (rate) {
        setUnitPrice(rate.sellPrice.toFixed(2));
      }
    }
  }, [assetType, liveRates, editingTransaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetType || !amount || !unitPrice) return;

    setSaving(true);
    try {
      if (editingTransaction) {
        await editTransaction(editingTransaction.id, {
          assetType,
          date,
          amount: parseFloat(amount),
          unitPrice: parseFloat(unitPrice),
          note: note || undefined,
        });
      } else {
        await addTransaction({
          assetType,
          date,
          amount: parseFloat(amount),
          unitPrice: parseFloat(unitPrice),
          note: note || undefined,
        });
      }
      if (!editingTransaction) {
        setAssetType(null);
        setAmount('');
        setUnitPrice('');
        setNote('');
        setDate(todayISO());
      }
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const isValid = assetType && parseFloat(amount) > 0 && parseFloat(unitPrice) > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Varlık Tipi</label>
        <AssetTypePicker selected={assetType} onSelect={setAssetType} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vault-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Miktar</label>
          <input
            type="number"
            step="any"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vault-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Birim Fiyat (₺)</label>
          <input
            type="number"
            step="any"
            min="0"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="0.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vault-500 focus:border-transparent"
          />
        </div>
      </div>

      {amount && unitPrice && (
        <div className="bg-vault-50 rounded-lg p-3 text-sm">
          <span className="text-gray-500">Toplam: </span>
          <span className="font-bold text-vault-800">
            {(parseFloat(amount || '0') * parseFloat(unitPrice || '0')).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Not (opsiyonel)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ör: Vakıfbank'tan alındı"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vault-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={!isValid || saving}
        className="w-full bg-vault-800 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-vault-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save size={18} />
        {editingTransaction ? 'Güncelle' : 'Kaydet'}
      </button>
    </form>
  );
}
