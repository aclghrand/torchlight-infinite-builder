"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { RawGear } from "@/src/tli/core";

interface InventoryItemProps {
  item: RawGear;
  isEquipped: boolean;
  onCopy: (item: RawGear) => void;
  onDelete: (id: string) => void;
}

export const InventoryItem: React.FC<InventoryItemProps> = ({
  item,
  isEquipped,
  onCopy,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const isLegendary = item.rarity === "legendary";

  return (
    <div
      className={`group relative flex items-center justify-between p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors border ${
        isLegendary ? "border-amber-500/50" : "border-transparent"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium text-zinc-50 text-sm">
          {item.legendaryName ?? item.equipmentType}
        </span>
        {isLegendary && (
          <span className="text-xs text-amber-400 font-medium">Legendary</span>
        )}
        <span className="text-xs text-zinc-500">
          ({item.affixes.length} affixes)
        </span>
        {isEquipped && (
          <span className="text-xs text-green-500 font-medium">Equipped</span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onCopy(item)}
          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded text-xs"
          title="Copy item"
        >
          Copy
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
          title="Delete item"
        >
          Delete
        </button>
      </div>

      {/* Hover tooltip showing item details - rendered via portal to escape scroll container */}
      {isHovered &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-50 w-72 pointer-events-none"
            style={{ left: mousePos.x + 12, top: mousePos.y + 12 }}
          >
            <div
              className={`bg-zinc-950 text-zinc-50 p-3 rounded-lg shadow-xl border ${
                isLegendary ? "border-amber-500/50" : "border-zinc-700"
              }`}
            >
              <div className="font-semibold text-sm mb-2 text-amber-400">
                {item.legendaryName ?? item.equipmentType}
              </div>
              {isLegendary && (
                <div className="text-xs text-zinc-500 mb-2">
                  {item.equipmentType}
                </div>
              )}
              {item.baseStats && (
                <div className="text-xs text-amber-300 mb-2">
                  {item.baseStats}
                </div>
              )}
              {item.affixes.length > 0 ? (
                <ul className="space-y-1">
                  {item.affixes.map((affix, idx) => (
                    <li key={idx} className="text-xs text-zinc-400">
                      {affix}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-zinc-500 italic">No affixes</p>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
