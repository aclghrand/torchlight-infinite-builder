"use client";

import { useState } from "react";
import { Pactspirits } from "@/src/data/pactspirit/pactspirits";
import { RawPactspiritSlot } from "@/src/tli/core";
import {
  RingSlotKey,
  RING_DISPLAY_ORDER,
  PactspiritSlotIndex,
} from "../../lib/types";
import {
  getPactspiritByName,
  getPactspiritLevelAffix,
  getPactspiritRing,
} from "../../lib/pactspirit-utils";
import { RingSlot } from "./RingSlot";
import { DestinySelectionModal } from "./DestinySelectionModal";

interface InstalledDestinyResult {
  destinyName: string;
  destinyType: string;
  resolvedPercentage: number;
}

interface PactspiritColumnProps {
  slotIndex: PactspiritSlotIndex;
  slot: RawPactspiritSlot;
  onPactspiritSelect: (pactspiritName: string | undefined) => void;
  onLevelChange: (level: number) => void;
  onInstallDestiny: (
    ringSlot: RingSlotKey,
    destiny: InstalledDestinyResult,
  ) => void;
  onRevertRing: (ringSlot: RingSlotKey) => void;
}

export const PactspiritColumn: React.FC<PactspiritColumnProps> = ({
  slotIndex,
  slot,
  onPactspiritSelect,
  onLevelChange,
  onInstallDestiny,
  onRevertRing,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeRingSlot, setActiveRingSlot] = useState<RingSlotKey | undefined>(
    undefined,
  );

  const selectedPactspirit = slot.pactspiritName
    ? getPactspiritByName(slot.pactspiritName)
    : undefined;

  const levelAffix = selectedPactspirit
    ? getPactspiritLevelAffix(selectedPactspirit, slot.level)
    : "";

  const handleInstallClick = (ringSlot: RingSlotKey) => {
    setActiveRingSlot(ringSlot);
    setModalOpen(true);
  };

  const handleConfirmDestiny = (destiny: InstalledDestinyResult) => {
    if (activeRingSlot) {
      onInstallDestiny(activeRingSlot, destiny);
    }
    setModalOpen(false);
    setActiveRingSlot(undefined);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setActiveRingSlot(undefined);
  };

  return (
    <div className="flex-1 bg-zinc-900 rounded-lg p-4 border border-zinc-800">
      <h3 className="text-lg font-semibold text-zinc-50 mb-4">
        Pactspirit {slotIndex}
      </h3>

      {/* Pactspirit Selector */}
      <div className="mb-4">
        <label className="block text-sm text-zinc-400 mb-1">Pactspirit</label>
        <select
          value={slot.pactspiritName ?? ""}
          onChange={(e) =>
            onPactspiritSelect(e.target.value || undefined)
          }
          className="w-full px-3 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
        >
          <option value="">&lt;Select Pactspirit&gt;</option>
          {Pactspirits.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name} ({p.type}, {p.rarity})
            </option>
          ))}
        </select>
      </div>

      {/* Level Selector */}
      {selectedPactspirit && (
        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-1">Level</label>
          <select
            value={slot.level}
            onChange={(e) => onLevelChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          >
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <option key={level} value={level}>
                Level {level}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Level Affix Display */}
      {selectedPactspirit && levelAffix && (
        <div className="mb-4 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
          <div className="text-sm font-medium text-amber-400 mb-1">
            Level {slot.level} Effect
          </div>
          <div className="text-xs text-zinc-400 whitespace-pre-line">
            {levelAffix}
          </div>
        </div>
      )}

      {/* Ring Slots */}
      {selectedPactspirit && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-zinc-400 mb-2">Ring Slots</h4>
          {RING_DISPLAY_ORDER.map((ringSlot) => {
            const originalRing = getPactspiritRing(selectedPactspirit, ringSlot);
            return (
              <RingSlot
                key={ringSlot}
                ringSlot={ringSlot}
                originalRing={originalRing}
                ringState={slot.rings[ringSlot]}
                onInstallClick={() => handleInstallClick(ringSlot)}
                onRevert={() => onRevertRing(ringSlot)}
              />
            );
          })}
        </div>
      )}

      {/* No pactspirit selected message */}
      {!selectedPactspirit && (
        <div className="text-center text-zinc-500 py-8">
          Select a pactspirit to configure ring slots
        </div>
      )}

      {/* Destiny Selection Modal */}
      {activeRingSlot && (
        <DestinySelectionModal
          isOpen={modalOpen}
          ringSlot={activeRingSlot}
          onClose={handleCloseModal}
          onConfirm={handleConfirmDestiny}
        />
      )}
    </div>
  );
};
