"use client";

import { useState } from "react";
import { CraftedInverseImage } from "@/src/app/lib/save-data";
import { generateItemId } from "@/src/app/lib/storage";
import { validateInverseImageValues } from "@/src/app/lib/inverse-image-utils";

interface InverseImageCrafterInnerProps {
  editingInverseImage: CraftedInverseImage | undefined;
  onSave: (inverseImage: CraftedInverseImage) => void;
  onCancel?: () => void;
}

const InverseImageCrafterInner: React.FC<InverseImageCrafterInnerProps> = ({
  editingInverseImage,
  onSave,
  onCancel,
}) => {
  const [microEffect, setMicroEffect] = useState<number>(
    editingInverseImage?.microTalentEffect ?? 0,
  );
  const [mediumEffect, setMediumEffect] = useState<number>(
    editingInverseImage?.mediumTalentEffect ?? 0,
  );
  const [legendaryEffect, setLegendaryEffect] = useState<number>(
    editingInverseImage?.legendaryTalentEffect ?? 0,
  );

  const validation = validateInverseImageValues(
    microEffect,
    mediumEffect,
    legendaryEffect,
  );

  const handleSave = () => {
    if (!validation.valid) return;

    const inverseImage: CraftedInverseImage = {
      id: editingInverseImage?.id ?? generateItemId(),
      microTalentEffect: microEffect,
      mediumTalentEffect: mediumEffect,
      legendaryTalentEffect: legendaryEffect,
    };
    onSave(inverseImage);

    if (!editingInverseImage) {
      setMicroEffect(0);
      setMediumEffect(0);
      setLegendaryEffect(0);
    }
  };

  const formatModifier = (value: number): string => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value}%`;
  };

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
      <h3 className="mb-4 text-lg font-medium text-zinc-200">
        {editingInverseImage ? "Edit Inverse Image" : "Craft Inverse Image"}
      </h3>

      <div className="mb-4 rounded bg-cyan-500/10 border border-cyan-500/30 p-3">
        <p className="text-sm text-cyan-300 mb-2">
          Reflects all Talents within the range to the mirrored area. All
          Talents within the reflected area have no prerequisites.
        </p>
        <p className="text-xs text-zinc-400">
          The inverse image reflects a 3x3 source area to its centrally opposite
          3x3 target area. Source (x, y) reflects to target (6-x, 4-y).
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            All Reflected Micro Talent Effects ({formatModifier(microEffect)})
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">-100%</span>
            <input
              type="range"
              min={-100}
              max={200}
              step={1}
              value={microEffect}
              onChange={(e) => setMicroEffect(Number(e.target.value))}
              className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="text-xs text-zinc-500">+200%</span>
          </div>
          <input
            type="number"
            min={-100}
            max={200}
            value={microEffect}
            onChange={(e) => setMicroEffect(Number(e.target.value))}
            className="mt-2 w-24 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            All Reflected Medium Talent Effects ({formatModifier(mediumEffect)})
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">-100%</span>
            <input
              type="range"
              min={-100}
              max={100}
              step={1}
              value={mediumEffect}
              onChange={(e) => setMediumEffect(Number(e.target.value))}
              className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="text-xs text-zinc-500">+100%</span>
          </div>
          <input
            type="number"
            min={-100}
            max={100}
            value={mediumEffect}
            onChange={(e) => setMediumEffect(Number(e.target.value))}
            className="mt-2 w-24 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            All Reflected Legendary Medium Talent Effects (
            {formatModifier(legendaryEffect)})
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">-100%</span>
            <input
              type="range"
              min={-100}
              max={50}
              step={1}
              value={legendaryEffect}
              onChange={(e) => setLegendaryEffect(Number(e.target.value))}
              className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="text-xs text-zinc-500">+50%</span>
          </div>
          <input
            type="number"
            min={-100}
            max={50}
            value={legendaryEffect}
            onChange={(e) => setLegendaryEffect(Number(e.target.value))}
            className="mt-2 w-24 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-50"
          />
        </div>
      </div>

      {validation.errors.length > 0 && (
        <div className="mt-4 rounded bg-red-500/10 border border-red-500/30 p-2">
          {validation.errors.map((error, idx) => (
            <p key={idx} className="text-xs text-red-400">
              {error}
            </p>
          ))}
        </div>
      )}

      <div className="mt-4 rounded bg-zinc-900 p-3">
        <div className="text-sm text-zinc-400 mb-2">Placement Rules:</div>
        <ul className="text-xs text-zinc-500 space-y-1 ml-4 list-disc">
          <li>Can only be placed on Profession Trees (Slots 2-4)</li>
          <li>Cannot be placed in the center column (column 3)</li>
          <li>Can only be placed when the tree has 0 allocated points</li>
          <li>Cannot be placed if a Prism is already installed</li>
        </ul>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSave}
          disabled={!validation.valid}
          className="flex-1 rounded bg-cyan-600 px-4 py-2 text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-zinc-600"
        >
          {editingInverseImage ? "Update Inverse Image" : "Save to Inventory"}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded bg-zinc-700 px-4 py-2 text-zinc-200 transition-colors hover:bg-zinc-600"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

interface InverseImageCrafterProps {
  editingInverseImage: CraftedInverseImage | undefined;
  onSave: (inverseImage: CraftedInverseImage) => void;
  onCancel?: () => void;
}

// Wrapper component that uses key to force remount when editing a different inverse image
export const InverseImageCrafter: React.FC<InverseImageCrafterProps> = (
  props,
) => {
  return (
    <InverseImageCrafterInner
      key={props.editingInverseImage?.id ?? "new"}
      {...props}
    />
  );
};
