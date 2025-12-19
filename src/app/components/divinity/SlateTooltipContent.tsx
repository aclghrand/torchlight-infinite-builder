"use client";

import { ModNotImplementedIcon } from "@/src/app/components/ui/ModNotImplementedIcon";
import { TooltipTitle } from "@/src/app/components/ui/Tooltip";
import { getSlateDisplayName } from "@/src/app/lib/divinity-utils";
import type { DivinitySlate } from "@/src/tli/core";

export const SlateTooltipContent: React.FC<{ slate: DivinitySlate }> = ({
  slate,
}) => {
  const isLegendary = slate.isLegendary === true;
  const hasMetaAffixes = slate.metaAffixes.length > 0;
  const hasAffixes = slate.affixes.length > 0;

  const displayName = isLegendary
    ? (slate.legendaryName ?? "Legendary Slate")
    : slate.god !== undefined
      ? getSlateDisplayName(slate.god)
      : "Unknown Slate";

  return (
    <>
      <TooltipTitle>{displayName}</TooltipTitle>

      {/* Meta affixes (copy behavior descriptions) */}
      {hasMetaAffixes && (
        <ul className="space-y-1">
          {slate.metaAffixes.map((metaAffix, idx) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: index is stable
              key={`meta-${idx}`}
              className="text-xs text-zinc-500 italic"
            >
              {metaAffix}
            </li>
          ))}
        </ul>
      )}

      {/* Separator between meta affixes and regular affixes */}
      {hasMetaAffixes && hasAffixes && <hr className="border-zinc-600 my-2" />}

      {/* Regular affixes */}
      {hasAffixes ? (
        <ul className="space-y-1">
          {slate.affixes.map((affix, affixIdx) =>
            affix.affixLines.map((line, lineIdx) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: affixes can have duplicate text, index is stable
                key={`${affixIdx}-${lineIdx}`}
                className="text-xs text-zinc-400 flex items-center"
              >
                <span>{line.text}</span>
                {line.mods === undefined && <ModNotImplementedIcon />}
              </li>
            )),
          )}
        </ul>
      ) : (
        !hasMetaAffixes && (
          <p className="text-xs text-zinc-500 italic">No affixes</p>
        )
      )}
    </>
  );
};
