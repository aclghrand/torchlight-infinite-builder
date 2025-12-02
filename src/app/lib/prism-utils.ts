import { Prisms } from "@/src/data/prism/prisms";
import type { PrismRarity } from "./save-data";

export interface PrismAffix {
  type: string;
  rarity: string;
  affix: string;
}

export const getBaseAffixes = (rarity: PrismRarity): PrismAffix[] => {
  const prefix = rarity === "rare" ? "Adds" : "Replaces";
  return Prisms.filter(
    (p) => p.type === "Base Affix" && p.affix.startsWith(prefix),
  );
};

export const getRareGaugeAffixes = (): PrismAffix[] => {
  return Prisms.filter((p) => p.type === "Prism Gauge" && p.rarity === "Rare");
};

export const getLegendaryGaugeAffixes = (): PrismAffix[] => {
  return Prisms.filter(
    (p) => p.type === "Prism Gauge" && p.rarity === "Legendary",
  );
};

export const getMaxRareGaugeAffixes = (): number => 2;

export const getMaxLegendaryGaugeAffixes = (rarity: PrismRarity): number =>
  rarity === "legendary" ? 1 : 0;

export const getMaxTotalGaugeAffixes = (rarity: PrismRarity): number =>
  getMaxRareGaugeAffixes() + getMaxLegendaryGaugeAffixes(rarity);
