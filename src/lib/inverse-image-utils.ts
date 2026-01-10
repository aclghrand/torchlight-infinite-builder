import type { TalentNodeData } from "@/src/data/talent-tree";
import type { CraftedInverseImage, PlacedInverseImage } from "@/src/tli/core";

// Reflection formula: source (x, y) -> target (6-x, 4-y)
export const reflectPosition = (
  x: number,
  y: number,
): { x: number; y: number } => ({ x: 6 - x, y: 4 - y });

// Get all positions in a 3x3 area around center, clamped to grid bounds
export const get3x3AreaPositions = (
  centerX: number,
  centerY: number,
  gridWidth: number = 7,
  gridHeight: number = 5,
): { x: number; y: number }[] => {
  const positions: { x: number; y: number }[] = [];

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const x = centerX + dx;
      const y = centerY + dy;

      if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
        positions.push({ x, y });
      }
    }
  }

  return positions;
};

// Get source area positions (3x3 around inverse image position)
export const getSourceAreaPositions = (
  inverseImageX: number,
  inverseImageY: number,
): { x: number; y: number }[] => {
  return get3x3AreaPositions(inverseImageX, inverseImageY);
};

// Get target area positions (3x3 around reflected center)
export const getTargetAreaPositions = (
  inverseImageX: number,
  inverseImageY: number,
): { x: number; y: number }[] => {
  const reflectedCenter = reflectPosition(inverseImageX, inverseImageY);
  return get3x3AreaPositions(reflectedCenter.x, reflectedCenter.y);
};

// Check if a position is the inverse image position itself
export const isInverseImagePosition = (
  x: number,
  y: number,
  placedInverseImage: PlacedInverseImage | undefined,
  treeSlot: string,
): boolean => {
  if (!placedInverseImage || placedInverseImage.treeSlot !== treeSlot) {
    return false;
  }
  return (
    placedInverseImage.position.x === x && placedInverseImage.position.y === y
  );
};

// Check if a position is in the source area (excluding inverse image position itself)
export const isInSourceArea = (
  x: number,
  y: number,
  placedInverseImage: PlacedInverseImage | undefined,
  treeSlot: string,
): boolean => {
  if (!placedInverseImage || placedInverseImage.treeSlot !== treeSlot) {
    return false;
  }

  const sourcePositions = getSourceAreaPositions(
    placedInverseImage.position.x,
    placedInverseImage.position.y,
  );

  return sourcePositions.some((pos) => pos.x === x && pos.y === y);
};

// Check if a position is in the target area (the reflected/overridden area)
export const isInTargetArea = (
  x: number,
  y: number,
  placedInverseImage: PlacedInverseImage | undefined,
  treeSlot: string,
): boolean => {
  if (!placedInverseImage || placedInverseImage.treeSlot !== treeSlot) {
    return false;
  }

  const targetPositions = getTargetAreaPositions(
    placedInverseImage.position.x,
    placedInverseImage.position.y,
  );

  return targetPositions.some((pos) => pos.x === x && pos.y === y);
};

// Get the source position for a given target position
export const getSourcePositionForTarget = (
  targetX: number,
  targetY: number,
  placedInverseImage: PlacedInverseImage,
): { x: number; y: number } | undefined => {
  if (
    !isInTargetArea(
      targetX,
      targetY,
      placedInverseImage,
      placedInverseImage.treeSlot,
    )
  ) {
    return undefined;
  }

  // The reflection is symmetric, so reflecting the target gives us the source
  return reflectPosition(targetX, targetY);
};

// Get the node data for the reflected source node
export const getReflectedNodeData = (
  targetX: number,
  targetY: number,
  treeNodes: TalentNodeData[],
  placedInverseImage: PlacedInverseImage | undefined,
  treeSlot: string,
): TalentNodeData | undefined => {
  if (!placedInverseImage || placedInverseImage.treeSlot !== treeSlot) {
    return undefined;
  }

  if (!isInTargetArea(targetX, targetY, placedInverseImage, treeSlot)) {
    return undefined;
  }

  const sourcePos = reflectPosition(targetX, targetY);
  return treeNodes.find(
    (n) => n.position.x === sourcePos.x && n.position.y === sourcePos.y,
  );
};

export interface InverseImageBonusAffix {
  bonusText: string;
}

// Get the inverse image effect modifier for a specific talent type
export const getEffectModifierForType = (
  inverseImage: CraftedInverseImage,
  nodeType: "micro" | "medium" | "legendary",
): number => {
  switch (nodeType) {
    case "micro":
      return inverseImage.microTalentEffect;
    case "medium":
      return inverseImage.mediumTalentEffect;
    case "legendary":
      return inverseImage.legendaryTalentEffect;
    default:
      return 0;
  }
};

// Format the effect modifier as display text
export const formatEffectModifier = (modifier: number): string => {
  const sign = modifier >= 0 ? "+" : "";
  return `${sign}${modifier}% Effect`;
};

// Get bonus affixes for a reflected node (the blue text showing the modifier effect)
export const getReflectedNodeBonusAffixes = (
  nodePosition: { x: number; y: number },
  nodeType: "micro" | "medium" | "legendary",
  placedInverseImage: PlacedInverseImage | undefined,
  treeSlot: string,
): InverseImageBonusAffix[] => {
  if (!placedInverseImage || placedInverseImage.treeSlot !== treeSlot) {
    return [];
  }

  if (
    !isInTargetArea(
      nodePosition.x,
      nodePosition.y,
      placedInverseImage,
      treeSlot,
    )
  ) {
    return [];
  }

  const modifier = getEffectModifierForType(
    placedInverseImage.inverseImage,
    nodeType,
  );

  return [{ bonusText: formatEffectModifier(modifier) }];
};

// Validate inverse image affix values
export const validateInverseImageValues = (
  microEffect: number,
  mediumEffect: number,
  legendaryEffect: number,
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (microEffect < -100 || microEffect > 200) {
    errors.push("Micro Talent Effect must be between -100 and 200");
  }
  if (mediumEffect < -100 || mediumEffect > 100) {
    errors.push("Medium Talent Effect must be between -100 and 100");
  }
  if (legendaryEffect < -100 || legendaryEffect > 50) {
    errors.push("Legendary Talent Effect must be between -100 and 50");
  }

  return { valid: errors.length === 0, errors };
};
