import type { EquipmentSlot, EquipmentType } from "@/src/tli/gear-data-types";
import type { GearSlot } from "./types";

export const GEAR_SLOTS: { key: GearSlot; label: string }[] = [
  { key: "helmet", label: "Helmet" },
  { key: "chest", label: "Chest" },
  { key: "neck", label: "Neck" },
  { key: "gloves", label: "Gloves" },
  { key: "belt", label: "Belt" },
  { key: "boots", label: "Boots" },
  { key: "leftRing", label: "Left Ring" },
  { key: "rightRing", label: "Right Ring" },
  { key: "mainHand", label: "Main Hand" },
  { key: "offHand", label: "Off Hand" },
];

export const SLOT_TO_EQUIPMENT_SLOT: Record<GearSlot, EquipmentSlot[]> = {
  helmet: ["Helmet"],
  chest: ["Chest Armor"],
  gloves: ["Gloves"],
  boots: ["Boots"],
  belt: ["Trinket"],
  neck: ["Trinket"],
  leftRing: ["Trinket"],
  rightRing: ["Trinket"],
  mainHand: ["One-Handed", "Two-Handed"],
  offHand: ["Shield", "One-Handed"],
};

export const SLOT_TO_VALID_EQUIPMENT_TYPES: Record<GearSlot, EquipmentType[]> =
  {
    helmet: ["Helmet (DEX)", "Helmet (INT)", "Helmet (STR)"],
    chest: ["Chest Armor (DEX)", "Chest Armor (INT)", "Chest Armor (STR)"],
    gloves: ["Gloves (DEX)", "Gloves (INT)", "Gloves (STR)"],
    boots: ["Boots (DEX)", "Boots (INT)", "Boots (STR)"],
    belt: ["Belt"],
    neck: ["Necklace"],
    leftRing: ["Ring", "Spirit Ring"],
    rightRing: ["Ring", "Spirit Ring"],
    mainHand: [
      "Bow",
      "Cane",
      "Claw",
      "Crossbow",
      "Cudgel",
      "Dagger",
      "Fire Cannon",
      "Musket",
      "One-Handed Axe",
      "One-Handed Hammer",
      "One-Handed Sword",
      "Pistol",
      "Rod",
      "Scepter",
      "Tin Staff",
      "Two-Handed Axe",
      "Two-Handed Hammer",
      "Two-Handed Sword",
      "Wand",
    ],
    offHand: [
      "Shield (DEX)",
      "Shield (INT)",
      "Shield (STR)",
      "Cane",
      "Claw",
      "Cudgel",
      "Dagger",
      "One-Handed Axe",
      "One-Handed Hammer",
      "One-Handed Sword",
      "Pistol",
      "Rod",
      "Scepter",
      "Wand",
    ],
  };

// Crafting defaults
export const DEFAULT_QUALITY = 50;
export const MAX_SLATE_AFFIXES = 5;

// Storage keys
export const DEBUG_MODE_STORAGE_KEY = "tli-planner-debug-mode";
export const DEBUG_PANEL_HEIGHT_STORAGE_KEY = "tli-planner-debug-panel-height";
export const DEBUG_PANEL_TAB_STORAGE_KEY = "tli-planner-debug-panel-tab";
export const SAVES_INDEX_STORAGE_KEY = "tli-planner-saves-index";
export const SAVE_DATA_STORAGE_KEY_PREFIX = "tli-planner-save-";
