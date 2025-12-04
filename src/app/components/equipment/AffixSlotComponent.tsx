import { BaseGearAffix } from "@/src/tli/gear_data_types";
import { craft } from "@/src/tli/crafting/craft";
import { AffixSlotState } from "../../lib/types";
import { formatAffixOption } from "../../lib/affix-utils";
import { SearchableSelect } from "@/src/app/components/ui/SearchableSelect";

interface AffixSlotProps {
  slotIndex: number;
  affixType: "Prefix" | "Suffix" | "Blend";
  affixes: BaseGearAffix[];
  selection: AffixSlotState;
  onAffixSelect: (slotIndex: number, value: string) => void;
  onSliderChange: (slotIndex: number, value: string) => void;
  onClear: (slotIndex: number) => void;
  hideQualitySlider?: boolean;
  formatOption?: (affix: BaseGearAffix) => string;
  formatCraftedText?: (affix: BaseGearAffix) => string;
}

export const AffixSlotComponent: React.FC<AffixSlotProps> = ({
  slotIndex,
  affixType,
  affixes,
  selection,
  onAffixSelect,
  onSliderChange,
  onClear,
  hideQualitySlider = false,
  formatOption,
  formatCraftedText,
}) => {
  const selectedAffix =
    selection.affixIndex !== undefined
      ? affixes[selection.affixIndex]
      : undefined;
  const craftedText = selectedAffix
    ? formatCraftedText
      ? formatCraftedText(selectedAffix)
      : craft(selectedAffix, selection.percentage)
    : "";

  return (
    <div className="bg-zinc-800 p-4 rounded-lg">
      {/* Affix Dropdown */}
      <SearchableSelect
        value={selection.affixIndex ?? undefined}
        onChange={(value) => onAffixSelect(slotIndex, value?.toString() ?? "")}
        options={affixes.map((affix, idx) => ({
          value: idx,
          label: formatOption ? formatOption(affix) : formatAffixOption(affix),
        }))}
        placeholder={`<Select ${affixType}>`}
        className="mb-3"
      />

      {/* Slider and Preview (only show if affix selected) */}
      {selectedAffix && (
        <>
          {/* Quality Slider */}
          {!hideQualitySlider && (
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-zinc-500">Quality</label>
                <span className="text-xs font-medium text-zinc-50">
                  {selection.percentage}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={selection.percentage}
                onChange={(e) => onSliderChange(slotIndex, e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {/* Crafted Preview */}
          <div className="bg-zinc-900 p-3 rounded border border-zinc-700">
            <div
              className={`text-sm font-medium mb-1 whitespace-pre-line ${hideQualitySlider ? "text-purple-400" : "text-amber-400"}`}
            >
              {craftedText}
            </div>
            {!hideQualitySlider && (
              <div className="text-xs text-zinc-500">
                Tier {selectedAffix.tier}
                {selectedAffix.craftingPool &&
                  ` | ${selectedAffix.craftingPool}`}
              </div>
            )}
          </div>

          {/* Clear Button */}
          <button
            onClick={() => onClear(slotIndex)}
            className="mt-2 text-xs text-red-500 hover:text-red-400 font-medium"
          >
            Clear
          </button>
        </>
      )}
    </div>
  );
};
