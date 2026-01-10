import { useMemo } from "react";
import { ActiveSkills } from "@/src/data/skill";
import type { ImplementedActiveSkillName } from "@/src/data/skill/types";
import type { Loadout } from "@/src/tli/core";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "../ui/SearchableSelect";

interface SkillSelectorProps {
  loadout: Loadout;
  selectedSkill: ImplementedActiveSkillName | undefined;
  onSkillChange: (skill: ImplementedActiveSkillName | undefined) => void;
}

export const SkillSelector: React.FC<SkillSelectorProps> = ({
  loadout,
  selectedSkill,
  onSkillChange,
}) => {
  const availableSkills = useMemo(() => {
    const skillSlots = Object.values(loadout.skillPage.activeSkills);

    return skillSlots
      .filter((slot) => slot?.enabled && slot.skillName !== undefined)
      .map((slot) => slot.skillName)
      .filter((name): name is ImplementedActiveSkillName => {
        const skill = ActiveSkills.find((s) => s.name === name);
        return skill !== undefined && "levelValues" in skill;
      });
  }, [loadout.skillPage.activeSkills]);

  const options: SearchableSelectOption<ImplementedActiveSkillName>[] =
    availableSkills.map((name) => ({ value: name, label: name }));

  const handleChange = (value: ImplementedActiveSkillName | undefined) => {
    onSkillChange(value);
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-400">
        Active Skill
      </label>
      <SearchableSelect
        options={options}
        value={selectedSkill}
        onChange={handleChange}
        placeholder="Select an active skill..."
        size="default"
      />
      {availableSkills.length === 0 && (
        <p className="mt-2 text-sm text-zinc-500">
          No implemented active skills enabled. Enable an active skill in the
          Skills section (currently supported: Berserking Blade, Frost Spike).
        </p>
      )}
    </div>
  );
};
