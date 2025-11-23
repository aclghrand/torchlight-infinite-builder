import { Affix, AffixOfType } from "./affix";
import {
  DmgModType,
  DMG_MOD_TYPES,
  CritRatingModType,
  CRIT_RATING_MOD_TYPES,
} from "./constants";

type ParseResult = "unrecognized" | "unimplemented" | Affix;

const isValidDmgModType = (value: string): value is DmgModType => {
  return DMG_MOD_TYPES.includes(value as DmgModType);
};

const isValidCritRatingModType = (
  value: string
): value is CritRatingModType => {
  return CRIT_RATING_MOD_TYPES.includes(value as CritRatingModType);
};

const parseDmgPct = (input: string): AffixOfType<"DmgPct"> | undefined => {
  // Regex to parse: +9% [additional] [fire] damage
  const pattern =
    /^([+-])?(\d+(?:\.\d+)?)% (?:(additional) )?(?:(\w+) )?damage$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const percentageStr = match[2];
  const hasAdditional = match[3] !== undefined;
  const damageTypeWord = match[4];

  const value = parseFloat(percentageStr) / 100;
  const addn = hasAdditional;

  let modType: DmgModType = "global";
  if (damageTypeWord !== undefined) {
    if (isValidDmgModType(damageTypeWord)) {
      modType = damageTypeWord;
    } else {
      return undefined;
    }
  }

  return {
    type: "DmgPct",
    value,
    modType,
    addn,
  };
};

const parseCritRatingPct = (
  input: string
): AffixOfType<"CritRatingPct"> | undefined => {
  // Regex to parse: +10% [Attack] Critical Strike Rating
  // The type word comes before "Critical Strike Rating"
  const pattern =
    /^([+-])?(\d+(?:\.\d+)?)% (?:(\w+) )?critical strike rating$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const percentageStr = match[2];
  const modTypeWord = match[3];

  const value = parseFloat(percentageStr) / 100;

  let modType: CritRatingModType = "global";
  if (modTypeWord !== undefined) {
    if (isValidCritRatingModType(modTypeWord)) {
      modType = modTypeWord;
    } else {
      return undefined;
    }
  }

  return {
    type: "CritRatingPct",
    value,
    modType,
  };
};

const parseAspdPct = (input: string): AffixOfType<"AspdPct"> | undefined => {
  // Regex to parse: +6% [additional] attack speed
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% (?:(additional) )?attack speed$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const percentageStr = match[2];
  const hasAdditional = match[3] !== undefined;

  const value = parseFloat(percentageStr) / 100;
  const addn = hasAdditional;

  return {
    type: "AspdPct",
    value,
    addn,
  };
};

const parseCspdPct = (input: string): AffixOfType<"CspdPct"> | undefined => {
  // Regex to parse: +6% [additional] cast speed
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% (?:(additional) )?cast speed$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const percentageStr = match[2];
  const hasAdditional = match[3] !== undefined;

  const value = parseFloat(percentageStr) / 100;
  const addn = hasAdditional;

  return {
    type: "CspdPct",
    value,
    addn,
  };
};

const parseAspdAndCspdPct = (
  input: string
): AffixOfType<"AspdAndCspdPct"> | undefined => {
  // Regex to parse: +6% [additional] attack and cast speed
  const pattern =
    /^([+-])?(\d+(?:\.\d+)?)% (?:(additional) )?attack and cast speed$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const percentageStr = match[2];
  const hasAdditional = match[3] !== undefined;

  const value = parseFloat(percentageStr) / 100;
  const addn = hasAdditional;

  return {
    type: "AspdAndCspdPct",
    value,
    addn,
  };
};

const parseMinionAspdAndCspdPct = (
  input: string
): AffixOfType<"MinionAspdAndCspdPct"> | undefined => {
  // Regex to parse: +6% [additional] minion attack and cast speed
  const pattern =
    /^([+-])?(\d+(?:\.\d+)?)% (?:(additional) )?minion attack and cast speed$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const percentageStr = match[2];
  const hasAdditional = match[3] !== undefined;

  const value = parseFloat(percentageStr) / 100;
  const addn = hasAdditional;

  return {
    type: "MinionAspdAndCspdPct",
    value,
    addn,
  };
};

const parseAttackBlockChancePct = (
  input: string
): AffixOfType<"AttackBlockChancePct"> | undefined => {
  // Regex to parse: +4% Attack Block Chance
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% attack block chance$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "AttackBlockChancePct", value };
};

