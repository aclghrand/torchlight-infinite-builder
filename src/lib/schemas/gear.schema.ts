import { z } from "zod";

import { EquipmentTypeSchema, GearRaritySchema } from "./common.schema";

// Base gear schema (without catch for type inference)
const BaseGearSchema = z.object({
  id: z.string(),
  equipmentType: EquipmentTypeSchema,
  rarity: GearRaritySchema.optional(),
  legendaryName: z.string().optional(),
  baseStats: z.string().optional(),
  base_affixes: z.array(z.string()).optional(),
  prefixes: z.array(z.string()).optional(),
  suffixes: z.array(z.string()).optional(),
  blend_affix: z.string().optional(),
  sweet_dream_affix: z.string().optional(),
  tower_sequence_affix: z.string().optional(),
  legendary_affixes: z.array(z.string()).optional(),
});

export type Gear = z.infer<typeof BaseGearSchema>;

// Gear schema with catch (filters invalid items from arrays)
export const GearSchema = BaseGearSchema;

// Default empty equipped gear
const EMPTY_EQUIPPED_GEAR = {
  helmet: undefined,
  chest: undefined,
  neck: undefined,
  gloves: undefined,
  belt: undefined,
  boots: undefined,
  leftRing: undefined,
  rightRing: undefined,
  mainHand: undefined,
  offHand: undefined,
} as const;

// Equipped gear slots
export const EquippedGearSchema = z
  .object({
    helmet: GearSchema.optional().catch(undefined),
    chest: GearSchema.optional().catch(undefined),
    neck: GearSchema.optional().catch(undefined),
    gloves: GearSchema.optional().catch(undefined),
    belt: GearSchema.optional().catch(undefined),
    boots: GearSchema.optional().catch(undefined),
    leftRing: GearSchema.optional().catch(undefined),
    rightRing: GearSchema.optional().catch(undefined),
    mainHand: GearSchema.optional().catch(undefined),
    offHand: GearSchema.optional().catch(undefined),
  })
  .catch(EMPTY_EQUIPPED_GEAR);

export type EquippedGear = z.infer<typeof EquippedGearSchema>;

// GearPage schema
export const GearPageSchema = z
  .object({
    equippedGear: EquippedGearSchema,
    inventory: z.array(GearSchema).catch([]),
  })
  .catch({ equippedGear: EMPTY_EQUIPPED_GEAR, inventory: [] });

export type GearPage = z.infer<typeof GearPageSchema>;
