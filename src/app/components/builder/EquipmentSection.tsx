"use client";

import { useMemo, useCallback } from "react";
import { useBuilderStore } from "../../stores/builderStore";
import { useEquipmentUIStore } from "../../stores/equipmentUIStore";
import { EquipmentSlotDropdown } from "../equipment/EquipmentSlotDropdown";
import { AffixSlotComponent } from "../equipment/AffixSlotComponent";
import { InventoryItem } from "../equipment/InventoryItem";
import { LegendaryGearModule } from "../equipment/LegendaryGearModule";
import { GEAR_SLOTS } from "../../lib/constants";
import { GearSlot } from "../../lib/types";
import { getFilteredAffixes } from "../../lib/affix-utils";
import {
  getValidEquipmentTypes,
  getCompatibleItems,
  getGearTypeFromEquipmentType,
} from "../../lib/equipment-utils";
import { craft } from "@/src/tli/crafting/craft";
import { Gear } from "../../lib/save-data";
import { EquipmentType } from "@/src/tli/gear_data_types";
import { generateItemId } from "../../lib/storage";

export const EquipmentSection = () => {
  // Builder store - loadout data
  const loadout = useBuilderStore((state) => state.loadout);
  const addItemToInventory = useBuilderStore(
    (state) => state.addItemToInventory,
  );
  const copyItem = useBuilderStore((state) => state.copyItem);
  const deleteItem = useBuilderStore((state) => state.deleteItem);
  const selectItemForSlot = useBuilderStore((state) => state.selectItemForSlot);
  const isItemEquipped = useBuilderStore((state) => state.isItemEquipped);

  // Equipment UI store - crafting state
  const selectedEquipmentType = useEquipmentUIStore(
    (state) => state.selectedEquipmentType,
  );
  const affixSlots = useEquipmentUIStore((state) => state.affixSlots);
  const setSelectedEquipmentType = useEquipmentUIStore(
    (state) => state.setSelectedEquipmentType,
  );
  const setAffixSlot = useEquipmentUIStore((state) => state.setAffixSlot);
  const clearAffixSlot = useEquipmentUIStore((state) => state.clearAffixSlot);
  const resetCrafting = useEquipmentUIStore((state) => state.resetCrafting);

  const prefixAffixes = useMemo(
    () =>
      selectedEquipmentType
        ? getFilteredAffixes(selectedEquipmentType, "Prefix")
        : [],
    [selectedEquipmentType],
  );

  const suffixAffixes = useMemo(
    () =>
      selectedEquipmentType
        ? getFilteredAffixes(selectedEquipmentType, "Suffix")
        : [],
    [selectedEquipmentType],
  );

  const allEquipmentTypes = useMemo(() => {
    return getValidEquipmentTypes("mainHand")
      .concat(getValidEquipmentTypes("helmet"))
      .concat(getValidEquipmentTypes("chest"))
      .concat(getValidEquipmentTypes("gloves"))
      .concat(getValidEquipmentTypes("boots"))
      .concat(getValidEquipmentTypes("belt"))
      .concat(getValidEquipmentTypes("neck"))
      .concat(getValidEquipmentTypes("leftRing"))
      .concat(getValidEquipmentTypes("offHand"))
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
  }, []);

  const handleEquipmentTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value as EquipmentType;
      setSelectedEquipmentType(newType || undefined);
    },
    [setSelectedEquipmentType],
  );

  const handleAffixSelect = useCallback(
    (slotIndex: number, value: string) => {
      const affixIndex = value === "" ? null : parseInt(value);
      setAffixSlot(slotIndex, {
        affixIndex,
        percentage: affixIndex === null ? 50 : affixSlots[slotIndex].percentage,
      });
    },
    [setAffixSlot, affixSlots],
  );

  const handleSliderChange = useCallback(
    (slotIndex: number, value: string) => {
      const percentage = parseInt(value);
      setAffixSlot(slotIndex, { percentage });
    },
    [setAffixSlot],
  );

  const handleClearAffix = useCallback(
    (slotIndex: number) => {
      clearAffixSlot(slotIndex);
    },
    [clearAffixSlot],
  );

  const handleSaveToInventory = useCallback(() => {
    if (!selectedEquipmentType) return;

    const affixes: string[] = [];
    affixSlots.forEach((selection, idx) => {
      if (selection.affixIndex === null) return;
      const affixType = idx < 3 ? "Prefix" : "Suffix";
      const filteredAffixes =
        affixType === "Prefix" ? prefixAffixes : suffixAffixes;
      const selectedAffix = filteredAffixes[selection.affixIndex];
      affixes.push(craft(selectedAffix, selection.percentage));
    });

    const newItem: Gear = {
      id: generateItemId(),
      gearType: getGearTypeFromEquipmentType(selectedEquipmentType),
      affixes,
      equipmentType: selectedEquipmentType,
    };

    addItemToInventory(newItem);
    resetCrafting();
  }, [
    selectedEquipmentType,
    affixSlots,
    prefixAffixes,
    suffixAffixes,
    addItemToInventory,
    resetCrafting,
  ]);

  const handleSelectItemForSlot = useCallback(
    (slot: GearSlot, itemId: string | null) => {
      selectItemForSlot(slot, itemId ?? undefined);
    },
    [selectItemForSlot],
  );

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      deleteItem(itemId);
    },
    [deleteItem],
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-6">
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">
          Equipment Slots
        </h2>
        <div className="space-y-1">
          {GEAR_SLOTS.map(({ key, label }) => (
            <EquipmentSlotDropdown
              key={key}
              slot={key}
              label={label}
              selectedItemId={loadout.equipmentPage[key]?.id || null}
              compatibleItems={getCompatibleItems(loadout.itemsList, key)}
              onSelectItem={handleSelectItemForSlot}
            />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-semibold text-zinc-50">
            Craft New Item
          </h2>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-zinc-50">
              Equipment Type
            </label>
            <select
              value={selectedEquipmentType || ""}
              onChange={handleEquipmentTypeChange}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-50 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              <option value="">Select equipment type...</option>
              {allEquipmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {selectedEquipmentType ? (
            <>
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-zinc-50">
                  Prefixes (3 max)
                </h3>
                <div className="space-y-4">
                  {[0, 1, 2].map((slotIndex) => (
                    <AffixSlotComponent
                      key={slotIndex}
                      slotIndex={slotIndex}
                      affixType="Prefix"
                      affixes={prefixAffixes}
                      selection={affixSlots[slotIndex]}
                      onAffixSelect={handleAffixSelect}
                      onSliderChange={handleSliderChange}
                      onClear={handleClearAffix}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-zinc-50">
                  Suffixes (3 max)
                </h3>
                <div className="space-y-4">
                  {[3, 4, 5].map((slotIndex) => (
                    <AffixSlotComponent
                      key={slotIndex}
                      slotIndex={slotIndex}
                      affixType="Suffix"
                      affixes={suffixAffixes}
                      selection={affixSlots[slotIndex]}
                      onAffixSelect={handleAffixSelect}
                      onSliderChange={handleSliderChange}
                      onClear={handleClearAffix}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveToInventory}
                className="w-full rounded-lg bg-amber-500 px-4 py-3 font-semibold text-zinc-950 transition-colors hover:bg-amber-600"
              >
                Save to Inventory
              </button>
            </>
          ) : (
            <p className="py-8 text-center italic text-zinc-500">
              Select an equipment type to begin crafting
            </p>
          )}
        </div>

        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-semibold text-zinc-50">
            Inventory ({loadout.itemsList.length} items)
          </h2>
          {loadout.itemsList.length === 0 ? (
            <p className="py-4 text-center italic text-zinc-500">
              No items in inventory. Craft items above to add them here.
            </p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {loadout.itemsList.map((item) => (
                <InventoryItem
                  key={item.id}
                  item={item}
                  isEquipped={isItemEquipped(item.id)}
                  onCopy={copyItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          )}
        </div>

        <LegendaryGearModule onSaveToInventory={addItemToInventory} />
      </div>
    </div>
  );
};
