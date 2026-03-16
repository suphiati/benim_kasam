import { useVaultStore } from '../../store/vaultStore';
import { ASSET_CONFIG, ASSET_TYPES } from '../../constants/assets';
import { formatCurrency } from '../../utils/formatters';

export function LiveRatesBar() {
  const liveRates = useVaultStore((s) => s.liveRates);

  if (liveRates.length === 0) return null;

  return (
    <div className="mx-4 mt-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Güncel Kurlar</h3>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {ASSET_TYPES.map((type) => {
          const rate = liveRates.find((r) => r.assetType === type);
          if (!rate) return null;
          const config = ASSET_CONFIG[type];
          return (
            <div
              key={type}
              className="flex-shrink-0 bg-gray-50 rounded-xl px-3 py-2 min-w-[120px]"
            >
              <p className="text-xs text-gray-500 truncate">{config.label}</p>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(rate.sellPrice)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
