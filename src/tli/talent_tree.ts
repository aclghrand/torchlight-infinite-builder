import {
  AllocatedTalentNode,
  PlacedPrism,
  PlacedInverseImage,
} from "@/src/app/lib/save-data";
import {
  isInTargetArea,
  isInverseImagePosition,
} from "@/src/app/lib/inverse-image-utils";
import {
  TalentTrees,
  type TalentNodeData,
  type TalentTreeData,
  type TreeName,
  GOD_GODDESS_TREES,
  PROFESSION_TREES,
  isGodGoddessTree,
} from "@/src/data/talent_tree";

// Re-export tree name constants and types
export { GOD_GODDESS_TREES, PROFESSION_TREES, isGodGoddessTree };
export type { TreeName, TalentNodeData, TalentTreeData };

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

// Calculate total points in a specific column
export const calculateColumnPoints = (
  allocatedNodes: AllocatedTalentNode[],
  columnIndex: number,
): number => {
  return allocatedNodes
    .filter((node) => node.x === columnIndex)
    .reduce((sum, node) => sum + node.points, 0);
};

// Calculate total points allocated before a specific column
export const getTotalPointsBeforeColumn = (
  allocatedNodes: AllocatedTalentNode[],
  columnIndex: number,
): number => {
  let total = 0;
  for (let x = 0; x < columnIndex; x++) {
    total += calculateColumnPoints(allocatedNodes, x);
  }
  return total;
};

// Check if a column is unlocked based on point requirements
export const isColumnUnlocked = (
  allocatedNodes: AllocatedTalentNode[],
  columnIndex: number,
): boolean => {
  const requiredPoints = columnIndex * 3;
  const pointsAllocated = getTotalPointsBeforeColumn(
    allocatedNodes,
    columnIndex,
  );
  return pointsAllocated >= requiredPoints;
};

// Check if a prerequisite node is fully satisfied
// If the prerequisite node has a prism, the check is bypassed (considered satisfied)
export const isPrerequisiteSatisfied = (
  prerequisite: { x: number; y: number } | undefined,
  allocatedNodes: AllocatedTalentNode[],
  treeData: TalentTreeData,
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

  const prereqNode = treeData.nodes.find(
    (n) => n.position.x === prerequisite.x && n.position.y === prerequisite.y,
  );
  if (!prereqNode) return false;

  const allocation = allocatedNodes.find(
    (n) => n.x === prerequisite.x && n.y === prerequisite.y,
  );

  return allocation !== undefined && allocation.points >= prereqNode.maxPoints;
};

// Check if a node can be allocated
export const canAllocateNode = (
  node: TalentNodeData,
  allocatedNodes: AllocatedTalentNode[],
  treeData: TalentTreeData,
  placedPrism?: PlacedPrism,
  treeSlot?: string,
): boolean => {
  // Cannot allocate to a node with a prism
  if (
    placedPrism &&
    treeSlot &&
    hasPrismAtPosition(placedPrism, treeSlot, node.position.x, node.position.y)
  ) {
    return false;
  }

  // Check column gating
  if (!isColumnUnlocked(allocatedNodes, node.position.x)) {
    return false;
  }

  // Check prerequisite
  if (
    !isPrerequisiteSatisfied(
      node.prerequisite,
      allocatedNodes,
      treeData,
      placedPrism,
      treeSlot,
    )
  ) {
    return false;
  }

  // Check if already at max
  const current = allocatedNodes.find(
    (n) => n.x === node.position.x && n.y === node.position.y,
  );
  if (current && current.points >= node.maxPoints) {
    return false;
  }

  return true;
};

// Check if removing a point from a column would break any later column's gating
const wouldBreakColumnGating = (
  allocatedNodes: AllocatedTalentNode[],
  nodeColumn: number,
): boolean => {
  const getTotalPointsBeforeColumnSimulated = (columnIndex: number): number => {
    let total = 0;
    for (let x = 0; x < columnIndex; x++) {
      const colPoints = allocatedNodes
        .filter((n) => n.x === x)
        .reduce((sum, n) => sum + n.points, 0);
      // Subtract 1 if this is the column we're removing from
      total += x === nodeColumn ? colPoints - 1 : colPoints;
    }
    return total;
  };

  // Check if any allocated node in a later column would become invalid
  for (const allocation of allocatedNodes) {
    if (allocation.x <= nodeColumn) continue; // Only check later columns
    if (allocation.points === 0) continue;

    const requiredPoints = allocation.x * 3;
    const pointsAfterRemoval = getTotalPointsBeforeColumnSimulated(
      allocation.x,
    );

    if (pointsAfterRemoval < requiredPoints) {
      return true;
    }
  }

  return false;
};

