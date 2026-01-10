import type { EquipmentSlot, EquipmentType } from "@/src/tli/gear-data-types";

export interface LegendaryAffixChoice {
  choiceDescriptor: string;
  choices: string[];
}

export type LegendaryAffix = string | LegendaryAffixChoice;

export interface Legendary {
  name: string;
  baseItem: string;
  baseStat: string;
  normalAffixes: LegendaryAffix[];
  corruptionAffixes: LegendaryAffix[];
  equipmentSlot: EquipmentSlot;
  equipmentType: EquipmentType;
}
