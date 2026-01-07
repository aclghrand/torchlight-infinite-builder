import * as R from "remeda";
import { match } from "ts-pattern";
import type { BaseActiveSkill, SkillTag } from "../../data/skill";
import type {
  CritDmgModType,
  CritRatingModType,
  DmgModType,
} from "../constants";
import type { Configuration, DmgRange, Loadout } from "../core";
import type { DmgChunkType, Mod, ModT, ResType } from "../mod";
import { getGearAffixes } from "./affix-collectors";
import {
  calcEffMult,
  calculateAddn,
  calculateInc,
  collectModsFromAffixes,
  filterMods,
  findMod,
  sumByValue,
} from "./mod-utils";
import { multValue } from "./util";

// === Damage Range Types ===

export type DmgRanges = Record<DmgChunkType, DmgRange>;

// Num damage values (single number per type, all optional)
export type NumDmgValues = Partial<Record<DmgChunkType, number>>;

// Union type for convertDmg input
export type DmgInput = DmgRanges | NumDmgValues;

export interface GearDmg {
  mainHand: DmgRanges;
  offHand?: DmgRanges;
}

// === Damage Range Utilities ===

export const addDR = (dr1: DmgRange, dr2: DmgRange): DmgRange => {
  return {
    min: dr1.min + dr2.min,
    max: dr1.max + dr2.max,
  };
};

export const addValue = <T extends DmgRange | number>(v1: T, v2: T): T => {
  if (typeof v1 === "number" && typeof v2 === "number") {
    return (v1 + v2) as T;
  }
  return addDR(v1 as DmgRange, v2 as DmgRange) as T;
};

export const addDRs = (drs1: DmgRanges, drs2: DmgRanges): DmgRanges => {
  return {
    physical: addDR(drs1.physical, drs2.physical),
    cold: addDR(drs1.cold, drs2.cold),
    lightning: addDR(drs1.lightning, drs2.lightning),
    fire: addDR(drs1.fire, drs2.fire),
    erosion: addDR(drs1.erosion, drs2.erosion),
  };
};

export const multDR = (dr: DmgRange, multiplier: number): DmgRange => {
  return {
    min: dr.min * multiplier,
    max: dr.max * multiplier,
  };
};

export const multDRs = (drs: DmgRanges, multiplier: number): DmgRanges => {
  return {
    physical: multDR(drs.physical, multiplier),
    cold: multDR(drs.cold, multiplier),
    lightning: multDR(drs.lightning, multiplier),
    fire: multDR(drs.fire, multiplier),
    erosion: multDR(drs.erosion, multiplier),
  };
};

export const emptyDamageRange = (): DmgRange => {
  return { min: 0, max: 0 };
};

export const emptyDmgRanges = (): DmgRanges => {
  return {
    physical: { min: 0, max: 0 },
    cold: { min: 0, max: 0 },
    lightning: { min: 0, max: 0 },
    fire: { min: 0, max: 0 },
    erosion: { min: 0, max: 0 },
  };
};

export const emptyGearDmg = (): GearDmg => {
  return {
    mainHand: emptyDmgRanges(),
  };
};

// === Damage Conversion ===

// A chunk of damage that tracks its conversion history
export interface DmgChunk<T extends DmgRange | number> {
  value: T;
  // Types this damage has been converted from (not including current pool type)
  history: DmgChunkType[];
}

// All damage organized by current type
export interface DmgPools<T extends DmgRange | number> {
  physical: DmgChunk<T>[];
  cold: DmgChunk<T>[];
  lightning: DmgChunk<T>[];
  fire: DmgChunk<T>[];
  erosion: DmgChunk<T>[];
}

// Damage conversion order: Physical → Lightning → Cold → Fire → Erosion
// Damage can skip steps but never convert backwards
const CONVERSION_ORDER = ["physical", "lightning", "cold", "fire"] as const;

