"use client";

import { useState } from "react";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/src/app/components/ui/SearchableSelect";
import { MAX_SLATE_AFFIXES } from "@/src/app/lib/constants";
import {
  type DivinityAffix,
  GOD_BORDER_COLORS,
  GOD_COLORS,
  getDivinityAffixes,
} from "@/src/app/lib/divinity-utils";
import { generateItemId } from "@/src/app/lib/storage";
import {
  type Affix,
  DIVINITY_GODS,
  type DivinityGod,
  type DivinitySlate,
  ROTATIONS,
  type Rotation,
  SLATE_SHAPES,
  type SlateShape,
} from "@/src/tli/core";
import { SlatePreview } from "./SlatePreview";

const createMinimalAffix = (text: string): Affix => ({
  affixLines: text.split(/\n/).map((line) => ({ text: line })),
});

interface SlateCrafterProps {
  onSave: (slate: DivinitySlate) => void;
}

const createEmptySlots = (): (DivinityAffix | undefined)[] =>
  Array(MAX_SLATE_AFFIXES).fill(undefined);

export const SlateCrafter: React.FC<SlateCrafterProps> = ({ onSave }) => {
  const [god, setGod] = useState<DivinityGod>("Hunting");
  const [shape, setShape] = useState<SlateShape>("O");
  const [rotation, setRotation] = useState<Rotation>(0);
  const [flippedH, setFlippedH] = useState(false);
  const [flippedV, setFlippedV] = useState(false);
  const [affixSlots, setAffixSlots] =
    useState<(DivinityAffix | undefined)[]>(createEmptySlots);

  const availableAffixes = getDivinityAffixes(god);

  const getOptionsForSlot = (
    slotIndex: number,
  ): SearchableSelectOption<string>[] => {
    return availableAffixes
      .filter(
        (affix) =>
          !affixSlots.some(
            (a, i) => i !== slotIndex && a?.effect === affix.effect,
          ),
      )
      .map((affix) => ({
        value: affix.effect,
        label: affix.effect.split("\n").join(" / "),
        sublabel: affix.type === "Legendary Medium" ? "Legendary" : "Medium",
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  };

  const handleGodChange = (newGod: DivinityGod): void => {
    setGod(newGod);
    setAffixSlots(createEmptySlots());
  };

  const handleRotate = (): void => {
    const currentIndex = ROTATIONS.indexOf(rotation);
    const nextIndex = (currentIndex + 1) % ROTATIONS.length;
    setRotation(ROTATIONS[nextIndex]);
  };

  const handleSlotChange = (
    slotIndex: number,
    effectValue: string | undefined,
  ): void => {
    const newSlots = [...affixSlots];
    newSlots[slotIndex] =
      effectValue !== undefined
        ? availableAffixes.find((a) => a.effect === effectValue)
        : undefined;
    setAffixSlots(newSlots);
  };

  const handleClearSlot = (slotIndex: number): void => {
    const newSlots = [...affixSlots];
    newSlots[slotIndex] = undefined;
    setAffixSlots(newSlots);
  };

  const selectedAffixes = affixSlots.filter(
    (a): a is DivinityAffix => a !== undefined,
  );

  const handleSave = (): void => {
    const slate: DivinitySlate = {
      id: generateItemId(),
      god,
      shape,
      rotation,
      flippedH,
      flippedV,
      affixes: selectedAffixes.map((a) => createMinimalAffix(a.effect)),
      metaAffixes: [],
    };
    onSave(slate);

    setAffixSlots(createEmptySlots());
    setRotation(0);
    setFlippedH(false);
    setFlippedV(false);
  };

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
      <h3 className="mb-4 text-lg font-medium text-zinc-200">Craft Slate</h3>

      <div className="mb-4">
        <label className="mb-2 block text-sm text-zinc-400">God</label>
        <div className="flex flex-wrap gap-2">
          {DIVINITY_GODS.map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => handleGodChange(g)}
              className={`rounded px-3 py-1 text-sm transition-colors ${
                god === g
                  ? `${GOD_COLORS[g]} text-white`
                  : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm text-zinc-400">
          Shape & Orientation
        </label>
        <div className="flex gap-4 items-start">
          <div className="flex flex-col gap-2">
            {SLATE_SHAPES.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setShape(s)}
                className={`flex h-12 w-12 items-center justify-center rounded border-2 transition-colors ${
                  shape === s
                    ? `${GOD_BORDER_COLORS[god]} ${GOD_COLORS[god]}`
                    : "border-zinc-600 bg-zinc-700 hover:border-zinc-500"
                }`}
              >
                <SlatePreview shape={s} god={god} size="small" />
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex h-20 w-20 items-center justify-center rounded border border-zinc-600 bg-zinc-900">
              <SlatePreview
                shape={shape}
                god={god}
                rotation={rotation}
                flippedH={flippedH}
                flippedV={flippedV}
                size="large"
              />
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleRotate}
                className="rounded bg-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-600"
                title="Rotate 90°"
              >
                ↻
              </button>
              <button
                type="button"
                onClick={() => setFlippedH((v) => !v)}
                className={`rounded px-2 py-1 text-xs ${
                  flippedH
                    ? "bg-amber-600 text-white"
                    : "bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
                }`}
                title="Flip Horizontal"
              >
                ↔
              </button>
              <button
                type="button"
                onClick={() => setFlippedV((v) => !v)}
                className={`rounded px-2 py-1 text-xs ${
                  flippedV
                    ? "bg-amber-600 text-white"
                    : "bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
                }`}
                title="Flip Vertical"
              >
                ↕
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm text-zinc-400">
          Affixes ({selectedAffixes.length}/{MAX_SLATE_AFFIXES})
        </label>
        <div className="flex flex-col gap-2">
          {affixSlots.map((affix, slotIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: slots are fixed positions
            <div key={slotIndex} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 w-12">
                  Slot {slotIndex + 1}
                </span>
                <div className="flex-1">
                  <SearchableSelect
                    value={affix?.effect}
                    onChange={(value) => handleSlotChange(slotIndex, value)}
                    options={getOptionsForSlot(slotIndex)}
                    placeholder="Select affix..."
                  />
                </div>
                {affix !== undefined && (
                  <button
                    type="button"
                    onClick={() => handleClearSlot(slotIndex)}
                    className="text-zinc-400 hover:text-red-400 px-1"
                  >
                    ×
                  </button>
                )}
              </div>
              {affix !== undefined && (
                <div className="ml-14 flex items-center gap-2 text-xs text-zinc-400">
                  <span
                    className={`h-2 w-2 rounded-sm ${
                      affix.type === "Legendary Medium"
                        ? "bg-orange-500"
                        : "bg-purple-500"
                    }`}
                  />
                  <span className="truncate">
                    {affix.effect.split("\n")[0]}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={selectedAffixes.length === 0}
        className="w-full rounded bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-500 disabled:bg-zinc-600 disabled:cursor-not-allowed"
      >
        Save to Inventory
      </button>
    </div>
  );
};
