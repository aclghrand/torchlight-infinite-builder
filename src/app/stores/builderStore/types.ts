"use client";

import type {
  AllocatedTalentNode,
  CraftedInverseImage,
  CraftedPrism,
  DivinitySlate,
  Gear,
  HeroMemory,
  HeroMemorySlot,
  PactspiritSlot,
  ReflectedAllocatedNode,
  RingSlotState,
  SaveData,
} from "../../lib/save-data";
import type { SavesIndex } from "../../lib/saves";
import type {
  GearSlot,
  PactspiritSlotIndex,
  RingSlotKey,
  TreeSlot,
} from "../../lib/types";

// Callback type for mutations that need current state
export type SaveDataUpdater = (current: SaveData) => SaveData;

// Public readable state (NO saveData)
export interface BuilderReadableState {
  hasUnsavedChanges: boolean;
  currentSaveId: string | undefined;
  currentSaveName: string | undefined;
  savesIndex: SavesIndex;
}

// Public action types
export interface BuilderActions {
  // Core actions
  setSaveData: (saveData: SaveData) => void;
  updateSaveData: (updater: SaveDataUpdater) => void;
  loadFromSave: (saveId: string) => boolean;
  save: () => boolean;
  resetUnsavedChanges: () => void;

  // Equipment actions
  addItemToInventory: (item: Gear) => void;
  copyItem: (itemId: string) => void;
  deleteItem: (itemId: string) => void;
  selectItemForSlot: (slot: GearSlot, itemId: string | undefined) => void;
  isItemEquipped: (itemId: string) => boolean;

  // Talent actions
  setTreeName: (slot: TreeSlot, treeName: string) => void;
  clearTree: (slot: TreeSlot) => void;
  setAllocatedNodes: (slot: TreeSlot, nodes: AllocatedTalentNode[]) => void;
  setCoreTalents: (slot: TreeSlot, talents: string[]) => void;
  addPrismToInventory: (prism: CraftedPrism) => void;
  deletePrism: (prismId: string) => void;
  placePrism: (
    prism: CraftedPrism,
    treeSlot: TreeSlot,
    position: { x: number; y: number },
  ) => void;
  removePlacedPrism: () => void;
  addInverseImageToInventory: (inverseImage: CraftedInverseImage) => void;
  deleteInverseImage: (inverseImageId: string) => void;
  placeInverseImage: (
    inverseImage: CraftedInverseImage,
    treeSlot: "tree2" | "tree3" | "tree4",
    position: { x: number; y: number },
  ) => void;
  removePlacedInverseImage: () => void;
  allocateReflectedNode: (
    x: number,
    y: number,
    sourceX: number,
    sourceY: number,
  ) => void;
  deallocateReflectedNode: (x: number, y: number) => void;
  setReflectedAllocatedNodes: (nodes: ReflectedAllocatedNode[]) => void;

  // Hero actions
  setHero: (hero: string | undefined) => void;
  setTrait: (
    level: "level1" | "level45" | "level60" | "level75",
    trait: string | undefined,
  ) => void;
  addHeroMemory: (memory: HeroMemory) => void;
  deleteHeroMemory: (memoryId: string) => void;
  equipHeroMemory: (
    slot: HeroMemorySlot,
    memory: HeroMemory | undefined,
  ) => void;
  copyHeroMemory: (memoryId: string) => void;

  // Pactspirit actions
  setPactspirit: (
    slotIndex: PactspiritSlotIndex,
    name: string | undefined,
  ) => void;
  setPactspiritLevel: (slotIndex: PactspiritSlotIndex, level: number) => void;
  setRingDestiny: (
    slotIndex: PactspiritSlotIndex,
    ringSlot: RingSlotKey,
    destiny: RingSlotState["installedDestiny"],
  ) => void;
  updatePactspiritSlot: (
    slotIndex: PactspiritSlotIndex,
    slot: PactspiritSlot,
  ) => void;

  // Divinity actions
  addSlateToInventory: (slate: DivinitySlate) => void;
  deleteSlate: (slateId: string) => void;
  placeSlate: (slateId: string, position: { row: number; col: number }) => void;
  removeSlate: (slateId: string) => void;
  updateSlate: (slateId: string, updates: Partial<DivinitySlate>) => void;

  // Skills actions
  setActiveSkill: (slot: 1 | 2 | 3 | 4, skillName: string | undefined) => void;
  setPassiveSkill: (slot: 1 | 2 | 3 | 4, skillName: string | undefined) => void;
  setSupportSkill: (
    skillType: "active" | "passive",
    skillSlot: 1 | 2 | 3 | 4,
    supportSlot: 1 | 2 | 3 | 4 | 5,
    supportName: string | undefined,
  ) => void;
  toggleSkillEnabled: (
    skillType: "active" | "passive",
    slot: 1 | 2 | 3 | 4,
  ) => void;
}

// Re-export types that components may need for action parameters
export type {
  AllocatedTalentNode,
  CraftedInverseImage,
  CraftedPrism,
  DivinitySlate,
  Gear,
  HeroMemory,
  HeroMemorySlot,
  PactspiritSlot,
  ReflectedAllocatedNode,
  RingSlotState,
  SaveData,
  SkillSlot,
  SkillSlots,
  SupportSkill,
  SupportSkills,
} from "../../lib/save-data";
export type { SavesIndex } from "../../lib/saves";
export type {
  GearSlot,
  PactspiritSlotIndex,
  RingSlotKey,
  TreeSlot,
} from "../../lib/types";
