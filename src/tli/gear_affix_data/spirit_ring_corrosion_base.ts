import { BaseGearAffix } from "./types";

export const SPIRIT_RING_CORROSION_BASE_AFFIXES = [
  {
    "equipmentTypeKey": "spirit_ring",
    "equipmentSlot": "Trinket",
    "equipmentType": "Spirit Ring",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "+{0}% Max Energy Shield",
    "valueRanges": [
      {
        "min": 15,
        "max": 25
      }
    ],
    "rawAffix": "`+(15-25)`% Max Energy Shield"
  },
  {
    "equipmentTypeKey": "spirit_ring",
    "equipmentSlot": "Trinket",
    "equipmentType": "Spirit Ring",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "+{0}% Max Life",
    "valueRanges": [
      {
        "min": 15,
        "max": 25
      }
    ],
    "rawAffix": "`+(15-25)`% Max Life"
  },
  {
    "equipmentTypeKey": "spirit_ring",
    "equipmentSlot": "Trinket",
    "equipmentType": "Spirit Ring",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "+{0}% Elemental Resistance",
    "valueRanges": [
      {
        "min": 5,
        "max": 6
      }
    ],
    "rawAffix": "`+(5-6)`% Elemental Resistance"
  },
  {
    "equipmentTypeKey": "spirit_ring",
    "equipmentSlot": "Trinket",
    "equipmentType": "Spirit Ring",
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
    "equipmentTypeKey": "spirit_ring",
    "equipmentSlot": "Trinket",
    "equipmentType": "Spirit Ring",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "+{0}% Attack Speed",
    "valueRanges": [
      {
        "min": 6,
        "max": 8
      }
    ],
    "rawAffix": "`+(6-8)`% Attack Speed"
  },
  {
    "equipmentTypeKey": "spirit_ring",
    "equipmentSlot": "Trinket",
    "equipmentType": "Spirit Ring",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "+{0}% Cast Speed",
    "valueRanges": [
      {
        "min": 6,
        "max": 8
      }
    ],
    "rawAffix": "`+(6-8)`% Cast Speed"
  },
  {
    "equipmentTypeKey": "spirit_ring",
    "equipmentSlot": "Trinket",
    "equipmentType": "Spirit Ring",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "+{0}% Dexterity",
    "valueRanges": [
      {
        "min": 8,
        "max": 10
      }
    ],
    "rawAffix": "`+(8-10)`% Dexterity"
  },
  {
    "equipmentTypeKey": "spirit_ring",
    "equipmentSlot": "Trinket",
    "equipmentType": "Spirit Ring",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "+{0}% Intelligence",
    "valueRanges": [
      {
        "min": 8,
        "max": 10
      }
    ],
    "rawAffix": "`+(8-10)`% Intelligence"
  },
  {
    "equipmentTypeKey": "spirit_ring",
    "equipmentSlot": "Trinket",
    "equipmentType": "Spirit Ring",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "+{0}% Strength",
    "valueRanges": [
      {
        "min": 8,
        "max": 10
      }
    ],
    "rawAffix": "`+(8-10)`% Strength"
  },
  {
    "equipmentTypeKey": "spirit_ring",
    "equipmentSlot": "Trinket",
    "equipmentType": "Spirit Ring",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "+5% Movement Speed",
    "valueRanges": [],
    "rawAffix": "`+5`% Movement Speed"
  },
  {
    "equipmentTypeKey": "spirit_ring",
    "equipmentSlot": "Trinket",
    "equipmentType": "Spirit Ring",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "+5% XP earned",
    "valueRanges": [],
    "rawAffix": "`+5`% XP earned"
  },
  {
    "equipmentTypeKey": "spirit_ring",
    "equipmentSlot": "Trinket",
    "equipmentType": "Spirit Ring",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "Immune to Trauma\nImmune to Wilt",
    "valueRanges": [],
    "rawAffix": "Immune to Trauma<> Immune to Wilt"
  },
  {
    "equipmentTypeKey": "spirit_ring",
    "equipmentSlot": "Trinket",
    "equipmentType": "Spirit Ring",
    "affixType": "Corrosion Base",
    "craftingPool": "",
    "tier": "0",
    "template": "Immune to curse",
    "valueRanges": [],
    "rawAffix": "Immune to curse"
  }
] as const satisfies readonly BaseGearAffix[];

export type SpiritRingCorrosionBaseAffix = (typeof SPIRIT_RING_CORROSION_BASE_AFFIXES)[number];
