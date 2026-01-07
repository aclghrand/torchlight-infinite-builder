import {
  findColumn,
  parseNumericValue,
  validateAllLevels,
} from "./progression_table";
import { template } from "./template-compiler";
import type { SupportLevelParser } from "./types";
import { createConstantLevels } from "./utils";

export const iceBondParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const descriptCol = findColumn(progressionTable, "descript", skillName);
  const coldDmgPctVsFrostbitten: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(descriptCol.rows)) {
    const level = Number(levelStr);
    // Match "23.5% additional Cold Damage" or "+24% additional Cold Damage"
    const match = template("{value:dec%} additional cold damage").match(
      text,
      skillName,
    );
    coldDmgPctVsFrostbitten[level] = match.value;
  }

  validateAllLevels(coldDmgPctVsFrostbitten, skillName);

  return { coldDmgPctVsFrostbitten };
};

export const bullsRageParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const descriptCol = findColumn(progressionTable, "descript", skillName);
  const meleeDmgPct: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(descriptCol.rows)) {
    const level = Number(levelStr);
    // Match "17.5% additional Melee Skill Damage" or "+27% additional Melee Skill Damage"
    const match = template("{value:dec%} additional melee skill damage").match(
      text,
      skillName,
    );
    meleeDmgPct[level] = match.value;
  }

  validateAllLevels(meleeDmgPct, skillName);

  return { meleeDmgPct };
};

export const frostSpikeParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  // Get columns
  const addedDmgEffCol = findColumn(
    progressionTable,
    "effectiveness of added damage",
    skillName,
  );
  const damageCol = findColumn(progressionTable, "damage", skillName);
  const descriptCol = findColumn(progressionTable, "descript", skillName);

  const weaponAtkDmgPct: Record<number, number> = {};
  const addedDmgEffPct: Record<number, number> = {};

  // Extract values from dedicated columns (levels 1-20 typically have data)
  for (const [levelStr, text] of Object.entries(addedDmgEffCol.rows)) {
    const level = Number(levelStr);
    if (level <= 20) {
      addedDmgEffPct[level] = parseNumericValue(text);
    }
  }

  for (const [levelStr, text] of Object.entries(damageCol.rows)) {
    const level = Number(levelStr);
    if (level <= 20) {
      const dmgMatch = template("{value:dec%}").match(text, skillName);
      weaponAtkDmgPct[level] = dmgMatch.value;
    }
  }

  // Fill in missing levels 21-40 with level 20 values
  const level20WeaponDmg = weaponAtkDmgPct[20];
  const level20AddedDmgEff = addedDmgEffPct[20];

  if (level20WeaponDmg === undefined || level20AddedDmgEff === undefined) {
    throw new Error(
      `${skillName}: level 20 values missing, cannot fallback for levels 21-40`,
    );
  }

  for (let level = 21; level <= 40; level++) {
    if (weaponAtkDmgPct[level] === undefined) {
      weaponAtkDmgPct[level] = level20WeaponDmg;
    }
    if (addedDmgEffPct[level] === undefined) {
      addedDmgEffPct[level] = level20AddedDmgEff;
    }
  }

  // Extract constant mods from level 1 Descript
  const descript = descriptCol.rows[1];
  if (descript === undefined) {
    throw new Error(`${skillName}: no descript found for level 1`);
  }

  // ConvertDmgPct: "Converts 100% of the skill's Physical Damage to Cold"
  const convertPhysicalToColdPct = template(
    "converts {value:int%} of the skill's physical damage to cold",
  ).match(descript, skillName).value;

  // MaxProjectile: "max amount of Projectiles that can be fired by this skill is 5"
  const maxProjectile = template(
    "max amount of projectiles that can be fired by this skill is {value:int}",
  ).match(descript, skillName).value;

  // Projectile per frostbite_rating: "+1 Projectile Quantity for every 35 Frostbite Rating"
  const projectilePerFrostbiteRating = template(
    "{value:+int} projectile quantity for every",
  ).match(descript, skillName).value;

  // Base Projectile: "fires 2 Projectiles in its base state"
  const baseProjectile = template("fires {value:int} projectile").match(
    descript,
    skillName,
  ).value;

  // DmgPct per projectile: "+8% additional Damage for every +1 Projectile"
  const dmgPctPerProjectile = template(
    "{value:+int%} additional damage for every +1 projectile",
  ).match(descript, skillName).value;

  validateAllLevels(weaponAtkDmgPct, skillName);
  validateAllLevels(addedDmgEffPct, skillName);

  return {
    weaponAtkDmgPct,
    addedDmgEffPct,
    convertPhysicalToColdPct: createConstantLevels(convertPhysicalToColdPct),
    maxProjectile: createConstantLevels(maxProjectile),
    projectilePerFrostbiteRating: createConstantLevels(
      projectilePerFrostbiteRating,
    ),
    baseProjectile: createConstantLevels(baseProjectile),
    dmgPctPerProjectile: createConstantLevels(dmgPctPerProjectile),
  };
};

