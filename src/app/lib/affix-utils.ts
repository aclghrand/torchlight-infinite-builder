import { BaseGearAffix, EquipmentType } from "@/src/tli/gear_data_types";
import { ALL_GEAR_AFFIXES } from "@/src/tli/all_affixes";

export const getFilteredAffixes = (
  equipmentType: EquipmentType,
  affixType: "Prefix" | "Suffix",
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
    display = display.substring(0, 77) + "...";
  }
  return display;
};
