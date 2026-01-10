import {
  GOD_GODDESS_TREES,
  isGodGoddessTree,
  PROFESSION_TREES,
  type TalentTreeData,
  TalentTrees,
  type TreeName,
} from "@/src/data/talent-tree";
import {
  isInTargetArea,
  isInverseImagePosition,
} from "@/src/lib/inverse-image-utils";
import type { PlacedInverseImage, PlacedPrism, TalentNode } from "./core";

// Re-export tree name constants and types
export { GOD_GODDESS_TREES, PROFESSION_TREES, isGodGoddessTree };
export type { TreeName, TalentTreeData };

// Convert array to record for lookup
const TALENT_TREES: Record<TreeName, TalentTreeData> = Object.fromEntries(
  TalentTrees.map((tree) => [tree.name, tree]),
) as Record<TreeName, TalentTreeData>;

// Check if a position has a placed prism
export const hasPrismAtPosition = (
  placedPrism: PlacedPrism | undefined,
  treeSlot: string,
  x: number,
  y: number,
): boolean => {
  if (!placedPrism) return false;
  return (
    placedPrism.treeSlot === treeSlot &&
    placedPrism.position.x === x &&
    placedPrism.position.y === y
  );
};

// Calculate total points in a specific column (non-reflected nodes only)
export const calculateColumnPoints = (
  nodes: TalentNode[],
  columnIndex: number,
): number => {
  return nodes
    .filter((node) => !node.isReflected && node.x === columnIndex)
    .reduce((sum, node) => sum + node.points, 0);
};

// Calculate total points allocated before a specific column (non-reflected nodes only)
export const getTotalPointsBeforeColumn = (
  nodes: TalentNode[],
  columnIndex: number,
): number => {
  let total = 0;
  for (let x = 0; x < columnIndex; x++) {
    total += calculateColumnPoints(nodes, x);
  }
  return total;
};

// Check if a column is unlocked based on point requirements (non-reflected nodes only)
export const isColumnUnlocked = (
  nodes: TalentNode[],
  columnIndex: number,
): boolean => {
  const requiredPoints = columnIndex * 3;
  const pointsAllocated = getTotalPointsBeforeColumn(nodes, columnIndex);
  return pointsAllocated >= requiredPoints;
};

// Calculate total points in a column, combining regular and reflected allocations
export const calculateCombinedColumnPoints = (
  nodes: TalentNode[],
  columnIndex: number,
): number => {
  return nodes
    .filter((node) => node.x === columnIndex && node.points > 0)
    .reduce((sum, node) => sum + node.points, 0);
};

// Check if a column is unlocked based on combined points (regular + reflected)
export const isColumnUnlockedWithReflected = (
  nodes: TalentNode[],
  columnIndex: number,
): boolean => {
  const requiredPoints = columnIndex * 3;
  let totalPointsBefore = 0;

  for (let x = 0; x < columnIndex; x++) {
    totalPointsBefore += calculateCombinedColumnPoints(nodes, x);
  }

  return totalPointsBefore >= requiredPoints;
};

// Check if a prerequisite node is fully satisfied
// If the prerequisite node has a prism, the check is bypassed (considered satisfied)
export const isPrerequisiteSatisfied = (
  prerequisite: { x: number; y: number } | undefined,
  nodes: TalentNode[],
  placedPrism?: PlacedPrism,
  treeSlot?: string,
): boolean => {
  if (!prerequisite) return true;

  // If prerequisite node has a prism, bypass the check
  if (
    placedPrism &&
    treeSlot &&
    hasPrismAtPosition(placedPrism, treeSlot, prerequisite.x, prerequisite.y)
  ) {
    return true;
  }

  const prereqNode = nodes.find(
    (n) => n.x === prerequisite.x && n.y === prerequisite.y && !n.isReflected,
  );
  if (!prereqNode) return false;

  return prereqNode.points >= prereqNode.maxPoints;
};

