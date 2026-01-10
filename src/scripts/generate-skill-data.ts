import { execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as cheerio from "cheerio";
import {
  type ActivationMediumAffixDef,
  type BaseActivationMediumSkill,
  type BaseActiveSkill,
  type BaseMagnificentSupportSkill,
  type BaseNobleSupportSkill,
  type BasePassiveSkill,
  type BaseSkill,
  type BaseSupportSkill,
  SKILL_TAGS,
  type SkillTag,
  type SupportSkillTemplate,
  type SupportTarget,
} from "../data/skill/types";
import { readAllTlidbSkills, type TlidbSkillFile } from "./lib/tlidb";
import { classifyWithRegex } from "./skill-kind-patterns";
import { getParserForSkill } from "./skills";
import { buildActivationMediumAffixDefs } from "./skills/activation-medium-parser";
import {
  extractActivationMediumProgressionTable,
  extractProgressionTable,
  parseNumericValue,
} from "./skills/progression-table";
import type {
  ProgressionColumn,
  SkillCategory,
  SupportParserInput,
} from "./skills/types";

interface RawSkill {
  type: string;
  name: string;
  tags: string[];
  description: string[];
  mainStats?: ("str" | "dex" | "int")[];
  parsedLevelModValues?: Record<string, Record<number, number>>;
  parsedAffixDefs?: Record<0 | 1 | 2 | 3, ActivationMediumAffixDef[]>;
  progressionTable?: ProgressionColumn[];
}

// Set for fast tag validation
const VALID_TAGS = new Set<string>(SKILL_TAGS);

// Compound tags that contain spaces (must be checked before splitting by whitespace)
const COMPOUND_TAGS: SkillTag[] = [
  "Base Skill",
  "Enhanced Skill",
  "Shadow Strike",
  "Slash-Strike",
  "Spirit Magus",
  "Synthetic Troop",
];

// Edge case: description uses "Slash Strike" but tag is "Slash-Strike"
const DESCRIPTION_TO_TAG: Record<string, SkillTag> = {
  "Slash Strike": "Slash-Strike",
};

const validateTag = (tag: string, skillName: string): SkillTag => {
  if (!VALID_TAGS.has(tag)) {
    throw new Error(`Unknown tag "${tag}" found in skill "${skillName}"`);
  }
  return tag as SkillTag;
};

// Parse tags from a string like "Melee Attack" or "Horizontal Projectile"
const parseTagsFromString = (
  tagString: string,
  skillName: string,
): SkillTag[] => {
  const tags: SkillTag[] = [];
  let remaining = tagString.trim();

  // First check for edge case mappings (e.g., "Slash Strike" -> "Slash-Strike")
  for (const [descText, tagValue] of Object.entries(DESCRIPTION_TO_TAG)) {
    if (remaining.includes(descText)) {
      tags.push(tagValue);
      remaining = remaining.replace(descText, "").trim();
    }
  }

  for (const compoundTag of COMPOUND_TAGS) {
    if (remaining.includes(compoundTag)) {
      tags.push(compoundTag);
      remaining = remaining.replace(compoundTag, "").trim();
    }
  }

  // Finally split remaining by spaces for single-word tags
  const singleTags = remaining.split(/\s+/).filter((t) => t.length > 0);
  for (const tag of singleTags) {
    tags.push(validateTag(tag, skillName));
  }

  return tags;
};

interface ParsedSupportTargets {
  supportTargets: SupportTarget[];
  cannotSupportTargets: SupportTarget[];
}

const parseSupportTargets = (
  description: string,
  skillName: string,
): ParsedSupportTargets => {
  const supportTargets: SupportTarget[] = [];
  const cannotSupportTargets: SupportTarget[] = [];

  // Search the entire first description part (not just first line)
  // as "Cannot support" clauses may appear on subsequent lines

  // Special patterns (check these first, in order of specificity)
  const specialPatterns: Array<{
    pattern: RegExp;
    targets: SupportTarget[];
    isCannotSupport?: boolean;
  }> = [
    // DoT + Ailment combinations (check before pure DoT)
    {
      pattern: /Supports DoT Skills and skills that can inflict Ailment/i,
      targets: ["dot", "inflict_ailment"],
    },
    {
      pattern:
        /Supports skills that deal Damage Over Time or inflict Ailments/i,
      targets: ["dot", "inflict_ailment"],
    },
    // Hit enemies + DoT combination
    {
      pattern: /Supports skills that hit enemies or deal Damage Over Time/i,
      targets: ["hit_enemies", "dot"],
    },
    // Spell + Spell Burst combination (existing)
    {
      pattern: /Supports Spell Skills or skills that can activate Spell Burst/i,
      targets: [{ tags: ["Spell"] }, "spell_burst"],
    },
    // Spell Skills that deal damage or Spell Burst (activation medium)
    {
      pattern:
        /Supports Spell Skills that deal damage or skills that can activate Spell Burst/i,
      targets: [
        { tags: ["Spell"], requiredKind: "deal_damage" },
        "spell_burst",
      ],
    },
    // Attack Skills and Spell Skills that deal damage (both must deal damage)
    {
      pattern: /Supports Attack Skills and Spell Skills that deal damage/i,
      targets: [
        { tags: ["Attack"], requiredKind: "deal_damage" },
        { tags: ["Spell"], requiredKind: "deal_damage" },
      ],
    },
    // Active Skill(s) that deal damage (skillType + kind)
    {
      pattern: /Supports Active Skills? that deal damage/i,
      targets: [{ skillType: "active" as const, requiredKind: "deal_damage" }],
    },
    // Attack Skills that deal damage
    {
      pattern: /Supports Attack Skills that deal damage/i,
      targets: [{ tags: ["Attack"], requiredKind: "deal_damage" }],
    },
    // Spell Skills that deal damage
    {
      pattern: /Supports Spell Skills that deal damage/i,
      targets: [{ tags: ["Spell"], requiredKind: "deal_damage" }],
    },
    // Pure DoT (after combinations)
    { pattern: /Supports? DoT Skills?\.?/i, targets: ["dot"] },
    // Summon patterns
    {
      pattern: /Supports skills that summon Spirit Magus/i,
      targets: ["summon_spirit_magus"],
    },
    {
      pattern: /Supports skills that summon Synthetic Troops/i,
      targets: ["summon_synthetic_troops"],
    },
    {
      pattern: /Supports skills that summon Minions/i,
      targets: ["summon_minions"],
    },
    // Skill type patterns (Active/Passive are skill types, not tags)
    {
      pattern: /Supports? Active Skills?/i,
      targets: [{ skillType: "active" as const }],
    },
    {
      pattern: /Supports? Passive Skills?/i,
      targets: [{ skillType: "passive" as const }],
    },
    // Generic patterns
    { pattern: /Supports any skill/i, targets: ["any"] },
    // "hit the enemy" variant (singular) - for activation medium
    {
      pattern: /Supports skills that hit the enemy/i,
      targets: ["hit_enemies"],
    },
    { pattern: /Supports skills that hit enemies/i, targets: ["hit_enemies"] },
    { pattern: /Supports skills that deal damage/i, targets: ["deal_damage"] },
  ];

  // Check special patterns
  for (const { pattern, targets: patternTargets } of specialPatterns) {
    if (pattern.test(description)) {
      supportTargets.push(...patternTargets);
      break; // Only match one special pattern for support targets
    }
  }

  // If no special pattern matched, parse generic tag patterns
  if (supportTargets.length === 0) {
    // Match "Supports? <tags> Skills?" pattern with greedy match to capture full clause
    // Handle both "Support" and "Supports", "Skill" and "Skills"
    const supportsMatch = description.match(
      /Supports?\s+(.+?Skills?)(?:\.|,|\n|$)/i,
    );

    if (supportsMatch?.[1]) {
      const fullClause = supportsMatch[1];

      // Check for "Skills or" pattern (e.g., "Attack Skills or Spell Skills")
      if (/Skills?\s+or\s+/i.test(fullClause)) {
        // Split by "Skills or" to get each target group
        const parts = fullClause
          .split(/Skills?\s+or\s+/i)
          .map((p) => p.replace(/Skills?$/i, "").trim())
          .filter((p) => p.length > 0);

        for (const part of parts) {
          const tags = parseTagsFromString(part, skillName);
          if (tags.length > 0) {
            supportTargets.push({ tags });
          }
        }
      }
      // Check for comma-separated list with "and" (e.g., "Empower, Defensive, Restoration, Curse, and Warcry Skills")
      else if (fullClause.includes(",")) {
        const tagsPart = fullClause.replace(/Skills?$/i, "").trim();
        // Split by comma (optionally followed by "and"), or standalone "and"
        // ", and " is a common pattern like "X, Y, and Z"
        const parts = tagsPart
          .split(/,\s*(?:and\s+)?|\s+and\s+/i)
          .map((p) => p.trim())
          .filter((p) => p.length > 0);

        for (const part of parts) {
          const tags = parseTagsFromString(part, skillName);
          if (tags.length > 0) {
            supportTargets.push({ tags });
          }
        }
      }
      // Check for simple "and" pattern between tags (creates separate targets)
      // e.g., "Attack and Spell Skills"
      else if (fullClause.includes(" and ")) {
        const tagsPart = fullClause.replace(/Skills?$/i, "").trim();
        const andParts = tagsPart
          .split(/\s+and\s+/i)
          .map((p) => p.trim())
          .filter((p) => p.length > 0);

        for (const part of andParts) {
          const tags = parseTagsFromString(part, skillName);
          if (tags.length > 0) {
            supportTargets.push({ tags });
          }
        }
      }
      // Adjacent tags (single target with multiple tags)
      // e.g., "Melee Attack Skills"
      else {
        const tagsPart = fullClause.replace(/Skills?$/i, "").trim();
        const tags = parseTagsFromString(tagsPart, skillName);
        if (tags.length > 0) {
          supportTargets.push({ tags });
        }
      }
    }
  }

  // Helper to parse a single cannot-support clause into a SupportTarget
  const parseCannotSupportPart = (part: string): SupportTarget | undefined => {
    const trimmed = part.trim();
    // Check for skill type patterns first (Passive/Active are skill types, not tags)
    if (/^Passive$/i.test(trimmed)) {
      return { skillType: "passive" as const };
    }
    if (/^Active$/i.test(trimmed)) {
      return { skillType: "active" as const };
    }
    const tags = parseTagsFromString(trimmed, skillName);
    if (tags.length > 0) {
      return { tags };
    }
    return undefined;
  };

  // Parse "Cannot support" patterns
  // Use greedy match to capture full clause like "Channeled Skills or Attack Skills"
  const cannotMatch = description.match(
    /Cannot support\s+(.+?Skills?)(?:\.|,|\n|$)/i,
  );
  if (cannotMatch?.[1]) {
    const fullClause = cannotMatch[1];

    // Check for "Skills or" pattern (e.g., "Channeled Skills or Attack Skills")
    if (/Skills?\s+or\s+/i.test(fullClause)) {
      // Split by "Skills or" to get each target group
      const parts = fullClause
        .split(/Skills?\s+or\s+/i)
        .map((p) => p.replace(/Skills?$/i, "").trim())
        .filter((p) => p.length > 0);

      for (const part of parts) {
        const target = parseCannotSupportPart(part);
        if (target) {
          cannotSupportTargets.push(target);
        }
      }
    }
    // Check for "Skills and" pattern (e.g., "Channeled Skills and Attack Skills", "Passive Skills and Channeled Skills")
    else if (/Skills?\s+and\s+/i.test(fullClause)) {
      // Split by "Skills and" to get each target group
      const parts = fullClause
        .split(/Skills?\s+and\s+/i)
        .map((p) => p.replace(/Skills?$/i, "").trim())
        .filter((p) => p.length > 0);

      for (const part of parts) {
        const target = parseCannotSupportPart(part);
        if (target) {
          cannotSupportTargets.push(target);
        }
      }
    }
    // Check for simple "or" pattern (e.g., "Mobility or Channeled Skills")
    else if (fullClause.includes(" or ")) {
      const tagsPart = fullClause.replace(/Skills?$/i, "").trim();
      const orParts = tagsPart
        .split(/\s+or\s+/i)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      for (const part of orParts) {
        const target = parseCannotSupportPart(part);
        if (target) {
          cannotSupportTargets.push(target);
        }
      }
    } else {
      const tagsPart = fullClause.replace(/Skills?$/i, "").trim();
      const target = parseCannotSupportPart(tagsPart);
      if (target) {
        cannotSupportTargets.push(target);
      }
    }
  }

  return { supportTargets, cannotSupportTargets };
};

// Normalize supportTarget names that don't match active/passive skill names
// These come from the game's description text "Supports X." which sometimes differs from actual skill names
const SUPPORT_TARGET_NORMALIZATION: Record<string, string> = {
  "Chain of Lightning": "Chain Lightning",
  "Summon Fire Spirit": "Summon Fire Magus",
  "Summon Frost Spirit": "Summon Frost Magus",
  "Summon Thunder Spirit": "Summon Thunder Magus",
};

// Parse the specific skill name from "Supports <SkillName>." for Magnificent/Noble supports
const parseSkillSupportTarget = (description: string): string => {
  const firstLine = description.split("\n")[0] ?? "";
  const match = firstLine.match(/^Supports\s+(.+?)\./);
  const rawTarget = match?.[1] ?? "";
  return SUPPORT_TARGET_NORMALIZATION[rawTarget] ?? rawTarget;
};

// Maps JSON type → file key and type names
// supportType: "none" | "generic" | "magnificent" | "noble"
const SKILL_TYPE_CONFIG = {
  Active: { fileKey: "active", constName: "ActiveSkills", supportType: "none" },
  Passive: {
    fileKey: "passive",
    constName: "PassiveSkills",
    supportType: "none",
  },
  Support: {
    fileKey: "support",
    constName: "SupportSkills",
    supportType: "generic",
  },
  "Support (Magnificent)": {
    fileKey: "support-magnificent",
    constName: "MagnificentSupportSkills",
    supportType: "magnificent",
  },
  "Support (Noble)": {
    fileKey: "support-noble",
    constName: "NobleSupportSkills",
    supportType: "noble",
  },
  "Activation Medium": {
    fileKey: "activation-medium",
    constName: "ActivationMediumSkills",
    supportType: "activation_medium",
  },
} as const;

type SkillTypeKey = keyof typeof SKILL_TYPE_CONFIG;

// Map tlidb directory names to skill types
const DIRECTORY_TO_SKILL_TYPE: Record<string, SkillTypeKey> = {
  active: "Active",
  passive: "Passive",
  support: "Support",
  magnificent_support: "Support (Magnificent)",
  noble_support: "Support (Noble)",
  activation_medium: "Activation Medium",
};

// Tags that appear in tlidb HTML but are not actual skill tags
const NON_SKILL_TAGS = new Set(["Support", "Activation Medium"]);

const extractSkillFromTlidbHtml = (
  file: TlidbSkillFile,
): RawSkill | undefined => {
  const skillType = DIRECTORY_TO_SKILL_TYPE[file.category];
  if (!skillType) {
    console.warn(`Unknown category: ${file.category}`);
    return undefined;
  }

  const $ = cheerio.load(file.html);

  // Find the card with SS10Season (current season) - each skill has multiple season versions
  let currentCard = $("div.card.ui_item.popupItem")
    .filter(
      (_, el) => $(el).find("div.item_ver").text().trim() === "SS10Season",
    )
    .first();

  // Fallback to first non-previousItem card if SS10Season not found
  if (currentCard.length === 0) {
    currentCard = $("div.card.ui_item.popupItem:not(.previousItem)").first();
  }

  if (currentCard.length === 0) {
    return undefined;
  }

  // Extract name from card-title
  const name = currentCard.find("h5.card-title").first().text().trim();
  if (!name) {
    return undefined;
  }

  // Extract tags from span.tag elements, filtering out non-skill tags
  const tags: string[] = [];
  currentCard.find("span.tag").each((_, elem) => {
    const tag = $(elem).text().trim();
    if (tag && !NON_SKILL_TAGS.has(tag)) {
      tags.push(tag);
    }
  });

  // Extract Main Stat as separate field (not added to tags)
  const mainStatMap: Record<string, "str" | "dex" | "int"> = {
    Strength: "str",
    Dexterity: "dex",
    Intelligence: "int",
  };
  let mainStats: ("str" | "dex" | "int")[] | undefined;
  currentCard.find("div.d-flex").each((_, elem) => {
    const label = $(elem).find("div").first().text().trim();
    if (label === "Main Stat:" || label === "Main Stat") {
      const value = $(elem).find("div.ps-2").text().trim();
      // Can be comma-separated like "Dexterity, Intelligence"
      const stats = value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => mainStatMap[s])
        .filter((s): s is "str" | "dex" | "int" => s !== undefined);
      if (stats.length > 0) {
        mainStats = stats;
      }
    }
  });

  // Remove <small class="description"> elements (level scaling info)
  currentCard.find("small.description").remove();

  // Extract description from explicitMod divs
  const description: string[] = [];
  currentCard.find("div.explicitMod").each((_, elem) => {
    // Remove tier spans (empty visual indicators)
    $(elem).find("span.tier").remove();

    // Get HTML content
    let blockHtml = $(elem).html() ?? "";

    // Replace <br> with newlines
    blockHtml = blockHtml.replace(/<br\s*\/?>/gi, "\n");

    // Load into cheerio to get text content (strips remaining HTML)
    let text = cheerio.load(blockHtml).text();

    // Convert literal \n strings to actual newlines (some HTML has these)
    text = text.replace(/\\n/g, "\n");

    // Clean up: normalize whitespace per line, filter empty lines
    const cleaned = text
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter((line) => line.length > 0)
      .join("\n");

    if (cleaned) {
      description.push(cleaned);
    }
  });

  // Extract progression table for support skills (used for building fixedAffixes and templates)
  let progressionTable: ProgressionColumn[] | undefined;
  if (skillType === "Support") {
    progressionTable = extractProgressionTable($);
  }

  // Check for registered parser and extract level mod values for active/passive skills
  const parser = getParserForSkill(name, file.category as SkillCategory);
  let parsedLevelModValues: Record<string, Record<number, number>> | undefined;

  // Skills that extract values from description only (no progression table in HTML)
  const SKILLS_WITHOUT_PROGRESSION_TABLE = new Set(["Charging Warcry"]);

  // Only run parser for non-support skills (support skills use the new approach)
  if (parser !== undefined && skillType !== "Support") {
    const parserProgressionTable = extractProgressionTable($);

    if (
      parserProgressionTable === undefined &&
      !SKILLS_WITHOUT_PROGRESSION_TABLE.has(name)
    ) {
      throw new Error(`No progression table found for "${name}"`);
    }

    const parserInput: SupportParserInput = {
      skillName: name,
      description,
      progressionTable: parserProgressionTable ?? [],
    };
    parsedLevelModValues = parser.parser(parserInput);
  }

  // Extract affixDefs for activation medium skills
  let parsedAffixDefs:
    | Record<0 | 1 | 2 | 3, ActivationMediumAffixDef[]>
    | undefined;

  if (skillType === "Activation Medium") {
    const progressionTable = extractActivationMediumProgressionTable($);
    if (progressionTable !== undefined) {
      parsedAffixDefs = buildActivationMediumAffixDefs(progressionTable);
    }
  }

  return {
    type: skillType,
    name,
    tags,
    description,
    mainStats,
    parsedLevelModValues,
    parsedAffixDefs,
    progressionTable,
  };
};

