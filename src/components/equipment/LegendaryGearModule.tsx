import { useMemo, useState } from "react";
import { Legendaries } from "@/src/data/legendary/legendaries";
import type { Gear } from "@/src/lib/save-data";
import { craft } from "@/src/tli/crafting/craft";
import {
  formatBlendAffix,
  formatBlendOption,
  formatBlendPreview,
  getBlendAffixes,
} from "../../lib/blend-utils";
import { DEFAULT_QUALITY } from "../../lib/constants";
import { generateItemId } from "../../lib/storage";
import { SearchableSelect } from "../ui/SearchableSelect";
import {
  LegendaryAffixRow,
  type LegendaryAffixState,
} from "./LegendaryAffixRow";

interface LegendaryGearModuleProps {
  onSaveToInventory: (item: Gear) => void;
}

const craftAffix = (affix: string, percentage: number): string => {
  return craft({ craftableAffix: affix }, percentage);
};

export const LegendaryGearModule: React.FC<LegendaryGearModuleProps> = ({
  onSaveToInventory,
}) => {
  const [selectedLegendaryIndex, setSelectedLegendaryIndex] = useState<
    number | undefined
  >(undefined);
  const [affixStates, setAffixStates] = useState<LegendaryAffixState[]>([]);
  const [selectedBlendIndex, setSelectedBlendIndex] = useState<
    number | undefined
  >(undefined);

  const blendAffixes = useMemo(() => getBlendAffixes(), []);

  const sortedLegendaries = useMemo(() => {
    return [...Legendaries].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const legendaryOptions = useMemo(() => {
    return sortedLegendaries.map((legendary, idx) => ({
      value: idx,
      label: legendary.name,
      sublabel: legendary.equipmentType,
    }));
  }, [sortedLegendaries]);

  const selectedLegendary =
    selectedLegendaryIndex !== undefined
      ? sortedLegendaries[selectedLegendaryIndex]
      : undefined;

  const isBelt = selectedLegendary?.equipmentType === "Belt";

  const blendOptions = useMemo(() => {
    return blendAffixes.map((blend, idx) => ({
      value: idx,
      label: formatBlendOption(blend),
    }));
  }, [blendAffixes]);

  const handleLegendarySelect = (index: number | undefined) => {
    setSelectedLegendaryIndex(index);
    setSelectedBlendIndex(undefined);
    if (index !== undefined) {
      const legendary = sortedLegendaries[index];
      setAffixStates(
        legendary.normalAffixes.map(() => ({
          isCorrupted: false,
          percentage: DEFAULT_QUALITY,
        })),
      );
    } else {
      setAffixStates([]);
    }
  };

  const handleToggleCorruption = (index: number) => {
    setAffixStates((prev) =>
      prev.map((state, i) =>
        i === index ? { ...state, isCorrupted: !state.isCorrupted } : state,
      ),
    );
  };

  const handlePercentageChange = (index: number, percentage: number) => {
    setAffixStates((prev) =>
      prev.map((state, i) => (i === index ? { ...state, percentage } : state)),
    );
  };

  const handleSaveToInventory = () => {
    if (selectedLegendary === undefined) return;

    const legendary_affixes = affixStates.map((state, i) => {
      const affix = state.isCorrupted
        ? selectedLegendary.corruptionAffixes[i]
        : selectedLegendary.normalAffixes[i];
      return craftAffix(affix, state.percentage);
    });

    const blend_affix =
      isBelt && selectedBlendIndex !== undefined
        ? formatBlendAffix(blendAffixes[selectedBlendIndex])
        : undefined;

    const newItem: Gear = {
      id: generateItemId(),
      equipmentType: selectedLegendary.equipmentType,
      legendary_affixes,
      blend_affix,
      rarity: "legendary",
      baseStats: selectedLegendary.baseStat,
      legendaryName: selectedLegendary.name,
    };

    onSaveToInventory(newItem);

    setSelectedLegendaryIndex(undefined);
    setAffixStates([]);
    setSelectedBlendIndex(undefined);
  };

  return (
    <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-700">
      <h2 className="text-xl font-semibold mb-4 text-zinc-50">Add Legendary</h2>

      {/* Legendary Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-zinc-50">
          Select Legendary
        </label>
        <SearchableSelect
          value={selectedLegendaryIndex}
          onChange={handleLegendarySelect}
          options={legendaryOptions}
          placeholder="Select a legendary..."
        />
      </div>

      {selectedLegendary ? (
        <>
          {/* Base Stat Display */}
          {selectedLegendary.baseStat && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2 text-zinc-400">
                Base Stat
              </h3>
              <div className="bg-zinc-800 p-3 rounded-lg border border-zinc-700">
                <span className="text-amber-400">
                  {selectedLegendary.baseStat}
                </span>
              </div>
            </div>
          )}

          {/* Blending Section (Belts Only) */}
          {isBelt && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-zinc-50">
                Blending (1 max)
              </h3>
              <SearchableSelect
                value={selectedBlendIndex}
                onChange={setSelectedBlendIndex}
                options={blendOptions}
                placeholder="Select a blend..."
              />
              {selectedBlendIndex !== undefined && (
                <div className="mt-3 bg-zinc-800 p-3 rounded-lg border border-zinc-700">
                  <pre className="text-sm text-amber-400 whitespace-pre-wrap font-sans">
                    {formatBlendPreview(blendAffixes[selectedBlendIndex])}
                  </pre>
                  <button
                    type="button"
                    onClick={() => setSelectedBlendIndex(undefined)}
                    className="mt-2 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Affixes Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-zinc-50">Affixes</h3>
            <div className="space-y-3">
              {selectedLegendary.normalAffixes.map((normalAffix, index) => (
                <LegendaryAffixRow
                  key={normalAffix}
                  index={index}
                  normalAffix={normalAffix}
                  corruptionAffix={selectedLegendary.corruptionAffixes[index]}
                  state={affixStates[index]}
                  onToggleCorruption={handleToggleCorruption}
                  onPercentageChange={handlePercentageChange}
                />
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSaveToInventory}
            className="w-full px-4 py-3 bg-amber-500 text-zinc-950 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
          >
            Save to Inventory
          </button>
        </>
      ) : (
        <p className="text-zinc-500 italic text-center py-8">
          Select a legendary to configure
        </p>
      )}
    </div>
  );
};
