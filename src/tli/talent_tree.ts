import { RawAllocatedTalentNode, TalentNodeData, TalentTreeData } from "./core";
import { TALENT_TREES } from "./talent_data";
import type { TreeName } from "./talent_tree_types";

// Re-export tree name constants and types
export {
  GOD_GODDESS_TREES,
  PROFESSION_TREES,
  isGodGoddessTree,
} from "./talent_tree_types";
export type { TreeName } from "./talent_tree_types";

// Re-export data types
export type { TalentNodeData, TalentTreeData };

// Calculate total points in a specific column
export const calculateColumnPoints = (
  allocatedNodes: RawAllocatedTalentNode[],
  columnIndex: number,
): number => {
  return allocatedNodes
    .filter((node) => node.x === columnIndex)
    .reduce((sum, node) => sum + node.points, 0);
};

// Calculate total points allocated before a specific column
export const getTotalPointsBeforeColumn = (
  allocatedNodes: RawAllocatedTalentNode[],
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
  allocatedNodes: RawAllocatedTalentNode[],
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
export const isPrerequisiteSatisfied = (
  prerequisite: { x: number; y: number } | undefined,
  allocatedNodes: RawAllocatedTalentNode[],
  treeData: TalentTreeData,
): boolean => {
  if (!prerequisite) return true;

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
  allocatedNodes: RawAllocatedTalentNode[],
  treeData: TalentTreeData,
): boolean => {
  // Check column gating
  if (!isColumnUnlocked(allocatedNodes, node.position.x)) {
    return false;
  }

  // Check prerequisite
  if (!isPrerequisiteSatisfied(node.prerequisite, allocatedNodes, treeData)) {
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

// Check if a node can be deallocated
export const canDeallocateNode = (
  node: TalentNodeData,
  allocatedNodes: RawAllocatedTalentNode[],
  treeData: TalentTreeData,
): boolean => {
  // Must have points allocated
  const current = allocatedNodes.find(
    (n) => n.x === node.position.x && n.y === node.position.y,
  );
  if (!current || current.points === 0) {
    return false;
  }

  // Check if any other node depends on this one being fully allocated
  const hasDependents = treeData.nodes.some((otherNode) => {
    if (!otherNode.prerequisite) return false;
    if (otherNode.prerequisite.x !== node.position.x) return false;
    if (otherNode.prerequisite.y !== node.position.y) return false;

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

// Tree loading function - now synchronous since data is imported
export const loadTalentTree = (treeName: TreeName): TalentTreeData => {
  return TALENT_TREES[treeName];
};
