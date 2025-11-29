"use client";

import { useState } from "react";
import { RawRingSlotState } from "@/src/tli/core";
import { PactspiritRingDetails } from "@/src/data/pactspirit/types";
import { RingSlotKey } from "../../lib/types";
import {
  getDestinyByName,
  craftDestinyAffix,
  isInnerRing,
} from "../../lib/pactspirit-utils";
import { RingTooltip } from "./RingTooltip";

interface RingSlotProps {
  ringSlot: RingSlotKey;
  originalRing: PactspiritRingDetails;
  ringState: RawRingSlotState;
  onInstallClick: () => void;
  onRevert: () => void;
}

export const RingSlot: React.FC<RingSlotProps> = ({
  ringSlot,
  originalRing,
  ringState,
  onInstallClick,
  onRevert,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const hasDestiny = !!ringState.installedDestiny;
  const isInner = isInnerRing(ringSlot);

  // Determine display name and affix
  let displayName: string;
  let displayAffix: string;
  let destinyType: string | undefined;

  if (hasDestiny && ringState.installedDestiny) {
    const { destinyName, destinyType: dType, resolvedPercentage } = ringState.installedDestiny;
    const destiny = getDestinyByName(destinyName);
    destinyType = dType;
    displayName = destinyName;
    displayAffix = destiny
      ? craftDestinyAffix(destiny.affix, resolvedPercentage)
      : "";
  } else {
    displayName = originalRing.name;
    displayAffix = originalRing.affix;
  }

  return (
    <div
      className={`p-2 rounded-lg border ${
        isInner
          ? "bg-zinc-800 border-zinc-700"
          : "bg-zinc-750 border-amber-700/50"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div
            className={`text-sm font-medium truncate ${
              hasDestiny ? "text-amber-400" : "text-zinc-200"
            }`}
          >
            {hasDestiny && destinyType
              ? `${destinyType}: ${displayName}`
              : displayName}
          </div>
          <div className="text-xs text-zinc-500">
            {isInner ? "Inner Ring" : "Mid Ring"}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {hasDestiny ? (
            <button
              onClick={onRevert}
              className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
            >
              Revert
            </button>
          ) : (
            <button
              onClick={onInstallClick}
              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded text-xs"
            >
              Install
            </button>
          )}
        </div>
      </div>

      {isHovered && (
        <RingTooltip
          ringName={displayName}
          affix={displayAffix}
          destinyType={hasDestiny ? destinyType : undefined}
          mousePos={mousePos}
        />
      )}
    </div>
  );
};
