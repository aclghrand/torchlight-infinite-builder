import type {
  BaseMagnificentSupportSkill,
  BaseNobleSupportSkill,
} from "@/src/data/skill/types";

/**
 * Type union for any special support skill (Magnificent or Noble).
 */
export type SpecialSupportSkill =
  | BaseMagnificentSupportSkill
  | BaseNobleSupportSkill;

/**
 * Tier range with min and max values (parsed from description).
 */
export interface TierRange {
  min: number;
  max: number;
}

/** Regex pattern for matching tier ranges like (16-18) or (16–18) */
const TIER_RANGE_PATTERN = /\((-?\d+(?:\.\d+)?)[–-](-?\d+(?:\.\d+)?)\)/;

/**
 * Parse a tier range from description text.
 * Matches patterns like "(16-18)" or "(16–18)" (en-dash).
 * @returns The parsed range or undefined if no range found
 */
export const parseTierRange = (text: string): TierRange | undefined => {
  // Match patterns like (16-18) or (16–18) with optional decimals
  const match = text.match(TIER_RANGE_PATTERN);
  if (match === null) return undefined;
  return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
};

/**
 * Find the tier-scaled description in the skill's description array.
 * Returns the description text and its index, or undefined if none found.
 */
export const findTierScaledDescription = (
  skill: SpecialSupportSkill,
): { text: string; index: number } | undefined => {
  for (let i = 0; i < skill.description.length; i++) {
    if (TIER_RANGE_PATTERN.test(skill.description[i])) {
      return { text: skill.description[i], index: i };
    }
  }
  return undefined;
};

/**
 * Get the tier range for a special support skill.
 * Searches through all descriptions to find the tier-scaled one.
 * Returns undefined if no tier-scaled value exists.
 */
export const getTierRange = (
  skill: SpecialSupportSkill,
): TierRange | undefined => {
  const tierScaled = findTierScaledDescription(skill);
  if (tierScaled === undefined) return undefined;
  return parseTierRange(tierScaled.text);
};

/**
 * Get the number of decimal places in a number.
 */
const getDecimalPlaces = (num: number): number => {
  const str = num.toString();
  const decimalIndex = str.indexOf(".");
  return decimalIndex === -1 ? 0 : str.length - decimalIndex - 1;
};

/**
 * Get the decimal places to use for a tier range.
 * Uses the maximum precision from min and max values.
 */
export const getRangeDecimalPlaces = (range: TierRange): number => {
  return Math.max(getDecimalPlaces(range.min), getDecimalPlaces(range.max));
};

/**
 * Interpolate value from percentage within tier range.
 * Preserves decimal precision based on the range's min/max values.
 * @param range - The tier range with min and max values
 * @param percentage - Value from 0-100 representing quality
 * @returns The interpolated value with appropriate decimal precision
 */
export const interpolateSpecialValue = (
  range: TierRange,
  percentage: number,
): number => {
  const decimalPlaces = getRangeDecimalPlaces(range);
  const rawValue = range.min + (range.max - range.min) * (percentage / 100);
  const multiplier = 10 ** decimalPlaces;
  return Math.round(rawValue * multiplier) / multiplier;
};

/**
 * Calculate percentage from value within tier range.
 * @param range - The tier range with min and max values
 * @param value - The current value
 * @returns The percentage (0-100) representing where the value falls in the range
 */
export const getQualityPercentage = (
  range: TierRange,
  value: number,
): number => {
  if (range.max === range.min) return 100;
  return Math.round(((value - range.min) / (range.max - range.min)) * 100);
};

/**
 * Generate the crafted affix string by replacing the range in the tier-scaled description with the value.
 * @param skill - The special support skill
 * @param value - The crafted value
 * @returns The crafted affix string
 */
export const formatCraftedAffix = (
  skill: SpecialSupportSkill,
  value: number,
): string => {
  const tierScaled = findTierScaledDescription(skill);
  if (tierScaled === undefined) return "";

  // Replace the range pattern with the value, preserving existing sign
  const formatted = tierScaled.text.replace(
    /([+-])?\((-?\d+(?:\.\d+)?)[–-](-?\d+(?:\.\d+)?)\)/,
    (_, sign) => `${sign ?? ""}${value}`,
  );
  return formatted;
};

/**
 * Parse the value from a crafted affix string.
 * Extracts the numeric value from patterns like "+17% additional damage..."
 */
export const parseValueFromCraftedAffix = (craftedAffix: string): number => {
  const match = craftedAffix.match(/([+-]?\d+(?:\.\d+)?)/);
  if (match === null) return 0;
  return parseFloat(match[1]);
};

/**
 * Get the worst (lowest quality) defaults for a special support skill.
 * Defaults to tier 2, rank 1, and the minimum value for the tier range.
 */
export const getWorstSpecialDefaults = (
  skill: SpecialSupportSkill,
): { tier: 0 | 1 | 2; rank: 1 | 2 | 3 | 4 | 5; craftedAffix: string } => {
  const tier = 2 as const;
  const rank = 1 as const;
  const tierRange = getTierRange(skill);
  const value = tierRange?.min ?? 0;
  const craftedAffix = formatCraftedAffix(skill, value);
  return { tier, rank, craftedAffix };
};

// Backward compatibility aliases
export const interpolateMagnificentValue = interpolateSpecialValue;
export const getWorstMagnificentDefaults = getWorstSpecialDefaults;
