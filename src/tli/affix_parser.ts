import * as Affix from "./affix";
import { DmgModType, DMG_MOD_TYPES } from "./constants";

function isValidDmgModType(value: string): value is DmgModType {
  return DMG_MOD_TYPES.includes(value as DmgModType);
}

function parseDmgPct(input: string): Extract<Affix.Affix, { type: "DmgPct" }> | undefined {
  // Regex to parse: +9% [additional] [fire] damage
  const pattern =
    /^([+-])?(\d+(?:\.\d+)?)%\s+(?:(additional)\s+)?(?:(\w+)\s+)?damage$/i;
  const match = input.match(pattern);

  if (!match) {
    return undefined;
  }

  // Extract components
  const percentageStr = match[2];
  const hasAdditional = match[3] !== undefined;
  const damageTypeWord = match[4];

  // Convert percentage to decimal
  const value = parseFloat(percentageStr) / 100;

  // Determine addn flag
  const addn = hasAdditional;

  // Determine modType
  let modType: DmgModType = "global";
  if (damageTypeWord) {
    const lowerDamageType = damageTypeWord.toLowerCase();
    if (isValidDmgModType(lowerDamageType)) {
      modType = lowerDamageType;
    } else {
      // Invalid damage type - not a valid DmgPct affix
      return undefined;
    }
  }

  return {
    type: "DmgPct",
    value,
    modType,
    addn,
  };
}

export function parseAffix(input: string): Affix.Affix | undefined {
  const normalized = input.trim();

  // Try each parser in order
  const parsers = [
    parseDmgPct,
    // Add more parsers here as they're implemented
    // parseCritRatingPct,
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
  return undefined;
}
