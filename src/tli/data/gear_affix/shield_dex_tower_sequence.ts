import { BaseGearAffix } from "../gear_data_types";

export const SHIELD_DEX_TOWER_SEQUENCE_AFFIXES = [
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (DEX)",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix:
      "+15% Armor Effective Rate for Non-Physical Damage\n+2400 Gear Armor",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (DEX)",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix: "+8% Block Ratio Upper limit",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (DEX)",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix:
      "All Passive Skill slots are supported by Lv. 30 Precise: Restrain",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (DEX)",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix:
      "Converts 25% of Physical Damage taken to random Elemental Damage\n-25% Defense",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (DEX)",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix:
      "Energy Shield starts to Charge when Blocking\n+40% Energy Shield Charge Speed",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (DEX)",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix: "Immune to crowd control effects",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (DEX)",
    affixType: "Tower Sequence",
    craftingPool: "Advanced",
    tier: "",
    craftableAffix:
      "Spell Damage will not further reduce Evasion by default\n+1680 gear Evasion",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (DEX)",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+10% Attack and Spell Block Chance",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (DEX)",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+12% Movement Speed",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (DEX)",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+15% Max Life and Max Mana",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (DEX)",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+40% Defense from Shield",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (DEX)",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+40% Critical Strike Damage",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (DEX)",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+8% Elemental Resistance",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (DEX)",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+8% all stats",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (DEX)",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "+80% Critical Strike Rating",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (DEX)",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "Restores 3% Energy Shield on Block. Interval: 0.3s",
  },
  {
    equipmentSlot: "Shield",
    equipmentType: "Shield (DEX)",
    affixType: "Tower Sequence",
    craftingPool: "Intermediate",
    tier: "",
    craftableAffix: "Restores 3% Life on Block. Interval: 0.3s",
  },
] as const satisfies readonly BaseGearAffix[];

export type ShieldDexTowerSequenceAffix =
  (typeof SHIELD_DEX_TOWER_SEQUENCE_AFFIXES)[number];
