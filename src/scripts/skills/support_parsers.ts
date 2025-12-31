import {
  findColumn,
  getDescriptionPart,
  parseNumericValue,
  validateAllLevels,
} from "./progression_table";
import { template } from "./template-compiler";
import type { SupportLevelParser } from "./types";
import { createConstantLevels } from "./utils";

export const hauntParser: SupportLevelParser = (input) => {
  const { skillName, description, progressionTable } = input;

  const firstDescription = getDescriptionPart(skillName, description, 0);

  // Extract Shadow Quantity from description text
  const shadowQuantMatch = template("{value:int} shadow quantity").match(
    firstDescription,
    skillName,
  );
  const shadowQuant = shadowQuantMatch.value;

  // Extract DmgPct from progression table
  const dmgCol = findColumn(
    progressionTable,
    "{value:int}% additional damage for the supported skill",
    skillName,
  );
  const dmgPct: Record<number, number> = {};
  for (const [levelStr, text] of Object.entries(dmgCol.rows)) {
    dmgPct[Number(levelStr)] = parseNumericValue(text);
  }

  validateAllLevels(dmgPct, skillName);

  return {
    shadowQuant: createConstantLevels(shadowQuant),
    dmgPct,
  };
};

export const steamrollParser: SupportLevelParser = (input) => {
  const { skillName, description, progressionTable } = input;

  const firstDescription = getDescriptionPart(skillName, description, 0);

  // Extract Attack Speed from description text
  const aspdMatch = template("{value:dec%} attack speed").match(
    firstDescription,
    skillName,
  );
  const aspdPctValue = aspdMatch.value;

  // Extract melee and ailment damage from progression table
  const meleeCol = findColumn(
    progressionTable,
    "{value:int}% additional melee damage",
    skillName,
  );
  const ailmentCol = findColumn(
    progressionTable,
    "{value:int}% additional ailment damage",
    skillName,
  );

  const meleeDmgPct: Record<number, number> = {};
  const ailmentDmgPct: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(meleeCol.rows)) {
    meleeDmgPct[Number(levelStr)] = parseNumericValue(text);
  }
  for (const [levelStr, text] of Object.entries(ailmentCol.rows)) {
    ailmentDmgPct[Number(levelStr)] = parseNumericValue(text);
  }

  validateAllLevels(meleeDmgPct, skillName);
  validateAllLevels(ailmentDmgPct, skillName);

  return {
    aspdPct: createConstantLevels(aspdPctValue),
    meleeDmgPct,
    ailmentDmgPct,
  };
};

export const quickDecisionParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  // Extract Attack and Cast Speed from progression table
  const col = findColumn(
    progressionTable,
    "{value:int}% additional attack and cast speed",
    skillName,
  );
  const aspdAndCspdPct: Record<number, number> = {};
  for (const [levelStr, text] of Object.entries(col.rows)) {
    aspdAndCspdPct[Number(levelStr)] = parseNumericValue(text);
  }

  validateAllLevels(aspdAndCspdPct, skillName);

  return { aspdAndCspdPct };
};

export const willpowerParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  // Get first column (description column)
  const firstCol = progressionTable[0];
  if (firstCol === undefined) {
    throw new Error(`${skillName}: no columns found`);
  }

  // Extract max stacks from level 1 description text
  const level1Text = firstCol.rows[1];
  if (level1Text === undefined) {
    throw new Error(`${skillName}: no text found for level 1`);
  }

  const stacksMatch = template("stacks up to {value:int} time").match(
    level1Text,
    skillName,
  );
  const maxStacksValue = stacksMatch.value;

  // Extract damage percentage from each level's first column
  const dmgPctPerWillpower: Record<number, number> = {};
  for (const [levelStr, text] of Object.entries(firstCol.rows)) {
    const level = Number(levelStr);
    const dmgMatch = template("{value:dec%} additional damage").match(
      text,
      skillName,
    );
    dmgPctPerWillpower[level] = dmgMatch.value;
  }

  validateAllLevels(dmgPctPerWillpower, skillName);

  return {
    maxWillpowerStacks: createConstantLevels(maxStacksValue),
    dmgPctPerWillpower,
  };
};

export const criticalStrikeDamageIncreaseParser: SupportLevelParser = (
  input,
) => {
  const { skillName, progressionTable } = input;

  // Extract crit damage from progression table
  const col = findColumn(
    progressionTable,
    "{value:int}% additional damage for the supported skill when it lands a critical strike",
    skillName,
  );
  const critDmgPct: Record<number, number> = {};
  for (const [levelStr, text] of Object.entries(col.rows)) {
    critDmgPct[Number(levelStr)] = parseNumericValue(text);
  }

  validateAllLevels(critDmgPct, skillName);

  return { critDmgPct };
};

export const criticalStrikeRatingIncreaseParser: SupportLevelParser = (
  input,
) => {
  const { skillName, progressionTable } = input;

  // Extract crit rating from progression table
  const col = findColumn(
    progressionTable,
    "{value:int}% critical strike rating for the supported skill",
    skillName,
  );
  const critRatingPct: Record<number, number> = {};
  for (const [levelStr, text] of Object.entries(col.rows)) {
    critRatingPct[Number(levelStr)] = parseNumericValue(text);
  }

  validateAllLevels(critRatingPct, skillName);

  return { critRatingPct };
};

export const enhancedAilmentParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  // Extract ailment damage from progression table
  const col = findColumn(
    progressionTable,
    "{value:int}% additional ailment damage for the supported skill",
    skillName,
  );
  const ailmentDmgPct: Record<number, number> = {};
  for (const [levelStr, text] of Object.entries(col.rows)) {
    ailmentDmgPct[Number(levelStr)] = parseNumericValue(text);
  }

  validateAllLevels(ailmentDmgPct, skillName);

  return { ailmentDmgPct };
};

export const wellFoughtBattleParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const col = findColumn(
    progressionTable,
    "{value:int}% effect every time it is cast",
    skillName,
  );
  const skillEffPctPerSkillUse: Record<number, number> = {};
  for (const [levelStr, text] of Object.entries(col.rows)) {
    skillEffPctPerSkillUse[Number(levelStr)] = parseNumericValue(text);
  }

  validateAllLevels(skillEffPctPerSkillUse, skillName);

  return { skillEffPctPerSkillUse };
};

export const massEffectParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const col = findColumn(
    progressionTable,
    "{value:int}% effect for the status provided by the skill per charge",
    skillName,
  );
  const skillEffPctPerCharges: Record<number, number> = {};
  for (const [levelStr, text] of Object.entries(col.rows)) {
    skillEffPctPerCharges[Number(levelStr)] = parseNumericValue(text);
  }

  validateAllLevels(skillEffPctPerCharges, skillName);

  return { skillEffPctPerCharges };
};

export const guardParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  // Extract damage percentage from progression table
  const col = findColumn(
    progressionTable,
    "{value:dec}% additional damage for the supported skill",
    skillName,
  );
  const dmgPct: Record<number, number> = {};
  for (const [levelStr, text] of Object.entries(col.rows)) {
    dmgPct[Number(levelStr)] = parseNumericValue(text);
  }

  validateAllLevels(dmgPct, skillName);

  return { dmgPct };
};

export const passivationParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  // Extract erosion damage percentage from progression table
  const col = findColumn(
    progressionTable,
    "additional erosion damage",
    skillName,
  );
  const dmgPct: Record<number, number> = {};
  for (const [levelStr, text] of Object.entries(col.rows)) {
    dmgPct[Number(levelStr)] = parseNumericValue(text);
  }

  validateAllLevels(dmgPct, skillName);

  return { dmgPct };
};
