import { BaseGearAffix } from "../gear_data_types";

export const TWO_HANDED_AXE_CORROSION_BASE_AFFIXES = [
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Two-Handed Axe",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(10-15)% Skill Area",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Two-Handed Axe",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(15-25)% gear Physical Damage",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Two-Handed Axe",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(3-6)% Attack Critical Strike Rating for this gear",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Two-Handed Axe",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(40-45)% Elemental Damage",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Two-Handed Axe",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(5-8)% gear Attack Speed",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Two-Handed Axe",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix:
      "+(6-12)% chance to gain 1 stack of Tenacity Blessing on defeat",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Two-Handed Axe",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "Adds (7-10) - (14-17) Physical Damage to the gear",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Two-Handed Axe",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix:
      "Eliminates enemies under (5-8)% Life upon inflicting damage",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Two-Handed Axe",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix:
      "Enemies have a 30% chance to explode when defeated, dealing Secondary Physical Damage equal to (5-10)% of their Max Life to enemies within a 5m radius",
  },
] as const satisfies readonly BaseGearAffix[];

export type TwoHandedAxeCorrosionBaseAffix =
  (typeof TWO_HANDED_AXE_CORROSION_BASE_AFFIXES)[number];
