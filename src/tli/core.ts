import type { EquipmentType } from "./gear_data_types";
import type { Mod } from "./mod";

export const PRISM_RARITIES = ["rare", "legendary"] as const;
export type PrismRarity = (typeof PRISM_RARITIES)[number];

export interface Affix {
  mods?: Mod[];
  maxDivinity?: number;
  src?: string;
  text?: string;
}

export interface DmgRange {
  // inclusive on both ends
  min: number;
  max: number;
}

export interface Configuration {
  fervor: {
    enabled: boolean;
    points: number;
  };
}

export interface DivinitySlate {
  affixes: Affix[];
}

export interface Gear {
  equipmentType: EquipmentType;

  // UI fields (preserved from SaveData for display, always present for inventory items)
  id?: string;
  rarity?: "rare" | "legendary";
  legendaryName?: string;

  // Base stats (shared by both regular and legendary gear)
  baseStats?: Affix;

  // Regular gear affix properties
  base_affixes?: Affix[];
  prefixes?: Affix[];
  suffixes?: Affix[];
  blend_affix?: Affix;

  // Legendary gear affix property
  legendary_affixes?: Affix[];
}

export const getAllAffixes = (gear: Gear): Affix[] => {
  const affixes: Affix[] = [];

  if (gear.baseStats) affixes.push(gear.baseStats);

  if (gear.legendary_affixes) {
    affixes.push(...gear.legendary_affixes);
  } else {
    if (gear.base_affixes) affixes.push(...gear.base_affixes);
    if (gear.blend_affix) affixes.push(gear.blend_affix);
    if (gear.prefixes) affixes.push(...gear.prefixes);
    if (gear.suffixes) affixes.push(...gear.suffixes);
  }

  return affixes;
};

// Unified talent node type with all derived data
export interface TalentNode {
  // Position
  x: number;
  y: number;

  // From TalentNodeData
  nodeType: "micro" | "medium" | "legendary";
  maxPoints: number;
  prerequisite?: { x: number; y: number };
  iconName: string;

  // Allocation state
  points: number; // 0 for unallocated

  // Reflection state
  isReflected: boolean;
  sourcePosition?: { x: number; y: number }; // Only for reflected nodes
  inverseImageEffect?: number; // Decimal like 0.47 for 47%, only for reflected nodes

  // Parsed affix data (scaled by points)
  affix: Affix;
  prismAffixes: Affix[]; // Prism gauge affixes matching node type
}

// Talent types with parsed Affix objects (instead of strings)
export interface TalentTree {
  name: string;
  nodes: TalentNode[]; // All nodes including unallocated (0 points) and reflected
  selectedCoreTalents?: Affix[];
}

export interface CraftedPrism {
  id: string;
  rarity: PrismRarity;
  // prism affixes are a special case that are not parsed into normal mods
  baseAffix: string;
  gaugeAffixes: string[];
}

export interface PlacedPrism {
  prism: CraftedPrism;
  treeSlot: "tree1" | "tree2" | "tree3" | "tree4";
  position: { x: number; y: number };
}

export interface CraftedInverseImage {
  id: string;
  microTalentEffect: number; // -100 to 200
  mediumTalentEffect: number; // -100 to 100
  legendaryTalentEffect: number; // -100 to 50
}

export interface PlacedInverseImage {
  inverseImage: CraftedInverseImage;
  treeSlot: "tree2" | "tree3" | "tree4";
  position: { x: number; y: number };
}

export interface TalentTrees {
  tree1?: TalentTree;
  tree2?: TalentTree;
  tree3?: TalentTree;
  tree4?: TalentTree;
  placedPrism?: PlacedPrism;
  placedInverseImage?: PlacedInverseImage;
}

export interface TalentInventory {
  prismList: CraftedPrism[];
  inverseImageList: CraftedInverseImage[];
}

export interface TalentPage {
  talentTrees: TalentTrees;
  inventory: TalentInventory;
}

export const getTalentAffixes = (talentPage: TalentPage): Affix[] => {
  const affixes: Affix[] = [];
  const { talentTrees: allocatedTalents } = talentPage;

  const trees = [
    allocatedTalents.tree1,
    allocatedTalents.tree2,
    allocatedTalents.tree3,
    allocatedTalents.tree4,
  ];

  for (const tree of trees) {
    if (tree?.selectedCoreTalents) {
      affixes.push(...tree.selectedCoreTalents);
    }
    if (tree?.nodes) {
      for (const node of tree.nodes) {
        if (node.points > 0) {
          affixes.push(node.affix);
          affixes.push(...node.prismAffixes);
        }
      }
    }
  }

  return affixes;
};

export interface DivinityPage {
  slates: DivinitySlate[];
}

export interface EquippedGear {
  helmet?: Gear;
  chest?: Gear;
  neck?: Gear;
  gloves?: Gear;
  belt?: Gear;
  boots?: Gear;
  leftRing?: Gear;
  rightRing?: Gear;
  mainHand?: Gear;
  offHand?: Gear;
}

export interface GearPage {
  equippedGear: EquippedGear;
  inventory: Gear[];
}

export interface SupportSkills {
  supportSkill1?: string;
  supportSkill2?: string;
  supportSkill3?: string;
  supportSkill4?: string;
  supportSkill5?: string;
}

export interface SkillWithSupports {
  skillName: string;
  enabled: boolean;
  supportSkills: SupportSkills;
}

export interface SkillPage {
  activeSkill1?: SkillWithSupports;
  activeSkill2?: SkillWithSupports;
  activeSkill3?: SkillWithSupports;
  activeSkill4?: SkillWithSupports;
  passiveSkill1?: SkillWithSupports;
  passiveSkill2?: SkillWithSupports;
  passiveSkill3?: SkillWithSupports;
  passiveSkill4?: SkillWithSupports;
}

export interface Loadout {
  gearPage: GearPage;
  talentPage: TalentPage;
  divinityPage: DivinityPage;
  skillPage: SkillPage;
  customConfiguration: Affix[];
}
