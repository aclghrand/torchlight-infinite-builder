import { ALL_GEAR_AFFIXES } from "@/src/tli/all_affixes";
import type { BaseGearAffix, EquipmentType } from "@/src/tli/gear_data_types";

const FILTER_AFFIX_TYPES = [
  "Prefix",
  "Suffix",
  "Base Stats",
  "Base Affix",
  "Sweet Dream Affix",
  "Tower Sequence",
] as const;

type FilterAffixType = (typeof FILTER_AFFIX_TYPES)[number];

export const getFilteredAffixes = (
  equipmentType: EquipmentType,
  affixType: FilterAffixType,
): BaseGearAffix[] => {
  return ALL_GEAR_AFFIXES.filter(
    (affix) =>
      affix.equipmentType === equipmentType && affix.affixType === affixType,
  );
};

export const formatAffixOption = (affix: BaseGearAffix): string => {
  let display = affix.craftableAffix;
  display = display.replace(/\n/g, "/");
  if (display.length > 80) {
    display = `${display.substring(0, 77)}...`;
  }
  return display;
};
