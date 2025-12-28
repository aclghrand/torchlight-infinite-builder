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
const FROSTBITE_RATING = "frostbite_rating" as const;
const MANA_CONSUMED_RECENTLY = "mana_consumed_recently" as const;
const TARGET_ENEMY_IS_IN_PROXIMITY = "target_enemy_is_in_proximity" as const;
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
    spec("DmgPct", (c) => ({ value: c.dmg, addn: true, modType: ATTACK })),
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
      return { value: c.value, modType: c.modType, addn: false, per };
    },
  ),
  t("{value:dec%} additional damage for the next skill when mana reaches the max").output("DmgPct", (c) => ({
    value: c.value,
    modType: GLOBAL,
    addn: true,
    cond: HAS_FULL_MANA,
  })),
  t("{value:dec%} additional damage against enemies with elemental ailments").output("DmgPct", (c) => ({
    value: c.value,
    modType: GLOBAL,
    addn: true,
    cond: ENEMY_HAS_AILMENT,
  })),
  t("{value:dec%} damage when focus blessing is active").output("DmgPct", (c) => ({
    value: c.value,
    modType: GLOBAL,
    addn: false,
    cond: HAS_FOCUS_BLESSING,
  })),
  t("{value:dec%} damage if you have blocked recently").output("DmgPct", (c) => ({
    value: c.value,
    modType: GLOBAL,
    addn: false,
    cond: HAS_BLOCKED_RECENTLY,
  })),
  t(
    "deals {value:dec%} additional damage to an enemy for every {amt:int} points of frostbite rating the enemy has",
  ).output("DmgPct", (c) => ({
    value: c.value,
    modType: GLOBAL,
    addn: true,
    per: { stackable: FROSTBITE_RATING, amt: c.amt },
  })),
  t(
    "deals up to {value:dec%} additional attack damage to enemies in proximity, and this (effect|damage) reduces as the distance from the enemy grows",
  ).output("DmgPct", (c) => ({
    value: c.value,
    modType: ATTACK,
    addn: true,
    cond: TARGET_ENEMY_IS_IN_PROXIMITY,
  })),
  t(
    "{value:dec%} additional attack damage and ailment damage dealt by attacks when there are elites within 10m nearby",
  ).outputMany([
    spec("DmgPct", (c) => ({ value: c.value, modType: ATTACK, addn: true, cond: HAS_ELITES_NEARBY })),
    spec("DmgPct", (c) => ({ value: c.value, modType: AILMENT, addn: true, cond: HAS_ELITES_NEARBY })),
  ]),
  t("{value:dec%} [additional] [{modType:DmgModType}] damage").output("DmgPct", (c) => ({
    value: c.value,
    modType: c.modType ?? "global",
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
  t("{value:dec%} max life").output("MaxLifePct", (c) => ({ value: c.value })),
  t("{value:dec%} max energy shield").output("MaxEnergyShieldPct", (c) => ({ value: c.value })),
  t("{value:dec%} armor").output("ArmorPct", (c) => ({ value: c.value })),
  t("{value:dec%} evasion").output("EvasionPct", (c) => ({ value: c.value })),
  t("{value:dec%} energy shield regain").output("EnergyShieldRegainPct", (c) => ({ value: c.value })),
  t("{value:dec%} life regain").output("LifeRegainPct", (c) => ({ value: c.value })),
  t("{value:dec} {statType:StatWord}")
    .enum("StatWord", StatWordMapping)
    .output("Stat", (c) => ({ value: c.value, statType: c.statType })),
  t("{value:dec%} {statType:StatWord}")
    .enum("StatWord", StatWordMapping)
    .output("StatPct", (c) => ({ value: c.value, statType: c.statType })),
  t("max focus blessing stacks \\+{value:int}").output("MaxFocusBlessing", (c) => ({ value: c.value })),
  t("max agility blessing stacks \\+{value:int}").output("MaxAgilityBlessing", (c) => ({ value: c.value })),
];
