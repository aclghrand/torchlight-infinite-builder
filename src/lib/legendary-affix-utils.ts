import { CoreTalents } from "@/src/data/core-talent/core-talents";
import { Talents } from "@/src/data/talent/talents";
import type { DivinityAffixType } from "@/src/tli/core";

export interface LegendaryAffix {
  effect: string;
  type: DivinityAffixType;
  displayName?: string;
  isCoreTalent: boolean;
}

/**
 * Get all talent affixes (Legendary Medium, Medium, Micro) pooled from all gods.
 * Deduplicates by effect text.
 */
export const getAllTalentAffixes = (): LegendaryAffix[] => {
  const seen = new Map<string, LegendaryAffix>();

  Talents.filter(
    (t) =>
      t.type === "Legendary Medium" ||
      t.type === "Medium" ||
      t.type === "Micro",
  ).forEach((t) => {
    if (!seen.has(t.effect)) {
      seen.set(t.effect, {
        effect: t.effect,
        type: t.type as DivinityAffixType,
        isCoreTalent: false,
      });
    }
  });

  return Array.from(seen.values());
};

/**
 * Get all core talents with their names (for display) and effects.
 * For legendary slates, core talents display only the name, not the effect.
 */
export const getAllCoreTalents = (): LegendaryAffix[] => {
  const seen = new Map<string, LegendaryAffix>();

  CoreTalents.forEach((ct) => {
    if (!seen.has(ct.name)) {
      seen.set(ct.name, {
        effect: ct.affix,
        type: "Core",
        displayName: ct.name,
        isCoreTalent: true,
      });
    }
  });

  return Array.from(seen.values());
};

/**
 * Get all affixes available for legendary slates (talents + core talents).
 */
export const getAllLegendaryAffixes = (): LegendaryAffix[] => {
  return [...getAllTalentAffixes(), ...getAllCoreTalents()];
};

/**
 * Filter affixes by allowed types for a specific slot constraint.
 */
export const filterAffixesByTypes = (
  affixes: LegendaryAffix[],
  allowedTypes: DivinityAffixType[],
): LegendaryAffix[] => {
  return affixes.filter((a) => allowedTypes.includes(a.type));
};

/**
 * Get affixes filtered by a specific type.
 */
export const getAffixesByType = (type: DivinityAffixType): LegendaryAffix[] => {
  if (type === "Core") {
    return getAllCoreTalents();
  }
  return getAllTalentAffixes().filter((a) => a.type === type);
};

/**
 * Get the display text for an affix.
 * For core talents, returns the name; for others, returns the effect.
 */
export const getAffixDisplayText = (affix: LegendaryAffix): string => {
  if (affix.isCoreTalent && affix.displayName !== undefined) {
    return affix.displayName;
  }
  return affix.effect.split("\n")[0];
};
