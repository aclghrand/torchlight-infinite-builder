import { BaseGearAffix } from "../gear_data_types";

export const DAGGER_CORROSION_BASE_AFFIXES = [
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Dagger",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix:
      "Wilted enemies defeated by you will explode, dealing Secondary Erosion Damage equal to (5-10)% of their Max Life to enemies within a 5m radius",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Dagger",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "(5-8)% chance to inflict 1 additional stacks of Wilt",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Dagger",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(15-25)% gear Physical Damage",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Dagger",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(25-30)% Elemental Damage",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Dagger",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(3-6)% Attack Critical Strike Rating for this gear",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Dagger",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix:
      "+(4-8)% chance to gain 1 stack of Focus Blessing on defeat",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Dagger",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(5-10) Affliction inflicted per second",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Dagger",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(5-8)% gear Attack Speed",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Dagger",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "Adds (2-4) - (8-10) Physical Damage to the gear",
  },
] as const satisfies readonly BaseGearAffix[];

export type DaggerCorrosionBaseAffix =
  (typeof DAGGER_CORROSION_BASE_AFFIXES)[number];
