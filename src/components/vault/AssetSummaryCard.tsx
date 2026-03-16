import { TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import type { AssetSummary } from '../../types';
import { ASSET_CONFIG } from '../../constants/assets';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';

interface AssetSummaryCardProps {
  summary: AssetSummary;
}

export function AssetSummaryCard({ summary }: AssetSummaryCardProps) {
  const config = ASSET_CONFIG[summary.assetType];
  const isProfit = summary.totalPL >= 0;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: config.color }}
          >
            {config.category === 'gold' ? 'Au' : config.category === 'commodity' ? 'Ag' : config.unit.substring(0, 2)}
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
              {formatPercent(summary.unrealizedPLPercent)}
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

      {/* İşlem sayıları */}
      <div className="flex gap-3 mt-2 text-[10px] text-gray-400">
        <div className="flex items-center gap-1">
          <ArrowDownCircle size={10} className="text-green-500" />
          {summary.buyCount} alım ({formatNumber(summary.totalBought)} {config.unit})
        </div>
        {summary.sellCount > 0 && (
          <div className="flex items-center gap-1">
            <ArrowUpCircle size={10} className="text-red-500" />
            {summary.sellCount} satım ({formatNumber(summary.totalSold)} {config.unit})
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-100">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Toplam K/Z</span>
          <span className={`font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(summary.totalPL)}
          </span>
        </div>
        {summary.realizedPL !== 0 && (
          <div className="flex justify-between items-center text-[10px] mt-1">
            <span className="text-gray-400">Gerçekleşen: {formatCurrency(summary.realizedPL)}</span>
            <span className="text-gray-400">Gerçekleşmemiş: {formatCurrency(summary.unrealizedPL)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
