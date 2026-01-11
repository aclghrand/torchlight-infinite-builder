import * as R from "remeda";
import { match } from "ts-pattern";
import { bing2, type HeroName } from "@/src/data/hero-trait";
import type { PactspiritName } from "@/src/data/pactspirit";
import {
  type ActiveSkillName,
  ActiveSkills,
  type BaseActiveSkill,
  type BasePassiveSkill,
  type BaseSkill,
  type BaseSupportSkill,
  type ImplementedActiveSkillName,
  type PassiveSkillName,
  PassiveSkills,
  SupportSkills,
} from "../../data/skill";
import type { DmgModType } from "../constants";
import type {
  ActivationMediumSkillSlot,
  BaseSupportSkillSlot,
  Configuration,
  DmgRange,
  Gear,
  Loadout,
  MagnificentSupportSkillSlot,
  NobleSupportSkillSlot,
  SkillSlot,
} from "../core";
import type { EquipmentType } from "../gear-data-types";
import { getHeroTraitMods } from "../hero/hero-trait-mods";
import type {
  DmgChunkType,
  Mod,
  ModT,
  ResType,
  Stackable,
  StatType,
} from "../mod";
import { getActiveSkillMods } from "../skills/active-mods";
import { getPassiveSkillMods } from "../skills/passive-mods";
import { buildSupportSkillAffixes } from "../storage/load-save";
import {
  addDRs,
  applyDmgBonusesAndPen,
  calculateAspd,
  calculateCritChance,
  calculateCritDmg,
  calculateDoubleDmgMult,
  calculateExtraOffenseMults,
  calculateFlatDmg,
  calculateGearDmg,
  convertDmg,
  type DmgChunk,
  type DmgPools,
  type DmgRanges,
  dmgModTypesForSkill,
  emptyDmgRanges,
  multDRs,
  type NumDmgValues,
} from "./damage-calc";
import {
  calcEffMult,
  calculateAddn,
  collectMods,
  collectModsFromAffixes,
  filterMods,
  filterModsByCondThreshold,
  filterOutPerMods,
  findMod,
  modExists,
  normalizeStackables,
  pushNormalizedStackable,
  sumByValue,
} from "./mod-utils";
import type { OffenseSkillName } from "./skill-confs";
import { type ModWithValue, multModValue, multValue } from "./util";

// Re-export types that consumers expect from offense.ts
export type { DmgChunk, DmgPools, DmgRanges };
export { collectMods, convertDmg };

export interface WeaponAttackSummary {
  critChance: number;
  aspd: number;
  avgHit: number;
  avgHitWithCrit: number;
}

export interface OffenseAttackDpsSummary {
  mainhand: WeaponAttackSummary;
  offhand?: WeaponAttackSummary;
  critDmgMult: number;
  avgDps: number;
  multistrikeChancePct: number;
  multistrikeIncDmgPct: number;
}

interface SlashStrikeModeStats {
  mainhand: WeaponAttackSummary;
  offhand?: WeaponAttackSummary;
  avgDps: number;
}

export interface OffenseSlashStrikeDpsSummary {
  sweep: SlashStrikeModeStats;
  steep: SlashStrikeModeStats;
  steepStrikeChancePct: number;
  critDmgMult: number;
  avgDps: number;
  multistrikeChancePct: number;
  multistrikeIncDmgPct: number;
}

interface OffenseSummary {
  attackDpsSummary?: OffenseAttackDpsSummary;
  slashStrikeDpsSummary?: OffenseSlashStrikeDpsSummary;
  spellDpsSummary?: OffenseSpellDpsSummary;
  spellBurstDpsSummary?: OffenseSpellBurstDpsSummary;
  persistentDpsSummary?: PersistentDpsSummary;
  totalReapDpsSummary?: TotalReapDpsSummary;
  totalDps: number;
  movementSpeedBonusPct: number;
  resolvedMods: Mod[];
}

// === Stats Types and Calculations ===

interface Stats {
  str: number;
  dex: number;
  int: number;
}

// todo: very basic stat calculation, will definitely need to handle things like pct, per, and conditionals
const calculateStats = (mods: Mod[]): Stats => {
  const statMods = filterMods(mods, "Stat");
  const statPctMods = filterMods(mods, "StatPct");
  const calcFinalStat = (statType: StatType): number => {
    const flat = sumByValue(
      statMods.filter(
        (m) => m.statModType === statType || m.statModType === "all",
      ),
    );
    const mult =
      1 +
      sumByValue(
        statPctMods.filter(
          (m) => m.statModType === statType || m.statModType === "all",
        ),
      ) /
        100;
    return flat * mult;
  };
  return {
    str: calcFinalStat("str"),
    dex: calcFinalStat("dex"),
    int: calcFinalStat("int"),
  };
};

const calculateTotalMainStats = (
  skill: BaseActiveSkill | BasePassiveSkill,
  stats: Stats,
): number => {
  const mainStats = skill.mainStats ?? [];
  let totalMainStats = 0;
  for (const mainStatType of mainStats) {
    totalMainStats += stats[mainStatType];
  }
  return totalMainStats;
};

const calculateDefenseStat = (
  mods: Mod[],
  gearFlatModType: "GearEnergyShield" | "GearArmor" | "GearEvasion",
  gearPctModType: "GearEnergyShieldPct" | "GearArmorPct" | "GearEvasionPct",
  finalFlatModType: "MaxEnergyShield" | "Armor" | "Evasion",
  finalPctModType: "MaxEnergyShieldPct" | "ArmorPct" | "EvasionPct",
): number => {
  // Sum up the flat mods on each item then multiply by the gear percentage mods
  // The gear total is then multiplied by all other multiplicaiton mods (talents etc...)

  const gearFlat = sumByValue(filterMods(mods, gearFlatModType));
  const gearPctMult = calcEffMult(mods, gearPctModType);
  const totalFromGear = gearFlat * gearPctMult;

  const finalFlat = sumByValue(filterMods(mods, finalFlatModType));
  const finalPctMult = calcEffMult(mods, finalPctModType);
  const finalValue = (totalFromGear + finalFlat) * finalPctMult;

  return Math.max(0, finalValue);
};

// === Resource Pool Types ===

export interface ResourcePool {
  stats: Stats;
  maxLife: number;
  maxMana: number;
  energyShield: number;
  armor: number;
  evasion: number;
  mercuryPts?: number;
  focusBlessings: number;
  maxFocusBlessings: number;
  agilityBlessings: number;
  maxAgilityBlessings: number;
  tenacityBlessings: number;
  maxTenacityBlessings: number;
  desecration?: number;
  additionalMaxChanneledStacks: number;
  hasFervor: boolean;
  fervorPts: number;
}

// === Defense Types ===

export interface Resistance {
  max: number;
  potential: number;
  actual: number;
}

export interface Defenses {
  coldRes: Resistance;
  lightningRes: Resistance;
  fireRes: Resistance;
  erosionRes: Resistance;
  attackBlockPct: number;
  spellBlockPct: number;
  blockRatioPct: number;
}

// === Blessing Calculations ===

const calcNumFocus = (maxFocus: number, config: Configuration): number => {
  if (config.focusBlessings !== undefined) {
    return config.focusBlessings;
  }
  return maxFocus;
};

const calcNumAgility = (maxAgility: number, config: Configuration): number => {
  if (config.agilityBlessings !== undefined) {
    return config.agilityBlessings;
  }
  return maxAgility;
};

const calcNumTenacity = (
  maxTenacity: number,
  config: Configuration,
): number => {
  if (config.tenacityBlessings !== undefined) {
    return config.tenacityBlessings;
  }
  return maxTenacity;
};

// === Affliction and Torment ===

const calcAfflictionPts = (config: Configuration): number => {
  return config.afflictionPts ?? 100;
};

const calculateAffliction = (mods: Mod[], config: Configuration): Mod[] => {
  if (config.enemyHasAffliction !== true) {
    return [];
  }
  const afflictionPts = calcAfflictionPts(config);
  const afflictionEffMult = calcEffMult(mods, "AfflictionEffectPct");
  const afflictionValue = afflictionPts * afflictionEffMult;
  return [
    {
      type: "DmgPct",
      value: afflictionValue,
      dmgModType: "damage_over_time",
      addn: true,
      isEnemyDebuff: true,
      src: "Additional Damage over Time from Affliction",
    },
  ];
};

const calculateTorment = (config: Configuration): Mod[] => {
  const tormentMod: Mod = {
    type: "DmgPct",
    value: 5,
    dmgModType: "damage_over_time",
    addn: true,
    per: { stackable: "torment", limit: 3 },
    src: "Additional Damage over Time from Torment (5% per stack)",
  };
  return normalizeStackables([tormentMod], "torment", config.tormentStacks);
};

// === Fervor ===

const calculateFervorCritRateMod = (
  mods: Mod[],
  resourcePool: ResourcePool,
): Mod => {
  const fervorEffMult = calcEffMult(mods, "FervorEffPct");
  const critRatePerPoint = 2 * fervorEffMult;
  const critRateFromFervor = resourcePool.fervorPts * critRatePerPoint;

  return {
    type: "CritRatingPct",
    value: critRateFromFervor,
    modType: "global",
    src: "fervor",
  };
};

const calculateWillpower = (normalizedMods: Mod[]): number => {
  return findMod(normalizedMods, "MaxWillpowerStacks")?.value || 0;
};

// === Hero Trait Mods ===

const calculateHeroTraitMods = (loadout: Loadout): Mod[] => {
  const { traits, memorySlots } = loadout.heroPage;

  const mods: Mod[] = [];
  // Primary traits with their associated memories
  // Secondary traits (for dual-trait heroes) share the same memory slots
  const traitToMemory = [
    { trait: traits.level1, memory: undefined },
    { trait: traits.level45, memory: memorySlots.slot45 },
    { trait: traits.level45b, memory: memorySlots.slot45 },
    { trait: traits.level60, memory: memorySlots.slot60 },
    { trait: traits.level60b, memory: memorySlots.slot60 },
    { trait: traits.level75, memory: memorySlots.slot75 },
    { trait: traits.level75b, memory: memorySlots.slot75 },
  ];
  for (const { trait, memory } of traitToMemory) {
    if (trait !== undefined) {
      const memoryMods = collectModsFromAffixes(memory?.affixes ?? []);
      const addedLevel = findMod(memoryMods, "HeroTraitLevel")?.value ?? 0;
      const level = 3 + addedLevel;
      mods.push(...getHeroTraitMods(trait.name, level));
    }
  }
  return mods;
};

// === Implicit Mods ===