// Check if a node can be deallocated
export const canDeallocateNode = (
  node: TalentNodeData,
  allocatedNodes: AllocatedTalentNode[],
  treeData: TalentTreeData,
  placedPrism?: PlacedPrism,
  treeSlot?: string,
): boolean => {
  // Must have points allocated
  const current = allocatedNodes.find(
    (n) => n.x === node.position.x && n.y === node.position.y,
  );
  if (!current || current.points === 0) {
    return false;
  }

  // Check if removing a point would break column gating for any later column
  if (wouldBreakColumnGating(allocatedNodes, node.position.x)) {
    return false;
  }

  // Check if any other node depends on this one being fully allocated
  // Skip nodes that have a prism on them (prism nodes don't count as allocated dependents)
  const hasDependents = treeData.nodes.some((otherNode) => {
    if (!otherNode.prerequisite) return false;
    if (otherNode.prerequisite.x !== node.position.x) return false;
    if (otherNode.prerequisite.y !== node.position.y) return false;

    // If the dependent node has a prism, it doesn't count as a dependent
    if (
      placedPrism &&
      treeSlot &&
      hasPrismAtPosition(
        placedPrism,
        treeSlot,
        otherNode.position.x,
        otherNode.position.y,
      )
    ) {
      return false;
    }

    // Check if the dependent node is allocated
    const dependentAllocation = allocatedNodes.find(
      (n) => n.x === otherNode.position.x && n.y === otherNode.position.y,
    );
    return dependentAllocation !== undefined && dependentAllocation.points > 0;
  });

  // If deallocating would break the fully-allocated requirement for dependents
  if (hasDependents && current.points <= node.maxPoints) {
    return false;
  }

  return true;
};

