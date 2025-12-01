import { RawGearPage, RawPactspiritSlot } from "@/src/tli/core";

export type GearSlot = keyof RawGearPage;

export type TreeSlot = "tree1" | "tree2" | "tree3" | "tree4";

export type ActivePage =
  | "equipment"
  | "talents"
  | "skills"
  | "hero"
  | "pactspirit";

export interface AffixSlotState {
  affixIndex: number | null;
  percentage: number;
}

export type InnerRingSlot =
  | "innerRing1"
  | "innerRing2"
  | "innerRing3"
  | "innerRing4"
  | "innerRing5"
  | "innerRing6";
export type MidRingSlot = "midRing1" | "midRing2" | "midRing3";
export type RingSlotKey = InnerRingSlot | MidRingSlot;

export const RING_DISPLAY_ORDER: RingSlotKey[] = [
  "innerRing1",
  "innerRing2",
  "midRing1",
  "innerRing3",
  "innerRing4",
  "midRing2",
  "innerRing5",
  "innerRing6",
  "midRing3",
];

export type PactspiritSlotIndex = 1 | 2 | 3;
export type PactspiritSlotKey = keyof RawPactspiritSlot["rings"];