export const chargingWarcryParser: SupportLevelParser = (input) => {
  const { skillName, description } = input;
  const firstDescription = description[0] ?? "";

  // Extract "4% additional damage" for shadow strike skills per enemy
  const dmgMatch = template("{value:int%} additional damage").match(
    firstDescription,
    skillName,
  );

  // Extract "+8% additional Attack Speed"
  const aspdMatch = template("{value:int%} additional attack speed").match(
    firstDescription,
    skillName,
  );

  return {
    shadowStrikeSkillDmgPerEnemy: createConstantLevels(dmgMatch.value),
    shadowStrikeSkillAspd: createConstantLevels(aspdMatch.value),
  };
};

export const mindControlParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  // Get columns
  const addedDmgEffCol = findColumn(
    progressionTable,
    "effectiveness of added damage",
    skillName,
  );
  // Can't use findColumn("damage") - matches "Effectiveness of added damage" first
  const damageCol = progressionTable.find(
    (col) => col.header.toLowerCase() === "damage",
  );
  if (!damageCol) {
    throw new Error(`${skillName}: no "damage" column found`);
  }
  const descriptCol = findColumn(progressionTable, "descript", skillName);

  // Level-scaling values (1-20)
  const addedDmgEffPct: Record<number, number> = {};
  const persistentDamage: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(addedDmgEffCol.rows)) {
    const level = Number(levelStr);
    if (level <= 20 && text !== "") {
      const match = template("{value:dec%}").match(text, skillName);
      addedDmgEffPct[level] = match.value;
    }
  }

  for (const [levelStr, text] of Object.entries(damageCol.rows)) {
    const level = Number(levelStr);
    if (level <= 20 && text !== "") {
      const match = template("deals {value:int}").match(text, skillName);
      persistentDamage[level] = match.value;
    }
  }

  // Fill levels 21-40 with level 20 values
  const level20AddedDmgEff = addedDmgEffPct[20];
  const level20PersistentDmg = persistentDamage[20];
  if (level20AddedDmgEff === undefined || level20PersistentDmg === undefined) {
    throw new Error(`${skillName}: level 20 values missing`);
  }
  for (let level = 21; level <= 40; level++) {
    addedDmgEffPct[level] = level20AddedDmgEff;
    persistentDamage[level] = level20PersistentDmg;
  }

  // Extract constants from level 1 Descript
  const descript = descriptCol.rows[1];
  if (descript === undefined) {
    throw new Error(`${skillName}: no descript found for level 1`);
  }

  // "Channels up to 5 stacks"
  const initialMaxChannel = template("channels up to {value:int} stacks").match(
    descript,
    skillName,
  ).value;

  // "21.5 % additional damage for every +1 additional Max Channeled Stack(s)"
  const additionalDmgPctPerMaxChannel = template(
    "{value:dec} % additional damage for every",
  ).match(descript, skillName).value;

  // "Initially has 3 maximum links"
  const initialMaxLinks = template(
    "initially has {value:int} maximum links",
  ).match(descript, skillName).value;

  // "+1 maximum link for every channeled stack"
  const maxLinkPerChannel = template(
    "{value:+int} maximum link for every channeled stack",
  ).match(descript, skillName).value;

  // "-30% Movement Speed while channeling this skill"
  const movementSpeedPctWhileChanneling = template(
    "{value:+int%} movement speed while channeling",
  ).match(descript, skillName).value;

  // "0.5% Max Life per second per link"
  const restoreLifePctValue = template(
    "{value:dec%} max life per second per link",
  ).match(descript, skillName).value;

  validateAllLevels(addedDmgEffPct, skillName);
  validateAllLevels(persistentDamage, skillName);

  return {
    addedDmgEffPct,
    persistentDamage,
    initialMaxChannel: createConstantLevels(initialMaxChannel),
    additionalDmgPctPerMaxChannel: createConstantLevels(
      additionalDmgPctPerMaxChannel,
    ),
    initialMaxLinks: createConstantLevels(initialMaxLinks),
    maxLinkPerChannel: createConstantLevels(maxLinkPerChannel),
    movementSpeedPctWhileChanneling: createConstantLevels(
      movementSpeedPctWhileChanneling,
    ),
    restoreLifePctValue: createConstantLevels(restoreLifePctValue),
    restoreLifePctInterval: createConstantLevels(1),
  };
};

