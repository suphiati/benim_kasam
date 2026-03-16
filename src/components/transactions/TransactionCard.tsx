import { Trash2, Pencil } from 'lucide-react';
import type { Transaction } from '../../types';
import { ASSET_CONFIG } from '../../constants/assets';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';

interface TransactionCardProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

export function TransactionCard({ transaction, onDelete, onEdit }: TransactionCardProps) {
  const config = ASSET_CONFIG[transaction.assetType];

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: config.color }}
          >
            {config.unit === '$' ? '$' : config.unit === '€' ? '€' : 'Au'}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{config.label}</p>
            <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(transaction)}
            className="p-1.5 text-gray-400 hover:text-vault-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-gray-400">Miktar</p>
          <p className="font-medium">{formatNumber(transaction.amount)} {config.unit}</p>
        </div>
        <div>
          <p className="text-gray-400">Birim Fiyat</p>
          <p className="font-medium">{formatCurrency(transaction.unitPrice)}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400">Toplam</p>
          <p className="font-bold text-gray-900">{formatCurrency(transaction.totalCost)}</p>
        </div>
      </div>
      {transaction.note && (
        <p className="mt-2 text-xs text-gray-400 italic">📝 {transaction.note}</p>
      )}
    </div>
  );
}
