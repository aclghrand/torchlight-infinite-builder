import { parseNumericValue, validateAllLevels } from "./progression_table";
import type { SupportLevelParser } from "./types";
import { createConstantLevels } from "./utils";

export const hauntParser: SupportLevelParser = (input) => {
  const { skillName, description, progressionTable } = input;

  const firstDescription = description[0];
  if (firstDescription === undefined) {
    throw new Error(`${skillName}: no description found`);
  }

  // Extract Shadow Quantity from description text
  const shadowQuantMatch = firstDescription.match(
    /\+?(\d+)\s+Shadow Quantity/i,
  );
  if (shadowQuantMatch === null) {
    throw new Error(`${skillName}: could not find Shadow Quantity value`);
  }
  const shadowQuant = parseNumericValue(shadowQuantMatch[1]);
  const shadowQuantLevels = createConstantLevels(shadowQuant);

  // Extract DmgPct from progression table values
  const dmgPctLevels: Record<number, number> = {};
  for (const [levelStr, values] of Object.entries(progressionTable.values)) {
    const level = Number(levelStr);
    const dmgValue = values[0];
    if (dmgValue === undefined) {
      throw new Error(`${skillName} level ${level}: missing damage value`);
    }

    dmgPctLevels[level] = parseNumericValue(dmgValue, {
      asPercentage: true,
    });
  }

  validateAllLevels(shadowQuantLevels, skillName);
  validateAllLevels(dmgPctLevels, skillName);

  return [shadowQuantLevels, dmgPctLevels];
};

export const steamrollParser: SupportLevelParser = (input) => {
  const { skillName, description, progressionTable } = input;

  const firstDescription = description[0];
  if (firstDescription === undefined) {
    throw new Error(`${skillName}: no description found`);
  }

  // Extract Attack Speed from description text
  const aspdMatch = firstDescription.match(
    /([+-]?\d+(?:\.\d+)?)%\s+Attack Speed/i,
  );
  if (aspdMatch === null) {
    throw new Error(`${skillName}: could not find Attack Speed value`);
  }
  const aspdPct = parseNumericValue(aspdMatch[1], { asPercentage: true });
  const aspdPctLevels = createConstantLevels(aspdPct);

  // Extract melee and ailment damage from progression table
  const meleeDmgPctLevels: Record<number, number> = {};
  const ailmentDmgPctLevels: Record<number, number> = {};

  for (const [levelStr, values] of Object.entries(progressionTable.values)) {
    const level = Number(levelStr);
    const meleeDmgValue = values[0];
    const ailmentDmgValue = values[1];

    if (meleeDmgValue === undefined) {
      throw new Error(
        `${skillName} level ${level}: missing melee damage value`,
      );
    }
    if (ailmentDmgValue === undefined) {
      throw new Error(
        `${skillName} level ${level}: missing ailment damage value`,
      );
    }

    meleeDmgPctLevels[level] = parseNumericValue(meleeDmgValue, {
      asPercentage: true,
    });
    ailmentDmgPctLevels[level] = parseNumericValue(ailmentDmgValue, {
      asPercentage: true,
    });
  }

  validateAllLevels(aspdPctLevels, skillName);
  validateAllLevels(meleeDmgPctLevels, skillName);
  validateAllLevels(ailmentDmgPctLevels, skillName);

  return [aspdPctLevels, meleeDmgPctLevels, ailmentDmgPctLevels];
};

export const quickDecisionParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  // Extract Attack and Cast Speed from progression table values
  const speedPctLevels: Record<number, number> = {};
  for (const [levelStr, values] of Object.entries(progressionTable.values)) {
    const level = Number(levelStr);
    const speedValue = values[0];
    if (speedValue === undefined) {
      throw new Error(`${skillName} level ${level}: missing speed value`);
    }

    speedPctLevels[level] = parseNumericValue(speedValue, {
      asPercentage: true,
    });
  }

  validateAllLevels(speedPctLevels, skillName);

  return [speedPctLevels];
};

export const willpowerParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  // Extract max stacks from first row description text
  const firstRowDesc = progressionTable.description[1];
  if (firstRowDesc === undefined) {
    throw new Error(`${skillName}: no description found for level 1`);
  }

  const stacksMatch = firstRowDesc.match(/Stacks up to (\d+) time/i);
  if (stacksMatch === null) {
    throw new Error(`${skillName}: could not find max stacks value`);
  }
  const maxStacks = parseNumericValue(stacksMatch[1]);
  const maxStacksLevels = createConstantLevels(maxStacks);

  // Extract damage percentage from each row's description
  const dmgPctLevels: Record<number, number> = {};
  for (const [levelStr, desc] of Object.entries(progressionTable.description)) {
    const level = Number(levelStr);

    const dmgMatch = desc.match(/\+?(\d+(?:\.\d+)?)%\s+additional damage/i);
    if (dmgMatch === null) {
      throw new Error(
        `${skillName} level ${level}: could not find damage percentage`,
      );
    }

    dmgPctLevels[level] = parseNumericValue(dmgMatch[1], {
      asPercentage: true,
    });
  }

  validateAllLevels(maxStacksLevels, skillName);
  validateAllLevels(dmgPctLevels, skillName);

  return [maxStacksLevels, dmgPctLevels];
};
