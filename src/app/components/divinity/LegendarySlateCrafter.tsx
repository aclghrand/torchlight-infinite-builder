"use client";

import { useMemo, useState } from "react";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/src/app/components/ui/SearchableSelect";
import {
  LEGENDARY_SLATE_BORDER,
  LEGENDARY_SLATE_COLOR,
  LEGENDARY_SLATE_TEXT,
} from "@/src/app/lib/divinity-utils";
import {
  filterAffixesByTypes,
  getAffixDisplayText,
  getAllLegendaryAffixes,
  type LegendaryAffix,
} from "@/src/app/lib/legendary-affix-utils";
import {
  type CopyDirection,
  LEGENDARY_SLATE_KEYS,
  LEGENDARY_SLATE_TEMPLATES,
  type LegendarySlateTemplate,
} from "@/src/app/lib/legendary-slate-templates";
import { generateItemId } from "@/src/app/lib/storage";
import {
  type Affix,
  type DivinityAffixType,
  type DivinitySlate,
  ROTATIONS,
  type Rotation,
} from "@/src/tli/core";
import { SlatePreview } from "./SlatePreview";

const createMinimalAffix = (text: string): Affix => ({
  affixLines: text.split(/\n/).map((line) => ({ text: line })),
});

const DIRECTION_LABELS: Record<CopyDirection, string> = {
  up: "Above",
  down: "Below",
  left: "Left",
  right: "Right",
};

interface LegendarySlateCrafterProps {
  onSave: (slate: DivinitySlate) => void;
}