// see poewiki for a good rundown on damage conversion in poe, which works similarly as tli
// https://www.poewiki.net/wiki/Damage_conversion
// a brief summary would be that damage gets converted in a specific order, and converted damage
// remembers all the damage types through which it was converted for the purposes of applying
// damage bonuses
export function convertDmg(
  dmgInput: DmgRanges,
  allMods: Mod[],
): DmgPools<DmgRange>;
export function convertDmg(
  dmgInput: NumDmgValues,
  allMods: Mod[],
): DmgPools<number>;
export function convertDmg(
  dmgInput: DmgInput,
  allMods: Mod[],
): DmgPools<DmgRange> | DmgPools<number> {
  const pools: DmgPools<DmgRange | number> = {
    physical: [],
    cold: [],
    lightning: [],
    fire: [],
    erosion: [],
  };

  // Initialize with non-zero original damage (empty history - not converted from anything)
  const addIfNonZero = <T extends DmgRange | number>(
    pool: DmgChunk<T>[],
    value: T | undefined,
  ) => {
    if (value === undefined) return;
    if (typeof value === "number") {
      if (value > 0) {
        (pool as DmgChunk<number>[]).push({ value, history: [] });
      }
    } else {
      if (value.min > 0 || value.max > 0) {
        (pool as DmgChunk<DmgRange>[]).push({ value, history: [] });
      }
    }
  };
  addIfNonZero(pools.physical, dmgInput.physical);
  addIfNonZero(pools.lightning, dmgInput.lightning);
  addIfNonZero(pools.cold, dmgInput.cold);
  addIfNonZero(pools.fire, dmgInput.fire);
  addIfNonZero(pools.erosion, dmgInput.erosion);

  // Process each source type in conversion order
  for (const sourceType of CONVERSION_ORDER) {
    // Step 1: Process "Gain as Extra" mods (calculated BEFORE conversion)
    // This adds extra damage to target pools but does NOT remove from source
    const addsDmgAsMods = filterMods(allMods, "AddsDmgAsPct").filter(
      (m) => m.from === sourceType,
    );
    for (const chunk of pools[sourceType]) {
      for (const mod of addsDmgAsMods) {
        pools[mod.to].push({
          value: multValue(chunk.value, mod.value / 100),
          history: [...chunk.history, sourceType],
        });
      }
    }

    // Step 2: Process conversion mods (removes from source, adds to target)
    const convMods = filterMods(allMods, "ConvertDmgPct").filter(
      (m) => m.from === sourceType,
    );
    if (convMods.length === 0) continue;

    const totalPct = R.sumBy(convMods, (m) => m.value) / 100;
    const proration = totalPct > 1 ? 1 / totalPct : 1;
    const unconvertedPct = Math.max(0, 1 - totalPct);

    const chunks = [...pools[sourceType]];
    pools[sourceType] = [];

    for (const chunk of chunks) {
      // Unconverted damage stays in source pool with same history
      if (unconvertedPct > 0) {
        pools[sourceType].push({
          value: multValue(chunk.value, unconvertedPct),
          history: chunk.history,
        });
      }

      // Converted damage goes to target pools with updated history
      for (const mod of convMods) {
        const convertPct = (mod.value / 100) * proration;
        pools[mod.to].push({
          value: multValue(chunk.value, convertPct),
          history: [...chunk.history, sourceType],
        });
      }
    }
  }

  return pools as DmgPools<DmgRange> | DmgPools<number>;
}

// === Enemy Resistance and Armor ===

export interface EnemyRes {
  cold: number;
  lightning: number;
  fire: number;
  erosion: number;
}

export const calculateEnemyRes = (
  mods: Mod[],
  config: Configuration,
): EnemyRes => {
  const enemyResMods = filterMods(mods, "EnemyRes");
  const sumEnemyResMods = (resTypes: ResType[]) => {
    return sumByValue(enemyResMods.filter((m) => resTypes.includes(m.resType)));
  };
  return {
    cold: (config.enemyColdRes ?? 40) + sumEnemyResMods(["cold", "elemental"]),
    lightning:
      (config.enemyLightningRes ?? 40) +
      sumEnemyResMods(["lightning", "elemental"]),
    fire: (config.enemyFireRes ?? 40) + sumEnemyResMods(["fire", "elemental"]),
    erosion: (config.enemyErosionRes ?? 30) + sumEnemyResMods(["erosion"]),
  };
};

export const calculateEnemyArmor = (config: Configuration): number => {
  // default to max possible enemy armor, equivalent to 50% dmg reduction
  return config.enemyArmor ?? 27273;
};

// decimal percentages representing how much to reduce dmg by
// e.g. .7 reduction means that a hit will do 30% of its original value
export interface ArmorDmgMitigation {
  physical: number;
  nonPhysical: number;
}

export const calculateEnemyArmorDmgMitigation = (
  armor: number,
): ArmorDmgMitigation => {
  const physical = armor / (0.9 * armor + 30000);
  const nonPhysical = physical * 0.6;
  return { physical, nonPhysical };
};

// === Penetration ===

