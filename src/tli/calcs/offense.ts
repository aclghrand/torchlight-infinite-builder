import * as R from "remeda";
import { match } from "ts-pattern";
import { CoreTalentMods } from "@/src/data/core_talent";
import type { HeroName } from "@/src/data/hero_trait";
import type { PactspiritName } from "@/src/data/pactspirit";
import {
  type ActiveSkillName,
  ActiveSkills,
  type BaseActiveSkill,
  type BasePassiveSkill,
  type BaseSkill,
  type BaseSupportSkill,
  type ImplementedActiveSkillName,
  type PassiveSkillName,
  PassiveSkills,
  type SkillOffense,
  type SkillOffenseOfType,
  type SkillOffenseType,
  type SkillTag,
  SupportSkills,
} from "../../data/skill";
import type { DmgModType } from "../constants";
import type {
  Affix,
  BaseSupportSkillSlot,
  Configuration,
  DmgRange,
  Loadout,
  SkillSlot,
} from "../core";
import { getHeroTraitMods } from "../hero/hero_trait_mods";
import type {
  ConditionThreshold,
  DmgChunkType,
  Mod,
  ModOfType,
  ResType,
  Stackable,
  StatType,
} from "../mod";
import { getActiveSkillMods } from "../skills/active_mods";
import { getPassiveSkillMods } from "../skills/passive_mods";
import { buildSupportSkillAffixes } from "../storage/load-save";
import { getAllAffixes, getGearAffixes } from "./affix-collectors";
import type { OffenseSkillName } from "./skill_confs";
import { type ModWithValue, multModValue, multValue } from "./util";

const addDR = (dr1: DmgRange, dr2: DmgRange): DmgRange => {
  return {
    min: dr1.min + dr2.min,
    max: dr1.max + dr2.max,
  };
};

const addValue = <T extends DmgRange | number>(v1: T, v2: T): T => {
  if (typeof v1 === "number" && typeof v2 === "number") {
    return (v1 + v2) as T;
  }
  return addDR(v1 as DmgRange, v2 as DmgRange) as T;
};

const addDRs = (drs1: DmgRanges, drs2: DmgRanges): DmgRanges => {
  return {
    physical: addDR(drs1.physical, drs2.physical),
    cold: addDR(drs1.cold, drs2.cold),
    lightning: addDR(drs1.lightning, drs2.lightning),
    fire: addDR(drs1.fire, drs2.fire),
    erosion: addDR(drs1.erosion, drs2.erosion),
  };
};

const multDR = (dr: DmgRange, multiplier: number): DmgRange => {
  return {
    min: dr.min * multiplier,
    max: dr.max * multiplier,
  };
};

const multDRs = (drs: DmgRanges, multiplier: number): DmgRanges => {
  return {
    physical: multDR(drs.physical, multiplier),
    cold: multDR(drs.cold, multiplier),
    lightning: multDR(drs.lightning, multiplier),
    fire: multDR(drs.fire, multiplier),
    erosion: multDR(drs.erosion, multiplier),
  };
};

const emptyDamageRange = (): DmgRange => {
  return { min: 0, max: 0 };
};

const sumByValue = (mods: Extract<Mod, { value: number }>[]): number => {
  return R.sumBy(mods, (m) => m.value);
};

const calculateInc = (bonuses: number[]) => {
  return R.pipe(bonuses, R.sum()) / 100;
};

const calculateAddn = (bonuses: number[]) => {
  return R.pipe(
    bonuses,
    R.reduce((b1, b2) => b1 * (1 + b2 / 100), 1),
  );
};

// Calculates (1 + inc) * addn multiplier from mods with value and addn properties
const calculateEffMultiplier = <T extends { value: number; addn?: boolean }>(
  mods: T[],
): number => {
  const incMods = mods.filter((m) => m.addn === undefined || m.addn === false);
  const addnMods = mods.filter((m) => m.addn === true);
  const inc = calculateInc(incMods.map((m) => m.value));
  const addn = calculateAddn(addnMods.map((m) => m.value));
  return (1 + inc) * addn;
};

const collectModsFromAffixes = (affixes: Affix[]): Mod[] => {
  return affixes.flatMap((a) => a.affixLines.flatMap((l) => l.mods ?? []));
};

export const collectMods = (loadout: Loadout): Mod[] => {
  return collectModsFromAffixes(getAllAffixes(loadout));
};

const resolveCoreTalentMods = (mods: Mod[]): Mod[] => {
  const coreTalentNamesAndSrc = R.unique(
    filterMod(mods, "CoreTalent").map((m) => ({ name: m.name, src: m.src })),
  );
  const newMods: Mod[] = coreTalentNamesAndSrc.flatMap(({ name, src }) => {
    const affix = CoreTalentMods[name];
    const mods = affix.affixLines.flatMap((affixLine) => affixLine.mods ?? []);
    const modsWithSrc = mods.map((m) => ({
      ...m,
      src: `${src}#CoreTalent: ${name}`,
    }));
    return modsWithSrc;
  });
  return [...mods.filter((m) => m.type !== "CoreTalent"), ...newMods];
};

export interface OffenseAttackDpsSummary {
  critChance: number;
  critDmgMult: number;
  aspd: number;
  avgHit: number;
  avgHitWithCrit: number;
  avgDps: number;
}

interface OffenseSummary {
  attackDpsSummary?: OffenseAttackDpsSummary;
  persistentDpsSummary?: PersistentDpsSummary;
  totalReapDpsSummary?: TotalReapDpsSummary;
  totalDps: number;
  resolvedMods: Mod[];
}

interface GearDmg {
  mainHand: DmgRanges;
  offHand?: DmgRanges;
}

const emptyGearDmg = (): GearDmg => {
  return {
    mainHand: emptyDmgRanges(),
  };
};

export type DmgRanges = Record<DmgChunkType, DmgRange>;

// Num damage values (single number per type, all optional)
type NumDmgValues = Partial<Record<DmgChunkType, number>>;

// Union type for convertDmg input
type DmgInput = DmgRanges | NumDmgValues;

const emptyDmgRanges = (): DmgRanges => {
  return {
    physical: { min: 0, max: 0 },
    cold: { min: 0, max: 0 },
    lightning: { min: 0, max: 0 },
    fire: { min: 0, max: 0 },
    erosion: { min: 0, max: 0 },
  };
};

const findMod = <T extends Mod["type"]>(
  mods: Mod[],
  type: T,
): Extract<Mod, { type: T }> | undefined => {
  return mods.find((a) => a.type === type) as
    | Extract<Mod, { type: T }>
    | undefined;
};