// includes any mods that always apply, but don't come from loadout, like damage from stats, non-skill buffs, etc
const calculateImplicitMods = (): Mod[] => {
  return [
    // dual wield
    {
      type: "AspdPct",
      value: 10,
      addn: true,
      cond: "is_dual_wielding",
      src: "Dual Wielding",
    },
    {
      type: "AttackBlockChancePct",
      value: 30,
      cond: "is_dual_wielding",
      src: "Dual Wielding",
    },
    {
      type: "SpellBlockChancePct",
      value: 30,
      cond: "is_dual_wielding",
      src: "Dual Wielding",
    },
    {
      type: "DmgPct",
      value: 15,
      dmgModType: "global",
      addn: true,
      isEnemyDebuff: true,
      cond: "enemy_paralyzed",
      src: "Additional Damage when enemy paralyzed",
    },
    {
      type: "DmgPct",
      value: 5,
      dmgModType: "global",
      addn: true,
      per: { stackable: "focus_blessing" },
      cond: "has_focus_blessing",
      src: "Additional Damage from focus blessings (5% per blessing)",
    },
    {
      type: "AspdPct",
      value: 4,
      addn: false,
      per: { stackable: "agility_blessing" },
      cond: "has_agility_blessing",
      src: "Attack speed from agility blessings (4% per blessing)",
    },
    {
      type: "CspdPct",
      value: 4,
      addn: false,
      per: { stackable: "agility_blessing" },
      cond: "has_agility_blessing",
      src: "Cast speed from agility blessings (4% per blessing)",
    },
    {
      type: "DmgPct",
      value: 2,
      dmgModType: "global",
      addn: true,
      per: { stackable: "agility_blessing" },
      cond: "has_agility_blessing",
      src: "Additional Damage from agility blessings (2% per blessing)",
    },
    {
      type: "DmgPct",
      value: 15,
      dmgModType: "damage_over_time",
      addn: true,
      per: { stackable: "desecration", multiplicative: true },
      cond: "enemy_has_desecration",
      src: "Additional Damage over TIme from desecration (15% per stack)",
    },
    {
      type: "AspdPct",
      value: 2,
      addn: true,
      per: { stackable: "unsealed_mana_pct", amt: 10 },
      cond: "realm_of_mercury",
      src: "Realm of Mercury",
    },
    {
      type: "DmgPct",
      value: 3,
      dmgModType: "elemental",
      addn: true,
      per: { stackable: "unsealed_mana_pct", amt: 10 },
      cond: "realm_of_mercury",
      src: "Realm of Mercury",
    },
    {
      type: "AspdPct",
      value: 8,
      addn: true,
      cond: "has_hasten",
      src: "Hasten",
    },
    {
      type: "CspdPct",
      value: 8,
      addn: true,
      cond: "has_hasten",
      src: "Hasten",
    },
    {
      type: "MovementSpeedPct",
      value: 8,
      addn: true,
      cond: "has_hasten",
      src: "Hasten",
    },
    {
      type: "MobilitySkillCdrPct",
      value: 8,
      addn: true,
      cond: "has_hasten",
      src: "Hasten",
    },
    // Pactspirit: Portrait of a Fallen Saintess
    {
      type: "DmgPct",
      value: 4,
      addn: true,
      dmgModType: "erosion",
      cond: "has_portrait_of_a_fallen_saintess_pactspirit",
      per: { stackable: "repentance", multiplicative: true },
      src: "Repentance (4% additional dmg per stack, multiplicative)",
    },
  ];
};

interface BaseHitOverview {
  // Damage ranges of a single skill hit, not including crit
  base: {
    physical: DmgRange;
    cold: DmgRange;
    lightning: DmgRange;
    fire: DmgRange;
    erosion: DmgRange;
    total: DmgRange;
  };
  // Average damage of a single skill hit, not including crit
  avg: number;
}

const calcBaseHitOverview = (
  dmgRanges: DmgRanges,
  derivedCtx: DerivedCtx,
): BaseHitOverview => {
  // AddnMinDmgPct/AddnMaxDmgPct are now applied in calculateChunkDmg
  // which properly respects the dmgType property for damage type filtering
  const { physical, cold, lightning, fire, erosion } = dmgRanges;
  const min = physical.min + cold.min + lightning.min + fire.min + erosion.min;
  const max = physical.max + cold.max + lightning.max + fire.max + erosion.max;
  const total = { min, max };
  let avg: number;
  if (derivedCtx.luckyDmg) {
    avg = (min + 2 * max) / 3;
  } else {
    avg = (min + max) / 2;
  }
  return { base: { physical, cold, lightning, fire, erosion, total }, avg };
};

const calculateAddnDmgFromShadows = (
  numShadowHits: number,
): ModT<"DmgPct"> | undefined => {
  if (numShadowHits <= 0) return;
  if (numShadowHits === 1) {
    return {
      type: "DmgPct",
      addn: true,
      value: 100, // 100% additional damage (doubles the hit)
      dmgModType: "global",
      src: `Shadow Strike: ${numShadowHits} hits`,
    };
  }
  const falloffCoefficient = 0.7;

  // Each hit deals (1 - falloff)^i of original, where i is 0-indexed
  // Geometric series: dmgValue * (1 + r + r^2 + ... + r^(n-1)) = dmgValue * (1 - r^n) / (1 - r)
  const retainedRatio = 1 - falloffCoefficient;
  const geometricSum =
    (1 - retainedRatio ** numShadowHits) / falloffCoefficient;

  return {
    type: "DmgPct",
    addn: true,
    value: geometricSum * 100, // Convert to whole percentage
    dmgModType: "global",
    src: `Shadow Strike: ${numShadowHits} hits`,
  };
};

interface SkillHitOverview extends BaseHitOverview {}

const calculateAtkHit = (
  gearDmg: DmgRanges,
  flatDmg: DmgRanges,
  mods: Mod[],
  skill: BaseActiveSkill,
  derivedCtx: DerivedCtx,
  config: Configuration,
  weaponAtkDmgPct: number,
  addedDmgEffPct: number,
): SkillHitOverview => {
  const skillWeaponDR = multDRs(gearDmg, weaponAtkDmgPct / 100);
  const skillFlatDR = multDRs(flatDmg, addedDmgEffPct / 100);
  const skillBaseDmg = addDRs(skillWeaponDR, skillFlatDR);

  const addSpellTag =
    skill.tags.includes("Attack") &&
    findMod(mods, "SpellDmgBonusAppliesToAtkDmg") !== undefined;

  const baseDmgModTypes: DmgModType[] = addSpellTag
    ? [...dmgModTypesForSkill(skill), "spell"]
    : dmgModTypesForSkill(skill);

  const dmgPools = convertDmg(skillBaseDmg, mods);
  const finalDmgRanges = applyDmgBonusesAndPen({
    dmgPools,
    mods,
    baseDmgModTypes,
    config,
    ignoreArmor: false,
  });
  return calcBaseHitOverview(finalDmgRanges, derivedCtx);
};

export interface OffenseInput {
  loadout: Loadout;
  configuration: Configuration;
}

export interface OffenseResults {
  skills: Partial<Record<ImplementedActiveSkillName, OffenseSummary>>;
  resourcePool: ResourcePool;
  defenses: Defenses;
}

interface DerivedCtx {
  hasHasten: boolean;
  hasBlasphemer: boolean;
  hero?: HeroName;
  luckyDmg: boolean;
  dualWielding: boolean;
}

const isOneHandedWeapon = (gear: Gear): boolean => {
  const validEquipmentTypes: EquipmentType[] = [
    "Claw",
    "Dagger",
    "One-Handed Sword",
    "One-Handed Hammer",
    "One-Handed Axe",
    "Wand",
    "Rod",
    "Scepter",
    "Cane",
    "Pistol",
  ];
  return validEquipmentTypes.includes(gear.equipmentType);
};

const resolveDerivedCtx = (loadout: Loadout, mods: Mod[]): DerivedCtx => {
  const hasHasten = findMod(mods, "HasHasten") !== undefined;
  const hasBlasphemer = findMod(mods, "Blasphemer") !== undefined;
  const luckyDmg = findMod(mods, "LuckyDmg") !== undefined;
  const hero = loadout.heroPage.selectedHero;
  const equippedGear = loadout.gearPage.equippedGear;
  const dualWielding =
    equippedGear.mainHand !== undefined &&
    equippedGear.offHand !== undefined &&
    isOneHandedWeapon(equippedGear.mainHand) &&
    isOneHandedWeapon(equippedGear.offHand);
  return { hasHasten, hasBlasphemer, luckyDmg, hero, dualWielding };
};

const hasPactspirit = (name: PactspiritName, loadout: Loadout): boolean => {
  return (
    loadout.pactspiritPage.slot1?.pactspiritName === name ||
    loadout.pactspiritPage.slot2?.pactspiritName === name ||
    loadout.pactspiritPage.slot3?.pactspiritName === name
  );
};

const isHero = (name: HeroName, loadout: Loadout): boolean => {
  return loadout.heroPage.selectedHero === name;
};

const enemyCcd = (config: Configuration) => {
  // todo: update with all cc
  return config.enemyParalyzed || config.enemyFrostbittenEnabled;
};

const filterModsByCond = (
  mods: Mod[],
  loadout: Loadout,
  config: Configuration,
  derivedCtx: DerivedCtx,
): Mod[] => {
  return mods.filter((m) => {
    if (m.cond === undefined) return true;
    return match(m.cond)
      .with("enemy_frostbitten", () => config.enemyFrostbittenEnabled)
      .with(
        "realm_of_mercury",
        () =>
          loadout.heroPage.selectedHero ===
            "Lightbringer Rosa: Unsullied Blade (#2)" &&
          config.realmOfMercuryEnabled,
      )
      .with("has_focus_blessing", () => config.hasFocusBlessing)
      .with("has_agility_blessing", () => config.hasAgilityBlessing)
      .with("has_tenacity_blessing", () => config.hasTenacityBlessing)
      .with("enemy_has_desecration", () => config.enemyHasDesecration)
      .with("enemy_paralyzed", () => config.enemyParalyzed)
      .with("has_full_mana", () => config.hasFullMana)
      .with("target_enemy_is_elite", () => config.targetEnemyIsElite)
      .with("target_enemy_is_nearby", () => config.targetEnemyIsNearby)
      .with(
        "target_enemy_is_in_proximity",
        () => config.targetEnemyIsInProximity,
      )
      .with("has_blocked_recently", () => config.hasBlockedRecently)
      .with("has_elites_nearby", () => config.hasElitesNearby)
      .with("enemy_has_ailment", () => config.enemyHasAilment)
      .with("has_hasten", () => derivedCtx.hasHasten)
      .with("has_crit_recently", () => config.hasCritRecently)
      .with("has_blur", () => config.hasBlur)
      .with("blur_ended_recently", () => config.blurEndedRecently)
      .with("channeling", () => config.channeling)
      .with("sages_insight_fire", () => config.sagesInsightFireActivated)
      .with("sages_insight_cold", () => config.sagesInsightColdActivated)
      .with(
        "sages_insight_lightning",
        () => config.sagesInsightLightningActivated,
      )
      .with("sages_insight_erosion", () => config.sagesInsightErosionActivated)
      .with("at_max_channeled_stacks", () => true)
      .with("enemy_at_max_affliction", () => calcAfflictionPts(config) === 100)
      .with("enemy_is_cursed", () => {
        if (config.targetEnemyIsCursed !== undefined) {
          return config.targetEnemyIsCursed;
        }
        // assume enemy is cursed if we have an enabled curse skill
        return (
          listActiveSkillSlots(loadout)
            .filter((s) => s.enabled && s.skillName !== undefined)
            .map((s) => findActiveSkill(s.skillName as ActiveSkillName))
            .find((s) => s.tags.includes("Curse")) !== undefined
        );
      })
      .with(
        "have_both_sealed_mana_and_life",
        () =>
          (config.sealedManaPct ?? 0) > 0 && (config.sealedLifePct ?? 0) > 0,
      )
      .with(
        // todo: there's gotta be a better way to handle this, right?
        "equipped_in_left_ring_slot",
        () => m.src?.startsWith("Gear#leftRing") ?? false,
      )
      .with(
        "equipped_in_right_ring_slot",
        () => m.src?.startsWith("Gear#rightRing") ?? false,
      )
      .with("has_portrait_of_a_fallen_saintess_pactspirit", () =>
        hasPactspirit("Portrait of a Fallen Saintess", loadout),
      )
      .with(
        "enemy_has_desecration_and_cc",
        () => config.enemyHasDesecration && enemyCcd(config),
      )
      .with(
        "enemy_has_cold_infiltration",
        () => config.targetEnemyHasColdInfiltration,
      )
      .with(
        "enemy_has_lightning_infiltration",
        () => config.targetEnemyHasLightningInfiltration,
      )
      .with(
        "enemy_has_fire_infiltration",
        () => config.targetEnemyHasFireInfiltration,
      )
      .with(
        "target_enemy_frozen_recently",
        () => config.targetEnemyFrozenRecently,
      )
      .with("has_squidnova", () => config.hasSquidnova)
      .with("holding_shield", () => {
        const offhand = loadout.gearPage.equippedGear.offHand?.equipmentType;
        return (
          offhand === "Shield (DEX)" ||
          offhand === "Shield (INT)" ||
          offhand === "Shield (STR)"
        );
      })
      .with("enemy_numbed", () => config.enemyNumbed)
      .with(
        "has_used_mobility_skill_recently",
        () => config.hasUsedMobilitySkillRecently,
      )
      .with("has_moved_recently", () => config.hasMovedRecently)
      .with("has_cast_curse_recently", () => config.hasCastCurseRecently)
      .with("is_dual_wielding", () => derivedCtx.dualWielding)
      .with("has_one_handed_weapon", () => {
        const { mainHand, offHand } = loadout.gearPage.equippedGear;
        return (
          (mainHand !== undefined && isOneHandedWeapon(mainHand)) ||
          (offHand !== undefined && isOneHandedWeapon(offHand))
        );
      })
      .exhaustive();
  });
};

