"use client";

import { createPortal } from "react-dom";

interface RingTooltipProps {
  ringName: string;
  affix: string;
  destinyType?: string;
  mousePos: { x: number; y: number };
}

export const RingTooltip: React.FC<RingTooltipProps> = ({
  ringName,
  affix,
  destinyType,
  mousePos,
}) => {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed z-50 w-72 pointer-events-none"
      style={{ left: mousePos.x + 12, top: mousePos.y + 12 }}
    >
      <div className="bg-zinc-950 text-zinc-50 p-3 rounded-lg shadow-xl border border-zinc-700">
        <div className="font-semibold text-sm mb-2 text-amber-400">
          {destinyType ? `${destinyType}: ${ringName}` : ringName}
        </div>
        <div className="text-xs text-zinc-400 whitespace-pre-line">{affix}</div>
      </div>
    </div>,
    document.body,
  );
};
