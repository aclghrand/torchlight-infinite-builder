import type { HeroTraitName } from "@/src/data/hero_trait";
import type { Mod } from "../mod";

type ModFactory = (levelIndex: number) => Mod;

const heroTraitModFactories: Partial<Record<HeroTraitName, ModFactory[]>> = {
  // Rosa 2
  "Unsullied Blade": [() => ({ type: "SpellDmgBonusAppliesToAtkDmg" })],
  "Baptism of Purity": [
    () => ({ type: "MaxManaPct", value: 0.2, addn: true }),
    (i) => ({
      type: "MercuryBaptism",
      value: [0.12, 0.2, 0.28, 0.36, 0.44][i],
    }),
  ],
  "Cleanse Filth": [
    (i) => ({
      type: "DmgPct",
      value: [0.6, 0.7, 0.8, 0.9, 1.0][i],
      modType: "elemental",
      addn: true,
    }),
    () => ({ type: "ManaBeforeLife", value: 0.25, cond: "realm_of_mercury" }),
  ],
  "Utmost Devotion": [
    (i) => ({
      type: "MaxMecuryPtsPct",
      value: 0.1,
      per: { stackable: "mana", valueLimit: [2, 2.5, 3, 3.5, 4][i], amt: 1000 },
    }),
    (i) => ({
      type: "DmgPct",
      value: [0.12, 0.16, 0.2, 0.24, 0.28][i],
      modType: "elemental",
      addn: true,
      per: { stackable: "mercury_pt" },
    }),
  ],
};

export const getHeroTraitMods = (name: HeroTraitName, level: number): Mod[] => {
  const mods = heroTraitModFactories[name]?.map((f) => f(level - 1)) ?? [];
  const modsWithSrc = mods.map((mod) => {
    return { ...mod, src: `HeroTrait: ${name} Lv.${level}` };
  });
  return modsWithSrc;
};