export const filterPenMods = (
  mods: ModT<"ResPenPct">[],
  penTypes: ModT<"ResPenPct">["penType"][],
): ModT<"ResPenPct">[] => {
  return mods.filter((m) => penTypes.includes(m.penType));
};

interface CalculatePenetrationInput {
  dmg: DmgRanges | NumDmgValues;
  mods: Mod[];
  config: Configuration;
  ignoreArmor: boolean;
}

export function calculatePenetration(
  input: CalculatePenetrationInput & { dmg: DmgRanges },
): DmgRanges;
export function calculatePenetration(
  input: CalculatePenetrationInput & { dmg: NumDmgValues },
): NumDmgValues;
export function calculatePenetration(
  input: CalculatePenetrationInput,
): DmgRanges | NumDmgValues {
  const { dmg, mods, config, ignoreArmor } = input;
  const enemyRes = calculateEnemyRes(mods, config);
  const elePenMods = filterMods(mods, "ResPenPct");
  const coldPenMods = filterPenMods(elePenMods, ["all", "elemental", "cold"]);
  const lightningPenMods = filterPenMods(elePenMods, [
    "all",
    "elemental",
    "lightning",
  ]);
  const firePenMods = filterPenMods(elePenMods, ["all", "elemental", "fire"]);
  const erosionPenMods = filterPenMods(elePenMods, ["all", "erosion"]);
  const enemyColdResMult =
    1 - enemyRes.cold / 100 + sumByValue(coldPenMods) / 100;
  const enemyLightningResMult =
    1 - enemyRes.lightning / 100 + sumByValue(lightningPenMods) / 100;
  const enemyFireResMult =
    1 - enemyRes.fire / 100 + sumByValue(firePenMods) / 100;
  const enemyErosionResMult =
    1 - enemyRes.erosion / 100 + sumByValue(erosionPenMods) / 100;

  const enemyArmorDmgMitigation = ignoreArmor
    ? { physical: 0, nonPhysical: 0 }
    : calculateEnemyArmorDmgMitigation(calculateEnemyArmor(config));
  const totalArmorPenPct = ignoreArmor
    ? 0
    : sumByValue(filterMods(mods, "ArmorPenPct")) / 100;
  const enemyArmorPhysMult =
    1 - enemyArmorDmgMitigation.physical + totalArmorPenPct;
  const enemyArmorNonPhysMult =
    1 - enemyArmorDmgMitigation.nonPhysical + totalArmorPenPct;

  const applyPen = <T extends DmgRange | number | undefined>(
    value: T,
    mult: number,
  ): T => {
    if (value === undefined) return undefined as T;
    return multValue(value, mult) as T;
  };

  const phys = applyPen(dmg.physical, enemyArmorPhysMult);
  const cold = applyPen(dmg.cold, enemyColdResMult * enemyArmorNonPhysMult);
  const lightning = applyPen(
    dmg.lightning,
    enemyLightningResMult * enemyArmorNonPhysMult,
  );
  const fire = applyPen(dmg.fire, enemyFireResMult * enemyArmorNonPhysMult);
  const erosion = applyPen(
    dmg.erosion,
    enemyErosionResMult * enemyArmorNonPhysMult,
  );

  return { physical: phys, cold, lightning, fire, erosion } as
    | DmgRanges
    | NumDmgValues;
}

// === Damage Mod Type Utilities ===

export const dmgModTypePerSkillTag: Partial<Record<SkillTag, DmgModType>> = {
  Attack: "attack",
  Spell: "spell",
  Melee: "melee",
  Area: "area",
  Channeled: "channeled",
  "Shadow Strike": "shadow_strike_skill",
};

export const dmgModTypesForSkill = (skill: BaseActiveSkill): DmgModType[] => {
  const dmgModTypes: DmgModType[] = ["global"];
  const tags = skill.tags;
  tags.forEach((t) => {
    const dmgModType = dmgModTypePerSkillTag[t];
    if (dmgModType !== undefined) {
      dmgModTypes.push(dmgModType);
    }
  });
  if (skill.kinds.includes("hit_enemies")) {
    dmgModTypes.push("hit");
  }
  if (skill.kinds.includes("dot")) {
    dmgModTypes.push("damage_over_time");
  }
  if (skill.tags.includes("Area") && skill.tags.includes("Erosion")) {
    dmgModTypes.push("erosion_area");
  }
  return dmgModTypes;
};

export const filterDmgPctMods = (
  dmgPctMods: ModT<"DmgPct">[],
  dmgModTypes: DmgModType[],
): ModT<"DmgPct">[] => {
  return dmgPctMods.filter((p) => dmgModTypes.includes(p.dmgModType));
};

