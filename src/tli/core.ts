import type { BaseStatMod } from "./base_stat_mod";
import type { EquipmentType } from "./gear_data_types";
import type { Mod } from "./mod";

export const PRISM_RARITIES = ["rare", "legendary"] as const;
export type PrismRarity = (typeof PRISM_RARITIES)[number];

export interface AffixLine {
  text: string;
  mods?: Mod[];
}

export interface Affix {
  affixLines: AffixLine[];
  maxDivinity?: number;
  src?: string;
}

export interface BaseStatLine {
  text: string;
  mod?: BaseStatMod;
}

export interface BaseStats {
  baseStatLines: BaseStatLine[];
  src?: string;
}

export const getAffixText = (affix: Affix): string =>
  affix.affixLines.map((l) => l.text).join("\n");

export const getAffixMods = (affix: Affix): Mod[] =>
  affix.affixLines.flatMap((l) => l.mods ?? []);

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
  enemyFrobitten: {
    enabled: boolean;
    points: number;
  };
  crueltyBuffStacks: number;
}

export const createDefaultConfiguration = (): Configuration => ({
  fervor: { enabled: false, points: 0 },
  enemyFrobitten: { enabled: false, points: 0 },
  crueltyBuffStacks: 40,
});

export interface Gear {
  equipmentType: EquipmentType;

  // UI fields (preserved from SaveData for display, always present for inventory items)
  id?: string;
  rarity?: "rare" | "legendary";
  legendaryName?: string;

  // Base stats (shared by both regular and legendary gear)
  baseStats?: BaseStats;

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
  // handle base stats

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
  selectedCoreTalentNames?: string[]; // Original names for UI display
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

export const SLATE_SHAPES = ["O", "L", "Z"] as const;
export type SlateShape = (typeof SLATE_SHAPES)[number];

export const DIVINITY_GODS = [
  "Deception",
  "Hunting",
  "Knowledge",
  "Machines",
  "Might",
  "War",
] as const;
export type DivinityGod = (typeof DIVINITY_GODS)[number];

export const ROTATIONS = [0, 90, 180, 270] as const;
export type Rotation = (typeof ROTATIONS)[number];

export type DivinityAffixType = "Legendary Medium" | "Medium";
export interface PlacedSlate {
  slateId: string;
  position: { row: number; col: number };
}

export interface DivinitySlate {
  id: string;
  god: DivinityGod;
  shape: SlateShape;
  rotation: Rotation;
  flippedH: boolean;
  flippedV: boolean;
  affixes: Affix[];
  affixTypes: DivinityAffixType[];
}

export interface DivinityPage {
  placedSlates: PlacedSlate[];
  inventory: DivinitySlate[];
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

export interface SupportSkillSlot {
  name: string;
  level?: number; // default 20
}

export interface SupportSkills {
  1?: SupportSkillSlot;
  2?: SupportSkillSlot;
  3?: SupportSkillSlot;
  4?: SupportSkillSlot;
  5?: SupportSkillSlot;
}

export interface SkillSlot {
  skillName: string;
  enabled: boolean;
  level?: number; // default 20
  supportSkills: SupportSkills;
}

export interface SkillSlots {
  1?: SkillSlot;
  2?: SkillSlot;
  3?: SkillSlot;
  4?: SkillSlot;
}

export interface SkillPage {
  activeSkills: SkillSlots;
  passiveSkills: SkillSlots;
}

export const HERO_MEMORY_TYPES = [
  "Memory of Origin",
  "Memory of Discipline",
  "Memory of Progress",
] as const;
export type HeroMemoryType = (typeof HERO_MEMORY_TYPES)[number];

export type HeroMemorySlot = "slot45" | "slot60" | "slot75";

export interface HeroMemory {
  id: string;
  memoryType: HeroMemoryType;
  affixes: Affix[];
}

export interface HeroTraits {
  level1?: Affix;
  level45?: Affix;
  level60?: Affix;
  level75?: Affix;
}

export interface HeroMemorySlots {
  slot45?: HeroMemory;
  slot60?: HeroMemory;
  slot75?: HeroMemory;
}

export interface HeroPage {
  selectedHero?: string;
  traits: HeroTraits;
  memorySlots: HeroMemorySlots;
  memoryInventory: HeroMemory[];
}

export const getHeroAffixes = (heroPage: HeroPage): Affix[] => {
  const affixes: Affix[] = [];

  const { memorySlots } = heroPage;
  // TODO: handle traits at some point

  if (memorySlots.slot45) affixes.push(...memorySlots.slot45.affixes);
  if (memorySlots.slot60) affixes.push(...memorySlots.slot60.affixes);
  if (memorySlots.slot75) affixes.push(...memorySlots.slot75.affixes);

  return affixes;
};

export interface InstalledDestiny {
  destinyName: string;
  destinyType: string;
  affix: Affix;
}

export interface RingSlotState {
  installedDestiny?: InstalledDestiny;
  originalRingName: string;
  originalAffix: Affix;
}

export interface PactspiritSlot {
  pactspiritName: string;
  level: number;
  rings: {
    innerRing1: RingSlotState;
    innerRing2: RingSlotState;
    innerRing3: RingSlotState;
    innerRing4: RingSlotState;
    innerRing5: RingSlotState;
    innerRing6: RingSlotState;
    midRing1: RingSlotState;
    midRing2: RingSlotState;
    midRing3: RingSlotState;
  };
}

export interface PactspiritPage {
  slot1?: PactspiritSlot;
  slot2?: PactspiritSlot;
  slot3?: PactspiritSlot;
}

export interface Loadout {
  gearPage: GearPage;
  talentPage: TalentPage;
  divinityPage: DivinityPage;
  skillPage: SkillPage;
  heroPage: HeroPage;
  pactspiritPage: PactspiritPage;
  customConfiguration: Affix[];
}