interface FilteredMods {
  prenormMods: Mod[];
  mods: Mod[];
}

const applyModFilters = (
  inputMods: Mod[],
  loadout: Loadout,
  config: Configuration,
  derivedCtx: DerivedCtx,
  withCondThreshold: boolean = true,
): FilteredMods => {
  const condFiltered = filterModsByCond(inputMods, loadout, config, derivedCtx);
  const prenormMods = withCondThreshold
    ? filterModsByCondThreshold(condFiltered, config)
    : condFiltered;
  return { prenormMods, mods: filterOutPerMods(prenormMods) };
};

const listActiveSkillSlots = (loadout: Loadout): SkillSlot[] => {
  // we're sure that SkillSlots properties only has SkillSlot as values
  const slots = Object.values(loadout.skillPage.activeSkills) as (
    | SkillSlot
    | undefined
  )[];
  return slots.filter((s) => s !== undefined);
};

const findActiveSkill = (name: ActiveSkillName): BaseActiveSkill => {
  // ActiveSkillName should be guaranteed to be something within ActiveSkills
  return ActiveSkills.find((s) => s.name === name) as BaseActiveSkill;
};

const listPassiveSkillSlots = (loadout: Loadout): SkillSlot[] => {
  const slots = Object.values(loadout.skillPage.passiveSkills) as (
    | SkillSlot
    | undefined
  )[];
  return slots.filter((s) => s !== undefined);
};

const findSkill = (
  name: ActiveSkillName | PassiveSkillName,
): BaseActiveSkill | BasePassiveSkill => {
  const active = ActiveSkills.find((s) => s.name === name);
  if (active) return active;
  return PassiveSkills.find((s) => s.name === name) as BasePassiveSkill;
};

const calcBuffSkillType = (
  skill: BaseActiveSkill | BasePassiveSkill,
): "aura" | "curse" | "spirit_magus_origin" | "other" => {
  if (skill.type === "Passive" && skill.tags?.includes("Aura")) {
    return "aura";
  }
  if (skill.type === "Active" && skill.tags?.includes("Curse")) {
    return "curse";
  }
  if (skill.type === "Passive" && skill.tags?.includes("Spirit Magus")) {
    return "spirit_magus_origin";
  }
  return "other";
};

// resolves mods coming from skills that provide buffs (levelBuffMods)
// for example, "Bull's Rage" provides a buff that increases all melee damage
const resolveBuffSkillMods = (
  loadout: Loadout,
  loadoutMods: Mod[],
  config: Configuration,
  derivedCtx: DerivedCtx,
): Mod[] => {
  const activeSkillSlots = listActiveSkillSlots(loadout);
  const passiveSkillSlots = listPassiveSkillSlots(loadout);
  const allSkillSlots = [...activeSkillSlots, ...passiveSkillSlots];
  const resolvedMods: Mod[] = [];

  for (const skillSlot of allSkillSlots) {
    if (!skillSlot.enabled || skillSlot.skillName === undefined) {
      continue;
    }

    const skill = findSkill(
      skillSlot.skillName as ActiveSkillName | PassiveSkillName,
    );
    const buffSkillType = calcBuffSkillType(skill);

    // Get support skill mods (includes SkillEffPct, AuraEffPct, etc.)
    const supportMods = resolveSelectedSkillSupportMods(
      skillSlot,
      loadoutMods,
      loadout,
      config,
      derivedCtx,
    );

    // Get level mods from factory based on skill type
    let levelMods: Mod[] = [];
    let rawBuffMods: Mod[] = [];

    const level =
      (skillSlot.level || 20) +
      calculateAddedSkillLevels(
        loadoutMods,
        skill,
        loadout,
        config,
        derivedCtx,
      );
    const buffSrc = `${buffSkillType}: ${skill.name} Lv.${level}`;
    if (skill.type === "Active") {
      const activeMods = getActiveSkillMods(
        skill.name as ActiveSkillName,
        level,
      );
      levelMods =
        activeMods.mods?.map((mod) => ({
          ...mod,
          src: `${skill.name} Lv.${level}`,
        })) ?? [];
      rawBuffMods =
        activeMods.buffMods?.map((mod) => ({ ...mod, src: buffSrc })) ?? [];
    } else if (skill.type === "Passive") {
      const passiveMods = getPassiveSkillMods(
        skill.name as PassiveSkillName,
        level,
      );
      levelMods =
        passiveMods.mods?.map((mod) => ({
          ...mod,
          src: `${skill.name} Lv.${level}`,
        })) ?? [];
      rawBuffMods =
        passiveMods.buffMods?.map((mod) => ({ ...mod, src: buffSrc })) ?? [];
    }

    const prenormMods = [...loadoutMods, ...supportMods, ...levelMods];
    const {
      skillEffMult,
      auraEffMult,
      curseEffMult,
      spiritMagusOriginEffMult,
    } = resolveBuffSkillEffMults(prenormMods, loadout, config, derivedCtx);

    // === Apply multipliers to buff mods ===
    for (const mod of rawBuffMods) {
      // Skip mods without value property (like CoreTalent)
      if (!("value" in mod)) {
        resolvedMods.push(mod);
        continue;
      }

      // Calculate final value
      let finalValue = mod.value;
      if (!("unscalable" in mod && mod.unscalable === true)) {
        if (buffSkillType === "aura") {
          finalValue = multValue(finalValue, auraEffMult);
        } else if (buffSkillType === "curse") {
          finalValue = multValue(finalValue, curseEffMult);
        } else if (buffSkillType === "spirit_magus_origin") {
          finalValue = multValue(finalValue, spiritMagusOriginEffMult);
        } else {
          finalValue = multValue(finalValue, skillEffMult);
        }
      }

      resolvedMods.push({ ...mod, value: finalValue } as Mod);
    }
  }
  return resolvedMods;
};

const resolveSelectedSkillMods = (
  selectedSkillName: OffenseSkillName,
  level: number,
): Mod[] => {
  const skill = findActiveSkill(selectedSkillName);
  const skillMods = getActiveSkillMods(skill.name as ActiveSkillName, level);
  if (skillMods.mods === undefined) {
    return [];
  }
  return skillMods.mods.map((mod) => ({
    ...mod,
    src: `Selected Active Skill: ${skill.name} Lv.${level}`,
  }));
};

type TieredSupportSlot =
  | MagnificentSupportSkillSlot
  | NobleSupportSkillSlot
  | ActivationMediumSkillSlot;

const collectSupportAffixMods = (ss: TieredSupportSlot): Mod[] => {
  const prefix = {
    magnificent_support: "Magnificent",
    noble_support: "Noble",
    activation_medium: "Activation Medium",
  }[ss.skillType];
  const tierPart = ` T${ss.tier}`;
  const rankPart = "rank" in ss ? ` R${ss.rank}` : "";

  const mods: Mod[] = [];
  for (const affix of ss.affixes) {
    for (const { mod } of affix.mods ?? []) {
      mods.push({ ...mod, src: `${prefix}: ${ss.name}${tierPart}${rankPart}` });
    }
  }
  return mods;
};

const resolveNormalSupportSkillMods = (
  ss: { name: string; level?: number },
  loadoutMods: Mod[],
  loadout: Loadout,
  config: Configuration,
  derivedCtx: DerivedCtx,
): Mod[] => {
  const supportSkill = SupportSkills.find((s) => s.name === ss.name) as
    | BaseSupportSkill
    | undefined;
  if (supportSkill === undefined) return [];

  const level =
    (ss.level ?? 20) +
    calculateAddedSkillLevels(
      loadoutMods,
      supportSkill,
      loadout,
      config,
      derivedCtx,
    );

  // Build affixes with the calculated level (includes added skill levels)
  // This ensures level bonuses are properly applied to templated mods
  const ret: Mod[] = [];
  const affixes = buildSupportSkillAffixes(ss.name, level);
  for (const affix of affixes) {
    if (affix.mods !== undefined) {
      for (const { mod } of affix.mods) {
        ret.push({ ...mod, src: `Support: ${ss.name} Lv.${level}` });
      }
    }
  }
  return ret;
};

const resolveSelectedSkillSupportMods = (
  slot: SkillSlot,
  loadoutMods: Mod[],
  loadout: Loadout,
  config: Configuration,
  derivedCtx: DerivedCtx,
): Mod[] => {
  const supportSlots = Object.values(slot.supportSkills) as (
    | BaseSupportSkillSlot
    | undefined
  )[];

  const supportMods: Mod[] = [];
  for (const ss of supportSlots) {
    if (ss === undefined) continue;

    // Handle regular support skills
    if (ss.skillType === "support") {
      supportMods.push(
        ...resolveNormalSupportSkillMods(
          ss,
          loadoutMods,
          loadout,
          config,
          derivedCtx,
        ),
      );
    }
    // Handle magnificent, noble, and activation medium support skills
    else {
      supportMods.push(...collectSupportAffixMods(ss));
    }
  }
  // Support skills coming from gear
  if (slot.skillName !== undefined && isMainSkill(slot.skillName, loadout)) {
    const extraSupports = filterMods(loadoutMods, "MainSkillSupportedBy").map(
      (m) => ({ name: m.skillName, level: m.level }),
    );
    for (const ss of extraSupports) {
      supportMods.push(
        ...resolveNormalSupportSkillMods(
          ss,
          loadoutMods,
          loadout,
          config,
          derivedCtx,
        ),
      );
    }
  }
  return supportMods;
};

// Context for mods specific to a single skill
interface PerSkillModContext {
  mods: Mod[];
  skill: BaseActiveSkill;
}

