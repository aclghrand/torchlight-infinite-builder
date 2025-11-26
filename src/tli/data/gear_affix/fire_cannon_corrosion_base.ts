import { BaseGearAffix } from "../gear_data_types";

export const FIRE_CANNON_CORROSION_BASE_AFFIXES = [
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Fire Cannon",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix:
      "-30% additional Damage Over Time taken while standing still",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Fire Cannon",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(10-15)% Skill Area",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Fire Cannon",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(15-25)% gear Physical Damage",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Fire Cannon",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(3-6)% Attack Critical Strike Rating for this gear",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Fire Cannon",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(40-45)% Elemental Damage",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Fire Cannon",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "+(5-8)% gear Attack Speed",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Fire Cannon",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix:
      "+(6-12)% chance to gain 1 stack of Tenacity Blessing on defeat",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Fire Cannon",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "Adds (7-10) - (14-17) Physical Damage to the gear",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Fire Cannon",
    affixType: "Corrosion Base",
    craftingPool: "",
    tier: "0",
    craftableAffix: "Parabolic Projectile Splits quantity +(1-2)",
  },
] as const satisfies readonly BaseGearAffix[];

export type FireCannonCorrosionBaseAffix =
  (typeof FIRE_CANNON_CORROSION_BASE_AFFIXES)[number];
