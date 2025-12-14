import {
  hauntParser,
  quickDecisionParser,
  steamrollParser,
  willpowerParser,
} from "./support_parsers";
import type { SkillCategory, SkillParserEntry } from "./types";

export const SKILL_PARSERS: SkillParserEntry[] = [
  {
    skillName: "Willpower",
    categories: ["support"],
    parser: willpowerParser,
  },
  {
    skillName: "Haunt",
    categories: ["support"],
    parser: hauntParser,
  },
  {
    skillName: "Steamroll",
    categories: ["support"],
    parser: steamrollParser,
  },
  {
    skillName: "Quick Decision",
    categories: ["support"],
    parser: quickDecisionParser,
  },
];

export const getParserForSkill = (
  skillName: string,
  category: SkillCategory,
): SkillParserEntry | undefined => {
  return SKILL_PARSERS.find(
    (entry) =>
      entry.skillName === skillName && entry.categories.includes(category),
  );
};