// Resolves mods specific to a single skill slot
// Returns undefined if the skill is not implemented (no offense data)
const resolvePerSkillMods = (
  skillSlot: SkillSlot,
  loadoutMods: Mod[],
  loadout: Loadout,
  config: Configuration,
  derivedCtx: DerivedCtx,
): PerSkillModContext | undefined => {
  if (skillSlot.skillName === undefined) {
    return undefined;
  }
  const skill = findActiveSkill(skillSlot.skillName as ActiveSkillName);

  // Skip non-implemented skills (those without levelValues)
  if (!("levelValues" in skill) || skill.levelValues === undefined) {
    return undefined;
  }

  const level =
    (skillSlot.level || 20) +
    calculateAddedSkillLevels(loadoutMods, skill, loadout, config, derivedCtx);

  // Check if the skill's factory returns offense data
  const skillMods = getActiveSkillMods(skill.name as ActiveSkillName, level);
  if (skillMods.offense === undefined) {
    // Skill has levelValues but no offense (e.g., buff-only skills like Ice Bond)
    return undefined;
  }

  const selectedSkillMods = resolveSelectedSkillMods(
    skillSlot.skillName as OffenseSkillName,
    level,
  );
  const supportMods = resolveSelectedSkillSupportMods(
    skillSlot,
    loadoutMods,
    loadout,
    config,
    derivedCtx,
  );

  return { mods: [...selectedSkillMods, ...supportMods], skill };
};

interface EnemyFrostbittenCtx {
  enabled: boolean;
  points: number;
}

const calculateEnemyFrostbitten = (
  config: Configuration,
): EnemyFrostbittenCtx => {
  return {
    enabled: config.enemyFrostbittenEnabled,
    points: config.enemyFrostbittenPoints ?? 0,
  };
};

const calculateNumShadowHits = (mods: Mod[], config: Configuration): number => {
  const shadowQuantMods = filterMods(mods, "ShadowQuant");
  const shadowQuant = R.sumBy(shadowQuantMods, (m) => m.value);
  return config.numShadowHits ?? shadowQuant;
};

const calculateMercuryPts = (
  mods: Mod[],
  loadout: Loadout,
): number | undefined => {
  if (!isHero("Lightbringer Rosa: Unsullied Blade (#2)", loadout)) {
    return undefined;
  }
  const mult = calcEffMult(mods, "MaxMercuryPtsPct");
  return 100 * mult;
};

const resolveBuffSkillEffMults = (
  unresolvedModsFromParam: Mod[],
  loadout: Loadout,
  config: Configuration,
  derivedCtx: DerivedCtx,
): {
  skillEffMult: number;
  auraEffMult: number;
  curseEffMult: number;
  spiritMagusOriginEffMult: number;
} => {
  const buffSkillEffMods = unresolvedModsFromParam.filter(
    (m) =>
      m.type === "AuraEffPct" ||
      m.type === "SkillEffPct" ||
      m.type === "CurseEffPct" ||
      m.type === "SpiritMagusOriginEffPct",
  );
  const { prenormMods, mods } = applyModFilters(
    buffSkillEffMods,
    loadout,
    config,
    derivedCtx,
  );

  pushNormalizedStackable(mods, prenormMods, "skill_use", 3);
  pushNormalizedStackable(mods, prenormMods, "skill_charges_on_use", 2);
  pushNormalizedStackable(
    mods,
    prenormMods,
    "cruelty_buff",
    config.crueltyBuffStacks ?? 40,
  );

  const skillEffMult = calcEffMult(mods, "SkillEffPct");
  const auraEffMult = calcEffMult(mods, "AuraEffPct");
  const curseEffMult = calcEffMult(mods, "CurseEffPct");
  const spiritMagusOriginEffMult = calcEffMult(mods, "SpiritMagusOriginEffPct");

  return { skillEffMult, auraEffMult, curseEffMult, spiritMagusOriginEffMult };
};

const calcMaxBlessings = (
  mods: Mod[],
  blessingType: "focus" | "agility" | "tenacity",
  derivedCtx: DerivedCtx,
): number => {
  const blessingToModType = {
    focus: "MaxFocusBlessing",
    agility: "MaxAgilityBlessing",
    tenacity: "MaxTenacityBlessing",
  } as const;
  const modType = blessingToModType[blessingType];
  const additionalMaxBlessings = sumByValue(filterMods(mods, modType));
  if (derivedCtx.hasBlasphemer) {
    return Math.max(4 - additionalMaxBlessings, 0);
  } else {
    return 4 + additionalMaxBlessings;
  }
};

const calcDesecration = (
  mods: Mod[],
  derivedCtx: DerivedCtx,
): number | undefined => {
  if (!derivedCtx.hasBlasphemer) {
    return undefined;
  }
  const addedFocus = sumByValue(filterMods(mods, "MaxFocusBlessing"));
  const addedAgility = sumByValue(filterMods(mods, "MaxAgilityBlessing"));
  const addedTenacity = sumByValue(filterMods(mods, "MaxTenacityBlessing"));
  return (
    3 +
    Math.min(addedFocus, 4) +
    Math.min(addedAgility, 4) +
    Math.min(addedTenacity, 4)
  );
};

const isMainSkill = (skillName: string, loadout: Loadout) => {
  return skillName === loadout.skillPage.activeSkills[1]?.skillName;
};

const calculateAddedSkillLevels = (
  loadoutMods: Mod[],
  skill: BaseSkill,
  loadout: Loadout,
  config: Configuration,
  derivedCtx: DerivedCtx,
): number => {
  const { prenormMods, mods } = applyModFilters(
    loadoutMods,
    loadout,
    config,
    derivedCtx,
  );

  const sealedLifePct = config.sealedLifePct ?? 0;
  pushNormalizedStackable(mods, prenormMods, "sealed_life_pct", sealedLifePct);

  let addedSkillLevels = 0;
  for (const mod of filterMods(mods, "SkillLevel")) {
    const matches = match(mod.skillLevelType)
      .with("main", () => isMainSkill(skill.name, loadout))
      .with("support", () => skill.type === "Support")
      .with("active", () => skill.type === "Active")
      .with("attack", () => skill.tags.includes("Attack"))
      .with("persistent", () => skill.tags.includes("Persistent"))
      .with("erosion", () => skill.tags.includes("Erosion"))
      .with("spell", () => skill.tags.includes("Spell"))
      .with("lightning", () => skill.tags.includes("Lightning"))
      .with("all", () => true)
      .exhaustive();
    if (matches) {
      addedSkillLevels += mod.value;
    }
  }
  return Math.round(addedSkillLevels);
};

/**
 * every level from 21-30 is +10% additional damage, stacking multiplicately
 * every level from 31+ is +8% additional damage, stacking multiplicatively
 */
const calculateSkillLevelDmgMods = (skillLevel: number): ModT<"DmgPct">[] => {
  if (skillLevel <= 20) {
    return [];
  }

  const a = 1.1 ** Math.min(10, skillLevel - 20);
  if (skillLevel <= 30) {
    return [
      {
        type: "DmgPct",
        value: (a - 1) * 100,
        addn: true,
        dmgModType: "global",
      },
    ];
  }

  const b = 1.08 ** (skillLevel - 30);
  return [
    {
      type: "DmgPct",
      value: (a - 1) * 100,
      addn: true,
      dmgModType: "global",
      src: "Added skill levels (21-30)",
    },
    {
      type: "DmgPct",
      value: (b - 1) * 100,
      addn: true,
      dmgModType: "global",
      src: "Added skill levels (30+)",
    },
  ];
};

const calcChainLightningInstances = (
  mods: Mod[],
  config: Configuration,
  jumps: number,
): number => {
  if (!modExists(mods, "ChainLightningWebOfLightning")) {
    return 1;
  }
  if (config.chainLightningInstancesOnTarget !== undefined) {
    return Math.max(1, config.chainLightningInstancesOnTarget);
  }
  return 1 + jumps;
};

const calcInfiltration = (
  mods: Mod[],
  type: "cold" | "lightning" | "fire",
  config: Configuration,
): Mod | undefined => {
  if (type === "cold" && !config.targetEnemyHasColdInfiltration) {
    return undefined;
  }
  if (type === "lightning" && !config.targetEnemyHasLightningInfiltration) {
    return undefined;
  }
  if (type === "fire" && !config.targetEnemyHasFireInfiltration) {
    return undefined;
  }
  const infiltrationEffMult = calcEffMult(
    filterMods(mods, "InfiltrationEffPct").filter(
      (m) => m.infiltrationType === type,
    ),
  );
  const baseVal = 13;
  const finalVal = baseVal * infiltrationEffMult;
  return {
    type: "DmgPct",
    value: finalVal,
    addn: true,
    dmgModType: type,
    isEnemyDebuff: true,
    src: `${type} Infiltration`,
  };
};

const pushInfiltrations = (mods: Mod[], config: Configuration): void => {
  const coldInfiltration = calcInfiltration(mods, "cold", config);
  if (coldInfiltration !== undefined) {
    mods.push(coldInfiltration);
  }
  const lightningInfiltration = calcInfiltration(mods, "lightning", config);
  if (lightningInfiltration !== undefined) {
    mods.push(lightningInfiltration);
  }
  const fireInfiltration = calcInfiltration(mods, "fire", config);
  if (fireInfiltration !== undefined) {
    mods.push(fireInfiltration);
  }
};

const pushWhimsy = (mods: Mod[], config: Configuration): void => {
  if (!config.targetEnemyHasWhimsySignal) return;

  const whimsySignalEffMult = calcEffMult(mods, "WhimsySignalEffPct");
  const whimsySignalDmgPctVal = 30 * whimsySignalEffMult;
  mods.push({
    type: "DmgPct",
    value: whimsySignalDmgPctVal,
    addn: true,
    dmgModType: "spell",
    isEnemyDebuff: true,
    src: "Whimsy Signal",
  });
};

const pushNumbed = (mods: Mod[], config: Configuration): void => {
  if (!config.enemyNumbed) return;

  const numbedStacks = config.enemyNumbedStacks ?? 10;
  const numbedEffMult = calcEffMult(mods, "NumbedEffPct");

  const conductive = findMod(mods, "Conductive");
  if (conductive === undefined) {
    const baseNumbedValPerStack = 5;
    const numbedVal = baseNumbedValPerStack * numbedEffMult * numbedStacks;
    mods.push({
      type: "DmgPct",
      value: numbedVal,
      dmgModType: "global",
      addn: true,
      isEnemyDebuff: true,
      src: "Numbed",
    });
  } else {
    const baseNumbedValPerStack = 11;
    const numbedVal = baseNumbedValPerStack * numbedEffMult * numbedStacks;
    mods.push({
      type: "DmgPct",
      value: numbedVal,
      dmgModType: "lightning",
      addn: true,
      isEnemyDebuff: true,
      src: "Numbed:Conductive",
    });
  }
};

const pushSquidnova = (mods: Mod[], config: Configuration): void => {
  if (!config.hasSquidnova) return;
  const squidNovaEffMult = calcEffMult(mods, "SquidnovaEffPct");
  const squidNovaDmgPctValue = 16 * squidNovaEffMult;
  mods.push({
    type: "DmgPct",
    value: squidNovaDmgPctValue,
    dmgModType: "hit",
    addn: true,
    src: "Squidnova",
  });
};

