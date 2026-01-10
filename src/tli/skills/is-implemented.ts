import type {
  ActiveSkillName,
  BaseSkill,
  PassiveSkillName,
} from "@/src/data/skill/types";
import { activeSkillModFactories } from "./active-factories";
import { passiveSkillModFactories } from "./passive-factories";

/**
 * Check if a skill has a factory implementation.
 * Skills without implementations don't contribute to calculations.
 */
export const isSkillImplemented = (skill: BaseSkill): boolean => {
  switch (skill.type) {
    case "Active":
      return (
        activeSkillModFactories[skill.name as ActiveSkillName] !== undefined
      );
    case "Passive":
      return (
        passiveSkillModFactories[skill.name as PassiveSkillName] !== undefined
      );
    case "Support":
      // All support skills are implemented via parser-based approach
      return true;
    case "Support (Magnificent)":
      // All magnificent supports are implemented via parser-based approach
      return true;
    case "Support (Noble)":
      // All noble supports are implemented via parser-based approach
      return true;
    default:
      // Activation Medium doesn't have factory patterns yet
      return false;
  }
};
