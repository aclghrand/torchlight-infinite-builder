import type { DmgRange } from "@/src/tli/core";
import type { Mod } from "@/src/tli/mod";
import type { ModWithoutValue } from "@/src/tli/skills/support_templates";
import type { ActivationMediumSkills } from "./activation_medium";
import type { ActiveSkills } from "./active";
import type { PassiveSkills } from "./passive";
import type { SupportSkills } from "./support";
import type { MagnificentSupportSkills } from "./support_magnificent";
import type { NobleSupportSkills } from "./support_noble";

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
export type SupportSkillName = (typeof SupportSkills)[number]["name"];
export type MagnificentSupportSkillName =
  (typeof MagnificentSupportSkills)[number]["name"];
export type NobleSupportSkillName = (typeof NobleSupportSkills)[number]["name"];
export type ActivationMediumSkillNmae =
  (typeof ActivationMediumSkills)[number]["name"];

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

export interface BaseSupportSkill extends BaseSkill {
  // support can target skill if any of the targets match
  supportTargets: SupportTarget[];
  // cannot support any of the matched targets (takes precedence over supportTargets)
  cannotSupportTargets: SupportTarget[];
  // mods that can vary by level (1-40), and require custom parsin from data source
  // each mod is missing a value property, to be interpolated with the value from the levels record
  levelMods?: {
    template: ModWithoutValue;
    levels: Record<number, number | DmgRange>;
  }[];
}

export interface BaseMagnificentSupportSkill extends BaseSkill {
  // name of skill that can be supported
  supportTarget: string;
}

export interface BaseNobleSupportSkill extends BaseSkill {
  // name of skill that can be supported
  supportTarget: string;
}

export interface BaseActiveSkill extends BaseSkill {
  kinds: InferredSkillKind[];
}
