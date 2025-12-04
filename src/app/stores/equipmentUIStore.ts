"use client";

import { create } from "zustand";
import type { EquipmentType } from "@/src/tli/gear_data_types";
import { DEFAULT_QUALITY } from "../lib/constants";
import type { AffixSlotState, GearSlot } from "../lib/types";

const createEmptyAffixSlots = (): AffixSlotState[] =>
  Array(6)
    .fill(undefined)
    .map(() => ({ affixIndex: undefined, percentage: DEFAULT_QUALITY }));

interface LegendaryAffixSlotState {
  affixIndex: number | undefined;
  percentage: number;
}

interface EquipmentUIState {
  // Crafting state
  selectedEquipmentType: EquipmentType | undefined;
  affixSlots: AffixSlotState[];
  blendAffixIndex: number | undefined;
  baseStatsAffixIndex: number | undefined;

  // Legendary crafting state
  selectedLegendaryIndex: number | undefined;
  legendaryAffixSlots: LegendaryAffixSlotState[];

  // Selected gear slot for equipping
  selectedGearSlot: GearSlot;

  // Actions
  setSelectedEquipmentType: (type: EquipmentType | undefined) => void;
  setAffixSlot: (index: number, update: Partial<AffixSlotState>) => void;
  clearAffixSlot: (index: number) => void;
  setBlendAffixIndex: (index: number | undefined) => void;
  setBaseStatsAffixIndex: (index: number | undefined) => void;
  resetCrafting: () => void;

  setSelectedLegendaryIndex: (index: number | undefined) => void;
  setLegendaryAffixSlot: (
    index: number,
    update: Partial<LegendaryAffixSlotState>,
  ) => void;
  resetLegendaryCrafting: () => void;

  setSelectedGearSlot: (slot: GearSlot) => void;
}

export const useEquipmentUIStore = create<EquipmentUIState>((set) => ({
  // Initial state
  selectedEquipmentType: undefined,
  affixSlots: createEmptyAffixSlots(),
  blendAffixIndex: undefined,
  baseStatsAffixIndex: undefined,
  selectedLegendaryIndex: undefined,
  legendaryAffixSlots: [],
  selectedGearSlot: "helmet",

  // Actions
  setSelectedEquipmentType: (type) =>
    set({
      selectedEquipmentType: type,
      affixSlots: createEmptyAffixSlots(),
      blendAffixIndex: undefined,
      baseStatsAffixIndex: undefined,
    }),

  setAffixSlot: (index, update) =>
    set((state) => ({
      affixSlots: state.affixSlots.map((slot, i) =>
        i === index ? { ...slot, ...update } : slot,
      ),
    })),

  clearAffixSlot: (index) =>
    set((state) => ({
      affixSlots: state.affixSlots.map((slot, i) =>
        i === index
          ? { affixIndex: undefined, percentage: DEFAULT_QUALITY }
          : slot,
      ),
    })),

  setBlendAffixIndex: (index) => set({ blendAffixIndex: index }),

  setBaseStatsAffixIndex: (index) => set({ baseStatsAffixIndex: index }),

  resetCrafting: () =>
    set({
      selectedEquipmentType: undefined,
      affixSlots: createEmptyAffixSlots(),
      blendAffixIndex: undefined,
      baseStatsAffixIndex: undefined,
    }),

  setSelectedLegendaryIndex: (index) =>
    set({
      selectedLegendaryIndex: index,
      legendaryAffixSlots: [],
    }),

  setLegendaryAffixSlot: (index, update) =>
    set((state) => ({
      legendaryAffixSlots: state.legendaryAffixSlots.map((slot, i) =>
        i === index ? { ...slot, ...update } : slot,
      ),
    })),

  resetLegendaryCrafting: () =>
    set({
      selectedLegendaryIndex: undefined,
      legendaryAffixSlots: [],
    }),

  setSelectedGearSlot: (slot) => set({ selectedGearSlot: slot }),
}));
