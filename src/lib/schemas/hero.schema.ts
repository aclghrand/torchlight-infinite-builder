import { z } from "zod";

import { HeroMemoryTypeSchema } from "./common.schema";

// Hero memory (SaveData version with string affixes)
const BaseHeroMemorySchema = z.object({
  id: z.string(),
  memoryType: HeroMemoryTypeSchema,
  baseStat: z.string(),
  fixedAffixes: z.array(z.string()).catch([]),
  randomAffixes: z.array(z.string()).catch([]),
});

export type HeroMemory = z.infer<typeof BaseHeroMemorySchema>;
export const HeroMemorySchema = BaseHeroMemorySchema;

// Hero trait
const BaseHeroTraitSchema = z.object({ name: z.string() });

export type HeroTrait = z.infer<typeof BaseHeroTraitSchema>;
export const HeroTraitSchema = BaseHeroTraitSchema;

// Default empty hero traits
const EMPTY_HERO_TRAITS = {
  level1: undefined,
  level45: undefined,
  level45b: undefined,
  level60: undefined,
  level60b: undefined,
  level75: undefined,
  level75b: undefined,
} as const;

// Hero traits container
export const HeroTraitsSchema = z
  .object({
    level1: HeroTraitSchema.optional().catch(undefined),
    level45: HeroTraitSchema.optional().catch(undefined),
    level45b: HeroTraitSchema.optional().catch(undefined),
    level60: HeroTraitSchema.optional().catch(undefined),
    level60b: HeroTraitSchema.optional().catch(undefined),
    level75: HeroTraitSchema.optional().catch(undefined),
    level75b: HeroTraitSchema.optional().catch(undefined),
  })
  .catch(EMPTY_HERO_TRAITS);

export type HeroTraits = z.infer<typeof HeroTraitsSchema>;

// Default empty hero memory slots
const EMPTY_MEMORY_SLOTS = {
  slot45: undefined,
  slot60: undefined,
  slot75: undefined,
} as const;

// Hero memory slots
export const HeroMemorySlotsSchema = z
  .object({
    slot45: HeroMemorySchema.optional().catch(undefined),
    slot60: HeroMemorySchema.optional().catch(undefined),
    slot75: HeroMemorySchema.optional().catch(undefined),
  })
  .catch(EMPTY_MEMORY_SLOTS);

export type HeroMemorySlots = z.infer<typeof HeroMemorySlotsSchema>;

// Hero page
export const HeroPageSchema = z
  .object({
    selectedHero: z.string().optional().catch(undefined),
    traits: HeroTraitsSchema,
    memorySlots: HeroMemorySlotsSchema,
    memoryInventory: z.array(HeroMemorySchema).catch([]),
  })
  .catch({
    selectedHero: undefined,
    traits: EMPTY_HERO_TRAITS,
    memorySlots: EMPTY_MEMORY_SLOTS,
    memoryInventory: [],
  });

export type HeroPage = z.infer<typeof HeroPageSchema>;
