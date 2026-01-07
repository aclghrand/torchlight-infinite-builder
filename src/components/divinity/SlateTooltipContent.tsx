import { TooltipTitle } from "@/src/components/ui/Tooltip";
import { getSlateDisplayName } from "@/src/lib/divinity-utils";
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
            <li key={`meta-${idx}`} className="text-xs text-zinc-500 italic">
              {metaAffix}
            </li>
          ))}
        </ul>
      )}

      {/* Separator between meta affixes and regular affixes */}
      {hasMetaAffixes && hasAffixes && <hr className="border-zinc-600 my-2" />}

      {/* Regular affixes */}
      {hasAffixes ? (
        <div>
          {slate.affixes.map((affix, affixIdx) => (
            <div
              key={affixIdx}
              className={
                affixIdx > 0 ? "mt-2 pt-2 border-t border-zinc-500" : ""
              }
            >
              {affix.specialName !== undefined && (
                <div className="text-xs font-semibold text-amber-400 mb-0.5">
                  [{affix.specialName}]
                </div>
              )}
              {affix.affixLines.map((line, lineIdx) => (
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
              {affix.maxDivinity !== undefined && (
                <div className="text-xs text-zinc-500">
                  (Max Divinity Effect: {affix.maxDivinity})
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !hasMetaAffixes && (
          <p className="text-xs text-zinc-500 italic">No affixes</p>
        )
      )}
    </>
  );
};
