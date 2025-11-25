import { RawAllocatedTalentNode } from "./core";

// Types matching JSON structure
export interface TalentNodeData {
  nodeType: "micro" | "medium" | "legendary";
  rawAffix: string;
  position: { x: number; y: number };
  maxPoints: number;
  iconName: string;
  prerequisite?: { x: number; y: number };
}

export interface TalentTreeData {
  name: string;
  nodes: TalentNodeData[];
}

// Tree name constants
export const GOD_GODDESS_TREES = [
  "God_of_War",
  "God_of_Might",
  "God_of_Machines",
  "Goddess_of_Hunting",
  "Goddess_of_Knowledge",
  "Goddess_of_Deception",
] as const;

export const PROFESSION_TREES = [
  "Warrior",
  "Warlord",
  "Onslaughter",
  "The_Brave",
  "Marksman",
  "Bladerunner",
  "Druid",
  "Assassin",
  "Magister",
  "Arcanist",
  "Elementalist",
  "Prophet",
  "Shadowdancer",
  "Ranger",
  "Sentinel",
  "Shadowmaster",
  "Psychic",
  "Warlock",
  "Lich",
  "Machinist",
  "Steel_Vanguard",
  "Alchemist",
  "Artisan",
  "Ronin",
] as const;

export type TreeName =
  | (typeof GOD_GODDESS_TREES)[number]
  | (typeof PROFESSION_TREES)[number];

// Check if a tree name is a god/goddess tree
export const isGodGoddessTree = (name: string): boolean => {
  return GOD_GODDESS_TREES.includes(name as (typeof GOD_GODDESS_TREES)[number]);
};

// Calculate total points in a specific column
export const calculateColumnPoints = (
  allocatedNodes: RawAllocatedTalentNode[],
  columnIndex: number
): number => {
  return allocatedNodes
    .filter((node) => node.x === columnIndex)
    .reduce((sum, node) => sum + node.points, 0);
};

// Calculate total points allocated before a specific column
export const getTotalPointsBeforeColumn = (
  allocatedNodes: RawAllocatedTalentNode[],
  columnIndex: number
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
  columnIndex: number
): boolean => {
  const requiredPoints = columnIndex * 3;
  const pointsAllocated = getTotalPointsBeforeColumn(allocatedNodes, columnIndex);
  return pointsAllocated >= requiredPoints;
};

// Check if a prerequisite node is fully satisfied
export const isPrerequisiteSatisfied = (
  prerequisite: { x: number; y: number } | undefined,
  allocatedNodes: RawAllocatedTalentNode[],
  treeData: TalentTreeData
): boolean => {
  if (!prerequisite) return true;

  const prereqNode = treeData.nodes.find(
    (n) => n.position.x === prerequisite.x && n.position.y === prerequisite.y
  );
  if (!prereqNode) return false;

  const allocation = allocatedNodes.find(
    (n) => n.x === prerequisite.x && n.y === prerequisite.y
  );

  return allocation !== undefined && allocation.points >= prereqNode.maxPoints;
};

// Check if a node can be allocated
export const canAllocateNode = (
  node: TalentNodeData,
  allocatedNodes: RawAllocatedTalentNode[],
  treeData: TalentTreeData
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
    (n) => n.x === node.position.x && n.y === node.position.y
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
  treeData: TalentTreeData
): boolean => {
  // Must have points allocated
  const current = allocatedNodes.find(
    (n) => n.x === node.position.x && n.y === node.position.y
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
      (n) => n.x === otherNode.position.x && n.y === otherNode.position.y
    );
    return dependentAllocation !== undefined && dependentAllocation.points > 0;
  });

  // If deallocating would break the fully-allocated requirement for dependents
  if (hasDependents && current.points <= node.maxPoints) {
    return false;
  }

  return true;
};

// Tree loading with client-side caching
const treeCache = new Map<TreeName, TalentTreeData>();

export const loadTalentTree = async (
  treeName: TreeName
): Promise<TalentTreeData> => {
  // Check cache first
  if (treeCache.has(treeName)) {
    return treeCache.get(treeName)!;
  }

  const fileName = `${treeName.toLowerCase()}_tree.json`;
  const response = await fetch(`/data/${fileName}`);
  if (!response.ok) {
    throw new Error(`Failed to load tree: ${treeName}`);
  }
  const data = await response.json();
  treeCache.set(treeName, data);
  return data;
};
