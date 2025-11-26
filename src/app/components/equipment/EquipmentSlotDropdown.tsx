import { RawGear } from "@/src/tli/core";
import { GearSlot } from "../../lib/types";

interface EquipmentSlotDropdownProps {
  slot: GearSlot;
  label: string;
  selectedItemId: string | null;
  compatibleItems: RawGear[];
  onSelectItem: (slot: GearSlot, itemId: string | null) => void;
}

export const EquipmentSlotDropdown: React.FC<EquipmentSlotDropdownProps> = ({
  slot,
  label,
  selectedItemId,
  compatibleItems,
  onSelectItem,
}) => {
  const getItemTooltip = (item: RawGear): string => {
    const lines = [`${item.equipmentType || item.gearType}`];
    if (item.affixes.length > 0) {
      lines.push("---");
      item.affixes.forEach((affix) => lines.push(affix));
    }
    return lines.join("\n");
  };

  return (
    <div className="flex items-center gap-3 py-2">
      <label className="w-24 font-medium text-zinc-700 dark:text-zinc-300 text-sm">
        {label}:
      </label>
      <select
        value={selectedItemId || ""}
        onChange={(e) => onSelectItem(slot, e.target.value || null)}
        className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">-- None --</option>
        {compatibleItems.map((item) => (
          <option key={item.id} value={item.id} title={getItemTooltip(item)}>
            {item.equipmentType} ({item.affixes.length} affixes)
          </option>
        ))}
      </select>
    </div>
  );
};
