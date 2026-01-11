import { i18n } from "@lingui/core";
import { Trans } from "@lingui/react/macro";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { craft } from "@/src/tli/crafting/craft";
import type { BaseGearAffix, EquipmentType } from "@/src/tli/gear-data-types";
import { AffixSlotComponent } from "../../components/equipment/AffixSlotComponent";
import { EditGearModal } from "../../components/equipment/EditGearModal";
import { EquipmentSlotDropdown } from "../../components/equipment/EquipmentSlotDropdown";
import { InventoryItem } from "../../components/equipment/InventoryItem";
import { LegendaryGearModule } from "../../components/equipment/LegendaryGearModule";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { getFilteredAffixes } from "../../lib/affix-utils";
import {
  formatBlendAffix,
  formatBlendOption,
  formatBlendPreview,
  getBlendAffixes,
} from "../../lib/blend-utils";
import { GEAR_SLOTS, SLOT_TO_VALID_EQUIPMENT_TYPES } from "../../lib/constants";
import { getCompatibleItems } from "../../lib/equipment-utils";
import type { Gear as SaveDataGear } from "../../lib/save-data";
import { generateItemId } from "../../lib/storage";
import type { GearSlot } from "../../lib/types";
import { useBuilderActions, useLoadout } from "../../stores/builderStore";
import { useEquipmentUIStore } from "../../stores/equipmentUIStore";

export const Route = createFileRoute("/builder/equipment")({
  component: EquipmentPage,
});

