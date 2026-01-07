import { Tooltip, TooltipTitle } from "@/src/components/ui/Tooltip";
import { useTooltip } from "@/src/hooks/useTooltip";
import type { HeroMemory } from "@/src/tli/core";

interface HeroMemoryItemProps {
  memory: HeroMemory;
  isEquipped: boolean;
  onCopy: (memoryId: string) => void;
  onDelete: (id: string) => void;
}

export const HeroMemoryItem: React.FC<HeroMemoryItemProps> = ({
  memory,
  isEquipped,
  onCopy,
  onDelete,
}) => {
  const { isVisible, triggerRef, triggerRect, tooltipHandlers } = useTooltip();

  return (
    <div
      className="group relative flex items-center justify-between p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
      ref={triggerRef}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium text-zinc-50 text-sm">
          {memory.memoryType}
        </span>
        <span className="text-xs text-zinc-500">
          ({memory.affixes.length} affixes)
        </span>
        {isEquipped && (
          <span className="text-xs text-green-500 font-medium">Equipped</span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onCopy(memory.id)}
          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded text-xs"
          title="Copy memory"
        >
          Copy
        </button>
        <button
          type="button"
          onClick={() => onDelete(memory.id)}
          className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
          title="Delete memory"
        >
          Delete
        </button>
      </div>

      <Tooltip
        isVisible={isVisible}
        triggerRect={triggerRect}
        {...tooltipHandlers}
      >
        <TooltipTitle>{memory.memoryType}</TooltipTitle>
        {memory.affixes.length > 0 ? (
          <div>
            {memory.affixes.map((affix, affixIdx) => (
              <div
                key={affixIdx}
                className={
                  affixIdx > 0 ? "mt-2 pt-2 border-t border-zinc-500" : ""
                }
              >
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
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic">No affixes</p>
        )}
      </Tooltip>
    </div>
  );
};
