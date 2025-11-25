import { BaseGearAffix } from "./types";

export const HELMET_INT_CORROSION_BASE_AFFIXES = [
  {
    "equipmentTypeKey": "helmet_int",
    "equipmentSlot": "Helmet",
    "equipmentType": "Helmet (INT)",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "{0}% Cursed Effect",
    "valueRanges": [
      {
        "min": -50,
        "max": -30
      }
    ],
    "rawAffix": "`(-50--30)`% Cursed Effect"
  },
  {
    "equipmentTypeKey": "helmet_int",
    "equipmentSlot": "Helmet",
    "equipmentType": "Helmet (INT)",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "+{0}% Sealed Mana Compensation",
    "valueRanges": [
      {
        "min": 10,
        "max": 15
      }
    ],
    "rawAffix": "`+(10-15)`% Sealed Mana Compensation"
  },
  {
    "equipmentTypeKey": "helmet_int",
    "equipmentSlot": "Helmet",
    "equipmentType": "Helmet (INT)",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "+{0}% Max Energy Shield",
    "valueRanges": [
      {
        "min": 15,
        "max": 20
      }
    ],
    "rawAffix": "`+(15-20)`% Max Energy Shield"
  },
  {
    "equipmentTypeKey": "helmet_int",
    "equipmentSlot": "Helmet",
    "equipmentType": "Helmet (INT)",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "+{0}% Max Life",
    "valueRanges": [
      {
        "min": 15,
        "max": 20
      }
    ],
    "rawAffix": "`+(15-20)`% Max Life"
  },
  {
    "equipmentTypeKey": "helmet_int",
    "equipmentSlot": "Helmet",
    "equipmentType": "Helmet (INT)",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "+{0}% gear Energy Shield",
    "valueRanges": [
      {
        "min": 30,
        "max": 50
      }
    ],
    "rawAffix": "`+(30-50)`% gear Energy Shield"
  },
  {
    "equipmentTypeKey": "helmet_int",
    "equipmentSlot": "Helmet",
    "equipmentType": "Helmet (INT)",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "+{0}% damage",
    "valueRanges": [
      {
        "min": 50,
        "max": 70
      }
    ],
    "rawAffix": "`+(50-70)`% damage"
  },
  {
    "equipmentTypeKey": "helmet_int",
    "equipmentSlot": "Helmet",
    "equipmentType": "Helmet (INT)",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "Immune to Blinding\nImmune to Paralysis",
    "valueRanges": [],
    "rawAffix": "Immune to Blinding<> Immune to Paralysis"
  },
  {
    "equipmentTypeKey": "helmet_int",
    "equipmentSlot": "Helmet",
    "equipmentType": "Helmet (INT)",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "Max Focus Blessing Stacks +1",
    "valueRanges": [],
    "rawAffix": "Max Focus Blessing Stacks `+1`"
  },
  {
    "equipmentTypeKey": "helmet_int",
    "equipmentSlot": "Helmet",
    "equipmentType": "Helmet (INT)",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "Triggers Lv. {0}Timid Curse upon inflicting damage. Cooldown: 0.3s",
    "valueRanges": [
      {
        "min": 15,
        "max": 20
      }
    ],
    "rawAffix": "Triggers Lv. `(15-20)`Timid Curse upon inflicting damage. Cooldown: `0.3`s"
  },
  {
    "equipmentTypeKey": "helmet_int",
    "equipmentSlot": "Helmet",
    "equipmentType": "Helmet (INT)",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "Triggers Lv. {0}Entangled Pain Curse upon inflicting damage. Cooldown: 0.3s",
    "valueRanges": [
      {
        "min": 15,
        "max": 20
      }
    ],
    "rawAffix": "Triggers Lv. `(15-20)`Entangled Pain Curse upon inflicting damage. Cooldown: `0.3`s"
  }
] as const satisfies readonly BaseGearAffix[];

export type HelmetIntCorrosionBaseAffix = (typeof HELMET_INT_CORROSION_BASE_AFFIXES)[number];
