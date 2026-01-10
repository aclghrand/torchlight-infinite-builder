import { z } from "zod";

import {
  DivinityGodSchema,
  RotationSchema,
  SlateShapeSchema,
} from "./common.schema";

// Divinity slate (SaveData version with string affixes)
const BaseDivinitySlateSchema = z.object({
  id: z.string(),
  god: DivinityGodSchema.optional().catch(undefined),
  shape: SlateShapeSchema,
  rotation: RotationSchema,
  flippedH: z.boolean(),
  flippedV: z.boolean(),
  affixes: z.array(z.string()).catch([]),
  metaAffixes: z.array(z.string()).catch([]),
  isLegendary: z.boolean().optional().catch(undefined),
  legendaryName: z.string().optional().catch(undefined),
});

export type DivinitySlate = z.infer<typeof BaseDivinitySlateSchema>;
export const DivinitySlateSchema = BaseDivinitySlateSchema;

// Placed slate position
export const PlacedSlatePositionSchema = z.object({
  row: z.number(),
  col: z.number(),
});

// Placed slate
const BasePlacedSlateSchema = z.object({
  slateId: z.string(),
  position: PlacedSlatePositionSchema,
});

export type PlacedSlate = z.infer<typeof BasePlacedSlateSchema>;
export const PlacedSlateSchema = BasePlacedSlateSchema;

// Divinity page
export const DivinityPageSchema = z
  .object({
    placedSlates: z.array(PlacedSlateSchema).catch([]),
    inventory: z.array(DivinitySlateSchema).catch([]),
  })
  .catch({ placedSlates: [], inventory: [] });

export type DivinityPage = z.infer<typeof DivinityPageSchema>;
