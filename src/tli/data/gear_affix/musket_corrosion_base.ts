import { BaseGearAffix } from "../gear_data_types";

export const MUSKET_CORROSION_BASE_AFFIXES = [
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Musket",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(12-15)% chance for Attacks to cause Ailment",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Musket",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(15-25)% gear Physical Damage",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Musket",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(3-6)% Attack Critical Strike Rating for this gear",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Musket",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(40-45)% Elemental Damage",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Musket",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(5-8)% gear Attack Speed",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Musket",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix:
      "+(6-12)% chance to gain 1 stack of Agility Blessing on defeat",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Musket",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "Adds (7-10) - (14-17) Physical Damage to the gear",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Musket",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "Adds (7-12)% of Elemental Damage as Erosion Damage",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Musket",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "Damage Penetrates (8-12)% Elemental Resistance",
  },
] as const satisfies readonly BaseGearAffix[];

export type MusketCorrosionBaseAffix =
  (typeof MUSKET_CORROSION_BASE_AFFIXES)[number];
