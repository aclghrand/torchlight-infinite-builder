import { BaseGearAffix } from "../gear_data_types";

export const HELMET_INT_CORROSION_BASE_AFFIXES = [
  {
    equipmentSlot: "Helmet",
    equipmentType: "Helmet (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "(-50--30)% Cursed Effect",
  },
  {
    equipmentSlot: "Helmet",
    equipmentType: "Helmet (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(10-15)% Sealed Mana Compensation",
  },
  {
    equipmentSlot: "Helmet",
    equipmentType: "Helmet (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(15-20)% Max Energy Shield",
  },
  {
    equipmentSlot: "Helmet",
    equipmentType: "Helmet (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(15-20)% Max Life",
  },
  {
    equipmentSlot: "Helmet",
    equipmentType: "Helmet (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(30-50)% gear Energy Shield",
  },
  {
    equipmentSlot: "Helmet",
    equipmentType: "Helmet (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(50-70)% damage",
  },
  {
    equipmentSlot: "Helmet",
    equipmentType: "Helmet (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "Immune to Blinding\nImmune to Paralysis",
  },
  {
    equipmentSlot: "Helmet",
    equipmentType: "Helmet (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "Max Focus Blessing Stacks +1",
  },
  {
    equipmentSlot: "Helmet",
    equipmentType: "Helmet (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix:
      "Triggers Lv. (15-20) Timid Curse upon inflicting damage. Cooldown: 0.3 s",
  },
  {
    equipmentSlot: "Helmet",
    equipmentType: "Helmet (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix:
      "Triggers Lv. (15-20) Entangled Pain Curse upon inflicting damage. Cooldown: 0.3 s",
  },
] as const satisfies readonly BaseGearAffix[];

export type HelmetIntCorrosionBaseAffix =
  (typeof HELMET_INT_CORROSION_BASE_AFFIXES)[number];
