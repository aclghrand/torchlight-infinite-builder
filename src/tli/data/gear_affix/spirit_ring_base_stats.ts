import { BaseGearAffix } from "../gear_data_types";

export const SPIRIT_RING_BASE_STATS_AFFIXES = [
  {
    equipmentSlot: "Trinket",
    equipmentType: "Spirit Ring",
    affixType: "Base Stats",
    craftingPool: "",
    tier: "",
    craftableAffix: "+12% Minion Damage",
  },
  {
    equipmentSlot: "Trinket",
    equipmentType: "Spirit Ring",
    affixType: "Base Stats",
    craftingPool: "",
    tier: "",
    craftableAffix: "+18% Minion Damage",
  },
  {
    equipmentSlot: "Trinket",
    equipmentType: "Spirit Ring",
    affixType: "Base Stats",
    craftingPool: "",
    tier: "",
    craftableAffix: "+24% Minion Damage",
  },
  {
    equipmentSlot: "Trinket",
    equipmentType: "Spirit Ring",
    affixType: "Base Stats",
    craftingPool: "",
    tier: "",
    craftableAffix: "+3% Minion Damage",
  },
  {
    equipmentSlot: "Trinket",
    equipmentType: "Spirit Ring",
    affixType: "Base Stats",
    craftingPool: "",
    tier: "",
    craftableAffix: "+5% Minion Damage",
  },
  {
    equipmentSlot: "Trinket",
    equipmentType: "Spirit Ring",
    affixType: "Base Stats",
    craftingPool: "",
    tier: "",
    craftableAffix: "+8% Minion Damage",
  },
] as const satisfies readonly BaseGearAffix[];

export type SpiritRingBaseStatsAffix =
  (typeof SPIRIT_RING_BASE_STATS_AFFIXES)[number];
