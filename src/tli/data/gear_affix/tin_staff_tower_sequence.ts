import { BaseGearAffix } from "../gear_data_types";

export const TIN_STAFF_TOWER_SEQUENCE_AFFIXES = [
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Tin Staff",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix:
      "+200% Spell Amplification Aura\n-30% additional Spell Amplification Sealed Mana Compensation",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Tin Staff",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix:
      "+30% additional Deterioration Damage\n10% chance to inflict 2 additional stack(s) of Deterioration",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Tin Staff",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix: "+50% additional Hit Damage for skills cast by Spell Burst",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Tin Staff",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix: "+70% additional damage\n-10% additional Cast Speed",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Tin Staff",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix:
      "Adds 420 - 440 Cold Damage to Spells when having at least 800 Intelligence",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Tin Staff",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix:
      "Enemies have a 30% chance to explode when defeated by an Attack or Spell, dealing Secondary Physical Damage equal to 25% of their Max Life to enemies within a 5 m radius",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Tin Staff",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix:
      "Max Tenacity Blessing Stacks -2\nMax Focus Blessing Stacks +2\nMax Agility Blessing Stacks +2",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Tin Staff",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix:
      "The Main Skill is supported by Lv. 25 Control Spell\n+25% additional Spell Damage",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Tin Staff",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+110 Spell Critical Strike Rating",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Tin Staff",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+12% Armor DMG Mitigation Penetration",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Tin Staff",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+16% all stats",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Tin Staff",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+16% additional Spell Damage",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Tin Staff",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+16% Cold Penetration",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Tin Staff",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+16% Erosion Resistance Penetration",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Tin Staff",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+16% Fire Penetration",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Tin Staff",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+16% Lightning Penetration",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Tin Staff",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+20% additional damage on Critical Strike",
  },
  {
    equipmentSlot: "Two-Handed",
    equipmentType: "Tin Staff",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+32% Cast Speed",
  },
] as const satisfies readonly BaseGearAffix[];

export type TinStaffTowerSequenceAffix =
  (typeof TIN_STAFF_TOWER_SEQUENCE_AFFIXES)[number];
