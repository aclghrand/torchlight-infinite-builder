import { useMemo } from "react";
import { SearchableSelect } from "@/src/components/ui/SearchableSelect";
import type { HeroMemory, HeroMemoryType } from "@/src/lib/save-data";
import { HERO_MEMORY_TYPES } from "@/src/lib/save-data";
import { useHeroUIStore } from "@/src/stores/heroUIStore";
import { DEFAULT_QUALITY } from "../../lib/constants";
import {
  craftHeroMemoryAffix,
  getBaseStatsForMemoryType,
  getFixedAffixesForMemoryType,
  getRandomAffixesForMemoryType,
} from "../../lib/hero-utils";
import { generateItemId } from "../../lib/storage";

interface MemoryCrafterProps {
  onMemorySave: (memory: HeroMemory) => void;
}

interface AffixSlotProps {
  slotIndex: number;
  type: "fixed" | "random";
  affixes: string[];
  effectIndex: number | undefined;
  quality: number;
  onSelect: (effectIndex: number | undefined) => void;
  onQuality: (quality: number) => void;
}

const AffixSlot = ({
  slotIndex,
  type,
  affixes,
  effectIndex,
  quality,
  onSelect,
  onQuality,
}: AffixSlotProps) => {
  const selectedAffix =
    effectIndex !== undefined ? affixes[effectIndex] : undefined;
  const craftedText = selectedAffix
    ? craftHeroMemoryAffix(selectedAffix, quality)
    : "";

  return (
    <div className="bg-zinc-800 p-3 rounded-lg">
      <SearchableSelect
        value={effectIndex}
        onChange={onSelect}
        options={affixes.map((affix, idx) => {
          const normalized = affix.replace(/\n/g, " ");
          const truncated = normalized.length > 50;
          return {
            value: idx,
            label: truncated ? `${normalized.substring(0, 50)}...` : normalized,
          };
        })}
        placeholder={`Select ${type === "fixed" ? "Fixed" : "Random"} Affix ${slotIndex + 1}`}
        size="sm"
        className="mb-2"
      />

      {selectedAffix && (
        <>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-zinc-500">Quality</label>
            <span className="text-xs font-medium text-zinc-50">{quality}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={quality}
            onChange={(e) => onQuality(parseInt(e.target.value, 10))}
            className="w-full mb-2"
          />
          <div className="bg-zinc-900 p-2 rounded border border-zinc-700">
            <div className="text-xs font-medium text-amber-400 whitespace-pre-wrap">
              {craftedText}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const MemoryCrafter = ({ onMemorySave }: MemoryCrafterProps) => {
  const craftingMemoryType = useHeroUIStore((s) => s.craftingMemoryType);
  const craftingBaseStat = useHeroUIStore((s) => s.craftingBaseStat);
  const fixedAffixSlots = useHeroUIStore((s) => s.fixedAffixSlots);
  const randomAffixSlots = useHeroUIStore((s) => s.randomAffixSlots);
  const setCraftingMemoryType = useHeroUIStore((s) => s.setCraftingMemoryType);
  const setCraftingBaseStat = useHeroUIStore((s) => s.setCraftingBaseStat);
  const setFixedAffixSlot = useHeroUIStore((s) => s.setFixedAffixSlot);
  const setRandomAffixSlot = useHeroUIStore((s) => s.setRandomAffixSlot);
  const resetMemoryCrafting = useHeroUIStore((s) => s.resetMemoryCrafting);

  const baseStats = useMemo(
    () =>
      craftingMemoryType ? getBaseStatsForMemoryType(craftingMemoryType) : [],
    [craftingMemoryType],
  );

  const fixedAffixes = useMemo(
    () =>
      craftingMemoryType
        ? getFixedAffixesForMemoryType(craftingMemoryType)
        : [],
    [craftingMemoryType],
  );

  const randomAffixes = useMemo(
    () =>
      craftingMemoryType
        ? getRandomAffixesForMemoryType(craftingMemoryType)
        : [],
    [craftingMemoryType],
  );

  const handleSaveMemory = () => {
    if (!craftingMemoryType || !craftingBaseStat) return;

    const fixedAffixesData: string[] = fixedAffixSlots
      .filter((slot) => slot.effectIndex !== undefined)
      .map((slot) =>
        // biome-ignore lint/style/noNonNullAssertion: filtered for defined effectIndex above
        craftHeroMemoryAffix(fixedAffixes[slot.effectIndex!], slot.quality),
      );

    const randomAffixesData: string[] = randomAffixSlots
      .filter((slot) => slot.effectIndex !== undefined)
      .map((slot) =>
        // biome-ignore lint/style/noNonNullAssertion: filtered for defined effectIndex above
        craftHeroMemoryAffix(randomAffixes[slot.effectIndex!], slot.quality),
      );

    const newMemory: HeroMemory = {
      id: generateItemId(),
      memoryType: craftingMemoryType,
      baseStat: craftingBaseStat,
      fixedAffixes: fixedAffixesData,
      randomAffixes: randomAffixesData,
    };

    onMemorySave(newMemory);
    resetMemoryCrafting();
  };

  return (
    <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-700">
      <h2 className="text-xl font-semibold mb-4 text-zinc-50">
        Craft Hero Memory
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-zinc-50">
          Memory Type
        </label>
        <SearchableSelect
          value={craftingMemoryType}
          onChange={(value) =>
            setCraftingMemoryType(value as HeroMemoryType | undefined)
          }
          options={HERO_MEMORY_TYPES.map((type) => ({
            value: type,
            label: type,
          }))}
          placeholder="Select memory type..."
          size="lg"
        />
      </div>

      {craftingMemoryType && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-zinc-50">
              Base Stat
            </label>
            <SearchableSelect
              value={craftingBaseStat}
              onChange={setCraftingBaseStat}
              options={baseStats.map((stat) => ({ value: stat, label: stat }))}
              placeholder="Select base stat..."
              size="lg"
            />
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-3 text-zinc-50">
              Fixed Affixes (2 max)
            </h3>
            <div className="space-y-3">
              {fixedAffixSlots.map((slot, idx) => (
                <AffixSlot
                  key={`fixed-${idx}`}
                  slotIndex={idx}
                  type="fixed"
                  affixes={fixedAffixes}
                  effectIndex={slot.effectIndex}
                  quality={slot.quality}
                  onSelect={(effectIndex) =>
                    setFixedAffixSlot(idx, {
                      effectIndex,
                      quality:
                        effectIndex === undefined
                          ? DEFAULT_QUALITY
                          : slot.quality,
                    })
                  }
                  onQuality={(quality) => setFixedAffixSlot(idx, { quality })}
                />
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-3 text-zinc-50">
              Random Affixes (2 max)
            </h3>
            <div className="space-y-3">
              {randomAffixSlots.slice(0, 2).map((slot, idx) => (
                <AffixSlot
                  key={`random-${idx}`}
                  slotIndex={idx}
                  type="random"
                  affixes={randomAffixes}
                  effectIndex={slot.effectIndex}
                  quality={slot.quality}
                  onSelect={(effectIndex) =>
                    setRandomAffixSlot(idx, {
                      effectIndex,
                      quality:
                        effectIndex === undefined
                          ? DEFAULT_QUALITY
                          : slot.quality,
                    })
                  }
                  onQuality={(quality) => setRandomAffixSlot(idx, { quality })}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveMemory}
            disabled={!craftingBaseStat}
            className="w-full px-4 py-3 bg-amber-500 text-zinc-950 rounded-lg font-semibold hover:bg-amber-600 transition-colors disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed"
          >
            Save to Inventory
          </button>
        </>
      )}

      {!craftingMemoryType && (
        <p className="text-zinc-500 italic text-center py-8">
          Select a memory type to begin crafting
        </p>
      )}
    </div>
  );
};