export const calculateDmgInc = (mods: ModT<"DmgPct">[]): number => {
  return calculateInc(mods.filter((m) => !m.addn).map((m) => m.value));
};

export const calculateDmgAddn = (mods: ModT<"DmgPct">[]): number => {
  return calculateAddn(mods.filter((m) => m.addn).map((m) => m.value));
};

// === Damage Pool Calculations ===

// Apply damage % bonuses to a single chunk, considering its conversion history
export const calculateChunkDmg = <T extends DmgRange | number>(
  chunk: DmgChunk<T>,
  currentType: DmgChunkType,
  allDmgPctMods: ModT<"DmgPct">[],
  baseDmgModTypes: DmgModType[],
): T => {
  // Chunk benefits from bonuses for current type AND all types in its history
  const allApplicableTypes: DmgChunkType[] = [currentType, ...chunk.history];
  const dmgModTypes: DmgModType[] = [...baseDmgModTypes];

  for (const dmgType of allApplicableTypes) {
    dmgModTypes.push(dmgType);
    if (["cold", "lightning", "fire"].includes(dmgType)) {
      dmgModTypes.push("elemental");
    }
  }

  const applicableMods = filterDmgPctMods(allDmgPctMods, dmgModTypes);

  const inc = calculateDmgInc(applicableMods);
  const addn = calculateDmgAddn(applicableMods);
  const mult = (1 + inc) * addn;

  return multValue(chunk.value, mult);
};

// Sum all chunks in a pool, applying bonuses to each based on its history
export const calculatePoolTotal = <T extends DmgRange | number>(
  pool: DmgChunk<T>[],
  poolType: DmgChunkType,
  allDmgPctMods: ModT<"DmgPct">[],
  baseDmgModTypes: DmgModType[],
  zero: T,
): T => {
  return pool.reduce((total, chunk) => {
    const chunkDmg = calculateChunkDmg(
      chunk,
      poolType,
      allDmgPctMods,
      baseDmgModTypes,
    );
    return addValue(total, chunkDmg);
  }, zero);
};

// Calculate totals for all damage pools
export const calculateAllPoolTotals = <T extends DmgRange | number>(
  dmgPools: DmgPools<T>,
  allDmgPcts: ModT<"DmgPct">[],
  baseDmgModTypes: DmgModType[],
  zero: T,
): Record<DmgChunkType, T> => ({
  physical: calculatePoolTotal(
    dmgPools.physical,
    "physical",
    allDmgPcts,
    baseDmgModTypes,
    zero,
  ),
  cold: calculatePoolTotal(
    dmgPools.cold,
    "cold",
    allDmgPcts,
    baseDmgModTypes,
    zero,
  ),
  lightning: calculatePoolTotal(
    dmgPools.lightning,
    "lightning",
    allDmgPcts,
    baseDmgModTypes,
    zero,
  ),
  fire: calculatePoolTotal(
    dmgPools.fire,
    "fire",
    allDmgPcts,
    baseDmgModTypes,
    zero,
  ),
  erosion: calculatePoolTotal(
    dmgPools.erosion,
    "erosion",
    allDmgPcts,
    baseDmgModTypes,
    zero,
  ),
});

export interface ApplyDmgBonusesAndPenInput {
  dmgPools: DmgPools<DmgRange> | DmgPools<number>;
  mods: Mod[];
  baseDmgModTypes: DmgModType[];
  config: Configuration;
  ignoreArmor: boolean;
}