// Custom serializer that outputs valid TypeScript with numeric keys unquoted
const toTypeScript = (obj: unknown): string => {
  if (obj === null) return "null";
  if (obj === undefined) return "undefined";
  if (typeof obj === "string") return JSON.stringify(obj);
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
  if (Array.isArray(obj)) {
    return `[${obj.map(toTypeScript).join(", ")}]`;
  }
  if (typeof obj === "object") {
    const entries = Object.entries(obj).map(([k, v]) => {
      // Use unquoted numeric keys, quote others
      const key = /^\d+$/.test(k) ? k : JSON.stringify(k);
      return `${key}: ${toTypeScript(v)}`;
    });
    return `{ ${entries.join(", ")} }`;
  }
  return String(obj);
};

// Convert Record<number, number> (level → value) to number[] (index = level - 1)
const recordToArray = (record: Record<number, number>): number[] => {
  const result: number[] = [];
  for (let level = 1; level <= 40; level++) {
    const value = record[level];
    if (value === undefined) {
      throw new Error(`Missing value for level ${level}`);
    }
    result.push(value);
  }
  return result;
};

// Convert named level records to named arrays
const convertParsedValuesToLevelValues = (
  parsed: Record<string, Record<number, number>>,
): Record<string, number[]> => {
  const result: Record<string, number[]> = {};
  for (const [key, levelRecord] of Object.entries(parsed)) {
    result[key] = recordToArray(levelRecord);
  }
  return result;
};

