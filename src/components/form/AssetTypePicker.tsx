import type { AssetType } from '../../types';
import { ASSET_CONFIG, ASSET_TYPES } from '../../constants/assets';

interface AssetTypePickerProps {
  selected: AssetType | null;
  onSelect: (type: AssetType) => void;
}

export function AssetTypePicker({ selected, onSelect }: AssetTypePickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {ASSET_TYPES.map((type) => {
        const config = ASSET_CONFIG[type];
        const isSelected = selected === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all text-sm ${
              isSelected
                ? 'border-vault-600 bg-vault-50 text-vault-800 font-semibold'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
              style={{ backgroundColor: config.color }}
            >
              {config.unit === '$' ? '$' : config.unit === '€' ? '€' : 'Au'}
            </div>
            <span className="truncate w-full text-center text-xs">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
