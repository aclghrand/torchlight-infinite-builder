import { Tooltip } from "@/src/components/ui/Tooltip";
import { useTooltip } from "@/src/hooks/useTooltip";
import { i18n } from "@/src/lib/i18n";
import { getGearAffixes } from "@/src/tli/calcs/affix-collectors";
import type { Gear } from "@/src/tli/core";
import { GearTooltipContent } from "./GearTooltipContent";

interface InventoryItemProps {
  item: Gear;
  isEquipped: boolean;
  onCopy: (itemId: string) => void;
  onEdit: (itemId: string) => void;
  onDelete: (id: string) => void;
}

export const InventoryItem: React.FC<InventoryItemProps> = ({
  item,
  isEquipped,
  onCopy,
  onEdit,
  onDelete,
}) => {
  const { isVisible, triggerRef, triggerRect } = useTooltip();

  const isLegendary = item.rarity === "legendary";

  return (
    <div
      className={`group relative flex items-center justify-between p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors border ${
        isLegendary ? "border-amber-500/50" : "border-transparent"
      }`}
      ref={triggerRef}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium text-zinc-50 text-sm">
          {i18n._(item.legendaryName ?? item.equipmentType)}
        </span>
        {isLegendary && (
          <span className="text-xs text-amber-400 font-medium">Legendary</span>
        )}
        <span className="text-xs text-zinc-500">
          ({getGearAffixes(item).length} affixes)
        </span>
        {isEquipped && (
          <span className="text-xs text-green-500 font-medium">Equipped</span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          // biome-ignore lint/style/noNonNullAssertion: inventory items always have id
          onClick={() => onCopy(item.id!)}
          className="rounded bg-amber-500 px-2 py-1 text-xs text-zinc-950 hover:bg-amber-600"
          title="Copy item"
        >
          Copy
        </button>
        {!isLegendary && (
          <button
            type="button"
            // biome-ignore lint/style/noNonNullAssertion: inventory items always have id
            onClick={() => onEdit(item.id!)}
            className="rounded bg-zinc-600 px-2 py-1 text-xs text-zinc-50 hover:bg-zinc-500"
            title="Edit item"
          >
            Edit
          </button>
        )}
        <button
          type="button"
          // biome-ignore lint/style/noNonNullAssertion: inventory items always have id
          onClick={() => onDelete(item.id!)}
          className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
          title="Delete item"
        >
          Delete
        </button>
      </div>

      <Tooltip
        isVisible={isVisible}
        triggerRect={triggerRect}
        variant={isLegendary ? "legendary" : "default"}
      >
        <GearTooltipContent item={item} />
      </Tooltip>
    </div>
  );
};
