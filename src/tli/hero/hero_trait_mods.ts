import type { HeroTraitName } from "@/src/data/hero_trait";
import type { Mod } from "../mod";

type ModFactory = (levelIndex: number) => Mod[];

const heroTraitModFactories: Partial<Record<HeroTraitName, ModFactory>> = {
  // Escapist Bing: Creative Genius (#2)
  "Creative Genius": () => [{ type: "MaxSpellBurst", value: 1 }],
  "Inspiration Overflow": (i) => [
    { type: "RestoreWhimsyEssenceOnSpellBurst", value: 5 },
    {
      type: "RestoreWhimsyEssenceOnSpellBurst",
      value: 6,
      per: { stackable: "max_spell_burst", amt: 3 },
    },
    {
      type: "SpellBurstAdditionalDmgPct",
      value: [20, 25, 30, 35, 40][i],
      dmgModType: "spell",
    },
  ],
  "Auto-Ingenuity Program": (i) => [
    { type: "WhimsyEssenceRecoverySpeedPct", value: [-10, -5, 0, 5, 10][i] },
  ],
  "Hyper-Resonance Hypothesis": (i) => [
    {
      type: "SpellBurstChargeSpeedPct",
      addn: true,
      value: [15, 19, 23, 27, 31][i],
    },
  ],
  // Oracle Thea: Blasphemer (#3)
  Blasphemer: () => [{ type: "Blasphemer" }],
  "Unholy Baptism": (i) => [
    {
      type: "DmgPct",
      addn: true,
      value: [5, 10, 15, 20, 25][i],
      dmgModType: "erosion",
    },
  ],
  "Onset of Depravity": () => [
    {
      type: "EnemyRes",
      resType: "erosion",
      value: -10,
      cond: "enemy_has_desecration_and_cc",
    },
  ],
  // todo: too lazy to add conditional on hitting desecrated target for now
  "Tarnished Sage": (i) => [
    { type: "AspdPct", addn: false, value: [10, 15, 20, 25, 30][i] },
    { type: "CspdPct", addn: false, value: [10, 15, 20, 25, 30][i] },
    { type: "MovementSpeedPct", addn: false, value: [10, 15, 20, 25, 30][i] },
  ],
  // Rosa 2
  "Unsullied Blade": () => [{ type: "SpellDmgBonusAppliesToAtkDmg" }],
  "Baptism of Purity": (i) => [
    { type: "MaxManaPct", value: 20, addn: true },
    { type: "MercuryBaptismDmgPct", value: [12, 20, 28, 36, 44][i] },
  ],
  "Cleanse Filth": (i) => [
    {
      type: "DmgPct",
      value: [3, 3.5, 4, 4.5, 5][i],
      dmgModType: "elemental",
      addn: true,
      per: {
        stackable: "max_mana",
        valueLimit: [60, 70, 80, 90, 100][i],
        amt: 1000,
      },
    },
    { type: "ManaBeforeLifePct", value: 25, cond: "realm_of_mercury" },
  ],
  "Utmost Devotion": (i) => [
    {
      type: "MaxMercuryPtsPct",
      value: 10,
      per: {
        stackable: "max_mana",
        valueLimit: [200, 250, 300, 350, 400][i],
        amt: 1000,
      },
    },
    {
      type: "DmgPct",
      value: [0.12, 0.16, 0.2, 0.24, 0.28][i],
      dmgModType: "elemental",
      addn: true,
      per: { stackable: "mercury_pt" },
    },
  ],
};

export const getHeroTraitMods = (name: HeroTraitName, level: number): Mod[] => {
  const mods = heroTraitModFactories[name]?.(level - 1) ?? [];
  return mods.map((mod) => ({ ...mod, src: `HeroTrait: ${name} Lv.${level}` }));
};

/**
 * Check if a hero trait has a factory implementation.
 */
export const isHeroTraitImplemented = (name: HeroTraitName): boolean => {
  return heroTraitModFactories[name] !== undefined;
};
