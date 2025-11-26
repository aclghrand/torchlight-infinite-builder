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
  return (
    <div className="group relative flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-700 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
          {item.equipmentType}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          ({item.affixes.length} affixes)
        </span>
        {isEquipped && (
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            Equipped
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onCopy(item)}
          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
          title="Copy item"
        >
          Copy
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
          title="Delete item"
        >
          Delete
        </button>
      </div>

      {/* Hover tooltip showing item details */}
      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-72 pointer-events-none">
        <div className="bg-zinc-900 dark:bg-zinc-950 text-white p-3 rounded-lg shadow-xl border border-zinc-700">
          <div className="font-semibold text-sm mb-2 text-blue-400">
            {item.equipmentType}
          </div>
          {item.affixes.length > 0 ? (
            <ul className="space-y-1">
              {item.affixes.map((affix, idx) => (
                <li key={idx} className="text-xs text-zinc-300">
                  {affix}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500 italic">No affixes</p>
          )}
        </div>
      </div>
    </div>
  );
};
