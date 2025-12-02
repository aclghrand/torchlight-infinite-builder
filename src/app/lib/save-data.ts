import { EquipmentType } from "@/src/tli/gear_data_types";

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

export interface DivinitySlate {
  id: string;
  god: DivinityGod;
  shape: SlateShape;
  rotation: Rotation;
  flippedH: boolean;
  flippedV: boolean;
  affixes: string[];
  affixTypes: DivinityAffixType[];
}

export const PRISM_RARITIES = ["rare", "legendary"] as const;
export type PrismRarity = (typeof PRISM_RARITIES)[number];

export interface CraftedPrism {
  id: string;
  rarity: PrismRarity;
  baseAffix: string;
  gaugeAffixes: string[];
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
}

export interface Gear {
  id: string;
  gearType:
    | "helmet"
    | "chest"
    | "neck"
    | "gloves"
    | "belt"
    | "boots"
    | "ring"
    | "sword"
    | "shield";
  affixes: string[];
  equipmentType?: EquipmentType;
  rarity?: "rare" | "legendary";
  baseStats?: string;
  legendaryName?: string;
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

export interface SupportSkills {
  supportSkill1?: string;
  supportSkill2?: string;
  supportSkill3?: string;
  supportSkill4?: string;
  supportSkill5?: string;
}

export interface SkillWithSupports {
  skillName?: string;
  enabled: boolean;
  supportSkills: SupportSkills;
}

export interface SkillPage {
  activeSkill1: SkillWithSupports;
  activeSkill2: SkillWithSupports;
  activeSkill3: SkillWithSupports;
  activeSkill4: SkillWithSupports;
  passiveSkill1: SkillWithSupports;
  passiveSkill2: SkillWithSupports;
  passiveSkill3: SkillWithSupports;
  passiveSkill4: SkillWithSupports;
}

export const HERO_MEMORY_TYPES = [
  "Memory of Origin",
  "Memory of Discipline",
  "Memory of Progress",
] as const;
export type HeroMemoryType = (typeof HERO_MEMORY_TYPES)[number];

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

export type HeroMemorySlot = "slot45" | "slot60" | "slot75";

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

export interface SaveData {
  equipmentPage: GearPage;
  talentPage: TalentPage;
  skillPage: SkillPage;
  heroPage: HeroPage;
  pactspiritPage: PactspiritPage;
  divinityPage: DivinityPage;
  itemsList: Gear[];
  heroMemoryList: HeroMemory[];
  divinitySlateList: DivinitySlate[];
  prismList: CraftedPrism[];
}
