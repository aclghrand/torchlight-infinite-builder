import { RawGear } from "@/src/tli/core";
import { EquipmentSlot, EquipmentType } from "@/src/tli/gear_data_types";
import { ALL_GEAR_AFFIXES } from "@/src/tli/all_affixes";
import {
  SLOT_TO_EQUIPMENT_SLOT,
  SLOT_TO_VALID_EQUIPMENT_TYPES,
} from "./constants";
import { GearSlot } from "./types";

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
  itemsList: RawGear[],
  slot: GearSlot,
): RawGear[] => {
  const validTypes = SLOT_TO_VALID_EQUIPMENT_TYPES[slot];
  return itemsList.filter(
    (item) => item.equipmentType && validTypes.includes(item.equipmentType),
  );
};

export const getGearTypeFromEquipmentType = (
  equipmentType: EquipmentType,
): RawGear["gearType"] => {
  if (equipmentType.includes("Helmet")) return "helmet";
  if (equipmentType.includes("Chest")) return "chest";
  if (equipmentType.includes("Gloves")) return "gloves";
  if (equipmentType.includes("Boots")) return "boots";
  if (equipmentType === "Belt") return "belt";
  if (equipmentType === "Necklace") return "neck";
  if (equipmentType === "Ring" || equipmentType === "Spirit Ring")
    return "ring";
  if (equipmentType.includes("Shield")) return "shield";
  return "sword"; // All weapons
};

export const getGearTypeFromEquipmentSlot = (
  equipmentSlot: EquipmentSlot,
): RawGear["gearType"] => {
  switch (equipmentSlot) {
    case "Helmet":
      return "helmet";
    case "Chest Armor":
      return "chest";
    case "Gloves":
      return "gloves";
    case "Boots":
      return "boots";
    case "Trinket":
      return "neck"; // Belt, Necklace, Ring are all "Trinket" slot
    case "Shield":
      return "shield";
    case "One-Handed":
    case "Two-Handed":
      return "sword";
    default:
      return "sword";
  }
};