const parseSpellBlockChancePct = (
  input: string
): AffixOfType<"SpellBlockChancePct"> | undefined => {
  // Regex to parse: +4% Spell Block Chance
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% spell block chance$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "SpellBlockChancePct", value };
};

const parseMaxLifePct = (
  input: string
): AffixOfType<"MaxLifePct"> | undefined => {
  // Regex to parse: +3% Max Life
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% max life$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "MaxLifePct", value };
};

const parseMaxEnergyShieldPct = (
  input: string
): AffixOfType<"MaxEnergyShieldPct"> | undefined => {
  // Regex to parse: +3% Max Energy Shield
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% max energy shield$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "MaxEnergyShieldPct", value };
};

const parseArmorPct = (
  input: string
): AffixOfType<"ArmorPct"> | undefined => {
  // Regex to parse: +5% Armor
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% armor$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "ArmorPct", value };
};

const parseEvasionPct = (
  input: string
): AffixOfType<"EvasionPct"> | undefined => {
  // Regex to parse: +5% Evasion
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% evasion$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "EvasionPct", value };
};

const parseLifeRegainPct = (
  input: string
): AffixOfType<"LifeRegainPct"> | undefined => {
  // Regex to parse: 1.5% Life Regain
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% life regain$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "LifeRegainPct", value };
};

const parseEnergyShieldRegainPct = (
  input: string
): AffixOfType<"EnergyShieldRegainPct"> | undefined => {
  // Regex to parse: 1.5% Energy Shield Regain
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% energy shield regain$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "EnergyShieldRegainPct", value };
};

const parseMultistrikeChancePct = (
  input: string
): AffixOfType<"MultistrikeChancePct"> | undefined => {
  // Regex to parse: +32% chance to Multistrike
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% chance to multistrike$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "MultistrikeChancePct", value };
};

const parseStr = (input: string): AffixOfType<"Str"> | undefined => {
  // Regex to parse: +6 Strength
  const pattern = /^([+-])?(\d+(?:\.\d+)?) strength$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]);
  return { type: "Str", value };
};

const parseDex = (input: string): AffixOfType<"Dex"> | undefined => {
  // Regex to parse: +6 Dexterity
  const pattern = /^([+-])?(\d+(?:\.\d+)?) dexterity$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]);
  return { type: "Dex", value };
};

const parseStrPct = (input: string): AffixOfType<"StrPct"> | undefined => {
  // Regex to parse: +4% Strength
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% strength$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "StrPct", value };
};

const parseDexPct = (input: string): AffixOfType<"DexPct"> | undefined => {
  // Regex to parse: +4% Dexterity
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% dexterity$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "DexPct", value };
};

const parseFervorEff = (
  input: string
): AffixOfType<"FervorEff"> | undefined => {
  // Regex to parse: +4% Fervor effect
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% fervor effect$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "FervorEff", value };
};

const parseSteepStrikeChance = (
  input: string
): AffixOfType<"SteepStrikeChance"> | undefined => {
  // Regex to parse: +12% Steep Strike chance
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% steep strike chance$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "SteepStrikeChance", value };
};

export const parseAffix = (input: string): ParseResult => {
  const normalized = input.trim().toLowerCase();

  const parsers = [
    // Offense
    parseDmgPct,
    parseCritRatingPct,
    parseMinionAspdAndCspdPct,
    parseAspdAndCspdPct,
    parseAspdPct,
    parseCspdPct,
    // Defense parsers
    parseAttackBlockChancePct,
    parseSpellBlockChancePct,
    parseMaxLifePct,
    parseMaxEnergyShieldPct,
    parseArmorPct,
    parseEvasionPct,
    parseEnergyShieldRegainPct, // Must come before parseLifeRegainPct
    parseLifeRegainPct,
    // Attributes
    parseStr,
    parseDex,
    parseStrPct,
    parseDexPct,
    // misc
    parseFervorEff,
    parseSteepStrikeChance,
    parseMultistrikeChancePct,
    // Add more parsers here as they're implemented
    // parseCritDmgPct,
    // etc.
  ];

  for (const parser of parsers) {
    const result = parser(normalized);
    if (result !== undefined) {
      return result;
    }
  }

  // No parser matched
  return "unrecognized";
};
