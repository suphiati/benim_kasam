import { TrendingUp, TrendingDown, Wallet, PiggyBank, BarChart3 } from 'lucide-react';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface TotalVaultCardProps {
  totalValue: number;
  totalCost: number;
  totalRealizedPL: number;
  totalUnrealizedPL: number;
  totalPL: number;
  totalPLPercent: number;
}

export function TotalVaultCard({ totalValue, totalCost, totalRealizedPL, totalUnrealizedPL, totalPL, totalPLPercent }: TotalVaultCardProps) {
  const isProfit = totalPL >= 0;

  return (
    <div className="bg-gradient-to-br from-vault-800 to-vault-900 text-white rounded-2xl p-5 mx-4 mt-4 shadow-lg">
      <div className="flex items-center gap-2 mb-1">
        <Wallet size={16} className="text-gold-400" />
        <p className="text-vault-300 text-sm">Toplam Kasa Değeri</p>
      </div>
      <p className="text-3xl font-bold tracking-tight">{formatCurrency(totalValue)}</p>

      <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-vault-700">
        <div className="flex items-start gap-2">
          <PiggyBank size={14} className="text-vault-400 mt-0.5" />
          <div>
            <p className="text-vault-400 text-[10px] uppercase tracking-wider">Toplam Maliyet</p>
            <p className="text-sm font-medium">{formatCurrency(totalCost)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 justify-end text-right">
          <div>
            <p className="text-vault-400 text-[10px] uppercase tracking-wider">Toplam K/Z</p>
            <div className="flex items-center gap-1 justify-end">
              {isProfit ? <TrendingUp size={12} className="text-green-400" /> : <TrendingDown size={12} className="text-red-400" />}
              <span className={`text-sm font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(totalPL)}
              </span>
            </div>
            <span className={`text-[10px] ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              ({formatPercent(totalPLPercent)})
            </span>
          </div>
          <BarChart3 size={14} className={`mt-0.5 ${isProfit ? 'text-green-400' : 'text-red-400'}`} />
        </div>
      </div>

      {(totalRealizedPL !== 0) && (
        <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-vault-700/50 text-xs">
          <div>
            <p className="text-vault-400">Gerçekleşen K/Z</p>
            <p className={`font-medium ${totalRealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(totalRealizedPL)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-vault-400">Gerçekleşmemiş K/Z</p>
            <p className={`font-medium ${totalUnrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(totalUnrealizedPL)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
