"use client";

import { useMemo, useRef } from "react";
import type { Configuration, Loadout, TalentTree } from "@/src/tli/core";
import { loadSave } from "@/src/tli/storage/load-save";
import type { SavesIndex } from "../../lib/saves";
import { createEmptyConfigurationPage } from "../../lib/storage";
import type { TreeSlot } from "../../lib/types";
import { internalStore } from "./internal";

// Public readable state (NO saveData)
export interface BuilderReadableState {
  currentSaveId: string | undefined;
  currentSaveName: string | undefined;
  savesIndex: SavesIndex;
}

export const useLoadout = (): Loadout => {
  const saveData = internalStore((state) => state.saveData);

  const saveDataJsonRef = useRef<string>("");
  const loadoutRef = useRef<Loadout | undefined>(undefined);

  return useMemo(() => {
    const saveDataJson = JSON.stringify(saveData);

    if (saveDataJson !== saveDataJsonRef.current || !loadoutRef.current) {
      saveDataJsonRef.current = saveDataJson;
      loadoutRef.current = loadSave(saveData);
    }

    return loadoutRef.current;
  }, [saveData]);
};

export const useTalentTree = (slot: TreeSlot): TalentTree | undefined => {
  const loadout = useLoadout();
  return loadout.talentPage.talentTrees[slot];
};

// Hook for readable state (NO saveData)
export const useBuilderState = <T>(
  selector: (state: BuilderReadableState) => T,
): T => {
  return internalStore((state) =>
    selector({
      currentSaveId: state.currentSaveId,
      currentSaveName: state.currentSaveName,
      savesIndex: state.savesIndex,
    }),
  );
};

// Convenience hooks for common state
export const useCurrentSaveId = (): string | undefined =>
  internalStore((state) => state.currentSaveId);

export const useCurrentSaveName = (): string | undefined =>
  internalStore((state) => state.currentSaveName);

export const useSavesIndex = () => internalStore((state) => state.savesIndex);

export const useCalculationsSelectedSkill = (): string | undefined =>
  internalStore((state) => state.saveData.calculationsPage?.selectedSkillName);

export const useConfigurationPage = () =>
  internalStore((state) => state.saveData.configurationPage);

export const useConfiguration = (): Configuration => {
  const configPage = internalStore((state) => state.saveData.configurationPage);
  const defaults = createEmptyConfigurationPage();

  return {
    fervor: {
      enabled: configPage?.fervorEnabled ?? defaults.fervorEnabled,
      points: configPage?.fervorPoints,
    },
    enemyFrostbitten: {
      enabled:
        configPage?.enemyFrostbittenEnabled ?? defaults.enemyFrostbittenEnabled,
      points: configPage?.enemyFrostbittenPoints,
    },
    crueltyBuffStacks:
      configPage?.crueltyBuffStacks ?? defaults.crueltyBuffStacks,
    enemyRes: configPage?.enemyRes,
    enemyArmor: configPage?.enemyArmor,
  };
};
