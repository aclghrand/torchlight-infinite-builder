import { findColumn, validateAllLevels } from "./progression_table";
import { template } from "./template-compiler";
import type { SupportLevelParser } from "./types";
import { createConstantLevels } from "./utils";

export const preciseCrueltyParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const descriptCol = findColumn(progressionTable, "descript", skillName);
  const attackDmgPct: Record<number, number> = {};
  const auraEffPctPerCrueltyStack: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(descriptCol.rows)) {
    const level = Number(levelStr);

    // Match "+12.5% additional Attack Damage" or "12.5% additional Attack Damage"
    const dmgMatch = template("{value:dec%} additional attack damage").match(
      text,
      skillName,
    );
    attackDmgPct[level] = dmgMatch.value;

    // Match "2.5% additional Aura Effect per stack of the buff"
    const auraEffMatch = template(
      "{value:dec%} additional aura effect per stack",
    ).match(text, skillName);
    auraEffPctPerCrueltyStack[level] = auraEffMatch.value;
  }

  validateAllLevels(attackDmgPct, skillName);
  validateAllLevels(auraEffPctPerCrueltyStack, skillName);

  return {
    attackDmgPct,
    auraEffPctPerCrueltyStack,
  };
};

export const spellAmplificationParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const descriptCol = findColumn(progressionTable, "descript", skillName);
  const spellDmgPct: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(descriptCol.rows)) {
    const level = Number(levelStr);

    // Match "+15% additional Spell Damage" or "15% additional Spell Damage"
    const dmgMatch = template("{value:dec%} additional spell damage").match(
      text,
      skillName,
    );
    spellDmgPct[level] = dmgMatch.value;
  }

  validateAllLevels(spellDmgPct, skillName);

  return { spellDmgPct };
};

export const preciseDeepPainParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const descriptCol = findColumn(progressionTable, "descript", skillName);
  const dotDmgPct: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(descriptCol.rows)) {
    const level = Number(levelStr);

    // Match "+21% additional Damage Over Time" or "21% additional Damage Over Time"
    const dmgMatch = template("{value:dec%} additional damage over time").match(
      text,
      skillName,
    );
    dotDmgPct[level] = dmgMatch.value;
  }

  validateAllLevels(dotDmgPct, skillName);

  return {
    dotDmgPct,
    afflictionPerSec: createConstantLevels(30),
  };
};

export const preciseErosionAmplificationParser: SupportLevelParser = (
  input,
) => {
  const { skillName, progressionTable } = input;

  const descriptCol = findColumn(progressionTable, "descript", skillName);
  const erosionDmgPct: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(descriptCol.rows)) {
    const level = Number(levelStr);

    // Match "+21% additional Erosion Damage" or "21% additional Erosion Damage"
    const dmgMatch = template("{value:dec%} additional erosion damage").match(
      text,
      skillName,
    );
    erosionDmgPct[level] = dmgMatch.value;
  }

  validateAllLevels(erosionDmgPct, skillName);

  return { erosionDmgPct };
};

export const corrosionFocusParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const descriptCol = findColumn(progressionTable, "descript", skillName);
  const erosionDmgPct: Record<number, number> = {};
  const inflictWiltPct: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(descriptCol.rows)) {
    const level = Number(levelStr);

    const dmgMatch = template("{value:dec%} additional erosion damage").match(
      text,
      skillName,
    );
    erosionDmgPct[level] = dmgMatch.value;

    const wiltMatch = template("{value:dec%} wilt chance").match(
      text,
      skillName,
    );
    inflictWiltPct[level] = wiltMatch.value;
  }

  validateAllLevels(erosionDmgPct, skillName);
  validateAllLevels(inflictWiltPct, skillName);

  return {
    erosionDmgPct,
    inflictWiltPct,
    BaseWiltFlatDmg: createConstantLevels(2),
  };
};

export const deepPainParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const descriptCol = findColumn(progressionTable, "descript", skillName);
  const dotDmgPct: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(descriptCol.rows)) {
    const level = Number(levelStr);

    // Match "+15% additional Damage Over Time" or "35.5% additional Damage Over Time"
    const dmgMatch = template("{value:dec%} additional damage over time").match(
      text,
      skillName,
    );
    dotDmgPct[level] = dmgMatch.value;
  }

  validateAllLevels(dotDmgPct, skillName);

  return { dotDmgPct };
};

export const erosionAmplificationParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const descriptCol = findColumn(progressionTable, "descript", skillName);
  const erosionDmgPct: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(descriptCol.rows)) {
    const level = Number(levelStr);

    // Match "+15% additional Erosion Damage" or "35.5% additional Erosion Damage"
    const dmgMatch = template("{value:dec%} additional erosion damage").match(
      text,
      skillName,
    );
    erosionDmgPct[level] = dmgMatch.value;
  }

  validateAllLevels(erosionDmgPct, skillName);

  return { erosionDmgPct };
};

export const electricConversionParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const descriptCol = findColumn(progressionTable, "descript", skillName);
  const lightningDmgPct: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(descriptCol.rows)) {
    const level = Number(levelStr);

    // Match "+15% additional Lightning Damage" or "35.5% additional Lightning Damage"
    const dmgMatch = template("{value:dec%} additional lightning damage").match(
      text,
      skillName,
    );
    lightningDmgPct[level] = dmgMatch.value;
  }

  validateAllLevels(lightningDmgPct, skillName);

  return { lightningDmgPct };
};

export const frigidDomainParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const descriptCol = findColumn(progressionTable, "descript", skillName);
  const coldDmgPct: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(descriptCol.rows)) {
    const level = Number(levelStr);

    // Match "+18% additional Cold Damage against enemies" or "38.5% additional Cold Damage against enemies"
    const dmgMatch = template(
      "{value:dec%} additional cold damage against enemies",
    ).match(text, skillName);
    coldDmgPct[level] = dmgMatch.value;
  }

  validateAllLevels(coldDmgPct, skillName);

  return { coldDmgPct };
};

export const preciseFrigidDomainParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const descriptCol = findColumn(progressionTable, "descript", skillName);
  const coldDmgPct: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(descriptCol.rows)) {
    const level = Number(levelStr);

    // Match "+25% additional Cold Damage against enemies" or "54.5% additional Cold Damage against enemies"
    const dmgMatch = template(
      "{value:dec%} additional cold damage against enemies",
    ).match(text, skillName);
    coldDmgPct[level] = dmgMatch.value;
  }

  validateAllLevels(coldDmgPct, skillName);

  return { coldDmgPct };
};

export const summonThunderMagusParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const descriptCol = findColumn(progressionTable, "descript", skillName);
  const dmgPct: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(descriptCol.rows)) {
    const level = Number(levelStr);

    // Match "2.5% additional damage to the summoner" or "+3% additional damage to the summoner"
    const dmgMatch = template(
      "{value:dec%} additional damage to the summoner",
    ).match(text, skillName);
    dmgPct[level] = dmgMatch.value;
  }

  validateAllLevels(dmgPct, skillName);

  return {
    // Attack and Cast Speed is constant at 6%
    aspdAndCspdPct: createConstantLevels(6),
    dmgPct,
  };
};