const pushChainLightning = (
  mods: Mod[],
  config: Configuration,
  jumps: number,
): void => {
  const chainLightningInstances = calcChainLightningInstances(
    mods,
    config,
    jumps,
  );

  const chainLightningMerge = findMod(mods, "ChainLightningMerge");
  if (chainLightningMerge !== undefined) {
    mods.push({
      type: "DmgPct",
      value:
        (chainLightningInstances - 1) *
        (100 - chainLightningMerge.shotgunFalloffCoefficient),
      addn: true,
      dmgModType: "global",
      src: "Chain Lightning: Merge (Noble)",
    });
  }
};

const pushFrail = (mods: Mod[], config: Configuration) => {
  if (!config.targetEnemyHasFrail) return;

  const frailEffMult = calcEffMult(mods, "FrailEffPct");
  const frailSpellDmgPctValue = 15 * frailEffMult;
  mods.push({
    type: "DmgPct",
    value: frailSpellDmgPctValue,
    dmgModType: "spell",
    addn: true,
    isEnemyDebuff: true,
    src: "Frail",
  });
};

const pushAttackAggression = (mods: Mod[], config: Configuration): void => {
  if (!config.hasAttackAggression) {
    return;
  }
  const aspdBase = 5;
  const dmgBase = 5;
  const mspdBase = 10;
  const mult = calcEffMult(mods, "AttackAggressionEffPct");
  mods.push({
    type: "AspdPct",
    value: aspdBase * mult,
    addn: true,
    src: "Attack Aggression",
  });
  mods.push({
    type: "DmgPct",
    value: dmgBase * mult,
    dmgModType: "attack",
    addn: true,
    src: "Attack Aggression",
  });
  mods.push({
    type: "MovementSpeedPct",
    value: mspdBase * mult,
    src: "Attack Aggression",
  });
};

const pushSpellAggression = (mods: Mod[], config: Configuration): void => {
  if (!config.hasSpellAggression) {
    return;
  }
  const cspdBase = 7;
  const dmgBase = 7;
  const mobilityCdr = 7;
  const mult = calcEffMult(mods, "SpellAggressionEffPct");
  mods.push({
    type: "CspdPct",
    value: cspdBase * mult,
    addn: true,
    src: "Spell Aggression",
  });
  mods.push({
    type: "DmgPct",
    value: dmgBase * mult,
    dmgModType: "spell",
    addn: true,
    src: "Spell Aggression",
  });
  mods.push({
    type: "MobilitySkillCdrPct",
    value: mobilityCdr * mult,
    src: "Spell Aggression",
  });
};

const pushMark = (mods: Mod[], config: Configuration): void => {
  if (!config.targetEnemyMarked) {
    return;
  }
  const markEffMult = calcEffMult(mods, "MarkEffPct");
  const baseValue = 20;
  mods.push({
    type: "CritDmgPct",
    value: baseValue * markEffMult,
    addn: true,
    modType: "global",
    isEnemyDebuff: true,
    src: "Mark",
  });
};

const calcSpellBurstChargeSpeedBonusPct = (mods: Mod[]): number => {
  const playSafe = findMod(mods, "PlaySafe");
  const chargeSpeedMods = [
    ...filterMods(mods, "SpellBurstChargeSpeedPct"),
    ...(playSafe !== undefined
      ? filterMods(mods, "CspdPct").map((m) =>
          multModValue(m, playSafe.value / 100),
        )
      : []),
  ];
  return (calcEffMult(chargeSpeedMods) - 1) * 100;
};

const pushMultistrikeAspd = (
  mods: Mod[],
  multistrikeChancePct: number,
): void => {
  const multistrikeAspdPct = 20;
  const aspdWhenMultistrikingMods: ModWithValue[] = filterMods(
    mods,
    "AspdWhenMultistrikingPct",
  ).map((m) => ({ ...m, type: "AspdPct" }));
  if (multistrikeChancePct >= 100) {
    mods.push({ type: "AspdPct", addn: false, value: multistrikeAspdPct });
    mods.push(...aspdWhenMultistrikingMods);
  } else if (multistrikeChancePct > 0) {
    const mult = multistrikeChancePct / 100;
    mods.push({
      type: "AspdPct",
      addn: false,
      value: multistrikeAspdPct * mult,
      src: "Multistrike",
    });
    mods.push(...aspdWhenMultistrikingMods.map((m) => multModValue(m, mult)));
  }
};

const pushMultistrikeDmgBonus = (
  mods: Mod[],
  multistrikeChancePct: number,
  multistrikeIncDmgPct: number,
): void => {
  if (multistrikeChancePct <= 0 || multistrikeIncDmgPct <= 0) {
    return;
  }
  const initialCount = Math.trunc(
    sumByValue(filterMods(mods, "InitialMultistrikeCount")),
  );
  const maxHits = initialCount + Math.floor(multistrikeChancePct / 100) + 2;
  let expectedDmgMult = 0;
  for (let hitNumber = initialCount; hitNumber < maxHits; hitNumber++) {
    const hitProbability =
      hitNumber === initialCount
        ? 1.0
        : Math.min(
            1.0,
            multistrikeChancePct / 100 - (hitNumber - (1 + initialCount)),
          );

    const hitDamageMultiplier = 1.0 + hitNumber * (multistrikeIncDmgPct / 100);
    expectedDmgMult += hitProbability * hitDamageMultiplier;
  }
  const expectedHits = 1 + multistrikeChancePct / 100;
  const expectedDmgBonusPct = (expectedDmgMult / expectedHits - 1) * 100;
  mods.push({
    type: "DmgPct",
    value: expectedDmgBonusPct,
    dmgModType: "global",
    addn: true,
    src: "Multistrike Increasing Damage",
  });
};

const pushTradeoff = (mods: Mod[], resourcePool: ResourcePool) => {
  const { str, dex } = resourcePool.stats;
  const tradeoffDexGteStrAspdPct = findMod(mods, "TradeoffDexGteStrAspdPct");
  const tradeoffStrGteDexDmgPct = findMod(mods, "TradeoffStrGteDexDmgPct");
  if (tradeoffDexGteStrAspdPct !== undefined && dex >= str) {
    mods.push({
      type: "AspdPct",
      addn: true,
      value: tradeoffDexGteStrAspdPct.value,
      src: "Tradeoff",
    });
  }
  if (tradeoffStrGteDexDmgPct !== undefined && str >= dex) {
    mods.push({
      type: "DmgPct",
      addn: true,
      dmgModType: "attack",
      value: tradeoffStrGteDexDmgPct.value,
      src: "Tradeoff",
    });
  }
};

const pushMainStatDmgPct = (mods: Mod[], totalMainStats: number): void => {
  if (findMod(mods, "DisableMainStatDmg") !== undefined) {
    return;
  }
  const value = 0.5 * totalMainStats;
  mods.push({
    type: "DmgPct",
    value,
    dmgModType: "global",
    addn: true,
    src: "Additional Damage from skill Main Stat (.5% per stat)",
  });
};

const pushErika1 = (
  mods: Mod[],
  prenormMods: Mod[],
  config: Configuration,
): void => {
  if (!modExists(mods, "WindStalker")) {
    return;
  }
  const addedMaxStacks = sumByValue(filterMods(mods, "MaxStalker"));
  const defaultStacks = 3 + addedMaxStacks;
  const stacks = config.stalkerStacks ?? defaultStacks;
  // This assumes that the player's multistrike chance is >= 100%
  // Therefore, it's an overestimation if not. However, if your
  // multistrike is below, 100%, why tf are you using e1
  mods.push({
    type: "DmgPct",
    dmgModType: "global",
    addn: true,
    value: 13 * stacks,
  });
  mods.push(...normalizeStackables(prenormMods, "stalker", stacks));
};

interface DerivedOffenseCtx {
  maxSpellBurst: number;
  spellBurstChargeSpeedBonusPct: number;
  movementSpeedBonusPct: number;
  multistrikeChancePct: number;
  multistrikeIncDmgPct: number;
  mods: Mod[];
}

