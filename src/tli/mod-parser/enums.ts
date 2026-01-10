import { CoreTalentNames } from "../../data/core-talent";
import {
  CRIT_DMG_MOD_TYPES,
  CRIT_RATING_MOD_TYPES,
  DMG_MOD_TYPES,
} from "../constants";
import {
  DmgChunkTypes,
  InfiltrationTypes,
  MinionDmgModTypes,
  ResPenTypes,
  ResTypes,
  SkillLevelTypes,
} from "../mod";

// Global enum registry for validation
export const enumRegistry = new Map<string, Set<string>>();

// Register an enum for validation
export const registerEnum = (name: string, values: readonly string[]): void => {
  enumRegistry.set(name, new Set(values.map((v) => v.toLowerCase())));
};

// Register all enums used by templates
registerEnum("DmgModType", DMG_MOD_TYPES);
registerEnum("CritRatingModType", CRIT_RATING_MOD_TYPES);
registerEnum("CritDmgModType", CRIT_DMG_MOD_TYPES);
registerEnum("DmgChunkType", DmgChunkTypes);
registerEnum("MinionDmgModType", MinionDmgModTypes);
registerEnum("ResPenType", ResPenTypes);
registerEnum("CoreTalentName", CoreTalentNames);
registerEnum("SkillLevelType", SkillLevelTypes);
registerEnum("ResType", ResTypes);
registerEnum("InfiltrationType", InfiltrationTypes);

// GearDmgModType for FlatGearDmg (includes "elemental" unlike DmgChunkType)
export const GearDmgModTypes = [
  "physical",
  "cold",
  "lightning",
  "fire",
  "erosion",
  "elemental",
] as const;
registerEnum("GearDmgModType", GearDmgModTypes);

// Custom word mappings for enums (input word -> output value)
export const StatWordMapping: Record<string, string> = {
  strength: "str",
  dexterity: "dex",
  intelligence: "int",
};

// Register stat word enum
registerEnum("StatWord", ["strength", "dexterity", "intelligence"]);
