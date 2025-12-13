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
  extraMods: Mod[];
}

export const offensiveSkillConfs = [
  {
    skillName: "[Test] Simple Attack",
    stats: ["dex", "str"],
    addedDmgEffPct: 1,
    extraMods: [],
  },
  {
    skillName: "Berserking Blade",
    stats: ["dex", "str"],
    addedDmgEffPct: 2.1,
    extraMods: [],
  },
  {
    skillName: "Frost Spike",
    stats: ["dex", "int"],
    addedDmgEffPct: 2.01,
    extraMods: [
      {
        type: "ConvertDmgPct",
        from: "physical",
        to: "cold",
        value: 1,
        src: "Skill: Frost Spike",
      },
    ],
  },
] as const satisfies readonly SkillConfiguration[];

export type ImplementedOffenseSkill =
  (typeof offensiveSkillConfs)[number]["skillName"];

export const listTags = (skillName: SkillName): SkillTag[] => {
  if (skillName === "[Test] Simple Attack") return ["Attack"];
  return ActiveSkills.find((s) => s.name === skillName)?.tags || [];
};
