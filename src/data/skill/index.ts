export * from "./types";
export * from "./active";
export * from "./passive";
export * from "./support";
export * from "./support_magnificent";
export * from "./support_noble";
export * from "./activation_medium";

import { ActiveSkills, type ActiveSkill } from "./active";
import { PassiveSkills, type PassiveSkill } from "./passive";
import { SupportSkills, type SupportSkill } from "./support";
import {
  MagnificentSupportSkills,
  type MagnificentSupportSkill,
} from "./support_magnificent";
import { NobleSupportSkills, type NobleSupportSkill } from "./support_noble";
import {
  ActivationMediumSkills,
  type ActivationMediumSkill,
} from "./activation_medium";

export const Skills = [
  ...ActiveSkills,
  ...PassiveSkills,
  ...SupportSkills,
  ...MagnificentSupportSkills,
  ...NobleSupportSkills,
  ...ActivationMediumSkills,
] as const;

export type Skill =
  | ActiveSkill
  | PassiveSkill
  | SupportSkill
  | MagnificentSupportSkill
  | NobleSupportSkill
  | ActivationMediumSkill;
