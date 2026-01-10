import { useMemo, useState } from "react";
import {
  SearchableSelect,
  type SearchableSelectOption,
  type SearchableSelectOptionGroup,
} from "@/src/components/ui/SearchableSelect";
import { Tooltip } from "@/src/components/ui/Tooltip";
import {
  ActivationMediumSkills,
  MagnificentSupportSkills,
  NobleSupportSkills,
  SupportSkills,
} from "@/src/data/skill";
import type {
  ActivationMediumSkillNmae,
  BaseActiveSkill,
  BaseMagnificentSupportSkill,
  BaseNobleSupportSkill,
  BaseSkill,
  MagnificentSupportSkillName,
  NobleSupportSkillName,
  SupportSkillName,
} from "@/src/data/skill/types";
import {
  getActivationMediumSkill,
  getWorstActivationMediumDefaults,
} from "@/src/lib/activation-medium-utils";
import type {
  BaseSupportSkillSlot as SaveDataBaseSupportSkillSlot,
  MagnificentSupportSkillSlot as SaveDataMagnificentSlot,
  NobleSupportSkillSlot as SaveDataNobleSlot,
} from "@/src/lib/save-data";
import { listAvailableSupports } from "@/src/lib/skill-utils";
import {
  getWorstSpecialDefaults,
  parseValueFromCraftedAffix,
} from "@/src/lib/special-support-utils";
import type {
  BaseSupportSkillSlot,
  ActivationMediumSkillSlot as LoadoutActivationMediumSkillSlot,
  MagnificentSupportSkillSlot as LoadoutMagnificentSlot,
  NobleSupportSkillSlot as LoadoutNobleSlot,
} from "@/src/tli/core";
import { ActivationMediumEditModal } from "./ActivationMediumEditModal";
import { OptionWithSkillTooltip } from "./OptionWithSkillTooltip";
import {
  SpecialSupportEditModal,
  type SpecialSupportSlot,
} from "./SpecialSupportEditModal";
import { SupportSkillSelectedTooltipContent } from "./SupportSkillSelectedTooltipContent";

interface SupportSkillSelectorProps {
  mainSkill: BaseActiveSkill | BaseSkill | undefined;
  selectedSlot: BaseSupportSkillSlot | undefined;
  excludedSkills: string[];
  onChange: (slot: SaveDataBaseSupportSkillSlot | undefined) => void;
  slotIndex: number; // 1-indexed
}

const SKILL_LEVEL_OPTIONS = Array.from({ length: 21 }, (_, i) => ({
  value: i + 1,
  label: `Lv. ${i + 1}`,
}));

type SupportSkillType =
  | "regular"
  | "magnificent"
  | "noble"
  | "activationMedium"
  | undefined;

const getSkillType = (skillName: string | undefined): SupportSkillType => {
  if (skillName === undefined) return undefined;
  if (SupportSkills.some((s) => s.name === skillName)) return "regular";
  if (MagnificentSupportSkills.some((s) => s.name === skillName))
    return "magnificent";
  if (NobleSupportSkills.some((s) => s.name === skillName)) return "noble";
  if (ActivationMediumSkills.some((s) => s.name === skillName))
    return "activationMedium";
  return undefined;
};

const getMagnificentSkill = (
  skillName: string,
): BaseMagnificentSupportSkill | undefined => {
  return MagnificentSupportSkills.find((s) => s.name === skillName);
};

const getNobleSkill = (
  skillName: string,
): BaseNobleSupportSkill | undefined => {
  return NobleSupportSkills.find((s) => s.name === skillName);
};

/**
 * Convert a loadout magnificent slot (with affixes) to a save-data slot (with craftedAffix).
 */
const toSaveDataMagnificentSlot = (
  slot: LoadoutMagnificentSlot,
): SaveDataMagnificentSlot => {
  // The first affix text is the craftedAffix
  const craftedAffix = slot.affixes[0]?.text ?? "";
  const value = parseValueFromCraftedAffix(craftedAffix);
  return {
    skillType: "magnificent_support",
    name: slot.name,
    tier: slot.tier,
    rank: slot.rank,
    craftedAffix,
    value,
  };
};

