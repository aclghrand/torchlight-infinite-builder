import { useEffect, useMemo, useState } from "react";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/src/components/ui/SearchableSelect";
import { i18n } from "@/src/lib/i18n";
import {
  getBaseAffixes,
  getLegendaryGaugeAffixes,
  getMaxLegendaryGaugeAffixes,
  getMaxRareGaugeAffixes,
  getRareGaugeAffixes,
} from "@/src/lib/prism-utils";
import { generateItemId } from "@/src/lib/storage";
import {
  type CraftedPrism,
  PRISM_RARITIES,
  type PrismRarity,
} from "@/src/tli/core";

interface PrismCrafterProps {
  editingPrism: CraftedPrism | undefined;
  onSave: (prism: CraftedPrism) => void;
  onCancel?: () => void;
}

interface SelectedGaugeAffix {
  affix: string;
  isLegendary: boolean;
}

export const PrismCrafter: React.FC<PrismCrafterProps> = ({
  editingPrism,
  onSave,
  onCancel,
}) => {
  const [rarity, setRarity] = useState<PrismRarity>(
    editingPrism?.rarity ?? "rare",
  );
  const [baseAffix, setBaseAffix] = useState<string | undefined>(
    editingPrism?.baseAffix,
  );
  const [selectedGaugeAffixes, setSelectedGaugeAffixes] = useState<
    SelectedGaugeAffix[]
  >([]);

  useEffect(() => {
    if (editingPrism) {
      setRarity(editingPrism.rarity);
      setBaseAffix(editingPrism.baseAffix);

      const legendaryGauges = getLegendaryGaugeAffixes();

      const gaugeAffixes: SelectedGaugeAffix[] = editingPrism.gaugeAffixes.map(
        (affix) => ({
          affix,
          isLegendary: legendaryGauges.some((g) => g.affix === affix),
        }),
      );
      setSelectedGaugeAffixes(gaugeAffixes);
    } else {
      setSelectedGaugeAffixes([]);
      setBaseAffix(undefined);
    }
  }, [editingPrism]);

  const baseAffixOptions = useMemo((): SearchableSelectOption<string>[] => {
    return getBaseAffixes(rarity).map((affix) => ({
      value: affix.affix,
      label: affix.affix,
    }));
  }, [rarity]);

  const rareGaugeCount = selectedGaugeAffixes.filter(
    (a) => !a.isLegendary,
  ).length;
  const legendaryGaugeCount = selectedGaugeAffixes.filter(
    (a) => a.isLegendary,
  ).length;

  const maxRare = getMaxRareGaugeAffixes();
  const maxLegendary = getMaxLegendaryGaugeAffixes(rarity);

  const rareGaugeOptions = useMemo((): SearchableSelectOption<string>[] => {
    if (rareGaugeCount >= maxRare) return [];
    return getRareGaugeAffixes().map((affix) => ({
      value: affix.affix,
      label: affix.affix.split("\n")[0],
      sublabel: "Rare",
    }));
  }, [rareGaugeCount, maxRare]);

  const legendaryGaugeOptions =
    useMemo((): SearchableSelectOption<string>[] => {
      if (legendaryGaugeCount >= maxLegendary) return [];
      return getLegendaryGaugeAffixes().map((affix) => ({
        value: affix.affix,
        label: affix.affix.split("\n")[0],
        sublabel: "Legendary",
      }));
    }, [legendaryGaugeCount, maxLegendary]);

  const handleRarityChange = (newRarity: PrismRarity) => {
    if (newRarity === rarity) return;
    setRarity(newRarity);
    setBaseAffix(undefined);
    if (newRarity === "rare") {
      setSelectedGaugeAffixes((prev) => prev.filter((a) => !a.isLegendary));
    }
  };

  const handleAddGaugeAffix = (
    affixValue: string | undefined,
    isLegendary: boolean,
  ) => {
    if (!affixValue) return;
    setSelectedGaugeAffixes([
      ...selectedGaugeAffixes,
      { affix: affixValue, isLegendary },
    ]);
  };

  const handleRemoveGaugeAffix = (index: number) => {
    setSelectedGaugeAffixes(selectedGaugeAffixes.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!baseAffix) return;

    const prism: CraftedPrism = {
      id: editingPrism?.id ?? generateItemId(),
      rarity,
      baseAffix,
      gaugeAffixes: selectedGaugeAffixes.map((a) => a.affix),
    };
    onSave(prism);

    if (!editingPrism) {
      setSelectedGaugeAffixes([]);
      setBaseAffix(undefined);
    }
  };

  const canSave = baseAffix !== undefined;

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
      <h3 className="mb-4 text-lg font-medium text-zinc-200">
        {editingPrism ? i18n._("Edit Prism") : i18n._("Craft Prism")}
      </h3>

      <div className="mb-4">
        <label className="mb-2 block text-sm text-zinc-400">Rarity</label>
        <div className="flex gap-2">
          {PRISM_RARITIES.map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => handleRarityChange(r)}
              className={`rounded px-3 py-1 text-sm capitalize transition-colors ${
                rarity === r
                  ? r === "legendary"
                    ? "bg-orange-600 text-white"
                    : "bg-purple-600 text-white"
                  : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm text-zinc-400">Base Affix</label>
        <SearchableSelect
          value={baseAffix}
          onChange={setBaseAffix}
          options={baseAffixOptions}
          placeholder="Select base affix..."
        />
        {baseAffix && (
          <div className="mt-2 rounded bg-zinc-900 p-2 text-xs text-zinc-300 whitespace-pre-line">
            {baseAffix}
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm text-zinc-400">
          Gauge Affixes ({selectedGaugeAffixes.length}/{maxRare + maxLegendary})
        </label>
        <div className="mb-2 flex flex-col gap-1">
          {selectedGaugeAffixes.map((gauge, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded bg-zinc-700 px-2 py-1"
            >
              <span
                className={`h-3 w-3 rounded-sm ${
                  gauge.isLegendary ? "bg-orange-500" : "bg-purple-500"
                }`}
              />
              <span className="flex-1 text-sm text-zinc-200 truncate">
                {gauge.affix.split("\n")[0]}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveGaugeAffix(index)}
                className="text-zinc-400 hover:text-red-400"
              >
                ×
              </button>
            </div>
          ))}
          {selectedGaugeAffixes.length === 0 && (
            <p className="text-sm text-zinc-500">No gauge affixes selected</p>
          )}
        </div>
      </div>

      {rareGaugeCount < maxRare && (
        <div className="mb-4">
          <label className="mb-2 block text-sm text-zinc-400">
            Add Rare Gauge ({rareGaugeCount}/{maxRare})
          </label>
          <SearchableSelect
            value={undefined}
            onChange={(v) => handleAddGaugeAffix(v, false)}
            options={rareGaugeOptions}
            placeholder="Search rare gauge affixes..."
          />
        </div>
      )}

      {rarity === "legendary" && legendaryGaugeCount < maxLegendary && (
        <div className="mb-4">
          <label className="mb-2 block text-sm text-zinc-400">
            Add Legendary Gauge ({legendaryGaugeCount}/{maxLegendary})
          </label>
          <SearchableSelect
            value={undefined}
            onChange={(v) => handleAddGaugeAffix(v, true)}
            options={legendaryGaugeOptions}
            placeholder="Search legendary gauge affixes..."
          />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="flex-1 rounded bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-zinc-600"
        >
          {editingPrism ? "Update Prism" : "Save to Inventory"}
        </button>
        {onCancel && (
          <button
            type="button"
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