// resolves mods, removing unmatched conditions, and normalizing per mods
const resolveModsForOffenseSkill = (
  prenormModsFromParam: Mod[],
  skill: BaseActiveSkill | BasePassiveSkill,
  skillLevel: number,
  resourcePool: ResourcePool,
  loadout: Loadout,
  config: Configuration,
  derivedCtx: DerivedCtx,
): DerivedOffenseCtx => {
  const {
    stats,
    maxMana,
    mercuryPts,
    focusBlessings,
    agilityBlessings,
    tenacityBlessings,
    additionalMaxChanneledStacks,
    desecration,
  } = resourcePool;
  const { prenormMods, mods: baseMods } = applyModFilters(
    prenormModsFromParam,
    loadout,
    config,
    derivedCtx,
  );
  const mods = [...baseMods, ...calculateSkillLevelDmgMods(skillLevel)];

  // Local helper - captures mods and prenormMods in closure
  const normalize = (stackable: Stackable, value: number | undefined): void => {
    if (value !== undefined) {
      mods.push(...normalizeStackables(prenormMods, stackable, value));
    }
  };

  const totalMainStats = calculateTotalMainStats(skill, stats);
  const highestStat = Math.max(stats.dex, stats.int, stats.str);
  const sumStats = stats.dex + stats.int + stats.str;

  normalize("level", config.level);
  normalize("main_stat", totalMainStats);
  normalize("highest_stat", highestStat);
  normalize("stat", sumStats);
  normalize("str", stats.str);
  normalize("dex", stats.dex);
  normalize("int", stats.int);
  normalize("num_max_multistrikes_recently", config.numMaxMultistrikesRecently);
  const { mainHand, offHand } = loadout.gearPage.equippedGear;
  normalize(
    "num_unique_weapon_types_equipped",
    R.unique([mainHand?.equipmentType ?? "", offHand?.equipmentType ?? ""])
      .length,
  );
  const maxBBStacks = sumByValue(filterMods(mods, "MaxBerserkingBladeStacks"));
  const bbStacks = config.numBerserkingBladeBuffStacks || maxBBStacks;
  normalize("berserking_blade_buff", bbStacks);

  pushTradeoff(mods, resourcePool);
  pushMainStatDmgPct(mods, totalMainStats);
  pushWhimsy(mods, config);
  pushAttackAggression(mods, config); // must happen before movement speed
  pushSpellAggression(mods, config); // must happen before spell burst charge speed calculation
  pushMark(mods, config);

  // must happen before max_spell_burst normalization, after attack aggression
  const movementSpeedBonusPct =
    (calcEffMult(mods, "MovementSpeedPct") - 1) * 100;
  normalize("movement_speed_bonus_pct", movementSpeedBonusPct);

  pushInfiltrations(mods, config);
  pushNumbed(mods, config);
  pushSquidnova(mods, config);

  const jumps = sumByValue(filterMods(mods, "Jump"));
  normalize("jump", jumps);

  pushChainLightning(mods, config, jumps);
  pushFrail(mods, config);

  // must happen after movement_speed_bonus_pct normalization
  const maxSpellBurst = sumByValue(filterMods(mods, "MaxSpellBurst"));
  normalize("max_spell_burst", maxSpellBurst);
  normalize("additional_max_channel_stack", additionalMaxChanneledStacks);

  const maxChannelStacks =
    (findMod(mods, "InitialMaxChannel")?.value ?? 0) +
    additionalMaxChanneledStacks;
  const mcMaxLinks = maxChannelStacks;
  const mcLinks = config.numMindControlLinksUsed ?? mcMaxLinks;
  normalize("mind_control_link", mcLinks);
  normalize("unused_mind_control_link", mcMaxLinks - mcLinks);

  mods.push(...calculateTorment(config));
  mods.push(...calculateAffliction(mods, config));

  const repentanceStacks = 4 + sumByValue(filterMods(mods, "MaxRepentance"));
  const willpowerStacks = calculateWillpower(prenormMods);
  const frostbitten = calculateEnemyFrostbitten(config);

  normalize("repentance", repentanceStacks);
  normalize("focus_blessing", focusBlessings);
  normalize("agility_blessing", agilityBlessings);
  normalize("tenacity_blessing", tenacityBlessings);
  normalize("desecration", desecration ?? 0);
  normalize(
    "has_hit_enemy_with_elemental_dmg_recently",
    config.hasHitEnemyWithElementalDmgRecently,
  );
  normalize(
    "num_spell_skills_used_recently",
    config.numSpellSkillsUsedRecently,
  );
  normalize("willpower", willpowerStacks);
  normalize("frostbite_rating", frostbitten.points);

  // Note: BaseProjectileQuant is NOT counted toward "projectile" stackable
  const maxProjectiles = findMod(mods, "MaxProjectile")?.value;
  const projectiles = Math.trunc(
    Math.min(
      sumByValue(filterMods(mods, "Projectile")),
      maxProjectiles ?? Infinity,
    ),
  );
  normalize("projectile", projectiles);

  if (resourcePool.hasFervor) {
    mods.push(calculateFervorCritRateMod(mods, resourcePool));
    normalize("fervor", resourcePool.fervorPts);
  }

  if (skill.tags.includes("Shadow Strike")) {
    const numShadowHits = calculateNumShadowHits(mods, config);
    const dmgFromShadowMod = calculateAddnDmgFromShadows(numShadowHits);
    if (dmgFromShadowMod !== undefined) {
      const shadowDmgPctMods = filterMods(mods, "ShadowDmgPct");
      const shadowDmgMult = calcEffMult(shadowDmgPctMods);
      mods.push({
        ...multModValue(dmgFromShadowMod, shadowDmgMult),
        per: undefined,
      });
    }
  }

  const unsealedManaPct = 100 - (config.sealedManaPct ?? 0);
  const unsealedLifePct = 100 - (config.sealedLifePct ?? 0);

  normalize("max_mana", maxMana);
  normalize("mercury_pt", mercuryPts);
  normalize("mana_consumed_recently", config.manaConsumedRecently ?? 0);
  normalize("unsealed_mana_pct", unsealedManaPct);
  normalize("unsealed_life_pct", unsealedLifePct);
  normalize(
    "num_enemies_affected_by_warcry",
    config.numEnemiesAffectedByWarcry,
  );

  // must happen after spell aggression and any other normalizations that can
  // affect cast speed
  const spellBurstChargeSpeedBonusPct = calcSpellBurstChargeSpeedBonusPct(mods);
  normalize(
    "spell_burst_charge_speed_bonus_pct",
    spellBurstChargeSpeedBonusPct,
  );

  // miust happen before multistrike
  pushErika1(mods, prenormMods, config);

  // Must happen after any multistrike chance normalization
  // must happen after erika1
  const multistrikeChancePct = sumByValue(
    filterMods(mods, "MultistrikeChancePct"),
  );
  const multistrikeIncDmgPct = sumByValue(
    filterMods(mods, "MultistrikeIncDmgPct"),
  );
  pushMultistrikeAspd(mods, multistrikeChancePct);
  pushMultistrikeDmgBonus(mods, multistrikeChancePct, multistrikeIncDmgPct);

  return {
    mods,
    maxSpellBurst,
    movementSpeedBonusPct,
    multistrikeChancePct,
    multistrikeIncDmgPct,
    spellBurstChargeSpeedBonusPct,
  };
};

const calculateResourcePool = (
  paramMods: Mod[],
  loadout: Loadout,
  config: Configuration,
  derivedCtx: DerivedCtx,
): ResourcePool => {
  // potential perf issue: this is a duplicate filtering, since it also
  //   happens in calculateOffense with a slightly larger superset.
  //   maybe we should factor it out if performance becomes an issue
  const { prenormMods, mods } = applyModFilters(
    paramMods,
    loadout,
    config,
    derivedCtx,
    false, // withCondThreshold
  );

  pushNormalizedStackable(mods, prenormMods, "level", config.level);

  const stats = calculateStats(mods);

  pushNormalizedStackable(mods, prenormMods, "str", stats.str);
  pushNormalizedStackable(mods, prenormMods, "dex", stats.dex);
  pushNormalizedStackable(mods, prenormMods, "int", stats.int);

  const maxLifeFromMods = sumByValue(filterMods(mods, "MaxLife"));
  const maxLifeMult = calcEffMult(mods, "MaxLifePct");
  const maxLife = (50 + config.level * 13 + maxLifeFromMods) * maxLifeMult;

  const maxManaFromMods = sumByValue(filterMods(mods, "MaxMana"));
  const maxManaMult = calcEffMult(mods, "MaxManaPct");
  const maxMana = (40 + config.level * 5 + maxManaFromMods) * maxManaMult;

  const energyShield = calculateDefenseStat(
    mods,
    "GearEnergyShield",
    "GearEnergyShieldPct",
    "MaxEnergyShield",
    "MaxEnergyShieldPct",
  );

  const armor = calculateDefenseStat(
    mods,
    "GearArmor",
    "GearArmorPct",
    "Armor",
    "ArmorPct",
  );

  const evasion = calculateDefenseStat(
    mods,
    "GearEvasion",
    "GearEvasionPct",
    "Evasion",
    "EvasionPct",
  );

  // max_mana must be normalized before calculating mercuryPts
  // (for mods with per: { stackable: "max_mana" })
  pushNormalizedStackable(mods, prenormMods, "max_mana", maxMana);

  const mercuryPts = calculateMercuryPts(mods, loadout);
  pushNormalizedStackable(mods, prenormMods, "mercury_pt", mercuryPts);

  const maxFocusBlessings = calcMaxBlessings(mods, "focus", derivedCtx);
  const focusBlessings = calcNumFocus(maxFocusBlessings, config);
  const maxAgilityBlessings = calcMaxBlessings(mods, "agility", derivedCtx);
  const agilityBlessings = calcNumAgility(maxAgilityBlessings, config);
  const maxTenacityBlessings = calcMaxBlessings(mods, "tenacity", derivedCtx);
  const tenacityBlessings = calcNumTenacity(maxTenacityBlessings, config);
  const desecration = calcDesecration(mods, derivedCtx);

  const additionalMaxChanneledStacks = Math.round(
    sumByValue(filterMods(mods, "MaxChannel")),
  );

  const haveFervor = findMod(mods, "HaveFervor") !== undefined;
  const hasFervor = config.fervorEnabled || haveFervor;
  const fixedFervorPts = findMod(mods, "FixedFervorPts");
  const fervorPts = fixedFervorPts?.value ?? config.fervorPoints ?? 100;

  return {
    stats,
    maxLife,
    maxMana,
    energyShield,
    armor,
    evasion,
    mercuryPts,
    maxFocusBlessings,
    focusBlessings,
    maxAgilityBlessings,
    agilityBlessings,
    maxTenacityBlessings,
    tenacityBlessings,
    desecration,
    additionalMaxChanneledStacks,
    hasFervor,
    fervorPts,
  };
};

export const calculateDefenses = (
  paramMods: Mod[],
  loadout: Loadout,
  config: Configuration,
  derivedCtx: DerivedCtx,
): Defenses => {
  const { mods } = applyModFilters(paramMods, loadout, config, derivedCtx);

  const maxResMods = filterMods(mods, "MaxResistancePct");
  const resMods = filterMods(mods, "ResistancePct");

  type ResMod = ModT<"MaxResistancePct"> | ModT<"ResistancePct">;
  const sumResMods = <T extends ResMod>(
    mods: T[],
    resTypes: ResType[],
  ): number => {
    return sumByValue(mods.filter((m) => resTypes.includes(m.resType)));
  };

  const calcRes = (resTypes: ResType[]): Resistance => {
    const max = Math.min(90, 60 + sumResMods(maxResMods, resTypes));
    const potential = sumResMods(resMods, resTypes);
    const actual = Math.min(max, potential);
    return { max, potential, actual };
  };

  const attackBlockPct = sumByValue(filterMods(mods, "AttackBlockChancePct"));
  const spellBlockPct = sumByValue(filterMods(mods, "SpellBlockChancePct"));
  const blockRatioPct = Math.min(
    60,
    30 + sumByValue(filterMods(mods, "BlockRatioPct")),
  );

  return {
    coldRes: calcRes(["cold", "elemental"]),
    lightningRes: calcRes(["lightning", "elemental"]),
    fireRes: calcRes(["fire", "elemental"]),
    erosionRes: calcRes(["erosion"]),
    attackBlockPct,
    spellBlockPct,
    blockRatioPct,
  };
};

export interface PersistentDpsSummary {
  base: Record<DmgChunkType, number>;
  total: number;
  duration: number;
}

interface CalcAvgPersistentDpsInput {
  mods: Mod[];
  loadout: Loadout;
  perSkillContext: PerSkillModContext;
  skillLevel: number;
  config: Configuration;
}

const calcAvgPersistentDps = (
  input: CalcAvgPersistentDpsInput,
): PersistentDpsSummary | undefined => {
  const { mods, perSkillContext, skillLevel, config } = input;
  const skill = perSkillContext.skill as BaseActiveSkill;

  const implementedPersistentSkills: ActiveSkillName[] = [
    "[Test] Simple Persistent Spell",
    "Mind Control",
  ];
  if (!implementedPersistentSkills.includes(skill.name as ActiveSkillName)) {
    return undefined;
  }

  const skillMods = getActiveSkillMods(
    skill.name as ActiveSkillName,
    skillLevel,
  );
  const persistentDmg = skillMods.offense?.persistentDmg;
  if (persistentDmg === undefined) return;

  const baseDmg: NumDmgValues = {
    [persistentDmg.dmgType]: persistentDmg.value,
  };
  const baseDmgModTypes: DmgModType[] = dmgModTypesForSkill(skill);

  const dmgPools = convertDmg(baseDmg, mods);
  const dmgValues = applyDmgBonusesAndPen({
    dmgPools,
    mods,
    baseDmgModTypes,
    config,
    ignoreArmor: true,
  });

  const physical = dmgValues.physical ?? 0;
  const cold = dmgValues.cold ?? 0;
  const lightning = dmgValues.lightning ?? 0;
  const fire = dmgValues.fire ?? 0;
  const erosion = dmgValues.erosion ?? 0;
  const total = physical + cold + lightning + fire + erosion;

  const duration =
    persistentDmg.duration * calcEffMult(mods, "SkillEffDurationPct");

  return {
    base: { physical, cold, lightning, fire, erosion },
    total,
    duration,
  };
};

const calcReapsPerSecond = (cooldown: number) => {
  const roundedCooldown = Math.ceil(cooldown * 30) / 30;
  return 1 / roundedCooldown;
};

export interface ReapDpsSummary {
  rawCooldown: number;
  duration: number;
  reapsPerSecond: number;
  dmgPerReap: number;
  reapDps: number;
}

export interface TotalReapDpsSummary {
  reaps: ReapDpsSummary[];
  totalReapDps: number;
  reapDurationBonusPct: number;
  reapCdrBonusPct: number;
}

