import { BaseGearAffix } from "../gear_data_types";

export const CHEST_ARMOR_INT_CORROSION_BASE_AFFIXES = [
  {
    equipmentSlot: "Chest Armor",
    equipmentType: "Chest Armor (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "(-6--4)% additional Physical Damage taken",
  },
  {
    equipmentSlot: "Chest Armor",
    equipmentType: "Chest Armor (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix:
      "+(10-15)% Attack and Spell Block Chance while standing still",
  },
  {
    equipmentSlot: "Chest Armor",
    equipmentType: "Chest Armor (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(15-20)% Max Energy Shield",
  },
  {
    equipmentSlot: "Chest Armor",
    equipmentType: "Chest Armor (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(15-20)% Max Life",
  },
  {
    equipmentSlot: "Chest Armor",
    equipmentType: "Chest Armor (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(3-5)% Max Elemental Resistance",
  },
  {
    equipmentSlot: "Chest Armor",
    equipmentType: "Chest Armor (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(30-50)% gear Energy Shield",
  },
  {
    equipmentSlot: "Chest Armor",
    equipmentType: "Chest Armor (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(50-70)% damage",
  },
  {
    equipmentSlot: "Chest Armor",
    equipmentType: "Chest Armor (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(8-10)% Elemental and Erosion Resistance",
  },
  {
    equipmentSlot: "Chest Armor",
    equipmentType: "Chest Armor (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+1 Support Skill Level",
  },
  {
    equipmentSlot: "Chest Armor",
    equipmentType: "Chest Armor (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+2 Active Skill Level",
  },
  {
    equipmentSlot: "Chest Armor",
    equipmentType: "Chest Armor (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "50% chance to gain Hardened when you are hit",
  },
  {
    equipmentSlot: "Chest Armor",
    equipmentType: "Chest Armor (INT)",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "Immune to Elemental Ailments",
  },
] as const satisfies readonly BaseGearAffix[];

export type ChestArmorIntCorrosionBaseAffix =
  (typeof CHEST_ARMOR_INT_CORROSION_BASE_AFFIXES)[number];