/**
 * Build support skill affix data from description and progression table.
 * Determines which affixes are fixed (constant) vs templated (level-scaling).
 *
 * Algorithm:
 * 1. Get affix lines from description[1] (second description block)
 * 2. For each affix line, check if it matches any progression table column header
 * 3. If header match found: create template by replacing the numeric value with {value}
 * 4. If no match: add to fixed affixes
 */
const buildSupportSkillAffixData = (
  description: string[],
  progressionTable: ProgressionColumn[],
  _skillName: string,
): { fixedAffixes: string[]; templates: SupportSkillTemplate[] } => {
  const fixedAffixes: string[] = [];
  const templates: SupportSkillTemplate[] = [];

  // Check if this skill has a "Descript" column (full text descriptions)
  const descriptColumn = progressionTable.find(
    (col) => col.header.toLowerCase().trim() === "descript",
  );

  if (descriptColumn !== undefined) {
    // For Descript columns, treat entire text as a single template value
    const levelValues: string[] = [];
    for (let level = 1; level <= 40; level++) {
      const valueStr = descriptColumn.rows[level];
      if (valueStr === undefined) {
        // Missing level - can't use this approach
        break;
      }
      levelValues.push(valueStr);
    }

    if (levelValues.length === 40) {
      templates.push({ template: "{value}", levelValues });
      return { fixedAffixes, templates }; // No fixed affixes for Descript skills
    }
  }

  // Get the affix lines from description[1] (the second description block)
  const affixDescription = description[1];
  if (affixDescription === undefined) {
    return { fixedAffixes, templates };
  }

  const affixLines = affixDescription
    .split("\n")
    .filter((line) => line.trim().length > 0);

  for (const affixLine of affixLines) {
    // Normalize for comparison (lowercase, trim)
    const normalizedLine = affixLine.toLowerCase().trim();

    // Try to find a matching progression table column header
    let matchedColumn: ProgressionColumn | undefined;

    for (const column of progressionTable) {
      // Normalize the header for comparison
      const normalizedHeader = column.header.toLowerCase().trim();

      // Check if the affix line matches the header
      // The header should contain the same text pattern, with the first row value embedded
      if (normalizedLine === normalizedHeader) {
        matchedColumn = column;
        break;
      }
    }

    if (matchedColumn !== undefined) {
      // This is a templated affix - extract the value and create a template
      const firstRowValue = matchedColumn.rows[1];
      if (firstRowValue === undefined) {
        // No first row value, treat as fixed affix
        fixedAffixes.push(affixLine);
        continue;
      }

      // Parse all level values from the column
      const levelValues: number[] = [];
      for (let level = 1; level <= 40; level++) {
        const valueStr = matchedColumn.rows[level];
        if (valueStr === undefined) {
          // Missing level, skip this column
          fixedAffixes.push(affixLine);
          break;
        }
        levelValues.push(parseNumericValue(valueStr));
      }

      if (levelValues.length !== 40) {
        continue; // Already added to fixedAffixes
      }

      // Create the template by replacing the numeric value in the affix line with {value}
      // The value in the affix line should match the first row value
      const firstValue = parseNumericValue(firstRowValue);

      // Build regex pattern to match the numeric value (handles +/- prefix and % suffix)
      // The value could be "16", "+16", "-15", "5.25", etc.
      const valueStr = String(firstValue);
      // Escape regex special chars and build pattern to match the value with optional +/- and %
      const escapedValue = valueStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Pattern: optional +/-, the value, optional %
      const valuePattern = new RegExp(`([+-]?)${escapedValue}(%?)`, "i");

      const template = affixLine.replace(valuePattern, "$1{value}$2");

      templates.push({ template, levelValues });
    } else {
      // No matching header - this is a fixed affix
      fixedAffixes.push(affixLine);
    }
  }

  return { fixedAffixes, templates };
};

