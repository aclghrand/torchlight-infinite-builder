import { type CoreTalentName, CoreTalentNames } from "../../data/core_talent";
import type { Mod, PerStackable } from "../mod";
import { StatWordMapping } from "./enums";
import { spec, t } from "./template";

// Literal constants to avoid `as const` throughout
const GLOBAL = "global" as const;
const ATTACK = "attack" as const;
const AILMENT = "ailment" as const;
const HAS_FULL_MANA = "has_full_mana" as const;
const HAS_ELITES_NEARBY = "has_elites_nearby" as const;
const ENEMY_HAS_AILMENT = "enemy_has_ailment" as const;
const HAS_FOCUS_BLESSING = "has_focus_blessing" as const;
const HAS_BLOCKED_RECENTLY = "has_blocked_recently" as const;
const HAS_CRIT_RECENTLY = "has_crit_recently" as const;
const FROSTBITE_RATING = "frostbite_rating" as const;
const MANA_CONSUMED_RECENTLY = "mana_consumed_recently" as const;
const TARGET_ENEMY_IS_IN_PROXIMITY = "target_enemy_is_in_proximity" as const;
const TARGET_ENEMY_IS_NEARBY = "target_enemy_is_nearby" as const;
const ALL = "all" as const;

const coreTalentNameSet = new Set(CoreTalentNames.map((name) => name.toLowerCase()));