// Applies damage % bonuses and penetration to damage pools
export function applyDmgBonusesAndPen(
  input: ApplyDmgBonusesAndPenInput & { dmgPools: DmgPools<DmgRange> },
): DmgRanges;
export function applyDmgBonusesAndPen(
  input: ApplyDmgBonusesAndPenInput & { dmgPools: DmgPools<number> },
): NumDmgValues;
export function applyDmgBonusesAndPen(
  input: ApplyDmgBonusesAndPenInput,
): DmgRanges | NumDmgValues {
  const { dmgPools, mods, baseDmgModTypes, config, ignoreArmor } = input;
  const allDmgPcts = filterMods(mods, "DmgPct");

  // Convert ElementalSpellDmgPct to elemental DmgPct when skill is a spell
  if (baseDmgModTypes.includes("spell")) {
    for (const m of filterMods(mods, "ElementalSpellDmgPct")) {
      allDmgPcts.push({
        type: "DmgPct",
        value: m.value,
        dmgModType: "elemental",
        addn: m.addn,
        per: m.per,
        cond: m.cond,
        condThreshold: m.condThreshold,
        src: m.src,
      });
    }
  }

  // Determine if we're working with DmgRange or number based on pool contents
  const firstChunk =
    dmgPools.physical[0] ??
    dmgPools.cold[0] ??
    dmgPools.lightning[0] ??
    dmgPools.fire[0] ??
    dmgPools.erosion[0];
  const isRange =
    firstChunk === undefined || typeof firstChunk.value !== "number";

  if (isRange) {
    const beforePen = calculateAllPoolTotals(
      dmgPools as DmgPools<DmgRange>,
      allDmgPcts,
      baseDmgModTypes,
      { min: 0, max: 0 },
    ) as DmgRanges;
    return calculatePenetration({ dmg: beforePen, mods, config, ignoreArmor });
  }

  const beforePen = calculateAllPoolTotals(
    dmgPools as DmgPools<number>,
    allDmgPcts,
    baseDmgModTypes,
    0,
  ) as NumDmgValues;
  return calculatePenetration({ dmg: beforePen, mods, config, ignoreArmor });
}

// === Gear Damage Calculations ===

// currently only calculating mainhand
export const calculateGearDmg = (loadout: Loadout, allMods: Mod[]): GearDmg => {
  const mainhand = loadout.gearPage.equippedGear.mainHand;
  if (mainhand === undefined) {
    return emptyGearDmg();
  }
  const mainhandMods = collectModsFromAffixes(getGearAffixes(mainhand));
  const basePhysDmgMod = mainhand.baseStats?.baseStatLines
    .flatMap((l) => l.mods ?? [])
    .find((m) => m.type === "GearBasePhysDmg");
  const basePhysDmg =
    basePhysDmgMod?.type === "GearBasePhysDmg"
      ? basePhysDmgMod.value
      : undefined;
  if (basePhysDmg === undefined) {
    return emptyGearDmg();
  }

  let phys = emptyDamageRange();
  let cold = emptyDamageRange();
  let lightning = emptyDamageRange();
  let fire = emptyDamageRange();
  let erosion = emptyDamageRange();

  phys.min += basePhysDmg;
  phys.max += basePhysDmg;
  let physBonusPct = 0;

  const gearPhysDmgPct = findMod(mainhandMods, "GearPhysDmgPct");
  if (gearPhysDmgPct !== undefined) {
    physBonusPct += gearPhysDmgPct.value;
  }

  filterMods(mainhandMods, "FlatGearDmg").forEach((a) => {
    match(a.modType)
      .with("physical", () => {
        phys = addDR(phys, a.value);
      })
      .with("cold", () => {
        cold = addDR(cold, a.value);
      })
      .with("lightning", () => {
        lightning = addDR(lightning, a.value);
      })
      .with("fire", () => {
        fire = addDR(fire, a.value);
      })
      .with("erosion", () => {
        erosion = addDR(erosion, a.value);
      })
      .with("elemental", () => {
        cold = addDR(cold, a.value);
        lightning = addDR(lightning, a.value);
        fire = addDR(fire, a.value);
      })
      .exhaustive();
  });

  let addnMHDmgMult = 1;
  filterMods(allMods, "AddnMainHandDmgPct").forEach((a) => {
    addnMHDmgMult *= 1 + a.value / 100;
  });

  phys = multDR(phys, 1 + physBonusPct);
  phys = multDR(phys, addnMHDmgMult);
  cold = multDR(cold, addnMHDmgMult);
  lightning = multDR(lightning, addnMHDmgMult);
  fire = multDR(fire, addnMHDmgMult);
  erosion = multDR(erosion, addnMHDmgMult);
  return {
    mainHand: {
      physical: phys,
      cold: cold,
      lightning: lightning,
      fire: fire,
      erosion: erosion,
    },
  };
};

export const calculateFlatDmg = (
  allMods: Mod[],
  skillType: "attack" | "spell",
): DmgRanges => {
  let phys = emptyDamageRange();
  let cold = emptyDamageRange();
  let lightning = emptyDamageRange();
  let fire = emptyDamageRange();
  let erosion = emptyDamageRange();

  const mods = match(skillType)
    .with("attack", () => filterMods(allMods, "FlatDmgToAtks"))
    .with("spell", () => filterMods(allMods, "FlatDmgToSpells"))
    .exhaustive();
  for (const a of mods) {
    match(a.dmgType)
      .with("physical", () => {
        phys = addDR(phys, a.value);
      })
      .with("cold", () => {
        cold = addDR(cold, a.value);
      })
      .with("lightning", () => {
        lightning = addDR(lightning, a.value);
      })
      .with("fire", () => {
        fire = addDR(fire, a.value);
      })
      .with("erosion", () => {
        erosion = addDR(erosion, a.value);
      })
      .exhaustive();
  }
  return {
    physical: phys,
    cold,
    lightning,
    fire,
    erosion,
  };
};

