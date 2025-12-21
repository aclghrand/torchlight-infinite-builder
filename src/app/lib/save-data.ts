import type {
  DivinityGod,
  HeroMemoryType,
  Rotation,
  SkillPage,
  SlateShape,
} from "@/src/tli/core";
import type { EquipmentType } from "@/src/tli/gear_data_types";

export type {
  SkillPage,
  SkillSlot,
  SkillSlots,
  SupportSkillSlot as SupportSkill,
  SupportSkills,
} from "@/src/tli/core";

export {
  DIVINITY_GODS,
  type DivinityAffixType,
  type DivinityGod,
  HERO_MEMORY_TYPES,
  type HeroMemorySlot,
  type HeroMemoryType,
  ROTATIONS,
  type Rotation,
  SLATE_SHAPES,
  type SlateShape,
} from "@/src/tli/core";

export interface DivinitySlate {
  id: string;
  god?: DivinityGod;
  shape: SlateShape;
  rotation: Rotation;
  flippedH: boolean;
  flippedV: boolean;
  affixes: string[];
  // reserved for affixes from "Sparks of Moth Fire" and "When Sparks Set the Prairie Ablaze"
  // these are affixes that aren't factored into stat calculations, but may produce
  // other affixes which do
  // e.g. "Sparks of Moth Fire" could copy affix from another slate
  metaAffixes: string[];
  isLegendary?: boolean;
  legendaryName?: string;
}

export const PRISM_RARITIES = ["rare", "legendary"] as const;
export type PrismRarity = (typeof PRISM_RARITIES)[number];

export interface CraftedPrism {
  id: string;
  rarity: PrismRarity;
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

export interface ReflectedAllocatedNode {
  x: number; // Position in target area
  y: number;
  sourceX: number; // Position of source node being reflected
  sourceY: number;
  points: number;
}

export interface PlacedInverseImage {
  inverseImage: CraftedInverseImage;
  treeSlot: "tree2" | "tree3" | "tree4"; // Only profession trees
  position: { x: number; y: number };
  reflectedAllocatedNodes: ReflectedAllocatedNode[];
}

export interface PlacedSlate {
  slateId: string;
  position: { row: number; col: number };
}

export interface DivinityPage {
  placedSlates: PlacedSlate[];
}

export interface AllocatedTalentNode {
  x: number;
  y: number;
  points: number;
}

export interface TalentTree {
  name: string;
  allocatedNodes: AllocatedTalentNode[];
  selectedCoreTalents?: string[];
}

export interface TalentPage {
  tree1?: TalentTree;
  tree2?: TalentTree;
  tree3?: TalentTree;
  tree4?: TalentTree;
  placedPrism?: PlacedPrism;
  placedInverseImage?: PlacedInverseImage;
}

export interface Gear {
  id: string;
  equipmentType: EquipmentType;
  rarity?: "rare" | "legendary";
  legendaryName?: string;

  // Base stats (shared by both regular and legendary gear)
  baseStats?: string;

  // Regular gear affix properties
  base_affixes?: string[];
  prefixes?: string[];
  suffixes?: string[];
  blend_affix?: string;
  sweet_dream_affix?: string;
  tower_sequence_affix?: string;

  // Legendary gear affix property
  legendary_affixes?: string[];
}

export interface GearPage {
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

export interface HeroMemoryAffix {
  effect: string;
  quality: number;
}

export interface HeroMemory {
  id: string;
  memoryType: HeroMemoryType;
  baseStat: string;
  fixedAffixes: HeroMemoryAffix[];
  randomAffixes: HeroMemoryAffix[];
}

export interface HeroPage {
  selectedHero: string | undefined;
  traits: {
    level1: string | undefined;
    level45: string | undefined;
    level60: string | undefined;
    level75: string | undefined;
  };
  memorySlots: {
    slot45: HeroMemory | undefined;
    slot60: HeroMemory | undefined;
    slot75: HeroMemory | undefined;
  };
}

export interface RingSlotState {
  installedDestiny?: {
    destinyName: string;
    destinyType: string;
    resolvedAffix: string;
  };
}

export interface PactspiritSlot {
  pactspiritName?: string;
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
  slot1: PactspiritSlot;
  slot2: PactspiritSlot;
  slot3: PactspiritSlot;
}

export interface CalculationsPage {
  selectedSkillName?: string;
}

export interface ConfigurationPage {
  fervorEnabled: boolean;
  fervorPoints: number | undefined;
  enemyFrostbittenEnabled: boolean;
  enemyFrostbittenPoints: number | undefined;
  crueltyBuffStacks: number;
}

export interface SaveData {
  equipmentPage: GearPage;
  talentPage: TalentPage;
  skillPage: SkillPage;
  heroPage: HeroPage;
  pactspiritPage: PactspiritPage;
  divinityPage: DivinityPage;
  configurationPage: ConfigurationPage;
  calculationsPage: CalculationsPage;
  itemsList: Gear[];
  heroMemoryList: HeroMemory[];
  divinitySlateList: DivinitySlate[];
  prismList: CraftedPrism[];
  inverseImageList: CraftedInverseImage[];
}