function EquipmentPage(): React.ReactNode {
  // Parsed loadout (for reads)
  const loadout = useLoadout();
  const {
    addItemToInventory,
    copyItem,
    deleteItem,
    selectItemForSlot,
    isItemEquipped,
    updateItem,
  } = useBuilderActions();

  // Edit modal state
  const isEditModalOpen = useEquipmentUIStore((state) => state.isEditModalOpen);
  const editModalItemId = useEquipmentUIStore((state) => state.editModalItemId);
  const openEditModal = useEquipmentUIStore((state) => state.openEditModal);
  const closeEditModal = useEquipmentUIStore((state) => state.closeEditModal);

  const editingItem = useMemo(
    () =>
      editModalItemId !== undefined
        ? loadout.gearPage.inventory.find((i) => i.id === editModalItemId)
        : undefined,
    [editModalItemId, loadout.gearPage.inventory],
  );

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
  const blendAffixIndex = useEquipmentUIStore((state) => state.blendAffixIndex);
  const setBlendAffixIndex = useEquipmentUIStore(
    (state) => state.setBlendAffixIndex,
  );
  const baseStatsAffixIndex = useEquipmentUIStore(
    (state) => state.baseStatsAffixIndex,
  );
  const setBaseStatsAffixIndex = useEquipmentUIStore(
    (state) => state.setBaseStatsAffixIndex,
  );
  const sweetDreamAffixIndex = useEquipmentUIStore(
    (state) => state.sweetDreamAffixIndex,
  );
  const sweetDreamAffixPercentage = useEquipmentUIStore(
    (state) => state.sweetDreamAffixPercentage,
  );
  const setSweetDreamAffixIndex = useEquipmentUIStore(
    (state) => state.setSweetDreamAffixIndex,
  );
  const setSweetDreamAffixPercentage = useEquipmentUIStore(
    (state) => state.setSweetDreamAffixPercentage,
  );
  const towerSequenceAffixIndex = useEquipmentUIStore(
    (state) => state.towerSequenceAffixIndex,
  );
  const setTowerSequenceAffixIndex = useEquipmentUIStore(
    (state) => state.setTowerSequenceAffixIndex,
  );
  const baseAffixSlots = useEquipmentUIStore((state) => state.baseAffixSlots);
  const setBaseAffixSlot = useEquipmentUIStore(
    (state) => state.setBaseAffixSlot,
  );
  const clearBaseAffixSlot = useEquipmentUIStore(
    (state) => state.clearBaseAffixSlot,
  );
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

  const blendAffixes = useMemo(
    () => (selectedEquipmentType === "Belt" ? getBlendAffixes() : []),
    [selectedEquipmentType],
  );

  const baseStatsAffixes = useMemo(
    () =>
      selectedEquipmentType
        ? getFilteredAffixes(selectedEquipmentType, "Base Stats")
        : [],
    [selectedEquipmentType],
  );

  const baseAffixes = useMemo(
    () =>
      selectedEquipmentType
        ? getFilteredAffixes(selectedEquipmentType, "Base Affix")
        : [],
    [selectedEquipmentType],
  );

  const sweetDreamAffixes = useMemo(
    () =>
      selectedEquipmentType
        ? getFilteredAffixes(selectedEquipmentType, "Sweet Dream Affix")
        : [],
    [selectedEquipmentType],
  );

  const towerSequenceAffixes = useMemo(
    () =>
      selectedEquipmentType
        ? getFilteredAffixes(selectedEquipmentType, "Tower Sequence")
        : [],
    [selectedEquipmentType],
  );

  const isBelt = selectedEquipmentType === "Belt";

  const allEquipmentTypes = useMemo(() => {
    const types = new Set<EquipmentType>();
    for (const slotTypes of Object.values(SLOT_TO_VALID_EQUIPMENT_TYPES)) {
      for (const type of slotTypes) {
        types.add(type);
      }
    }
    return Array.from(types).sort();
  }, []);

  const equipmentTypeOptions = useMemo(
    () =>
      allEquipmentTypes.map((type) => ({ value: type, label: i18n._(type) })),
    [allEquipmentTypes],
  );

  const handleEquipmentTypeChange = useCallback(
    (value: EquipmentType | undefined) => {
      setSelectedEquipmentType(value);
    },
    [setSelectedEquipmentType],
  );

  const handleAffixSelect = useCallback(
    (slotIndex: number, value: string) => {
      const affixIndex = value === "" ? undefined : parseInt(value, 10);
      setAffixSlot(slotIndex, {
        affixIndex,
        percentage:
          affixIndex === undefined ? 50 : affixSlots[slotIndex].percentage,
      });
    },
    [setAffixSlot, affixSlots],
  );

  const handleSliderChange = useCallback(
    (slotIndex: number, value: string) => {
      const percentage = parseInt(value, 10);
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

  const handleBlendSelect = useCallback(
    (_slotIndex: number, value: string) => {
      const index = value === "" ? undefined : parseInt(value, 10);
      setBlendAffixIndex(index);
    },
    [setBlendAffixIndex],
  );

  const handleClearBlend = useCallback(() => {
    setBlendAffixIndex(undefined);
  }, [setBlendAffixIndex]);

  const handleBaseStatsSelect = useCallback(
    (_slotIndex: number, value: string) => {
      const index = value === "" ? undefined : parseInt(value, 10);
      setBaseStatsAffixIndex(index);
    },
    [setBaseStatsAffixIndex],
  );

  const handleClearBaseStats = useCallback(() => {
    setBaseStatsAffixIndex(undefined);
  }, [setBaseStatsAffixIndex]);

  const handleBaseAffixSelect = useCallback(
    (slotIndex: number, value: string) => {
      const affixIndex = value === "" ? undefined : parseInt(value, 10);
      setBaseAffixSlot(slotIndex, {
        affixIndex,
        percentage:
          affixIndex === undefined ? 50 : baseAffixSlots[slotIndex].percentage,
      });
    },
    [setBaseAffixSlot, baseAffixSlots],
  );

  const handleBaseAffixSliderChange = useCallback(
    (slotIndex: number, value: string) => {
      const percentage = parseInt(value, 10);
      setBaseAffixSlot(slotIndex, { percentage });
    },
    [setBaseAffixSlot],
  );

  const handleClearBaseAffix = useCallback(
    (slotIndex: number) => {
      clearBaseAffixSlot(slotIndex);
    },
    [clearBaseAffixSlot],
  );

  const handleSweetDreamSelect = useCallback(
    (_slotIndex: number, value: string) => {
      const index = value === "" ? undefined : parseInt(value, 10);
      setSweetDreamAffixIndex(index);
    },
    [setSweetDreamAffixIndex],
  );

  const handleSweetDreamSliderChange = useCallback(
    (_slotIndex: number, value: string) => {
      const percentage = parseInt(value, 10);
      setSweetDreamAffixPercentage(percentage);
    },
    [setSweetDreamAffixPercentage],
  );

  const handleClearSweetDream = useCallback(() => {
    setSweetDreamAffixIndex(undefined);
  }, [setSweetDreamAffixIndex]);

  const handleTowerSequenceSelect = useCallback(
    (_slotIndex: number, value: string) => {
      const index = value === "" ? undefined : parseInt(value, 10);
      setTowerSequenceAffixIndex(index);
    },
    [setTowerSequenceAffixIndex],
  );

  const handleClearTowerSequence = useCallback(() => {
    setTowerSequenceAffixIndex(undefined);
  }, [setTowerSequenceAffixIndex]);

  const handleSaveToInventory = useCallback(() => {
    if (!selectedEquipmentType) return;

    // Build base stats
    const baseStats =
      baseStatsAffixIndex !== undefined
        ? baseStatsAffixes[baseStatsAffixIndex].craftableAffix
        : undefined;

    // Build base affixes (2 max)
    const base_affixes: string[] = [];
    baseAffixSlots.forEach((selection) => {
      if (selection.affixIndex === undefined) return;
      const selectedAffix = baseAffixes[selection.affixIndex];
      base_affixes.push(craft(selectedAffix, selection.percentage));
    });

    // Build blend affix (belt only)
    const blend_affix =
      isBelt && blendAffixIndex !== undefined
        ? formatBlendAffix(blendAffixes[blendAffixIndex])
        : undefined;

    // Build sweet dream affix (1 max)
    const sweet_dream_affix =
      sweetDreamAffixIndex !== undefined
        ? craft(
            sweetDreamAffixes[sweetDreamAffixIndex],
            sweetDreamAffixPercentage,
          )
        : undefined;

    // Build tower sequence affix (1 max, no quality)
    const tower_sequence_affix =
      towerSequenceAffixIndex !== undefined
        ? towerSequenceAffixes[towerSequenceAffixIndex].craftableAffix
        : undefined;

    // Build prefixes (slots 0-2)
    const prefixes: string[] = [];
    affixSlots.slice(0, 3).forEach((selection) => {
      if (selection.affixIndex === undefined) return;
      const selectedAffix = prefixAffixes[selection.affixIndex];
      prefixes.push(craft(selectedAffix, selection.percentage));
    });

    // Build suffixes (slots 3-5)
    const suffixes: string[] = [];
    affixSlots.slice(3, 6).forEach((selection) => {
      if (selection.affixIndex === undefined) return;
      const selectedAffix = suffixAffixes[selection.affixIndex];
      suffixes.push(craft(selectedAffix, selection.percentage));
    });

    const newItem: SaveDataGear = {
      id: generateItemId(),
      equipmentType: selectedEquipmentType,
      baseStats,
      base_affixes: base_affixes.length > 0 ? base_affixes : undefined,
      prefixes: prefixes.length > 0 ? prefixes : undefined,
      suffixes: suffixes.length > 0 ? suffixes : undefined,
      blend_affix,
      sweet_dream_affix,
      tower_sequence_affix,
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
    isBelt,
    blendAffixIndex,
    blendAffixes,
    baseStatsAffixIndex,
    baseStatsAffixes,
    baseAffixSlots,
    baseAffixes,
    sweetDreamAffixIndex,
    sweetDreamAffixPercentage,
    sweetDreamAffixes,
    towerSequenceAffixIndex,
    towerSequenceAffixes,
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
          <Trans>Equipment Slots</Trans>
        </h2>
        <div className="space-y-1">
          {GEAR_SLOTS.map(({ key, label }) => (
            <EquipmentSlotDropdown
              key={key}
              slot={key}
              label={i18n._(label)}
              selectedItemId={loadout.gearPage.equippedGear[key]?.id ?? null}
              compatibleItems={getCompatibleItems(
                loadout.gearPage.inventory,
                key,
              )}
              onSelectItem={handleSelectItemForSlot}
            />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-semibold text-zinc-50">
            <Trans>Craft New Item</Trans>
          </h2>

          <div className="mb-6">
            <label
              htmlFor="equipment-type-select"
              className="mb-2 block text-sm font-medium text-zinc-50"
            >
              <Trans>Equipment Type</Trans>
            </label>
            <SearchableSelect
              value={selectedEquipmentType}
              onChange={handleEquipmentTypeChange}
              options={equipmentTypeOptions}
              placeholder={i18n._("Select equipment type...")}
            />
          </div>

          {selectedEquipmentType ? (
            <>
              {/* Base Stats Section */}
              {baseStatsAffixes.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-lg font-semibold text-zinc-50">
                    <Trans>Base Stats (1 max)</Trans>
                  </h3>
                  <AffixSlotComponent
                    slotIndex={-2}
                    affixType="Base Stats"
                    affixes={baseStatsAffixes}
                    selection={{
                      affixIndex: baseStatsAffixIndex,
                      percentage: 100,
                    }}
                    onAffixSelect={handleBaseStatsSelect}
                    onSliderChange={() => {}}
                    onClear={handleClearBaseStats}
                    hideQualitySlider
                  />
                </div>
              )}
              {/* Base Affixes Section */}
              {baseAffixes.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-lg font-semibold text-zinc-50">
                    <Trans>Base Affixes (2 max)</Trans>
                  </h3>
                  <div className="space-y-4">
                    {[0, 1].map((slotIndex) => (
                      <AffixSlotComponent
                        key={slotIndex}
                        slotIndex={slotIndex}
                        affixType="Base Affix"
                        affixes={baseAffixes}
                        selection={baseAffixSlots[slotIndex]}
                        onAffixSelect={handleBaseAffixSelect}
                        onSliderChange={handleBaseAffixSliderChange}
                        onClear={handleClearBaseAffix}
                        hideTierInfo
                      />
                    ))}
                  </div>
                </div>
              )}
              {/* Sweet Dream Affix Section */}
              {sweetDreamAffixes.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-lg font-semibold text-zinc-50">
                    <Trans>Sweet Dream Affix (1 max)</Trans>
                  </h3>
                  <AffixSlotComponent
                    slotIndex={-3}
                    affixType="Sweet Dream Affix"
                    affixes={sweetDreamAffixes}
                    selection={{
                      affixIndex: sweetDreamAffixIndex,
                      percentage: sweetDreamAffixPercentage,
                    }}
                    onAffixSelect={handleSweetDreamSelect}
                    onSliderChange={handleSweetDreamSliderChange}
                    onClear={handleClearSweetDream}
                    hideTierInfo
                  />
                </div>
              )}
              {/* Tower Sequence Affix Section */}
              {towerSequenceAffixes.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-lg font-semibold text-zinc-50">
                    <Trans>Tower Sequence (1 max)</Trans>
                  </h3>
                  <AffixSlotComponent
                    slotIndex={-4}
                    affixType="Tower Sequence"
                    affixes={towerSequenceAffixes}
                    selection={{
                      affixIndex: towerSequenceAffixIndex,
                      percentage: 100,
                    }}
                    onAffixSelect={handleTowerSequenceSelect}
                    onSliderChange={() => {}}
                    onClear={handleClearTowerSequence}
                    hideQualitySlider
                  />
                </div>
              )}
              {/* Blending Affix Section (Belts Only) */}
              {isBelt && (
                <div className="mb-6">
                  <h3 className="mb-3 text-lg font-semibold text-zinc-50">
                    <Trans>Blending (1 max)</Trans>
                  </h3>
                  <AffixSlotComponent
                    slotIndex={-1}
                    affixType="Blend"
                    affixes={
                      blendAffixes.map((blend) => ({
                        craftableAffix: blend.affix,
                        tier: "0",
                        equipmentSlot: "Trinket",
                        equipmentType: "Belt",
                        affixType: "Prefix",
                        craftingPool: "",
                      })) as BaseGearAffix[]
                    }
                    selection={{ affixIndex: blendAffixIndex, percentage: 100 }}
                    onAffixSelect={handleBlendSelect}
                    onSliderChange={() => {}}
                    onClear={handleClearBlend}
                    hideQualitySlider
                    formatOption={(affix) => {
                      const blend = blendAffixes.find(
                        (b) => b.affix === affix.craftableAffix,
                      );
                      return blend
                        ? formatBlendOption(blend)
                        : affix.craftableAffix;
                    }}
                    formatCraftedText={(affix) => {
                      const blend = blendAffixes.find(
                        (b) => b.affix === affix.craftableAffix,
                      );
                      return blend
                        ? formatBlendPreview(blend)
                        : affix.craftableAffix;
                    }}
                  />
                </div>
              )}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-zinc-50">
                  <Trans>Prefixes (3 max)</Trans>
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
                  <Trans>Suffixes (3 max)</Trans>
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
                type="button"
                onClick={handleSaveToInventory}
                className="w-full rounded-lg bg-amber-500 px-4 py-3 font-semibold text-zinc-950 transition-colors hover:bg-amber-600"
              >
                <Trans>Save to Inventory</Trans>
              </button>
            </>
          ) : (
            <p className="py-8 text-center italic text-zinc-500">
              <Trans>Select an equipment type to begin crafting</Trans>
            </p>
          )}
        </div>

        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-semibold text-zinc-50">
            <Trans>Inventory</Trans> ({loadout.gearPage.inventory.length}
            <Trans>items</Trans>)
          </h2>
          {loadout.gearPage.inventory.length === 0 ? (
            <p className="py-4 text-center italic text-zinc-500">
              <Trans>
                No items in inventory. Craft items above to add them here.
              </Trans>
            </p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {loadout.gearPage.inventory.map((item) => (
                <InventoryItem
                  key={item.id}
                  item={item}
                  // biome-ignore lint/style/noNonNullAssertion: inventory items always have id
                  isEquipped={isItemEquipped(item.id!)}
                  onCopy={copyItem}
                  onEdit={openEditModal}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          )}
        </div>

        <LegendaryGearModule onSaveToInventory={addItemToInventory} />
      </div>

      <EditGearModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        item={editingItem}
        onSave={updateItem}
      />
    </div>
  );
}
