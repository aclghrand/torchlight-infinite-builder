import { z } from "zod";

import { EQUIPMENT_TYPES } from "@/src/tli/gear-data-types";

// Re-export const arrays from core.ts for runtime use
export const SLATE_SHAPES = [
  "O",
  "L",
  "Z",
  "T",
  "Single",
  "CornerL",
  "Vertical2",
  "Pedigree",
] as const;

export const DIVINITY_GODS = [
  "Deception",
  "Hunting",
  "Knowledge",
  "Machines",
  "Might",
  "War",
] as const;

export const ROTATIONS = [0, 90, 180, 270] as const;

export const DIVINITY_AFFIX_TYPES = [
  "Legendary Medium",
  "Medium",
  "Micro",
  "Core",
] as const;

export const HERO_MEMORY_TYPES = [
  "Memory of Origin",
  "Memory of Discipline",
  "Memory of Progress",
] as const;

export const PRISM_RARITIES = ["rare", "legendary"] as const;

// Primitive schemas
export const ItemIdSchema = z.string();
export type ItemId = z.infer<typeof ItemIdSchema>;

// Enum schemas
export const EquipmentTypeSchema = z.enum(EQUIPMENT_TYPES);
export type EquipmentType = z.infer<typeof EquipmentTypeSchema>;

export const SlateShapeSchema = z.enum(SLATE_SHAPES);
export type SlateShape = z.infer<typeof SlateShapeSchema>;

export const DivinityGodSchema = z.enum(DIVINITY_GODS);
export type DivinityGod = z.infer<typeof DivinityGodSchema>;

export const RotationSchema = z.union([
  z.literal(0),
  z.literal(90),
  z.literal(180),
  z.literal(270),
]);
export type Rotation = z.infer<typeof RotationSchema>;

export const DivinityAffixTypeSchema = z.enum(DIVINITY_AFFIX_TYPES);
export type DivinityAffixType = z.infer<typeof DivinityAffixTypeSchema>;

export const HeroMemoryTypeSchema = z.enum(HERO_MEMORY_TYPES);
export type HeroMemoryType = z.infer<typeof HeroMemoryTypeSchema>;

export const PrismRaritySchema = z.enum(PRISM_RARITIES);
export type PrismRarity = z.infer<typeof PrismRaritySchema>;

export const GearRaritySchema = z.enum(["rare", "legendary"]);
export type GearRarity = z.infer<typeof GearRaritySchema>;

// Tree slot types
export const TreeSlotSchema = z.enum(["tree1", "tree2", "tree3", "tree4"]);
export type TreeSlot = z.infer<typeof TreeSlotSchema>;

export const ProfessionTreeSlotSchema = z.enum(["tree2", "tree3", "tree4"]);
export type ProfessionTreeSlot = z.infer<typeof ProfessionTreeSlotSchema>;

// Hero memory slot types
export const HeroMemorySlotSchema = z.enum(["slot45", "slot60", "slot75"]);
export type HeroMemorySlot = z.infer<typeof HeroMemorySlotSchema>;
