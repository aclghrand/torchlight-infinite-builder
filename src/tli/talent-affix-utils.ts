import {
  type TalentNodeData,
  TalentTrees,
  type TreeName,
} from "@/src/data/talent-tree";
import type { PlacedPrism as SaveDataPlacedPrism } from "@/src/lib/save-data";
import type { Affix, AffixLine } from "./core";
import { parseMod } from "./mod-parser/index";

export type TreeSlot = "tree1" | "tree2" | "tree3" | "tree4";

export const treeDataByName: Record<TreeName, TalentNodeData[]> =
  Object.fromEntries(
    TalentTrees.map((tree) => [tree.name, tree.nodes]),
  ) as Record<TreeName, TalentNodeData[]>;

export const findTalentNodeData = (
  treeName: string,
  x: number,
  y: number,
): TalentNodeData | undefined => {
  const nodes = treeDataByName[treeName as TreeName];
  if (!nodes) return undefined;
  return nodes.find((n) => n.position.x === x && n.position.y === y);
};

export const convertAffixTextToAffix = (
  affixText: string,
  src: string,
): Affix => {
  const lines = affixText.split(/\n/);
  const affixLines: AffixLine[] = lines.map((lineText) => {
    const mods = parseMod(lineText);
    return { text: lineText, mods: mods?.map((mod) => ({ ...mod, src })) };
  });

  return { affixLines, src };
};

// Scale numeric values in affix text by a multiplier
// Excludes cooldown values from scaling (e.g., "6 s cooldown" or "Cooldown: 0.3 s")
const scaleAffixText = (text: string, multiplier: number): string => {
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
      const hasDecimal = numStr.includes(".");
      const formatted = hasDecimal
        ? scaled.toFixed(numStr.split(".")[1].length)
        : Math.round(scaled).toString();
      return sign + formatted;
    },
  );
};

interface ParsedGaugeAffix {
  targetType: "legendary" | "medium" | "micro";
  bonusText: string;
}

// Parse a Rare Gauge affix to extract target type and bonus text
const parseRareGaugeAffix = (affix: string): ParsedGaugeAffix | undefined => {
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
const getAffectedPositions = (
  prismX: number,
  prismY: number,
  gridWidth: number = 7,
  gridHeight: number = 5,
): { x: number; y: number }[] => {
  const positions: { x: number; y: number }[] = [];

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;

      const newX = prismX + dx;
      const newY = prismY + dy;

      if (newX >= 0 && newX < gridWidth && newY >= 0 && newY < gridHeight) {
        positions.push({ x: newX, y: newY });
      }
    }
  }

  return positions;
};

export const scaleTalentAffix = (
  rawAffix: string,
  points: number,
  src: string,
): Affix => {
  const scaledText = scaleAffixText(rawAffix, Math.max(1, points));
  return convertAffixTextToAffix(scaledText, src);
};

export const getPrismAffixesForNode = (
  nodePosition: { x: number; y: number },
  nodeType: "micro" | "medium" | "legendary",
  points: number,
  placedPrism: SaveDataPlacedPrism | undefined,
  treeSlot: TreeSlot,
  src: string,
): Affix[] => {
  if (!placedPrism || placedPrism.treeSlot !== treeSlot) return [];

  const affectedPositions = getAffectedPositions(
    placedPrism.position.x,
    placedPrism.position.y,
  );

  const isAffected = affectedPositions.some(
    (pos) => pos.x === nodePosition.x && pos.y === nodePosition.y,
  );

  if (!isAffected) return [];

  const prismAffixes: Affix[] = [];

  for (const gaugeAffix of placedPrism.prism.gaugeAffixes) {
    const parsed = parseRareGaugeAffix(gaugeAffix);
    if (!parsed) continue;

    if (parsed.targetType === nodeType) {
      const scaledText = scaleAffixText(parsed.bonusText, Math.max(1, points));
      prismAffixes.push(convertAffixTextToAffix(scaledText, src));
    }
  }

  return prismAffixes;
};
