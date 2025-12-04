"use client";

import { CraftedInverseImage } from "@/src/app/lib/save-data";
import { InverseImageInventoryItem } from "./InverseImageInventoryItem";

interface InverseImageInventoryProps {
  inverseImages: CraftedInverseImage[];
  onEdit: (inverseImage: CraftedInverseImage) => void;
  onCopy: (inverseImage: CraftedInverseImage) => void;
  onDelete: (inverseImageId: string) => void;
  selectedInverseImageId?: string;
  onSelectInverseImage?: (inverseImageId: string | undefined) => void;
  hasInverseImagePlaced?: boolean;
  hasPrismPlaced?: boolean;
  isOnGodGoddessTree?: boolean;
  treeHasPoints?: boolean;
}

export const InverseImageInventory: React.FC<InverseImageInventoryProps> = ({
  inverseImages,
  onEdit,
  onCopy,
  onDelete,
  selectedInverseImageId,
  onSelectInverseImage,
  hasInverseImagePlaced = false,
  hasPrismPlaced = false,
  isOnGodGoddessTree = false,
  treeHasPoints = false,
}) => {
  const selectionMode = !!onSelectInverseImage;

  const handleSelect = (inverseImageId: string) => {
    if (!onSelectInverseImage) return;
    if (selectedInverseImageId === inverseImageId) {
      onSelectInverseImage(undefined);
    } else {
      onSelectInverseImage(inverseImageId);
    }
  };

  const getStatusMessage = (): string => {
    if (hasInverseImagePlaced) {
      return "An inverse image is already placed. Remove it first to place a different one.";
    }
    if (hasPrismPlaced) {
      return "A prism is already placed. Remove it first to place an inverse image.";
    }
    if (selectedInverseImageId) {
      if (isOnGodGoddessTree) {
        return "Switch to a Profession Tree (Slots 2-4) to place the inverse image.";
      }
      if (treeHasPoints) {
        return "Reset the tree's points to 0 before placing an inverse image.";
      }
      return "Click on an empty talent node (not in center column) to place the inverse image, or click it again to deselect.";
    }
    return "Click an inverse image to select it for placement.";
  };

  const canSelect =
    !hasInverseImagePlaced && !hasPrismPlaced && selectionMode;

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
      <h3 className="mb-4 text-lg font-medium text-zinc-200">
        Inverse Image Inventory ({inverseImages.length})
      </h3>

      {selectionMode && (
        <div className="mb-3 p-2 rounded bg-cyan-500/10 border border-cyan-500/30">
          <p className="text-sm text-cyan-300">{getStatusMessage()}</p>
        </div>
      )}

      {inverseImages.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No inverse images crafted yet. Create one using the crafter!
        </p>
      ) : (
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
          {inverseImages.map((inverseImage) => (
            <InverseImageInventoryItem
              key={inverseImage.id}
              inverseImage={inverseImage}
              onEdit={() => onEdit(inverseImage)}
              onCopy={() => onCopy(inverseImage)}
              onDelete={() => onDelete(inverseImage.id)}
              isSelected={selectedInverseImageId === inverseImage.id}
              onSelect={
                canSelect ? () => handleSelect(inverseImage.id) : undefined
              }
              selectionMode={canSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};
