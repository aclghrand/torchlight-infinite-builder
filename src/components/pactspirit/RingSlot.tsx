import {
  Tooltip,
  TooltipContent,
  TooltipTitle,
} from "@/src/components/ui/Tooltip";
import { useTooltip } from "@/src/hooks/useTooltip";
import type { Affix, RingSlotState } from "@/src/tli/core";
import { isInnerRing } from "../../lib/pactspirit-utils";
import type { RingSlotKey } from "../../lib/types";

interface RingSlotProps {
  ringSlot: RingSlotKey;
  ringState: RingSlotState;
  onInstallClick: () => void;
  onRevert: () => void;
}

export const RingSlot: React.FC<RingSlotProps> = ({
  ringSlot,
  ringState,
  onInstallClick,
  onRevert,
}) => {
  const { isVisible, triggerRef, triggerRect, tooltipHandlers } = useTooltip();

  const hasDestiny = !!ringState.installedDestiny;
  const isInner = isInnerRing(ringSlot);

  let displayName: string;
  let displayAffix: Affix;
  let destinyType: string | undefined;

  if (hasDestiny && ringState.installedDestiny) {
    const {
      destinyName,
      destinyType: dType,
      affix,
    } = ringState.installedDestiny;
    destinyType = dType;
    displayName = destinyName;
    displayAffix = affix;
  } else {
    displayName = ringState.originalRingName;
    displayAffix = ringState.originalAffix;
  }

  return (
    <div
      className={`p-2 rounded-lg border ${
        isInner
          ? "bg-zinc-800 border-zinc-700"
          : "bg-zinc-750 border-amber-700/50"
      }`}
      ref={triggerRef}
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

      <Tooltip
        isVisible={isVisible}
        triggerRect={triggerRect}
        {...tooltipHandlers}
      >
        <TooltipTitle>
          {hasDestiny && destinyType
            ? `${destinyType}: ${displayName}`
            : displayName}
        </TooltipTitle>
        <TooltipContent>
          <div>
            {displayAffix.affixLines.map((line, lineIdx) => (
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
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
