import { BaseGearAffix } from "../gear_data_types";

export const CUDGEL_CORROSION_BASE_AFFIXES = [
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Cudgel",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(1-2) Support Skill Level",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Cudgel",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(18-24)% Cast Speed",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Cudgel",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(35-45)% Spell Damage",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Cudgel",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(40-48)% Critical Strike Damage",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Cudgel",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(50-60)% Spell Critical Strike Rating",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Cudgel",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix:
      "+(6-12)% chance to gain 1 stack of Focus Blessing on defeat",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Cudgel",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(8-15)% Cooldown Recovery Speed",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Cudgel",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "Adds (7-12)% of Elemental Damage as Erosion Damage",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Cudgel",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "Damage Penetrates (8-12)% Elemental Resistance",
  },
] as const satisfies readonly BaseGearAffix[];

export type CudgelCorrosionBaseAffix =
  (typeof CUDGEL_CORROSION_BASE_AFFIXES)[number];