export const calculateGearAspd = (loadout: Loadout, allMods: Mod[]): number => {
  const baseAspdMod =
    loadout.gearPage.equippedGear.mainHand?.baseStats?.baseStatLines
      .flatMap((l) => l.mods ?? [])
      .find((m) => m.type === "GearBaseAttackSpeed");
  const baseAspd =
    baseAspdMod?.type === "GearBaseAttackSpeed" ? baseAspdMod.value : 0;
  const gearAspdPctBonus = calculateInc(
    filterMods(allMods, "GearAspdPct").map((b) => b.value),
  );
  return baseAspd * (1 + gearAspdPctBonus);
};

// === Crit Calculations ===

export const calculateCritChance = (
  allMods: Mod[],
  skill: BaseActiveSkill,
): number => {
  const modTypes: CritRatingModType[] = ["global"];
  if (skill.tags.includes("Attack")) {
    modTypes.push("attack");
  }
  if (skill.tags.includes("Spell")) {
    modTypes.push("spell");
  }
  if (skill.tags.includes("Projectile")) {
    modTypes.push("projectile");
  }

  const addedFlatCritRating = sumByValue(
    filterMods(allMods, "FlatCritRating").filter((m) =>
      modTypes.includes(m.modType),
    ),
  );
  const baseCritRating = 500;
  const baseCritChance = (baseCritRating + addedFlatCritRating) / 100 / 100;

  const critRatingPctMods = filterMods(allMods, "CritRatingPct").filter((m) =>
    modTypes.includes(m.modType),
  );
  const critRatingMult = calcEffMult(critRatingPctMods);
  return Math.min(baseCritChance * critRatingMult, 1);
};

export const calculateCritDmg = (
  allMods: Mod[],
  skill: BaseActiveSkill,
): number => {
  const modTypes: CritDmgModType[] = ["global"];
  if (skill.tags.includes("Attack")) {
    modTypes.push("attack");
  }
  if (skill.tags.includes("Spell")) {
    modTypes.push("spell");
  }
  if (skill.tags.includes("Physical")) {
    modTypes.push("physical_skill");
  }
  if (skill.tags.includes("Cold")) {
    modTypes.push("cold_skill");
  }
  if (skill.tags.includes("Lightning")) {
    modTypes.push("lightning_skill");
  }
  if (skill.tags.includes("Fire")) {
    modTypes.push("fire_skill");
  }
  if (skill.tags.includes("Erosion")) {
    modTypes.push("erosion_skill");
  }
  const mods = filterMods(allMods, "CritDmgPct").filter((m) =>
    modTypes.includes(m.modType),
  );
  const inc = calculateInc(mods.filter((m) => !m.addn).map((v) => v.value));
  const addn = calculateAddn(mods.filter((m) => m.addn).map((v) => v.value));

  return (1.5 + inc) * addn;
};

export const calculateDoubleDmgMult = (mods: Mod[]): number => {
  const doubleDmgMods = filterMods(mods, "DoubleDmgChancePct");
  // capped at 100% chance to deal double damage
  const inc = Math.min(1, calculateInc(doubleDmgMods.map((v) => v.value)));
  return 1 + inc;
};

// === Attack Speed ===

export const calculateAspd = (loadout: Loadout, allMods: Mod[]): number => {
  const gearAspd = calculateGearAspd(loadout, allMods);
  const aspdPctMods = filterMods(allMods, "AspdPct");
  const inc = calculateInc(
    aspdPctMods.filter((m) => !m.addn).map((v) => v.value),
  );
  const addn = calculateAddn(
    aspdPctMods.filter((m) => m.addn).map((v) => v.value),
  );

  return gearAspd * (1 + inc) * addn;
};

export const calculateExtraOffenseMults = (
  mods: Mod[],
  config: Configuration,
): number => {
  let inc = 0;
  if (config.baptismOfPurityEnabled) {
    inc += findMod(mods, "MercuryBaptismDmgPct")?.value ?? 0;
  }
  return (100 + inc) / 100;
};