const filterMod = <T extends Mod["type"]>(
  mods: Mod[],
  type: T,
): Extract<Mod, { type: T }>[] => {
  return mods.filter((a) => a.type === type) as Extract<Mod, { type: T }>[];
};

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
    const addsDmgAsMods = filterMod(allMods, "AddsDmgAsPct").filter(
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
    const convMods = filterMod(allMods, "ConvertDmgPct").filter(
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

// currently only calculating mainhand
const calculateGearDmg = (loadout: Loadout, allMods: Mod[]): GearDmg => {
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

  filterMod(mainhandMods, "FlatGearDmg").forEach((a) => {
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
  filterMod(allMods, "AddnMainHandDmgPct").forEach((a) => {
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

const calculateFlatDmg = (
  allMods: Mod[],
  _skillType: "attack" | "spell",
): DmgRanges => {
  // TODO: implement for spells

  let phys = emptyDamageRange();
  let cold = emptyDamageRange();
  let lightning = emptyDamageRange();
  let fire = emptyDamageRange();
  let erosion = emptyDamageRange();

  const mods = filterMod(allMods, "FlatDmgToAtks");
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

const calculateGearAspd = (loadout: Loadout, allMods: Mod[]): number => {
  const baseAspdMod =
    loadout.gearPage.equippedGear.mainHand?.baseStats?.baseStatLines
      .flatMap((l) => l.mods ?? [])
      .find((m) => m.type === "GearBaseAttackSpeed");
  const baseAspd =
    baseAspdMod?.type === "GearBaseAttackSpeed" ? baseAspdMod.value : 0;
  const gearAspdPctBonus = calculateInc(
    filterMod(allMods, "GearAspdPct").map((b) => b.value),
  );
  return baseAspd * (1 + gearAspdPctBonus);
};

const calculateCritChance = (allMods: Mod[]): number => {
  const critRatingPctMods = filterMod(allMods, "CritRatingPct");
  const mods = critRatingPctMods.map((a) => {
    return {
      type: "CritRatingPct",
      value: a.value,
      modType: a.modType,
      src: a.src,
    };
  });

  const inc = calculateInc(mods.map((v) => v.value));
  return Math.min(0.05 * (1 + inc), 1);
};

const calculateCritDmg = (allMods: Mod[]): number => {
  const critDmgPctMods = filterMod(allMods, "CritDmgPct");
  const mods = critDmgPctMods.map((a) => {
    return {
      type: "CritDmgPct",
      value: a.value,
      addn: a.addn,
      modType: a.modType,
      src: a.src,
    };
  });

  const inc = calculateInc(mods.filter((m) => !m.addn).map((v) => v.value));
  const addn = calculateAddn(mods.filter((m) => m.addn).map((v) => v.value));

  return (1.5 + inc) * addn;
};

const calculateDoubleDmgMult = (mods: Mod[]): number => {
  const doubleDmgMods = filterMod(mods, "DoubleDmgChancePct");
  // capped at 100% chance to deal double damage
  const inc = Math.min(1, calculateInc(doubleDmgMods.map((v) => v.value)));
  return 1 + inc;
};

const calculateAspd = (loadout: Loadout, allMods: Mod[]): number => {
  const gearAspd = calculateGearAspd(loadout, allMods);
  const aspdPctMods = filterMod(allMods, "AspdPct");
  const inc = calculateInc(
    aspdPctMods.filter((m) => !m.addn).map((v) => v.value),
  );
  const addn = calculateAddn(
    aspdPctMods.filter((m) => m.addn).map((v) => v.value),
  );

  return gearAspd * (1 + inc) * addn;
};

const calculateExtraOffenseMults = (
  mods: Mod[],
  config: Configuration,
): number => {
  let inc = 0;
  if (config.baptismOfPurityEnabled) {
    inc += findMod(mods, "MercuryBaptismDmgPct")?.value ?? 0;
  }
  return (100 + inc) / 100;
};

const dmgModTypePerSkillTag: Partial<Record<SkillTag, DmgModType>> = {
  Attack: "attack",
  Spell: "spell",
  Melee: "melee",
  Area: "area",
  Channeled: "channeled",
  "Shadow Strike": "shadow_strike_skill",
};

const dmgModTypesForSkill = (skill: BaseActiveSkill): DmgModType[] => {
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

const filterDmgPctMods = (
  dmgPctMods: Extract<Mod, { type: "DmgPct" }>[],
  dmgModTypes: DmgModType[],
) => {
  return dmgPctMods.filter((p) => dmgModTypes.includes(p.dmgModType));
};

const calculateDmgInc = (mods: Extract<Mod, { type: "DmgPct" }>[]) => {
  return calculateInc(mods.filter((m) => !m.addn).map((m) => m.value));
};

const calculateDmgAddn = (mods: Extract<Mod, { type: "DmgPct" }>[]) => {
  return calculateAddn(mods.filter((m) => m.addn).map((m) => m.value));
};

// Apply damage % bonuses to a single chunk, considering its conversion history
const calculateChunkDmg = <T extends DmgRange | number>(
  chunk: DmgChunk<T>,
  currentType: DmgChunkType,
  allDmgPctMods: Extract<Mod, { type: "DmgPct" }>[],
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
const calculatePoolTotal = <T extends DmgRange | number>(
  pool: DmgChunk<T>[],
  poolType: DmgChunkType,
  allDmgPctMods: Extract<Mod, { type: "DmgPct" }>[],
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
const calculateAllPoolTotals = <T extends DmgRange | number>(
  dmgPools: DmgPools<T>,
  allDmgPcts: Extract<Mod, { type: "DmgPct" }>[],
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

interface ApplyDmgBonusesAndPenInput {
  dmgPools: DmgPools<DmgRange> | DmgPools<number>;
  mods: Mod[];
  baseDmgModTypes: DmgModType[];
  config: Configuration;
  ignoreArmor: boolean;
}

// Applies damage % bonuses and penetration to damage pools
function applyDmgBonusesAndPen(
  input: ApplyDmgBonusesAndPenInput & { dmgPools: DmgPools<DmgRange> },
): DmgRanges;
function applyDmgBonusesAndPen(
  input: ApplyDmgBonusesAndPenInput & { dmgPools: DmgPools<number> },
): NumDmgValues;
function applyDmgBonusesAndPen(
  input: ApplyDmgBonusesAndPenInput,
): DmgRanges | NumDmgValues {
  const { dmgPools, mods, baseDmgModTypes, config, ignoreArmor } = input;
  const allDmgPcts = filterMod(mods, "DmgPct");

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

interface SkillHitOverview {
  // Damage ranges of a single skill hit, not including crit
  base: {
    physical: DmgRange;
    cold: DmgRange;
    lightning: DmgRange;
    fire: DmgRange;
    erosion: DmgRange;
    total: DmgRange;
  };
  // Average damage of a single skill hit, not including crit
  avg: number;
}

const getLevelOffense = <T extends SkillOffenseType>(
  skill: BaseActiveSkill,
  skillOffenseType: T,
  level: number,
): Extract<SkillOffense, { type: T }> => {
  const skillMods = getActiveSkillMods(skill.name as ActiveSkillName, level);
  if (skillMods.offense === undefined) {
    throw new Error(`Skill "${skill.name}" has no levelOffense data`);
  }
  const offense = skillMods.offense.find((o) => o.type === skillOffenseType);
  if (offense === undefined) {
    throw new Error(
      `Skill "${skill.name}" has no ${skillOffenseType} in levelOffense`,
    );
  }
  return offense as Extract<SkillOffense, { type: T }>;
};

const getLevelOffenseValue = (
  skill: BaseActiveSkill,
  skillOffenseType: SkillOffenseType,
  level: number,
): number | DmgRange => {
  return getLevelOffense(skill, skillOffenseType, level).value;
};

const calculateAddnDmgFromShadows = (
  numShadowHits: number,
): ModOfType<"DmgPct"> | undefined => {
  if (numShadowHits <= 0) return;
  if (numShadowHits === 1) {
    return {
      type: "DmgPct",
      addn: true,
      value: 100, // 100% additional damage (doubles the hit)
      dmgModType: "global",
      src: `Shadow Strike: ${numShadowHits} hits`,
    };
  }
  const falloffCoefficient = 0.7;

  // Each hit deals (1 - falloff)^i of original, where i is 0-indexed
  // Geometric series: dmgValue * (1 + r + r^2 + ... + r^(n-1)) = dmgValue * (1 - r^n) / (1 - r)
  const retainedRatio = 1 - falloffCoefficient;
  const geometricSum =
    (1 - retainedRatio ** numShadowHits) / falloffCoefficient;

  return {
    type: "DmgPct",
    addn: true,
    value: geometricSum * 100, // Convert to whole percentage
    dmgModType: "global",
    src: `Shadow Strike: ${numShadowHits} hits`,
  };
};

const filterPenMods = (
  mods: ModOfType<"ResPenPct">[],
  penTypes: ModOfType<"ResPenPct">["penType"][],
): ModOfType<"ResPenPct">[] => {
  return mods.filter((m) => penTypes.includes(m.penType));
};

interface CalculatePenetrationInput {
  dmg: DmgRanges | NumDmgValues;
  mods: Mod[];
  config: Configuration;
  ignoreArmor: boolean;
}

function calculatePenetration(
  input: CalculatePenetrationInput & { dmg: DmgRanges },
): DmgRanges;
function calculatePenetration(
  input: CalculatePenetrationInput & { dmg: NumDmgValues },
): NumDmgValues;
function calculatePenetration(
  input: CalculatePenetrationInput,
): DmgRanges | NumDmgValues {
  const { dmg, mods, config, ignoreArmor } = input;
  const enemyRes = calculateEnemyRes(mods, config);
  const elePenMods = filterMod(mods, "ResPenPct");
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
    : sumByValue(filterMod(mods, "ArmorPenPct")) / 100;
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

const calculateAtkHit = (
  gearDmg: GearDmg,
  flatDmg: DmgRanges,
  mods: Mod[],
  skill: BaseActiveSkill,
  level: number,
  config: Configuration,
): SkillHitOverview | undefined => {
  const skillWeaponDR = match(skill.name)
    .with("Berserking Blade", () => {
      return multDRs(gearDmg.mainHand, 210 / 100);
    })
    .with("Frost Spike", () => {
      return multDRs(
        gearDmg.mainHand,
        (getLevelOffenseValue(skill, "WeaponAtkDmgPct", level) as number) / 100,
      );
    })
    .with("[Test] Simple Attack", () => {
      return gearDmg.mainHand;
    })
    .otherwise(() => {
      // either it's unimplemented, not an attack
      return;
    });
  if (skillWeaponDR === undefined) return;
  const skillFlatDR = multDRs(
    flatDmg,
    (getLevelOffenseValue(skill, "AddedDmgEffPct", level) as number) / 100,
  );
  const skillBaseDmg = addDRs(skillWeaponDR, skillFlatDR);

  // Apply % bonuses to each pool, considering conversion history
  const addSpellTag =
    skill.tags.includes("Attack") &&
    findMod(mods, "SpellDmgBonusAppliesToAtkDmg") !== undefined;

  const baseDmgModTypes: DmgModType[] = addSpellTag
    ? [...dmgModTypesForSkill(skill), "spell"]
    : dmgModTypesForSkill(skill);

  // Damage conversion happens after flat damage, before % bonuses
  const dmgPools = convertDmg(skillBaseDmg, mods);
  const { physical, cold, lightning, fire, erosion } = applyDmgBonusesAndPen({
    dmgPools,
    mods,
    baseDmgModTypes,
    config,
    ignoreArmor: false,
  });

  const total = {
    min: physical.min + cold.min + lightning.min + fire.min + erosion.min,
    max: physical.max + cold.max + lightning.max + fire.max + erosion.max,
  };
  const totalAvg = (total.min + total.max) / 2;

  return {
    base: {
      physical: physical,
      cold: cold,
      lightning: lightning,
      fire: fire,
      erosion: erosion,
      total: total,
    },
    avg: totalAvg,
  };
};

export interface OffenseInput {
  loadout: Loadout;
  configuration: Configuration;
}

export interface OffenseResults {
  skills: Partial<Record<ImplementedActiveSkillName, OffenseSummary>>;
  resourcePool: ResourcePool;
  defenses: Defenses;
}

interface DerivedCtx {
  hasHasten: boolean;
  hasBlasphemer: boolean;
}

const resolveDerivedCtx = (mods: Mod[]): DerivedCtx => {
  const hasHasten = findMod(mods, "HasHasten") !== undefined;
  const hasBlasphemer = findMod(mods, "Blasphemer") !== undefined;
  return { hasHasten, hasBlasphemer };
};

const hasPactspirit = (name: PactspiritName, loadout: Loadout): boolean => {
  return (
    loadout.pactspiritPage.slot1?.pactspiritName === name ||
    loadout.pactspiritPage.slot2?.pactspiritName === name ||
    loadout.pactspiritPage.slot3?.pactspiritName === name
  );
};

const isHero = (name: HeroName, loadout: Loadout): boolean => {
  return loadout.heroPage.selectedHero === name;
};

const enemyCcd = (config: Configuration) => {
  // todo: update with all cc
  return config.enemyParalyzed || config.enemyFrostbittenEnabled;
};

const filterModsByCond = (
  mods: Mod[],
  loadout: Loadout,
  config: Configuration,
  derivedCtx: DerivedCtx,
): Mod[] => {
  return mods.filter((m) => {
    if (m.cond === undefined) return true;
    return match(m.cond)
      .with("enemy_frostbitten", () => config.enemyFrostbittenEnabled)
      .with(
        "realm_of_mercury",
        () =>
          loadout.heroPage.selectedHero ===
            "Lightbringer Rosa: Unsullied Blade (#2)" &&
          config.realmOfMercuryEnabled,
      )
      .with("has_focus_blessing", () => config.hasFocusBlessing)
      .with("has_agility_blessing", () => config.hasAgilityBlessing)
      .with("has_tenacity_blessing", () => config.hasTenacityBlessing)
      .with("enemy_has_desecration", () => config.enemyHasDesecration)
      .with("enemy_paralyzed", () => config.enemyParalyzed)
      .with("has_full_mana", () => config.hasFullMana)
      .with("target_enemy_is_elite", () => config.targetEnemyIsElite)
      .with("target_enemy_is_nearby", () => config.targetEnemyIsNearby)
      .with(
        "target_enemy_is_in_proximity",
        () => config.targetEnemyIsInProximity,
      )
      .with("has_blocked_recently", () => config.hasBlockedRecently)
      .with("has_elites_nearby", () => config.hasElitesNearby)
      .with("enemy_has_ailment", () => config.enemyHasAilment)
      .with("has_hasten", () => derivedCtx.hasHasten)
      .with("has_crit_recently", () => config.hasCritRecently)
      .with("has_blur", () => config.hasBlur)
      .with("blur_ended_recently", () => config.blurEndedRecently)
      .with("channeling", () => config.channeling)
      .with("sages_insight_fire", () => config.sagesInsightFireActivated)
      .with("sages_insight_cold", () => config.sagesInsightColdActivated)
      .with(
        "sages_insight_lightning",
        () => config.sagesInsightLightningActivated,
      )
      .with("sages_insight_erosion", () => config.sagesInsightErosionActivated)
      .with("at_max_channeled_stacks", () => true)
      .with("enemy_at_max_affliction", () => calcAfflictionPts(config) === 100)
      .with("enemy_is_cursed", () => {
        // assume enemy is cursed if we have an enabled curse skill
        return (
          listActiveSkillSlots(loadout)
            .filter((s) => s.enabled && s.skillName !== undefined)
            .map((s) => findActiveSkill(s.skillName as ActiveSkillName))
            .find((s) => s.tags.includes("Curse")) !== undefined
        );
      })
      .with(
        "have_both_sealed_mana_and_life",
        () =>
          (config.sealedManaPct ?? 0) > 0 && (config.sealedLifePct ?? 0) > 0,
      )
      .with(
        // todo: there's gotta be a better way to handle this, right?
        "equipped_in_left_ring_slot",
        () => m.src?.startsWith("Gear#leftRing") ?? false,
      )
      .with(
        "equipped_in_right_ring_slot",
        () => m.src?.startsWith("Gear#rightRing") ?? false,
      )
      .with("has_portrait_of_a_fallen_saintess_pactspirit", () =>
        hasPactspirit("Portrait of a Fallen Saintess", loadout),
      )
      .with(
        "enemy_has_desecration_and_cc",
        () => config.enemyHasDesecration && enemyCcd(config),
      )
      .exhaustive();
  });
};

const condThresholdSatisfied = (
  actualValue: number,
  condThreshold: ConditionThreshold,
): boolean => {
  const { value: condValue, comparator } = condThreshold;
  return match(comparator)
    .with("lt", () => actualValue < condValue)
    .with("lte", () => actualValue <= condValue)
    .with("eq", () => actualValue === condValue)
    .with("gt", () => actualValue > condValue)
    .with("gte", () => actualValue >= condValue)
    .exhaustive();
};

const filterModsByCondThreshold = (
  mods: Mod[],
  config: Configuration,
): Mod[] => {
  return mods.filter((m) => {
    if (m.condThreshold === undefined) return true;
    const condThreshold = m.condThreshold;
    return match(condThreshold.target)
      .with("num_enemies_nearby", () =>
        condThresholdSatisfied(config.numEnemiesNearby, condThreshold),
      )
      .with("num_enemies_affected_by_warcry", () =>
        condThresholdSatisfied(
          config.numEnemiesAffectedByWarcry,
          condThreshold,
        ),
      )
      .exhaustive();
  });
};

// TODO: latent bug - mods with BOTH `cond` AND `per` would be handled incorrectly:
// - filterModsByFrostbittenCond adds them un-normalized
// - normalizeStackables adds them normalized (ignoring the condition)
// Result: mod appears twice, or included when condition isn't met.
// Currently no mods have both properties, but this should be fixed if any are added.
const normalizeStackables = (
  prenormalizedMods: Mod[],
  stackable: Stackable,
  stacks: number,
): Mod[] => {
  return prenormalizedMods
    .filter(
      (mod) =>
        "per" in mod &&
        mod.per !== undefined &&
        mod.per.stackable === stackable,
    )
    .map((mod) => normalizeStackable(mod, stackable, stacks))
    .filter((mod) => mod !== undefined);
};

const hasValue = (mod: Mod): mod is ModWithValue => "value" in mod;

const normalizeStackable = <T extends Mod>(
  mod: T,
  stackable: Stackable,
  stacks: number,
): T | undefined => {
  if (
    !("per" in mod) ||
    mod.per === undefined ||
    mod.per.stackable !== stackable
  ) {
    return undefined;
  }

  if (!hasValue(mod)) {
    return undefined;
  }

  const div = mod.per.amt || 1;
  const stackCount = Math.min(stacks / div, mod.per.limit ?? Infinity);

  let newModValue: number | DmgRange;
  if (mod.per.multiplicative === true && typeof mod.value === "number") {
    newModValue = ((1 + mod.value / 100) ** stackCount - 1) * 100;
  } else {
    newModValue = multValue(mod.value, stackCount);
  }

  if (typeof newModValue === "number" && mod.per.valueLimit !== undefined) {
    return {
      ...mod,
      value: Math.min(newModValue, mod.per.valueLimit),
    } as T;
  } else {
    return {
      ...mod,
      value: newModValue,
    } as T;
  }
};

interface Stats {
  str: number;
  dex: number;
  int: number;
}

// returns mods that don't need normalization
// excludes mods with `per` or that need replacement (like CoreTalent mods)
const filterOutPerMods = (mods: Mod[]): Mod[] => {
  const staticMods = mods.filter((m) => {
    const hasPer = "per" in m && m.per !== undefined;
    const isCoreTalent = m.type === "CoreTalent";
    return !(hasPer || isCoreTalent);
  });
  return staticMods;
};

// includes any mods that always apply, but don't come from loadout, like damage from stats, non-skill buffs, etc
const calculateImplicitMods = (): Mod[] => {
  return [
    {
      type: "DmgPct",
      value: 0.5,
      dmgModType: "global",
      addn: true,
      per: { stackable: "main_stat" },
      src: "Additional Damage from skill Main Stat (.5% per stat)",
    },
    {
      type: "DmgPct",
      value: 15,
      dmgModType: "global",
      addn: true,
      isEnemyDebuff: true,
      cond: "enemy_paralyzed",
      src: "Additional Damage when enemy paralyzed",
    },
    {
      type: "DmgPct",
      value: 5,
      dmgModType: "global",
      addn: true,
      per: { stackable: "focus_blessing" },
      cond: "has_focus_blessing",
      src: "Additional Damage from focus blessings (5% per blessing)",
    },
    {
      type: "AspdPct",
      value: 4,
      addn: false,
      per: { stackable: "agility_blessing" },
      cond: "has_agility_blessing",
      src: "Attack speed from agility blessings (4% per blessing)",
    },
    {
      type: "CspdPct",
      value: 4,
      addn: false,
      per: { stackable: "agility_blessing" },
      cond: "has_agility_blessing",
      src: "Cast speed from agility blessings (4% per blessing)",
    },
    {
      type: "DmgPct",
      value: 2,
      dmgModType: "global",
      addn: true,
      per: { stackable: "agility_blessing" },
      cond: "has_agility_blessing",
      src: "Additional Damage from agility blessings (2% per blessing)",
    },
    {
      type: "DmgPct",
      value: 15,
      dmgModType: "damage_over_time",
      addn: true,
      per: { stackable: "desecration", multiplicative: true },
      cond: "enemy_has_desecration",
      src: "Additional Damage over TIme from desecration (15% per stack)",
    },
    {
      type: "AspdPct",
      value: 2,
      addn: true,
      per: { stackable: "unsealed_mana_pct", amt: 10 },
      cond: "realm_of_mercury",
      src: "Realm of Mercury",
    },
    {
      type: "DmgPct",
      value: 3,
      dmgModType: "elemental",
      addn: true,
      per: { stackable: "unsealed_mana_pct", amt: 10 },
      cond: "realm_of_mercury",
      src: "Realm of Mercury",
    },
    {
      type: "AspdPct",
      value: 8,
      addn: true,
      cond: "has_hasten",
      src: "Hasten",
    },
    {
      type: "CspdPct",
      value: 8,
      addn: true,
      cond: "has_hasten",
      src: "Hasten",
    },
    {
      type: "MovementSpeedPct",
      value: 8,
      addn: true,
      cond: "has_hasten",
      src: "Hasten",
    },
    {
      type: "MobilitySkillCdrPct",
      value: 8,
      addn: true,
      cond: "has_hasten",
      src: "Hasten",
    },
    // Pactspirit: Portrait of a Fallen Saintess
    {
      type: "DmgPct",
      value: 4,
      addn: true,
      dmgModType: "erosion",
      cond: "has_portrait_of_a_fallen_saintess_pactspirit",
      per: { stackable: "repentance", multiplicative: true },
      src: "Repentance (4% additional dmg per stack, multiplicative)",
    },
  ];
};

const calculateHeroTraitMods = (loadout: Loadout): Mod[] => {
  const { traits, memorySlots } = loadout.heroPage;

  const mods = [];
  const traitToMemory = [
    { trait: traits.level1, memory: undefined },
    { trait: traits.level45, memory: memorySlots.slot45 },
    { trait: traits.level60, memory: memorySlots.slot60 },
    { trait: traits.level75, memory: memorySlots.slot75 },
  ];
  for (const { trait, memory } of traitToMemory) {
    if (trait !== undefined) {
      const memoryMods = collectModsFromAffixes(memory?.affixes ?? []);
      const addedLevel = findMod(memoryMods, "HeroTraitLevel")?.value ?? 0;
      const level = 3 + addedLevel;
      mods.push(...getHeroTraitMods(trait.name, level));
    }
  }
  return mods;
};

// todo: very basic stat calculation, will definitely need to handle things like pct, per, and conditionals
const calculateStats = (mods: Mod[]): Stats => {
  const statMods = filterMod(mods, "Stat");
  const statPctMods = filterMod(mods, "StatPct");
  const calcFinalStat = (statType: StatType): number => {
    const flat = sumByValue(
      statMods.filter(
        (m) => m.statModType === statType || m.statModType === "all",
      ),
    );
    const mult =
      1 +
      sumByValue(
        statPctMods.filter(
          (m) => m.statModType === statType || m.statModType === "all",
        ),
      ) /
        100;
    return flat * mult;
  };
  return {
    str: calcFinalStat("str"),
    dex: calcFinalStat("dex"),
    int: calcFinalStat("int"),
  };
};

const listActiveSkillSlots = (loadout: Loadout): SkillSlot[] => {
  // we're sure that SkillSlots properties only has SkillSlot as values
  const slots = Object.values(loadout.skillPage.activeSkills) as (
    | SkillSlot
    | undefined
  )[];
  return slots.filter((s) => s !== undefined);
};

const findActiveSkill = (name: ActiveSkillName): BaseActiveSkill => {
  // ActiveSkillName should be guaranteed to be something within ActiveSkills
  return ActiveSkills.find((s) => s.name === name) as BaseActiveSkill;
};

const listPassiveSkillSlots = (loadout: Loadout): SkillSlot[] => {
  const slots = Object.values(loadout.skillPage.passiveSkills) as (
    | SkillSlot
    | undefined
  )[];
  return slots.filter((s) => s !== undefined);
};

const findSkill = (
  name: ActiveSkillName | PassiveSkillName,
): BaseActiveSkill | BasePassiveSkill => {
  const active = ActiveSkills.find((s) => s.name === name);
  if (active) return active;
  return PassiveSkills.find((s) => s.name === name) as BasePassiveSkill;
};

// resolves mods coming from skills that provide buffs (levelBuffMods)
// for example, "Bull's Rage" provides a buff that increases all melee damage
const resolveBuffSkillMods = (
  loadout: Loadout,
  loadoutMods: Mod[],
  config: Configuration,
  derivedCtx: DerivedCtx,
): Mod[] => {
  const activeSkillSlots = listActiveSkillSlots(loadout);
  const passiveSkillSlots = listPassiveSkillSlots(loadout);
  const allSkillSlots = [...activeSkillSlots, ...passiveSkillSlots];
  const resolvedMods: Mod[] = [];

  for (const skillSlot of allSkillSlots) {
    if (!skillSlot.enabled || skillSlot.skillName === undefined) {
      continue;
    }

    const skill = findSkill(
      skillSlot.skillName as ActiveSkillName | PassiveSkillName,
    );
    const isAuraSkill =
      (skill.type === "Passive" && skill.tags?.includes("Aura")) ?? false;
    const isCurseSkill =
      (skill.type === "Active" && skill.tags?.includes("Curse")) ?? false;

    // Get support skill mods (includes SkillEffPct, AuraEffPct, etc.)
    const supportMods = resolveSelectedSkillSupportMods(
      skillSlot,
      loadoutMods,
      loadout,
      config,
      derivedCtx,
    );

    // Get level mods from factory based on skill type
    let levelMods: Mod[] = [];
    let rawBuffMods: Mod[] = [];

    const level =
      (skillSlot.level || 20) +
      calculateAddedSkillLevels(
        loadoutMods,
        skill,
        loadout,
        config,
        derivedCtx,
      );
    if (skill.type === "Active") {
      const activeMods = getActiveSkillMods(
        skill.name as ActiveSkillName,
        level,
      );
      levelMods =
        activeMods.mods?.map((mod) => ({
          ...mod,
          src: `${skill.name} Lv.${level}`,
        })) ?? [];
      rawBuffMods =
        activeMods.buffMods?.map((mod) => ({
          ...mod,
          src: `${isAuraSkill ? "Aura" : "Buff"}: ${skill.name} Lv.${level}`,
        })) ?? [];
    } else if (skill.type === "Passive") {
      const passiveMods = getPassiveSkillMods(
        skill.name as PassiveSkillName,
        level,
      );
      levelMods =
        passiveMods.mods?.map((mod) => ({
          ...mod,
          src: `${skill.name} Lv.${level}`,
        })) ?? [];
      rawBuffMods =
        passiveMods.buffMods?.map((mod) => ({
          ...mod,
          src: `${isAuraSkill ? "Aura" : "Buff"}: ${skill.name} Lv.${level}`,
        })) ?? [];
    }

    const prenormMods = [...loadoutMods, ...supportMods, ...levelMods];
    const { skillEffMult, auraEffMult, curseEffMult } =
      resolveBuffSkillEffMults(prenormMods, loadout, config, derivedCtx);

    // === Apply multipliers to buff mods ===
    for (const mod of rawBuffMods) {
      // Skip mods without value property (like CoreTalent)
      if (!("value" in mod)) {
        resolvedMods.push(mod);
        continue;
      }

      // Calculate final value
      let finalValue = mod.value;
      if (!("unscalable" in mod && mod.unscalable === true)) {
        if (isAuraSkill) {
          finalValue = multValue(finalValue, auraEffMult);
        } else if (isCurseSkill) {
          finalValue = multValue(finalValue, curseEffMult);
        } else {
          finalValue = multValue(finalValue, skillEffMult);
        }
      }

      resolvedMods.push({ ...mod, value: finalValue } as Mod);
    }
  }
  return resolvedMods;
};

const resolveSelectedSkillMods = (
  selectedSkillName: OffenseSkillName,
  level: number,
): Mod[] => {
  const skill = findActiveSkill(selectedSkillName);
  const skillMods = getActiveSkillMods(skill.name as ActiveSkillName, level);
  if (skillMods.mods === undefined) {
    return [];
  }
  return skillMods.mods.map((mod) => ({
    ...mod,
    src: `Selected Active Skill: ${skill.name} Lv.${level}`,
  }));
};

const resolveSelectedSkillSupportMods = (
  slot: SkillSlot,
  loadoutMods: Mod[],
  loadout: Loadout,
  config: Configuration,
  derivedCtx: DerivedCtx,
): Mod[] => {
  const supportSlots = Object.values(slot.supportSkills) as (
    | BaseSupportSkillSlot
    | undefined
  )[];

  const supportMods: Mod[] = [];
  for (const ss of supportSlots) {
    if (ss === undefined) continue;

    // Handle regular support skills
    if (ss.skillType === "support") {
      const supportSkill = SupportSkills.find((s) => s.name === ss.name) as
        | BaseSupportSkill
        | undefined;
      if (supportSkill === undefined) continue;

      const level =
        (ss.level ?? 20) +
        calculateAddedSkillLevels(
          loadoutMods,
          supportSkill,
          loadout,
          config,
          derivedCtx,
        );

      // Build affixes with the calculated level (includes added skill levels)
      // This ensures level bonuses are properly applied to templated mods
      const affixes = buildSupportSkillAffixes(ss.name, level);
      for (const affix of affixes) {
        if (affix.mods !== undefined) {
          for (const { mod } of affix.mods) {
            supportMods.push({
              ...mod,
              src: `Support: ${ss.name} Lv.${level}`,
            });
          }
        }
      }
    }
    // Handle magnificent support skills
    else if (ss.skillType === "magnificent_support") {
      for (const affix of ss.affixes) {
        if (affix.mods !== undefined) {
          for (const { mod } of affix.mods) {
            supportMods.push({
              ...mod,
              src: `Magnificent: ${ss.name} T${ss.tier} R${ss.rank}`,
            });
          }
        }
      }
    }
    // Handle noble support skills
    else if (ss.skillType === "noble_support") {
      for (const affix of ss.affixes) {
        if (affix.mods !== undefined) {
          for (const { mod } of affix.mods) {
            supportMods.push({
              ...mod,
              src: `Noble: ${ss.name} T${ss.tier} R${ss.rank}`,
            });
          }
        }
      }
    }
    // Handle activation medium skills
    else if (ss.skillType === "activation_medium") {
      for (const affix of ss.affixes) {
        if (affix.mods !== undefined) {
          for (const { mod } of affix.mods) {
            supportMods.push({
              ...mod,
              src: `Activation Medium: ${ss.name} T${ss.tier}`,
            });
          }
        }
      }
    }
  }
  return supportMods;
};

// Context for mods specific to a single skill
interface PerSkillModContext {
  mods: Mod[];
  skill: BaseActiveSkill;
}

// Resolves mods specific to a single skill slot
// Returns undefined if the skill is not implemented (no offense data)
const resolvePerSkillMods = (
  skillSlot: SkillSlot,
  loadoutMods: Mod[],
  loadout: Loadout,
  config: Configuration,
  derivedCtx: DerivedCtx,
): PerSkillModContext | undefined => {
  if (skillSlot.skillName === undefined) {
    return undefined;
  }
  const skill = findActiveSkill(skillSlot.skillName as ActiveSkillName);

  // Skip non-implemented skills (those without levelValues)
  if (!("levelValues" in skill) || skill.levelValues === undefined) {
    return undefined;
  }

  const level =
    (skillSlot.level || 20) +
    calculateAddedSkillLevels(loadoutMods, skill, loadout, config, derivedCtx);

  // Check if the skill's factory returns offense data
  const skillMods = getActiveSkillMods(skill.name as ActiveSkillName, level);
  if (skillMods.offense === undefined) {
    // Skill has levelValues but no offense (e.g., buff-only skills like Ice Bond)
    return undefined;
  }

  const selectedSkillMods = resolveSelectedSkillMods(
    skillSlot.skillName as OffenseSkillName,
    level,
  );
  const supportMods = resolveSelectedSkillSupportMods(
    skillSlot,
    loadoutMods,
    loadout,
    config,
    derivedCtx,
  );

  return {
    mods: [...selectedSkillMods, ...supportMods],
    skill,
  };
};

const calculateFervorCritRateMod = (
  mods: Mod[],
  resourcePool: ResourcePool,
): Mod => {
  const fervorEffMult = calculateEffMultiplier(filterMod(mods, "FervorEffPct"));
  const critRatePerPoint = 2 * fervorEffMult;
  const critRateFromFervor = resourcePool.fervorPts * critRatePerPoint;

  return {
    type: "CritRatingPct",
    value: critRateFromFervor,
    modType: "global",
    src: "fervor",
  };
};

const calculateWillpower = (normalizedMods: Mod[]) => {
  return findMod(normalizedMods, "MaxWillpowerStacks")?.value || 0;
};

const calculateTotalMainStats = (
  skill: BaseActiveSkill | BasePassiveSkill,
  stats: Stats,
) => {
  const mainStats = skill.mainStats ?? [];
  let totalMainStats = 0;
  for (const mainStatType of mainStats) {
    totalMainStats += stats[mainStatType];
  }
  return totalMainStats;
};

interface EnemyFrostbittenCtx {
  enabled: boolean;
  points: number;
}

const calculateEnemyFrostbitten = (
  config: Configuration,
): EnemyFrostbittenCtx => {
  return {
    enabled: config.enemyFrostbittenEnabled,
    points: config.enemyFrostbittenPoints ?? 0,
  };
};

const calculateNumShadowHits = (mods: Mod[], config: Configuration): number => {
  const shadowQuantMods = filterMod(mods, "ShadowQuant");
  const shadowQuant = R.sumBy(shadowQuantMods, (m) => m.value);
  return config.numShadowHits ?? shadowQuant;
};

const calculateMercuryPts = (
  mods: Mod[],
  loadout: Loadout,
): number | undefined => {
  if (!isHero("Lightbringer Rosa: Unsullied Blade (#2)", loadout)) {
    return undefined;
  }
  const mercuryPtMods = filterMod(mods, "MaxMercuryPtsPct");
  const mult = calculateEffMultiplier(mercuryPtMods);
  return 100 * mult;
};

interface EnemyRes {
  cold: number;
  lightning: number;
  fire: number;
  erosion: number;
}

const calculateEnemyRes = (mods: Mod[], config: Configuration): EnemyRes => {
  // enemyRes is stored as whole percentage (50 for 50%)
  const res = config.enemyRes ?? 50;
  const enemyResMods = filterMod(mods, "EnemyRes");
  const sumEnemyResMods = (resTypes: ResType[]) => {
    return sumByValue(enemyResMods.filter((m) => resTypes.includes(m.resType)));
  };
  return {
    cold: res + sumEnemyResMods(["cold", "elemental"]),
    lightning: res + sumEnemyResMods(["lightning", "elemental"]),
    fire: res + sumEnemyResMods(["fire", "elemental"]),
    erosion: res + sumEnemyResMods(["erosion"]),
  };
};

const calculateEnemyArmor = (config: Configuration): number => {
  // default to max possible enemy armor, equivalent to 50% dmg reduction
  return config.enemyArmor ?? 27273;
};

// decimal percentages representing how much to reduce dmg by
// e.g. .7 reduction means that a hit will do 30% of its original value
interface ArmorDmgMitigation {
  physical: number;
  nonPhysical: number;
}

const calculateEnemyArmorDmgMitigation = (
  armor: number,
): ArmorDmgMitigation => {
  const physical = armor / (0.9 * armor + 30000);
  const nonPhysical = physical * 0.6;
  return { physical, nonPhysical };
};

const resolveBuffSkillEffMults = (
  unresolvedModsFromParam: Mod[],
  loadout: Loadout,
  config: Configuration,
  derivedCtx: DerivedCtx,
): { skillEffMult: number; auraEffMult: number; curseEffMult: number } => {
  const buffSkillEffMods = unresolvedModsFromParam.filter(
    (m) =>
      m.type === "AuraEffPct" ||
      m.type === "SkillEffPct" ||
      m.type === "CurseEffPct",
  );
  const prenormMods = filterModsByCondThreshold(
    filterModsByCond(buffSkillEffMods, loadout, config, derivedCtx),
    config,
  );

  const mods = filterOutPerMods(prenormMods);
  const skillUse = 3;
  mods.push(...normalizeStackables(prenormMods, "skill_use", skillUse));

  const skillChargesOnUse = 2;
  mods.push(
    ...normalizeStackables(
      prenormMods,
      "skill_charges_on_use",
      skillChargesOnUse,
    ),
  );

  const crueltyBuffStacks = config.crueltyBuffStacks ?? 40;
  mods.push(
    ...normalizeStackables(prenormMods, "cruelty_buff", crueltyBuffStacks),
  );

  const skillEffMods = filterMod(mods, "SkillEffPct");
  const skillEffMult = calculateEffMultiplier(skillEffMods);
  const allAuraEffMods = filterMod(mods, "AuraEffPct");
  const auraEffMult = calculateEffMultiplier(allAuraEffMods);
  const curseEffMult = calculateEffMultiplier(filterMod(mods, "CurseEffPct"));

  return { skillEffMult, auraEffMult, curseEffMult };
};

const calcNumFocus = (maxFocus: number, config: Configuration): number => {
  if (config.focusBlessings !== undefined) {
    return config.focusBlessings;
  }
  return maxFocus;
};

const calcNumAgility = (maxAgility: number, config: Configuration): number => {
  if (config.agilityBlessings !== undefined) {
    return config.agilityBlessings;
  }
  return maxAgility;
};

const calcMaxBlessings = (
  mods: Mod[],
  blessingType: "focus" | "agility" | "tenacity",
  derivedCtx: DerivedCtx,
): number => {
  const blessingToModType = {
    focus: "MaxFocusBlessing",
    agility: "MaxAgilityBlessing",
    tenacity: "MaxTenacityBlessing",
  } as const;
  const modType = blessingToModType[blessingType];
  const additionalMaxBlessings = sumByValue(filterMod(mods, modType));
  if (derivedCtx.hasBlasphemer) {
    return Math.max(4 - additionalMaxBlessings, 0);
  } else {
    return 4 + additionalMaxBlessings;
  }
};

const calcNumTenacity = (
  maxTenacity: number,
  config: Configuration,
): number => {
  if (config.tenacityBlessings !== undefined) {
    return config.tenacityBlessings;
  }
  return maxTenacity;
};

const calcDesecration = (
  mods: Mod[],
  derivedCtx: DerivedCtx,
): number | undefined => {
  if (!derivedCtx.hasBlasphemer) {
    return undefined;
  }
  const addedFocus = sumByValue(filterMod(mods, "MaxFocusBlessing"));
  const addedAgility = sumByValue(filterMod(mods, "MaxAgilityBlessing"));
  const addedTenacity = sumByValue(filterMod(mods, "MaxTenacityBlessing"));
  return (
    3 +
    Math.min(addedFocus, 4) +
    Math.min(addedAgility, 4) +
    Math.min(addedTenacity, 4)
  );
};

const calcAfflictionPts = (config: Configuration): number => {
  return config.afflictionPts ?? 100;
};

const calculateAffliction = (mods: Mod[], config: Configuration): Mod[] => {
  if (config.enemyHasAffliction !== true) {
    return [];
  }
  const afflictionPts = calcAfflictionPts(config);
  const afflictionEffMult = calculateEffMultiplier(
    filterMod(mods, "AfflictionEffectPct"),
  );
  const afflictionValue = afflictionPts * afflictionEffMult;
  return [
    {
      type: "DmgPct",
      value: afflictionValue,
      dmgModType: "damage_over_time",
      addn: true,
      isEnemyDebuff: true,
      src: "Additional Damage over Time from Affliction",
    },
  ];
};

const calculateTorment = (config: Configuration): Mod[] => {
  const tormentMod: Mod = {
    type: "DmgPct",
    value: 5,
    dmgModType: "damage_over_time",
    addn: true,
    per: { stackable: "torment", limit: 3 },
    src: "Additional Damage over Time from Torment (5% per stack)",
  };
  return normalizeStackables([tormentMod], "torment", config.tormentStacks);
};

const calculateAddedSkillLevels = (
  loadoutMods: Mod[],
  skill: BaseSkill,
  loadout: Loadout,
  config: Configuration,
  derivedCtx: DerivedCtx,
): number => {
  const prenormMods = filterModsByCondThreshold(
    filterModsByCond(loadoutMods, loadout, config, derivedCtx),
    config,
  );
  const mods = filterOutPerMods(prenormMods);

  const sealedLifePct = config.sealedLifePct ?? 0;
  mods.push(
    ...normalizeStackables(prenormMods, "sealed_life_pct", sealedLifePct),
  );

  let addedSkillLevels = 0;
  for (const mod of filterMod(mods, "SkillLevel")) {
    const matches = match(mod.skillLevelType)
      .with(
        "main",
        () => skill.name === loadout.skillPage.activeSkills[1]?.skillName,
      )
      .with("support", () => skill.type === "Support")
      .with("active", () => skill.type === "Active")
      .with("persistent", () => skill.tags.includes("Persistent"))
      .with("erosion", () => skill.tags.includes("Erosion"))
      .with("spell", () => skill.tags.includes("Spell"))
      .with("all", () => true)
      .exhaustive();
    if (matches) {
      addedSkillLevels += mod.value;
    }
  }
  return Math.round(addedSkillLevels);
};

/**
 * every level from 21-30 is +10% additional damage, stacking multiplicately
 * every level from 31+ is +8% additional damage, stacking multiplicatively
 */
const calculateSkillLevelDmgMods = (
  skillLevel: number,
): ModOfType<"DmgPct">[] => {
  if (skillLevel <= 20) {
    return [];
  }

  const a = 1.1 ** Math.min(10, skillLevel - 20);
  if (skillLevel <= 30) {
    return [
      {
        type: "DmgPct",
        value: (a - 1) * 100,
        addn: true,
        dmgModType: "global",
      },
    ];
  }

  const b = 1.08 ** (skillLevel - 30);
  return [
    {
      type: "DmgPct",
      value: (a - 1) * 100,
      addn: true,
      dmgModType: "global",
      src: "Added skill levels (21-30)",
    },
    {
      type: "DmgPct",
      value: (b - 1) * 100,
      addn: true,
      dmgModType: "global",
      src: "Added skill levels (30+)",
    },
  ];
};

// resolves mods, replacing core talents, removing unmatched conditions,
//   and normalizing per mods
const resolveModsForOffenseSkill = (
  prenormModsFromParam: Mod[],
  skill: BaseActiveSkill | BasePassiveSkill,
  skillLevel: number,
  resourcePool: ResourcePool,
  defenses: Defenses,
  loadout: Loadout,
  config: Configuration,
  derivedCtx: DerivedCtx,
): Mod[] => {
  const {
    stats,
    maxMana,
    mercuryPts,
    focusBlessings,
    agilityBlessings,
    tenacityBlessings,
    additionalMaxChanneledStacks,
    desecration,
  } = resourcePool;
  const prenormMods = filterModsByCondThreshold(
    filterModsByCond(prenormModsFromParam, loadout, config, derivedCtx),
    config,
  );
  const mods = [
    ...filterOutPerMods(prenormMods),
    ...calculateSkillLevelDmgMods(skillLevel),
  ];

  mods.push(...normalizeStackables(prenormMods, "level", config.level));

  const totalMainStats = calculateTotalMainStats(skill, stats);
  mods.push(...normalizeStackables(prenormMods, "main_stat", totalMainStats));

  mods.push(
    ...normalizeStackables(
      prenormMods,
      "movement_speed_bonus_pct",
      defenses.movementSpeedBonusPct,
    ),
  );

  mods.push(
    ...normalizeStackables(
      prenormMods,
      "additional_max_channel_stack",
      additionalMaxChanneledStacks,
    ),
  );

  const maxChannelStacks =
    (findMod(mods, "InitialMaxChannel")?.value ?? 0) +
    additionalMaxChanneledStacks;
  const mcMaxLinks = maxChannelStacks;
  const mcLinks = config.numMindControlLinksUsed ?? mcMaxLinks;
  mods.push(...normalizeStackables(prenormMods, "mind_control_link", mcLinks));
  mods.push(
    ...normalizeStackables(
      prenormMods,
      "unused_mind_control_link",
      mcMaxLinks - mcLinks,
    ),
  );

  mods.push(...calculateTorment(config));
  mods.push(...calculateAffliction(mods, config));

  const repentanceStacks = 4 + sumByValue(filterMod(mods, "MaxRepentance"));
  mods.push(
    ...normalizeStackables(prenormMods, "repentance", repentanceStacks),
  );

  mods.push(
    ...normalizeStackables(prenormMods, "focus_blessing", focusBlessings),
  );

  mods.push(
    ...normalizeStackables(prenormMods, "agility_blessing", agilityBlessings),
  );

  mods.push(
    ...normalizeStackables(prenormMods, "tenacity_blessing", tenacityBlessings),
  );

  mods.push(
    ...normalizeStackables(prenormMods, "desecration", desecration ?? 0),
  );

  const willpowerStacks = calculateWillpower(prenormMods);
  mods.push(...normalizeStackables(prenormMods, "willpower", willpowerStacks));

  const frostbitten = calculateEnemyFrostbitten(config);
  mods.push(
    ...normalizeStackables(prenormMods, "frostbite_rating", frostbitten.points),
  );

  // Note: BaseProjectileQuant is NOT counted toward "projectile" stackable
  const maxProjectiles = findMod(mods, "MaxProjectile")?.value;
  const projectiles = Math.trunc(
    Math.min(
      sumByValue(filterMod(mods, "Projectile")),
      maxProjectiles ?? Infinity,
    ),
  );
  mods.push(...normalizeStackables(prenormMods, "projectile", projectiles));

  if (resourcePool.hasFervor) {
    mods.push(calculateFervorCritRateMod(mods, resourcePool));
    mods.push(
      ...normalizeStackables(prenormMods, "fervor", resourcePool.fervorPts),
    );
  }

  if (skill.tags.includes("Shadow Strike")) {
    const numShadowHits = calculateNumShadowHits(mods, config);
    const dmgFromShadowMod = calculateAddnDmgFromShadows(numShadowHits);
    if (dmgFromShadowMod !== undefined) {
      const shadowDmgPctMods = filterMod(mods, "ShadowDmgPct");
      const shadowDmgMult = calculateEffMultiplier(shadowDmgPctMods);
      mods.push({
        ...multModValue(dmgFromShadowMod, shadowDmgMult),
        per: undefined,
      });
    }
  }

  mods.push(...normalizeStackables(prenormMods, "max_mana", maxMana));
  if (mercuryPts !== undefined) {
    mods.push(...normalizeStackables(prenormMods, "mercury_pt", mercuryPts));
  }

  const manaConsumedRecently = config.manaConsumedRecently ?? 0;
  mods.push(
    ...normalizeStackables(
      prenormMods,
      "mana_consumed_recently",
      manaConsumedRecently,
    ),
  );

  const unsealedManaPct = 100 - (config.sealedManaPct ?? 0);
  mods.push(
    ...normalizeStackables(prenormMods, "unsealed_mana_pct", unsealedManaPct),
  );

  const unsealedLifePct = 100 - (config.sealedLifePct ?? 0);
  mods.push(
    ...normalizeStackables(prenormMods, "unsealed_life_pct", unsealedLifePct),
  );

  const numEnemiesAffectedByWarcry = config.numEnemiesAffectedByWarcry;
  mods.push(
    ...normalizeStackables(
      prenormMods,
      "num_enemies_affected_by_warcry",
      numEnemiesAffectedByWarcry,
    ),
  );

  return mods;
};

export interface ResourcePool {
  stats: Stats;
  maxLife: number;
  maxMana: number;
  mercuryPts?: number;
  focusBlessings: number;
  maxFocusBlessings: number;
  agilityBlessings: number;
  maxAgilityBlessings: number;
  tenacityBlessings: number;
  maxTenacityBlessings: number;
  desecration?: number;
  additionalMaxChanneledStacks: number;
  hasFervor: boolean;
  fervorPts: number;
}

const calculateResourcePool = (
  paramMods: Mod[],
  loadout: Loadout,
  config: Configuration,
  derivedCtx: DerivedCtx,
): ResourcePool => {
  // potential perf issue: this is a duplicate filtering, since it also
  //   happens in calculateOffense with a slightly larger superset.
  //   maybe we should factor it out if performance becomes an issue
  const prenormMods = filterModsByCond(paramMods, loadout, config, derivedCtx);
  const mods = filterOutPerMods(prenormMods);

  mods.push(...normalizeStackables(prenormMods, "level", config.level));

  const stats = calculateStats(mods);

  mods.push(...normalizeStackables(prenormMods, "str", stats.str));
  mods.push(...normalizeStackables(prenormMods, "dex", stats.dex));
  mods.push(...normalizeStackables(prenormMods, "int", stats.int));

  const maxLifeFromMods = sumByValue(filterMod(mods, "MaxLife"));
  const maxLifeMult = calculateEffMultiplier(filterMod(mods, "MaxLifePct"));
  const maxLife = (50 + config.level * 13 + maxLifeFromMods) * maxLifeMult;

  const maxManaFromMods = sumByValue(filterMod(mods, "MaxMana"));
  const maxManaMult = calculateEffMultiplier(filterMod(mods, "MaxManaPct"));
  const maxMana = (40 + config.level * 5 + maxManaFromMods) * maxManaMult;

  mods.push(...normalizeStackables(prenormMods, "max_mana", maxMana));

  const mercuryPts = calculateMercuryPts(mods, loadout);
  if (mercuryPts !== undefined) {
    mods.push(...normalizeStackables(prenormMods, "mercury_pt", mercuryPts));
  }

  const maxFocusBlessings = calcMaxBlessings(mods, "focus", derivedCtx);
  const focusBlessings = calcNumFocus(maxFocusBlessings, config);
  const maxAgilityBlessings = calcMaxBlessings(mods, "agility", derivedCtx);
  const agilityBlessings = calcNumAgility(maxAgilityBlessings, config);
  const maxTenacityBlessings = calcMaxBlessings(mods, "tenacity", derivedCtx);
  const tenacityBlessings = calcNumTenacity(maxTenacityBlessings, config);
  const desecration = calcDesecration(mods, derivedCtx);

  const additionalMaxChanneledStacks = Math.round(
    sumByValue(filterMod(mods, "MaxChannel")),
  );

  const haveFervor = findMod(mods, "HaveFervor") !== undefined;
  const hasFervor = config.fervorEnabled || haveFervor;
  const fixedFervorPts = findMod(mods, "FixedFervorPts");
  const fervorPts = fixedFervorPts?.value ?? config.fervorPoints ?? 100;

  return {
    stats,
    maxLife,
    maxMana,
    mercuryPts,
    maxFocusBlessings,
    focusBlessings,
    maxAgilityBlessings,
    agilityBlessings,
    maxTenacityBlessings,
    tenacityBlessings,
    desecration,
    additionalMaxChanneledStacks,
    hasFervor,
    fervorPts,
  };
};

export interface Resistance {
  max: number;
  potential: number;
  actual: number;
}

export interface Defenses {
  coldRes: Resistance;
  lightningRes: Resistance;
  fireRes: Resistance;
  erosionRes: Resistance;
  // TODO: this needs to be moved into offense summary instead, since some main
  //   skills like mind control lower your movement speed
  movementSpeedBonusPct: number;
}

export const calculateDefenses = (
  paramMods: Mod[],
  loadout: Loadout,
  config: Configuration,
  derivedCtx: DerivedCtx,
): Defenses => {
  const prenormMods = filterModsByCondThreshold(
    filterModsByCond(paramMods, loadout, config, derivedCtx),
    config,
  );
  const mods = filterOutPerMods(prenormMods);

  const maxResMods = filterMod(mods, "MaxResistancePct");
  const resMods = filterMod(mods, "ResistancePct");

  type ResMod = ModOfType<"MaxResistancePct"> | ModOfType<"ResistancePct">;
  const sumResMods = <T extends ResMod>(
    mods: T[],
    resTypes: ResType[],
  ): number => {
    return sumByValue(mods.filter((m) => resTypes.includes(m.resType)));
  };

  const calcRes = (resTypes: ResType[]): Resistance => {
    const max = Math.min(90, 60 + sumResMods(maxResMods, resTypes));
    const potential = sumResMods(resMods, resTypes);
    const actual = Math.min(max, potential);
    return { max, potential, actual };
  };

  const movementSpeedBonusPct =
    (calculateEffMultiplier(filterMod(mods, "MovementSpeedPct")) - 1) * 100;

  return {
    coldRes: calcRes(["cold", "elemental"]),
    lightningRes: calcRes(["lightning", "elemental"]),
    fireRes: calcRes(["fire", "elemental"]),
    erosionRes: calcRes(["erosion"]),
    movementSpeedBonusPct,
  };
};

export interface PersistentDpsSummary {
  base: Record<DmgChunkType, number>;
  total: number;
  duration: number;
}

interface CalcAvgPersistentDpsInput {
  mods: Mod[];
  loadout: Loadout;
  perSkillContext: PerSkillModContext;
  skillLevel: number;
  config: Configuration;
}

const calcAvgPersistentDps = (
  input: CalcAvgPersistentDpsInput,
): PersistentDpsSummary | undefined => {
  const { mods, perSkillContext, skillLevel, config } = input;
  const skill = perSkillContext.skill as BaseActiveSkill;
  const offense: SkillOffenseOfType<"PersistentDmg"> | undefined = match(
    skill.name,
  )
    .with("[Test] Simple Persistent Spell", () => {
      return getLevelOffense(skill, "PersistentDmg", skillLevel);
    })
    .with("Mind Control", () => {
      return getLevelOffense(skill, "PersistentDmg", skillLevel);
    })
    .otherwise(() => {
      return undefined;
    });
  if (offense === undefined) return;

  const baseDmg: NumDmgValues = { [offense.dmgType]: offense.value };
  const baseDmgModTypes: DmgModType[] = dmgModTypesForSkill(skill);

  const dmgPools = convertDmg(baseDmg, mods);
  const dmgValues = applyDmgBonusesAndPen({
    dmgPools,
    mods,
    baseDmgModTypes,
    config,
    ignoreArmor: true,
  });

  const physical = dmgValues.physical ?? 0;
  const cold = dmgValues.cold ?? 0;
  const lightning = dmgValues.lightning ?? 0;
  const fire = dmgValues.fire ?? 0;
  const erosion = dmgValues.erosion ?? 0;
  const total = physical + cold + lightning + fire + erosion;

  const duration =
    offense.duration *
    calculateEffMultiplier(filterMod(mods, "SkillEffDurationPct"));

  return {
    base: { physical, cold, lightning, fire, erosion },
    total,
    duration,
  };
};

const calcReapsPerSecond = (cooldown: number) => {
  const roundedCooldown = Math.ceil(cooldown * 30) / 30;
  return 1 / roundedCooldown;
};

export interface ReapDpsSummary {
  rawCooldown: number;
  duration: number;
  reapsPerSecond: number;
  dmgPerReap: number;
  reapDps: number;
}

export interface TotalReapDpsSummary {
  reaps: ReapDpsSummary[];
  totalReapDps: number;
  reapDurationBonus: number;
  reapCdrBonus: number;
}

const calcTotalReapDps = (
  mods: Mod[],
  persistentDpsSummary: PersistentDpsSummary,
): TotalReapDpsSummary | undefined => {
  const dotDuration = persistentDpsSummary.duration;
  const dotDps = persistentDpsSummary.total;
  const reapDurationMult = calculateEffMultiplier(
    filterMod(mods, "ReapDurationPct"),
  );
  const reapCdrMult = calculateEffMultiplier(filterMod(mods, "ReapCdrPct"));
  const reapPurificationPct =
    sumByValue(filterMod(mods, "ReapPurificationPct")) / 100;
  const reaps = filterMod(mods, "Reap").map((m) => {
    const duration = Math.min(m.duration * reapDurationMult, dotDuration);
    const rawCooldown = m.cooldown / reapCdrMult;
    const reapsPerSecond = calcReapsPerSecond(rawCooldown);
    // Base reap damage from reaped duration
    const baseReapDmg = dotDps * duration;
    // Purification adds a portion of remaining DOT damage
    const remainingDotDuration = dotDuration - duration;
    const purificationDmg = remainingDotDuration * dotDps * reapPurificationPct;
    const dmgPerReap = baseReapDmg + purificationDmg;
    const reapDps = dmgPerReap * reapsPerSecond;
    return {
      rawCooldown,
      duration,
      reapsPerSecond,
      dmgPerReap,
      reapDps,
    };
  });
  if (reaps.length === 0) {
    return undefined;
  }
  const totalReapDps = R.sumBy(reaps, (r) => r.reapDps);
  return {
    reaps,
    reapDurationBonus: reapDurationMult - 1,
    reapCdrBonus: reapCdrMult - 1,
    totalReapDps,
  };
};

const calcAvgAttackDps = (
  mods: Mod[],
  loadout: Loadout,
  perSkillContext: PerSkillModContext,
  skillLevel: number,
  config: Configuration,
): OffenseAttackDpsSummary | undefined => {
  const gearDmg = calculateGearDmg(loadout, mods);
  const flatDmg = calculateFlatDmg(mods, "attack");
  const skillHit = calculateAtkHit(
    gearDmg,
    flatDmg,
    mods,
    perSkillContext.skill,
    skillLevel,
    config,
  );
  if (skillHit === undefined) return;

  const aspd = calculateAspd(loadout, mods);
  const critChance = calculateCritChance(mods);
  const critDmgMult = calculateCritDmg(mods);
  const doubleDmgMult = calculateDoubleDmgMult(mods);
  const extraMult = calculateExtraOffenseMults(mods, config);

  const avgHitWithCrit =
    skillHit.avg * critChance * critDmgMult + skillHit.avg * (1 - critChance);
  const avgDps = avgHitWithCrit * doubleDmgMult * aspd * extraMult;
  return {
    critChance,
    critDmgMult,
    aspd,
    avgHit: skillHit.avg,
    avgHitWithCrit,
    avgDps,
  };
};

export interface OffenseSpellDpsSummary {
  critChange: number;
  critDmgMult: number;
  castsPerSec: number;
  avgHitWithCrit: number;
  avgDps: number;
}

const _calcAvgSpellDps = (): OffenseSpellDpsSummary | undefined => {
  return undefined;
};

// Calculates offense for all enabled implemented skills
export const calculateOffense = (input: OffenseInput): OffenseResults => {
  const { loadout, configuration: config } = input;
  const loadoutMods = [
    ...resolveCoreTalentMods(collectMods(loadout)),
    ...calculateHeroTraitMods(loadout),
  ];

  const derivedCtx = resolveDerivedCtx(loadoutMods);
  const resourcePool = calculateResourcePool(
    loadoutMods,
    loadout,
    config,
    derivedCtx,
  );

  const unresolvedLoadoutAndBuffMods = [
    ...loadoutMods,
    ...calculateImplicitMods(),
    ...resolveBuffSkillMods(loadout, loadoutMods, config, derivedCtx),
  ];

  const defenses = calculateDefenses(
    unresolvedLoadoutAndBuffMods,
    loadout,
    config,
    derivedCtx,
  );

  const skillSlots = listActiveSkillSlots(loadout);
  const enabledSlots = skillSlots.filter(
    (s) => s.enabled && s.skillName !== undefined,
  );

  //  Calculate for each implemented skill
  const skills: OffenseResults["skills"] = {};
  for (const slot of enabledSlots) {
    const perSkillContext = resolvePerSkillMods(
      slot,
      loadoutMods,
      loadout,
      config,
      derivedCtx,
    );
    if (perSkillContext === undefined) {
      continue; // Skip non-implemented skills
    }
    const skillLevel =
      (slot.level || 20) +
      calculateAddedSkillLevels(
        loadoutMods,
        perSkillContext.skill,
        loadout,
        config,
        derivedCtx,
      );

    const mods = resolveModsForOffenseSkill(
      [...unresolvedLoadoutAndBuffMods, ...perSkillContext.mods],
      perSkillContext.skill,
      skillLevel,
      resourcePool,
      defenses,
      loadout,
      config,
      derivedCtx,
    );

    const attackHitSummary = calcAvgAttackDps(
      mods,
      loadout,
      perSkillContext,
      skillLevel,
      config,
    );

    const persistentDpsSummary = calcAvgPersistentDps({
      mods,
      loadout,
      perSkillContext,
      skillLevel,
      config,
    });

    const totalReapDpsSummary =
      persistentDpsSummary !== undefined
        ? calcTotalReapDps(mods, persistentDpsSummary)
        : undefined;

    const totalDps =
      (attackHitSummary?.avgDps ?? 0) +
      (persistentDpsSummary?.total ?? 0) +
      (totalReapDpsSummary?.totalReapDps ?? 0);

    skills[slot.skillName as ImplementedActiveSkillName] = {
      attackDpsSummary: attackHitSummary,
      persistentDpsSummary,
      totalReapDpsSummary,
      totalDps,
      resolvedMods: mods,
    };
  }

  return { skills, resourcePool, defenses };
};
