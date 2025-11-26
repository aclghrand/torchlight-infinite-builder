import { BaseGearAffix } from "../gear_data_types";

export const SCEPTER_TOWER_SEQUENCE_AFFIXES = [
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Scepter",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix:
      "+120% Deep Pain Aura\n-20% additional Deep Pain Sealed Mana Compensation",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Scepter",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix: "+160 Affliction inflicted per second",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Scepter",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix:
      "+25% Movement Speed when standing on a Terra Skill. The effect lasts 2 s.\n+100% Skill Area when standing on a Terra Skill. Lasts for 2 s",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Scepter",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix:
      "Enemies have a 15% chance to explode when defeated by an Attack or Spell, dealing Secondary Physical Damage equal to 25% of their Max Life to enemies within a 5 m radius",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Scepter",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix: "Main Skill is supported by Lv. 25 Cataclysm",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Scepter",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix:
      "Max Tenacity Blessing Stacks +1\nMax Focus Blessing Stacks -1\nMax Agility Blessing Stacks +1",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Scepter",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix: "Triggers Lv. 30 Black Hole when moving. Interval: 1.5 s",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Scepter",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix:
      "Upon inflicting damage, +5% additional Ailment Damage (multiplies) for every type of Ailment the enemy has",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Scepter",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "-10% All Resistance when the enemy has max Affliction",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Scepter",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+12% Ailment Duration",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Scepter",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+12% Movement Speed",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Scepter",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix:
      "+16 Affliction inflicted per second\n+24% Affliction Effect",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Scepter",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+25% Reaping Cooldown Recovery Speed",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Scepter",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+30% Reaping Duration",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Scepter",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+8% Blur Effect",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Scepter",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+8% all stats",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Scepter",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+8% additional Damage Over Time",
  },
  {
    equipmentSlot: "One-Handed",
    equipmentType: "Scepter",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "Max Terra Charge Stacks -1\nMax Terra Quantity +1",
  },
] as const satisfies readonly BaseGearAffix[];

export type ScepterTowerSequenceAffix =
  (typeof SCEPTER_TOWER_SEQUENCE_AFFIXES)[number];