// Check if a node can be allocated
export const canAllocateNode = (
  node: TalentNode,
  nodes: TalentNode[],
  placedPrism?: PlacedPrism,
  treeSlot?: string,
): boolean => {
  // Cannot allocate to a node with a prism
  if (
    placedPrism &&
    treeSlot &&
    hasPrismAtPosition(placedPrism, treeSlot, node.x, node.y)
  ) {
    return false;
  }

  // Check column gating
  if (!isColumnUnlocked(nodes, node.x)) {
    return false;
  }

  // Check prerequisite
  if (
    !isPrerequisiteSatisfied(node.prerequisite, nodes, placedPrism, treeSlot)
  ) {
    return false;
  }

  // Check if already at max
  if (node.points >= node.maxPoints) {
    return false;
  }

  return true;
};

// Check if removing a point from a column would break any later column's gating
const wouldBreakColumnGating = (
  nodes: TalentNode[],
  nodeColumn: number,
  nodeX: number,
  nodeY: number,
): boolean => {
  const getTotalPointsBeforeColumnSimulated = (columnIndex: number): number => {
    let total = 0;
    for (let x = 0; x < columnIndex; x++) {
      for (const n of nodes) {
        if (n.isReflected || n.x !== x) continue;
        // Subtract 1 if this is the node we're removing from
        const adjustment =
          x === nodeColumn && n.x === nodeX && n.y === nodeY ? 1 : 0;
        total += n.points - adjustment;
      }
    }
    return total;
  };

  // Check if any allocated node in a later column would become invalid
  for (const n of nodes) {
    if (n.isReflected) continue;
    if (n.x <= nodeColumn) continue;
    if (n.points === 0) continue;

    const requiredPoints = n.x * 3;
    const pointsAfterRemoval = getTotalPointsBeforeColumnSimulated(n.x);

    if (pointsAfterRemoval < requiredPoints) {
      return true;
    }
  }

  return false;
};

// Check if a node can be deallocated
export const canDeallocateNode = (
  node: TalentNode,
  nodes: TalentNode[],
  placedPrism?: PlacedPrism,
  treeSlot?: string,
): boolean => {
  // Must have points allocated
  if (node.points === 0) {
    return false;
  }

  // Check if removing a point would break column gating for any later column
  if (wouldBreakColumnGating(nodes, node.x, node.x, node.y)) {
    return false;
  }

  // Check if any other node depends on this one being fully allocated
  // Skip nodes that have a prism on them (prism nodes don't count as allocated dependents)
  // Only check non-reflected nodes for dependents
  const hasDependents = nodes
    .filter((n) => !n.isReflected)
    .some((otherNode) => {
      if (!otherNode.prerequisite) return false;
      if (otherNode.prerequisite.x !== node.x) return false;
      if (otherNode.prerequisite.y !== node.y) return false;

      // If the dependent node has a prism, it doesn't count as a dependent
      if (
        placedPrism &&
        treeSlot &&
        hasPrismAtPosition(placedPrism, treeSlot, otherNode.x, otherNode.y)
      ) {
        return false;
      }

      // Check if the dependent node is allocated
      return otherNode.points > 0;
    });

  // If deallocating would break the fully-allocated requirement for dependents
  if (hasDependents && node.points <= node.maxPoints) {
    return false;
  }

  return true;
};

// Check if a prism can be removed without causing invalid state
// A prism cannot be removed if any dependent node has allocated points
export const canRemovePrism = (
  placedPrism: PlacedPrism,
  nodes: TalentNode[],
): boolean => {
  const { x, y } = placedPrism.position;

  // Find all nodes that depend on the prism's position
  // Only check non-reflected nodes
  const hasDependentsWithPoints = nodes
    .filter((n) => !n.isReflected)
    .some((node) => {
      if (!node.prerequisite) return false;
      if (node.prerequisite.x !== x || node.prerequisite.y !== y) return false;

      // Check if this dependent node has allocated points
      return node.points > 0;
    });

  // Cannot remove if there are dependents with allocated points
  return !hasDependentsWithPoints;
};

// Tree loading function - now synchronous since data is imported
export const loadTalentTree = (treeName: TreeName): TalentTreeData => {
  return TALENT_TREES[treeName];
};

