"use client";

import { useMemo, useRef } from "react";
import type { Configuration, Loadout, TalentTree } from "@/src/tli/core";
import { loadSave } from "@/src/tli/storage/load-save";
import type { SavesIndex } from "../../lib/saves";
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

  return {
    level: configPage.level,
    fervorEnabled: configPage.fervorEnabled,
    fervorPoints: configPage.fervorPoints,
    enemyFrostbittenEnabled: configPage.enemyFrostbittenEnabled,
    enemyFrostbittenPoints: configPage.enemyFrostbittenPoints,
    crueltyBuffStacks: configPage.crueltyBuffStacks,
    numShadowHits: configPage.numShadowHits,
    manaConsumedRecently: configPage.manaConsumedRecently,
    unsealedManaPct: configPage.unsealedManaPct,
    realmOfMercuryEnabled: configPage.realmOfMercuryEnabled,
    focusBlessings: configPage.focusBlessings,
    hasFocusBlessing: configPage.hasFocusBlessing,
    agilityBlessings: configPage.agilityBlessings,
    hasAgilityBlessing: configPage.hasAgilityBlessing,
    enemyRes: configPage.enemyRes,
    enemyArmor: configPage.enemyArmor,
    enemyParalyzed: configPage.enemyParalyzed,
    hasFullMana: configPage.hasFullMana,
    targetEnemyIsNearby: configPage.targetEnemyIsNearby,
    targetEnemyIsInProximity: configPage.targetEnemyIsInProximity,
    numEnemiesNearby: configPage.numEnemiesNearby,
    numEnemiesAffectedByWarcry: configPage.numEnemiesAffectedByWarcry,
    hasBlockedRecently: configPage.hasBlockedRecently,
    hasElitesNearby: configPage.hasElitesNearby,
    enemyHasAilment: configPage.enemyHasAilment,
  };
};
