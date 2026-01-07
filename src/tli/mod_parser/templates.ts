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
const TARGET_ENEMY_FROZEN_RECENTLY = "target_enemy_frozen_recently" as const;
const HAS_BLUR = "has_blur" as const;
const BLUR_ENDED_RECENTLY = "blur_ended_recently" as const;
const HAS_SQUIDNOVA = "has_squidnova" as const;
const FROSTBITE_RATING = "frostbite_rating" as const;
const FERVOR = "fervor" as const;
const MANA_CONSUMED_RECENTLY = "mana_consumed_recently" as const;
const TARGET_ENEMY_IS_IN_PROXIMITY = "target_enemy_is_in_proximity" as const;
const TARGET_ENEMY_IS_NEARBY = "target_enemy_is_nearby" as const;
const ALL = "all" as const;
const ADDITIONAL_MAX_CHANNEL_STACK = "additional_max_channel_stack" as const;
const AT_MAX_CHANNELED_STACKS = "at_max_channeled_stacks" as const;
const ENEMY_IS_CURSED = "enemy_is_cursed" as const;
const HAVE_BOTH_SEALED_MANA_AND_LIFE = "have_both_sealed_mana_and_life" as const;
const TARGET_ENEMY_IS_ELITE = "target_enemy_is_elite" as const;
const MOVEMENT_SPEED_BONUS_PCT = "movement_speed_bonus_pct" as const;
const HAS_HIT_ENEMY_WITH_ELEMENTAL_DMG_RECENTLY = "has_hit_enemy_with_elemental_dmg_recently" as const;
const NUM_SPELL_SKILLS_USED_RECENTLY = "num_spell_skills_used_recently" as const;

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
  t("{aspd:+dec%} gear attack speed. {dmg:+dec%} additional attack damage").outputMany([
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
    "{value:+dec%} critical strike rating and critical strike damage for every {amt:int} mana consumed recently",
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
  t("{value:+dec%} critical strike rating and critical strike damage").outputMany([
    spec("CritRatingPct", (c) => ({ value: c.value, modType: GLOBAL })),
    spec("CritDmgPct", (c) => ({ value: c.value, modType: GLOBAL, addn: false })),
  ]),
  t("{value:+dec%} {modType:DmgModType} damage for every {amt:int} mana consumed recently, up to {limit:dec%}").output(
    "DmgPct",
    (c) => {
      const per: PerStackable = { stackable: MANA_CONSUMED_RECENTLY, amt: c.amt, valueLimit: c.limit };
      return { value: c.value, dmgModType: c.modType, addn: false, per };
    },
  ),
  t("{value:+dec%} additional damage per {amt:+dec%} movement speed, up to {limit:+dec%}").output("DmgPct", (c) => {
    const per: PerStackable = { stackable: MOVEMENT_SPEED_BONUS_PCT, amt: c.amt, valueLimit: c.limit };
    return { value: c.value, dmgModType: GLOBAL, addn: true, per };
  }),
  t(
    "for every stack of max spell burst, {value:+dec%} additional spell damage, up to {limit:+dec%} additional spell damage",
  ).output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: "spell" as const,
    addn: true,
    per: { stackable: "max_spell_burst" as const, valueLimit: c.limit },
  })),
  t("{value:+dec%} movement speed per stack of max spell burst, up to {limit:+dec%}").output(
    "MovementSpeedPct",
    (c) => ({
      value: c.value,
      addn: false,
      per: { stackable: "max_spell_burst" as const, valueLimit: c.limit },
    }),
  ),
  t("{value:+dec%} additional damage for the next skill when mana reaches the max").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: true,
    cond: HAS_FULL_MANA,
  })),
  t("{value:+dec%} additional damage against enemies with elemental ailments").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: true,
    cond: ENEMY_HAS_AILMENT,
  })),
  t(
    "{dmgValue:+dec%} additional damage dealt to cursed enemies. {takenValue:+int%} additional damage taken from cursed enemies",
  ).outputMany([
    spec("DmgPct", (c) => ({ value: c.dmgValue, dmgModType: GLOBAL, addn: true, cond: ENEMY_IS_CURSED })),
    spec("DmgTakenPct", (c) => ({ value: c.takenValue, cond: ENEMY_IS_CURSED })),
  ]),
  t("{value:+dec%} [additional] damage against cursed enemies").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: c.additional !== undefined,
    cond: ENEMY_IS_CURSED,
  })),
  t("{value:+dec%} additional erosion area damage against elites").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: "erosion_area" as const,
    addn: true,
    cond: TARGET_ENEMY_IS_ELITE,
  })),
  t("{value:+dec%} [additional] damage when having both sealed mana and life").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: c.additional !== undefined,
    cond: HAVE_BOTH_SEALED_MANA_AND_LIFE,
  })),
  t("{value:+dec%} damage when focus blessing is active").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: false,
    cond: HAS_FOCUS_BLESSING,
  })),
  t("{value:+dec%} spell damage when having focus blessing").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: "spell" as const,
    addn: false,
    cond: HAS_FOCUS_BLESSING,
  })),
  t("{value:+dec%} damage if you have blocked recently").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: false,
    cond: HAS_BLOCKED_RECENTLY,
  })),
  t("{value:+dec%} additional damage taken by enemies frozen by you recently").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: true,
    isEnemyDebuff: true,
    cond: TARGET_ENEMY_FROZEN_RECENTLY,
  })),
  t(
    "deals {value:+dec%} additional damage to an enemy for every {amt:int} points of frostbite rating the enemy has",
  ).output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: true,
    per: { stackable: FROSTBITE_RATING, amt: c.amt },
  })),
  t("{value:+dec%} additional damage per {amt:int} fervor rating").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: true,
    per: { stackable: FERVOR, amt: c.amt },
  })),
  t("{value:+dec%} damage per {amt:int} of the highest stat").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: false,
    per: { stackable: "highest_stat" as const, amt: c.amt },
  })),
  t("{value:+dec%} [additional] damage for every {amt:+int} additional max channeled stack\\(s\\)").output(
    "DmgPct",
    (c) => ({
      value: c.value,
      dmgModType: GLOBAL,
      addn: c.additional !== undefined,
      per: { stackable: ADDITIONAL_MAX_CHANNEL_STACK, amt: c.amt },
    }),
  ),
  t(
    "deals up to {value:+dec%} additional attack damage to enemies in proximity, and this (effect|damage) reduces as the distance from the enemy grows",
  ).output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: ATTACK,
    addn: true,
    cond: TARGET_ENEMY_IS_IN_PROXIMITY,
  })),
  t(
    "{value:+dec%} additional attack damage and ailment damage dealt by attacks when there are elites within 10m nearby",
  ).outputMany([
    spec("DmgPct", (c) => ({ value: c.value, dmgModType: ATTACK, addn: true, cond: HAS_ELITES_NEARBY })),
    spec("DmgPct", (c) => ({ value: c.value, dmgModType: AILMENT, addn: true, cond: HAS_ELITES_NEARBY })),
  ]),
  t("{value:+dec%} additional attack damage dealt to nearby enemies").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: ATTACK,
    addn: true,
    cond: TARGET_ENEMY_IS_NEARBY,
  })),
  t("blur gains an additional effect: {value:+dec%} additional damage over time").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: "damage_over_time" as const,
    addn: true,
    cond: HAS_BLUR,
  })),
  t("{value:+dec%} [additional] damage over time").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: "damage_over_time" as const,
    addn: c.additional !== undefined,
  })),
  t("{value:dec%} additional damage applied to life").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: true,
  })),
  t("at max channeled stacks, {value:+dec%} additional damage for channeled skills for {dur:int} s").output(
    "DmgPct",
    (c) => ({
      value: c.value,
      dmgModType: "channeled" as const,
      addn: true,
      cond: AT_MAX_CHANNELED_STACKS,
    }),
  ),
  t("{value:+dec%} [additional] damage for channeled skills").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: "channeled" as const,
    addn: c.additional !== undefined,
  })),
  t("{value:+dec%} additional damage for {dur:int} s after blur ends").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: true,
    cond: BLUR_ENDED_RECENTLY,
  })),
  t("{value:+dec%} [additional] elemental damage dealt by spell skills").output("ElementalSpellDmgPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:+dec%} [additional] [{modType:DmgModType}] damage").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: c.modType ?? "global",
    addn: c.additional !== undefined,
  })),
  t("{value:+dec%} [{modType:CritRatingModType}] critical strike rating").output("CritRatingPct", (c) => ({
    value: c.value,
    modType: c.modType ?? "global",
  })),
  t("{value:+int} [{modType:CritRatingModType}] critical strike rating").output("FlatCritRating", (c) => ({
    value: c.value,
    modType: c.modType ?? "global",
  })),
  t(
    "for each spell skill used recently, {value:+dec%} critical strike damage, stacking up to {limit:int} time\\(s\\)",
  ).output("CritDmgPct", (c) => ({
    value: c.value,
    addn: false,
    modType: GLOBAL,
    per: { stackable: NUM_SPELL_SKILLS_USED_RECENTLY, limit: c.limit },
  })),
  t("{value:+dec%} [{modType:CritDmgModType}] critical strike damage per stack of focus blessing owned").output(
    "CritDmgPct",
    (c) => ({
      value: c.value,
      addn: false,
      modType: c.modType ?? "global",
      per: { stackable: "focus_blessing" as const },
    }),
  ),
  t("{value:+dec%} [additional] physical skill critical strike damage").output("CritDmgPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
    modType: "physical_skill" as const,
  })),
  t("{value:+dec%} [additional] cold skill critical strike damage").output("CritDmgPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
    modType: "cold_skill" as const,
  })),
  t("{value:+dec%} [additional] lightning skill critical strike damage").output("CritDmgPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
    modType: "lightning_skill" as const,
  })),
  t("{value:+dec%} [additional] fire skill critical strike damage").output("CritDmgPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
    modType: "fire_skill" as const,
  })),
  t("{value:+dec%} [additional] erosion skill critical strike damage").output("CritDmgPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
    modType: "erosion_skill" as const,
  })),
  t("{value:+dec%} [additional] [{modType:CritDmgModType}] critical strike damage").output("CritDmgPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
    modType: c.modType ?? "global",
  })),
  t("{value:+dec%} [additional] minion attack and cast speed").outputMany([
    spec("MinionAspdPct", (c) => ({ value: c.value, addn: c.additional !== undefined })),
    spec("MinionCspdPct", (c) => ({ value: c.value, addn: c.additional !== undefined })),
  ]),
  t("{value:+dec%} [additional] minion attack speed").output("MinionAspdPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:+dec%} [additional] minion cast speed").output("MinionCspdPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:+dec%} [additional] minion critical strike rating").output("MinionCritRatingPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:+dec%} [additional] minion critical strike damage").output("MinionCritDmgPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:+dec%} [additional] minion {minionDmgModType:MinionDmgModType} damage").output("MinionDmgPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
    minionDmgModType: c.minionDmgModType,
  })),
  t("{value:+dec%} [additional] minion damage").output("MinionDmgPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:dec%} {penType:ResPenType} penetration for minions").output("MinionResPenPct", (c) => ({
    value: c.value,
    penType: c.penType,
  })),
  t("{value:+dec%} [additional] attack and cast speed when at full mana").outputMany([
    spec("AspdPct", (c) => ({ value: c.value, addn: c.additional !== undefined, cond: HAS_FULL_MANA })),
    spec("CspdPct", (c) => ({ value: c.value, addn: c.additional !== undefined, cond: HAS_FULL_MANA })),
  ]),
  t("{value:+dec%} [additional] attack and cast speed").outputMany([
    spec("AspdPct", (c) => ({ value: c.value, addn: c.additional !== undefined })),
    spec("CspdPct", (c) => ({ value: c.value, addn: c.additional !== undefined })),
  ]),
  t("{value:+dec%} additional attack speed when only {count:int} enemies are nearby").output("AspdPct", (c) => ({
    value: c.value,
    addn: true,
    condThreshold: {
      target: "num_enemies_nearby" as const,
      comparator: "eq" as const,
      value: c.count,
    },
  })),
  t("{value:+dec%} additional attack speed if you have dealt a critical strike recently").output("AspdPct", (c) => ({
    value: c.value,
    addn: true,
    cond: HAS_CRIT_RECENTLY,
  })),
  t("{value:+dec%} additional cast speed if you have dealt a critical strike recently").output("CspdPct", (c) => ({
    value: c.value,
    addn: true,
    cond: HAS_CRIT_RECENTLY,
  })),
  t("{value:+dec%} cast speed when focus blessing is active").output("CspdPct", (c) => ({
    value: c.value,
    addn: false,
    cond: HAS_FOCUS_BLESSING,
  })),
  t("{value:+dec%} [additional] attack speed").output("AspdPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:+dec%} [additional] cast speed").output("CspdPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:+dec%} gear attack speed").output("GearAspdPct", (c) => ({ value: c.value })),
  t("{value:+dec%} fervor effect").output("FervorEffPct", (c) => ({ value: c.value })),
  t("{value:+dec%} steep strike chance").output("SteepStrikeChancePct", (c) => ({ value: c.value })),
  t
    .multi([t("{value:+int} shadow quantity"), t("shadow quantity {value:+int}")])
    .output("ShadowQuant", (c) => ({ value: c.value })),
  t("{value:+dec%} [additional] shadow damage").output("ShadowDmgPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("adds {value:dec%} of {from:DmgChunkType} damage (to|as) {to:DmgChunkType} damage").output("AddsDmgAsPct", (c) => ({
    from: c.from,
    to: c.to,
    value: c.value,
  })),
  t(
    "{value:+dec%} elemental resistance penetration when hitting an enemy with elemental damage, stacking up to {limit:int} times",
  ).output("ResPenPct", (c) => ({
    value: c.value,
    penType: "elemental" as const,
    per: { stackable: HAS_HIT_ENEMY_WITH_ELEMENTAL_DMG_RECENTLY, amt: 1, limit: c.limit },
  })),
  t(
    "{value:dec%} elemental resistance penetration every time you hit an enemy with elemental damage recently. stacks up to {limit:int} times",
  ).output("ResPenPct", (c) => ({
    value: c.value,
    penType: "elemental" as const,
    per: { stackable: HAS_HIT_ENEMY_WITH_ELEMENTAL_DMG_RECENTLY, amt: 1, limit: c.limit },
  })),
  t("{value:+dec%} elemental and erosion resistance penetration").output("ResPenPct", (c) => ({
    value: c.value,
    penType: ALL,
  })),
  t
    .multi([
      t("{value:+dec%} {penType:ResPenType} resistance penetration"),
      t("{value:+dec%} {penType:ResPenType} penetration"),
    ])
    .output("ResPenPct", (c) => ({ value: c.value, penType: c.penType })),
  t("{value:dec%} {penType:ResPenType} penetration").output("ResPenPct", (c) => ({
    value: c.value,
    penType: c.penType,
  })),
  t("damage penetrates {value:dec%} {penType:ResPenType} resistance").output("ResPenPct", (c) => ({
    value: c.value,
    penType: c.penType,
  })),
  t("{value:+dec%} armor dmg mitigation penetration").output("ArmorPenPct", (c) => ({ value: c.value })),
  t("{value:+dec%} chance to deal double damage").output("DoubleDmgChancePct", (c) => ({ value: c.value })),
  t("adds {min:int} - {max:int} {dmgType:DmgChunkType} damage to attacks").output("FlatDmgToAtks", (c) => ({
    value: { min: c.min, max: c.max },
    dmgType: c.dmgType,
  })),
  t("adds {min:int} - {max:int} {dmgType:DmgChunkType} damage to spells").output("FlatDmgToSpells", (c) => ({
    value: { min: c.min, max: c.max },
    dmgType: c.dmgType,
  })),
  t("{value:+dec} max mana").output("MaxMana", (c) => ({ value: c.value })),
  t("{value:+dec} mana per {amt:int} intelligence").output("MaxMana", (c) => ({
    value: c.value,
    per: { stackable: "int", amt: c.amt },
  })),
  t("{value:+dec%} [additional] max mana").output("MaxManaPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:+dec%} attack block chance").output("AttackBlockChancePct", (c) => ({ value: c.value })),
  t("{value:+dec%} spell block chance").output("SpellBlockChancePct", (c) => ({ value: c.value })),
  t("{value:+dec} max life").output("MaxLife", (c) => ({ value: c.value })),
  t("{value:+dec%} [additional] max life").output("MaxLifePct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:+dec} max energy shield").output("MaxEnergyShield", (c) => ({ value: c.value })),
  t("{value:+dec%} [additional] max energy shield").output("MaxEnergyShieldPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:dec} max energy shield").output("MaxEnergyShield", (c) => ({ value: c.value })),
  t("{value:+dec%} [additional] armor").output("ArmorPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:+dec%} [additional] evasion").output("EvasionPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:+dec%} defense").output("DefensePct", (c) => ({ value: c.value })),
  t("{value:+int} gear energy shield").output("GearEnergyShield", (c) => ({ value: c.value })),
  t("{value:+int} gear armor").output("GearArmor", (c) => ({ value: c.value })),
  t("{value:+dec%} energy shield charge speed").output("EnergyShieldChargeSpeedPct", (c) => ({ value: c.value })),
  t("{value:+int} gear evasion").output("GearEvasion", (c) => ({ value: c.value })),
  t("{value:+int} armor and evasion").outputMany([
    spec("Armor", (c) => ({ value: c.value })),
    spec("Evasion", (c) => ({ value: c.value })),
  ]),
  t("{value:+dec%} max elemental and erosion resistance").outputMany([
    spec("MaxResistancePct", (c) => ({ value: c.value, resType: "elemental" as const })),
    spec("MaxResistancePct", (c) => ({ value: c.value, resType: "erosion" as const })),
  ]),
  t("{value:+dec%} elemental and erosion resistance").outputMany([
    spec("ResistancePct", (c) => ({ value: c.value, resType: "elemental" as const })),
    spec("ResistancePct", (c) => ({ value: c.value, resType: "erosion" as const })),
  ]),
  t("{value:+dec%} max {resType:ResType} resistance").output("MaxResistancePct", (c) => ({
    value: c.value,
    resType: c.resType,
  })),
  t("{value:+dec%} {resType:ResType} resistance per stack of repentance").output("ResistancePct", (c) => ({
    value: c.value,
    resType: c.resType,
    per: { stackable: "repentance" as const },
  })),
  t("{value:+dec%} {resType:ResType} resistance per {amt:int} stats").output("ResistancePct", (c) => ({
    value: c.value,
    resType: c.resType,
    per: { stackable: "stat" as const, amt: c.amt },
  })),
  t("{value:+dec%} {resType:ResType} resistance").output("ResistancePct", (c) => ({
    value: c.value,
    resType: c.resType,
  })),

  t("{value:dec%} energy shield regain").output("EnergyShieldRegainPct", (c) => ({ value: c.value })),
  t("{value:dec%} life regain").output("LifeRegainPct", (c) => ({ value: c.value })),
  t("{value:+dec} {statModType:StatWord} per {amt:int} level\\(s\\)")
    .enum("StatWord", StatWordMapping)
    .output("Stat", (c) => ({
      value: c.value,
      statModType: c.statModType,
      per: { stackable: "level" as const, amt: c.amt },
    })),
  t("{value:+dec} {statModType:StatWord}")
    .enum("StatWord", StatWordMapping)
    .output("Stat", (c) => ({ value: c.value, statModType: c.statModType })),
  t("{value:+dec} all stats").output("Stat", (c) => ({ value: c.value, statModType: "all" as const })),
  t("{value:+dec%} {statModType:StatWord}")
    .enum("StatWord", StatWordMapping)
    .output("StatPct", (c) => ({ value: c.value, statModType: c.statModType })),
  t("{value:+dec%} all stats").output("StatPct", (c) => ({ value: c.value, statModType: "all" as const })),
  t("max focus blessing stacks {value:+int}").output("MaxFocusBlessing", (c) => ({ value: c.value })),
  t("max agility blessing stacks {value:+int}").output("MaxAgilityBlessing", (c) => ({ value: c.value })),
  t("max tenacity blessing stacks {value:+int}").output("MaxTenacityBlessing", (c) => ({ value: c.value })),
  t("{value:+int} max repentance stacks").output("MaxRepentance", (c) => ({ value: c.value })),
  // TODO: Properly implement condition threshold for movement speed (add to ConditionThresholdTarget type
  // and handle in offense.ts). For now, we parse the value but ignore the threshold condition.
  t("{value:+int} max spell burst when movement speed is not higher than {threshold:int%} of base").output(
    "MaxSpellBurst",
    (c) => ({ value: c.value }),
  ),
  t("{value:+int} max spell burst").output("MaxSpellBurst", (c) => ({ value: c.value })),
  t("{value:+int} to max spell burst when having squidnova").output("MaxSpellBurst", (c) => ({
    value: c.value,
    cond: HAS_SQUIDNOVA,
  })),
  t(
    "activating spell burst with at least {stacks:int} stack\\(s\\) of max spell burst grants {grant:int} stack of squidnova",
  ).output("GeneratesSquidnova", () => ({})),
  t("{value:+dec%} squidnova effect").output("SquidnovaEffPct", (c) => ({ value: c.value })),
  t("{value:+dec%} additional spell damage when having squidnova").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: "spell" as const,
    addn: true,
    cond: HAS_SQUIDNOVA,
  })),
  t("{value:+dec%} [additional] spell burst charge speed").output("SpellBurstChargeSpeedPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:+dec%} additional hit damage for skills cast by spell burst").output("SpellBurstAdditionalDmgPct", (c) => ({
    value: c.value,
  })),
  t(
    "{value:dec%} of the bonuses and additional bonuses to cast speed is also applied to spell burst charge speed",
  ).output("PlaySafe", (c) => ({ value: c.value })),
  t("{value:+int} max channeled stacks when equipped in the left ring slot").output("MaxChannel", (c) => ({
    value: c.value,
    cond: "equipped_in_left_ring_slot" as const,
  })),
  t("max channeled stacks {value:+int}").output("MaxChannel", (c) => ({ value: c.value })),
  t("has hasten").output("HasHasten", () => ({})),
  t(
    "damage becomes lucky and at least {stacks:int} stack\\(s\\) of spell burst charge is consumed when spell burst is activated",
  ).output("LuckyDmg", () => ({})),
  t("have fervor").output("HaveFervor", () => ({})),
  t("has {value:int} point\\(s\\) of fixed fervor rating").output("FixedFervorPts", (c) => ({
    value: c.value,
  })),
  t("gains a stack of torment when dealing damage to enemies with max affliction").output(
    "GeneratesTorment",
    () => ({}),
  ),
  t("{value:+dec%} chance to gain blur when reaping").output("GeneratesBlur", (c) => ({
    value: c.value,
  })),
  t("gains {value:int} stack\\(s\\) of focus blessing when reaping").output("GeneratesFocusBlessing", () => ({})),
  t("gains {value:int} stack\\(s\\) of focus blessing when activating spell burst").output(
    "GeneratesFocusBlessing",
    () => ({}),
  ),
  t("{value:+dec%} additional {modType:DmgModType} damage for every stack of focus blessing").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: c.modType,
    addn: true,
    per: { stackable: "focus_blessing" as const },
  })),
  t("{value:+dec%} additional {modType:DmgModType} damage per stack of focus blessing owned").output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: c.modType,
    addn: true,
    per: { stackable: "focus_blessing" as const },
  })),
  t("{value:+dec%} blessing duration").outputMany([
    spec("FocusBlessingDurationPct", (c) => ({ value: c.value })),
    spec("AgilityBlessingDurationPct", (c) => ({ value: c.value })),
    spec("TenacityBlessingDurationPct", (c) => ({ value: c.value })),
  ]),
  t("{value:+dec%} focus blessing duration").output("FocusBlessingDurationPct", (c) => ({ value: c.value })),
  t("gains {value:int} stack of repentance when gaining any blessing").output("GeneratesRepentance", (c) => ({
    value: c.value,
  })),
  t("{value:dec%} chance to gain spell aggression on defeat").output("GeneratesSpellAggression", () => ({})),
  t("{value:+dec%} [additional] movement speed").output("MovementSpeedPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:dec%} movement speed").output("MovementSpeedPct", (c) => ({
    value: c.value,
    addn: false,
  })),
  t("{value:+dec%} [additional] projectile speed").output("ProjectileSpeedPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:+int} all skills' level").output("SkillLevel", (c) => ({
    value: c.value,
    skillLevelType: "all" as const,
  })),
  t("{value:+int} {skillLevelType:SkillLevelType} skill level").output("SkillLevel", (c) => ({
    value: c.value,
    skillLevelType: c.skillLevelType,
  })),
  t("for every {amt:dec%} life sealed when at full mana, main skill's level \\+1").output("SkillLevel", (c) => ({
    value: 1,
    skillLevelType: "main" as const,
    per: { stackable: "sealed_life_pct" as const, amt: c.amt },
    cond: HAS_FULL_MANA,
  })),
  t("{value:+int} skill cost").output("SkillCost", (c) => ({ value: c.value })),
  t("{value:+int} to hero trait level").output("HeroTraitLevel", (c) => ({ value: c.value })),
  t("{min:int} - {max:int} physical damage").output("GearBasePhysDmg", (c) => ({
    value: (c.min + c.max) / 2,
  })),
  t("{value:int} critical strike rating").output("GearBaseCritRating", (c) => ({ value: c.value })),
  t("{value:dec} attack speed").output("GearBaseAttackSpeed", (c) => ({ value: c.value })),
  t(
    "reaps {duration:dec} s of damage over time when dealing damage over time. the effect has a {cooldown:dec} s cooldown against the same target",
  ).output("Reap", (c) => ({ duration: c.duration, cooldown: c.cooldown })),
  t("{value:+dec%} reaping duration").output("ReapDurationPct", (c) => ({ value: c.value })),
  t("{value:+dec%} [additional] reaping cooldown recovery speed").output("ReapCdrPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:+dec} affliction inflicted per second").output("AfflictionInflictedPerSec", (c) => ({ value: c.value })),
  t("{value:+dec%} [additional] affliction effect").output("AfflictionEffectPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:+dec%} [additional] curse effect").output("CurseEffPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:+dec%} curse duration").output("CurseDurationPct", (c) => ({ value: c.value })),
  t("{value:+dec%} [additional] curse skill area").output("SkillAreaPct", (c) => ({
    value: c.value,
    skillAreaModType: "curse" as const,
    addn: c.additional !== undefined,
  })),
  t("{value:+dec%} [additional] skill area").output("SkillAreaPct", (c) => ({
    value: c.value,
    skillAreaModType: GLOBAL,
    addn: c.additional !== undefined,
  })),
  t("{value:+dec%} skill effect duration").output("SkillEffDurationPct", (c) => ({ value: c.value })),
  t("{value:+dec%} [additional] sealed mana compensation").output("SealedManaCompPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),
  t("{value:dec%} sealed mana compensation").output("SealedManaCompPct", (c) => ({
    value: c.value,
    addn: false,
  })),
  t(
    "additionally settles {value:dec%} of the remaining total damage when reaping, then removes all damage over time acting on the target",
  ).output("ReapPurificationPct", (c) => ({ value: c.value })),
  // Sage's Insight resistance reduction mods
  t(
    "when a spell hit inflicts fire damage, {value:+dec%} cold, lightning, and erosion resistance for the target for {dur:dec} s",
  ).outputMany([
    spec("EnemyRes", (c) => ({ value: c.value, resType: "cold" as const, cond: "sages_insight_fire" as const })),
    spec("EnemyRes", (c) => ({ value: c.value, resType: "lightning" as const, cond: "sages_insight_fire" as const })),
    spec("EnemyRes", (c) => ({ value: c.value, resType: "erosion" as const, cond: "sages_insight_fire" as const })),
  ]),
  t(
    "when a spell hit inflicts cold damage, {value:+dec%} fire, lightning, and erosion resistance for the target for {dur:dec} s",
  ).outputMany([
    spec("EnemyRes", (c) => ({ value: c.value, resType: "fire" as const, cond: "sages_insight_cold" as const })),
    spec("EnemyRes", (c) => ({ value: c.value, resType: "lightning" as const, cond: "sages_insight_cold" as const })),
    spec("EnemyRes", (c) => ({ value: c.value, resType: "erosion" as const, cond: "sages_insight_cold" as const })),
  ]),
  t(
    "when a spell hit inflicts lightning damage, {value:+dec%} fire, cold, and erosion resistance for the target for {dur:dec} s",
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
    "when a spell hit inflicts erosion damage, {value:+dec%} fire, cold, and lightning resistance for the target for {dur:dec} s",
  ).outputMany([
    spec("EnemyRes", (c) => ({ value: c.value, resType: "fire" as const, cond: "sages_insight_erosion" as const })),
    spec("EnemyRes", (c) => ({ value: c.value, resType: "cold" as const, cond: "sages_insight_erosion" as const })),
    spec("EnemyRes", (c) => ({
      value: c.value,
      resType: "lightning" as const,
      cond: "sages_insight_erosion" as const,
    })),
  ]),
  // Ailments
  t("{value:+dec%} chance to inflict frostbite").output("InflictFrostbitePct", (c) => ({ value: c.value })),
  t("{value:+dec%} freeze duration").output("FreezeDurationPct", (c) => ({ value: c.value })),
  t("inflicts frail on spell hit").output("InflictFrail", () => ({})),
  // Infiltrations
  t("inflicts cold infiltration when dealing damage to frozen enemies").output("InflictsInfiltration", () => ({
    infiltrationType: "cold" as const,
  })),
  t("{value:+int%} all resistance when the enemy has max affliction").outputMany([
    spec("EnemyRes", (c) => ({
      value: c.value,
      resType: "fire" as const,
      cond: "enemy_at_max_affliction" as const,
    })),
    spec("EnemyRes", (c) => ({
      value: c.value,
      resType: "cold" as const,
      cond: "enemy_at_max_affliction" as const,
    })),
    spec("EnemyRes", (c) => ({
      value: c.value,
      resType: "lightning" as const,
      cond: "enemy_at_max_affliction" as const,
    })),
    spec("EnemyRes", (c) => ({
      value: c.value,
      resType: "erosion" as const,
      cond: "enemy_at_max_affliction" as const,
    })),
  ]),
];
