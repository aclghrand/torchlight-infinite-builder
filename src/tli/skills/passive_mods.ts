import { clamp } from "remeda";
import { PassiveSkills } from "@/src/data/skill/passive";
import type {
  BasePassiveSkill,
  PassiveSkillName,
} from "@/src/data/skill/types";
import type { Mod } from "../mod";
import { passiveSkillModFactories } from "./passive_factories";

/**
 * Get all mods for a passive skill at a given level.
 */
export const getPassiveSkillMods = (
  skillName: PassiveSkillName,
  level: number,
): { mods?: Mod[]; buffMods?: Mod[] } => {
  const clampedLevel = clamp(level, { min: 1, max: 40 });
  const factory = passiveSkillModFactories[skillName];
  if (factory === undefined) {
    // Skill has no level-scaling mods
    return {};
  }

  // Get levelValues from generated skill data
  const skill = PassiveSkills.find((s) => s.name === skillName) as
    | BasePassiveSkill
    | undefined;
  if (skill === undefined) {
    console.error(`Passive skill "${skillName}" not found`);
    return {};
  }

  const levelValues = skill.levelValues;
  if (levelValues === undefined) {
    return {};
  }

  return factory(clampedLevel, levelValues);
};
