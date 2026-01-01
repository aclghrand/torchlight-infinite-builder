import type { SupportSkillName } from "@/src/data/skill";
import type { SupportSkillModFactory } from "./types";
import { v } from "./types";

/**
 * Factory functions for support skill mods.
 * Each factory receives (level, values) where:
 * - level: 1-40
 * - values: named value arrays matching parser output keys
 *
 * The factory returns complete Mod[] with all fields populated.
 */
export const supportSkillModFactories: Partial<
  Record<SupportSkillName, SupportSkillModFactory>
> = {
  Willpower: (l, vals) => [
    { type: "MaxWillpowerStacks", value: v(vals.maxWillpowerStacks, l) },
    {
      type: "DmgPct",
      value: v(vals.dmgPctPerWillpower, l),
      dmgModType: "global",
      addn: false,
      per: { stackable: "willpower" },
    },
  ],
  Haunt: (l, vals) => [
    { type: "ShadowQuant", value: v(vals.shadowQuant, l) },
    {
      type: "DmgPct",
      value: v(vals.dmgPct, l),
      dmgModType: "global",
      addn: true,
    },
  ],
  Steamroll: (l, vals) => [
    // Attack speed penalty is constant (-15%), not level-dependent
    { type: "AspdPct", value: v(vals.aspdPct, l), addn: false },
    {
      type: "DmgPct",
      value: v(vals.meleeDmgPct, l),
      dmgModType: "melee",
      addn: true,
    },
    {
      type: "DmgPct",
      value: v(vals.ailmentDmgPct, l),
      dmgModType: "ailment",
      addn: true,
    },
  ],
  "Quick Decision": (l, vals) => [
    { type: "AspdPct", value: v(vals.aspdAndCspdPct, l), addn: true },
    { type: "CspdPct", value: v(vals.aspdAndCspdPct, l), addn: true },
  ],
  "Critical Strike Damage Increase": (l, vals) => [
    {
      type: "CritDmgPct",
      value: v(vals.critDmgPct, l),
      addn: true,
      modType: "global",
    },
  ],
  "Critical Strike Rating Increase": (l, vals) => [
    {
      type: "CritRatingPct",
      value: v(vals.critRatingPct, l),
      modType: "global",
    },
  ],
  "Enhanced Ailment": (l, vals) => [
    {
      type: "DmgPct",
      value: v(vals.ailmentDmgPct, l),
      dmgModType: "ailment",
      addn: true,
    },
  ],
  "Well-Fought Battle": (l, vals) => [
    {
      type: "SkillEffPct",
      value: v(vals.skillEffPctPerSkillUse, l),
      per: { stackable: "skill_use" },
    },
  ],
  "Mass Effect": (l, vals) => [
    {
      type: "SkillEffPct",
      value: v(vals.skillEffPctPerCharges, l),
      per: { stackable: "skill_charges_on_use" },
    },
  ],
  Guard: (l, vals) => [
    {
      type: "DmgPct",
      value: v(vals.dmgPct, l),
      addn: true,
      dmgModType: "global",
    },
    { type: "GeneratesBarrier" },
  ],
  Passivation: (l, vals) => [
    { type: "CannotInflictWilt" },
    {
      type: "DmgPct",
      value: v(vals.dmgPct, l),
      addn: true,
      dmgModType: "erosion",
    },
  ],
  "Control Spell": (l, vals) => [
    {
      type: "CritRatingPct",
      value: v(vals.critRatingPct, l),
      modType: "global",
    },
    {
      type: "DmgPct",
      value: v(vals.dmgPct, l),
      addn: true,
      dmgModType: "global",
    },
  ],
  "Aura Amplification": (l, vals) => [
    { type: "AuraEffPct", value: v(vals.auraEffPct, l) },
    { type: "SkillAreaPct", value: v(vals.skillAreaPct, l) },
  ],
};
