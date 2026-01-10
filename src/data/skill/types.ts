import type { DmgRange } from "@/src/tli/core";
import type { DmgChunkType } from "@/src/tli/mod";
import type { ActivationMediumSkills } from "./activation-medium";
import { ActiveSkills } from "./active";
import type { PassiveSkills } from "./passive";
import type { SupportSkills } from "./support";
import type { MagnificentSupportSkills } from "./support-magnificent";
import type { NobleSupportSkills } from "./support-noble";

export const SKILL_TYPES = [
  "Activation Medium",
  "Active",
  "Passive",
  "Support",
  "Support (Magnificent)",
  "Support (Noble)",
] as const;

export type SkillType = (typeof SKILL_TYPES)[number];

export const SKILL_TAGS = [
  "Area",
  "Attack",
  "Aura",
  "Barrage",
  "Base Skill",
  "Beam",
  "Chain",
  "Channeled",
  "Cold",
  "Combo",
  "Curse",
  "Defensive",
  "Demolisher",
  "Dexterity",
  "Empower",
  "Enhanced Skill",
  "Erosion",
  "Fire",
  "Focus",
  "Horizontal",
  "Intelligence",
  "Lightning",
  "Melee",
  "Mobility",
  "Parabolic",
  "Persistent",
  "Physical",
  "Projectile",
  "Ranged",
  "Restoration",
  "Sentry",
  "Shadow Strike",
  "Slash-Strike",
  "Spell",
  "Spirit Magus",
  "Strength",
  "Summon",
  "Synthetic Troop",
  "Terra",
  "Ultimate",
  "Vertical",
  "Warcry",
] as const;

export type SkillTag = (typeof SKILL_TAGS)[number];

export type ActiveSkillName = (typeof ActiveSkills)[number]["name"];
const implementedActiveSkills = ActiveSkills.filter((s) => "levelValues" in s);
export type ImplementedActiveSkillName =
  (typeof implementedActiveSkills)[number]["name"];
export type SupportSkillName = (typeof SupportSkills)[number]["name"];
export type MagnificentSupportSkillName =
  (typeof MagnificentSupportSkills)[number]["name"];
export type NobleSupportSkillName = (typeof NobleSupportSkills)[number]["name"];
export type ActivationMediumSkillNmae =
  (typeof ActivationMediumSkills)[number]["name"];
export type PassiveSkillName = (typeof PassiveSkills)[number]["name"];

export type ActiveSkill = (typeof ActiveSkills)[];
export type PassiveSkill = (typeof PassiveSkills)[];
export type SupportSkill = (typeof SupportSkills)[];
export type MagnificentSupportSkill = (typeof MagnificentSupportSkills)[];
export type NobleSupportSkill = (typeof NobleSupportSkills)[];
export type ActivationMediumSupportSkill = (typeof ActivationMediumSkills)[];

export interface BaseSkill {
  type: SkillType;
  name: string;
  tags: SkillTag[];
  description: string[];
}

/**
 * Named level values: keys are descriptive names, values are 40-element arrays (index = level - 1).
 * Example: { weaponAtkDmgPct: [1.49, 1.52, ...], addedDmgEffPct: [1.49, ...] }
 */
export type LevelValues = Readonly<Record<string, readonly number[]>>;

export interface BasePassiveSkill extends BaseSkill {
  mainStats?: ("str" | "dex" | "int")[];
  // Named value arrays for level-scaling mods (1-40).
  // Keys must match factory function expectations.
  levelValues?: LevelValues;
}

// Support targets which cannot be identified using easily
// machine-parseable information such as skill type or tags.
export type InferredSkillKind =
  | "deal_damage"
  | "dot"
  | "hit_enemies"
  | "inflict_ailment"
  | "summon_minions"
  | "summon_spirit_magus"
  | "summon_synthetic_troops";

export type SupportTarget =
  // Multiple skill tags means the target must have all specified tags
  | { tags: SkillTag[] }
  // Multiple skill tags + requiredKind: must have all tags AND be an active skill with the specified kind
  | { tags: SkillTag[]; requiredKind: InferredSkillKind }
  // Matches if SkillType matches to skill's type
  | { skillType: "active" | "passive" }
  // Matches if SkillType matches AND active skill has the specified kind
  | { skillType: "active" | "passive"; requiredKind: InferredSkillKind }
  // Only applies to active skills. Matches if the active skill's kinds contains this kind
  | InferredSkillKind
  // Can be applied to any skill
  | "any"
  // Can be applied to any skill with the Spell tags, but not Summon, Channeled, or Sentry skills.
  | "spell_burst";

/**
 * Template for a level-scaling support skill affix.
 * The template string contains a {value} placeholder that gets replaced with
 * the appropriate value from levelValues based on the skill's level.
 */
export interface SupportSkillTemplate {
  /** Template string with {value} placeholder, e.g. "+{value}% additional damage for the supported skill" */
  template: string;
  /** 40-element array of values (index = level - 1). Can be numbers or strings (for Descript columns). */
  levelValues: readonly (number | string)[];
}

export interface BaseSupportSkill extends BaseSkill {
  // support can target skill if any of the targets match
  supportTargets: SupportTarget[];
  // cannot support any of the matched targets (takes precedence over supportTargets)
  cannotSupportTargets: SupportTarget[];
  // Fixed affixes that don't scale with level
  fixedAffixes?: readonly string[];
  // Templates for affixes that scale with level
  templates?: readonly SupportSkillTemplate[];
}

export interface BaseMagnificentSupportSkill extends BaseSkill {
  supportTarget: string;
}

export interface BaseNobleSupportSkill extends BaseSkill {
  supportTarget: string;
}

/**
 * Affix definition for an activation medium skill at a specific tier.
 */
export interface ActivationMediumAffixDef {
  /** Original affix string with ranges like "(6-20)" preserved */
  affix: string;
  /** Exclusive group name if mutually exclusive (e.g., "cooldown_duration") */
  exclusiveGroup?: string;
}

export interface BaseActivationMediumSkill extends BaseSkill {
  // support can target skill if any of the targets match
  supportTargets: SupportTarget[];
  // cannot support any of the matched targets (takes precedence over supportTargets)
  cannotSupportTargets: SupportTarget[];
  /** Affix definitions organized by tier (skill has one tier, not each affix) */
  affixDefs?: Record<0 | 1 | 2 | 3, ActivationMediumAffixDef[]>;
}

export type SkillOffense =
  | { type: "WeaponAtkDmgPct"; value: number }
  | { type: "AddedDmgEffPct"; value: number }
  | {
      type: "PersistentDmg";
      value: number;
      dmgType: DmgChunkType;
      duration: number;
    }
  | {
      type: "SpellDmg";
      value: DmgRange;
      dmgType: DmgChunkType;
      castTime: number;
    };

export type SkillOffenseType = SkillOffense["type"];

export type SkillOffenseOfType<T extends SkillOffenseType> = Extract<
  SkillOffense,
  { type: T }
>;

export type SkillOffenseTemplate = SkillOffense extends infer M
  ? M extends SkillOffense
    ? Omit<M, "value">
    : never
  : never;

export interface BaseActiveSkill extends BaseSkill {
  mainStats?: ("str" | "dex" | "int")[];
  kinds: InferredSkillKind[];
  // Named value arrays for level-scaling offense/mods/buffMods (1-40).
  // Keys must match factory function expectations in active-factories.ts.
  levelValues?: LevelValues;
}
