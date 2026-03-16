import type { AssetType } from '../../types';
import { ASSET_CONFIG, ASSET_TYPES } from '../../constants/assets';

interface AssetTypePickerProps {
  selected: AssetType | null;
  onSelect: (type: AssetType) => void;
}

const ICON_MAP: Record<string, string> = {
  '$': '$', '€': '€', '£': '£', '¥': '¥', '₽': '₽',
  'C$': 'C$', 'A$': 'A$',
};

function getIcon(config: { unit: string; category: string }): string {
  if (ICON_MAP[config.unit]) return ICON_MAP[config.unit];
  if (config.category === 'gold') return 'Au';
  if (config.category === 'commodity') return 'Ag';
  return config.unit.substring(0, 2);
}

export function AssetTypePicker({ selected, onSelect }: AssetTypePickerProps) {
  const currencies = ASSET_TYPES.filter((t) => ASSET_CONFIG[t].category === 'currency');
  const golds = ASSET_TYPES.filter((t) => ASSET_CONFIG[t].category === 'gold');
  const commodities = ASSET_TYPES.filter((t) => ASSET_CONFIG[t].category === 'commodity');

  const renderGroup = (label: string, types: AssetType[]) => (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="grid grid-cols-4 gap-1.5">
        {types.map((type) => {
          const config = ASSET_CONFIG[type];
          const isSelected = selected === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-vault-600 bg-vault-50 text-vault-800 font-semibold'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                style={{ backgroundColor: config.color }}
              >
                {getIcon(config)}
              </div>
              <span className="truncate w-full text-center text-[10px] leading-tight">{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {renderGroup('Dövizler', currencies)}
      {renderGroup('Altın', golds)}
      {commodities.length > 0 && renderGroup('Değerli Maden', commodities)}
    </div>
  );
}