const calcTotalReapDps = (
  mods: Mod[],
  persistentDpsSummary: PersistentDpsSummary,
): TotalReapDpsSummary | undefined => {
  const dotDuration = persistentDpsSummary.duration;
  const dotDps = persistentDpsSummary.total;
  const reapDurationMult = calcEffMult(mods, "ReapDurationPct");
  const reapCdrMult = calcEffMult(mods, "ReapCdrPct");
  const reapPurificationPct =
    sumByValue(filterMods(mods, "ReapPurificationPct")) / 100;
  const reaps = filterMods(mods, "Reap").map((m) => {
    const duration = Math.min(m.duration * reapDurationMult, dotDuration);
    const rawCooldown = m.cooldown / reapCdrMult;
    const reapsPerSecond = calcReapsPerSecond(rawCooldown);
    // Base reap damage from reaped duration
    const baseReapDmg = dotDps * duration;
    // Purification adds a portion of remaining DOT damage
    const remainingDotDuration = dotDuration - duration;
    const purificationDmg = remainingDotDuration * dotDps * reapPurificationPct;
    const dmgPerReap = baseReapDmg + purificationDmg;
    const reapDps = dmgPerReap * reapsPerSecond;
    return { rawCooldown, duration, reapsPerSecond, dmgPerReap, reapDps };
  });
  if (reaps.length === 0) {
    return undefined;
  }
  const totalReapDps = R.sumBy(reaps, (r) => r.reapDps);
  return {
    reaps,
    reapDurationBonusPct: (reapDurationMult - 1) * 100,
    reapCdrBonusPct: (reapCdrMult - 1) * 100,
    totalReapDps,
  };
};

interface CalcWeaponAttackInput {
  mods: Mod[];
  skill: BaseActiveSkill;
  derivedCtx: DerivedCtx;
  config: Configuration;
  critDmgMult: number;
  weaponAtkDmgPct: number;
  addedDmgEffPct: number;
}

const calcWeaponAttack = (
  weapon: Gear,
  extraJoinedForceAvgHitDmg: number,
  input: CalcWeaponAttackInput,
): WeaponAttackSummary => {
  const {
    mods,
    skill,
    derivedCtx,
    config,
    critDmgMult,
    weaponAtkDmgPct,
    addedDmgEffPct,
  } = input;
  const gearDmg = calculateGearDmg(weapon, mods);
  const flatDmg = calculateFlatDmg(mods, "attack");
  const skillHit = calculateAtkHit(
    gearDmg.mainHand,
    flatDmg,
    mods,
    skill,
    derivedCtx,
    config,
    weaponAtkDmgPct,
    addedDmgEffPct,
  );

  const avgHit = skillHit.avg + extraJoinedForceAvgHitDmg;
  const aspd = calculateAspd(weapon, mods, skill);
  const critChance = calculateCritChance(mods, skill);
  const avgHitWithCrit =
    avgHit * critChance * critDmgMult + avgHit * (1 - critChance);
  return { avgHit, aspd, critChance, avgHitWithCrit };
};

const calcDualWieldDps = (
  mainhandAtk: WeaponAttackSummary,
  offhandAtk: WeaponAttackSummary | undefined,
  disableOffhand: boolean,
): number => {
  if (offhandAtk === undefined || disableOffhand) {
    return mainhandAtk.aspd * mainhandAtk.avgHitWithCrit;
  }
  const mainhandAtkInterval = 1 / mainhandAtk.aspd;
  const offhandAtkInterval = 1 / offhandAtk.aspd;
  const fullInterval = mainhandAtkInterval + offhandAtkInterval;
  return (
    (mainhandAtk.avgHitWithCrit + offhandAtk.avgHitWithCrit) / fullInterval
  );
};

const calcAvgAttackDps = (
  mods: Mod[],
  loadout: Loadout,
  perSkillContext: PerSkillModContext,
  skillLevel: number,
  derivedOffenseCtx: DerivedOffenseCtx,
  derivedCtx: DerivedCtx,
  config: Configuration,
): OffenseAttackDpsSummary | undefined => {
  const skill = perSkillContext.skill;

  // Look up skill offense values early
  const skillMods = getActiveSkillMods(
    skill.name as ActiveSkillName,
    skillLevel,
  );
  const offense = skillMods.offense;

  // Get offense percentages based on skill type
  const offenseValues = match(skill.name as ActiveSkillName)
    .with("Frost Spike", "Thunder Spike", () => {
      const weaponAtkDmgPct = offense?.weaponAtkDmgPct?.value;
      const addedDmgEffPct = offense?.addedDmgEffPct?.value;
      if (weaponAtkDmgPct === undefined || addedDmgEffPct === undefined) {
        return undefined;
      }
      return { weaponAtkDmgPct, addedDmgEffPct };
    })
    .with("[Test] Simple Attack", () => ({
      weaponAtkDmgPct: 100,
      addedDmgEffPct: 100,
    }))
    .otherwise(() => undefined);

  if (offenseValues === undefined) {
    return undefined;
  }

  const critDmgMult = calculateCritDmg(mods, skill);
  const mainhand = loadout.gearPage.equippedGear.mainHand;
  const offhand = loadout.gearPage.equippedGear.offHand;
  if (mainhand === undefined) {
    return undefined;
  }

  const calcWeaponAttackInput: CalcWeaponAttackInput = {
    mods,
    skill,
    derivedCtx,
    config,
    critDmgMult,
    weaponAtkDmgPct: offenseValues.weaponAtkDmgPct,
    addedDmgEffPct: offenseValues.addedDmgEffPct,
  };

  // Only calculate offhand attack if offhand is a one-handed weapon (not a shield)
  const offhandAtk =
    offhand !== undefined && isOneHandedWeapon(offhand)
      ? calcWeaponAttack(offhand, 0, calcWeaponAttackInput)
      : undefined;
  const joinedForceAddedDmgPct = findMod(
    mods,
    "JoinedForceAddOffhandToMainhandPct",
  );
  const joinedForceAddedDmg =
    ((joinedForceAddedDmgPct?.value ?? 0) / 100) * (offhandAtk?.avgHit ?? 0);
  const mainhandAtk = calcWeaponAttack(
    mainhand,
    joinedForceAddedDmg,
    calcWeaponAttackInput,
  );

  const disableOffhand = modExists(mods, "JoinedForceDisableOffhand");
  const avgDpsWithoutExtras = calcDualWieldDps(
    mainhandAtk,
    offhandAtk,
    disableOffhand,
  );

  const doubleDmgMult = calculateDoubleDmgMult(mods, skill);
  const extraMult = calculateExtraOffenseMults(mods, config);

  const avgDps = avgDpsWithoutExtras * doubleDmgMult * extraMult;
  return {
    mainhand: mainhandAtk,
    offhand: disableOffhand ? undefined : offhandAtk,
    critDmgMult,
    avgDps,
    multistrikeChancePct: derivedOffenseCtx.multistrikeChancePct,
    multistrikeIncDmgPct: derivedOffenseCtx.multistrikeIncDmgPct,
  };
};

const calcAvgSlashStrikeDps = (
  mods: Mod[],
  loadout: Loadout,
  perSkillContext: PerSkillModContext,
  skillLevel: number,
  derivedOffenseCtx: DerivedOffenseCtx,
  derivedCtx: DerivedCtx,
  config: Configuration,
): OffenseSlashStrikeDpsSummary | undefined => {
  const skill = perSkillContext.skill;
  const skillMods = getActiveSkillMods(
    skill.name as ActiveSkillName,
    skillLevel,
  );
  const offense = skillMods.offense;

  // Validate sweep/steep offense properties exist
  if (
    offense?.sweepWeaponAtkDmgPct === undefined ||
    offense?.sweepAddedDmgEffPct === undefined ||
    offense?.steepWeaponAtkDmgPct === undefined ||
    offense?.steepAddedDmgEffPct === undefined
  ) {
    return undefined;
  }

  const mainhand = loadout.gearPage.equippedGear.mainHand;
  if (mainhand === undefined) {
    return undefined;
  }
  const offhand = loadout.gearPage.equippedGear.offHand;

  // Get steep strike chance (capped at 100%)
  const steepStrikeChancePct = Math.min(
    100,
    sumByValue(filterMods(mods, "SteepStrikeChancePct")),
  );
  const steepChance = steepStrikeChancePct / 100;

  const critDmgMult = calculateCritDmg(mods, skill);
  const disableOffhand = modExists(mods, "JoinedForceDisableOffhand");

  // Build sweep input for weapon attack calculations
  const sweepInput: CalcWeaponAttackInput = {
    mods,
    skill,
    derivedCtx,
    config,
    critDmgMult,
    weaponAtkDmgPct: offense.sweepWeaponAtkDmgPct.value,
    addedDmgEffPct: offense.sweepAddedDmgEffPct.value,
  };
  const sweepOffhandAtk =
    offhand !== undefined && isOneHandedWeapon(offhand)
      ? calcWeaponAttack(offhand, 0, sweepInput)
      : undefined;

  const joinedForceAddedDmgPct = findMod(
    mods,
    "JoinedForceAddOffhandToMainhandPct",
  );
  const joinedForceAddedDmg =
    ((joinedForceAddedDmgPct?.value ?? 0) / 100) *
    (sweepOffhandAtk?.avgHit ?? 0);

  // Calculate sweep mode attacks
  const sweepMainhandAtk = calcWeaponAttack(
    mainhand,
    joinedForceAddedDmg,
    sweepInput,
  );

  // Build steep input for weapon attack calculations
  const steepInput: CalcWeaponAttackInput = {
    mods,
    skill,
    derivedCtx,
    config,
    critDmgMult,
    weaponAtkDmgPct: offense.steepWeaponAtkDmgPct.value,
    addedDmgEffPct: offense.steepAddedDmgEffPct.value,
  };
  const steepOffhandAtk =
    offhand !== undefined && isOneHandedWeapon(offhand)
      ? calcWeaponAttack(offhand, 0, steepInput)
      : undefined;

  // For steep mode, recalculate joined force bonus with steep offhand damage
  const steepJoinedForceAddedDmg =
    ((joinedForceAddedDmgPct?.value ?? 0) / 100) *
    (steepOffhandAtk?.avgHit ?? 0);
  const steepMainhandAtk = calcWeaponAttack(
    mainhand,
    steepJoinedForceAddedDmg,
    steepInput,
  );

  // Calculate DPS for each mode
  const sweepDpsWithoutExtras = calcDualWieldDps(
    sweepMainhandAtk,
    sweepOffhandAtk,
    disableOffhand,
  );
  const steepDpsWithoutExtras = calcDualWieldDps(
    steepMainhandAtk,
    steepOffhandAtk,
    disableOffhand,
  );

  // Apply final multipliers
  const doubleDmgMult = calculateDoubleDmgMult(mods, skill);
  const extraMult = calculateExtraOffenseMults(mods, config);
  const sweepDps = sweepDpsWithoutExtras * doubleDmgMult * extraMult;
  const steepDps = steepDpsWithoutExtras * doubleDmgMult * extraMult;

  // Weighted average based on steep strike chance
  const avgDps = (1 - steepChance) * sweepDps + steepChance * steepDps;

  return {
    sweep: {
      mainhand: sweepMainhandAtk,
      offhand: disableOffhand ? undefined : sweepOffhandAtk,
      avgDps: sweepDps,
    },
    steep: {
      mainhand: steepMainhandAtk,
      offhand: disableOffhand ? undefined : steepOffhandAtk,
      avgDps: steepDps,
    },
    steepStrikeChancePct,
    critDmgMult,
    avgDps,
    multistrikeChancePct: derivedOffenseCtx.multistrikeChancePct,
    multistrikeIncDmgPct: derivedOffenseCtx.multistrikeIncDmgPct,
  };
};

