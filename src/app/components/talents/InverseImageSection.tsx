"use client";

import { useState } from "react";
import { CraftedInverseImage } from "@/src/app/lib/save-data";
import { InverseImageCrafter } from "./InverseImageCrafter";
import { InverseImageInventory } from "./InverseImageInventory";

interface InverseImageSectionProps {
  inverseImages: CraftedInverseImage[];
  onSave: (inverseImage: CraftedInverseImage) => void;
  onUpdate: (inverseImage: CraftedInverseImage) => void;
  onCopy: (inverseImage: CraftedInverseImage) => void;
  onDelete: (inverseImageId: string) => void;
  selectedInverseImageId?: string;
  onSelectInverseImage?: (inverseImageId: string | undefined) => void;
  hasInverseImagePlaced?: boolean;
  hasPrismPlaced?: boolean;
  isOnGodGoddessTree?: boolean;
  treeHasPoints?: boolean;
}

export const InverseImageSection: React.FC<InverseImageSectionProps> = ({
  inverseImages,
  onSave,
  onUpdate,
  onCopy,
  onDelete,
  selectedInverseImageId,
  onSelectInverseImage,
  hasInverseImagePlaced = false,
  hasPrismPlaced = false,
  isOnGodGoddessTree = false,
  treeHasPoints = false,
}) => {
  const [editingInverseImage, setEditingInverseImage] = useState<
    CraftedInverseImage | undefined
  >(undefined);

  const handleSave = (inverseImage: CraftedInverseImage) => {
    if (editingInverseImage) {
      onUpdate(inverseImage);
      setEditingInverseImage(undefined);
    } else {
      onSave(inverseImage);
    }
  };

  const handleEdit = (inverseImage: CraftedInverseImage) => {
    setEditingInverseImage(inverseImage);
  };

  const handleCancel = () => {
    setEditingInverseImage(undefined);
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4 text-zinc-50">Inverse Images</h2>
      <div className="flex gap-4">
        <div className="flex-1">
          <InverseImageCrafter
            editingInverseImage={editingInverseImage}
            onSave={handleSave}
            onCancel={editingInverseImage ? handleCancel : undefined}
          />
        </div>
        <div className="flex-1">
          <InverseImageInventory
            inverseImages={inverseImages}
            onEdit={handleEdit}
            onCopy={onCopy}
            onDelete={onDelete}
            selectedInverseImageId={selectedInverseImageId}
            onSelectInverseImage={onSelectInverseImage}
            hasInverseImagePlaced={hasInverseImagePlaced}
            hasPrismPlaced={hasPrismPlaced}
            isOnGodGoddessTree={isOnGodGoddessTree}
            treeHasPoints={treeHasPoints}
          />
        </div>
      </div>
    </div>
  );
};
