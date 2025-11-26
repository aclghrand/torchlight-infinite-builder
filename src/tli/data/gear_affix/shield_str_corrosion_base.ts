import { BaseGearAffix } from "../gear_data_types";

export const SHIELD_STR_CORROSION_BASE_AFFIXES = [
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (STR)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(1-2)% Max Cold Resistance",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (STR)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(1-2)% Max Fire Resistance",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (STR)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(1-2)% Max Lightning Resistance",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (STR)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(12-15)% Spell Block Chance",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (STR)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(3-5)% Max Energy Shield",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (STR)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(3-5)% Max Life",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (STR)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(5-8)% Block Ratio",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (STR)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(8-12)% Attack Block Chance",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (STR)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "Has a (5-10)% chance to avoid Blocked damage",
  },
] as const satisfies readonly BaseGearAffix[];

export type ShieldStrCorrosionBaseAffix =
  (typeof SHIELD_STR_CORROSION_BASE_AFFIXES)[number];
