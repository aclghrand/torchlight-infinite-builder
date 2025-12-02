"use client";

import { useState } from "react";
import { CraftedPrism } from "@/src/app/lib/save-data";
import { PrismCrafter } from "./PrismCrafter";
import { PrismInventory } from "./PrismInventory";

interface PrismSectionProps {
  prisms: CraftedPrism[];
  onSave: (prism: CraftedPrism) => void;
  onUpdate: (prism: CraftedPrism) => void;
  onCopy: (prism: CraftedPrism) => void;
  onDelete: (prismId: string) => void;
}

export const PrismSection: React.FC<PrismSectionProps> = ({
  prisms,
  onSave,
  onUpdate,
  onCopy,
  onDelete,
}) => {
  const [editingPrism, setEditingPrism] = useState<CraftedPrism | undefined>(
    undefined,
  );

  const handleSave = (prism: CraftedPrism) => {
    if (editingPrism) {
      onUpdate(prism);
      setEditingPrism(undefined);
    } else {
      onSave(prism);
    }
  };

  const handleEdit = (prism: CraftedPrism) => {
    setEditingPrism(prism);
  };

  const handleCancel = () => {
    setEditingPrism(undefined);
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4 text-zinc-50">Prisms</h2>
      <div className="flex gap-4">
        <div className="flex-1">
          <PrismCrafter
            editingPrism={editingPrism}
            onSave={handleSave}
            onCancel={editingPrism ? handleCancel : undefined}
          />
        </div>
        <div className="flex-1">
          <PrismInventory
            prisms={prisms}
            onEdit={handleEdit}
            onCopy={onCopy}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
};
