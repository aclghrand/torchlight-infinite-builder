import {
  arcaneCircleParser,
  bullsRageParser,
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
import {
  auraAmplificationParser,
  cataclysmParser,
  controlSpellParser,
  criticalStrikeDamageIncreaseParser,
  criticalStrikeRatingIncreaseParser,
  enhancedAilmentParser,
  extendedDurationParser,
  grudgeParser,
  guardParser,
  hauntParser,
  increasedAreaParser,
  massEffectParser,
  passivationParser,
  quickDecisionParser,
  steamrollParser,
  wellFoughtBattleParser,
  willpowerParser,
} from "./support_parsers";
import type { SkillCategory, SkillParserEntry } from "./types";

export const SKILL_PARSERS: SkillParserEntry[] = [
  {
    skillName: "Willpower",
    categories: ["support"],
    parser: willpowerParser,
  },
  {
    skillName: "Haunt",
    categories: ["support"],
    parser: hauntParser,
  },
  {
    skillName: "Steamroll",
    categories: ["support"],
    parser: steamrollParser,
  },
  {
    skillName: "Quick Decision",
    categories: ["support"],
    parser: quickDecisionParser,
  },
  {
    skillName: "Critical Strike Damage Increase",
    categories: ["support"],
    parser: criticalStrikeDamageIncreaseParser,
  },
  {
    skillName: "Critical Strike Rating Increase",
    categories: ["support"],
    parser: criticalStrikeRatingIncreaseParser,
  },
  {
    skillName: "Enhanced Ailment",
    categories: ["support"],
    parser: enhancedAilmentParser,
  },
  {
    skillName: "Well-Fought Battle",
    categories: ["support"],
    parser: wellFoughtBattleParser,
  },
  {
    skillName: "Mass Effect",
    categories: ["support"],
    parser: massEffectParser,
  },
  {
    skillName: "Guard",
    categories: ["support"],
    parser: guardParser,
  },
  {
    skillName: "Passivation",
    categories: ["support"],
    parser: passivationParser,
  },
  {
    skillName: "Control Spell",
    categories: ["support"],
    parser: controlSpellParser,
  },
  {
    skillName: "Aura Amplification",
    categories: ["support"],
    parser: auraAmplificationParser,
  },
  {
    skillName: "Cataclysm",
    categories: ["support"],
    parser: cataclysmParser,
  },
  {
    skillName: "Increased Area",
    categories: ["support"],
    parser: increasedAreaParser,
  },
  {
    skillName: "Extended Duration",
    categories: ["support"],
    parser: extendedDurationParser,
  },
  {
    skillName: "Grudge",
    categories: ["support"],
    parser: grudgeParser,
  },
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
