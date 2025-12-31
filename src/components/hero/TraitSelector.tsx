import { ModNotImplementedIcon } from "@/src/components/ui/ModNotImplementedIcon";
import { SearchableSelect } from "@/src/components/ui/SearchableSelect";
import {
  Tooltip,
  TooltipContent,
  TooltipTitle,
} from "@/src/components/ui/Tooltip";
import type { BaseHeroTrait, HeroTraitName } from "@/src/data/hero_trait/types";
import { useTooltip } from "@/src/hooks/useTooltip";
import type { HeroMemorySlot } from "@/src/lib/save-data";
import {
  getAffixText,
  type HeroMemory,
  type HeroPage,
  type HeroTraits,
} from "@/src/tli/core";
import { isHeroTraitImplemented } from "@/src/tli/hero/hero_trait_mods";
import {
  getCompatibleLoadoutMemoriesForSlot,
  getTraitsForHeroAtLevel,
  MEMORY_SLOT_TYPE_MAP,
} from "../../lib/hero-utils";

const MemoryTooltipContent: React.FC<{ memory: HeroMemory }> = ({ memory }) => (
  <>
    <TooltipTitle>{memory.memoryType}</TooltipTitle>
    <TooltipContent>
      {memory.affixes.length > 0 ? (
        <ul className="space-y-1">
          {memory.affixes.flatMap((affix, affixIdx) =>
            affix.affixLines.map((line, lineIdx) => (
              <li
                key={`${affixIdx}-${lineIdx}`}
                className="text-xs text-zinc-400 flex items-center"
              >
                <span>{line.text}</span>
                {line.mods === undefined && <ModNotImplementedIcon />}
              </li>
            )),
          )}
        </ul>
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
  const { isVisible, triggerRef, triggerRect, tooltipHandlers } = useTooltip();

  return (
    <div ref={triggerRef} className="w-full">
      <span>{label}</span>
      <Tooltip
        isVisible={isVisible}
        triggerRect={triggerRect}
        width="lg"
        {...tooltipHandlers}
      >
        <MemoryTooltipContent memory={memory} />
      </Tooltip>
    </div>
  );
};

interface TraitSelectorProps {
  heroPage: HeroPage;
  heroMemoryList: HeroMemory[];
  onTraitSelect: (level: 45 | 60 | 75, traitName: string | undefined) => void;
  onMemoryEquip: (slot: HeroMemorySlot, memoryId: string | undefined) => void;
}

const TRAIT_LEVELS = [1, 45, 60, 75] as const;

interface TraitItemProps {
  trait: BaseHeroTrait;
  isSelected: boolean;
  isLevel1: boolean;
  level: number;
  onSelect?: () => void;
}

const TraitItem = ({
  trait,
  isSelected,
  isLevel1,
  level,
  onSelect,
}: TraitItemProps) => {
  const { isVisible, triggerRef, triggerRect, tooltipHandlers } = useTooltip();

  const content = (
    <div className="flex-1">
      <div className="font-medium text-zinc-50 text-sm">{trait.name}</div>
    </div>
  );

  const implemented = isHeroTraitImplemented(trait.name as HeroTraitName);

  const tooltip = (
    <Tooltip
      isVisible={isVisible}
      triggerRect={triggerRect}
      width="lg"
      {...tooltipHandlers}
    >
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

  return (
    <label
      className={`flex items-start gap-2 p-3 rounded border cursor-pointer transition-colors ${
        isSelected
          ? "bg-amber-500/10 border-amber-500"
          : "bg-zinc-900 border-zinc-700 hover:border-zinc-600"
      }`}
      ref={triggerRef}
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

interface TraitRowProps {
  level: (typeof TRAIT_LEVELS)[number];
  heroPage: HeroPage;
  heroMemoryList: HeroMemory[];
  onTraitSelect: (level: 45 | 60 | 75, traitName: string | undefined) => void;
  onMemoryEquip: (slot: HeroMemorySlot, memoryId: string | undefined) => void;
}

const TraitRow = ({
  level,
  heroPage,
  heroMemoryList,
  onTraitSelect,
  onMemoryEquip,
}: TraitRowProps) => {
  const traits =
    heroPage.selectedHero !== undefined
      ? getTraitsForHeroAtLevel(heroPage.selectedHero, level)
      : [];

  const traitLevelKey = `level${level}` as keyof HeroTraits;
  const selectedTrait = heroPage.traits[traitLevelKey];
  const isLevel1 = level === 1;

  const slot: HeroMemorySlot | undefined =
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
    ? getCompatibleLoadoutMemoriesForSlot(heroMemoryList, slot)
    : [];

  const memoryById = new Map(compatibleMemories.map((m) => [m.id, m]));

  return (
    <div className="bg-zinc-800 rounded-lg p-4">
      <div className="flex items-start gap-4">
        {!isLevel1 && slot && (
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
              renderSelectedTooltip={(option, triggerRect, tooltipHandlers) => {
                const memory = memoryById.get(option.value);
                if (memory === undefined) return null;
                return (
                  <Tooltip
                    isVisible={true}
                    triggerRect={triggerRect}
                    width="lg"
                    {...tooltipHandlers}
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
                  isSelected={selectedTrait?.name === trait.name}
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
