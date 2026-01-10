import {
  arcaneCircleParser,
  bitingColdParser,
  bullsRageParser,
  chainLightningParser,
  chargingWarcryParser,
  corruptionParser,
  electrocuteParser,
  entangledPainParser,
  frostSpikeParser,
  iceBondParser,
  manaBoilParser,
  mindControlParser,
  secretOriginUnleashParser,
  thunderSpikeParser,
  timidParser,
} from "./active-parsers";
import {
  corrosionFocusParser,
  deepPainParser,
  electricConversionParser,
  erosionAmplificationParser,
  frigidDomainParser,
  preciseCrueltyParser,
  preciseDeepPainParser,
  preciseElectricConversionParser,
  preciseErosionAmplificationParser,
  preciseFearlessParser,
  preciseFrigidDomainParser,
  preciseSpellAmplificationParser,
  preciseSwiftnessParser,
  spellAmplificationParser,
  summonFireMagusParser,
  summonThunderMagusParser,
} from "./passive-parsers";
import type { SkillCategory, SkillParserEntry } from "./types";

// Note: Support skill parsers have been removed. Support skills now use
// generic text-based parsing via fixedAffixes and templates in generated data.

export const SKILL_PARSERS: SkillParserEntry[] = [
  {
    skillName: "Frost Spike",
    categories: ["active"],
    parser: frostSpikeParser,
  },
  { skillName: "Ice Bond", categories: ["active"], parser: iceBondParser },
  { skillName: "Bull's Rage", categories: ["active"], parser: bullsRageParser },
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
  { skillName: "Corruption", categories: ["active"], parser: corruptionParser },
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
  { skillName: "Mana Boil", categories: ["active"], parser: manaBoilParser },
  {
    skillName: "Arcane Circle",
    categories: ["active"],
    parser: arcaneCircleParser,
  },
  { skillName: "Deep Pain", categories: ["passive"], parser: deepPainParser },
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
  {
    skillName: "Biting Cold",
    categories: ["active"],
    parser: bitingColdParser,
  },
  { skillName: "Timid", categories: ["active"], parser: timidParser },
  {
    skillName: "Electric Conversion",
    categories: ["passive"],
    parser: electricConversionParser,
  },
  {
    skillName: "Frigid Domain",
    categories: ["passive"],
    parser: frigidDomainParser,
  },
  {
    skillName: "Precise: Frigid Domain",
    categories: ["passive"],
    parser: preciseFrigidDomainParser,
  },
  {
    skillName: "Summon Thunder Magus",
    categories: ["passive"],
    parser: summonThunderMagusParser,
  },
  {
    skillName: "Secret Origin Unleash",
    categories: ["active"],
    parser: secretOriginUnleashParser,
  },
  {
    skillName: "Precise: Electric Conversion",
    categories: ["passive"],
    parser: preciseElectricConversionParser,
  },
  {
    skillName: "Precise: Spell Amplification",
    categories: ["passive"],
    parser: preciseSpellAmplificationParser,
  },
  {
    skillName: "Summon Fire Magus",
    categories: ["passive"],
    parser: summonFireMagusParser,
  },
  {
    skillName: "Thunder Spike",
    categories: ["active"],
    parser: thunderSpikeParser,
  },
  {
    skillName: "Electrocute",
    categories: ["active"],
    parser: electrocuteParser,
  },
  {
    skillName: "Precise: Fearless",
    categories: ["passive"],
    parser: preciseFearlessParser,
  },
  {
    skillName: "Precise: Swiftness",
    categories: ["passive"],
    parser: preciseSwiftnessParser,
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
