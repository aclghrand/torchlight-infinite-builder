import * as R from "remeda";
import { match } from "ts-pattern";
import { bing2, type HeroName } from "@/src/data/hero_trait";
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
  type SkillOffense,
  type SkillOffenseOfType,
  type SkillOffenseType,
  SupportSkills,
} from "../../data/skill";
import type { DmgModType } from "../constants";
import type {
  ActivationMediumSkillSlot,
  BaseSupportSkillSlot,
  Configuration,
  DmgRange,
  Loadout,
  MagnificentSupportSkillSlot,
  NobleSupportSkillSlot,
  SkillSlot,
} from "../core";
import { getHeroTraitMods } from "../hero/hero_trait_mods";
import type { DmgChunkType, Mod, ModT, ResType, StatType } from "../mod";
import { getActiveSkillMods } from "../skills/active_mods";
import { getPassiveSkillMods } from "../skills/passive_mods";
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
  type GearDmg,
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
  resolveCoreTalentMods,
  sumByValue,
} from "./mod-utils";
import type { OffenseSkillName } from "./skill_confs";
import { multModValue, multValue } from "./util";

// Re-export types that consumers expect from offense.ts
export type { DmgChunk, DmgPools, DmgRanges };
export { collectMods, convertDmg };

export interface OffenseAttackDpsSummary {
  critChance: number;
  critDmgMult: number;
  aspd: number;
  avgHit: number;
  avgHitWithCrit: number;
  avgDps: number;
}

