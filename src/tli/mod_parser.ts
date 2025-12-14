import {
  CRIT_DMG_MOD_TYPES,
  CRIT_RATING_MOD_TYPES,
  type CritDmgModType,
  type CritRatingModType,
  DMG_MOD_TYPES,
  type DmgModType,
} from "./constants";
import type { Mod, ModOfType } from "./mod";

const isValidDmgModType = (value: string): value is DmgModType => {
  return DMG_MOD_TYPES.includes(value as DmgModType);
};

const isValidCritRatingModType = (
  value: string,
): value is CritRatingModType => {
  return CRIT_RATING_MOD_TYPES.includes(value as CritRatingModType);
};

const isValidCritDmgModType = (value: string): value is CritDmgModType => {
  return CRIT_DMG_MOD_TYPES.includes(value as CritDmgModType);
};

const parseDmgPct = (input: string): ModOfType<"DmgPct"> | undefined => {
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
  input: string,
): ModOfType<"CritRatingPct"> | undefined => {
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

const parseCritDmgPct = (
  input: string,
): ModOfType<"CritDmgPct"> | undefined => {
  // Regex to parse: +5% [additional] [Attack] Critical Strike Damage
  // The type word comes before "Critical Strike Damage"
  const pattern =
    /^([+-])?(\d+(?:\.\d+)?)% (?:(additional) )?(?:(\w+) )?critical strike damage$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const percentageStr = match[2];
  const hasAdditional = match[3] !== undefined;
  const modTypeWord = match[4];

  const value = parseFloat(percentageStr) / 100;
  const addn = hasAdditional;

  let modType: CritDmgModType = "global";
  if (modTypeWord !== undefined) {
    if (isValidCritDmgModType(modTypeWord)) {
      modType = modTypeWord;
    } else {
      return undefined;
    }
  }

  return {
    type: "CritDmgPct",
    value,
    modType,
    addn,
  };
};

const parseAspdPct = (input: string): ModOfType<"AspdPct"> | undefined => {
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

const parseCspdPct = (input: string): ModOfType<"CspdPct"> | undefined => {
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
  input: string,
): ModOfType<"AspdAndCspdPct"> | undefined => {
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
  input: string,
): ModOfType<"MinionAspdAndCspdPct"> | undefined => {
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
  input: string,
): ModOfType<"AttackBlockChancePct"> | undefined => {
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
  input: string,
): ModOfType<"SpellBlockChancePct"> | undefined => {
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
  input: string,
): ModOfType<"MaxLifePct"> | undefined => {
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
  input: string,
): ModOfType<"MaxEnergyShieldPct"> | undefined => {
  // Regex to parse: +3% Max Energy Shield
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% max energy shield$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "MaxEnergyShieldPct", value };
};

const parseArmorPct = (input: string): ModOfType<"ArmorPct"> | undefined => {
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
  input: string,
): ModOfType<"EvasionPct"> | undefined => {
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
  input: string,
): ModOfType<"LifeRegainPct"> | undefined => {
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
  input: string,
): ModOfType<"EnergyShieldRegainPct"> | undefined => {
  // Regex to parse: 1.5% Energy Shield Regain
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% energy shield regain$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "EnergyShieldRegainPct", value };
};

const _parseMultistrikeChancePct = (
  input: string,
): ModOfType<"MultistrikeChancePct"> | undefined => {
  // Regex to parse: +32% chance to Multistrike
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% chance to multistrike$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "MultistrikeChancePct", value };
};

const parseStat = (input: string): ModOfType<"Stat"> | undefined => {
  // Regex to parse: +6 Strength/Dexterity/Intelligence
  const pattern = /^([+-])?(\d+(?:\.\d+)?) (strength|dexterity|intelligence)$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]);
  const statWord = match[3].toLowerCase();
  const statType =
    statWord === "strength" ? "str" : statWord === "dexterity" ? "dex" : "int";

  return { type: "Stat", statType, value };
};

const parseStatPct = (input: string): ModOfType<"StatPct"> | undefined => {
  // Regex to parse: +4% Strength/Dexterity/Intelligence
  const pattern =
    /^([+-])?(\d+(?:\.\d+)?)% (strength|dexterity|intelligence)$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  const statWord = match[3].toLowerCase();
  const statType =
    statWord === "strength" ? "str" : statWord === "dexterity" ? "dex" : "int";

  return { type: "StatPct", statType, value };
};

const parseFervorEff = (input: string): ModOfType<"FervorEff"> | undefined => {
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
  input: string,
): ModOfType<"SteepStrikeChance"> | undefined => {
  // Regex to parse: +12% Steep Strike chance
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% steep strike chance$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "SteepStrikeChance", value };
};

const parseShadowQuant = (
  input: string,
): ModOfType<"ShadowQuant"> | undefined => {
  // Regex to parse: +2 Shadow Quantity
  const pattern = /^([+-])?(\d+) shadow quantity$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseInt(match[2], 10);
  return { type: "ShadowQuant", value };
};

/**
 * Parses an affix line string and returns extracted mods.
 *
 * Return value semantics:
 * - `undefined`: No parser matched the input (parse failure)
 * - `[]`: Successfully parsed, but no mods to extract (intentional no-op)
 * - `[...mods]`: Successfully parsed with one or more extracted mods
 */
export const parseMod = (input: string): Mod[] | undefined => {
  const normalized = input.trim().toLowerCase();

  const parsers = [
    // Offense
    parseDmgPct,
    parseCritRatingPct,
    parseCritDmgPct,
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
    parseEnergyShieldRegainPct,
    parseLifeRegainPct,
    // Attributes
    parseStat,
    parseStatPct,
    // misc
    parseFervorEff,
    parseSteepStrikeChance,
    parseShadowQuant,
    // parseMultistrikeChancePct,
    // Add more parsers here as they're implemented
  ];

  for (const parser of parsers) {
    const result = parser(normalized);
    if (result !== undefined) {
      return [result];
    }
  }

  // No parser matched
  return undefined;
};