export const LegendarySlateCrafter: React.FC<LegendarySlateCrafterProps> = ({
  onSave,
}) => {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<
    string | undefined
  >(undefined);
  const [selectedDirection, setSelectedDirection] =
    useState<CopyDirection>("up");
  const [affixSlots, setAffixSlots] = useState<(LegendaryAffix | undefined)[]>(
    [],
  );
  const [rotation, setRotation] = useState<Rotation>(0);
  const [flippedH, setFlippedH] = useState(false);
  const [flippedV, setFlippedV] = useState(false);

  const template: LegendarySlateTemplate | undefined =
    selectedTemplateKey !== undefined
      ? LEGENDARY_SLATE_TEMPLATES[selectedTemplateKey]
      : undefined;

  const allAffixes = useMemo(() => getAllLegendaryAffixes(), []);

  const getOptionsForSlot = (
    slotIndex: number,
  ): SearchableSelectOption<string>[] => {
    if (template === undefined) return [];
    const constraint = template.affixSlots[slotIndex];
    if (constraint === undefined) return [];

    const filtered = filterAffixesByTypes(allAffixes, constraint.allowedTypes);

    return filtered
      .filter(
        (affix) =>
          !affixSlots.some(
            (a, i) => i !== slotIndex && a?.effect === affix.effect,
          ),
      )
      .map((affix) => ({
        value: affix.effect,
        label:
          affix.isCoreTalent && affix.displayName !== undefined
            ? affix.displayName
            : affix.effect.split("\n").join(" / "),
        sublabel: affix.type,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  };

  const handleTemplateChange = (templateKey: string): void => {
    const tmpl = LEGENDARY_SLATE_TEMPLATES[templateKey];
    setSelectedTemplateKey(templateKey);
    setAffixSlots(Array(tmpl.affixSlots.length).fill(undefined));
    setRotation(0);
    setFlippedH(false);
    setFlippedV(false);
    setSelectedDirection("up");
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
        ? allAffixes.find((a) => a.effect === effectValue)
        : undefined;
    setAffixSlots(newSlots);
  };

  const handleClearSlot = (slotIndex: number): void => {
    const newSlots = [...affixSlots];
    newSlots[slotIndex] = undefined;
    setAffixSlots(newSlots);
  };

  const selectedAffixes = affixSlots.filter(
    (a): a is LegendaryAffix => a !== undefined,
  );

  const hasFixedAffixes =
    template?.fixedAffixes !== undefined && template.fixedAffixes.length > 0;
  const hasCopyDirection =
    template?.fixedAffixes?.some((fa) => fa.direction !== undefined) ?? false;

  const getFixedAffixText = (): string => {
    if (template?.fixedAffixes === undefined) return "";
    if (hasCopyDirection) {
      const affix = template.fixedAffixes.find(
        (fa) => fa.direction === selectedDirection,
      );
      return affix?.text ?? "";
    }
    return template.fixedAffixes[0]?.text ?? "";
  };

  const canSave = (): boolean => {
    if (template === undefined) return false;
    if (hasFixedAffixes) return true;
    return selectedAffixes.length > 0;
  };

  const handleSave = (): void => {
    if (template === undefined) return;

    // Copy slates store the fixed affix text as metaAffixes (not regular affixes)
    // The actual copied affixes will be populated at load time based on adjacent slates
    const affixes: Affix[] = hasFixedAffixes
      ? []
      : selectedAffixes.map((a) =>
          createMinimalAffix(
            a.isCoreTalent && a.displayName !== undefined
              ? a.displayName
              : a.effect,
          ),
        );

    const metaAffixes: string[] = hasFixedAffixes ? [getFixedAffixText()] : [];

    const slate: DivinitySlate = {
      id: generateItemId(),
      god: undefined,
      shape: template.shape,
      rotation: template.canRotate ? rotation : 0,
      flippedH: template.canFlip ? flippedH : false,
      flippedV: template.canFlip ? flippedV : false,
      affixes,
      metaAffixes,
      isLegendary: true,
      legendaryName: template.displayName,
    };

    onSave(slate);

    setSelectedTemplateKey(undefined);
    setAffixSlots([]);
    setRotation(0);
    setFlippedH(false);
    setFlippedV(false);
    setSelectedDirection("up");
  };

  const getAffixTypeColor = (type: DivinityAffixType): string => {
    switch (type) {
      case "Core":
        return "bg-yellow-500";
      case "Legendary Medium":
        return "bg-orange-500";
      case "Medium":
        return "bg-purple-500";
      case "Micro":
        return "bg-blue-500";
    }
  };

  return (
    <div
      className={`rounded-lg border ${LEGENDARY_SLATE_BORDER} bg-zinc-800 p-4`}
    >
      <h3 className={`mb-4 text-lg font-medium ${LEGENDARY_SLATE_TEXT}`}>
        Craft Legendary Slate
      </h3>

      {/* Template Selection */}
      <div className="mb-4">
        <label className="mb-2 block text-sm text-zinc-400">
          Legendary Template
        </label>
        <div className="flex flex-col gap-2">
          {LEGENDARY_SLATE_KEYS.map((key) => {
            const tmpl = LEGENDARY_SLATE_TEMPLATES[key];
            return (
              <button
                type="button"
                key={key}
                onClick={() => handleTemplateChange(key)}
                className={`rounded px-3 py-2 text-sm text-left transition-colors ${
                  selectedTemplateKey === key
                    ? `${LEGENDARY_SLATE_COLOR} text-white`
                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                }`}
              >
                <div className="font-medium">{tmpl.displayName}</div>
                {tmpl.description !== undefined && (
                  <div className="text-xs text-zinc-400 mt-0.5">
                    {tmpl.description}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {template !== undefined && (
        <>
          {/* Shape Preview with Rotation/Flip Controls */}
          <div className="mb-4">
            <label className="mb-2 block text-sm text-zinc-400">
              Shape & Orientation
            </label>
            <div className="flex gap-4 items-start">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded border ${LEGENDARY_SLATE_BORDER} bg-zinc-900`}
              >
                <SlatePreview
                  shape={template.shape}
                  rotation={rotation}
                  flippedH={flippedH}
                  flippedV={flippedV}
                  size="large"
                  isLegendary
                />
              </div>
              {(template.canRotate || template.canFlip) && (
                <div className="flex flex-col gap-1">
                  {template.canRotate && (
                    <button
                      type="button"
                      onClick={handleRotate}
                      className="rounded bg-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-600"
                      title="Rotate 90°"
                    >
                      ↻ Rotate
                    </button>
                  )}
                  {template.canFlip && (
                    <>
                      <button
                        type="button"
                        onClick={() => setFlippedH((v) => !v)}
                        className={`rounded px-2 py-1 text-xs ${
                          flippedH
                            ? "bg-orange-600 text-white"
                            : "bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
                        }`}
                        title="Flip Horizontal"
                      >
                        ↔ Flip H
                      </button>
                      <button
                        type="button"
                        onClick={() => setFlippedV((v) => !v)}
                        className={`rounded px-2 py-1 text-xs ${
                          flippedV
                            ? "bg-orange-600 text-white"
                            : "bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
                        }`}
                        title="Flip Vertical"
                      >
                        ↕ Flip V
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Direction Selection for copy slates */}
          {hasCopyDirection && (
            <div className="mb-4">
              <label className="mb-2 block text-sm text-zinc-400">
                Copy Direction
              </label>
              <div className="flex flex-wrap gap-2">
                {(["up", "left", "down", "right"] as CopyDirection[]).map(
                  (dir) => (
                    <button
                      type="button"
                      key={dir}
                      onClick={() => setSelectedDirection(dir)}
                      className={`rounded px-3 py-1 text-sm transition-colors ${
                        selectedDirection === dir
                          ? `${LEGENDARY_SLATE_COLOR} text-white`
                          : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                      }`}
                    >
                      {DIRECTION_LABELS[dir]}
                    </button>
                  ),
                )}
              </div>
              <div className="mt-2 rounded bg-zinc-700 p-2 text-xs text-zinc-300">
                {getFixedAffixText()}
              </div>
            </div>
          )}

          {/* Fixed affix display (non-copy) */}
          {hasFixedAffixes && !hasCopyDirection && (
            <div className="mb-4">
              <label className="mb-2 block text-sm text-zinc-400">
                Fixed Affix
              </label>
              <div className="rounded bg-zinc-700 p-2 text-sm text-zinc-300">
                {getFixedAffixText()}
              </div>
            </div>
          )}

          {/* Affix Selection for non-fixed slates */}
          {!hasFixedAffixes && (
            <div className="mb-4">
              <label className="mb-2 block text-sm text-zinc-400">
                Affixes ({selectedAffixes.length}/{template.affixSlots.length})
              </label>
              <div className="flex flex-col gap-2">
                {affixSlots.map((affix, slotIndex) => {
                  const constraint = template.affixSlots[slotIndex];
                  return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: slots are fixed positions
                    <div key={slotIndex} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 w-24 truncate">
                          {constraint.label}
                        </span>
                        <div className="flex-1">
                          <SearchableSelect
                            value={affix?.effect}
                            onChange={(value) =>
                              handleSlotChange(slotIndex, value)
                            }
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
                        <div className="ml-26 flex items-center gap-2 text-xs text-zinc-400">
                          <span
                            className={`h-2 w-2 rounded-sm ${getAffixTypeColor(affix.type)}`}
                          />
                          <span className="truncate">
                            {getAffixDisplayText(affix)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave()}
            className={`w-full rounded ${LEGENDARY_SLATE_COLOR} px-4 py-2 text-white transition-colors hover:bg-orange-500 disabled:bg-zinc-600 disabled:cursor-not-allowed`}
          >
            Save to Inventory
          </button>
        </>
      )}
    </div>
  );
};
