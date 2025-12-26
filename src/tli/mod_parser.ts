import {
  CRIT_DMG_MOD_TYPES,
  CRIT_RATING_MOD_TYPES,
  type CritDmgModType,
  type CritRatingModType,
  DMG_MOD_TYPES,
  type DmgModType,
} from "./constants";
import {
  type DmgChunkType,
  DmgChunkTypes,
  type Mod,
  type ModOfType,
  type PerStackable,
  type ResPenType,
  ResPenTypes,
} from "./mod";

const isValidDmgChunkType = (value: string): value is DmgChunkType => {
  return DmgChunkTypes.includes(value as DmgChunkType);
};

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

const isValidResPenType = (value: string): value is ResPenType => {
  return ResPenTypes.includes(value as ResPenType);
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
  // Regex to parse: "+2 Shadow Quantity" or "Shadow Quantity +2"
  const pattern1 = /^([+-])?(\d+) shadow quantity$/i;
  const pattern2 = /^shadow quantity ([+-])?(\d+)$/i;

  const match = input.match(pattern1) ?? input.match(pattern2);

  if (!match) {
    return undefined;
  }

  const value = parseInt(match[2], 10);
  return { type: "ShadowQuant", value };
};

const parseShadowDmgPct = (
  input: string,
): ModOfType<"ShadowDmgPct"> | undefined => {
  // Regex to parse: [+/-]<value>% [additional] Shadow Damage
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% (?:(additional) )?shadow damage$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const percentageStr = match[2];
  const hasAdditional = match[3] !== undefined;

  const value = (sign * parseFloat(percentageStr)) / 100;
  const addn = hasAdditional;

  return {
    type: "ShadowDmgPct",
    value,
    addn,
  };
};

const parseAddsDmgAs = (input: string): ModOfType<"AddsDmgAs"> | undefined => {
  // Regex to parse: Adds 18% of Physical Damage to/as Cold Damage
  const pattern =
    /^adds (\d+(?:\.\d+)?)% of (\w+) damage (?:to|as) (\w+) damage$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[1]) / 100;
  const fromType = match[2].toLowerCase();
  const toType = match[3].toLowerCase();

  if (!isValidDmgChunkType(fromType) || !isValidDmgChunkType(toType)) {
    return undefined;
  }

  return { type: "AddsDmgAs", from: fromType, to: toType, value };
};

const parseResPenPct = (input: string): ModOfType<"ResPenPct"> | undefined => {
  // Regex to parse:
  // "+8% Cold Penetration" --> penType: cold
  // "+23% Elemental and Erosion Resistance Penetration" --> penType: all
  // "+10% Elemental Resistance Penetration" --> penType: elemental
  const allPattern =
    /^([+-])?(\d+(?:\.\d+)?)% elemental and erosion resistance penetration$/i;
  const allMatch = input.match(allPattern);
  if (allMatch) {
    const value = parseFloat(allMatch[2]) / 100;
    return { type: "ResPenPct", value, penType: "all" };
  }

  // "+10% Elemental Resistance Penetration" --> penType: elemental
  // "+10% Erosion Resistance Penetration" --> penType: erosion
  const resPattern =
    /^([+-])?(\d+(?:\.\d+)?)% (elemental|erosion) resistance penetration$/i;
  const resMatch = input.match(resPattern);
  if (resMatch) {
    const value = parseFloat(resMatch[2]) / 100;
    const penType = resMatch[3].toLowerCase() as ResPenType;
    return { type: "ResPenPct", value, penType };
  }

  // "+8% Cold Penetration", "+8% Fire Penetration", etc.
  const elementPattern =
    /^([+-])?(\d+(?:\.\d+)?)% (cold|lightning|fire) penetration$/i;
  const elementMatch = input.match(elementPattern);
  if (elementMatch) {
    const value = parseFloat(elementMatch[2]) / 100;
    const penType = elementMatch[3].toLowerCase();
    if (isValidResPenType(penType)) {
      return { type: "ResPenPct", value, penType };
    }
  }

  return undefined;
};

