import { useCallback, useEffect, useMemo, useState } from "react";
import { getFilteredAffixes } from "@/src/lib/affix-utils";
import {
  formatBlendAffix,
  formatBlendOption,
  formatBlendPreview,
  getBlendAffixes,
} from "@/src/lib/blend-utils";
import { DEFAULT_QUALITY } from "@/src/lib/constants";
import type { Gear as SaveDataGear } from "@/src/lib/save-data";
import { type Gear, getAffixText } from "@/src/tli/core";
import { craft } from "@/src/tli/crafting/craft";
import type { BaseGearAffix } from "@/src/tli/gear-data-types";
import { Modal, ModalActions, ModalButton } from "../ui/Modal";
import { AffixSlotComponent } from "./AffixSlotComponent";
import { ExistingAffixDisplay } from "./ExistingAffixDisplay";

interface EditableAffixSlot {
  type: "existing" | "new";
  value: string | undefined;
  affixIndex: number | undefined;
  percentage: number;
}

const createExistingSlot = (value: string): EditableAffixSlot => ({
  type: "existing",
  value,
  affixIndex: undefined,
  percentage: DEFAULT_QUALITY,
});

const createNewSlot = (): EditableAffixSlot => ({
  type: "new",
  value: undefined,
  affixIndex: undefined,
  percentage: DEFAULT_QUALITY,
});

// Helper to get text from BaseStats
const getBaseStatsText = (baseStats: NonNullable<Gear["baseStats"]>): string =>
  baseStats.src ?? baseStats.baseStatLines.map((l) => l.text).join("\n");

interface EditGearModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Gear | undefined;
  onSave: (itemId: string, updatedItem: SaveDataGear) => void;
}

