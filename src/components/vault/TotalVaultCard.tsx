import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface TotalVaultCardProps {
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
}

export function TotalVaultCard({ totalValue, totalCost, totalProfitLoss, totalProfitLossPercent }: TotalVaultCardProps) {
  const isProfit = totalProfitLoss >= 0;

  return (
    <div className="bg-gradient-to-br from-vault-800 to-vault-900 text-white rounded-2xl p-5 mx-4 mt-4 shadow-lg">
      <p className="text-vault-300 text-sm mb-1">Toplam Kasa Değeri</p>
      <p className="text-3xl font-bold tracking-tight">{formatCurrency(totalValue)}</p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-vault-700">
        <div>
          <p className="text-vault-400 text-xs">Toplam Maliyet</p>
          <p className="text-sm font-medium">{formatCurrency(totalCost)}</p>
        </div>
        <div className="text-right">
          <p className="text-vault-400 text-xs">Kar / Zarar</p>
          <div className="flex items-center gap-1 justify-end">
            {isProfit ? <TrendingUp size={14} className="text-green-400" /> : <TrendingDown size={14} className="text-red-400" />}
            <span className={`text-sm font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(totalProfitLoss)}
            </span>
            <span className={`text-xs ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              ({formatPercent(totalProfitLossPercent)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