export const entangledPainParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const descriptCol = findColumn(progressionTable, "descript", skillName);
  const dmgPct: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(descriptCol.rows)) {
    const level = Number(levelStr);
    // Match "+20% additional Damage Over Time" or "40.5% additional Damage Over Time"
    const match = template("{value:dec%} additional damage over time").match(
      text,
      skillName,
    );
    dmgPct[level] = match.value;
  }

  validateAllLevels(dmgPct, skillName);

  return { dmgPct };
};

export const corruptionParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const descriptCol = findColumn(progressionTable, "descript", skillName);
  const dmgPct: Record<number, number> = {};
  const inflictWiltPct: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(descriptCol.rows)) {
    const level = Number(levelStr);
    // Match "+20% additional Erosion Damage taken" or "40.5% additional Erosion Damage taken"
    const dmgMatch = template(
      "{value:dec%} additional erosion damage taken",
    ).match(text, skillName);
    dmgPct[level] = dmgMatch.value;

    // Match "+10% chance to Wilt" or "10.5% chance to Wilt"
    const wiltMatch = template("{value:dec%} chance to wilt").match(
      text,
      skillName,
    );
    inflictWiltPct[level] = wiltMatch.value;
  }

  validateAllLevels(dmgPct, skillName);
  validateAllLevels(inflictWiltPct, skillName);

  return { dmgPct, inflictWiltPct };
};

export const manaBoilParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const descriptCol = findColumn(progressionTable, "descript", skillName);
  const spellDmgPct: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(descriptCol.rows)) {
    const level = Number(levelStr);
    // Match "+10% additional Spell Damage" or "16.65% additional Spell Damage"
    const match = template("{value:dec%} additional spell damage").match(
      text,
      skillName,
    );
    spellDmgPct[level] = match.value;
  }

  validateAllLevels(spellDmgPct, skillName);

  return { spellDmgPct };
};

export const arcaneCircleParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const descriptCol = findColumn(progressionTable, "descript", skillName);
  const spellDmgPctPerStack: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(descriptCol.rows)) {
    const level = Number(levelStr);
    // Match "1.4% additional Spell Damage" or "+2% additional Spell Damage"
    const match = template("{value:dec%} additional spell damage").match(
      text,
      skillName,
    );
    spellDmgPctPerStack[level] = match.value;
  }

  validateAllLevels(spellDmgPctPerStack, skillName);

  return { spellDmgPctPerStack };
};

