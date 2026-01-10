import { Prisms } from "@/src/data/prism/prisms";
import type { PlacedPrism, PrismRarity } from "./save-data";

export interface PrismAffix {
  type: string;
  rarity: string;
  affix: string;
}

export const getBaseAffixes = (rarity: PrismRarity): PrismAffix[] => {
  const prefix = rarity === "rare" ? "Adds" : "Replaces";
  return Prisms.filter(
    (p) => p.type === "Base Affix" && p.affix.startsWith(prefix),
  );
};

export const getRareGaugeAffixes = (): PrismAffix[] => {
  return Prisms.filter((p) => p.type === "Prism Gauge" && p.rarity === "Rare");
};

export const getLegendaryGaugeAffixes = (): PrismAffix[] => {
  return Prisms.filter(
    (p) => p.type === "Prism Gauge" && p.rarity === "Legendary",
  );
};

export const getMaxRareGaugeAffixes = (): number => 2;

export const getMaxLegendaryGaugeAffixes = (rarity: PrismRarity): number =>
  rarity === "legendary" ? 1 : 0;

export const getMaxTotalGaugeAffixes = (rarity: PrismRarity): number =>
  getMaxRareGaugeAffixes() + getMaxLegendaryGaugeAffixes(rarity);

// Types for prism gauge affix effects
export interface ParsedGaugeAffix {
  targetType: "legendary" | "medium" | "micro";
  bonusText: string;
}

export interface NodeBonusAffix {
  bonusText: string;
}

// Parse a Rare Gauge affix to extract target type and bonus text
export const parseRareGaugeAffix = (
  affix: string,
): ParsedGaugeAffix | undefined => {
  // Pattern: "All <type> Talent within the area also gain: <bonus>"
  // Use [\s\S]* instead of .* with s flag to match across newlines
  const match = affix.match(
    /^All (Legendary Medium|Medium|Micro) Talent within the area also gain:\s*([\s\S]+)$/,
  );
  if (!match) return undefined;

  const typeMapping: Record<string, ParsedGaugeAffix["targetType"]> = {
    "Legendary Medium": "legendary",
    Medium: "medium",
    Micro: "micro",
  };

  return { targetType: typeMapping[match[1]], bonusText: match[2].trim() };
};

// Get positions affected by a prism (8 surrounding nodes in 3x3 area)
export const getAffectedPositions = (
  prismX: number,
  prismY: number,
  gridWidth: number = 7,
  gridHeight: number = 5,
): { x: number; y: number }[] => {
  const positions: { x: number; y: number }[] = [];

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      // Skip the prism position itself
      if (dx === 0 && dy === 0) continue;

      const newX = prismX + dx;
      const newY = prismY + dy;

      // Check bounds
      if (newX >= 0 && newX < gridWidth && newY >= 0 && newY < gridHeight) {
        positions.push({ x: newX, y: newY });
      }
    }
  }

  return positions;
};

// Scale numeric values in affix text by a multiplier
// Handles integers and decimals, e.g. "+8% Movement Speed" -> "+16% Movement Speed" when scaled by 2
// Excludes cooldown values from scaling (e.g., "6 s cooldown" or "Cooldown: 0.3 s")
export const scaleAffixText = (text: string, multiplier: number): string => {
  // Patterns for cooldown values that should NOT be scaled:
  // - "X s cooldown" (e.g., "6 s cooldown against the same target")
  // - "Cooldown: X s" (e.g., "Cooldown: 0.3 s")
  const cooldownPatterns = [
    /(\d+(?:\.\d+)?)\s*s\s+cooldown/gi,
    /Cooldown:\s*(\d+(?:\.\d+)?)\s*s/gi,
  ];

  // Collect cooldown values and their positions to preserve them
  const cooldownMatches: { start: number; end: number; original: string }[] =
    [];
  for (const pattern of cooldownPatterns) {
    for (const match of text.matchAll(pattern)) {
      cooldownMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        original: match[0],
      });
    }
  }

  // Scale numbers, but skip those within cooldown ranges
  return text.replace(
    /([+-]?)(\d+(?:\.\d+)?)/g,
    (match, sign, numStr, offset) => {
      // Check if this number is within a cooldown pattern
      const isInCooldown = cooldownMatches.some(
        (cm) => offset >= cm.start && offset < cm.end,
      );
      if (isInCooldown) {
        return match; // Return original, don't scale
      }

      const num = parseFloat(numStr);
      const scaled = num * multiplier;
      // Format: preserve decimal places if original had them, otherwise use integer
      const hasDecimal = numStr.includes(".");
      const formatted = hasDecimal
        ? scaled.toFixed(numStr.split(".")[1].length)
        : Math.round(scaled).toString();
      return sign + formatted;
    },
  );
};

// Get bonus affixes that apply to a specific node from the placed prism
// Scales the bonus values based on allocated points (like normal talent affixes)
// When 0 points allocated, displays as if 1 point (shows base value)
export const getNodeBonusAffixes = (
  nodePosition: { x: number; y: number },
  nodeType: "micro" | "medium" | "legendary",
  placedPrism: PlacedPrism | undefined,
  treeSlot: string,
  allocatedPoints: number,
): NodeBonusAffix[] => {
  if (!placedPrism || placedPrism.treeSlot !== treeSlot) return [];

  const affectedPositions = getAffectedPositions(
    placedPrism.position.x,
    placedPrism.position.y,
  );

  const isAffected = affectedPositions.some(
    (pos) => pos.x === nodePosition.x && pos.y === nodePosition.y,
  );

  if (!isAffected) return [];

  const bonuses: NodeBonusAffix[] = [];

  for (const gaugeAffix of placedPrism.prism.gaugeAffixes) {
    const parsed = parseRareGaugeAffix(gaugeAffix);
    if (!parsed) continue;

    // Match node type to affix target type
    if (parsed.targetType === nodeType) {
      // Scale the bonus text by allocated points (minimum 1 to show base value)
      const scaledText = scaleAffixText(
        parsed.bonusText,
        Math.max(1, allocatedPoints),
      );
      bonuses.push({ bonusText: scaledText });
    }
  }

  return bonuses;
};