const parseArmorPenPct = (
  input: string,
): ModOfType<"ArmorPenPct"> | undefined => {
  // Regex to parse: +8% Armor DMG Mitigation Penetration
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% armor dmg mitigation penetration$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "ArmorPenPct", value };
};

const parseGearAspdPct = (
  input: string,
): ModOfType<"GearAspdPct"> | undefined => {
  // Regex to parse: +8% gear Attack Speed
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% gear attack speed$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "GearAspdPct", value };
};

const parseDoubleDmgChancePct = (
  input: string,
): ModOfType<"DoubleDmgChancePct"> | undefined => {
  // Regex to parse: +31% chance to deal Double Damage
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% chance to deal double damage$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  return { type: "DoubleDmgChancePct", value };
};

const parseFlatDmgToAtks = (
  input: string,
): ModOfType<"FlatDmgToAtks"> | undefined => {
  // Regex to parse: Adds 9 - 15 Fire Damage to Attacks
  const pattern = /^adds (\d+) - (\d+) (\w+) damage to attacks$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const min = parseInt(match[1], 10);
  const max = parseInt(match[2], 10);
  const dmgType = match[3].toLowerCase();

  if (!isValidDmgChunkType(dmgType)) {
    return undefined;
  }

  return { type: "FlatDmgToAtks", value: { min, max }, dmgType };
};

const parseFlatDmgToSpells = (
  input: string,
): ModOfType<"FlatDmgToSpells"> | undefined => {
  // Regex to parse: Adds 9 - 15 Fire Damage to Spells
  const pattern = /^adds (\d+) - (\d+) (\w+) damage to spells$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const min = parseInt(match[1], 10);
  const max = parseInt(match[2], 10);
  const dmgType = match[3].toLowerCase();

  if (!isValidDmgChunkType(dmgType)) {
    return undefined;
  }

  return { type: "FlatDmgToSpells", value: { min, max }, dmgType };
};

const parseMaxMana = (input: string): ModOfType<"MaxMana"> | undefined => {
  // Regex to parse: +166 Max Mana
  const pattern = /^([+-])?(\d+(?:\.\d+)?) max mana$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]);
  return { type: "MaxMana", value };
};

const parseMaxManaPct = (
  input: string,
): ModOfType<"MaxManaPct"> | undefined => {
  // Regex to parse: +90% [additional] Max Mana
  const pattern = /^([+-])?(\d+(?:\.\d+)?)% (?:(additional) )?max mana$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  const addn = match[3] !== undefined;

  return { type: "MaxManaPct", value, addn };
};

const parseGearAspdWithDmgPenalty = (
  input: string,
): [ModOfType<"GearAspdPct">, ModOfType<"DmgPct">] | undefined => {
  // Regex to parse: +57% Gear Attack Speed. -12% additional Attack Damage
  const pattern =
    /^([+-])?(\d+(?:\.\d+)?)% gear attack speed\. ([+-])(\d+(?:\.\d+)?)% additional attack damage$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const aspdValue = parseFloat(match[2]) / 100;
  const dmgSign = match[3] === "-" ? -1 : 1;
  const dmgValue = (dmgSign * parseFloat(match[4])) / 100;

  return [
    { type: "GearAspdPct", value: aspdValue },
    { type: "DmgPct", value: dmgValue, addn: true, modType: "attack" },
  ];
};

const parseFlatDmgToAtksAndSpells = (
  input: string,
): [ModOfType<"FlatDmgToAtks">, ModOfType<"FlatDmgToSpells">] | undefined => {
  // Regex to parse: Adds 9 - 15 Fire Damage to Attacks and Spells
  const pattern = /^adds (\d+) - (\d+) (\w+) damage to attacks and spells$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const min = parseInt(match[1], 10);
  const max = parseInt(match[2], 10);
  const dmgType = match[3].toLowerCase();

  if (!isValidDmgChunkType(dmgType)) {
    return undefined;
  }

  return [
    { type: "FlatDmgToAtks", value: { min, max }, dmgType },
    { type: "FlatDmgToSpells", value: { min, max }, dmgType },
  ];
};

