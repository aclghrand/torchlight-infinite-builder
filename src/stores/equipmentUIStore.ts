"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { EquipmentType } from "@/src/tli/gear-data-types";
import { DEFAULT_QUALITY } from "../lib/constants";
import type { AffixSlotState, GearSlot } from "../lib/types";

const createEmptyAffixSlots = (): AffixSlotState[] =>
  Array(6)
    .fill(undefined)
    .map(() => ({ affixIndex: undefined, percentage: DEFAULT_QUALITY }));

const createEmptyBaseAffixSlots = (): AffixSlotState[] =>
  Array(2)
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
  baseAffixSlots: AffixSlotState[];
  blendAffixIndex: number | undefined;
  baseStatsAffixIndex: number | undefined;
  sweetDreamAffixIndex: number | undefined;
  sweetDreamAffixPercentage: number;
  towerSequenceAffixIndex: number | undefined;

  // Legendary crafting state
  selectedLegendaryIndex: number | undefined;
  legendaryAffixSlots: LegendaryAffixSlotState[];

  // Selected gear slot for equipping
  selectedGearSlot: GearSlot;

  // Edit modal state
  isEditModalOpen: boolean;
  editModalItemId: string | undefined;

  // Actions
  setSelectedEquipmentType: (type: EquipmentType | undefined) => void;
  setAffixSlot: (index: number, update: Partial<AffixSlotState>) => void;
  clearAffixSlot: (index: number) => void;
  setBaseAffixSlot: (index: number, update: Partial<AffixSlotState>) => void;
  clearBaseAffixSlot: (index: number) => void;
  setBlendAffixIndex: (index: number | undefined) => void;
  setBaseStatsAffixIndex: (index: number | undefined) => void;
  setSweetDreamAffixIndex: (index: number | undefined) => void;
  setSweetDreamAffixPercentage: (percentage: number) => void;
  setTowerSequenceAffixIndex: (index: number | undefined) => void;
  resetCrafting: () => void;

  setSelectedLegendaryIndex: (index: number | undefined) => void;
  setLegendaryAffixSlot: (
    index: number,
    update: Partial<LegendaryAffixSlotState>,
  ) => void;
  resetLegendaryCrafting: () => void;

  setSelectedGearSlot: (slot: GearSlot) => void;

  // Edit modal actions
  openEditModal: (itemId: string) => void;
  closeEditModal: () => void;
}

export const useEquipmentUIStore = create<EquipmentUIState>()(
  immer((set) => ({
    // Initial state
    selectedEquipmentType: undefined,
    affixSlots: createEmptyAffixSlots(),
    baseAffixSlots: createEmptyBaseAffixSlots(),
    blendAffixIndex: undefined,
    baseStatsAffixIndex: undefined,
    sweetDreamAffixIndex: undefined,
    sweetDreamAffixPercentage: DEFAULT_QUALITY,
    towerSequenceAffixIndex: undefined,
    selectedLegendaryIndex: undefined,
    legendaryAffixSlots: [],
    selectedGearSlot: "helmet",
    isEditModalOpen: false,
    editModalItemId: undefined,

    // Actions
    setSelectedEquipmentType: (type) =>
      set((state) => {
        state.selectedEquipmentType = type;
        state.affixSlots = createEmptyAffixSlots();
        state.baseAffixSlots = createEmptyBaseAffixSlots();
        state.blendAffixIndex = undefined;
        state.baseStatsAffixIndex = undefined;
        state.sweetDreamAffixIndex = undefined;
        state.sweetDreamAffixPercentage = DEFAULT_QUALITY;
        state.towerSequenceAffixIndex = undefined;
      }),

    setAffixSlot: (index, update) =>
      set((state) => {
        Object.assign(state.affixSlots[index], update);
      }),

    clearAffixSlot: (index) =>
      set((state) => {
        state.affixSlots[index] = {
          affixIndex: undefined,
          percentage: DEFAULT_QUALITY,
        };
      }),

    setBaseAffixSlot: (index, update) =>
      set((state) => {
        Object.assign(state.baseAffixSlots[index], update);
      }),

    clearBaseAffixSlot: (index) =>
      set((state) => {
        state.baseAffixSlots[index] = {
          affixIndex: undefined,
          percentage: DEFAULT_QUALITY,
        };
      }),

    setBlendAffixIndex: (index) =>
      set((state) => {
        state.blendAffixIndex = index;
      }),

    setBaseStatsAffixIndex: (index) =>
      set((state) => {
        state.baseStatsAffixIndex = index;
      }),

    setSweetDreamAffixIndex: (index) =>
      set((state) => {
        state.sweetDreamAffixIndex = index;
        if (index === undefined) {
          state.sweetDreamAffixPercentage = DEFAULT_QUALITY;
        }
      }),

    setSweetDreamAffixPercentage: (percentage) =>
      set((state) => {
        state.sweetDreamAffixPercentage = percentage;
      }),

    setTowerSequenceAffixIndex: (index) =>
      set((state) => {
        state.towerSequenceAffixIndex = index;
      }),

    resetCrafting: () =>
      set((state) => {
        state.selectedEquipmentType = undefined;
        state.affixSlots = createEmptyAffixSlots();
        state.baseAffixSlots = createEmptyBaseAffixSlots();
        state.blendAffixIndex = undefined;
        state.baseStatsAffixIndex = undefined;
        state.sweetDreamAffixIndex = undefined;
        state.sweetDreamAffixPercentage = DEFAULT_QUALITY;
        state.towerSequenceAffixIndex = undefined;
      }),

    setSelectedLegendaryIndex: (index) =>
      set((state) => {
        state.selectedLegendaryIndex = index;
        state.legendaryAffixSlots = [];
      }),

    setLegendaryAffixSlot: (index, update) =>
      set((state) => {
        Object.assign(state.legendaryAffixSlots[index], update);
      }),

    resetLegendaryCrafting: () =>
      set((state) => {
        state.selectedLegendaryIndex = undefined;
        state.legendaryAffixSlots = [];
      }),

    setSelectedGearSlot: (slot) =>
      set((state) => {
        state.selectedGearSlot = slot;
      }),

    openEditModal: (itemId) =>
      set((state) => {
        state.isEditModalOpen = true;
        state.editModalItemId = itemId;
      }),

    closeEditModal: () =>
      set((state) => {
        state.isEditModalOpen = false;
        state.editModalItemId = undefined;
      }),
  })),
);
