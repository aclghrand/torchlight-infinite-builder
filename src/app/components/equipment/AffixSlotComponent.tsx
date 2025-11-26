import { BaseGearAffix } from "@/src/tli/gear_data_types";
import { craft } from "@/src/tli/crafting/craft";
import { AffixSlotState } from "../../lib/types";
import { formatAffixOption } from "../../lib/affix-utils";

interface AffixSlotProps {
  slotIndex: number;
  affixType: "Prefix" | "Suffix";
  affixes: BaseGearAffix[];
  selection: AffixSlotState;
  onAffixSelect: (slotIndex: number, value: string) => void;
  onSliderChange: (slotIndex: number, value: string) => void;
  onClear: (slotIndex: number) => void;
}

export const AffixSlotComponent: React.FC<AffixSlotProps> = ({
  slotIndex,
  affixType,
  affixes,
  selection,
  onAffixSelect,
  onSliderChange,
  onClear,
}) => {
  const selectedAffix =
    selection.affixIndex !== null ? affixes[selection.affixIndex] : null;
  const craftedText = selectedAffix
    ? craft(selectedAffix, selection.percentage)
    : "";

  return (
    <div className="bg-zinc-50 dark:bg-zinc-700 p-4 rounded-lg">
      {/* Affix Dropdown */}
      <select
        value={selection.affixIndex !== null ? selection.affixIndex : ""}
        onChange={(e) => onAffixSelect(slotIndex, e.target.value)}
        className="w-full px-3 py-2 mb-3 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">&lt;Select {affixType}&gt;</option>
        {affixes.map((affix, idx) => (
          <option key={idx} value={idx}>
            {formatAffixOption(affix)}
          </option>
        ))}
      </select>

      {/* Slider and Preview (only show if affix selected) */}
      {selectedAffix && (
        <>
          {/* Quality Slider */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-zinc-600 dark:text-zinc-400">
                Quality
              </label>
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                {selection.percentage}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={selection.percentage}
              onChange={(e) => onSliderChange(slotIndex, e.target.value)}
              className="w-full h-2 bg-zinc-300 dark:bg-zinc-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Crafted Preview */}
          <div className="bg-white dark:bg-zinc-800 p-3 rounded border border-zinc-200 dark:border-zinc-600">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
              {craftedText}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Tier {selectedAffix.tier}
              {selectedAffix.craftingPool && ` | ${selectedAffix.craftingPool}`}
            </div>
          </div>

          {/* Clear Button */}
          <button
            onClick={() => onClear(slotIndex)}
            className="mt-2 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
          >
            Clear
          </button>
        </>
      )}
    </div>
  );
};
