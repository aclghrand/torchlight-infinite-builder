import {
  ActiveSkills,
  type ActiveSkillName as DataSkillName,
  type SkillTag,
} from "../../data/skill";
import type { Mod, StatType } from "../mod";

export type SkillName = DataSkillName | "[Test] Simple Attack";

export interface SkillConfiguration {
  skillName: SkillName;
  stats: StatType[];
  addedDmgEffPct: number;
}

export const offensiveSkillConfs = [
  {
    skillName: "[Test] Simple Attack",
    stats: ["dex", "str"],
    addedDmgEffPct: 1,
  },
  {
    skillName: "Berserking Blade",
    stats: ["dex", "str"],
    addedDmgEffPct: 2.1,
  },
  {
    skillName: "Frost Spike",
    stats: ["dex", "int"],
    addedDmgEffPct: 2.01,
  },
] as const satisfies readonly SkillConfiguration[];

export type ImplementedOffenseSkill =
  (typeof offensiveSkillConfs)[number]["skillName"];

export const listTags = (skillName: SkillName): SkillTag[] => {
  if (skillName === "[Test] Simple Attack") return ["Attack"];
  return ActiveSkills.find((s) => s.name === skillName)?.tags || [];
};
