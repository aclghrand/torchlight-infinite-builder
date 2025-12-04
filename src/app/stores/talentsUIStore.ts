"use client";

import { create } from "zustand";
import { TalentTreeData } from "@/src/tli/talent_tree";
import { TreeSlot } from "../lib/types";
import { PrismRarity } from "../lib/save-data";

interface TalentsUIState {
  // Tree data loaded from files
  treeData: Record<TreeSlot, TalentTreeData | undefined>;

  // Active tree slot being viewed
  activeTreeSlot: TreeSlot;

  // Prism crafting state
  selectedPrismId: string | undefined;
  craftingPrismRarity: PrismRarity;
  craftingBaseAffix: string | undefined;
  craftingGaugeAffixes: Array<{ affix: string; isLegendary: boolean }>;

  // Inverse image selection state
  selectedInverseImageId: string | undefined;

  // Actions
  setTreeData: (slot: TreeSlot, data: TalentTreeData | undefined) => void;
  setActiveTreeSlot: (slot: TreeSlot) => void;

  // Prism crafting actions
  setSelectedPrismId: (id: string | undefined) => void;
  setCraftingPrismRarity: (rarity: PrismRarity) => void;
  setCraftingBaseAffix: (affix: string | undefined) => void;
  addCraftingGaugeAffix: (affix: string, isLegendary: boolean) => void;
  removeCraftingGaugeAffix: (index: number) => void;
  resetPrismCrafting: () => void;

  // Inverse image actions
  setSelectedInverseImageId: (id: string | undefined) => void;
}

export const useTalentsUIStore = create<TalentsUIState>((set) => ({
  // Initial state
  treeData: {
    tree1: undefined,
    tree2: undefined,
    tree3: undefined,
    tree4: undefined,
  },
  activeTreeSlot: "tree1",
  selectedPrismId: undefined,
  craftingPrismRarity: "rare",
  craftingBaseAffix: undefined,
  craftingGaugeAffixes: [],
  selectedInverseImageId: undefined,

  // Actions
  setTreeData: (slot, data) =>
    set((state) => ({
      treeData: { ...state.treeData, [slot]: data },
    })),

  setActiveTreeSlot: (slot) => set({ activeTreeSlot: slot }),

  setSelectedPrismId: (id) => set({ selectedPrismId: id }),

  setCraftingPrismRarity: (rarity) =>
    set((state) => ({
      craftingPrismRarity: rarity,
      craftingBaseAffix: undefined,
      craftingGaugeAffixes:
        rarity === "rare"
          ? state.craftingGaugeAffixes.filter((a) => !a.isLegendary)
          : state.craftingGaugeAffixes,
    })),

  setCraftingBaseAffix: (affix) => set({ craftingBaseAffix: affix }),

  addCraftingGaugeAffix: (affix, isLegendary) =>
    set((state) => ({
      craftingGaugeAffixes: [
        ...state.craftingGaugeAffixes,
        { affix, isLegendary },
      ],
    })),

  removeCraftingGaugeAffix: (index) =>
    set((state) => ({
      craftingGaugeAffixes: state.craftingGaugeAffixes.filter(
        (_, i) => i !== index,
      ),
    })),

  resetPrismCrafting: () =>
    set({
      craftingPrismRarity: "rare",
      craftingBaseAffix: undefined,
      craftingGaugeAffixes: [],
    }),

  setSelectedInverseImageId: (id) => set({ selectedInverseImageId: id }),
}));
