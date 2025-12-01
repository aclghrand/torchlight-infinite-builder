"use client";

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import type { HeroTrait } from "@/src/data/hero_trait/types";
import type {
  RawHeroPage,
  RawHeroMemory,
  HeroMemoryType,
  HeroMemorySlot,
  RawHeroMemoryAffix,
} from "@/src/tli/core";
import { HERO_MEMORY_TYPES } from "@/src/tli/core";
import {
  getUniqueHeroes,
  getTraitsForHeroAtLevel,
  getBaseTraitForHero,
  getBaseStatsForMemoryType,
  getFixedAffixesForMemoryType,
  getRandomAffixesForMemoryType,
  craftHeroMemoryAffix,
  MEMORY_SLOT_TYPE_MAP,
  getCompatibleMemoriesForSlot,
} from "../../lib/hero-utils";
import { generateItemId } from "../../lib/storage";
import { HeroMemoryItem } from "./HeroMemoryItem";
import { SearchableSelect } from "@/src/app/components/ui/SearchableSelect";

interface HeroTabProps {
  heroPage: RawHeroPage;
  heroMemoryList: RawHeroMemory[];
  onHeroChange: (hero: string | undefined) => void;
  onTraitSelect: (level: 45 | 60 | 75, traitName: string | undefined) => void;
  onMemoryEquip: (slot: HeroMemorySlot, memoryId: string | undefined) => void;
  onMemorySave: (memory: RawHeroMemory) => void;
  onMemoryCopy: (memory: RawHeroMemory) => void;
  onMemoryDelete: (id: string) => void;
}

interface MemoryAffixSlotState {
  effectIndex: number | undefined;
  quality: number;
}

const TRAIT_LEVELS = [1, 45, 60, 75] as const;