// Check if a position has a placed inverse image
export const hasInverseImageAtPosition = (
  placedInverseImage: PlacedInverseImage | undefined,
  treeSlot: string,
  x: number,
  y: number,
): boolean => {
  return isInverseImagePosition(x, y, placedInverseImage, treeSlot);
};

// Check if prerequisite is satisfied, accounting for inverse image reflections
export const isPrerequisiteSatisfiedWithInverseImage = (
  prerequisite: { x: number; y: number } | undefined,
  nodePosition: { x: number; y: number },
  nodes: TalentNode[],
  placedPrism?: PlacedPrism,
  placedInverseImage?: PlacedInverseImage,
  treeSlot?: string,
): boolean => {
  if (!prerequisite) return true;

  // If prerequisite node has an inverse image, bypass the check (same as prisms)
  if (
    placedInverseImage &&
    treeSlot &&
    hasInverseImageAtPosition(
      placedInverseImage,
      treeSlot,
      prerequisite.x,
      prerequisite.y,
    )
  ) {
    return true;
  }

  // If node is in target area (reflected), it has no prerequisites
  if (
    placedInverseImage &&
    treeSlot &&
    isInTargetArea(nodePosition.x, nodePosition.y, placedInverseImage, treeSlot)
  ) {
    return true;
  }

  // If prerequisite position is in target area (overridden), the prerequisite is removed
  if (
    placedInverseImage &&
    treeSlot &&
    isInTargetArea(prerequisite.x, prerequisite.y, placedInverseImage, treeSlot)
  ) {
    return true;
  }

  // Otherwise use normal prism-aware prerequisite check
  return isPrerequisiteSatisfied(prerequisite, nodes, placedPrism, treeSlot);
};

// Check if a node can be allocated, accounting for inverse image
export const canAllocateNodeWithInverseImage = (
  node: TalentNode,
  nodes: TalentNode[],
  placedPrism?: PlacedPrism,
  placedInverseImage?: PlacedInverseImage,
  treeSlot?: string,
): boolean => {
  // Cannot allocate to the inverse image position itself
  if (
    placedInverseImage &&
    treeSlot &&
    hasInverseImageAtPosition(placedInverseImage, treeSlot, node.x, node.y)
  ) {
    return false;
  }

  // Cannot allocate to a node with a prism
  if (
    placedPrism &&
    treeSlot &&
    hasPrismAtPosition(placedPrism, treeSlot, node.x, node.y)
  ) {
    return false;
  }

  // Check column gating (include all nodes - regular and reflected)
  if (!isColumnUnlockedWithReflected(nodes, node.x)) {
    return false;
  }

  // Check prerequisite with inverse image awareness
  if (
    !isPrerequisiteSatisfiedWithInverseImage(
      node.prerequisite,
      { x: node.x, y: node.y },
      nodes,
      placedPrism,
      placedInverseImage,
      treeSlot,
    )
  ) {
    return false;
  }

  // Check if already at max
  if (node.points >= node.maxPoints) {
    return false;
  }

  return true;
};

// Helper to simulate removing one point from a node in the nodes array
const simulateRemovePoint = (
  nodes: TalentNode[],
  targetX: number,
  targetY: number,
): TalentNode[] => {
  return nodes.map((n) =>
    n.x === targetX && n.y === targetY ? { ...n, points: n.points - 1 } : n,
  );
};

