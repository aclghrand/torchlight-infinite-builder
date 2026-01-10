import type { ActivationMediumAffixDef } from "@/src/data/skill/types";
import type { ActivationMediumTierRow } from "./progression-table";

/**
 * Patterns that indicate mutually exclusive affixes.
 * When both are found in the same tier, they form an exclusive group.
 */
const COOLDOWN_PATTERN = /Cooldown Recovery Speed/i;
const DURATION_PATTERN =
  /Duration for the supported skill|additional Duration/i;

/**
 * Detect if an affix is a cooldown-type affix.
 */
const isCooldownAffix = (affix: string): boolean => {
  return (
    COOLDOWN_PATTERN.test(affix) &&
    !DURATION_PATTERN.test(affix) &&
    !affix.includes("<Cooldown Recovery Speed or Duration Bonus>")
  );
};

/**
 * Detect if an affix is a duration-type affix.
 */
const isDurationAffix = (affix: string): boolean => {
  return DURATION_PATTERN.test(affix) && !COOLDOWN_PATTERN.test(affix);
};

/**
 * Convert tier rows to affixDefs organized by tier.
 * Detects mutually exclusive groups (cooldown vs duration).
 */
export const buildActivationMediumAffixDefs = (
  tierRows: ActivationMediumTierRow[],
): Record<0 | 1 | 2 | 3, ActivationMediumAffixDef[]> => {
  const result: Record<0 | 1 | 2 | 3, ActivationMediumAffixDef[]> = {
    0: [],
    1: [],
    2: [],
    3: [],
  };

  for (const { tier, affixes } of tierRows) {
    // Check for cooldown/duration exclusive group in this tier
    const hasCooldown = affixes.some(isCooldownAffix);
    const hasDuration = affixes.some(isDurationAffix);
    const hasExclusiveGroup = hasCooldown && hasDuration;

    const affixDefs: ActivationMediumAffixDef[] = affixes.map((affix) => {
      // Assign exclusive group if both cooldown and duration exist
      let exclusiveGroup: string | undefined;
      if (hasExclusiveGroup) {
        if (isCooldownAffix(affix)) {
          exclusiveGroup = "cooldown_duration";
        } else if (isDurationAffix(affix)) {
          exclusiveGroup = "cooldown_duration";
        }
      }

      return { affix, ...(exclusiveGroup !== undefined && { exclusiveGroup }) };
    });

    result[tier] = affixDefs;
  }

  return result;
};
