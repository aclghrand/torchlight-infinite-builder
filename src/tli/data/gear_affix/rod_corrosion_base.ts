import { BaseGearAffix } from "../gear_data_types";

export const ROD_CORROSION_BASE_AFFIXES = [
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Rod",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(10-16)% Cast Speed",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Rod",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(20-30)% Minion Damage",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Rod",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(25-32)% Minion Critical Strike Damage",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Rod",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(30-40)% Minion Critical Strike Rating",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Rod",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix:
      "+(4-8)% chance to gain 1 stack of Focus Blessing on defeat",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Rod",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix:
      "+(5-8)% chance to trigger the Main Spell Skill 1 additional time when using it",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Rod",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix:
      "+(5-8)% Elemental and Erosion Resistance Penetration for Minions",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Rod",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(6-10)% Cooldown Recovery Speed",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Rod",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "Adds (5-8)% of Elemental Damage as Erosion Damage",
  },
] as const satisfies readonly BaseGearAffix[];

export type RodCorrosionBaseAffix = (typeof ROD_CORROSION_BASE_AFFIXES)[number];
