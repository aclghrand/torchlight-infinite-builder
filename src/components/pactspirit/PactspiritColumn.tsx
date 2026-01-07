import { useState } from "react";
import { SearchableSelect } from "@/src/components/ui/SearchableSelect";
import { Pactspirits } from "@/src/data/pactspirit/pactspirits";
import type { PactspiritSlot } from "@/src/tli/core";
import { getPactspiritByName } from "../../lib/pactspirit-utils";
import {
  type InstalledDestinyResult,
  type PactspiritSlotIndex,
  RING_DISPLAY_ORDER,
  type RingSlotKey,
} from "../../lib/types";
import { DestinySelectionModal } from "../modals/DestinySelectionModal";
import { RingSlot } from "./RingSlot";

interface PactspiritColumnProps {
  slotIndex: PactspiritSlotIndex;
  slot: PactspiritSlot | undefined;
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

  const selectedPactspirit = slot
    ? getPactspiritByName(slot.pactspiritName)
    : undefined;

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
        <SearchableSelect
          value={slot?.pactspiritName}
          onChange={onPactspiritSelect}
          options={Pactspirits.map((p) => ({
            value: p.name,
            label: p.name,
            sublabel: `${p.type}, ${p.rarity}`,
          }))}
          placeholder="<Select Pactspirit>"
        />
      </div>

      {/* Level Selector */}
      {slot && selectedPactspirit && (
        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-1">Level</label>
          <SearchableSelect
            value={slot.level}
            onChange={(level) => level !== undefined && onLevelChange(level)}
            options={[1, 2, 3, 4, 5, 6].map((level) => ({
              value: level,
              label: `Level ${level}`,
            }))}
            placeholder="Select Level"
          />
        </div>
      )}

      {/* Level Affix Display */}
      {slot && selectedPactspirit && slot.mainAffix.affixLines.length > 0 && (
        <div className="mb-4 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
          <div className="text-sm font-medium text-amber-400 mb-1">
            Level {slot.level} Effect
          </div>
          <div>
            {slot.mainAffix.affixLines.map((line, lineIdx) => (
              <div
                key={lineIdx}
                className={
                  lineIdx > 0 ? "mt-1 pt-1 border-t border-zinc-800" : ""
                }
              >
                <div className="text-xs text-zinc-400">{line.text}</div>
                {line.mods === undefined && (
                  <div className="text-xs text-red-500">
                    (Mod not supported in TOB yet)
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ring Slots */}
      {slot && selectedPactspirit && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-zinc-400 mb-2">Ring Slots</h4>
          {RING_DISPLAY_ORDER.map((ringSlot) => (
            <RingSlot
              key={ringSlot}
              ringSlot={ringSlot}
              ringState={slot.rings[ringSlot]}
              onInstallClick={() => handleInstallClick(ringSlot)}
              onRevert={() => onRevertRing(ringSlot)}
            />
          ))}
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
