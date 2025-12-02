"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { CraftedPrism } from "@/src/app/lib/save-data";
import {
  getRareGaugeAffixes,
  getLegendaryGaugeAffixes,
} from "@/src/app/lib/prism-utils";

interface PrismInventoryItemProps {
  prism: CraftedPrism;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export const PrismInventoryItem: React.FC<PrismInventoryItemProps> = ({
  prism,
  onEdit,
  onCopy,
  onDelete,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const itemRef = useRef<HTMLDivElement>(null);

  const legendaryGauges = getLegendaryGaugeAffixes();
  const legendaryCount = prism.gaugeAffixes.filter((a) =>
    legendaryGauges.some((lg) => lg.affix === a),
  ).length;
  const rareCount = prism.gaugeAffixes.length - legendaryCount;

  const handleMouseEnter = () => {
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top,
        left: rect.right + 8,
      });
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const baseAffixFirstLine = prism.baseAffix.split("\n")[0];
  const displayText =
    baseAffixFirstLine.length > 60
      ? baseAffixFirstLine.slice(0, 60) + "..."
      : baseAffixFirstLine;

  return (
    <>
      <div
        ref={itemRef}
        className="flex items-center gap-3 rounded border border-zinc-700 bg-zinc-900 p-2 transition-colors hover:border-zinc-600"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex-shrink-0">
          <span
            className={`inline-block h-4 w-4 rounded ${
              prism.rarity === "legendary" ? "bg-orange-500" : "bg-purple-500"
            }`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-200 capitalize">
              {prism.rarity}
            </span>
          </div>
          <div className="text-xs text-zinc-400 truncate">{displayText}</div>
          <div className="flex items-center gap-1 mt-1">
            {legendaryCount > 0 && (
              <div className="flex items-center gap-0.5">
                <span className="h-2 w-2 rounded-sm bg-orange-500" />
                <span className="text-xs text-zinc-400">×{legendaryCount}</span>
              </div>
            )}
            {rareCount > 0 && (
              <div className="flex items-center gap-0.5 ml-1">
                <span className="h-2 w-2 rounded-sm bg-purple-500" />
                <span className="text-xs text-zinc-400">×{rareCount}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="rounded bg-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-600"
          >
            Edit
          </button>
          <button
            onClick={onCopy}
            className="rounded bg-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-600"
          >
            Copy
          </button>
          <button
            onClick={onDelete}
            className="rounded bg-zinc-700 px-2 py-1 text-xs text-red-400 hover:bg-red-900"
          >
            Delete
          </button>
        </div>
      </div>

      {showTooltip &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-50 max-w-sm rounded border border-zinc-600 bg-zinc-800 p-3 shadow-lg"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
            }}
          >
            <div className="mb-2 text-sm font-medium text-zinc-200 capitalize">
              {prism.rarity} Prism
            </div>
            <div className="mb-2 text-xs text-zinc-300 whitespace-pre-line">
              <span className="text-zinc-500">Base: </span>
              {prism.baseAffix}
            </div>
            {prism.gaugeAffixes.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-zinc-500">Gauge Affixes:</span>
                {prism.gaugeAffixes.map((affix, i) => {
                  const isLegendary = legendaryGauges.some(
                    (lg) => lg.affix === affix,
                  );
                  return (
                    <div key={i} className="flex items-start gap-1">
                      <span
                        className={`mt-1 h-2 w-2 flex-shrink-0 rounded-sm ${
                          isLegendary ? "bg-orange-500" : "bg-purple-500"
                        }`}
                      />
                      <span className="text-xs text-zinc-300 whitespace-pre-line">
                        {affix}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
};
