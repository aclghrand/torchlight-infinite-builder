"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Destiny } from "@/src/data/destiny/types";
import { RingSlotKey } from "../../lib/types";
import {
  getDestiniesForRingSlot,
  formatDestinyOption,
  hasRanges,
  craftDestinyAffix,
} from "../../lib/pactspirit-utils";

interface InstalledDestinyResult {
  destinyName: string;
  destinyType: string;
  resolvedPercentage: number;
}

interface DestinySelectionModalProps {
  isOpen: boolean;
  ringSlot: RingSlotKey;
  onClose: () => void;
  onConfirm: (destiny: InstalledDestinyResult) => void;
}

export const DestinySelectionModal: React.FC<DestinySelectionModalProps> = ({
  isOpen,
  ringSlot,
  onClose,
  onConfirm,
}) => {
  const [selectedDestiny, setSelectedDestiny] = useState<Destiny | undefined>();
  const [percentage, setPercentage] = useState(50);

  const availableDestinies = getDestiniesForRingSlot(ringSlot);
  const affixHasRanges = selectedDestiny
    ? hasRanges(selectedDestiny.affix)
    : false;
  const previewAffix = selectedDestiny
    ? craftDestinyAffix(selectedDestiny.affix, percentage)
    : "";

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDestiny(undefined);
      setPercentage(50);
    }
  }, [isOpen]);

  const handleDestinySelect = (destinyName: string) => {
    const destiny = availableDestinies.find((d) => d.name === destinyName);
    setSelectedDestiny(destiny);
    setPercentage(50);
  };

  const handleConfirm = () => {
    if (!selectedDestiny) return;
    onConfirm({
      destinyName: selectedDestiny.name,
      destinyType: selectedDestiny.type,
      resolvedPercentage: percentage,
    });
    onClose();
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal Content */}
      <div
        className="relative bg-zinc-900 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-zinc-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-zinc-50">
          Install Destiny
        </h2>

        <p className="text-sm text-zinc-400 mb-4">
          Select a destiny to install in this{" "}
          {ringSlot.startsWith("innerRing") ? "inner" : "mid"} ring slot.
        </p>

        {/* Destiny Dropdown */}
        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-1">Destiny</label>
          <select
            value={selectedDestiny?.name ?? ""}
            onChange={(e) => handleDestinySelect(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          >
            <option value="">&lt;Select Destiny&gt;</option>
            {availableDestinies.map((destiny) => (
              <option key={destiny.name} value={destiny.name}>
                {formatDestinyOption(destiny)}
              </option>
            ))}
          </select>
        </div>

        {/* Range Slider (only if destiny has ranges) */}
        {selectedDestiny && affixHasRanges && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-zinc-400">Roll Quality</label>
              <span className="text-sm font-medium text-zinc-50">
                {percentage}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        )}

        {/* Affix Preview */}
        {selectedDestiny && (
          <div className="mb-4 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
            <div className="text-sm font-medium text-amber-400 mb-1">
              {formatDestinyOption(selectedDestiny)}
            </div>
            <div className="text-xs text-zinc-400 whitespace-pre-line">
              {previewAffix}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={!selectedDestiny}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedDestiny
                ? "bg-amber-500 hover:bg-amber-600 text-zinc-950"
                : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
            }`}
          >
            Confirm
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-50 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