// Check if a prism can be removed without causing invalid state
// A prism cannot be removed if any dependent node has allocated points
export const canRemovePrism = (
  placedPrism: PlacedPrism,
  allocatedNodes: AllocatedTalentNode[],
  treeData: TalentTreeData,
): boolean => {
  const { x, y } = placedPrism.position;

  // Find all nodes that depend on the prism's position
  const hasDependentsWithPoints = treeData.nodes.some((node) => {
    if (!node.prerequisite) return false;
    if (node.prerequisite.x !== x || node.prerequisite.y !== y) return false;

    // Check if this dependent node has allocated points
    const allocation = allocatedNodes.find(
      (n) => n.x === node.position.x && n.y === node.position.y,
    );
    return allocation !== undefined && allocation.points > 0;
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
  allocatedNodes: AllocatedTalentNode[],
  treeData: TalentTreeData,
  placedPrism?: PlacedPrism,
  placedInverseImage?: PlacedInverseImage,
  treeSlot?: string,
): boolean => {
  if (!prerequisite) return true;

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
  return isPrerequisiteSatisfied(
    prerequisite,
    allocatedNodes,
    treeData,
    placedPrism,
    treeSlot,
  );
};

// Check if a node can be allocated, accounting for inverse image
export const canAllocateNodeWithInverseImage = (
  node: TalentNodeData,
  allocatedNodes: AllocatedTalentNode[],
  treeData: TalentTreeData,
  placedPrism?: PlacedPrism,
  placedInverseImage?: PlacedInverseImage,
  treeSlot?: string,
): boolean => {
  // Cannot allocate to the inverse image position itself
  if (
    placedInverseImage &&
    treeSlot &&
    hasInverseImageAtPosition(
      placedInverseImage,
      treeSlot,
      node.position.x,
      node.position.y,
    )
  ) {
    return false;
  }

  // Cannot allocate to a node with a prism
  if (
    placedPrism &&
    treeSlot &&
    hasPrismAtPosition(placedPrism, treeSlot, node.position.x, node.position.y)
  ) {
    return false;
  }

  // Check column gating
  if (!isColumnUnlocked(allocatedNodes, node.position.x)) {
    return false;
  }

  // Check prerequisite with inverse image awareness
  if (
    !isPrerequisiteSatisfiedWithInverseImage(
      node.prerequisite,
      node.position,
      allocatedNodes,
      treeData,
      placedPrism,
      placedInverseImage,
      treeSlot,
    )
  ) {
    return false;
  }

  // Check if already at max
  const current = allocatedNodes.find(
    (n) => n.x === node.position.x && n.y === node.position.y,
  );
  if (current && current.points >= node.maxPoints) {
    return false;
  }

  return true;
};

// Check if a node can be deallocated, accounting for inverse image
export const canDeallocateNodeWithInverseImage = (
  node: TalentNodeData,
  allocatedNodes: AllocatedTalentNode[],
  treeData: TalentTreeData,
  placedPrism?: PlacedPrism,
  placedInverseImage?: PlacedInverseImage,
  treeSlot?: string,
): boolean => {
  // Must have points allocated
  const current = allocatedNodes.find(
    (n) => n.x === node.position.x && n.y === node.position.y,
  );
  if (!current || current.points === 0) {
    return false;
  }

  // Check if removing a point would break column gating for any later column
  if (wouldBreakColumnGating(allocatedNodes, node.position.x)) {
    return false;
  }

  // Check if any other node depends on this one being fully allocated
  const hasDependents = treeData.nodes.some((otherNode) => {
    if (!otherNode.prerequisite) return false;
    if (otherNode.prerequisite.x !== node.position.x) return false;
    if (otherNode.prerequisite.y !== node.position.y) return false;

    // If the dependent node has a prism, it doesn't count as a dependent
    if (
      placedPrism &&
      treeSlot &&
      hasPrismAtPosition(
        placedPrism,
        treeSlot,
        otherNode.position.x,
        otherNode.position.y,
      )
    ) {
      return false;
    }

    // If the dependent node is in the inverse image target area, it doesn't count
    // (those nodes have no prerequisites)
    if (
      placedInverseImage &&
      treeSlot &&
      isInTargetArea(
        otherNode.position.x,
        otherNode.position.y,
        placedInverseImage,
        treeSlot,
      )
    ) {
      return false;
    }

    // Check if the dependent node is allocated
    const dependentAllocation = allocatedNodes.find(
      (n) => n.x === otherNode.position.x && n.y === otherNode.position.y,
    );
    return dependentAllocation !== undefined && dependentAllocation.points > 0;
  });

  // If deallocating would break the fully-allocated requirement for dependents
  if (hasDependents && current.points <= node.maxPoints) {
    return false;
  }

  return true;
};

// Check if an inverse image can be removed
// Inverse image can only be removed if the tree has 0 allocated points
export const canRemoveInverseImage = (
  allocatedNodes: AllocatedTalentNode[],
): boolean => {
  const totalPoints = allocatedNodes.reduce((sum, n) => sum + n.points, 0);
  return totalPoints === 0;
};

// Check if an inverse image can be placed at a position
export const canPlaceInverseImage = (
  x: number,
  y: number,
  treeSlot: string,
  allocatedNodes: AllocatedTalentNode[],
  placedPrism?: PlacedPrism,
  placedInverseImage?: PlacedInverseImage,
): { canPlace: boolean; reason?: string } => {
  // Only profession trees (tree2, tree3, tree4)
  if (treeSlot === "tree1") {
    return {
      canPlace: false,
      reason: "Inverse images can only be placed on Profession Trees (Slots 2-4)",
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
  const totalPoints = allocatedNodes.reduce((sum, n) => sum + n.points, 0);
  if (totalPoints > 0) {
    return {
      canPlace: false,
      reason: "Inverse images can only be placed when the tree has 0 allocated points",
    };
  }

  // Cannot have both prism and inverse image
  if (placedPrism) {
    return {
      canPlace: false,
      reason: "A prism is already placed. Remove it first to place an inverse image.",
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
