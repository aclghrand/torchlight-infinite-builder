"use client";

import { RawPactspiritPage } from "@/src/tli/core";
import { RingSlotKey, PactspiritSlotIndex } from "../../lib/types";
import { PactspiritColumn } from "./PactspiritColumn";

interface InstalledDestinyResult {
  destinyName: string;
  destinyType: string;
  resolvedPercentage: number;
}

interface PactspiritTabProps {
  pactspiritPage: RawPactspiritPage;
  onPactspiritSelect: (
    slotIndex: PactspiritSlotIndex,
    pactspiritName: string | undefined,
  ) => void;
  onLevelChange: (slotIndex: PactspiritSlotIndex, level: number) => void;
  onInstallDestiny: (
    slotIndex: PactspiritSlotIndex,
    ringSlot: RingSlotKey,
    destiny: InstalledDestinyResult,
  ) => void;
  onRevertRing: (
    slotIndex: PactspiritSlotIndex,
    ringSlot: RingSlotKey,
  ) => void;
}

export const PactspiritTab: React.FC<PactspiritTabProps> = ({
  pactspiritPage,
  onPactspiritSelect,
  onLevelChange,
  onInstallDestiny,
  onRevertRing,
}) => {
  const slotIndices: PactspiritSlotIndex[] = [1, 2, 3];

  return (
    <div className="flex gap-4">
      {slotIndices.map((slotIndex) => {
        const slotKey = `slot${slotIndex}` as keyof RawPactspiritPage;
        const slot = pactspiritPage[slotKey];

        return (
          <PactspiritColumn
            key={slotIndex}
            slotIndex={slotIndex}
            slot={slot}
            onPactspiritSelect={(name) => onPactspiritSelect(slotIndex, name)}
            onLevelChange={(level) => onLevelChange(slotIndex, level)}
            onInstallDestiny={(ringSlot, destiny) =>
              onInstallDestiny(slotIndex, ringSlot, destiny)
            }
            onRevertRing={(ringSlot) => onRevertRing(slotIndex, ringSlot)}
          />
        );
      })}
    </div>
  );
};
