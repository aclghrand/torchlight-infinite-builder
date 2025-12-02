"use client";

import { useCallback } from "react";
import { useBuilderStore } from "../../stores/builderStore";
import { PactspiritTab } from "../pactspirit/PactspiritTab";
import { PactspiritPage } from "../../lib/save-data";
import {
  RingSlotKey,
  PactspiritSlotIndex,
  InstalledDestinyResult,
} from "../../lib/types";
import { createEmptyPactspiritSlot } from "../../lib/storage";

export const PactspiritSection = () => {
  const loadout = useBuilderStore((state) => state.loadout);
  const updateLoadout = useBuilderStore((state) => state.updateLoadout);

  const handlePactspiritSelect = useCallback(
    (slotIndex: PactspiritSlotIndex, pactspiritName: string | undefined) => {
      const slotKey = `slot${slotIndex}` as keyof PactspiritPage;
      updateLoadout((prev) => ({
        ...prev,
        pactspiritPage: {
          ...prev.pactspiritPage,
          [slotKey]: {
            ...createEmptyPactspiritSlot(),
            pactspiritName,
          },
        },
      }));
    },
    [updateLoadout],
  );

  const handleLevelChange = useCallback(
    (slotIndex: PactspiritSlotIndex, level: number) => {
      const slotKey = `slot${slotIndex}` as keyof PactspiritPage;
      updateLoadout((prev) => ({
        ...prev,
        pactspiritPage: {
          ...prev.pactspiritPage,
          [slotKey]: {
            ...prev.pactspiritPage[slotKey],
            level,
          },
        },
      }));
    },
    [updateLoadout],
  );

  const handleInstallDestiny = useCallback(
    (
      slotIndex: PactspiritSlotIndex,
      ringSlot: RingSlotKey,
      destiny: InstalledDestinyResult,
    ) => {
      const slotKey = `slot${slotIndex}` as keyof PactspiritPage;
      updateLoadout((prev) => ({
        ...prev,
        pactspiritPage: {
          ...prev.pactspiritPage,
          [slotKey]: {
            ...prev.pactspiritPage[slotKey],
            rings: {
              ...prev.pactspiritPage[slotKey].rings,
              [ringSlot]: {
                installedDestiny: destiny,
              },
            },
          },
        },
      }));
    },
    [updateLoadout],
  );

  const handleRevertRing = useCallback(
    (slotIndex: PactspiritSlotIndex, ringSlot: RingSlotKey) => {
      const slotKey = `slot${slotIndex}` as keyof PactspiritPage;
      updateLoadout((prev) => ({
        ...prev,
        pactspiritPage: {
          ...prev.pactspiritPage,
          [slotKey]: {
            ...prev.pactspiritPage[slotKey],
            rings: {
              ...prev.pactspiritPage[slotKey].rings,
              [ringSlot]: {},
            },
          },
        },
      }));
    },
    [updateLoadout],
  );

  return (
    <PactspiritTab
      pactspiritPage={loadout.pactspiritPage}
      onPactspiritSelect={handlePactspiritSelect}
      onLevelChange={handleLevelChange}
      onInstallDestiny={handleInstallDestiny}
      onRevertRing={handleRevertRing}
    />
  );
};