export const chainLightningParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  // Get columns - use exact match for "damage" to avoid substring collision
  const addedDmgEffCol = findColumn(
    progressionTable,
    "effectiveness of added damage",
    skillName,
  );
  const damageCol = progressionTable.find(
    (col) => col.header.toLowerCase() === "damage",
  );
  if (damageCol === undefined) {
    throw new Error(`${skillName}: no "damage" column found`);
  }
  const descriptCol = findColumn(progressionTable, "descript", skillName);

  // Level-scaling values
  const addedDmgEffPct: Record<number, number> = {};
  const spellDmgMin: Record<number, number> = {};
  const spellDmgMax: Record<number, number> = {};

  // Parse effectiveness of added damage (levels 1-20)
  for (const [levelStr, text] of Object.entries(addedDmgEffCol.rows)) {
    const level = Number(levelStr);
    if (level <= 20 && text !== "") {
      addedDmgEffPct[level] = parseNumericValue(text);
    }
  }

  // Parse spell damage min/max from damage column (levels 1-20)
  // Format: "Deals 1-23 Spell Lightning damage"
  for (const [levelStr, text] of Object.entries(damageCol.rows)) {
    const level = Number(levelStr);
    if (level <= 20 && text !== "") {
      const match = template("deals {min:int}-{max:int} spell lightning").match(
        text,
        skillName,
      );
      spellDmgMin[level] = match.min;
      spellDmgMax[level] = match.max;
    }
  }

  // Fill levels 21-40 with level 20 values
  const level20AddedDmgEff = addedDmgEffPct[20];
  const level20SpellDmgMin = spellDmgMin[20];
  const level20SpellDmgMax = spellDmgMax[20];
  if (
    level20AddedDmgEff === undefined ||
    level20SpellDmgMin === undefined ||
    level20SpellDmgMax === undefined
  ) {
    throw new Error(`${skillName}: level 20 values missing`);
  }
  for (let level = 21; level <= 40; level++) {
    addedDmgEffPct[level] = level20AddedDmgEff;
    spellDmgMin[level] = level20SpellDmgMin;
    spellDmgMax[level] = level20SpellDmgMax;
  }

  // Extract constants from level 1 Descript
  const descript = descriptCol.rows[1];
  if (descript === undefined) {
    throw new Error(`${skillName}: no descript found for level 1`);
  }

  // Jump: "+2 Jumps for this skill"
  const jump = template("{value:+int} jumps for this skill").match(
    descript,
    skillName,
  ).value;

  validateAllLevels(addedDmgEffPct, skillName);
  validateAllLevels(spellDmgMin, skillName);
  validateAllLevels(spellDmgMax, skillName);

  return {
    addedDmgEffPct,
    spellDmgMin,
    spellDmgMax,
    castTime: createConstantLevels(0.65),
    jump: createConstantLevels(jump),
  };
};

export const bitingColdParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const descriptCol = findColumn(progressionTable, "descript", skillName);
  const dmgPct: Record<number, number> = {};
  const inflictFrostbitePct: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(descriptCol.rows)) {
    const level = Number(levelStr);
    // Match "+39% additional Cold Damage taken" or "49.5% additional Cold Damage taken"
    const dmgMatch = template(
      "{value:dec%} additional cold damage taken",
    ).match(text, skillName);
    dmgPct[level] = dmgMatch.value;

    // Match "+19% chance to be Frostbitten" or "19.5% chance to be Frostbitten"
    const frostbiteMatch = template(
      "{value:dec%} chance to be frostbitten",
    ).match(text, skillName);
    inflictFrostbitePct[level] = frostbiteMatch.value;
  }

  validateAllLevels(dmgPct, skillName);
  validateAllLevels(inflictFrostbitePct, skillName);

  return { dmgPct, inflictFrostbitePct };
};

export const timidParser: SupportLevelParser = (input) => {
  const { skillName, progressionTable } = input;

  const descriptCol = findColumn(progressionTable, "descript", skillName);
  const dmgPct: Record<number, number> = {};

  for (const [levelStr, text] of Object.entries(descriptCol.rows)) {
    const level = Number(levelStr);
    // Match "+20% additional Hit Damage taken" or "49.5% additional Hit Damage taken"
    const match = template("{value:dec%} additional hit damage taken").match(
      text,
      skillName,
    );
    dmgPct[level] = match.value;
  }

  validateAllLevels(dmgPct, skillName);

  return { dmgPct };
};
