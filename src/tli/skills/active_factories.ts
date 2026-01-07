import type { ActiveSkillName } from "@/src/data/skill/types";
import type { ActiveSkillModFactory } from "./types";
import { v } from "./types";

/**
 * Factory functions for active skill mods.
 * Each factory receives (level, values) where:
 * - level: 1-40
 * - values: named value arrays matching parser output keys
 */
export const activeSkillModFactories: Partial<
  Record<ActiveSkillName, ActiveSkillModFactory>
> = {
  // Test skill for unit tests - has constant offense values
  "[Test] Simple Attack": (l, vals) => ({
    offense: [
      { type: "WeaponAtkDmgPct", value: v(vals.weaponAtkDmgPct, l) },
      { type: "AddedDmgEffPct", value: v(vals.addedDmgEffPct, l) },
    ],
  }),
  // Test skill for persistent damage testing
  "[Test] Simple Persistent Spell": (l, vals) => ({
    offense: [
      {
        type: "PersistentDmg",
        value: v(vals.persistentDamage, l),
        dmgType: "physical",
        duration: 1,
      },
    ],
  }),
  // Test skill for spell damage testing
  "[Test] Simple Spell": (l, vals) => ({
    offense: [
      { type: "AddedDmgEffPct", value: v(vals.addedDmgEffPct, l) },
      {
        type: "SpellDmg",
        value: {
          min: v(vals.spellDmgMin, l),
          max: v(vals.spellDmgMax, l),
        },
        dmgType: "physical",
        castTime: v(vals.castTime, l),
      },
    ],
  }),
  "Frost Spike": (l, vals) => ({
    offense: [
      { type: "WeaponAtkDmgPct", value: v(vals.weaponAtkDmgPct, l) },
      { type: "AddedDmgEffPct", value: v(vals.addedDmgEffPct, l) },
    ],
    mods: [
      {
        type: "ConvertDmgPct",
        value: v(vals.convertPhysicalToColdPct, l),
        from: "physical",
        to: "cold",
      },
      {
        type: "MaxProjectile",
        value: v(vals.maxProjectile, l),
        override: true,
      },
      {
        type: "Projectile",
        value: v(vals.projectilePerFrostbiteRating, l),
        per: { stackable: "frostbite_rating", amt: 35 },
      },
      { type: "BaseProjectileQuant", value: v(vals.baseProjectile, l) },
      {
        type: "DmgPct",
        value: v(vals.dmgPctPerProjectile, l),
        dmgModType: "global",
        addn: true,
        per: { stackable: "projectile" },
      },
    ],
  }),
  "Mind Control": (l, vals) => ({
    offense: [
      { type: "AddedDmgEffPct", value: v(vals.addedDmgEffPct, l) },
      {
        type: "PersistentDmg",
        value: v(vals.persistentDamage, l),
        dmgType: "erosion",
        duration: 2,
      },
    ],
    mods: [
      { type: "InitialMaxChannel", value: v(vals.initialMaxChannel, l) },
      {
        type: "DmgPct",
        value: v(vals.additionalDmgPctPerMaxChannel, l),
        addn: true,
        dmgModType: "global",
        per: { stackable: "additional_max_channel_stack" },
      },
      {
        type: "MindControlMaxLink",
        value: v(vals.initialMaxLinks, l),
      },
      {
        type: "MindControlMaxLink",
        value: v(vals.maxLinkPerChannel, l),
        per: { stackable: "channel_stack" },
      },
      {
        type: "MovementSpeedPct",
        value: v(vals.movementSpeedPctWhileChanneling, l),
        cond: "channeling",
      },
      {
        type: "RestoreLifePct",
        value: v(vals.restoreLifePctValue, l),
        interval: v(vals.restoreLifePctInterval, l),
      },
    ],
  }),
  "Ice Bond": (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        value: v(vals.coldDmgPctVsFrostbitten, l),
        addn: true,
        dmgModType: "cold",
        cond: "enemy_frostbitten",
      },
    ],
  }),
  "Bull's Rage": (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        value: v(vals.meleeDmgPct, l),
        addn: true,
        dmgModType: "melee",
      },
    ],
  }),
  "Charging Warcry": (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        dmgModType: "shadow_strike_skill",
        addn: true,
        value: v(vals.shadowStrikeSkillDmgPerEnemy, l),
        per: { stackable: "num_enemies_affected_by_warcry" },
      },
      {
        // TODO: THIS SHOULD ONLY AFFECT SHADOW STRIKE SKILLS
        type: "AspdPct",
        addn: true,
        value: v(vals.shadowStrikeSkillAspd, l),
      },
    ],
  }),
  "Entangled Pain": (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        dmgModType: "damage_over_time",
        addn: true,
        isEnemyDebuff: true,
        value: v(vals.dmgPct, l),
      },
    ],
  }),
  Corruption: (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        dmgModType: "erosion",
        addn: true,
        isEnemyDebuff: true,
        value: v(vals.dmgPct, l),
      },
      {
        type: "InflictWiltPct",
        isEnemyDebuff: true,
        value: v(vals.inflictWiltPct, l),
      },
    ],
  }),
  "Biting Cold": (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        dmgModType: "cold",
        addn: true,
        isEnemyDebuff: true,
        value: v(vals.dmgPct, l),
      },
      {
        type: "InflictFrostbitePct",
        isEnemyDebuff: true,
        value: v(vals.inflictFrostbitePct, l),
      },
    ],
  }),
  Timid: (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        dmgModType: "hit",
        addn: true,
        isEnemyDebuff: true,
        value: v(vals.dmgPct, l),
      },
    ],
  }),
  "Mana Boil": (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        dmgModType: "spell",
        addn: true,
        value: v(vals.spellDmgPct, l),
      },
    ],
  }),
  "Arcane Circle": (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        dmgModType: "spell",
        addn: true,
        value: v(vals.spellDmgPctPerStack, l),
        per: { stackable: "arcane_circle_stack", limit: 15 },
      },
    ],
  }),
  "Chain Lightning": (l, vals) => ({
    offense: [
      { type: "AddedDmgEffPct", value: v(vals.addedDmgEffPct, l) },
      {
        type: "SpellDmg",
        value: {
          min: v(vals.spellDmgMin, l),
          max: v(vals.spellDmgMax, l),
        },
        dmgType: "lightning",
        castTime: v(vals.castTime, l),
      },
    ],
    mods: [{ type: "Jump", value: v(vals.jump, l) }],
  }),
};
