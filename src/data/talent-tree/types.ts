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

export const ALL_TREES = [...GOD_GODDESS_TREES, ...PROFESSION_TREES] as const;

export type TreeName = (typeof ALL_TREES)[number];

export const isTreeName = (name: string): name is TreeName => {
  return ALL_TREES.includes(name as TreeName);
};

export const isGodGoddessTree = (name: string): boolean => {
  return GOD_GODDESS_TREES.includes(name as (typeof GOD_GODDESS_TREES)[number]);
};

export interface TalentNodeData {
  nodeType: "micro" | "medium" | "legendary";
  rawAffix: string;
  position: { x: number; y: number };
  prerequisite?: { x: number; y: number };
  maxPoints: number;
  iconName: string;
}

export interface TalentTreeData {
  name: TreeName;
  nodes: TalentNodeData[];
}
