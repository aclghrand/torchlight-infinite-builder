import {
  arcaneCircleParser,
  bullsRageParser,
  chainLightningParser,
  chargingWarcryParser,
  corruptionParser,
  entangledPainParser,
  frostSpikeParser,
  iceBondParser,
  manaBoilParser,
  mindControlParser,
} from "./active_parsers";
import {
  corrosionFocusParser,
  deepPainParser,
  erosionAmplificationParser,
  preciseCrueltyParser,
  preciseDeepPainParser,
  preciseErosionAmplificationParser,
  spellAmplificationParser,
} from "./passive_parsers";
import type { SkillCategory, SkillParserEntry } from "./types";

// Note: Support skill parsers have been removed. Support skills now use
// generic text-based parsing via fixedAffixes and templates in generated data.

export const SKILL_PARSERS: SkillParserEntry[] = [
  {
    skillName: "Frost Spike",
    categories: ["active"],
    parser: frostSpikeParser,
  },
  {
    skillName: "Ice Bond",
    categories: ["active"],
    parser: iceBondParser,
  },
  {
    skillName: "Bull's Rage",
    categories: ["active"],
    parser: bullsRageParser,
  },
  {
    skillName: "Charging Warcry",
    categories: ["active"],
    parser: chargingWarcryParser,
  },
  {
    skillName: "Mind Control",
    categories: ["active"],
    parser: mindControlParser,
  },
  {
    skillName: "Entangled Pain",
    categories: ["active"],
    parser: entangledPainParser,
  },
  {
    skillName: "Corruption",
    categories: ["active"],
    parser: corruptionParser,
  },
  {
    skillName: "Precise: Cruelty",
    categories: ["passive"],
    parser: preciseCrueltyParser,
  },
  {
    skillName: "Spell Amplification",
    categories: ["passive"],
    parser: spellAmplificationParser,
  },
  {
    skillName: "Precise: Deep Pain",
    categories: ["passive"],
    parser: preciseDeepPainParser,
  },
  {
    skillName: "Precise: Erosion Amplification",
    categories: ["passive"],
    parser: preciseErosionAmplificationParser,
  },
  {
    skillName: "Corrosion Focus",
    categories: ["passive"],
    parser: corrosionFocusParser,
  },
  {
    skillName: "Mana Boil",
    categories: ["active"],
    parser: manaBoilParser,
  },
  {
    skillName: "Arcane Circle",
    categories: ["active"],
    parser: arcaneCircleParser,
  },
  {
    skillName: "Deep Pain",
    categories: ["passive"],
    parser: deepPainParser,
  },
  {
    skillName: "Erosion Amplification",
    categories: ["passive"],
    parser: erosionAmplificationParser,
  },
  {
    skillName: "Chain Lightning",
    categories: ["active"],
    parser: chainLightningParser,
  },
];

export const getParserForSkill = (
  skillName: string,
  category: SkillCategory,
): SkillParserEntry | undefined => {
  return SKILL_PARSERS.find(
    (entry) =>
      entry.skillName === skillName && entry.categories.includes(category),
  );
};