const TraitItem: React.FC<{
  trait: HeroTrait;
  isSelected: boolean;
  isLevel1: boolean;
  level: number;
  onSelect?: () => void;
}> = ({ trait, isSelected, isLevel1, level, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const content = (
    <div className="flex-1">
      <div className="font-medium text-zinc-50 text-sm">{trait.name}</div>
    </div>
  );

  const tooltip =
    isHovered &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="fixed z-50 w-80 pointer-events-none"
        style={{ left: mousePos.x + 12, top: mousePos.y + 12 }}
      >
        <div className="bg-zinc-950 text-zinc-50 p-3 rounded-lg shadow-xl border border-zinc-700">
          <div className="font-semibold text-sm mb-2 text-amber-400">
            {trait.name}
          </div>
          <div className="text-xs text-zinc-400 whitespace-pre-wrap max-h-64 overflow-y-auto">
            {trait.affix}
          </div>
        </div>
      </div>,
      document.body,
    );

  if (isLevel1) {
    return (
      <div
        className="bg-zinc-900 p-3 rounded border border-zinc-700 cursor-help"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      >
        {content}
        {tooltip}
      </div>
    );
  }

  return (
    <label
      className={`flex items-start gap-2 p-3 rounded border cursor-pointer transition-colors ${
        isSelected
          ? "bg-amber-500/10 border-amber-500"
          : "bg-zinc-900 border-zinc-700 hover:border-zinc-600"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      <input
        type="radio"
        name={`trait-level-${level}`}
        checked={isSelected}
        onChange={onSelect}
        className="mt-1"
      />
      {content}
      {tooltip}
    </label>
  );
};

export const HeroTab: React.FC<HeroTabProps> = ({
  heroPage,
  heroMemoryList,
  onHeroChange,
  onTraitSelect,
  onMemoryEquip,
  onMemorySave,
  onMemoryCopy,
  onMemoryDelete,
}) => {
  const [selectedMemoryType, setSelectedMemoryType] = useState<
    HeroMemoryType | undefined
  >(undefined);
  const [selectedBaseStat, setSelectedBaseStat] = useState<string | undefined>(
    undefined,
  );
  const [fixedAffixSlots, setFixedAffixSlots] = useState<
    MemoryAffixSlotState[]
  >([
    { effectIndex: undefined, quality: 50 },
    { effectIndex: undefined, quality: 50 },
  ]);
  const [randomAffixSlots, setRandomAffixSlots] = useState<
    MemoryAffixSlotState[]
  >([
    { effectIndex: undefined, quality: 50 },
    { effectIndex: undefined, quality: 50 },
  ]);

  const uniqueHeroes = useMemo(() => getUniqueHeroes(), []);

  const baseStats = useMemo(
    () =>
      selectedMemoryType ? getBaseStatsForMemoryType(selectedMemoryType) : [],
    [selectedMemoryType],
  );

  const fixedAffixes = useMemo(
    () =>
      selectedMemoryType
        ? getFixedAffixesForMemoryType(selectedMemoryType)
        : [],
    [selectedMemoryType],
  );

  const randomAffixes = useMemo(
    () =>
      selectedMemoryType
        ? getRandomAffixesForMemoryType(selectedMemoryType)
        : [],
    [selectedMemoryType],
  );

  const handleMemoryTypeChange = (type: HeroMemoryType | undefined) => {
    setSelectedMemoryType(type);
    setSelectedBaseStat(undefined);
    setFixedAffixSlots([
      { effectIndex: undefined, quality: 50 },
      { effectIndex: undefined, quality: 50 },
    ]);
    setRandomAffixSlots([
      { effectIndex: undefined, quality: 50 },
      { effectIndex: undefined, quality: 50 },
    ]);
  };

  const handleFixedAffixSelect = (
    slotIndex: number,
    effectIndex: number | undefined,
  ) => {
    setFixedAffixSlots((prev) => {
      const updated = [...prev];
      updated[slotIndex] = {
        effectIndex,
        quality: effectIndex === undefined ? 50 : updated[slotIndex].quality,
      };
      return updated;
    });
  };

  const handleFixedAffixQuality = (slotIndex: number, quality: number) => {
    setFixedAffixSlots((prev) => {
      const updated = [...prev];
      updated[slotIndex] = { ...updated[slotIndex], quality };
      return updated;
    });
  };

  const handleRandomAffixSelect = (
    slotIndex: number,
    effectIndex: number | undefined,
  ) => {
    setRandomAffixSlots((prev) => {
      const updated = [...prev];
      updated[slotIndex] = {
        effectIndex,
        quality: effectIndex === undefined ? 50 : updated[slotIndex].quality,
      };
      return updated;
    });
  };

  const handleRandomAffixQuality = (slotIndex: number, quality: number) => {
    setRandomAffixSlots((prev) => {
      const updated = [...prev];
      updated[slotIndex] = { ...updated[slotIndex], quality };
      return updated;
    });
  };

  const handleSaveMemory = () => {
    if (!selectedMemoryType || !selectedBaseStat) return;

    const fixedAffixesData: RawHeroMemoryAffix[] = fixedAffixSlots
      .filter((slot) => slot.effectIndex !== undefined)
      .map((slot) => ({
        effect: fixedAffixes[slot.effectIndex!],
        quality: slot.quality,
      }));

    const randomAffixesData: RawHeroMemoryAffix[] = randomAffixSlots
      .filter((slot) => slot.effectIndex !== undefined)
      .map((slot) => ({
        effect: randomAffixes[slot.effectIndex!],
        quality: slot.quality,
      }));

    const newMemory: RawHeroMemory = {
      id: generateItemId(),
      memoryType: selectedMemoryType,
      baseStat: selectedBaseStat,
      fixedAffixes: fixedAffixesData,
      randomAffixes: randomAffixesData,
    };

    onMemorySave(newMemory);

    handleMemoryTypeChange(undefined);
  };

  const isMemoryEquipped = (memoryId: string): boolean => {
    return (
      heroPage.memorySlots.slot45?.id === memoryId ||
      heroPage.memorySlots.slot60?.id === memoryId ||
      heroPage.memorySlots.slot75?.id === memoryId
    );
  };

  const renderTraitRow = (level: (typeof TRAIT_LEVELS)[number]) => {
    const traits =
      heroPage.selectedHero !== undefined
        ? getTraitsForHeroAtLevel(heroPage.selectedHero, level)
        : [];

    const traitLevelKey = `level${level}` as keyof typeof heroPage.traits;
    const selectedTrait = heroPage.traits[traitLevelKey];
    const isLevel1 = level === 1;

    const slot =
      level === 45
        ? "slot45"
        : level === 60
          ? "slot60"
          : level === 75
            ? "slot75"
            : undefined;
    const memoryType = slot ? MEMORY_SLOT_TYPE_MAP[slot] : undefined;
    const equippedMemory = slot ? heroPage.memorySlots[slot] : undefined;
    const compatibleMemories = slot
      ? getCompatibleMemoriesForSlot(heroMemoryList, slot)
      : [];

    return (
      <div key={level} className="bg-zinc-800 rounded-lg p-4">
        <div className="flex items-start gap-4">
          {!isLevel1 && slot && (
            <div className="w-48 flex-shrink-0">
              <div className="text-xs text-zinc-500 mb-2">{memoryType}</div>
              <SearchableSelect
                value={equippedMemory?.id}
                onChange={(value) => onMemoryEquip(slot, value)}
                options={compatibleMemories.map((memory) => ({
                  value: memory.id,
                  label: memory.baseStat.substring(0, 30) + "...",
                }))}
                placeholder="No memory"
                size="sm"
              />
            </div>
          )}

          <div className="flex-1">
            <div className="text-sm font-semibold text-amber-400 mb-2">
              Level {level} {isLevel1 && "(Auto-selected)"}
            </div>

            {traits.length === 0 ? (
              <p className="text-zinc-500 text-sm italic">
                {heroPage.selectedHero
                  ? "No traits available at this level"
                  : "Select a hero to view traits"}
              </p>
            ) : isLevel1 ? (
              <TraitItem
                trait={traits[0]}
                isSelected={true}
                isLevel1={true}
                level={level}
              />
            ) : (
              <div className="space-y-2">
                {traits.map((trait) => (
                  <TraitItem
                    key={trait.name}
                    trait={trait}
                    isSelected={selectedTrait === trait.name}
                    isLevel1={false}
                    level={level}
                    onSelect={() =>
                      onTraitSelect(level as 45 | 60 | 75, trait.name)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAffixSlot = (
    slotIndex: number,
    type: "fixed" | "random",
    affixes: string[],
    selection: MemoryAffixSlotState,
    onSelect: (slotIndex: number, effectIndex: number | undefined) => void,
    onQuality: (slotIndex: number, quality: number) => void,
  ) => {
    const selectedAffix =
      selection.effectIndex !== undefined
        ? affixes[selection.effectIndex]
        : undefined;
    const craftedText = selectedAffix
      ? craftHeroMemoryAffix(selectedAffix, selection.quality)
      : "";

    return (
      <div key={`${type}-${slotIndex}`} className="bg-zinc-800 p-3 rounded-lg">
        <SearchableSelect
          value={selection.effectIndex}
          onChange={(value) => onSelect(slotIndex, value)}
          options={affixes.map((affix, idx) => ({
            value: idx,
            label: affix.replace(/\n/g, " ").substring(0, 50) + "...",
          }))}
          placeholder={`Select ${type === "fixed" ? "Fixed" : "Random"} Affix ${slotIndex + 1}`}
          size="sm"
          className="mb-2"
        />

        {selectedAffix && (
          <>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-zinc-500">Quality</label>
              <span className="text-xs font-medium text-zinc-50">
                {selection.quality}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={selection.quality}
              onChange={(e) => onQuality(slotIndex, parseInt(e.target.value))}
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Hero Selection & Traits */}
      <div className="space-y-6">
        {/* Hero Selector */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-700">
          <h2 className="text-xl font-semibold mb-4 text-zinc-50">
            Select Hero
          </h2>
          <SearchableSelect
            value={heroPage.selectedHero}
            onChange={onHeroChange}
            options={uniqueHeroes.map((hero) => ({
              value: hero,
              label: hero,
            }))}
            placeholder="Select a hero..."
            size="lg"
          />
        </div>

        {/* Hero Traits by Level */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-700">
          <h2 className="text-xl font-semibold mb-4 text-zinc-50">
            Hero Traits
          </h2>
          <div className="space-y-4">{TRAIT_LEVELS.map(renderTraitRow)}</div>
        </div>
      </div>

      {/* Right Column: Memory Crafting & Inventory */}
      <div className="space-y-6">
        {/* Memory Crafting Panel */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-700">
          <h2 className="text-xl font-semibold mb-4 text-zinc-50">
            Craft Hero Memory
          </h2>

          {/* Memory Type Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-zinc-50">
              Memory Type
            </label>
            <SearchableSelect
              value={selectedMemoryType}
              onChange={(value) =>
                handleMemoryTypeChange(value as HeroMemoryType | undefined)
              }
              options={HERO_MEMORY_TYPES.map((type) => ({
                value: type,
                label: type,
              }))}
              placeholder="Select memory type..."
              size="lg"
            />
          </div>

          {selectedMemoryType && (
            <>
              {/* Base Stat Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-zinc-50">
                  Base Stat
                </label>
                <SearchableSelect
                  value={selectedBaseStat}
                  onChange={setSelectedBaseStat}
                  options={baseStats.map((stat) => ({
                    value: stat,
                    label: stat,
                  }))}
                  placeholder="Select base stat..."
                  size="lg"
                />
              </div>

              {/* Fixed Affixes */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-3 text-zinc-50">
                  Fixed Affixes (2 max)
                </h3>
                <div className="space-y-3">
                  {fixedAffixSlots.map((slot, idx) =>
                    renderAffixSlot(
                      idx,
                      "fixed",
                      fixedAffixes,
                      slot,
                      handleFixedAffixSelect,
                      handleFixedAffixQuality,
                    ),
                  )}
                </div>
              </div>

              {/* Random Affixes */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-3 text-zinc-50">
                  Random Affixes (2 max)
                </h3>
                <div className="space-y-3">
                  {randomAffixSlots.map((slot, idx) =>
                    renderAffixSlot(
                      idx,
                      "random",
                      randomAffixes,
                      slot,
                      handleRandomAffixSelect,
                      handleRandomAffixQuality,
                    ),
                  )}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveMemory}
                disabled={!selectedBaseStat}
                className="w-full px-4 py-3 bg-amber-500 text-zinc-950 rounded-lg font-semibold hover:bg-amber-600 transition-colors disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed"
              >
                Save to Inventory
              </button>
            </>
          )}

          {!selectedMemoryType && (
            <p className="text-zinc-500 italic text-center py-8">
              Select a memory type to begin crafting
            </p>
          )}
        </div>

        {/* Memory Inventory */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-700">
          <h2 className="text-xl font-semibold mb-4 text-zinc-50">
            Memory Inventory ({heroMemoryList.length} items)
          </h2>
          {heroMemoryList.length === 0 ? (
            <p className="text-zinc-500 italic text-center py-4">
              No memories in inventory. Craft memories above to add them here.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {heroMemoryList.map((memory) => (
                <HeroMemoryItem
                  key={memory.id}
                  memory={memory}
                  isEquipped={isMemoryEquipped(memory.id)}
                  onCopy={onMemoryCopy}
                  onDelete={onMemoryDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