interface OffenseSummary {
  attackDpsSummary?: OffenseAttackDpsSummary;
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

// === Resource Pool Types ===

export interface ResourcePool {
  stats: Stats;
  maxLife: number;
  maxMana: number;
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
    {
      type: "DmgPct",
      value: 0.5,
      dmgModType: "global",
      addn: true,
      per: { stackable: "main_stat" },
      src: "Additional Damage from skill Main Stat (.5% per stat)",
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
    // Infiltrations
    {
      type: "DmgPct",
      value: 13,
      addn: true,
      dmgModType: "cold",
      cond: "enemy_has_cold_infiltration",
      isEnemyDebuff: true,
      src: "Cold Infiltration",
    },
    {
      type: "DmgPct",
      value: 13,
      addn: true,
      dmgModType: "lightning",
      cond: "enemy_has_lightning_infiltration",
      isEnemyDebuff: true,
      src: "Lightning Infiltration",
    },
    {
      type: "DmgPct",
      value: 13,
      addn: true,
      dmgModType: "fire",
      cond: "enemy_has_fire_infiltration",
      isEnemyDebuff: true,
      src: "Fire Infiltration",
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

const getLevelOffense = <T extends SkillOffenseType>(
  skill: BaseActiveSkill,
  skillOffenseType: T,
  level: number,
): Extract<SkillOffense, { type: T }> | undefined => {
  const skillMods = getActiveSkillMods(skill.name as ActiveSkillName, level);
  if (skillMods.offense === undefined) {
    console.error(`Skill "${skill.name}" has no levelOffense data`);
    return undefined;
  }
  const offense = skillMods.offense.find((o) => o.type === skillOffenseType);
  if (offense === undefined) {
    console.error(
      `Skill "${skill.name}" has no ${skillOffenseType} in levelOffense`,
    );
    return undefined;
  }
  return offense as Extract<SkillOffense, { type: T }>;
};

const getLevelOffenseValue = (
  skill: BaseActiveSkill,
  skillOffenseType: SkillOffenseType,
  level: number,
): number | DmgRange | undefined => {
  return getLevelOffense(skill, skillOffenseType, level)?.value ?? undefined;
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
  gearDmg: GearDmg,
  flatDmg: DmgRanges,
  mods: Mod[],
  skill: BaseActiveSkill,
  level: number,
  derivedCtx: DerivedCtx,
  config: Configuration,
): SkillHitOverview | undefined => {
  const skillWeaponDR = match(skill.name as ActiveSkillName)
    .with("Frost Spike", () => {
      const weaponAtkDmgPct = getLevelOffenseValue(
        skill,
        "WeaponAtkDmgPct",
        level,
      );
      if (typeof weaponAtkDmgPct !== "number") {
        return undefined;
      }
      return multDRs(gearDmg.mainHand, weaponAtkDmgPct / 100);
    })
    .with("[Test] Simple Attack", () => {
      return gearDmg.mainHand;
    })
    .otherwise(() => {
      // either it's unimplemented, not an attack
      return;
    });
  if (skillWeaponDR === undefined) {
    return;
  }
  const addedDmgEffPct = getLevelOffenseValue(skill, "AddedDmgEffPct", level);
  if (typeof addedDmgEffPct !== "number") {
    return undefined;
  }
  const skillFlatDR = multDRs(flatDmg, addedDmgEffPct / 100);
  const skillBaseDmg = addDRs(skillWeaponDR, skillFlatDR);

  // Apply % bonuses to each pool, considering conversion history
  const addSpellTag =
    skill.tags.includes("Attack") &&
    findMod(mods, "SpellDmgBonusAppliesToAtkDmg") !== undefined;

  const baseDmgModTypes: DmgModType[] = addSpellTag
    ? [...dmgModTypesForSkill(skill), "spell"]
    : dmgModTypesForSkill(skill);

  // Damage conversion happens after flat damage, before % bonuses
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
}

const resolveDerivedCtx = (loadout: Loadout, mods: Mod[]): DerivedCtx => {
  const hasHasten = findMod(mods, "HasHasten") !== undefined;
  const hasBlasphemer = findMod(mods, "Blasphemer") !== undefined;
  const luckyDmg = findMod(mods, "LuckyDmg") !== undefined;
  const hero = loadout.heroPage.selectedHero;
  return { hasHasten, hasBlasphemer, luckyDmg, hero };
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
  return {
    prenormMods,
    mods: filterOutPerMods(prenormMods),
  };
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
    const isAuraSkill =
      (skill.type === "Passive" && skill.tags?.includes("Aura")) ?? false;
    const isCurseSkill =
      (skill.type === "Active" && skill.tags?.includes("Curse")) ?? false;

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
        activeMods.buffMods?.map((mod) => ({
          ...mod,
          src: `${isAuraSkill ? "Aura" : "Buff"}: ${skill.name} Lv.${level}`,
        })) ?? [];
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
        passiveMods.buffMods?.map((mod) => ({
          ...mod,
          src: `${isAuraSkill ? "Aura" : "Buff"}: ${skill.name} Lv.${level}`,
        })) ?? [];
    }

    const prenormMods = [...loadoutMods, ...supportMods, ...levelMods];
    const { skillEffMult, auraEffMult, curseEffMult } =
      resolveBuffSkillEffMults(prenormMods, loadout, config, derivedCtx);

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
        if (isAuraSkill) {
          finalValue = multValue(finalValue, auraEffMult);
        } else if (isCurseSkill) {
          finalValue = multValue(finalValue, curseEffMult);
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
      mods.push({
        ...mod,
        src: `${prefix}: ${ss.name}${tierPart}${rankPart}`,
      });
    }
  }
  return mods;
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
      const supportSkill = SupportSkills.find((s) => s.name === ss.name) as
        | BaseSupportSkill
        | undefined;
      if (supportSkill === undefined) continue;

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
      const affixes = buildSupportSkillAffixes(ss.name, level);
      for (const affix of affixes) {
        if (affix.mods !== undefined) {
          for (const { mod } of affix.mods) {
            supportMods.push({
              ...mod,
              src: `Support: ${ss.name} Lv.${level}`,
            });
          }
        }
      }
    }
    // Handle magnificent, noble, and activation medium support skills
    else {
      supportMods.push(...collectSupportAffixMods(ss));
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

  return {
    mods: [...selectedSkillMods, ...supportMods],
    skill,
  };
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
): { skillEffMult: number; auraEffMult: number; curseEffMult: number } => {
  const buffSkillEffMods = unresolvedModsFromParam.filter(
    (m) =>
      m.type === "AuraEffPct" ||
      m.type === "SkillEffPct" ||
      m.type === "CurseEffPct",
  );
  const { prenormMods, mods } = applyModFilters(
    buffSkillEffMods,
    loadout,
    config,
    derivedCtx,
  );
  const skillUse = 3;
  mods.push(...normalizeStackables(prenormMods, "skill_use", skillUse));

  const skillChargesOnUse = 2;
  mods.push(
    ...normalizeStackables(
      prenormMods,
      "skill_charges_on_use",
      skillChargesOnUse,
    ),
  );

  const crueltyBuffStacks = config.crueltyBuffStacks ?? 40;
  mods.push(
    ...normalizeStackables(prenormMods, "cruelty_buff", crueltyBuffStacks),
  );

  const skillEffMult = calcEffMult(mods, "SkillEffPct");
  const auraEffMult = calcEffMult(mods, "AuraEffPct");
  const curseEffMult = calcEffMult(mods, "CurseEffPct");

  return { skillEffMult, auraEffMult, curseEffMult };
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
  mods.push(
    ...normalizeStackables(prenormMods, "sealed_life_pct", sealedLifePct),
  );

  let addedSkillLevels = 0;
  for (const mod of filterMods(mods, "SkillLevel")) {
    const matches = match(mod.skillLevelType)
      .with(
        "main",
        () => skill.name === loadout.skillPage.activeSkills[1]?.skillName,
      )
      .with("support", () => skill.type === "Support")
      .with("active", () => skill.type === "Active")
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

interface DerivedOffenseCtx {
  maxSpellBurst: number;
  movementSpeedBonusPct: number;
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

  mods.push(...normalizeStackables(prenormMods, "level", config.level));

  const totalMainStats = calculateTotalMainStats(skill, stats);
  mods.push(...normalizeStackables(prenormMods, "main_stat", totalMainStats));

  const highestStat = Math.max(stats.dex, stats.int, stats.str);
  mods.push(...normalizeStackables(prenormMods, "highest_stat", highestStat));

  const sumStats = stats.dex + stats.int + stats.str;
  mods.push(...normalizeStackables(prenormMods, "stat", sumStats));

  if (config.targetEnemyHasWhimsySignal) {
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
  }

  const movementSpeedBonusPct =
    (calcEffMult(mods, "MovementSpeedPct") - 1) * 100;
  mods.push(
    ...normalizeStackables(
      prenormMods,
      "movement_speed_bonus_pct",
      movementSpeedBonusPct,
    ),
  );

  // squidnova
  if (config.hasSquidnova) {
    const squidNovaEffMult = calcEffMult(mods, "SquidnovaEffPct");
    const squidNovaDmgPctValue = 16 * squidNovaEffMult;
    mods.push({
      type: "DmgPct",
      value: squidNovaDmgPctValue,
      dmgModType: "hit",
      addn: true,
      src: "Squidnova",
    });
  }

  const jumps = sumByValue(filterMods(mods, "Jump"));
  mods.push(...normalizeStackables(prenormMods, "jump", jumps));

  // chain lightning
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

  // frail - additionally increases spell damage taken by 15%
  if (config.targetEnemyHasFrail) {
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
  }

  // must happen after movement_speed_bonus_pct normalization
  const maxSpellBurst = sumByValue(filterMods(mods, "MaxSpellBurst"));
  mods.push(
    ...normalizeStackables(prenormMods, "max_spell_burst", maxSpellBurst),
  );

  mods.push(
    ...normalizeStackables(
      prenormMods,
      "additional_max_channel_stack",
      additionalMaxChanneledStacks,
    ),
  );

  const maxChannelStacks =
    (findMod(mods, "InitialMaxChannel")?.value ?? 0) +
    additionalMaxChanneledStacks;
  const mcMaxLinks = maxChannelStacks;
  const mcLinks = config.numMindControlLinksUsed ?? mcMaxLinks;
  mods.push(...normalizeStackables(prenormMods, "mind_control_link", mcLinks));
  mods.push(
    ...normalizeStackables(
      prenormMods,
      "unused_mind_control_link",
      mcMaxLinks - mcLinks,
    ),
  );

  mods.push(...calculateTorment(config));
  mods.push(...calculateAffliction(mods, config));

  const repentanceStacks = 4 + sumByValue(filterMods(mods, "MaxRepentance"));
  mods.push(
    ...normalizeStackables(prenormMods, "repentance", repentanceStacks),
  );

  mods.push(
    ...normalizeStackables(prenormMods, "focus_blessing", focusBlessings),
  );

  mods.push(
    ...normalizeStackables(prenormMods, "agility_blessing", agilityBlessings),
  );

  mods.push(
    ...normalizeStackables(prenormMods, "tenacity_blessing", tenacityBlessings),
  );

  mods.push(
    ...normalizeStackables(prenormMods, "desecration", desecration ?? 0),
  );

  mods.push(
    ...normalizeStackables(
      prenormMods,
      "has_hit_enemy_with_elemental_dmg_recently",
      config.hasHitEnemyWithElementalDmgRecently,
    ),
  );

  mods.push(
    ...normalizeStackables(
      prenormMods,
      "num_spell_skills_used_recently",
      config.numSpellSkillsUsedRecently,
    ),
  );

  const willpowerStacks = calculateWillpower(prenormMods);
  mods.push(...normalizeStackables(prenormMods, "willpower", willpowerStacks));

  const frostbitten = calculateEnemyFrostbitten(config);
  mods.push(
    ...normalizeStackables(prenormMods, "frostbite_rating", frostbitten.points),
  );

  // Note: BaseProjectileQuant is NOT counted toward "projectile" stackable
  const maxProjectiles = findMod(mods, "MaxProjectile")?.value;
  const projectiles = Math.trunc(
    Math.min(
      sumByValue(filterMods(mods, "Projectile")),
      maxProjectiles ?? Infinity,
    ),
  );
  mods.push(...normalizeStackables(prenormMods, "projectile", projectiles));

  if (resourcePool.hasFervor) {
    mods.push(calculateFervorCritRateMod(mods, resourcePool));
    mods.push(
      ...normalizeStackables(prenormMods, "fervor", resourcePool.fervorPts),
    );
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

  mods.push(...normalizeStackables(prenormMods, "max_mana", maxMana));
  if (mercuryPts !== undefined) {
    mods.push(...normalizeStackables(prenormMods, "mercury_pt", mercuryPts));
  }

  const manaConsumedRecently = config.manaConsumedRecently ?? 0;
  mods.push(
    ...normalizeStackables(
      prenormMods,
      "mana_consumed_recently",
      manaConsumedRecently,
    ),
  );

  const unsealedManaPct = 100 - (config.sealedManaPct ?? 0);
  mods.push(
    ...normalizeStackables(prenormMods, "unsealed_mana_pct", unsealedManaPct),
  );

  const unsealedLifePct = 100 - (config.sealedLifePct ?? 0);
  mods.push(
    ...normalizeStackables(prenormMods, "unsealed_life_pct", unsealedLifePct),
  );

  const numEnemiesAffectedByWarcry = config.numEnemiesAffectedByWarcry;
  mods.push(
    ...normalizeStackables(
      prenormMods,
      "num_enemies_affected_by_warcry",
      numEnemiesAffectedByWarcry,
    ),
  );

  return { mods, maxSpellBurst, movementSpeedBonusPct };
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

  mods.push(...normalizeStackables(prenormMods, "level", config.level));

  const stats = calculateStats(mods);

  mods.push(...normalizeStackables(prenormMods, "str", stats.str));
  mods.push(...normalizeStackables(prenormMods, "dex", stats.dex));
  mods.push(...normalizeStackables(prenormMods, "int", stats.int));

  const maxLifeFromMods = sumByValue(filterMods(mods, "MaxLife"));
  const maxLifeMult = calcEffMult(mods, "MaxLifePct");
  const maxLife = (50 + config.level * 13 + maxLifeFromMods) * maxLifeMult;

  const maxManaFromMods = sumByValue(filterMods(mods, "MaxMana"));
  const maxManaMult = calcEffMult(mods, "MaxManaPct");
  const maxMana = (40 + config.level * 5 + maxManaFromMods) * maxManaMult;

  mods.push(...normalizeStackables(prenormMods, "max_mana", maxMana));

  const mercuryPts = calculateMercuryPts(mods, loadout);
  if (mercuryPts !== undefined) {
    mods.push(...normalizeStackables(prenormMods, "mercury_pt", mercuryPts));
  }

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

  return {
    coldRes: calcRes(["cold", "elemental"]),
    lightningRes: calcRes(["lightning", "elemental"]),
    fireRes: calcRes(["fire", "elemental"]),
    erosionRes: calcRes(["erosion"]),
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
  const offense: SkillOffenseOfType<"PersistentDmg"> | undefined = match(
    skill.name as ActiveSkillName,
  )
    .with("[Test] Simple Persistent Spell", () => {
      return getLevelOffense(skill, "PersistentDmg", skillLevel);
    })
    .with("Mind Control", () => {
      return getLevelOffense(skill, "PersistentDmg", skillLevel);
    })
    .otherwise(() => {
      return undefined;
    });
  if (offense === undefined) return;

  const baseDmg: NumDmgValues = { [offense.dmgType]: offense.value };
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

  const duration = offense.duration * calcEffMult(mods, "SkillEffDurationPct");

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
    return {
      rawCooldown,
      duration,
      reapsPerSecond,
      dmgPerReap,
      reapDps,
    };
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

const calcAvgAttackDps = (
  mods: Mod[],
  loadout: Loadout,
  perSkillContext: PerSkillModContext,
  skillLevel: number,
  derivedCtx: DerivedCtx,
  config: Configuration,
): OffenseAttackDpsSummary | undefined => {
  const skill = perSkillContext.skill;
  const gearDmg = calculateGearDmg(loadout, mods);
  const flatDmg = calculateFlatDmg(mods, "attack");
  const skillHit = calculateAtkHit(
    gearDmg,
    flatDmg,
    mods,
    skill,
    skillLevel,
    derivedCtx,
    config,
  );
  if (skillHit === undefined) return;

  const aspd = calculateAspd(loadout, mods);
  const critChance = calculateCritChance(mods, skill);
  const critDmgMult = calculateCritDmg(mods, skill);
  const doubleDmgMult = calculateDoubleDmgMult(mods);
  const extraMult = calculateExtraOffenseMults(mods, config);

  const avgHitWithCrit =
    skillHit.avg * critChance * critDmgMult + skillHit.avg * (1 - critChance);
  const avgDps = avgHitWithCrit * doubleDmgMult * aspd * extraMult;
  return {
    critChance,
    critDmgMult,
    aspd,
    avgHit: skillHit.avg,
    avgHitWithCrit,
    avgDps,
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
  const offense = implementedSpells.includes(skill.name as ActiveSkillName)
    ? getLevelOffense(skill, "SpellDmg", level)
    : undefined;
  if (offense === undefined) {
    return undefined;
  }
  const { value: skillSpellDR, dmgType, castTime } = offense;
  const skillSpellDRs = {
    ...emptyDmgRanges(),
    [dmgType]: skillSpellDR,
  };

  const addedDmgEffPct = getLevelOffenseValue(skill, "AddedDmgEffPct", level);
  if (typeof addedDmgEffPct !== "number") {
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
  const doubleDmgMult = calculateDoubleDmgMult(mods);
  const extraMult = calculateExtraOffenseMults(mods, config);

  const avgHitWithCrit =
    avg * critChance * critDmgMult + avg * (1 - critChance);
  const avgDps = avgHitWithCrit * doubleDmgMult * cspd * extraMult;
  return {
    critChance,
    critDmgMult,
    castsPerSec: cspd,
    avgHitWithCrit,
    avgDps,
  };
};

export interface OffenseSpellBurstDpsSummary {
  burstsPerSec: number;
  maxSpellBurst: number;
  avgDps: number;
  ingenuityOverload?: {
    avgDps: number;
    interval: number;
  };
}

const calcAvgSpellBurstDps = (
  mods: Mod[],
  avgHit: number,
  maxSpellBurst: number,
  derivedCtx: DerivedCtx,
): OffenseSpellBurstDpsSummary => {
  const playSafe = findMod(mods, "PlaySafe");
  const baseBurstsPerSec = 0.5;
  const chargeSpeedMods = [
    ...filterMods(mods, "SpellBurstChargeSpeedPct"),
    ...(playSafe !== undefined
      ? filterMods(mods, "CspdPct").map((m) =>
          multModValue(m, playSafe.value / 100),
        )
      : []),
  ];
  const burstsPerSecMult = calcEffMult(chargeSpeedMods);
  const burstsPerSec = baseBurstsPerSec * burstsPerSecMult;
  const spellBurstDmgMult = calculateAddn(
    filterMods(mods, "SpellBurstAdditionalDmgPct").map((m) => m.value),
  );

  if (derivedCtx.hero !== bing2) {
    const avgDps = burstsPerSec * maxSpellBurst * avgHit * spellBurstDmgMult;
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
    normalBurstsPerSec * maxSpellBurst * avgHit * spellBurstDmgMult;
  // overload triggers +200% additional max spell burst
  const overloadAvgDps =
    ingenuityOverloadPerSec * (3 * maxSpellBurst) * avgHit * spellBurstDmgMult;
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
    ...resolveCoreTalentMods(collectMods(loadout)),
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

    const { mods, maxSpellBurst, movementSpeedBonusPct } =
      resolveModsForOffenseSkill(
        [...unresolvedLoadoutAndBuffMods, ...perSkillContext.mods],
        perSkillContext.skill,
        skillLevel,
        resourcePool,
        loadout,
        config,
        derivedCtx,
      );

    const attackHitSummary = calcAvgAttackDps(
      mods,
      loadout,
      perSkillContext,
      skillLevel,
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
            maxSpellBurst,
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
      (spellDpsSummary?.avgDps ?? 0) +
      (spellBurstDpsSummary?.avgDps ?? 0) +
      (spellBurstDpsSummary?.ingenuityOverload?.avgDps ?? 0) +
      (persistentDpsSummary?.total ?? 0) +
      (totalReapDpsSummary?.totalReapDps ?? 0);

    skills[slot.skillName as ImplementedActiveSkillName] = {
      attackDpsSummary: attackHitSummary,
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
