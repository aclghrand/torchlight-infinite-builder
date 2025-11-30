"use client";

import { craft } from "@/src/tli/crafting/craft";

export interface LegendaryAffixState {
  isCorrupted: boolean;
  percentage: number;
}

interface LegendaryAffixRowProps {
  index: number;
  normalAffix: string;
  corruptionAffix: string;
  state: LegendaryAffixState;
  onToggleCorruption: (index: number) => void;
  onPercentageChange: (index: number, percentage: number) => void;
}

const RANGE_PATTERN = /\((-?\d+)-(-?\d+)\)/;

const hasRange = (affix: string): boolean => {
  return RANGE_PATTERN.test(affix);
};

const craftAffix = (affix: string, percentage: number): string => {
  return craft({ craftableAffix: affix }, percentage);
};

export const LegendaryAffixRow: React.FC<LegendaryAffixRowProps> = ({
  index,
  normalAffix,
  corruptionAffix,
  state,
  onToggleCorruption,
  onPercentageChange,
}) => {
  const currentAffix = state.isCorrupted ? corruptionAffix : normalAffix;
  const showSlider = hasRange(currentAffix);
  const craftedText = craftAffix(currentAffix, state.percentage);

  return (
    <div className="bg-zinc-800 p-3 rounded-lg">
      {/* Toggle Button */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => onToggleCorruption(index)}
          className={`
            px-3 py-1 rounded text-xs font-medium transition-colors
            ${
              state.isCorrupted
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
            }
          `}
        >
          {state.isCorrupted ? "Corruption" : "Normal"}
        </button>
      </div>

      {/* Quality Slider (only show if affix has a range) */}
      {showSlider && (
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-zinc-500">Quality</label>
            <span className="text-xs font-medium text-zinc-50">
              {state.percentage}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={state.percentage}
            onChange={(e) =>
              onPercentageChange(index, parseInt(e.target.value))
            }
            className="w-full"
          />
        </div>
      )}

      {/* Crafted Preview */}
      <div className="bg-zinc-900 p-2 rounded border border-zinc-700">
        <div className="text-sm text-amber-400">{craftedText}</div>
      </div>
    </div>
  );
};