export const allParsers = [
  // Core talent names - matches exact talent name
  {
    parse(input: string): Mod[] | undefined {
      if (!coreTalentNameSet.has(input)) return undefined;
      const name = CoreTalentNames.find((n) => n.toLowerCase() === input) as CoreTalentName;
      return [{ type: "CoreTalent", name }];
    },
  },
  t("{aspd:dec%} gear attack speed. {dmg:dec%} additional attack damage").outputMany([
    spec("GearAspdPct", (c) => ({ value: c.aspd })),
    spec("DmgPct", (c) => ({ value: c.dmg, addn: true, dmgModType: ATTACK })),
  ]),
  t(
    "adds {min:int} - {max:int} {dmgType:DmgChunkType} damage to attacks and spells for every {amt:int} mana consumed recently. stacks up to {limit:int} time\\(s\\)",
  ).outputMany([
    spec("FlatDmgToAtks", (c) => {
      const per: PerStackable = { stackable: MANA_CONSUMED_RECENTLY, amt: c.amt, limit: c.limit };
      return { value: { min: c.min, max: c.max }, dmgType: c.dmgType, per };
    }),
    spec("FlatDmgToSpells", (c) => {
      const per: PerStackable = { stackable: MANA_CONSUMED_RECENTLY, amt: c.amt, limit: c.limit };
      return { value: { min: c.min, max: c.max }, dmgType: c.dmgType, per };
    }),
  ]),
  t("adds {min:int} - {max:int} {dmgType:DmgChunkType} damage to attacks and spells").outputMany([
    spec("FlatDmgToAtks", (c) => ({ value: { min: c.min, max: c.max }, dmgType: c.dmgType })),
    spec("FlatDmgToSpells", (c) => ({ value: { min: c.min, max: c.max }, dmgType: c.dmgType })),
  ]),
  t(
    "{value:dec%} critical strike rating and critical strike damage for every {amt:int} mana consumed recently",
  ).outputMany([
    spec("CritRatingPct", (c) => {
      const per: PerStackable = { stackable: MANA_CONSUMED_RECENTLY, amt: c.amt };
      return { value: c.value, modType: GLOBAL, per };
    }),
    spec("CritDmgPct", (c) => {
      const per: PerStackable = { stackable: MANA_CONSUMED_RECENTLY, amt: c.amt };
      return { value: c.value, modType: GLOBAL, addn: false, per };
    }),
  ]),
  t("{value:dec%} critical strike rating and critical strike damage").outputMany([
    spec("CritRatingPct", (c) => ({ value: c.value, modType: GLOBAL })),
    spec("CritDmgPct", (c) => ({ value: c.value, modType: GLOBAL, addn: false })),
  ]),
  t("{value:dec%} {modType:DmgModType} damage for every {amt:int} mana consumed recently, up to {limit:dec%}").output(
    "DmgPct",
    (c) => {
      const per: PerStackable = { stackable: MANA_CONSUMED_RECENTLY, amt: c.amt, valueLimit: c.limit };
      return { value: c.value, dmgModType: c.modType, addn: false, per };
    },
  ),
  t("{value:dec%} additional damage for the next skill when mana reaches the max").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: true,
    cond: HAS_FULL_MANA,
  })),
  t("{value:dec%} additional damage against enemies with elemental ailments").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: true,
    cond: ENEMY_HAS_AILMENT,
  })),
  t("{value:dec%} damage when focus blessing is active").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: false,
    cond: HAS_FOCUS_BLESSING,
  })),
  t("{value:dec%} damage if you have blocked recently").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: false,
    cond: HAS_BLOCKED_RECENTLY,
  })),
  t(
    "deals {value:dec%} additional damage to an enemy for every {amt:int} points of frostbite rating the enemy has",
  ).output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: true,
    per: { stackable: FROSTBITE_RATING, amt: c.amt },
  })),
  t(
    "deals up to {value:dec%} additional attack damage to enemies in proximity, and this (effect|damage) reduces as the distance from the enemy grows",
  ).output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: ATTACK,
    addn: true,
    cond: TARGET_ENEMY_IS_IN_PROXIMITY,
  })),
  t(
    "{value:dec%} additional attack damage and ailment damage dealt by attacks when there are elites within 10m nearby",
  ).outputMany([
    spec("DmgPct", (c) => ({ value: c.value, dmgModType: ATTACK, addn: true, cond: HAS_ELITES_NEARBY })),
    spec("DmgPct", (c) => ({ value: c.value, dmgModType: AILMENT, addn: true, cond: HAS_ELITES_NEARBY })),
  ]),
  t("{value:dec%} additional attack damage dealt to nearby enemies").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: ATTACK,
    addn: true,
    cond: TARGET_ENEMY_IS_NEARBY,
  })),
  t("{value:dec%} [additional] damage over time").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: "damage_over_time" as const,
    addn: c.additional !== undefined,
  })),
  t("{value:dec%} [additional] damage for channeled skills").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: "channeled" as const,
    addn: c.additional !== undefined,
  })),
  t("{value:dec%} [additional] [{modType:DmgModType}] damage").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: c.modType ?? "global",
    addn: c.additional !== undefined,
  })),
  t("{value:dec%} [{modType:CritRatingModType}] critical strike rating").output("CritRatingPct", (c) => ({
    value: c.value,
    modType: c.modType ?? "global",
  })),
  t("{value:dec%} [additional] [{modType:CritDmgModType}] critical strike damage").output("CritDmgPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
    modType: c.modType ?? "global",
  })),
  t("{value:dec%} [additional] minion attack and cast speed").output("MinionAspdAndCspdPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:dec%} [additional] attack and cast speed when at full mana").outputMany([
    spec("AspdPct", (c) => ({ value: c.value, addn: c.additional !== undefined, cond: HAS_FULL_MANA })),
    spec("CspdPct", (c) => ({ value: c.value, addn: c.additional !== undefined, cond: HAS_FULL_MANA })),
  ]),
  t("{value:dec%} [additional] attack and cast speed").outputMany([
    spec("AspdPct", (c) => ({ value: c.value, addn: c.additional !== undefined })),
    spec("CspdPct", (c) => ({ value: c.value, addn: c.additional !== undefined })),
  ]),
  t("{value:dec%} additional attack speed when only {count:int} enemies are nearby").output("AspdPct", (c) => ({
    value: c.value,
    addn: true,
    condThreshold: {
      target: "num_enemies_nearby" as const,
      comparator: "eq" as const,
      value: c.count,
    },
  })),
  t("{value:dec%} additional attack speed if you have dealt a critical strike recently").output("AspdPct", (c) => ({
    value: c.value,
    addn: true,
    cond: HAS_CRIT_RECENTLY,
  })),
  t("{value:dec%} [additional] attack speed").output("AspdPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:dec%} [additional] cast speed").output("CspdPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:dec%} gear attack speed").output("GearAspdPct", (c) => ({ value: c.value })),
  t("{value:dec%} fervor effect").output("FervorEffPct", (c) => ({ value: c.value })),
  t("{value:dec%} steep strike chance").output("SteepStrikeChancePct", (c) => ({ value: c.value })),
  t
    .multi([t("{value:int} shadow quantity"), t("shadow quantity {value:int}")])
    .output("ShadowQuant", (c) => ({ value: c.value })),
  t("{value:dec%} [additional] shadow damage").output("ShadowDmgPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("adds {value:dec%} of {from:DmgChunkType} damage (to|as) {to:DmgChunkType} damage").output("AddsDmgAsPct", (c) => ({
    from: c.from,
    to: c.to,
    value: c.value,
  })),
  t("{value:dec%} elemental and erosion resistance penetration").output("ResPenPct", (c) => ({
    value: c.value,
    penType: ALL,
  })),
  t
    .multi([
      t("{value:dec%} {penType:ResPenType} resistance penetration"),
      t("{value:dec%} {penType:ResPenType} penetration"),
    ])
    .output("ResPenPct", (c) => ({ value: c.value, penType: c.penType })),
  t("{value:dec%} armor dmg mitigation penetration").output("ArmorPenPct", (c) => ({ value: c.value })),
  t("{value:dec%} chance to deal double damage").output("DoubleDmgChancePct", (c) => ({ value: c.value })),
  t("adds {min:int} - {max:int} {dmgType:DmgChunkType} damage to attacks").output("FlatDmgToAtks", (c) => ({
    value: { min: c.min, max: c.max },
    dmgType: c.dmgType,
  })),
  t("adds {min:int} - {max:int} {dmgType:DmgChunkType} damage to spells").output("FlatDmgToSpells", (c) => ({
    value: { min: c.min, max: c.max },
    dmgType: c.dmgType,
  })),
  t("{value:dec} max mana").output("MaxMana", (c) => ({ value: c.value })),
  t("{value:dec} mana per {amt:int} intelligence").output("MaxMana", (c) => ({
    value: c.value,
    per: { stackable: "int", amt: c.amt },
  })),
  t("{value:dec%} [additional] max mana").output("MaxManaPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:dec%} attack block chance").output("AttackBlockChancePct", (c) => ({ value: c.value })),
  t("{value:dec%} spell block chance").output("SpellBlockChancePct", (c) => ({ value: c.value })),
  t("{value:dec%} [additional] max life").output("MaxLifePct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:dec%} [additional] max energy shield").output("MaxEnergyShieldPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:dec%} [additional] armor").output("ArmorPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:dec%} [additional] evasion").output("EvasionPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:dec%} max elemental and erosion resistance").outputMany([
    spec("MaxResistancePct", (c) => ({ value: c.value, resType: "elemental" as const })),
    spec("MaxResistancePct", (c) => ({ value: c.value, resType: "erosion" as const })),
  ]),
  t("{value:dec%} elemental and erosion resistance").outputMany([
    spec("ResistancePct", (c) => ({ value: c.value, resType: "elemental" as const })),
    spec("ResistancePct", (c) => ({ value: c.value, resType: "erosion" as const })),
  ]),
  t("{value:dec%} max {resType:ResType} resistance").output("MaxResistancePct", (c) => ({
    value: c.value,
    resType: c.resType,
  })),
  t("{value:dec%} {resType:ResType} resistance").output("ResistancePct", (c) => ({
    value: c.value,
    resType: c.resType,
  })),

  t("{value:dec%} energy shield regain").output("EnergyShieldRegainPct", (c) => ({ value: c.value })),
  t("{value:dec%} life regain").output("LifeRegainPct", (c) => ({ value: c.value })),
  t("{value:dec} {statModType:StatWord} per {amt:int} level\\(s\\)")
    .enum("StatWord", StatWordMapping)
    .output("Stat", (c) => ({
      value: c.value,
      statModType: c.statModType,
      per: { stackable: "level" as const, amt: c.amt },
    })),
  t("{value:dec} {statModType:StatWord}")
    .enum("StatWord", StatWordMapping)
    .output("Stat", (c) => ({ value: c.value, statModType: c.statModType })),
  t("{value:dec} all stats").output("Stat", (c) => ({ value: c.value, statModType: "all" as const })),
  t("{value:dec%} {statModType:StatWord}")
    .enum("StatWord", StatWordMapping)
    .output("StatPct", (c) => ({ value: c.value, statModType: c.statModType })),
  t("{value:dec%} all stats").output("StatPct", (c) => ({ value: c.value, statModType: "all" as const })),
  t("max focus blessing stacks \\+{value:int}").output("MaxFocusBlessing", (c) => ({ value: c.value })),
  t("max agility blessing stacks \\+{value:int}").output("MaxAgilityBlessing", (c) => ({ value: c.value })),
  t("max channeled stacks \\+{value:int}").output("MaxChannel", (c) => ({ value: c.value })),
  t("has hasten").output("HasHasten", () => ({})),
  t("{value:dec%} [additional] movement speed").output("MovementSpeedPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("\\+{value:int} {skillLevelType:SkillLevelType} skill level").output("SkillLevel", (c) => ({
    value: c.value,
    skillLevelType: c.skillLevelType,
  })),
  t("for every {amt:dec%} life sealed when at full mana, main skill's level \\+1").output("SkillLevel", (c) => ({
    value: 1,
    skillLevelType: "main" as const,
    per: { stackable: "sealed_life_pct" as const, amt: c.amt },
    cond: HAS_FULL_MANA,
  })),
  t("\\+{value:int} to hero trait level").output("HeroTraitLevel", (c) => ({ value: c.value })),
  t("{min:int} - {max:int} physical damage").output("GearBasePhysDmg", (c) => ({
    value: (c.min + c.max) / 2,
  })),
  t("{value:int} critical strike rating").output("GearBaseCritRating", (c) => ({ value: c.value })),
  t("{value:dec} attack speed").output("GearBaseAttackSpeed", (c) => ({ value: c.value })),
  t(
    "reaps {duration:dec} s of damage over time when dealing damage over time. the effect has a {cooldown:dec} s cooldown against the same target",
  ).output("Reap", (c) => ({ duration: c.duration, cooldown: c.cooldown })),
  t("{value:dec%} reaping duration").output("ReapDurationPct", (c) => ({ value: c.value })),
  t("{value:dec%} [additional] reaping cooldown recovery speed").output("ReapCdrPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:dec} affliction inflicted per second").output("AfflictionInflictedPerSec", (c) => ({ value: c.value })),
  t("{value:dec%} [additional] affliction effect").output("AfflictionEffectPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  // Sage's Insight resistance reduction mods
  t(
    "when a spell hit inflicts fire damage, {value:dec%} cold, lightning, and erosion resistance for the target for {dur:dec} s",
  ).outputMany([
    spec("EnemyRes", (c) => ({ value: c.value, resType: "cold" as const, cond: "sages_insight_fire" as const })),
    spec("EnemyRes", (c) => ({ value: c.value, resType: "lightning" as const, cond: "sages_insight_fire" as const })),
    spec("EnemyRes", (c) => ({ value: c.value, resType: "erosion" as const, cond: "sages_insight_fire" as const })),
  ]),
  t(
    "when a spell hit inflicts cold damage, {value:dec%} fire, lightning, and erosion resistance for the target for {dur:dec} s",
  ).outputMany([
    spec("EnemyRes", (c) => ({ value: c.value, resType: "fire" as const, cond: "sages_insight_cold" as const })),
    spec("EnemyRes", (c) => ({ value: c.value, resType: "lightning" as const, cond: "sages_insight_cold" as const })),
    spec("EnemyRes", (c) => ({ value: c.value, resType: "erosion" as const, cond: "sages_insight_cold" as const })),
  ]),
  t(
    "when a spell hit inflicts lightning damage, {value:dec%} fire, cold, and erosion resistance for the target for {dur:dec} s",
  ).outputMany([
    spec("EnemyRes", (c) => ({ value: c.value, resType: "fire" as const, cond: "sages_insight_lightning" as const })),
    spec("EnemyRes", (c) => ({ value: c.value, resType: "cold" as const, cond: "sages_insight_lightning" as const })),
    spec("EnemyRes", (c) => ({
      value: c.value,
      resType: "erosion" as const,
      cond: "sages_insight_lightning" as const,
    })),
  ]),
  t(
    "when a spell hit inflicts erosion damage, {value:dec%} fire, cold, and lightning resistance for the target for {dur:dec} s",
  ).outputMany([
    spec("EnemyRes", (c) => ({ value: c.value, resType: "fire" as const, cond: "sages_insight_erosion" as const })),
    spec("EnemyRes", (c) => ({ value: c.value, resType: "cold" as const, cond: "sages_insight_erosion" as const })),
    spec("EnemyRes", (c) => ({
      value: c.value,
      resType: "lightning" as const,
      cond: "sages_insight_erosion" as const,
    })),
  ]),
];
