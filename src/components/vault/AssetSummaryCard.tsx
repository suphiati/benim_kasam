import { TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import type { AssetSummary } from '../../types';
import { ASSET_CONFIG, assetLabelKey, assetUnit } from '../../constants/assets';
import { useCurrency } from '../../hooks/useCurrency';
import { useT } from '../../hooks/useT';

interface AssetSummaryCardProps {
  summary: AssetSummary;
}

export function AssetSummaryCard({ summary }: AssetSummaryCardProps) {
  const { format } = useCurrency();
  const { t, tp, formatNumber, formatPercent } = useT();
  const config = ASSET_CONFIG[summary.assetType];
  // Rozet config.unit'ten (sabit), görünen birim çeviriden gelir.
  const unit = assetUnit(summary.assetType, t);
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
            <p className="text-sm font-semibold text-gray-900">{t(assetLabelKey(summary.assetType))}</p>
            <p className="text-xs text-gray-500">
              {formatNumber(summary.totalAmount)} {unit}
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
          <p className="text-gray-400">{t('vault.avgCost')}</p>
          <p className="font-medium text-gray-700">{format(summary.avgUnitPrice)}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400">{t('vault.currentPrice')}</p>
          <p className="font-medium text-gray-700">{format(summary.currentUnitPrice)}</p>
        </div>
        <div>
          <p className="text-gray-400">{t('vault.totalCost')}</p>
          <p className="font-medium text-gray-700">{format(summary.totalCost)}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400">{t('vault.currentValue')}</p>
          <p className="font-medium text-gray-700">{format(summary.currentValue)}</p>
        </div>
      </div>

      {/* İşlem sayıları */}
      <div className="flex gap-3 mt-2 text-[10px] text-gray-400">
        <div className="flex items-center gap-1">
          <ArrowDownCircle size={10} className="text-green-500" />
          {tp('tx.buyCountWithAmount', summary.buyCount, { amount: formatNumber(summary.totalBought), unit })}
        </div>
        {summary.sellCount > 0 && (
          <div className="flex items-center gap-1">
            <ArrowUpCircle size={10} className="text-red-500" />
            {tp('tx.sellCountWithAmount', summary.sellCount, { amount: formatNumber(summary.totalSold), unit })}
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-100">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">{t('vault.totalPL')}</span>
          <span className={`font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
            {format(summary.totalPL)}
          </span>
        </div>
        {summary.realizedPL !== 0 && (
          <div className="flex justify-between items-center text-[10px] mt-1">
            <span className="text-gray-400">{t('vault.realizedInline', { value: format(summary.realizedPL) })}</span>
            <span className="text-gray-400">{t('vault.unrealizedInline', { value: format(summary.unrealizedPL) })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
