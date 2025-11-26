import { RawGearPage } from "@/src/tli/core";

export type GearSlot = keyof RawGearPage;

export type TreeSlot = "tree1" | "tree2" | "tree3" | "tree4";

export type ActivePage = "equipment" | "talents" | "skills";

export interface AffixSlotState {
  affixIndex: number | null;
  percentage: number;
}
