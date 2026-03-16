import type { AssetType } from '../../types';
import { ASSET_CONFIG, ASSET_TYPES } from '../../constants/assets';

interface FilterBarProps {
  selected: AssetType | null;
  onSelect: (type: AssetType | null) => void;
}

export function FilterBar({ selected, onSelect }: FilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          selected === null
            ? 'bg-vault-800 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Tümü
      </button>
      {ASSET_TYPES.map((type) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            selected === type
              ? 'bg-vault-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {ASSET_CONFIG[type].label}
        </button>
      ))}
    </div>
  );
}
