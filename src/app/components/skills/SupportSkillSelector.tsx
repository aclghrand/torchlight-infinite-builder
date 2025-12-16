import { useMemo } from "react";
import {
  SearchableSelect,
  type SearchableSelectOption,
  type SearchableSelectOptionGroup,
} from "@/src/app/components/ui/SearchableSelect";
import { listAvailableSupports } from "@/src/app/lib/skill-utils";
import {
  ActivationMediumSkills,
  MagnificentSupportSkills,
  NobleSupportSkills,
  SupportSkills,
} from "@/src/data/skill";
import type { BaseActiveSkill, BaseSkill } from "@/src/data/skill/types";

interface SupportSkillSelectorProps {
  mainSkill: BaseActiveSkill | BaseSkill | undefined;
  selectedSkill?: string;
  excludedSkills: string[];
  onChange: (skillName: string | undefined) => void;
  slotIndex: number; // 1-indexed
  level?: number;
  onLevelChange?: (level: number) => void;
}

const SKILL_LEVEL_OPTIONS = Array.from({ length: 20 }, (_, i) => ({
  value: i + 1,
  label: `Lv. ${i + 1}`,
}));

export const SupportSkillSelector: React.FC<SupportSkillSelectorProps> = ({
  mainSkill,
  selectedSkill,
  excludedSkills,
  onChange,
  slotIndex,
  level,
  onLevelChange,
}) => {
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
        skill.name === selectedSkill || !excludedSkills.includes(skill.name),
    );

    const opts: SearchableSelectOption<string>[] = filteredSkills.map(
      (skill) => ({
        value: skill.name,
        label: skill.name,
      }),
    );

    if (!mainSkill) {
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
          (name) => name === selectedSkill || !excludedSkills.includes(name),
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
  }, [mainSkill, slotIndex, selectedSkill, excludedSkills]);

  // Check if selected skill is a regular Support type (not Activation Medium, Magnificent, or Noble)
  const isRegularSupport = useMemo(
    () => SupportSkills.some((s) => s.name === selectedSkill),
    [selectedSkill],
  );

  return (
    <div className="flex items-center gap-2 flex-1">
      <SearchableSelect
        value={selectedSkill}
        onChange={onChange}
        options={options}
        groups={groups}
        placeholder="<Empty slot>"
        size="sm"
        className="flex-1"
      />
      {isRegularSupport && onLevelChange && (
        <SearchableSelect
          value={level ?? 20}
          onChange={(val) => val !== undefined && onLevelChange(val)}
          options={SKILL_LEVEL_OPTIONS}
          placeholder="Lv."
          size="sm"
          className="w-20"
        />
      )}
    </div>
  );
};