const createTestActiveSkill = (): BaseActiveSkill => {
  // 40 levels of value 100 each (100% = deals 100% weapon damage, 100% added damage effectiveness)
  const constantValues = Array.from({ length: 40 }, () => 100);
  return {
    type: "Active",
    name: "[Test] Simple Attack",
    kinds: ["hit_enemies", "deal_damage"],
    tags: ["Attack", "Melee"],
    description: ["this is used for testing"],
    mainStats: ["dex", "str"],
    // Named level values matching factory expectations
    levelValues: {
      weaponAtkDmgPct: constantValues,
      addedDmgEffPct: constantValues,
    },
  };
};

const createTestPersistentSpell = (): BaseActiveSkill => {
  const constantValues = Array.from({ length: 40 }, () => 100);
  return {
    type: "Active",
    name: "[Test] Simple Persistent Spell",
    kinds: ["deal_damage", "dot"],
    tags: ["Spell", "Persistent"],
    description: ["this is used for testing persistent damage"],
    mainStats: ["int"],
    levelValues: { persistentDamage: constantValues },
  };
};

const createTestSimpleSpell = (): BaseActiveSkill => {
  const constantValues = Array.from({ length: 40 }, () => 100);
  const constantCastTime = Array.from({ length: 40 }, () => 1);
  return {
    type: "Active",
    name: "[Test] Simple Spell",
    kinds: ["deal_damage", "hit_enemies"],
    tags: ["Spell"],
    description: ["this is used for testing spell damage"],
    mainStats: ["int"],
    levelValues: {
      addedDmgEffPct: constantValues,
      spellDmgMin: constantValues,
      spellDmgMax: constantValues,
      castTime: constantCastTime,
    },
  };
};

