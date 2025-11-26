import { BaseGearAffix } from "../gear_data_types";

export const ONE_HANDED_AXE_CORROSION_BASE_AFFIXES = [
  {
    equipmentSlot: "One-Handed",
    equipmentType: "One-Handed Axe",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(10-15)% Skill Area",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "One-Handed Axe",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(15-25)% gear Physical Damage",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "One-Handed Axe",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(25-30)% Elemental Damage",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "One-Handed Axe",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(3-6)% Attack Critical Strike Rating for this gear",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "One-Handed Axe",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix:
      "+(4-8)% chance to gain 1 stack of Tenacity Blessing on defeat",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "One-Handed Axe",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(5-8)% gear Attack Speed",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "One-Handed Axe",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "Adds (2-4) - (8-10) Physical Damage to the gear",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "One-Handed Axe",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix:
      "Eliminates enemies under (5-8)% Life upon inflicting damage",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "One-Handed Axe",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix:
      "Enemies have a 30% chance to explode when defeated, dealing Secondary Physical Damage equal to (5-10)% of their Max Life to enemies within a 5m radius",
  },
] as const satisfies readonly BaseGearAffix[];

export type OneHandedAxeCorrosionBaseAffix =
  (typeof ONE_HANDED_AXE_CORROSION_BASE_AFFIXES)[number];
