import { TrendingUp, TrendingDown } from 'lucide-react';
import type { AssetSummary } from '../../types';
import { ASSET_CONFIG } from '../../constants/assets';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';

interface AssetSummaryCardProps {
  summary: AssetSummary;
}

export function AssetSummaryCard({ summary }: AssetSummaryCardProps) {
  const config = ASSET_CONFIG[summary.assetType];
  const isProfit = summary.profitLoss >= 0;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: config.color }}
          >
            {config.unit === '$' ? '$' : config.unit === '€' ? '€' : 'Au'}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{config.label}</p>
            <p className="text-xs text-gray-500">
              {formatNumber(summary.totalAmount)} {config.unit}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            {isProfit ? (
              <TrendingUp size={14} className="text-green-600" />
            ) : (
              <TrendingDown size={14} className="text-red-600" />
            )}
            <span className={`text-sm font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(summary.profitLossPercent)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-2 text-xs">
        <div>
          <p className="text-gray-400">Ort. Maliyet</p>
          <p className="font-medium text-gray-700">{formatCurrency(summary.avgUnitPrice)}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400">Güncel Fiyat</p>
          <p className="font-medium text-gray-700">{formatCurrency(summary.currentUnitPrice)}</p>
        </div>
        <div>
          <p className="text-gray-400">Toplam Maliyet</p>
          <p className="font-medium text-gray-700">{formatCurrency(summary.totalCost)}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400">Güncel Değer</p>
          <p className="font-medium text-gray-700">{formatCurrency(summary.currentValue)}</p>
        </div>
      </div>

      <div className={`mt-3 pt-2 border-t border-gray-100 flex justify-between items-center text-sm`}>
        <span className="text-gray-500">Kar / Zarar</span>
        <span className={`font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(summary.profitLoss)}
        </span>
      </div>
    </div>
  );
}
