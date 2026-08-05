import { useState, useEffect, useMemo } from 'react';
import type { AssetType, Transaction, TransactionType } from '../../types';
import { useVaultStore } from '../../store/vaultStore';
import { AssetTypePicker } from './AssetTypePicker';
import { formatCurrency, todayISO } from '../../utils/formatters';
import { getFxToday, toBase, CURRENCY_META } from '../../utils/currency';
import { useT } from '../../hooks/useT';
import { Save, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface TransactionFormProps {
  editingTransaction?: Transaction | null;
  onSaved?: () => void;
}

export function TransactionForm({ editingTransaction, onSaved }: TransactionFormProps) {
  const addTransaction = useVaultStore((s) => s.addTransaction);
  const editTransaction = useVaultStore((s) => s.editTransaction);
  const liveRates = useVaultStore((s) => s.liveRates);
  const baseCurrency = useVaultStore((s) => s.baseCurrency);
  const { t, locale } = useT();
  const fxToday = useMemo(() => getFxToday(liveRates), [liveRates]);

  const [txType, setTxType] = useState<TransactionType>(editingTransaction?.type ?? 'buy');
  const [assetType, setAssetType] = useState<AssetType | null>(editingTransaction?.assetType ?? null);
  const [date, setDate] = useState(editingTransaction?.date ?? todayISO());
  const [amount, setAmount] = useState(editingTransaction?.amount.toString() ?? '');
  const [unitPrice, setUnitPrice] = useState(editingTransaction?.unitPrice.toString() ?? '');
  const [note, setNote] = useState(editingTransaction?.note ?? '');
  const [saving, setSaving] = useState(false);

  const previewTotal = (parseFloat(amount || '0') || 0) * (parseFloat(unitPrice || '0') || 0);

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
          {t('form.buy')}
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
          {t('form.sell')}
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('form.assetType')}</label>
        <AssetTypePicker selected={assetType} onSelect={setAssetType} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.date')}</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vault-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.amount')}</label>
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
          {/* Her dal TAM anahtar (parça birleştirme yok) + sembol düz metinde
              değil enterpolasyonla: giriş her zaman TRY. */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {txType === 'buy'
              ? t('form.priceLabel.buy', { sym: CURRENCY_META.TRY.symbol })
              : t('form.priceLabel.sell', { sym: CURRENCY_META.TRY.symbol })}
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
          <span className="text-gray-500">{txType === 'buy' ? t('form.total.buy') : t('form.total.sell')} </span>
          <span className={`font-bold ${txType === 'buy' ? 'text-green-700' : 'text-red-700'}`}>
            {/* Giriş her zaman TRY: fiyatlar Kapalıçarşı'dan ₺ geliyor ve işlem ₺ ile yapılıyor.
                Taban para yalnızca raporlama katmanı - burada bilinçli olarak TRY sabit.
                Locale yine de geçilir: ayıraçlar dile göre değişir (1.234,56 / 1,234.56). */}
            {formatCurrency(previewTotal, 'TRY', locale)}
          </span>
          {baseCurrency !== 'TRY' && (
            <span className="text-gray-400 ml-1">
              ≈ {formatCurrency(toBase(previewTotal, fxToday, baseCurrency), baseCurrency, locale)}
            </span>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.note')}</label>
        <input
          type="text"
          value={note}
          maxLength={2000}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('form.notePlaceholder')}
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
        {editingTransaction
          ? t('form.submit.update')
          : txType === 'buy'
            ? t('form.submit.buy')
            : t('form.submit.sell')}
      </button>
    </form>
  );
}
