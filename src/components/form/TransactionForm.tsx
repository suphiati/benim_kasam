import { useState, useEffect } from 'react';
import type { AssetType, Transaction, TransactionType } from '../../types';
import { useVaultStore } from '../../store/vaultStore';
import { AssetTypePicker } from './AssetTypePicker';
import { todayISO } from '../../utils/formatters';
import { Save, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface TransactionFormProps {
  editingTransaction?: Transaction | null;
  onSaved?: () => void;
}

export function TransactionForm({ editingTransaction, onSaved }: TransactionFormProps) {
  const addTransaction = useVaultStore((s) => s.addTransaction);
  const editTransaction = useVaultStore((s) => s.editTransaction);
  const liveRates = useVaultStore((s) => s.liveRates);

  const [txType, setTxType] = useState<TransactionType>(editingTransaction?.type ?? 'buy');
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
          type: txType,
          assetType,
          date,
          amount: parseFloat(amount),
          unitPrice: parseFloat(unitPrice),
          note: note || undefined,
        });
      } else {
        await addTransaction({
          type: txType,
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
      {/* Alım / Satım Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTxType('buy')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${
            txType === 'buy'
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
        >
          <ArrowDownCircle size={18} />
          Alım
        </button>
        <button
          type="button"
          onClick={() => setTxType('sell')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${
            txType === 'sell'
              ? 'border-red-500 bg-red-50 text-red-700'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
        >
          <ArrowUpCircle size={18} />
          Satım
        </button>
      </div>

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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {txType === 'buy' ? 'Alış' : 'Satış'} Fiyatı (₺)
          </label>
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
        <div className={`rounded-lg p-3 text-sm ${txType === 'buy' ? 'bg-green-50' : 'bg-red-50'}`}>
          <span className="text-gray-500">Toplam {txType === 'buy' ? 'Maliyet' : 'Gelir'}: </span>
          <span className={`font-bold ${txType === 'buy' ? 'text-green-700' : 'text-red-700'}`}>
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
        className={`w-full text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          txType === 'buy'
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        <Save size={18} />
        {editingTransaction ? 'Güncelle' : txType === 'buy' ? 'Alımı Kaydet' : 'Satımı Kaydet'}
      </button>
    </form>
  );
}
