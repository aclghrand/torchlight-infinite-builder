import type { HeroTraitName } from "@/src/data/hero_trait";
import type { Mod } from "../mod";

type ModFactory = (levelIndex: number) => Mod;

const heroTraitModFactories: Partial<Record<HeroTraitName, ModFactory[]>> = {
  // Rosa 2
  "Unsullied Blade": [() => ({ type: "SpellDmgBonusAppliesToAtkDmg" })],
  "Baptism of Purity": [
    () => ({ type: "MaxManaPct", value: 20, addn: true }),
    (i) => ({
      type: "MercuryBaptismDmgPct",
      value: [12, 20, 28, 36, 44][i],
    }),
  ],
  "Cleanse Filth": [
    (i) => ({
      type: "DmgPct",
      value: [3, 3.5, 4, 4.5, 5][i],
      dmgModType: "elemental",
      addn: true,
      per: {
        stackable: "max_mana",
        valueLimit: [60, 70, 80, 90, 100][i],
        amt: 1000,
      },
    }),
    () => ({ type: "ManaBeforeLifePct", value: 25, cond: "realm_of_mercury" }),
  ],
  "Utmost Devotion": [
    (i) => ({
      type: "MaxMercuryPtsPct",
      value: 10,
      per: {
        stackable: "max_mana",
        valueLimit: [200, 250, 300, 350, 400][i],
        amt: 1000,
      },
    }),
    (i) => ({
      type: "DmgPct",
      value: [0.12, 0.16, 0.2, 0.24, 0.28][i],
      dmgModType: "elemental",
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

/**
 * Check if a hero trait has a factory implementation.
 */
export const isHeroTraitImplemented = (name: HeroTraitName): boolean => {
  return heroTraitModFactories[name] !== undefined;
};