const parseFlatDmgToAtksAndSpellsPer = (
  input: string,
): [ModOfType<"FlatDmgToAtks">, ModOfType<"FlatDmgToSpells">] | undefined => {
  // Regex to parse: Adds 22 - 27 Physical Damage to Attacks and Spells for every 1034 Mana consumed recently. Stacks up to 200 time(s)
  const pattern =
    /^adds (\d+) - (\d+) (\w+) damage to attacks and spells for every (\d+) mana consumed recently\. stacks up to (\d+) time\(s\)$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const min = parseInt(match[1], 10);
  const max = parseInt(match[2], 10);
  const dmgType = match[3].toLowerCase();
  const amt = parseInt(match[4], 10);
  const limit = parseInt(match[5], 10);

  if (!isValidDmgChunkType(dmgType)) {
    return undefined;
  }

  const per: PerStackable = { stackable: "mana_consumed_recently", amt, limit };

  return [
    { type: "FlatDmgToAtks", value: { min, max }, dmgType, per },
    { type: "FlatDmgToSpells", value: { min, max }, dmgType, per },
  ];
};

const parseDmgPctPerManaConsumedRecently = (
  input: string,
): ModOfType<"DmgPct"> | undefined => {
  // Regex to parse: +7% Spell Damage for every 100 Mana consumed recently, up to 432%
  const pattern =
    /^([+-])?(\d+(?:\.\d+)?)% (\w+) damage for every (\d+) mana consumed recently, up to (\d+(?:\.\d+)?)%$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;
  const modTypeWord = match[3].toLowerCase();
  const amt = parseInt(match[4], 10);
  const valueLimit = parseFloat(match[5]) / 100;

  if (!isValidDmgModType(modTypeWord)) {
    return undefined;
  }

  const per: PerStackable = {
    stackable: "mana_consumed_recently",
    amt,
    valueLimit,
  };

  return {
    type: "DmgPct",
    value,
    modType: modTypeWord,
    addn: false,
    per,
  };
};

const parseCritRatingAndCritDmgPct = (
  input: string,
): [ModOfType<"CritRatingPct">, ModOfType<"CritDmgPct">] | undefined => {
  // Regex to parse: +5% Critical Strike Rating and Critical Strike Damage
  const pattern =
    /^([+-])?(\d+(?:\.\d+)?)% critical strike rating and critical strike damage$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[2]) / 100;

  return [
    { type: "CritRatingPct", value, modType: "global" },
    { type: "CritDmgPct", value, modType: "global", addn: false },
  ];
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

  // Multi-mod parsers (return arrays directly)
  const multiModParsers = [
    parseGearAspdWithDmgPenalty,
    parseFlatDmgToAtksAndSpellsPer,
    parseFlatDmgToAtksAndSpells,
    parseCritRatingAndCritDmgPct,
  ];

  for (const parser of multiModParsers) {
    const result = parser(normalized);
    if (result !== undefined) {
      return result;
    }
  }

  const parsers = [
    // Offense
    // basic offense
    parseDmgPctPerManaConsumedRecently,
    parseDmgPct,
    parseCritRatingPct,
    parseCritDmgPct,
    parseMinionAspdAndCspdPct,
    parseAspdAndCspdPct,
    parseAspdPct,
    parseCspdPct,
    // misc offense
    parseFervorEff,
    parseSteepStrikeChance,
    parseShadowQuant,
    parseShadowDmgPct,
    parseAddsDmgAs,
    parseResPenPct,
    parseArmorPenPct,
    parseGearAspdPct,
    parseDoubleDmgChancePct,
    parseFlatDmgToAtks,
    parseFlatDmgToSpells,

    // Resource parsers
    parseMaxMana,
    parseMaxManaPct,

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
