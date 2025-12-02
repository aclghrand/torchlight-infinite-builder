"use client";

import { CraftedPrism } from "@/src/app/lib/save-data";
import { PrismInventoryItem } from "./PrismInventoryItem";

interface PrismInventoryProps {
  prisms: CraftedPrism[];
  onEdit: (prism: CraftedPrism) => void;
  onCopy: (prism: CraftedPrism) => void;
  onDelete: (prismId: string) => void;
}

export const PrismInventory: React.FC<PrismInventoryProps> = ({
  prisms,
  onEdit,
  onCopy,
  onDelete,
}) => {
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
      <h3 className="mb-4 text-lg font-medium text-zinc-200">
        Prism Inventory ({prisms.length})
      </h3>

      {prisms.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No prisms crafted yet. Create one using the crafter!
        </p>
      ) : (
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
          {prisms.map((prism) => (
            <PrismInventoryItem
              key={prism.id}
              prism={prism}
              onEdit={() => onEdit(prism)}
              onCopy={() => onCopy(prism)}
              onDelete={() => onDelete(prism.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