const generateActiveSkillFile = (
  constName: string,
  skills: BaseActiveSkill[],
): string => {
  return `import type { BaseActiveSkill } from "./types";

export const ${constName} = ${toTypeScript(skills)} as const satisfies readonly BaseActiveSkill[];
`;
};

const generateBaseSkillFile = (
  constName: string,
  skills: BaseSkill[],
): string => {
  return `import type { BaseSkill } from "./types";

export const ${constName} = ${toTypeScript(skills)} as const satisfies readonly BaseSkill[];
`;
};

const generatePassiveSkillFile = (
  constName: string,
  skills: BasePassiveSkill[],
): string => {
  return `import type { BasePassiveSkill } from "./types";

export const ${constName} = ${toTypeScript(skills)} as const satisfies readonly BasePassiveSkill[];
`;
};

const generateSupportSkillFile = (
  constName: string,
  skills: BaseSupportSkill[],
): string => {
  return `import type { BaseSupportSkill } from "./types";

export const ${constName} = ${toTypeScript(skills)} as const satisfies readonly BaseSupportSkill[];
`;
};

const generateMagnificentSupportSkillFile = (
  constName: string,
  skills: BaseMagnificentSupportSkill[],
): string => {
  return `import type { BaseMagnificentSupportSkill } from "./types";

export const ${constName} = ${toTypeScript(skills)} as const satisfies readonly BaseMagnificentSupportSkill[];
`;
};