interface CalcSpellHitOutput {
  base: {
    physical: DmgRange;
    cold: DmgRange;
    lightning: DmgRange;
    fire: DmgRange;
    erosion: DmgRange;
    total: { min: number; max: number };
  };
  castTime: number;
  avg: number;
}

const calcSpellHit = (
  flatDmg: DmgRanges,
  mods: Mod[],
  skill: BaseActiveSkill,
  level: number,
  derivedCtx: DerivedCtx,
  config: Configuration,
): CalcSpellHitOutput | undefined => {
  const implementedSpells: ActiveSkillName[] = [
    "[Test] Simple Spell",
    "Chain Lightning",
  ];
  if (!implementedSpells.includes(skill.name as ActiveSkillName)) {
    return undefined;
  }

  const skillMods = getActiveSkillMods(skill.name as ActiveSkillName, level);
  const spellDmg = skillMods.offense?.spellDmg;
  if (spellDmg === undefined) {
    return undefined;
  }
  const { value: skillSpellDR, dmgType, castTime } = spellDmg;
  const skillSpellDRs = { ...emptyDmgRanges(), [dmgType]: skillSpellDR };

  const addedDmgEffPct = skillMods.offense?.addedDmgEffPct?.value;
  if (addedDmgEffPct === undefined) {
    return undefined;
  }
  const skillFlatDRs = multDRs(flatDmg, addedDmgEffPct / 100);
  const skillBaseDR = addDRs(skillSpellDRs, skillFlatDRs);
  const baseDmgModTypes = dmgModTypesForSkill(skill);

  const dmgPools = convertDmg(skillBaseDR, mods);
  const finalDmgRanges = applyDmgBonusesAndPen({
    dmgPools,
    mods,
    baseDmgModTypes,
    config,
    ignoreArmor: false,
  });
  const baseHitOverview = calcBaseHitOverview(finalDmgRanges, derivedCtx);
  return { ...baseHitOverview, castTime };
};

const calcSpellRippleMult = (mods: Mod[]): number => {
  const spellRipple = findMod(mods, "SpellRipple");
  const spellRippleMult =
    spellRipple !== undefined
      ? 1 + (spellRipple.pctOfHitDmg / 100) * (spellRipple.chancePct / 100)
      : 1;
  return spellRippleMult;
};

export interface OffenseSpellDpsSummary {
  critChance: number;
  critDmgMult: number;
  castsPerSec: number;
  avgHitWithCrit: number;
  avgDps: number;
}

const calcAvgSpellDps = (
  mods: Mod[],
  _loadout: Loadout,
  perSkillContext: PerSkillModContext,
  skillLevel: number,
  derivedCtx: DerivedCtx,
  config: Configuration,
): OffenseSpellDpsSummary | undefined => {
  const skill = perSkillContext.skill;
  const flatDmg = calculateFlatDmg(mods, "spell");
  const spellHit = calcSpellHit(
    flatDmg,
    mods,
    skill,
    skillLevel,
    derivedCtx,
    config,
  );
  if (spellHit === undefined) {
    return undefined;
  }
  const { avg, castTime } = spellHit;

  const cspdMult = calcEffMult(mods, "CspdPct");
  const cspd = (1 / castTime) * cspdMult;
  const critChance = calculateCritChance(mods, skill);
  const critDmgMult = calculateCritDmg(mods, skill);
  const doubleDmgMult = calculateDoubleDmgMult(mods, skill);
  const extraMult = calculateExtraOffenseMults(mods, config);
  const spellRippleMult = calcSpellRippleMult(mods);

  const avgHitWithCrit =
    avg * critChance * critDmgMult + avg * (1 - critChance);
  const avgDps =
    avgHitWithCrit * doubleDmgMult * cspd * extraMult * spellRippleMult;
  return { critChance, critDmgMult, castsPerSec: cspd, avgHitWithCrit, avgDps };
};

export interface OffenseSpellBurstDpsSummary {
  burstsPerSec: number;
  maxSpellBurst: number;
  avgDps: number;
  ingenuityOverload?: { avgDps: number; interval: number };
}

const calcAvgSpellBurstDps = (
  mods: Mod[],
  avgHit: number,
  derivedOffenseCtx: DerivedOffenseCtx,
  derivedCtx: DerivedCtx,
): OffenseSpellBurstDpsSummary => {
  const { maxSpellBurst, spellBurstChargeSpeedBonusPct } = derivedOffenseCtx;
  const baseBurstsPerSec = 0.5;
  const burstsPerSecMult = 1 + spellBurstChargeSpeedBonusPct / 100;
  const burstsPerSec = baseBurstsPerSec * burstsPerSecMult;
  const spellBurstDmgMult = calculateAddn(
    filterMods(mods, "SpellBurstAdditionalDmgPct").map((m) => m.value),
  );
  const spellRippleMult = calcSpellRippleMult(mods);

  if (derivedCtx.hero !== bing2) {
    const avgDps =
      burstsPerSec *
      maxSpellBurst *
      avgHit *
      spellBurstDmgMult *
      spellRippleMult;
    return { burstsPerSec, maxSpellBurst, avgDps };
  }

  // Everything after this is bing2 specific

  // Bing2 Ingenuity Overload calculation:
  // - Whimsy Essence accumulates over time and on each Spell Burst
  // - At 100 Whimsy Essence, it resets and grants 25 Ingenuity Essence
  // - At 100 Ingenuity Essence, it resets and triggers Ingenuity Overload
  const baseWhimsyEssencePerSec = 20;
  const whimsyEssenceOnBurst = sumByValue(
    filterMods(mods, "RestoreWhimsyEssenceOnSpellBurst"),
  );
  const whimsyEssenceRecoverSpeedMult = calcEffMult(
    mods,
    "WhimsyEssenceRecoverySpeedPct",
  );

  // Burst gains can overshoot 100 and waste essence. Assuming uniform
  // position in cycle when burst occurs: efficiency ≈ 1 - W/200
  const burstEfficiency = 1 - whimsyEssenceOnBurst / 200;
  const whimsyEssencePerSec =
    baseWhimsyEssencePerSec * whimsyEssenceRecoverSpeedMult +
    whimsyEssenceOnBurst * burstsPerSec * burstEfficiency;

  // 100 Whimsy → 25 Ingenuity, 100 Ingenuity → 1 Overload
  // So 400 Whimsy Essence = 1 Ingenuity Overload
  const ingenuityOverloadPerSec = whimsyEssencePerSec / 400;

  const normalBurstsPerSec = burstsPerSec - 0.5 * ingenuityOverloadPerSec;
  const normalAvgDps =
    normalBurstsPerSec *
    maxSpellBurst *
    avgHit *
    spellBurstDmgMult *
    spellRippleMult;
  // overload triggers +200% additional max spell burst
  const overloadAvgDps =
    ingenuityOverloadPerSec *
    (3 * maxSpellBurst) *
    avgHit *
    spellBurstDmgMult *
    spellRippleMult;
  return {
    burstsPerSec,
    maxSpellBurst,
    avgDps: normalAvgDps,
    ingenuityOverload: {
      avgDps: overloadAvgDps,
      interval: 1 / ingenuityOverloadPerSec,
    },
  };
};

// Calculates offense for all enabled implemented skills
export const calculateOffense = (input: OffenseInput): OffenseResults => {
  const { loadout, configuration: config } = input;
  const loadoutMods = [
    ...collectMods(loadout),
    ...calculateHeroTraitMods(loadout),
  ];

  const derivedCtx = resolveDerivedCtx(loadout, loadoutMods);
  const resourcePool = calculateResourcePool(
    loadoutMods,
    loadout,
    config,
    derivedCtx,
  );

  const unresolvedLoadoutAndBuffMods = [
    ...loadoutMods,
    ...calculateImplicitMods(),
    ...resolveBuffSkillMods(loadout, loadoutMods, config, derivedCtx),
  ];

  const defenses = calculateDefenses(
    unresolvedLoadoutAndBuffMods,
    loadout,
    config,
    derivedCtx,
  );

  const skillSlots = listActiveSkillSlots(loadout);
  const enabledSlots = skillSlots.filter(
    (s) => s.enabled && s.skillName !== undefined,
  );

  //  Calculate for each implemented skill
  const skills: OffenseResults["skills"] = {};
  for (const slot of enabledSlots) {
    const perSkillContext = resolvePerSkillMods(
      slot,
      loadoutMods,
      loadout,
      config,
      derivedCtx,
    );
    if (perSkillContext === undefined) {
      continue; // Skip non-implemented skills
    }
    const skillLevel =
      (slot.level || 20) +
      calculateAddedSkillLevels(
        loadoutMods,
        perSkillContext.skill,
        loadout,
        config,
        derivedCtx,
      );

    const derivedOffenseCtx = resolveModsForOffenseSkill(
      [...unresolvedLoadoutAndBuffMods, ...perSkillContext.mods],
      perSkillContext.skill,
      skillLevel,
      resourcePool,
      loadout,
      config,
      derivedCtx,
    );
    const { mods, movementSpeedBonusPct } = derivedOffenseCtx;

    const attackHitSummary = calcAvgAttackDps(
      mods,
      loadout,
      perSkillContext,
      skillLevel,
      derivedOffenseCtx,
      derivedCtx,
      config,
    );

    const slashStrikeDpsSummary = calcAvgSlashStrikeDps(
      mods,
      loadout,
      perSkillContext,
      skillLevel,
      derivedOffenseCtx,
      derivedCtx,
      config,
    );

    const spellDpsSummary = calcAvgSpellDps(
      mods,
      loadout,
      perSkillContext,
      skillLevel,
      derivedCtx,
      config,
    );

    const spellBurstDpsSummary =
      spellDpsSummary !== undefined
        ? calcAvgSpellBurstDps(
            mods,
            spellDpsSummary.avgHitWithCrit,
            derivedOffenseCtx,
            derivedCtx,
          )
        : undefined;

    const persistentDpsSummary = calcAvgPersistentDps({
      mods,
      loadout,
      perSkillContext,
      skillLevel,
      config,
    });

    const totalReapDpsSummary =
      persistentDpsSummary !== undefined
        ? calcTotalReapDps(mods, persistentDpsSummary)
        : undefined;

    const totalDps =
      (attackHitSummary?.avgDps ?? 0) +
      (slashStrikeDpsSummary?.avgDps ?? 0) +
      (spellDpsSummary?.avgDps ?? 0) +
      (spellBurstDpsSummary?.avgDps ?? 0) +
      (spellBurstDpsSummary?.ingenuityOverload?.avgDps ?? 0) +
      (persistentDpsSummary?.total ?? 0) +
      (totalReapDpsSummary?.totalReapDps ?? 0);

    skills[slot.skillName as ImplementedActiveSkillName] = {
      attackDpsSummary: attackHitSummary,
      slashStrikeDpsSummary,
      spellDpsSummary,
      spellBurstDpsSummary,
      persistentDpsSummary,
      totalReapDpsSummary,
      totalDps,
      movementSpeedBonusPct,
      resolvedMods: mods,
    };
  }

  return { skills, resourcePool, defenses };
};