export const EditGearModal = ({
  isOpen,
  onClose,
  item,
  onSave,
}: EditGearModalProps): React.ReactElement | null => {
  // Local state for editable affixes
  const [baseStats, setBaseStats] = useState<EditableAffixSlot>(
    createNewSlot(),
  );
  const [baseAffixes, setBaseAffixes] = useState<EditableAffixSlot[]>([]);
  const [sweetDreamAffix, setSweetDreamAffix] = useState<EditableAffixSlot>(
    createNewSlot(),
  );
  const [towerSequenceAffix, setTowerSequenceAffix] =
    useState<EditableAffixSlot>(createNewSlot());
  const [blendAffix, setBlendAffix] = useState<EditableAffixSlot>(
    createNewSlot(),
  );
  const [prefixes, setPrefixes] = useState<EditableAffixSlot[]>([]);
  const [suffixes, setSuffixes] = useState<EditableAffixSlot[]>([]);

  // Get available affixes based on equipment type
  const equipmentType = item?.equipmentType;

  const prefixAffixes = useMemo(
    () => (equipmentType ? getFilteredAffixes(equipmentType, "Prefix") : []),
    [equipmentType],
  );

  const suffixAffixes = useMemo(
    () => (equipmentType ? getFilteredAffixes(equipmentType, "Suffix") : []),
    [equipmentType],
  );

  const baseStatsAffixes = useMemo(
    () =>
      equipmentType ? getFilteredAffixes(equipmentType, "Base Stats") : [],
    [equipmentType],
  );

  const baseAffixOptions = useMemo(
    () =>
      equipmentType ? getFilteredAffixes(equipmentType, "Base Affix") : [],
    [equipmentType],
  );

  const sweetDreamAffixes = useMemo(
    () =>
      equipmentType
        ? getFilteredAffixes(equipmentType, "Sweet Dream Affix")
        : [],
    [equipmentType],
  );

  const towerSequenceAffixes = useMemo(
    () =>
      equipmentType ? getFilteredAffixes(equipmentType, "Tower Sequence") : [],
    [equipmentType],
  );

  const blendAffixes = useMemo(
    () => (equipmentType === "Belt" ? getBlendAffixes() : []),
    [equipmentType],
  );

  const isBelt = equipmentType === "Belt";

  // Initialize state from item when modal opens
  useEffect(() => {
    if (isOpen && item !== undefined) {
      // Base Stats
      if (item.baseStats !== undefined) {
        setBaseStats(createExistingSlot(getBaseStatsText(item.baseStats)));
      } else {
        setBaseStats(createNewSlot());
      }

      // Base Affixes (2 max)
      const initialBaseAffixes: EditableAffixSlot[] = [];
      if (item.base_affixes !== undefined) {
        for (const affix of item.base_affixes) {
          initialBaseAffixes.push(createExistingSlot(getAffixText(affix)));
        }
      }
      // Pad to 2 slots
      while (initialBaseAffixes.length < 2) {
        initialBaseAffixes.push(createNewSlot());
      }
      setBaseAffixes(initialBaseAffixes);

      // Sweet Dream Affix
      if (item.sweet_dream_affix !== undefined) {
        setSweetDreamAffix(
          createExistingSlot(getAffixText(item.sweet_dream_affix)),
        );
      } else {
        setSweetDreamAffix(createNewSlot());
      }

      // Tower Sequence Affix
      if (item.tower_sequence_affix !== undefined) {
        setTowerSequenceAffix(
          createExistingSlot(getAffixText(item.tower_sequence_affix)),
        );
      } else {
        setTowerSequenceAffix(createNewSlot());
      }

      // Blend Affix (belt only)
      if (item.blend_affix !== undefined) {
        setBlendAffix(createExistingSlot(getAffixText(item.blend_affix)));
      } else {
        setBlendAffix(createNewSlot());
      }

      // Prefixes (3 max)
      const initialPrefixes: EditableAffixSlot[] = [];
      if (item.prefixes !== undefined) {
        for (const affix of item.prefixes) {
          initialPrefixes.push(createExistingSlot(getAffixText(affix)));
        }
      }
      while (initialPrefixes.length < 3) {
        initialPrefixes.push(createNewSlot());
      }
      setPrefixes(initialPrefixes);

      // Suffixes (3 max)
      const initialSuffixes: EditableAffixSlot[] = [];
      if (item.suffixes !== undefined) {
        for (const affix of item.suffixes) {
          initialSuffixes.push(createExistingSlot(getAffixText(affix)));
        }
      }
      while (initialSuffixes.length < 3) {
        initialSuffixes.push(createNewSlot());
      }
      setSuffixes(initialSuffixes);
    }
  }, [isOpen, item]);

  // Handlers for deleting existing affixes
  const handleDeleteBaseStats = useCallback(() => {
    setBaseStats(createNewSlot());
  }, []);

  const handleDeleteBaseAffix = useCallback((index: number) => {
    setBaseAffixes((prev) => {
      // Remove the slot and shift remaining up, add empty slot at end
      const updated = [...prev];
      updated.splice(index, 1);
      updated.push(createNewSlot());
      return updated;
    });
  }, []);

  const handleDeleteSweetDream = useCallback(() => {
    setSweetDreamAffix(createNewSlot());
  }, []);

  const handleDeleteTowerSequence = useCallback(() => {
    setTowerSequenceAffix(createNewSlot());
  }, []);

  const handleDeleteBlend = useCallback(() => {
    setBlendAffix(createNewSlot());
  }, []);

  const handleDeletePrefix = useCallback((index: number) => {
    setPrefixes((prev) => {
      // Remove the slot and shift remaining up, add empty slot at end
      const updated = [...prev];
      updated.splice(index, 1);
      updated.push(createNewSlot());
      return updated;
    });
  }, []);

  const handleDeleteSuffix = useCallback((index: number) => {
    setSuffixes((prev) => {
      // Remove the slot and shift remaining up, add empty slot at end
      const updated = [...prev];
      updated.splice(index, 1);
      updated.push(createNewSlot());
      return updated;
    });
  }, []);

  // Handlers for selecting new affixes
  const handleBaseStatsSelect = useCallback((_: number, value: string) => {
    const affixIndex = value === "" ? undefined : parseInt(value, 10);
    setBaseStats((prev) => ({ ...prev, type: "new", affixIndex }));
  }, []);

  const handleBaseAffixSelect = useCallback(
    (slotIndex: number, value: string) => {
      const affixIndex = value === "" ? undefined : parseInt(value, 10);
      setBaseAffixes((prev) => {
        const updated = [...prev];
        updated[slotIndex] = { ...updated[slotIndex], type: "new", affixIndex };
        return updated;
      });
    },
    [],
  );

  const handleBaseAffixSliderChange = useCallback(
    (slotIndex: number, value: string) => {
      const percentage = parseInt(value, 10);
      setBaseAffixes((prev) => {
        const updated = [...prev];
        updated[slotIndex] = { ...updated[slotIndex], percentage };
        return updated;
      });
    },
    [],
  );

  const handleClearBaseAffix = useCallback((slotIndex: number) => {
    setBaseAffixes((prev) => {
      // Remove the slot and shift remaining up, add empty slot at end
      const updated = [...prev];
      updated.splice(slotIndex, 1);
      updated.push(createNewSlot());
      return updated;
    });
  }, []);

  const handleSweetDreamSelect = useCallback((_: number, value: string) => {
    const affixIndex = value === "" ? undefined : parseInt(value, 10);
    setSweetDreamAffix((prev) => ({ ...prev, type: "new", affixIndex }));
  }, []);

  const handleSweetDreamSliderChange = useCallback(
    (_: number, value: string) => {
      const percentage = parseInt(value, 10);
      setSweetDreamAffix((prev) => ({ ...prev, percentage }));
    },
    [],
  );

  const handleClearSweetDream = useCallback(() => {
    setSweetDreamAffix(createNewSlot());
  }, []);

  const handleTowerSequenceSelect = useCallback((_: number, value: string) => {
    const affixIndex = value === "" ? undefined : parseInt(value, 10);
    setTowerSequenceAffix((prev) => ({ ...prev, type: "new", affixIndex }));
  }, []);

  const handleClearTowerSequence = useCallback(() => {
    setTowerSequenceAffix(createNewSlot());
  }, []);

  const handleBlendSelect = useCallback((_: number, value: string) => {
    const affixIndex = value === "" ? undefined : parseInt(value, 10);
    setBlendAffix((prev) => ({ ...prev, type: "new", affixIndex }));
  }, []);

  const handleClearBlend = useCallback(() => {
    setBlendAffix(createNewSlot());
  }, []);

  const handlePrefixSelect = useCallback((slotIndex: number, value: string) => {
    const affixIndex = value === "" ? undefined : parseInt(value, 10);
    setPrefixes((prev) => {
      const updated = [...prev];
      updated[slotIndex] = { ...updated[slotIndex], type: "new", affixIndex };
      return updated;
    });
  }, []);

  const handlePrefixSliderChange = useCallback(
    (slotIndex: number, value: string) => {
      const percentage = parseInt(value, 10);
      setPrefixes((prev) => {
        const updated = [...prev];
        updated[slotIndex] = { ...updated[slotIndex], percentage };
        return updated;
      });
    },
    [],
  );

  const handleClearPrefix = useCallback((slotIndex: number) => {
    setPrefixes((prev) => {
      // Remove the slot and shift remaining up, add empty slot at end
      const updated = [...prev];
      updated.splice(slotIndex, 1);
      updated.push(createNewSlot());
      return updated;
    });
  }, []);

  const handleSuffixSelect = useCallback((slotIndex: number, value: string) => {
    const affixIndex = value === "" ? undefined : parseInt(value, 10);
    setSuffixes((prev) => {
      const updated = [...prev];
      updated[slotIndex] = { ...updated[slotIndex], type: "new", affixIndex };
      return updated;
    });
  }, []);

  const handleSuffixSliderChange = useCallback(
    (slotIndex: number, value: string) => {
      const percentage = parseInt(value, 10);
      setSuffixes((prev) => {
        const updated = [...prev];
        updated[slotIndex] = { ...updated[slotIndex], percentage };
        return updated;
      });
    },
    [],
  );

  const handleClearSuffix = useCallback((slotIndex: number) => {
    setSuffixes((prev) => {
      // Remove the slot and shift remaining up, add empty slot at end
      const updated = [...prev];
      updated.splice(slotIndex, 1);
      updated.push(createNewSlot());
      return updated;
    });
  }, []);

  // Build and save the updated item
  const handleSave = useCallback(() => {
    if (item === undefined || item.id === undefined) return;

    // Build base stats
    let newBaseStats: string | undefined;
    if (baseStats.type === "existing" && baseStats.value !== undefined) {
      newBaseStats = baseStats.value;
    } else if (baseStats.type === "new" && baseStats.affixIndex !== undefined) {
      newBaseStats = baseStatsAffixes[baseStats.affixIndex].craftableAffix;
    }

    // Build base affixes
    const newBaseAffixes: string[] = [];
    for (const slot of baseAffixes) {
      if (slot.type === "existing" && slot.value !== undefined) {
        newBaseAffixes.push(slot.value);
      } else if (slot.type === "new" && slot.affixIndex !== undefined) {
        newBaseAffixes.push(
          craft(baseAffixOptions[slot.affixIndex], slot.percentage),
        );
      }
    }

    // Build sweet dream affix
    let newSweetDreamAffix: string | undefined;
    if (
      sweetDreamAffix.type === "existing" &&
      sweetDreamAffix.value !== undefined
    ) {
      newSweetDreamAffix = sweetDreamAffix.value;
    } else if (
      sweetDreamAffix.type === "new" &&
      sweetDreamAffix.affixIndex !== undefined
    ) {
      newSweetDreamAffix = craft(
        sweetDreamAffixes[sweetDreamAffix.affixIndex],
        sweetDreamAffix.percentage,
      );
    }

    // Build tower sequence affix
    let newTowerSequenceAffix: string | undefined;
    if (
      towerSequenceAffix.type === "existing" &&
      towerSequenceAffix.value !== undefined
    ) {
      newTowerSequenceAffix = towerSequenceAffix.value;
    } else if (
      towerSequenceAffix.type === "new" &&
      towerSequenceAffix.affixIndex !== undefined
    ) {
      newTowerSequenceAffix =
        towerSequenceAffixes[towerSequenceAffix.affixIndex].craftableAffix;
    }

    // Build blend affix (belt only)
    let newBlendAffix: string | undefined;
    if (isBelt) {
      if (blendAffix.type === "existing" && blendAffix.value !== undefined) {
        newBlendAffix = blendAffix.value;
      } else if (
        blendAffix.type === "new" &&
        blendAffix.affixIndex !== undefined
      ) {
        newBlendAffix = formatBlendAffix(blendAffixes[blendAffix.affixIndex]);
      }
    }

    // Build prefixes
    const newPrefixes: string[] = [];
    for (const slot of prefixes) {
      if (slot.type === "existing" && slot.value !== undefined) {
        newPrefixes.push(slot.value);
      } else if (slot.type === "new" && slot.affixIndex !== undefined) {
        newPrefixes.push(
          craft(prefixAffixes[slot.affixIndex], slot.percentage),
        );
      }
    }

    // Build suffixes
    const newSuffixes: string[] = [];
    for (const slot of suffixes) {
      if (slot.type === "existing" && slot.value !== undefined) {
        newSuffixes.push(slot.value);
      } else if (slot.type === "new" && slot.affixIndex !== undefined) {
        newSuffixes.push(
          craft(suffixAffixes[slot.affixIndex], slot.percentage),
        );
      }
    }

    const updatedItem: SaveDataGear = {
      id: item.id,
      equipmentType: item.equipmentType,
      rarity: item.rarity === "rare" ? undefined : item.rarity,
      legendaryName: item.legendaryName,
      baseStats: newBaseStats,
      base_affixes: newBaseAffixes.length > 0 ? newBaseAffixes : undefined,
      sweet_dream_affix: newSweetDreamAffix,
      tower_sequence_affix: newTowerSequenceAffix,
      blend_affix: newBlendAffix,
      prefixes: newPrefixes.length > 0 ? newPrefixes : undefined,
      suffixes: newSuffixes.length > 0 ? newSuffixes : undefined,
    };

    onSave(item.id, updatedItem);
    onClose();
  }, [
    item,
    baseStats,
    baseStatsAffixes,
    baseAffixes,
    baseAffixOptions,
    sweetDreamAffix,
    sweetDreamAffixes,
    towerSequenceAffix,
    towerSequenceAffixes,
    blendAffix,
    blendAffixes,
    isBelt,
    prefixes,
    prefixAffixes,
    suffixes,
    suffixAffixes,
    onSave,
    onClose,
  ]);

  if (item === undefined) return null;

  const renderAffixSlot = (
    slot: EditableAffixSlot,
    slotIndex: number,
    affixType:
      | "Prefix"
      | "Suffix"
      | "Base Affix"
      | "Sweet Dream Affix"
      | "Tower Sequence"
      | "Base Stats"
      | "Blend",
    affixes: BaseGearAffix[],
    onSelect: (slotIndex: number, value: string) => void,
    onSliderChange: (slotIndex: number, value: string) => void,
    onClear: (slotIndex: number) => void,
    onDeleteExisting: () => void,
    options?: {
      hideQualitySlider?: boolean;
      hideTierInfo?: boolean;
      formatOption?: (affix: BaseGearAffix) => string;
      formatCraftedText?: (affix: BaseGearAffix) => string;
    },
  ): React.ReactElement => {
    if (slot.type === "existing" && slot.value !== undefined) {
      return (
        <ExistingAffixDisplay
          key={slotIndex}
          value={slot.value}
          onDelete={onDeleteExisting}
        />
      );
    }

    return (
      <AffixSlotComponent
        key={slotIndex}
        slotIndex={slotIndex}
        affixType={affixType}
        affixes={affixes}
        selection={{ affixIndex: slot.affixIndex, percentage: slot.percentage }}
        onAffixSelect={onSelect}
        onSliderChange={onSliderChange}
        onClear={onClear}
        hideQualitySlider={options?.hideQualitySlider}
        hideTierInfo={options?.hideTierInfo}
        formatOption={options?.formatOption}
        formatCraftedText={options?.formatCraftedText}
      />
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${item.equipmentType}`}
      maxWidth="xl"
    >
      <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-2">
        {/* Base Stats Section */}
        {baseStatsAffixes.length > 0 && (
          <div>
            <h3 className="mb-3 text-lg font-semibold text-zinc-50">
              Base Stats (1 max)
            </h3>
            {renderAffixSlot(
              baseStats,
              0,
              "Base Stats",
              baseStatsAffixes,
              handleBaseStatsSelect,
              () => {},
              handleDeleteBaseStats,
              handleDeleteBaseStats,
              { hideQualitySlider: true },
            )}
          </div>
        )}

        {/* Base Affixes Section */}
        {baseAffixOptions.length > 0 && (
          <div>
            <h3 className="mb-3 text-lg font-semibold text-zinc-50">
              Base Affixes (2 max)
            </h3>
            <div className="space-y-4">
              {baseAffixes.map((slot, index) =>
                renderAffixSlot(
                  slot,
                  index,
                  "Base Affix",
                  baseAffixOptions,
                  handleBaseAffixSelect,
                  handleBaseAffixSliderChange,
                  handleClearBaseAffix,
                  () => handleDeleteBaseAffix(index),
                  { hideTierInfo: true },
                ),
              )}
            </div>
          </div>
        )}

        {/* Sweet Dream Affix Section */}
        {sweetDreamAffixes.length > 0 && (
          <div>
            <h3 className="mb-3 text-lg font-semibold text-zinc-50">
              Sweet Dream Affix (1 max)
            </h3>
            {renderAffixSlot(
              sweetDreamAffix,
              0,
              "Sweet Dream Affix",
              sweetDreamAffixes,
              handleSweetDreamSelect,
              handleSweetDreamSliderChange,
              handleClearSweetDream,
              handleDeleteSweetDream,
              { hideTierInfo: true },
            )}
          </div>
        )}

        {/* Tower Sequence Affix Section */}
        {towerSequenceAffixes.length > 0 && (
          <div>
            <h3 className="mb-3 text-lg font-semibold text-zinc-50">
              Tower Sequence (1 max)
            </h3>
            {renderAffixSlot(
              towerSequenceAffix,
              0,
              "Tower Sequence",
              towerSequenceAffixes,
              handleTowerSequenceSelect,
              () => {},
              handleClearTowerSequence,
              handleDeleteTowerSequence,
              { hideQualitySlider: true },
            )}
          </div>
        )}

        {/* Blending Affix Section (Belts Only) */}
        {isBelt && (
          <div>
            <h3 className="mb-3 text-lg font-semibold text-zinc-50">
              Blending (1 max)
            </h3>
            {renderAffixSlot(
              blendAffix,
              0,
              "Blend",
              blendAffixes.map((blend) => ({
                craftableAffix: blend.affix,
                tier: "0",
                equipmentSlot: "Trinket",
                equipmentType: "Belt",
                affixType: "Prefix",
                craftingPool: "",
              })) as BaseGearAffix[],
              handleBlendSelect,
              () => {},
              handleClearBlend,
              handleDeleteBlend,
              {
                hideQualitySlider: true,
                formatOption: (affix) => {
                  const blend = blendAffixes.find(
                    (b) => b.affix === affix.craftableAffix,
                  );
                  return blend
                    ? formatBlendOption(blend)
                    : affix.craftableAffix;
                },
                formatCraftedText: (affix) => {
                  const blend = blendAffixes.find(
                    (b) => b.affix === affix.craftableAffix,
                  );
                  return blend
                    ? formatBlendPreview(blend)
                    : affix.craftableAffix;
                },
              },
            )}
          </div>
        )}

        {/* Prefixes Section */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-zinc-50">
            Prefixes (3 max)
          </h3>
          <div className="space-y-4">
            {prefixes.map((slot, index) =>
              renderAffixSlot(
                slot,
                index,
                "Prefix",
                prefixAffixes,
                handlePrefixSelect,
                handlePrefixSliderChange,
                handleClearPrefix,
                () => handleDeletePrefix(index),
              ),
            )}
          </div>
        </div>

        {/* Suffixes Section */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-zinc-50">
            Suffixes (3 max)
          </h3>
          <div className="space-y-4">
            {suffixes.map((slot, index) =>
              renderAffixSlot(
                slot,
                index,
                "Suffix",
                suffixAffixes,
                handleSuffixSelect,
                handleSuffixSliderChange,
                handleClearSuffix,
                () => handleDeleteSuffix(index),
              ),
            )}
          </div>
        </div>
      </div>

      <ModalActions>
        <ModalButton variant="secondary" onClick={onClose} fullWidth>
          Cancel
        </ModalButton>
        <ModalButton onClick={handleSave} fullWidth>
          Save
        </ModalButton>
      </ModalActions>
    </Modal>
  );
};
