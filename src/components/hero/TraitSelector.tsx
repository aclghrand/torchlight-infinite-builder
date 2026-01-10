import { SearchableSelect } from "@/src/components/ui/SearchableSelect";
import {
  Tooltip,
  TooltipContent,
  TooltipTitle,
} from "@/src/components/ui/Tooltip";
import type { BaseHeroTrait, HeroTraitName } from "@/src/data/hero-trait/types";
import { useTooltip } from "@/src/hooks/useTooltip";
import type { HeroMemorySlot } from "@/src/lib/save-data";
import { getAffixText, type HeroMemory, type HeroPage } from "@/src/tli/core";
import { isHeroTraitImplemented } from "@/src/tli/hero/hero-trait-mods";
import {
  getBing2TraitsForLevelAndGroup,
  getCompatibleLoadoutMemoriesForSlot,
  getTraitsForHeroAtLevel,
  isBing2Hero,
  MEMORY_SLOT_TYPE_MAP,
} from "../../lib/hero-utils";

const MemoryTooltipContent: React.FC<{ memory: HeroMemory }> = ({ memory }) => (
  <>
    <TooltipTitle>{memory.memoryType}</TooltipTitle>
    <TooltipContent>
      {memory.affixes.length > 0 ? (
        <div>
          {memory.affixes.map((affix, affixIdx) => (
            <div
              key={affixIdx}
              className={
                affixIdx > 0 ? "mt-2 pt-2 border-t border-zinc-500" : ""
              }
            >
              {affix.affixLines.map((line, lineIdx) => (
                <div
                  key={lineIdx}
                  className={
                    lineIdx > 0 ? "mt-1 pt-1 border-t border-zinc-800" : ""
                  }
                >
                  <div className="text-xs text-zinc-400">{line.text}</div>
                  {line.mods === undefined && (
                    <div className="text-xs text-red-500">
                      (Mod not supported in TOB yet)
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-500 italic">No affixes</p>
      )}
    </TooltipContent>
  </>
);

interface MemoryOptionWithTooltipProps {
  memory: HeroMemory;
  label: string;
}

const MemoryOptionWithTooltip: React.FC<MemoryOptionWithTooltipProps> = ({
  memory,
  label,
}) => {
  const { isVisible, triggerRef, triggerRect } = useTooltip();

  return (
    <div ref={triggerRef} className="w-full">
      <span>{label}</span>
      <Tooltip isVisible={isVisible} triggerRect={triggerRect} width="lg">
        <MemoryTooltipContent memory={memory} />
      </Tooltip>
    </div>
  );
};

interface TraitSelectorProps {
  heroPage: HeroPage;
  heroMemoryList: HeroMemory[];
  onTraitSelect: (
    level: 45 | 60 | 75,
    group: "a" | "b",
    traitName: string | undefined,
  ) => void;
  onMemoryEquip: (slot: HeroMemorySlot, memoryId: string | undefined) => void;
}

const TRAIT_LEVELS = [1, 45, 60, 75] as const;

interface TraitItemProps {
  trait: BaseHeroTrait;
  isSelected: boolean;
  isLevel1: boolean;
  radioName: string;
  onSelect?: () => void;
}

const TraitItem = ({
  trait,
  isSelected,
  isLevel1,
  radioName,
  onSelect,
}: TraitItemProps) => {
  const { isVisible, triggerRef, triggerRect } = useTooltip();

  const content = (
    <div className="flex-1">
      <div className="font-medium text-zinc-50 text-sm">{trait.name}</div>
    </div>
  );

  const implemented = isHeroTraitImplemented(trait.name as HeroTraitName);

  const tooltip = (
    <Tooltip isVisible={isVisible} triggerRect={triggerRect} width="lg">
      <TooltipTitle>{trait.name}</TooltipTitle>
      <TooltipContent>
        <div className="max-h-64 overflow-y-auto">{trait.affix}</div>
      </TooltipContent>
      {!implemented && (
        <>
          <hr className="border-zinc-700 my-2" />
          <div className="text-xs text-orange-400 italic">
            Trait not implemented yet
          </div>
        </>
      )}
    </Tooltip>
  );

  if (isLevel1) {
    return (
      <div
        className="bg-zinc-900 p-3 rounded border border-zinc-700 cursor-help"
        ref={triggerRef}
      >
        {content}
        {tooltip}
      </div>
    );
  }

  const handleSelect = (): void => {
    if (onSelect !== undefined) {
      onSelect();
    }
  };

  return (
    <label
      className={`flex items-start gap-2 p-3 rounded border cursor-pointer transition-colors ${
        isSelected
          ? "bg-amber-500/10 border-amber-500"
          : "bg-zinc-900 border-zinc-700 hover:border-zinc-600"
      }`}
      ref={triggerRef}
      onClick={handleSelect}
    >
      <input
        type="radio"
        name={radioName}
        checked={isSelected}
        onChange={handleSelect}
        className="mt-1"
      />
      {content}
      {tooltip}
    </label>
  );
};

interface TraitRowProps {
  level: (typeof TRAIT_LEVELS)[number];
  heroPage: HeroPage;
  heroMemoryList: HeroMemory[];
  onTraitSelect: (
    level: 45 | 60 | 75,
    group: "a" | "b",
    traitName: string | undefined,
  ) => void;
  onMemoryEquip: (slot: HeroMemorySlot, memoryId: string | undefined) => void;
}

const TraitRow = ({
  level,
  heroPage,
  heroMemoryList,
  onTraitSelect,
  onMemoryEquip,
}: TraitRowProps) => {
  const hero = heroPage.selectedHero;
  const isBing2 = hero !== undefined && isBing2Hero(hero);
  const isLevel1 = level === 1;

  // Get traits based on whether this is Bing2 (Creative Genius) who has dual traits
  const traitsGroupA =
    hero !== undefined
      ? isBing2 && !isLevel1
        ? getBing2TraitsForLevelAndGroup(hero, level as 45 | 60 | 75, "a")
        : getTraitsForHeroAtLevel(hero, level)
      : [];
  const traitsGroupB =
    hero !== undefined && isBing2 && !isLevel1
      ? getBing2TraitsForLevelAndGroup(hero, level as 45 | 60 | 75, "b")
      : [];

  // Get selected traits for each group
  const getSelectedTraitA = (): { name: string } | undefined => {
    if (level === 1) return heroPage.traits.level1;
    if (level === 45) return heroPage.traits.level45;
    if (level === 60) return heroPage.traits.level60;
    if (level === 75) return heroPage.traits.level75;
    return undefined;
  };
  const getSelectedTraitB = (): { name: string } | undefined => {
    if (level === 45) return heroPage.traits.level45b;
    if (level === 60) return heroPage.traits.level60b;
    if (level === 75) return heroPage.traits.level75b;
    return undefined;
  };
  const selectedTraitA = getSelectedTraitA();
  const selectedTraitB = getSelectedTraitB();

  const slot: HeroMemorySlot | undefined =
    level === 45
      ? "slot45"
      : level === 60
        ? "slot60"
        : level === 75
          ? "slot75"
          : undefined;
  const memoryType =
    slot !== undefined ? MEMORY_SLOT_TYPE_MAP[slot] : undefined;
  const equippedMemory =
    slot !== undefined ? heroPage.memorySlots[slot] : undefined;
  const compatibleMemories =
    slot !== undefined
      ? getCompatibleLoadoutMemoriesForSlot(heroMemoryList, slot)
      : [];

  const memoryById = new Map(compatibleMemories.map((m) => [m.id, m]));

  const renderTraitGroup = (
    traits: BaseHeroTrait[],
    group: "a" | "b",
    selectedTrait: { name: string } | undefined,
    label?: string,
  ): React.ReactNode => {
    if (traits.length === 0) {
      return (
        <p className="text-zinc-500 text-sm italic">
          {hero !== undefined
            ? "No traits available"
            : "Select a hero to view traits"}
        </p>
      );
    }

    return (
      <div className="space-y-2">
        {label !== undefined && (
          <div className="text-xs text-zinc-500 mb-1">{label}</div>
        )}
        {traits.map((trait) => (
          <TraitItem
            key={trait.name}
            trait={trait}
            isSelected={selectedTrait?.name === trait.name}
            isLevel1={false}
            radioName={`trait-level-${level}-${group}`}
            onSelect={() =>
              onTraitSelect(level as 45 | 60 | 75, group, trait.name)
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-zinc-800 rounded-lg p-4">
      <div className="flex items-start gap-4">
        {!isLevel1 && slot !== undefined && (
          <div className="w-48 flex-shrink-0">
            <div className="text-xs text-zinc-500 mb-2">{memoryType}</div>
            <SearchableSelect
              value={equippedMemory?.id}
              onChange={(value) => onMemoryEquip(slot, value)}
              options={compatibleMemories.map((memory) => {
                const firstAffix = memory.affixes[0];
                const affixText = firstAffix
                  ? getAffixText(firstAffix)
                  : "Empty memory";
                return {
                  value: memory.id,
                  label: `${affixText.substring(0, 30)}...`,
                };
              })}
              placeholder="No memory"
              size="sm"
              renderOption={(option) => {
                const memory = memoryById.get(option.value);
                if (memory === undefined) return <span>{option.label}</span>;
                return (
                  <MemoryOptionWithTooltip
                    memory={memory}
                    label={option.label}
                  />
                );
              }}
              renderSelectedTooltip={(option, triggerRect) => {
                const memory = memoryById.get(option.value);
                if (memory === undefined) return null;
                return (
                  <Tooltip
                    isVisible={true}
                    triggerRect={triggerRect}
                    width="lg"
                  >
                    <MemoryTooltipContent memory={memory} />
                  </Tooltip>
                );
              }}
            />
          </div>
        )}

        <div className="flex-1">
          <div className="text-sm font-semibold text-amber-400 mb-2">
            Level {level} {isLevel1 && "(Auto-selected)"}
          </div>

          {traitsGroupA.length === 0 && traitsGroupB.length === 0 ? (
            <p className="text-zinc-500 text-sm italic">
              {hero !== undefined
                ? "No traits available at this level"
                : "Select a hero to view traits"}
            </p>
          ) : isLevel1 ? (
            <TraitItem
              trait={traitsGroupA[0]}
              isSelected={true}
              isLevel1={true}
              radioName={`trait-level-${level}`}
            />
          ) : isBing2 ? (
            <div className="grid grid-cols-2 gap-4">
              <div>{renderTraitGroup(traitsGroupA, "a", selectedTraitA)}</div>
              <div>{renderTraitGroup(traitsGroupB, "b", selectedTraitB)}</div>
            </div>
          ) : (
            renderTraitGroup(traitsGroupA, "a", selectedTraitA)
          )}
        </div>
      </div>
    </div>
  );
};

export const TraitSelector = ({
  heroPage,
  heroMemoryList,
  onTraitSelect,
  onMemoryEquip,
}: TraitSelectorProps) => {
  return (
    <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-700">
      <h2 className="text-xl font-semibold mb-4 text-zinc-50">Hero Traits</h2>
      <div className="space-y-4">
        {TRAIT_LEVELS.map((level) => (
          <TraitRow
            key={level}
            level={level}
            heroPage={heroPage}
            heroMemoryList={heroMemoryList}
            onTraitSelect={onTraitSelect}
            onMemoryEquip={onMemoryEquip}
          />
        ))}
      </div>
    </div>
  );
};