// Check if a node can be deallocated, accounting for inverse image
export const canDeallocateNodeWithInverseImage = (
  node: TalentNode,
  nodes: TalentNode[],
  placedPrism?: PlacedPrism,
  placedInverseImage?: PlacedInverseImage,
  treeSlot?: string,
): boolean => {
  // Must have points allocated
  if (node.points === 0) {
    return false;
  }

  // Check if removing a point would break column gating for any later column
  const simulatedNodes = simulateRemovePoint(nodes, node.x, node.y);

  // Check all allocations in later columns
  for (const n of nodes) {
    if (n.x <= node.x) continue;
    if (n.points === 0) continue;

    if (!isColumnUnlockedWithReflected(simulatedNodes, n.x)) {
      return false;
    }
  }

  // Check if any other node depends on this one being fully allocated
  // Only check non-reflected nodes for dependents
  const hasDependents = nodes
    .filter((n) => !n.isReflected)
    .some((otherNode) => {
      if (!otherNode.prerequisite) return false;
      if (otherNode.prerequisite.x !== node.x) return false;
      if (otherNode.prerequisite.y !== node.y) return false;

      // If the dependent node has a prism, it doesn't count as a dependent
      if (
        placedPrism &&
        treeSlot &&
        hasPrismAtPosition(placedPrism, treeSlot, otherNode.x, otherNode.y)
      ) {
        return false;
      }

      // If the dependent node is in the inverse image target area, it doesn't count
      // (those nodes have no prerequisites)
      if (
        placedInverseImage &&
        treeSlot &&
        isInTargetArea(otherNode.x, otherNode.y, placedInverseImage, treeSlot)
      ) {
        return false;
      }

      // Check if the dependent node is allocated
      return otherNode.points > 0;
    });

  // If deallocating would break the fully-allocated requirement for dependents
  if (hasDependents && node.points <= node.maxPoints) {
    return false;
  }

  return true;
};

// Check if an inverse image can be removed
// Inverse image can only be removed if the tree has 0 allocated points
export const canRemoveInverseImage = (nodes: TalentNode[]): boolean => {
  const totalPoints = nodes.reduce((sum, n) => sum + n.points, 0);
  return totalPoints === 0;
};

// Check if a reflected node can be allocated
export const canAllocateReflectedNode = (
  node: TalentNode,
  nodes: TalentNode[],
): boolean => {
  // Check column gating
  if (!isColumnUnlockedWithReflected(nodes, node.x)) {
    return false;
  }

  // Check if already at max
  if (node.points >= node.maxPoints) {
    return false;
  }

  return true;
};

// Check if a reflected node can be deallocated
export const canDeallocateReflectedNode = (
  node: TalentNode,
  nodes: TalentNode[],
): boolean => {
  // Must have points allocated
  if (node.points === 0) {
    return false;
  }

  // Check if removing a point would break column gating for any later column
  const simulatedNodes = simulateRemovePoint(nodes, node.x, node.y);

  // Check all later columns that have allocations
  for (const n of nodes) {
    if (n.x <= node.x) continue;
    if (n.points === 0) continue;

    if (!isColumnUnlockedWithReflected(simulatedNodes, n.x)) {
      return false;
    }
  }

  return true;
};

// Check if an inverse image can be placed at a position
export const canPlaceInverseImage = (
  x: number,
  treeSlot: string,
  nodes: TalentNode[],
  placedPrism?: PlacedPrism,
  placedInverseImage?: PlacedInverseImage,
): { canPlace: boolean; reason?: string } => {
  // Only profession trees (tree2, tree3, tree4)
  if (treeSlot === "tree1") {
    return {
      canPlace: false,
      reason:
        "Inverse images can only be placed on Profession Trees (Slots 2-4)",
    };
  }

  // Not in the 3 center-most columns (columns 2, 3, 4)
  if (x >= 2 && x <= 4) {
    return {
      canPlace: false,
      reason: "Inverse images cannot be placed in the center columns (2, 3, 4)",
    };
  }

  // Tree must have 0 allocated points
  const totalPoints = nodes.reduce((sum, n) => sum + n.points, 0);
  if (totalPoints > 0) {
    return {
      canPlace: false,
      reason:
        "Inverse images can only be placed when the tree has 0 allocated points",
    };
  }

  // Cannot have both prism and inverse image in the same tree
  if (placedPrism && placedPrism.treeSlot === treeSlot) {
    return {
      canPlace: false,
      reason:
        "A prism is already placed in this tree. Remove it first to place an inverse image.",
    };
  }

  // Cannot have multiple inverse images
  if (placedInverseImage) {
    return {
      canPlace: false,
      reason: "An inverse image is already placed. Remove it first.",
    };
  }

  return { canPlace: true };
};
