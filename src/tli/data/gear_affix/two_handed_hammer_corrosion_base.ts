import { BaseGearAffix } from "../gear_data_types";

export const TWO_HANDED_HAMMER_CORROSION_BASE_AFFIXES = [
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Two-Handed Hammer",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(1-2) Main Skill Level",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Two-Handed Hammer",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(10-15)% Skill Area",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Two-Handed Hammer",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(15-25)% gear Physical Damage",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Two-Handed Hammer",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(3-6)% Attack Critical Strike Rating for this gear",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Two-Handed Hammer",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(40-45)% Elemental Damage",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Two-Handed Hammer",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(5-8)% gear Attack Speed",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Two-Handed Hammer",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix:
      "+(6-12)% chance to gain 1 stack of Tenacity Blessing on defeat",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Two-Handed Hammer",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "Adds (7-10) - (14-17) Physical Damage to the gear",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Two-Handed Hammer",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "Damage Penetrates (8-12)% Elemental Resistance",
  },
] as const satisfies readonly BaseGearAffix[];

export type TwoHandedHammerCorrosionBaseAffix =
  (typeof TWO_HANDED_HAMMER_CORROSION_BASE_AFFIXES)[number];
