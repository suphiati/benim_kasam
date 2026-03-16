import { Trash2, Pencil, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
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
  const isBuy = transaction.type === 'buy' || !transaction.type;

  return (
    <div className={`bg-white border rounded-xl p-3 shadow-sm ${isBuy ? 'border-green-100' : 'border-red-100'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: config.color }}
            >
              {config.category === 'gold' ? 'Au' : config.category === 'commodity' ? 'Ag' : config.unit.substring(0, 2)}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center ${isBuy ? 'bg-green-500' : 'bg-red-500'}`}>
              {isBuy ? <ArrowDownCircle size={10} className="text-white" /> : <ArrowUpCircle size={10} className="text-white" />}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-900">{config.label}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isBuy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {isBuy ? 'ALIM' : 'SATIM'}
              </span>
            </div>
            <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Düzenle"
            onClick={() => onEdit(transaction)}
            className="p-1.5 text-gray-400 hover:text-vault-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            title="Sil"
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
          <p className="text-gray-400">{isBuy ? 'Alış' : 'Satış'} Fiyatı</p>
          <p className="font-medium">{formatCurrency(transaction.unitPrice)}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400">Toplam</p>
          <p className={`font-bold ${isBuy ? 'text-gray-900' : 'text-red-600'}`}>{formatCurrency(transaction.totalCost)}</p>
        </div>
      </div>
      {transaction.note && (
        <p className="mt-2 text-xs text-gray-400 italic">{transaction.note}</p>
      )}
    </div>
  );
}
