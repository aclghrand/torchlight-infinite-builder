import { z } from "zod";

import {
  PrismRaritySchema,
  ProfessionTreeSlotSchema,
  TreeSlotSchema,
} from "./common.schema";

// Allocated talent node
const BaseAllocatedTalentNodeSchema = z.object({
  x: z.number(),
  y: z.number(),
  points: z.number(),
});

export type AllocatedTalentNode = z.infer<typeof BaseAllocatedTalentNodeSchema>;
export const AllocatedTalentNodeSchema = BaseAllocatedTalentNodeSchema;

// Talent tree (SaveData version with string affixes)
const BaseTalentTreeSchema = z.object({
  name: z.string(),
  allocatedNodes: z.array(AllocatedTalentNodeSchema).catch([]),
  selectedCoreTalents: z.array(z.string()).optional(),
});

export type TalentTree = z.infer<typeof BaseTalentTreeSchema>;
export const TalentTreeSchema = BaseTalentTreeSchema;

// Crafted prism
const BaseCraftedPrismSchema = z.object({
  id: z.string(),
  rarity: PrismRaritySchema,
  baseAffix: z.string(),
  gaugeAffixes: z.array(z.string()).catch([]),
});

export type CraftedPrism = z.infer<typeof BaseCraftedPrismSchema>;
export const CraftedPrismSchema = BaseCraftedPrismSchema;

// Position for prism/inverse image placement
export const PositionSchema = z.object({ x: z.number(), y: z.number() });

// Placed prism
const BasePlacedPrismSchema = z.object({
  prism: CraftedPrismSchema,
  treeSlot: TreeSlotSchema,
  position: PositionSchema,
});

export type PlacedPrism = z.infer<typeof BasePlacedPrismSchema>;
export const PlacedPrismSchema = BasePlacedPrismSchema;

// Crafted inverse image
const BaseCraftedInverseImageSchema = z.object({
  id: z.string(),
  microTalentEffect: z.number().min(-100).max(200),
  mediumTalentEffect: z.number().min(-100).max(100),
  legendaryTalentEffect: z.number().min(-100).max(50),
});

export type CraftedInverseImage = z.infer<typeof BaseCraftedInverseImageSchema>;
export const CraftedInverseImageSchema = BaseCraftedInverseImageSchema;

// Reflected allocated node
const BaseReflectedAllocatedNodeSchema = z.object({
  x: z.number(),
  y: z.number(),
  sourceX: z.number(),
  sourceY: z.number(),
  points: z.number(),
});

export type ReflectedAllocatedNode = z.infer<
  typeof BaseReflectedAllocatedNodeSchema
>;
export const ReflectedAllocatedNodeSchema = BaseReflectedAllocatedNodeSchema;

// Placed inverse image
const BasePlacedInverseImageSchema = z.object({
  inverseImage: CraftedInverseImageSchema,
  treeSlot: ProfessionTreeSlotSchema,
  position: PositionSchema,
  reflectedAllocatedNodes: z.array(ReflectedAllocatedNodeSchema).catch([]),
});

export type PlacedInverseImage = z.infer<typeof BasePlacedInverseImageSchema>;
export const PlacedInverseImageSchema = BasePlacedInverseImageSchema;

// Default empty talent trees
const EMPTY_TALENT_TREES = {
  tree1: undefined,
  tree2: undefined,
  tree3: undefined,
  tree4: undefined,
  placedPrism: undefined,
  placedInverseImage: undefined,
} as const;

// Talent trees container
export const TalentTreesSchema = z
  .object({
    tree1: TalentTreeSchema.optional().catch(undefined),
    tree2: TalentTreeSchema.optional().catch(undefined),
    tree3: TalentTreeSchema.optional().catch(undefined),
    tree4: TalentTreeSchema.optional().catch(undefined),
    placedPrism: PlacedPrismSchema.optional().catch(undefined),
    placedInverseImage: PlacedInverseImageSchema.optional().catch(undefined),
  })
  .catch(EMPTY_TALENT_TREES);

export type TalentTrees = z.infer<typeof TalentTreesSchema>;

// Talent inventory
export const TalentInventorySchema = z
  .object({
    prismList: z.array(CraftedPrismSchema).catch([]),
    inverseImageList: z.array(CraftedInverseImageSchema).catch([]),
  })
  .catch({ prismList: [], inverseImageList: [] });

export type TalentInventory = z.infer<typeof TalentInventorySchema>;

// Talent page
export const TalentPageSchema = z
  .object({ talentTrees: TalentTreesSchema, inventory: TalentInventorySchema })
  .catch({
    talentTrees: EMPTY_TALENT_TREES,
    inventory: { prismList: [], inverseImageList: [] },
  });

export type TalentPage = z.infer<typeof TalentPageSchema>;
