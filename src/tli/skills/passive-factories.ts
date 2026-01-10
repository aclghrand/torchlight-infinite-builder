import type { PassiveSkillName } from "@/src/data/skill/types";
import type { PassiveSkillModFactory } from "./types";
import { v } from "./types";

/**
 * Factory functions for passive skill mods.
 * Each factory receives (level, values) where:
 * - level: 1-40
 * - values: named value arrays matching parser output keys
 */
export const passiveSkillModFactories: Partial<
  Record<PassiveSkillName, PassiveSkillModFactory>
> = {
  "Precise: Cruelty": (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        value: v(vals.attackDmgPct, l),
        addn: true,
        dmgModType: "attack",
      },
    ],
    mods: [
      {
        type: "AuraEffPct",
        value: v(vals.auraEffPctPerCrueltyStack, l),
        addn: true,
        per: { stackable: "cruelty_buff", limit: 40 },
        unscalable: true,
      },
    ],
  }),
  "Spell Amplification": (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        value: v(vals.spellDmgPct, l),
        addn: true,
        dmgModType: "spell",
      },
    ],
  }),
  "Precise: Deep Pain": (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        value: v(vals.dotDmgPct, l),
        addn: true,
        dmgModType: "damage_over_time",
      },
      { type: "AfflictionInflictedPerSec", value: v(vals.afflictionPerSec, l) },
    ],
  }),
  "Precise: Erosion Amplification": (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        value: v(vals.erosionDmgPct, l),
        addn: true,
        dmgModType: "erosion",
      },
    ],
  }),
  "Corrosion Focus": (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        value: v(vals.erosionDmgPct, l),
        addn: true,
        dmgModType: "erosion",
      },
      { type: "InflictWiltPct", value: v(vals.inflictWiltPct, l) },
      { type: "BaseWiltFlatDmg", value: v(vals.BaseWiltFlatDmg, l) },
    ],
  }),
  "Deep Pain": (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        value: v(vals.dotDmgPct, l),
        addn: true,
        dmgModType: "damage_over_time",
      },
    ],
  }),
  "Erosion Amplification": (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        value: v(vals.erosionDmgPct, l),
        addn: true,
        dmgModType: "erosion",
      },
    ],
  }),
  "Electric Conversion": (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        value: v(vals.lightningDmgPct, l),
        addn: true,
        dmgModType: "lightning",
      },
    ],
  }),
  "Frigid Domain": (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        value: v(vals.coldDmgPct, l),
        addn: true,
        dmgModType: "cold",
        isEnemyDebuff: true,
      },
    ],
  }),
  "Precise: Frigid Domain": (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        value: v(vals.coldDmgPct, l),
        addn: true,
        dmgModType: "cold",
        isEnemyDebuff: true,
      },
    ],
  }),
  "Summon Thunder Magus": (l, vals) => ({
    buffMods: [
      { type: "AspdPct", value: v(vals.aspdAndCspdPct, l), addn: true },
      { type: "CspdPct", value: v(vals.aspdAndCspdPct, l), addn: true },
      {
        type: "DmgPct",
        value: v(vals.dmgPct, l),
        addn: true,
        dmgModType: "global",
      },
    ],
  }),
  "Precise: Electric Conversion": (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        value: v(vals.lightningDmgPct, l),
        addn: true,
        dmgModType: "lightning",
      },
    ],
  }),
  "Precise: Spell Amplification": (l, vals) => ({
    buffMods: [
      {
        type: "DmgPct",
        value: v(vals.spellDmgPct, l),
        addn: true,
        dmgModType: "spell",
      },
    ],
  }),
  "Summon Fire Magus": (l, vals) => ({
    buffMods: [
      {
        type: "FlatCritRating",
        value: v(vals.critRating, l),
        modType: "attack",
      },
      {
        type: "FlatCritRating",
        value: v(vals.critRating, l),
        modType: "spell",
      },
    ],
  }),
  "Precise: Fearless": (l, vals) => ({
    buffMods: [
      {
        type: "CritRatingPct",
        value: v(vals.meleeCritRatingPct, l),
        modType: "melee",
      },
      {
        type: "DmgPct",
        value: v(vals.meleeDmgPct, l),
        addn: true,
        dmgModType: "melee",
      },
      {
        type: "AspdPct",
        value: v(vals.meleeAspdPct, l),
        addn: false,
        aspdModType: "melee",
      },
    ],
  }),
  "Precise: Swiftness": (l, vals) => ({
    buffMods: [
      { type: "MovementSpeedPct", value: v(vals.movementSpeedPct, l) },
    ],
  }),
};