/**
 * Convert a loadout noble slot (with affixes) to a save-data slot (with craftedAffix).
 */
const toSaveDataNobleSlot = (slot: LoadoutNobleSlot): SaveDataNobleSlot => {
  // The first affix text is the craftedAffix
  const craftedAffix = slot.affixes[0]?.text ?? "";
  const value = parseValueFromCraftedAffix(craftedAffix);
  return {
    skillType: "noble_support",
    name: slot.name,
    tier: slot.tier,
    rank: slot.rank,
    craftedAffix,
    value,
  };
};

export const SupportSkillSelector: React.FC<SupportSkillSelectorProps> = ({
  mainSkill,
  selectedSlot,
  excludedSkills,
  onChange,
  slotIndex,
}) => {
  const [isMagnificentModalOpen, setIsMagnificentModalOpen] = useState(false);
  const [isNobleModalOpen, setIsNobleModalOpen] = useState(false);
  const [isActivationMediumModalOpen, setIsActivationMediumModalOpen] =
    useState(false);

  const selectedSkillName = selectedSlot?.name;
  const skillType = useMemo(
    () => getSkillType(selectedSkillName),
    [selectedSkillName],
  );

  // Get magnificent skill data for modal
  const magnificentSkill = useMemo(() => {
    if (skillType !== "magnificent" || selectedSkillName === undefined)
      return undefined;
    return getMagnificentSkill(selectedSkillName);
  }, [skillType, selectedSkillName]);

  // Get noble skill data for modal
  const nobleSkill = useMemo(() => {
    if (skillType !== "noble" || selectedSkillName === undefined)
      return undefined;
    return getNobleSkill(selectedSkillName);
  }, [skillType, selectedSkillName]);

  // Get activation medium skill data for modal
  const activationMediumSkill = useMemo(() => {
    if (skillType !== "activationMedium" || selectedSkillName === undefined)
      return undefined;
    return getActivationMediumSkill(selectedSkillName);
  }, [skillType, selectedSkillName]);

  const { options, groups } = useMemo(() => {
    // Combine all skill types for the flat options list
    const allSkills = [
      ...SupportSkills,
      ...ActivationMediumSkills,
      ...MagnificentSupportSkills,
      ...NobleSupportSkills,
    ];

    // Filter out excluded skills (but keep currently selected)
    const filteredSkills = allSkills.filter(
      (skill) =>
        skill.name === selectedSkillName ||
        !excludedSkills.includes(skill.name),
    );

    const opts: SearchableSelectOption<string>[] = filteredSkills.map(
      (skill) => ({ value: skill.name, label: skill.name }),
    );

    if (mainSkill === undefined) {
      return { options: opts, groups: undefined };
    }

    // Get available supports organized by category
    const available = listAvailableSupports(mainSkill, slotIndex);

    // Build groups, filtering by excludedSkills
    const grps: SearchableSelectOptionGroup<string>[] = [];

    // Helper to filter and create options
    const filterAndMap = (names: string[]): SearchableSelectOption<string>[] =>
      names
        .filter(
          (name) =>
            name === selectedSkillName || !excludedSkills.includes(name),
        )
        .map((name) => ({ value: name, label: name }));

    // Add groups only if they have options
    if (available.activationMedium.length > 0) {
      const filtered = filterAndMap(available.activationMedium);
      if (filtered.length > 0) {
        grps.push({ label: "Activation Medium", options: filtered });
      }
    }

    if (available.magnificent.length > 0) {
      const filtered = filterAndMap(available.magnificent);
      if (filtered.length > 0) {
        grps.push({ label: "Magnificent", options: filtered });
      }
    }

    if (available.noble.length > 0) {
      const filtered = filterAndMap(available.noble);
      if (filtered.length > 0) {
        grps.push({ label: "Noble", options: filtered });
      }
    }

    if (available.compatible.length > 0) {
      const filtered = filterAndMap(available.compatible);
      if (filtered.length > 0) {
        grps.push({ label: "Compatible", options: filtered });
      }
    }

    if (available.other.length > 0) {
      const filtered = filterAndMap(available.other);
      if (filtered.length > 0) {
        grps.push({ label: "Other", options: filtered });
      }
    }

    return { options: opts, groups: grps };
  }, [mainSkill, slotIndex, selectedSkillName, excludedSkills]);

  const skillsByName = useMemo(() => {
    const allSkills = [
      ...SupportSkills,
      ...ActivationMediumSkills,
      ...MagnificentSupportSkills,
      ...NobleSupportSkills,
    ];
    const map = new Map<string, BaseSkill>();
    for (const s of allSkills) {
      map.set(s.name, s);
    }
    return map;
  }, []);

  const handleSkillChange = (skillName: string | undefined): void => {
    if (skillName === undefined) {
      onChange(undefined);
      return;
    }

    const type = getSkillType(skillName);
    switch (type) {
      case "regular":
        onChange({
          skillType: "support",
          name: skillName as SupportSkillName,
          level: 20,
        });
        break;
      case "magnificent": {
        const magSkill = getMagnificentSkill(skillName);
        if (magSkill !== undefined) {
          const defaults = getWorstSpecialDefaults(magSkill);
          onChange({
            skillType: "magnificent_support",
            name: skillName as MagnificentSupportSkillName,
            tier: defaults.tier,
            rank: defaults.rank,
            craftedAffix: defaults.craftedAffix,
            value: 0, // Value is now derived from craftedAffix, kept for schema compatibility
          });
        }
        break;
      }
      case "noble": {
        const nobleSkillData = getNobleSkill(skillName);
        if (nobleSkillData !== undefined) {
          const defaults = getWorstSpecialDefaults(nobleSkillData);
          onChange({
            skillType: "noble_support",
            name: skillName as NobleSupportSkillName,
            tier: defaults.tier,
            rank: defaults.rank,
            craftedAffix: defaults.craftedAffix,
            value: 0, // Value is now derived from craftedAffix, kept for schema compatibility
          });
        }
        break;
      }
      case "activationMedium": {
        const amSkill = getActivationMediumSkill(skillName);
        if (amSkill !== undefined) {
          const defaults = getWorstActivationMediumDefaults(amSkill);
          onChange({
            skillType: "activation_medium",
            name: skillName as ActivationMediumSkillNmae,
            tier: defaults.tier,
            affixes: defaults.affixes,
          });
        }
        break;
      }
      default:
        onChange(undefined);
    }
  };

  const handleLevelChange = (level: number): void => {
    if (
      selectedSlot === undefined ||
      skillType !== "regular" ||
      !("name" in selectedSlot)
    )
      return;
    // selectedSlot is SupportSkillSlot since skillType === "regular"
    onChange({
      skillType: "support",
      name: selectedSlot.name as SupportSkillName,
      level,
    });
  };

  const handleMagnificentConfirm = (slot: SpecialSupportSlot): void => {
    // SpecialSupportSlot from modal is save-data compatible
    onChange(slot as SaveDataMagnificentSlot);
  };

  const handleNobleConfirm = (slot: SpecialSupportSlot): void => {
    // SpecialSupportSlot from modal is save-data compatible
    onChange(slot as SaveDataNobleSlot);
  };

  const handleActivationMediumConfirm = (
    slot: SaveDataBaseSupportSkillSlot,
  ): void => {
    onChange(slot);
  };

  const renderOption = (
    option: SearchableSelectOption<string>,
    { selected }: { active: boolean; selected: boolean },
  ): React.ReactNode => {
    const skillData = skillsByName.get(option.value);
    if (skillData === undefined) return <span>{option.label}</span>;
    return <OptionWithSkillTooltip skill={skillData} selected={selected} />;
  };

  const renderSelectedTooltip = (
    option: SearchableSelectOption<string>,
    triggerRect: DOMRect,
  ): React.ReactNode => {
    const skillData = skillsByName.get(option.value);
    if (skillData === undefined || selectedSlot === undefined) return null;
    return (
      <Tooltip isVisible={true} triggerRect={triggerRect}>
        <SupportSkillSelectedTooltipContent
          skill={skillData}
          slot={selectedSlot}
        />
      </Tooltip>
    );
  };

  return (
    <>
      <div className="flex items-center gap-2 flex-1">
        <SearchableSelect
          value={selectedSkillName}
          onChange={handleSkillChange}
          options={options}
          groups={groups}
          placeholder="<Empty slot>"
          size="sm"
          className="flex-1"
          renderOption={renderOption}
          renderSelectedTooltip={renderSelectedTooltip}
        />
        {skillType === "regular" && selectedSlot !== undefined && (
          <SearchableSelect
            value={"level" in selectedSlot ? (selectedSlot.level ?? 20) : 20}
            onChange={(val) => val !== undefined && handleLevelChange(val)}
            options={SKILL_LEVEL_OPTIONS}
            placeholder="Lv."
            size="sm"
            className="w-20"
          />
        )}
        {skillType === "magnificent" &&
          selectedSlot !== undefined &&
          "tier" in selectedSlot &&
          "rank" in selectedSlot && (
            <>
              <span className="text-xs text-zinc-500 font-medium">
                T{selectedSlot.tier} R{selectedSlot.rank}
              </span>
              <button
                type="button"
                onClick={() => setIsMagnificentModalOpen(true)}
                className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Edit magnificent support"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>
            </>
          )}
        {skillType === "noble" &&
          selectedSlot !== undefined &&
          "tier" in selectedSlot &&
          "rank" in selectedSlot && (
            <>
              <span className="text-xs text-zinc-500 font-medium">
                T{selectedSlot.tier} R{selectedSlot.rank}
              </span>
              <button
                type="button"
                onClick={() => setIsNobleModalOpen(true)}
                className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Edit noble support"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>
            </>
          )}
        {skillType === "activationMedium" &&
          selectedSlot !== undefined &&
          "tier" in selectedSlot &&
          !("rank" in selectedSlot) && (
            <>
              <span className="text-xs text-zinc-500 font-medium">
                T{selectedSlot.tier}
              </span>
              <button
                type="button"
                onClick={() => setIsActivationMediumModalOpen(true)}
                className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Edit activation medium"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>
            </>
          )}
      </div>

      {/* Magnificent Edit Modal */}
      {magnificentSkill !== undefined &&
        selectedSlot !== undefined &&
        selectedSlot.skillType === "magnificent_support" && (
          <SpecialSupportEditModal
            isOpen={isMagnificentModalOpen}
            onClose={() => setIsMagnificentModalOpen(false)}
            skill={magnificentSkill}
            currentSlot={toSaveDataMagnificentSlot(
              selectedSlot as LoadoutMagnificentSlot,
            )}
            onConfirm={handleMagnificentConfirm}
            skillType="magnificent"
          />
        )}

      {/* Noble Edit Modal */}
      {nobleSkill !== undefined &&
        selectedSlot !== undefined &&
        selectedSlot.skillType === "noble_support" && (
          <SpecialSupportEditModal
            isOpen={isNobleModalOpen}
            onClose={() => setIsNobleModalOpen(false)}
            skill={nobleSkill}
            currentSlot={toSaveDataNobleSlot(selectedSlot as LoadoutNobleSlot)}
            onConfirm={handleNobleConfirm}
            skillType="noble"
          />
        )}

      {/* Activation Medium Edit Modal */}
      {activationMediumSkill !== undefined &&
        selectedSlot !== undefined &&
        "tier" in selectedSlot &&
        "affixes" in selectedSlot && (
          <ActivationMediumEditModal
            isOpen={isActivationMediumModalOpen}
            onClose={() => setIsActivationMediumModalOpen(false)}
            skill={activationMediumSkill}
            currentSlot={selectedSlot as LoadoutActivationMediumSkillSlot}
            onConfirm={handleActivationMediumConfirm}
          />
        )}
    </>
  );
};
