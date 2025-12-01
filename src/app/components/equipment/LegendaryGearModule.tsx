"use client";

import { useState, useMemo } from "react";
import { RawGear } from "@/src/tli/core";
import { Legendaries } from "@/src/data/legendary/legendaries";
import { craft } from "@/src/tli/crafting/craft";
import { generateItemId } from "../../lib/storage";
import { getGearTypeFromEquipmentType } from "../../lib/equipment-utils";
import { SearchableSelect } from "../ui/SearchableSelect";
import { LegendaryAffixRow, LegendaryAffixState } from "./LegendaryAffixRow";

interface LegendaryGearModuleProps {
  onSaveToInventory: (item: RawGear) => void;
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

  const handleLegendarySelect = (index: number | undefined) => {
    setSelectedLegendaryIndex(index);
    if (index !== undefined) {
      const legendary = sortedLegendaries[index];
      setAffixStates(
        legendary.normalAffixes.map(() => ({
          isCorrupted: false,
          percentage: 50,
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
    if (!selectedLegendary) return;

    const affixes = affixStates.map((state, i) => {
      const affix = state.isCorrupted
        ? selectedLegendary.corruptionAffixes[i]
        : selectedLegendary.normalAffixes[i];
      return craftAffix(affix, state.percentage);
    });

    const newItem: RawGear = {
      id: generateItemId(),
      gearType: getGearTypeFromEquipmentType(selectedLegendary.equipmentType),
      affixes,
      equipmentType: selectedLegendary.equipmentType,
      rarity: "legendary",
      baseStats: selectedLegendary.baseStat,
      legendaryName: selectedLegendary.name,
    };

    onSaveToInventory(newItem);

    setSelectedLegendaryIndex(undefined);
    setAffixStates([]);
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

          {/* Affixes Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-zinc-50">Affixes</h3>
            <div className="space-y-3">
              {selectedLegendary.normalAffixes.map((normalAffix, index) => (
                <LegendaryAffixRow
                  key={index}
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
