import { z } from "zod";

import { DEFAULT_CONFIGURATION } from "@/src/tli/core";
import {
  CalculationsPageSchema,
  ConfigurationPageSchema,
} from "./config.schema";
import { DivinityPageSchema } from "./divinity.schema";
import { GearPageSchema } from "./gear.schema";
import { HeroPageSchema } from "./hero.schema";
import { PactspiritPageSchema } from "./pactspirit.schema";
import { SkillPageSchema } from "./skill.schema";
import { TalentPageSchema } from "./talent.schema";

// Main SaveData schema (for validation)
export const SaveDataSchema = z.object({
  equipmentPage: GearPageSchema,
  talentPage: TalentPageSchema,
  skillPage: SkillPageSchema,
  heroPage: HeroPageSchema,
  pactspiritPage: PactspiritPageSchema,
  divinityPage: DivinityPageSchema,
  configurationPage: ConfigurationPageSchema,
  calculationsPage: CalculationsPageSchema,
});

export type SaveData = z.infer<typeof SaveDataSchema>;

// Default empty SaveData (used as fallback)
const emptyRingState = { installedDestiny: undefined };
const emptyPactspiritSlot = {
  pactspiritName: undefined,
  level: 1,
  rings: {
    innerRing1: emptyRingState,
    innerRing2: emptyRingState,
    innerRing3: emptyRingState,
    innerRing4: emptyRingState,
    innerRing5: emptyRingState,
    innerRing6: emptyRingState,
    midRing1: emptyRingState,
    midRing2: emptyRingState,
    midRing3: emptyRingState,
  },
};

export const EMPTY_SAVE_DATA: SaveData = {
  equipmentPage: {
    equippedGear: {
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
    },
    inventory: [],
  },
  talentPage: {
    talentTrees: {
      tree1: undefined,
      tree2: undefined,
      tree3: undefined,
      tree4: undefined,
      placedPrism: undefined,
      placedInverseImage: undefined,
    },
    inventory: { prismList: [], inverseImageList: [] },
  },
  skillPage: { activeSkills: {}, passiveSkills: {} },
  heroPage: {
    selectedHero: undefined,
    traits: {
      level1: undefined,
      level45: undefined,
      level60: undefined,
      level75: undefined,
    },
    memorySlots: { slot45: undefined, slot60: undefined, slot75: undefined },
    memoryInventory: [],
  },
  pactspiritPage: {
    slot1: emptyPactspiritSlot,
    slot2: emptyPactspiritSlot,
    slot3: emptyPactspiritSlot,
  },
  divinityPage: { placedSlates: [], inventory: [] },
  configurationPage: DEFAULT_CONFIGURATION,
  calculationsPage: { selectedSkillName: undefined },
};

// Parse and validate SaveData, returning EMPTY_SAVE_DATA on failure
export const parseSaveData = (data: unknown): SaveData => {
  const result = SaveDataSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.error("SaveData validation failed:", result.error);
  return EMPTY_SAVE_DATA;
};

// Versioned SaveData for build codes (supports future migrations)
export const VersionedSaveDataV1Schema = z.object({
  v: z.literal(1),
  d: SaveDataSchema,
});

export type VersionedSaveDataV1 = z.infer<typeof VersionedSaveDataV1Schema>;

// Union of all versioned schemas (add new versions here)
export const VersionedSaveDataSchema = z.discriminatedUnion("v", [
  VersionedSaveDataV1Schema,
]);

export type VersionedSaveData = z.infer<typeof VersionedSaveDataSchema>;

// Parse versioned SaveData and migrate to latest version
export const parseVersionedSaveData = (data: unknown): SaveData | undefined => {
  const result = VersionedSaveDataSchema.safeParse(data);
  if (!result.success) {
    console.error("Versioned SaveData validation failed:", result.error);
    return undefined;
  }

  // Currently only v1 exists, so no migration needed
  // Future versions would migrate here: v1 -> v2 -> v3 -> ... -> latest
  return result.data.d;
};