const generateNobleSupportSkillFile = (
  constName: string,
  skills: BaseNobleSupportSkill[],
): string => {
  return `import type { BaseNobleSupportSkill } from "./types";

export const ${constName} = ${toTypeScript(skills)} as const satisfies readonly BaseNobleSupportSkill[];
`;
};

const generateActivationMediumSkillFile = (
  constName: string,
  skills: BaseActivationMediumSkill[],
): string => {
  return `import type { BaseActivationMediumSkill } from "./types";

export const ${constName} = ${toTypeScript(skills)} as const satisfies readonly BaseActivationMediumSkill[];
`;
};

const main = async (): Promise<void> => {
  console.log("Reading tlidb skill HTML files...");
  const allFiles = await readAllTlidbSkills();
  console.log(`Found ${allFiles.length} skill files`);

  console.log("Extracting skill data...");
  const rawData: RawSkill[] = [];

  for (const file of allFiles) {
    const skill = extractSkillFromTlidbHtml(file);
    if (skill) {
      rawData.push(skill);
    } else {
      console.warn(
        `Failed to extract skill from ${file.category}/${file.fileName}`,
      );
    }
  }

  console.log(`Extracted ${rawData.length} skills`);

  // Group by skill type - separate maps for different skill interfaces
  const activeSkillGroups = new Map<SkillTypeKey, BaseActiveSkill[]>();
  const passiveSkillGroups = new Map<SkillTypeKey, BasePassiveSkill[]>();
  const baseSkillGroups = new Map<SkillTypeKey, BaseSkill[]>();
  const supportSkillGroups = new Map<SkillTypeKey, BaseSupportSkill[]>();
  const magnificentSupportSkillGroups = new Map<
    SkillTypeKey,
    BaseMagnificentSupportSkill[]
  >();
  const nobleSupportSkillGroups = new Map<
    SkillTypeKey,
    BaseNobleSupportSkill[]
  >();
  const activationMediumSkillGroups = new Map<
    SkillTypeKey,
    BaseActivationMediumSkill[]
  >();

  for (const raw of rawData) {
    const skillType = raw.type as SkillTypeKey;

    if (!(skillType in SKILL_TYPE_CONFIG)) {
      console.warn(`Unknown skill type: ${skillType}`);
      continue;
    }

    const config = SKILL_TYPE_CONFIG[skillType];
    const firstDescription = raw.description[0] ?? "";

    if (config.supportType === "generic") {
      // Parse support targets for generic support skills
      const { supportTargets, cannotSupportTargets } = parseSupportTargets(
        firstDescription,
        raw.name,
      );

      // Build fixedAffixes and templates from description and progression table
      const { fixedAffixes, templates } = buildSupportSkillAffixData(
        raw.description,
        raw.progressionTable ?? [],
        raw.name,
      );

      const skillEntry: BaseSupportSkill = {
        type: raw.type as BaseSupportSkill["type"],
        name: raw.name,
        tags: raw.tags as unknown as BaseSupportSkill["tags"],
        description: raw.description,
        supportTargets,
        cannotSupportTargets,
        ...(fixedAffixes.length > 0 && { fixedAffixes }),
        ...(templates.length > 0 && { templates }),
      };

      if (!supportSkillGroups.has(skillType)) {
        supportSkillGroups.set(skillType, []);
      }
      supportSkillGroups.get(skillType)?.push(skillEntry);
    } else if (config.supportType === "magnificent") {
      const supportTarget = parseSkillSupportTarget(firstDescription);

      const skillEntry: BaseMagnificentSupportSkill = {
        type: raw.type as BaseMagnificentSupportSkill["type"],
        name: raw.name,
        tags: raw.tags as unknown as BaseMagnificentSupportSkill["tags"],
        description: raw.description,
        supportTarget,
      };

      if (!magnificentSupportSkillGroups.has(skillType)) {
        magnificentSupportSkillGroups.set(skillType, []);
      }
      magnificentSupportSkillGroups.get(skillType)?.push(skillEntry);
    } else if (config.supportType === "noble") {
      const supportTarget = parseSkillSupportTarget(firstDescription);

      const skillEntry: BaseNobleSupportSkill = {
        type: raw.type as BaseNobleSupportSkill["type"],
        name: raw.name,
        tags: raw.tags as unknown as BaseNobleSupportSkill["tags"],
        description: raw.description,
        supportTarget,
      };

      if (!nobleSupportSkillGroups.has(skillType)) {
        nobleSupportSkillGroups.set(skillType, []);
      }
      nobleSupportSkillGroups.get(skillType)?.push(skillEntry);
    } else if (config.supportType === "activation_medium") {
      // Parse support targets for activation medium skills
      const { supportTargets, cannotSupportTargets } = parseSupportTargets(
        firstDescription,
        raw.name,
      );

      const skillEntry: BaseActivationMediumSkill = {
        type: raw.type as BaseActivationMediumSkill["type"],
        name: raw.name,
        tags: raw.tags as unknown as BaseActivationMediumSkill["tags"],
        description: raw.description,
        supportTargets,
        cannotSupportTargets,
        ...(raw.parsedAffixDefs !== undefined && {
          affixDefs: raw.parsedAffixDefs,
        }),
      };

      if (!activationMediumSkillGroups.has(skillType)) {
        activationMediumSkillGroups.set(skillType, []);
      }
      activationMediumSkillGroups.get(skillType)?.push(skillEntry);
    } else if (skillType === "Active") {
      // Active skills with inferred kinds
      const baseSkill: BaseSkill = {
        type: raw.type as BaseSkill["type"],
        name: raw.name,
        tags: raw.tags as unknown as BaseSkill["tags"],
        description: raw.description,
      };
      const kinds = classifyWithRegex(baseSkill);

      // Build levelValues from parsed values if available
      let levelValues: BaseActiveSkill["levelValues"];

      if (raw.parsedLevelModValues !== undefined) {
        levelValues = convertParsedValuesToLevelValues(
          raw.parsedLevelModValues,
        );
      }

      const skillEntry: BaseActiveSkill = {
        ...baseSkill,
        ...(raw.mainStats !== undefined && { mainStats: raw.mainStats }),
        kinds,
        ...(levelValues !== undefined && { levelValues }),
      };

      if (!activeSkillGroups.has(skillType)) {
        activeSkillGroups.set(skillType, []);
      }
      activeSkillGroups.get(skillType)?.push(skillEntry);
    } else if (skillType === "Passive") {
      // Build levelValues from parsed values if available
      let levelValues: BasePassiveSkill["levelValues"];

      if (raw.parsedLevelModValues !== undefined) {
        levelValues = convertParsedValuesToLevelValues(
          raw.parsedLevelModValues,
        );
      }

      const skillEntry: BasePassiveSkill = {
        type: raw.type as BasePassiveSkill["type"],
        name: raw.name,
        tags: raw.tags as unknown as BasePassiveSkill["tags"],
        description: raw.description,
        ...(raw.mainStats !== undefined && { mainStats: raw.mainStats }),
        ...(levelValues !== undefined && { levelValues }),
      };

      if (!passiveSkillGroups.has(skillType)) {
        passiveSkillGroups.set(skillType, []);
      }
      passiveSkillGroups.get(skillType)?.push(skillEntry);
    } else {
      // Other base skills (fallback)
      const skillEntry: BaseSkill = {
        type: raw.type as BaseSkill["type"],
        name: raw.name,
        tags: raw.tags as unknown as BaseSkill["tags"],
        description: raw.description,
      };

      if (!baseSkillGroups.has(skillType)) {
        baseSkillGroups.set(skillType, []);
      }
      baseSkillGroups.get(skillType)?.push(skillEntry);
    }
  }

  const totalGroups =
    activeSkillGroups.size +
    passiveSkillGroups.size +
    baseSkillGroups.size +
    supportSkillGroups.size +
    magnificentSupportSkillGroups.size +
    nobleSupportSkillGroups.size +
    activationMediumSkillGroups.size;
  console.log(`Grouped into ${totalGroups} skill types`);

  // Validate that all support skills have parseable support targets
  const allSupportSkills = Array.from(supportSkillGroups.values()).flat();
  const missingTargets = allSupportSkills.filter(
    (skill) => skill.supportTargets.length === 0,
  );

  if (missingTargets.length > 0) {
    console.error("\nSkills with unparseable support targets:");
    for (const skill of missingTargets) {
      console.error(`  - ${skill.name}: "${skill.description[0]}"`);
    }
    throw new Error(
      `${missingTargets.length} support skill(s) have no parseable support targets`,
    );
  }

  // Create output directory
  const outDir = join(process.cwd(), "src", "data", "skill");
  await mkdir(outDir, { recursive: true });

  // Add test skills for testing purposes
  const testSkill = createTestActiveSkill();
  const testPersistentSpell = createTestPersistentSpell();
  const testSimpleSpell = createTestSimpleSpell();
  activeSkillGroups.get("Active")?.push(testSkill);
  activeSkillGroups.get("Active")?.push(testPersistentSpell);
  activeSkillGroups.get("Active")?.push(testSimpleSpell);

  // Generate active skill files
  for (const [skillType, skills] of activeSkillGroups) {
    const config = SKILL_TYPE_CONFIG[skillType];
    const fileName = `${config.fileKey}.ts`;
    const filePath = join(outDir, fileName);
    const content = generateActiveSkillFile(config.constName, skills);

    await writeFile(filePath, content, "utf-8");
    console.log(`Generated ${fileName} (${skills.length} active skills)`);
  }

  // Generate passive skill files
  for (const [skillType, skills] of passiveSkillGroups) {
    const config = SKILL_TYPE_CONFIG[skillType];
    const fileName = `${config.fileKey}.ts`;
    const filePath = join(outDir, fileName);
    const content = generatePassiveSkillFile(config.constName, skills);

    await writeFile(filePath, content, "utf-8");
    console.log(`Generated ${fileName} (${skills.length} passive skills)`);
  }

  // Generate base skill type files
  for (const [skillType, skills] of baseSkillGroups) {
    const config = SKILL_TYPE_CONFIG[skillType];
    const fileName = `${config.fileKey}.ts`;
    const filePath = join(outDir, fileName);
    const content = generateBaseSkillFile(config.constName, skills);

    await writeFile(filePath, content, "utf-8");
    console.log(`Generated ${fileName} (${skills.length} base skills)`);
  }

  // Generate generic support skill type files
  for (const [skillType, skills] of supportSkillGroups) {
    const config = SKILL_TYPE_CONFIG[skillType];
    const fileName = `${config.fileKey}.ts`;
    const filePath = join(outDir, fileName);
    const content = generateSupportSkillFile(config.constName, skills);

    await writeFile(filePath, content, "utf-8");
    console.log(`Generated ${fileName} (${skills.length} support skills)`);
  }

  // Generate magnificent support skill type files
  for (const [skillType, skills] of magnificentSupportSkillGroups) {
    const config = SKILL_TYPE_CONFIG[skillType];
    const fileName = `${config.fileKey}.ts`;
    const filePath = join(outDir, fileName);
    const content = generateMagnificentSupportSkillFile(
      config.constName,
      skills,
    );

    await writeFile(filePath, content, "utf-8");
    console.log(
      `Generated ${fileName} (${skills.length} magnificent support skills)`,
    );
  }

  // Generate noble support skill type files
  for (const [skillType, skills] of nobleSupportSkillGroups) {
    const config = SKILL_TYPE_CONFIG[skillType];
    const fileName = `${config.fileKey}.ts`;
    const filePath = join(outDir, fileName);
    const content = generateNobleSupportSkillFile(config.constName, skills);

    await writeFile(filePath, content, "utf-8");
    console.log(
      `Generated ${fileName} (${skills.length} noble support skills)`,
    );
  }

  // Generate activation medium skill type files
  for (const [skillType, skills] of activationMediumSkillGroups) {
    const config = SKILL_TYPE_CONFIG[skillType];
    const fileName = `${config.fileKey}.ts`;
    const filePath = join(outDir, fileName);
    const content = generateActivationMediumSkillFile(config.constName, skills);

    await writeFile(filePath, content, "utf-8");
    console.log(
      `Generated ${fileName} (${skills.length} activation medium skills)`,
    );
  }

  console.log("\nCode generation complete!");
  console.log(
    `Generated ${totalGroups} skill type files with ${rawData.length} total skills`,
  );

  execSync("pnpm format", { stdio: "inherit" });
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });

export { main as generateSkillData };
