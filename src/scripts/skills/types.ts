export interface ProgressionColumn {
  // column header
  header: string;
  // maps level to text
  rows: Record<number, string>;
}

export interface SupportParserInput {
  skillName: string;
  description: string[];
  progressionTable: ProgressionColumn[];
}

/**
 * Parser return type: named keys mapping to level→value records.
 * Keys are descriptive names matching factory expectations.
 * Example: { weaponAtkDmgPct: { 1: 1.49, 2: 1.52, ... }, addedDmgEffPct: { 1: 1.49, ... } }
 */
export type ParsedLevelValues = Record<string, Record<number, number>>;

export type SupportLevelParser = (
  input: SupportParserInput,
) => ParsedLevelValues;

export type SkillCategory =
  | "support"
  | "active"
  | "passive"
  | "activation_medium"
  | "magnificent_support"
  | "noble_support";

export interface SkillParserEntry {
  skillName: string;
  categories: SkillCategory[];
  parser: SupportLevelParser;
}
