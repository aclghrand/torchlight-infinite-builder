import { ALL_GEAR_AFFIXES } from "@/src/tli/all-affixes";
import type { Gear } from "@/src/tli/core";
import type { EquipmentType } from "@/src/tli/gear-data-types";
import {
  SLOT_TO_EQUIPMENT_SLOT,
  SLOT_TO_VALID_EQUIPMENT_TYPES,
} from "./constants";
import type { GearSlot } from "./types";

export const getValidEquipmentTypes = (slot: GearSlot): EquipmentType[] => {
  const validEquipSlots = SLOT_TO_EQUIPMENT_SLOT[slot];
  const types = new Set<EquipmentType>();

  ALL_GEAR_AFFIXES.forEach((affix) => {
    if (validEquipSlots.includes(affix.equipmentSlot)) {
      types.add(affix.equipmentType);
    }
  });

  return Array.from(types).sort();
};

export const getCompatibleItems = (
  itemsList: Gear[],
  slot: GearSlot,
): Gear[] => {
  const validTypes = SLOT_TO_VALID_EQUIPMENT_TYPES[slot];
  return itemsList.filter((item) => validTypes.includes(item.equipmentType));
};
