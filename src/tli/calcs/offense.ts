import * as R from "remeda";
import { match, P } from "ts-pattern";
import {
  type ActiveSkillName,
  ActiveSkills,
  type BaseActiveSkill,
  type BasePassiveSkill,
  type BaseSupportSkill,
  type ImplementedActiveSkillName,
  type PassiveSkillName,
  PassiveSkills,
  type SkillOffenseType,
  type SkillTag,
  SupportSkills,
} from "../../data/skill";
import type { DmgModType } from "../constants";
import {
  type Affix,
  type Configuration,
  type DmgRange,
  getAllAffixes,
  getTalentAffixes,
  type Loadout,
  type SkillSlot,
  type SupportSkillSlot,
} from "../core";
import type { DmgChunkType, Mod } from "../mod";
import type { OffenseSkillName } from "./skill_confs";

const addDR = (dr1: DmgRange, dr2: DmgRange): DmgRange => {
  return {
    min: dr1.min + dr2.min,
    max: dr1.max + dr2.max,
  };
};

const addDRs = (drs1: DmgRanges, drs2: DmgRanges): DmgRanges => {
  return {
    phys: addDR(drs1.phys, drs2.phys),
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
    phys: multDR(drs.phys, multiplier),
    cold: multDR(drs.cold, multiplier),
    lightning: multDR(drs.lightning, multiplier),
    fire: multDR(drs.fire, multiplier),
    erosion: multDR(drs.erosion, multiplier),
  };
};

const emptyDamageRange = (): DmgRange => {
  return { min: 0, max: 0 };
};

const calculateInc = (bonuses: number[]) => {
  return R.pipe(bonuses, R.sum());
};

const calculateAddn = (bonuses: number[]) => {
  return R.pipe(
    bonuses,
    R.reduce((b1, b2) => b1 * (1 + b2), 1),
  );
};

const collectModsFromAffixes = (affixes: Affix[]): Mod[] => {
  return affixes.flatMap((a) => a.affixLines.flatMap((l) => l.mods ?? []));
};

const getGearAffixes = (
  gear: Loadout["gearPage"]["equippedGear"][keyof Loadout["gearPage"]["equippedGear"]],
): Affix[] => {
  return gear ? getAllAffixes(gear) : [];
};

export const collectMods = (loadout: Loadout): Mod[] => {
  return [
    // todo: handle divinity slates
    // todo: handle pactspirits
    // todo: handle hero stuff
    ...collectModsFromAffixes(getTalentAffixes(loadout.talentPage)),
    ...collectModsFromAffixes(
      getGearAffixes(loadout.gearPage.equippedGear.helmet),
    ),
    ...collectModsFromAffixes(
      getGearAffixes(loadout.gearPage.equippedGear.chest),
    ),
    ...collectModsFromAffixes(
      getGearAffixes(loadout.gearPage.equippedGear.neck),
    ),
    ...collectModsFromAffixes(
      getGearAffixes(loadout.gearPage.equippedGear.gloves),
    ),
    ...collectModsFromAffixes(
      getGearAffixes(loadout.gearPage.equippedGear.belt),
    ),
    ...collectModsFromAffixes(
      getGearAffixes(loadout.gearPage.equippedGear.boots),
    ),
    ...collectModsFromAffixes(
      getGearAffixes(loadout.gearPage.equippedGear.leftRing),
    ),
    ...collectModsFromAffixes(
      getGearAffixes(loadout.gearPage.equippedGear.rightRing),
    ),
    ...collectModsFromAffixes(
      getGearAffixes(loadout.gearPage.equippedGear.mainHand),
    ),
    ...collectModsFromAffixes(
      getGearAffixes(loadout.gearPage.equippedGear.offHand),
    ),
    ...collectModsFromAffixes(loadout.customConfiguration),
  ];
};

interface OffenseSummary {
  critChance: number;
  critDmgMult: number;
  aspd: number;
  avgHit: number;
  avgHitWithCrit: number;
  avgDps: number;
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

export interface DmgRanges {
  phys: DmgRange;
  cold: DmgRange;
  lightning: DmgRange;
  fire: DmgRange;
  erosion: DmgRange;
}

const emptyDmgRanges = (): DmgRanges => {
  return {
    phys: { min: 0, max: 0 },
    cold: { min: 0, max: 0 },
    lightning: { min: 0, max: 0 },
    fire: { min: 0, max: 0 },
    erosion: { min: 0, max: 0 },
  };
};

const findAffix = <T extends Mod["type"]>(
  mods: Mod[],
  type: T,
): Extract<Mod, { type: T }> | undefined => {
  return mods.find((a) => a.type === type) as
    | Extract<Mod, { type: T }>
    | undefined;
};

const filterAffix = <T extends Mod["type"]>(
  mods: Mod[],
  type: T,
): Extract<Mod, { type: T }>[] => {
  return mods.filter((a) => a.type === type) as Extract<Mod, { type: T }>[];
};

// A chunk of damage that tracks its conversion history
export interface DmgChunk {
  range: DmgRange;
  // Types this damage has been converted from (not including current pool type)
  history: DmgChunkType[];
}

// All damage organized by current type
export interface DmgPools {
  physical: DmgChunk[];
  cold: DmgChunk[];
  lightning: DmgChunk[];
  fire: DmgChunk[];
  erosion: DmgChunk[];
}

// Damage conversion order: Physical → Lightning → Cold → Fire → Erosion
// Damage can skip steps but never convert backwards
const CONVERSION_ORDER = ["physical", "lightning", "cold", "fire"] as const;

// see poewiki for a good rundown on damage conversion in poe, which works similarly as tli
// https://www.poewiki.net/wiki/Damage_conversion
// a brief summary would be that damage gets converted in a specific order, and converted damage
// remembers all the damage types through which it was converted for the purposes of applying
// damage bonuses
export const convertDmg = (dmgRanges: DmgRanges, allMods: Mod[]): DmgPools => {
  const pools: DmgPools = {
    physical: [],
    cold: [],
    lightning: [],
    fire: [],
    erosion: [],
  };

  // Initialize with non-zero original damage (empty history - not converted from anything)
  const addIfNonZero = (pool: DmgChunk[], range: DmgRange) => {
    if (range.min > 0 || range.max > 0) {
      pool.push({ range, history: [] });
    }
  };
  addIfNonZero(pools.physical, dmgRanges.phys);
  addIfNonZero(pools.lightning, dmgRanges.lightning);
  addIfNonZero(pools.cold, dmgRanges.cold);
  addIfNonZero(pools.fire, dmgRanges.fire);
  addIfNonZero(pools.erosion, dmgRanges.erosion);

  // Process each source type in conversion order
  for (const sourceType of CONVERSION_ORDER) {
    // Step 1: Process "Gain as Extra" mods (calculated BEFORE conversion)
    // This adds extra damage to target pools but does NOT remove from source
    const addsDmgAsMods = filterAffix(allMods, "AddsDmgAs").filter(
      (m) => m.from === sourceType,
    );
    for (const chunk of pools[sourceType]) {
      for (const mod of addsDmgAsMods) {
        pools[mod.to].push({
          range: multDR(chunk.range, mod.value),
          history: [...chunk.history, sourceType],
        });
      }
    }

    // Step 2: Process conversion mods (removes from source, adds to target)
    const convMods = filterAffix(allMods, "ConvertDmgPct").filter(
      (m) => m.from === sourceType,
    );
    if (convMods.length === 0) continue;

    const totalPct = R.sumBy(convMods, (m) => m.value);
    const proration = totalPct > 1 ? 1 / totalPct : 1;
    const unconvertedPct = Math.max(0, 1 - totalPct);

    const chunks = [...pools[sourceType]];
    pools[sourceType] = [];

    for (const chunk of chunks) {
      // Unconverted damage stays in source pool with same history
      if (unconvertedPct > 0) {
        pools[sourceType].push({
          range: multDR(chunk.range, unconvertedPct),
          history: chunk.history,
        });
      }

      // Converted damage goes to target pools with updated history
      for (const mod of convMods) {
        const convertPct = mod.value * proration;
        pools[mod.to].push({
          range: multDR(chunk.range, convertPct),
          history: [...chunk.history, sourceType],
        });
      }
    }
  }

  return pools;
};

// currently only calculating mainhand
const calculateGearDmg = (loadout: Loadout, allMods: Mod[]): GearDmg => {
  const mainhand = loadout.gearPage.equippedGear.mainHand;
  if (mainhand === undefined) {
    return emptyGearDmg();
  }
  const mainhandMods = collectModsFromAffixes(getAllAffixes(mainhand));
  const basePhysDmg = mainhand.baseStats?.baseStatLines.find(
    (l) => l.mod?.type === "FlatPhysDmg",
  )?.mod?.value;
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

  const gearPhysDmgPct = findAffix(mainhandMods, "GearPhysDmgPct");
  if (gearPhysDmgPct !== undefined) {
    physBonusPct += gearPhysDmgPct.value;
  }

  filterAffix(mainhandMods, "FlatGearDmg").forEach((a) => {
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
  filterAffix(allMods, "AddnMainHandDmgPct").forEach((a) => {
    addnMHDmgMult *= 1 + a.value;
  });

  phys = multDR(phys, 1 + physBonusPct);
  phys = multDR(phys, addnMHDmgMult);
  cold = multDR(cold, addnMHDmgMult);
  lightning = multDR(lightning, addnMHDmgMult);
  fire = multDR(fire, addnMHDmgMult);
  erosion = multDR(erosion, addnMHDmgMult);
  return {
    mainHand: {
      phys: phys,
      cold: cold,
      lightning: lightning,
      fire: fire,
      erosion: erosion,
    },
  };
};

const calculateFlatDmg = (
  allMods: Mod[],
  skillType: "attack" | "spell",
): DmgRanges => {
  if (skillType === "spell") throw new Error("Spells not implemented yet");

  let phys = emptyDamageRange();
  let cold = emptyDamageRange();
  let lightning = emptyDamageRange();
  let fire = emptyDamageRange();
  let erosion = emptyDamageRange();

  const affixes = R.concat(
    filterAffix(allMods, "FlatDmgToAtks"),
    filterAffix(allMods, "FlatDmgToAtksAndSpells"),
  );
  for (const a of affixes) {
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
    phys,
    cold,
    lightning,
    fire,
    erosion,
  };
};

const calculateGearAspd = (loadout: Loadout, allMods: Mod[]): number => {
  const baseAspd =
    loadout.gearPage.equippedGear.mainHand?.baseStats?.baseStatLines.find(
      (l) => l.mod?.type === "AttackSpeed",
    )?.mod?.value || 0;
  const gearAspdPctBonus = calculateInc(
    filterAffix(allMods, "GearAspdPct").map((b) => b.value),
  );
  return baseAspd * (1 + gearAspdPctBonus);
};

const calculateCritRating = (
  allMods: Mod[],
  configuration: Configuration,
): number => {
  const critRatingPctMods = filterAffix(allMods, "CritRatingPct");
  const mods = critRatingPctMods.map((a) => {
    return {
      type: "CritRatingPct",
      value: a.value,
      modType: a.modType,
      src: a.src,
    };
  });

  // Add fervor bonus if enabled
  if (configuration.fervor.enabled) {
    // Collect FervorEff modifiers and calculate total effectiveness
    const fervorEffMods = filterAffix(allMods, "FervorEff");
    const fervorEffTotal = calculateInc(fervorEffMods.map((a) => a.value));

    // Base fervor: 2% per point, modified by FervorEff
    // Example: 100 points * 0.02 * (1 + 0.5) = 3.0 (with 50% FervorEff)
    const fervorPerPoint = 0.02 * (1 + fervorEffTotal);
    const fervorBonus = configuration.fervor.points * fervorPerPoint;

    mods.push({
      type: "CritRatingPct",
      value: fervorBonus,
      modType: "global",
      src: "fervor",
    });
  }

  const inc = calculateInc(mods.map((v) => v.value));
  return 0.05 * (1 + inc);
};

const calculateCritDmg = (
  allMods: Mod[],
  configuration: Configuration,
): number => {
  const critDmgPctMods = filterAffix(allMods, "CritDmgPct");
  const mods = critDmgPctMods.map((a) => {
    return {
      type: "CritDmgPct",
      value: a.value,
      addn: a.addn,
      modType: a.modType,
      src: a.src,
    };
  });

  // Handle CritDmgPerFervor mods
  if (configuration.fervor.enabled) {
    const critDmgPerFervorMods = filterAffix(allMods, "CritDmgPerFervor");
    critDmgPerFervorMods.forEach((a) => {
      // Calculate bonus: value * fervor points
      // Example: 0.005 (0.5%) * 100 points = 0.5 (50% increased crit damage)
      const bonus = a.value * configuration.fervor.points;
      mods.push({
        type: "CritDmgPct",
        value: bonus,
        addn: false, // Treated as "increased" modifier
        modType: "global",
        src: a.src || "CritDmgPerFervor",
      });
    });
  }

  const inc = calculateInc(mods.filter((m) => !m.addn).map((v) => v.value));
  const addn = calculateAddn(mods.filter((m) => m.addn).map((v) => v.value));

  return 1.5 * (1 + inc) * addn;
};

const calculateAspd = (loadout: Loadout, allMods: Mod[]): number => {
  const gearAspd = calculateGearAspd(loadout, allMods);
  const aspdPctMods = R.concat(
    filterAffix(allMods, "AspdPct"),
    filterAffix(allMods, "AspdAndCspdPct"),
  );
  const inc = calculateInc(
    aspdPctMods.filter((m) => !m.addn).map((v) => v.value),
  );
  const addn = calculateAddn(
    aspdPctMods.filter((m) => m.addn).map((v) => v.value),
  );

  return gearAspd * (1 + inc) * addn;
};

const dmgModTypePerSkillTag: Partial<Record<SkillTag, DmgModType>> = {
  Attack: "attack",
  Spell: "spell",
  Melee: "melee",
  Area: "area",
};

const dmgModTypesForSkill = (skill: BaseActiveSkill) => {
  const dmgModTypes: DmgModType[] = ["global"];
  const tags = skill.tags;
  tags.forEach((t) => {
    const dmgModType = dmgModTypePerSkillTag[t];
    if (dmgModType !== undefined) {
      dmgModTypes.push(dmgModType);
    }
  });
  return dmgModTypes;
};

const filterDmgPctMods = (
  dmgPctMods: Extract<Mod, { type: "DmgPct" }>[],
  dmgModTypes: DmgModType[],
) => {
  return dmgPctMods.filter((p) => dmgModTypes.includes(p.modType));
};

const calculateDmgInc = (mods: Extract<Mod, { type: "DmgPct" }>[]) => {
  return calculateInc(mods.filter((m) => !m.addn).map((m) => m.value));
};

const calculateDmgAddn = (mods: Extract<Mod, { type: "DmgPct" }>[]) => {
  return calculateAddn(mods.filter((m) => m.addn).map((m) => m.value));
};

// Apply damage % bonuses to a single chunk, considering its conversion history
const calculateChunkDmg = (
  chunk: DmgChunk,
  currentType: DmgChunkType,
  allDmgPctMods: Extract<Mod, { type: "DmgPct" }>[],
  skill: BaseActiveSkill,
): DmgRange => {
  const baseDmgModTypes = dmgModTypesForSkill(skill);

  // Chunk benefits from bonuses for current type AND all types in its history
  const allApplicableTypes: DmgChunkType[] = [currentType, ...chunk.history];
  const dmgModTypes: DmgModType[] = [...baseDmgModTypes];

  for (const dmgType of allApplicableTypes) {
    dmgModTypes.push(dmgType);
    if (dmgType === "cold" || dmgType === "lightning" || dmgType === "fire") {
      dmgModTypes.push("elemental");
    }
  }

  const applicableMods = filterDmgPctMods(allDmgPctMods, dmgModTypes);

  const inc = calculateDmgInc(applicableMods);
  const addn = calculateDmgAddn(applicableMods);
  const mult = (1 + inc) * addn;

  return multDR(chunk.range, mult);
};

// Sum all chunks in a pool, applying bonuses to each based on its history
const calculatePoolTotal = (
  pool: DmgChunk[],
  poolType: DmgChunkType,
  allDmgPctMods: Extract<Mod, { type: "DmgPct" }>[],
  skill: BaseActiveSkill,
): DmgRange => {
  let total: DmgRange = { min: 0, max: 0 };
  for (const chunk of pool) {
    const chunkDmg = calculateChunkDmg(chunk, poolType, allDmgPctMods, skill);
    total = addDR(total, chunkDmg);
  }
  return total;
};

interface SkillHitOverview {
  // Damage ranges of a single skill hit, not including crit
  base: {
    phys: DmgRange;
    cold: DmgRange;
    lightning: DmgRange;
    fire: DmgRange;
    erosion: DmgRange;
    total: DmgRange;
  };
  // Average damage of a single skill hit, not including crit
  avg: number;
}

const getLeveOffenseValue = (
  skill: BaseActiveSkill,
  skillOffenseType: SkillOffenseType,
  level: number,
): number | DmgRange => {
  if (skill.levelOffense === undefined) {
    throw new Error(`Skill "${skill.name}" has no levelOffense data`);
  }
  const offense = skill.levelOffense.find(
    (o) => o.template.type === skillOffenseType,
  );
  if (offense === undefined) {
    throw new Error(
      `Skill "${skill.name}" has no ${skillOffenseType} in levelOffense`,
    );
  }
  return offense.levels[level];
};

const calculateSkillHit = (
  gearDmg: GearDmg,
  flatDmg: DmgRanges,
  allMods: Mod[],
  mainSkill: BaseActiveSkill,
  level: number,
): SkillHitOverview => {
  const skillWeaponDR = match(mainSkill.name)
    .with("Berserking Blade", () => {
      return multDRs(gearDmg.mainHand, 2.1);
    })
    .with("Frost Spike", () => {
      return multDRs(
        gearDmg.mainHand,
        getLeveOffenseValue(mainSkill, "WeaponAtkDmgPct", level) as number,
      );
    })
    .with("[Test] Simple Attack", () => {
      return gearDmg.mainHand;
    })
    .otherwise(() => {
      // either it's unimplemented, not an attack
      return emptyDmgRanges();
    });
  const skillFlatDR = multDRs(
    flatDmg,
    getLeveOffenseValue(mainSkill, "AddedDmgEffPct", level) as number,
  );
  const skillBaseDmg = addDRs(skillWeaponDR, skillFlatDR);

  // Damage conversion happens after flat damage, before % bonuses
  const dmgPools = convertDmg(skillBaseDmg, allMods);

  // Apply % bonuses to each pool, considering conversion history
  const allDmgPcts = filterAffix(allMods, "DmgPct");
  const phys = calculatePoolTotal(
    dmgPools.physical,
    "physical",
    allDmgPcts,
    mainSkill,
  );
  const cold = calculatePoolTotal(dmgPools.cold, "cold", allDmgPcts, mainSkill);
  const lightning = calculatePoolTotal(
    dmgPools.lightning,
    "lightning",
    allDmgPcts,
    mainSkill,
  );
  const fire = calculatePoolTotal(dmgPools.fire, "fire", allDmgPcts, mainSkill);
  const erosion = calculatePoolTotal(
    dmgPools.erosion,
    "erosion",
    allDmgPcts,
    mainSkill,
  );

  const total = {
    min: phys.min + cold.min + lightning.min + fire.min + erosion.min,
    max: phys.max + cold.max + lightning.max + fire.max + erosion.max,
  };
  const totalAvg = (total.min + total.max) / 2;

  return {
    base: {
      phys: phys,
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

export type OffenseResults = Partial<
  Record<ImplementedActiveSkillName, OffenseSummary>
>;

const multValue = <T extends number | DmgRange>(
  value: T,
  multiplier: number,
): T => {
  if (typeof value === "number") {
    return (value * multiplier) as T;
  } else {
    return multDR(value, multiplier) as T;
  }
};

const multModValue = <T extends Extract<Mod, { value: number | DmgRange }>>(
  mod: T,
  multiplier: number,
): T => {
  const newValue = match(mod.value)
    .with(P.number, (x) => x * multiplier)
    .otherwise((x) => multDR(x, multiplier));
  return { ...mod, value: newValue, per: undefined };
};

interface NormalizationContext {
  willpower: number;
  frostbiteRating: number;
  projectile: number;
  skillUse: number;
  skillChargesOnUse: number;
  mainStat: number;
  crueltyBuffStacks: number;
}

const normalizeMod = <T extends Mod>(
  mod: T,
  context: NormalizationContext,
  config: Configuration,
): T | undefined => {
  if ("cond" in mod && mod.cond !== undefined) {
    const conditionMatched = match(mod.cond)
      .with("enemy_frostbitten", () => config.enemyFrobitten.enabled)
      .exhaustive();
    if (!conditionMatched) {
      return undefined;
    }
  }

  if (!("per" in mod) || mod.per === undefined) {
    return mod;
  }

  const div = mod.per.amt || 1;
  const stacks = match(mod.per.stackable)
    .with("willpower", () => context.willpower)
    .with("frostbite_rating", () => context.frostbiteRating)
    .with("projectile", () => context.projectile)
    .with("skill_use", () => context.skillUse)
    .with("skill_charges_on_use", () => context.skillChargesOnUse)
    .with("main_stat", () => context.mainStat)
    .with("cruelty_buff", () => context.crueltyBuffStacks)
    .exhaustive();
  return multModValue(mod, stacks / div) as T;
};

// todo: very basic stat calculation, will definitely need to handle things like pct, per, and conditionals
const calculateStats = (
  mods: Mod[],
): { str: number; dex: number; int: number } => {
  const statMods = filterAffix(mods, "Stat");
  return {
    str: R.sumBy(
      statMods.filter((m) => m.statType === "str"),
      (m) => m.value,
    ),
    dex: R.sumBy(
      statMods.filter((m) => m.statType === "dex"),
      (m) => m.value,
    ),
    int: R.sumBy(
      statMods.filter((m) => m.statType === "int"),
      (m) => m.value,
    ),
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

// Normalizes a SkillEffPct mod by multiplying its value by the appropriate stack count
// based on the `per` property.
const normalizeSkillEffMod = (
  mod: Extract<Mod, { type: "SkillEffPct" }>,
  config: Configuration,
): Extract<Mod, { type: "SkillEffPct" }> | undefined => {
  // TODO: skillUse and skillChargesOnUse should come from actual skill slot configuration or user input
  // skill_use represents number of times the buff skill has been cast (Well-Fought Battle max = 3)
  // skill_charges_on_use represents charges consumed when using the skill (Mass Effect)
  const context: NormalizationContext = {
    willpower: 0,
    frostbiteRating: 0,
    projectile: 0,
    skillUse: 3,
    skillChargesOnUse: 2,
    mainStat: 0,
    crueltyBuffStacks: config.crueltyBuffStacks,
  };
  return normalizeMod(mod, context, config);
};

// Normalizes an AuraEffPct mod by multiplying its value by the appropriate stack count
const normalizeAuraEffMod = (
  mod: Extract<Mod, { type: "AuraEffPct" }>,
  config: Configuration,
): Extract<Mod, { type: "AuraEffPct" }> | undefined => {
  const context: NormalizationContext = {
    willpower: 0,
    frostbiteRating: 0,
    projectile: 0,
    skillUse: 0,
    skillChargesOnUse: 0,
    mainStat: 0,
    crueltyBuffStacks: config.crueltyBuffStacks,
  };
  return normalizeMod(mod, context, config);
};

// Checks if a mod has target: "own_skill_only" property
const hasOwnSkillOnlyTarget = (mod: Mod): boolean => {
  return "target" in mod && mod.target === "own_skill_only";
};

// resolves mods coming from skills that provide buffs (levelBuffMods)
// for example, "Bull's Rage" provides a buff that increases all melee damage
const resolveBuffSkillMods = (
  loadout: Loadout,
  config: Configuration,
): Mod[] => {
  const activeSkillSlots = listActiveSkillSlots(loadout);
  const passiveSkillSlots = listPassiveSkillSlots(loadout);
  const allSkillSlots = [...activeSkillSlots, ...passiveSkillSlots];
  const resolvedMods: Mod[] = [];

  for (const skillSlot of allSkillSlots) {
    if (!skillSlot.enabled) {
      continue;
    }

    const level = skillSlot.level || 20;
    const skill = findSkill(
      skillSlot.skillName as ActiveSkillName | PassiveSkillName,
    );
    const isAuraSkill =
      (skill.type === "Passive" && skill.tags?.includes("Aura")) ?? false;

    // Get support skill mods (includes SkillEffPct, AuraEffPct, etc.)
    const supportMods = resolveSelectedSkillSupportMods(skillSlot);

    // === Calculate SkillEffPct multiplier (from support skills) ===
    // todo: add area, cdr, duration, and other buff-skill modifiers
    const skillEffMods = supportMods
      .filter(
        (m): m is Extract<Mod, { type: "SkillEffPct" }> =>
          m.type === "SkillEffPct",
      )
      .map((m) => normalizeSkillEffMod(m, config))
      .filter((m) => m !== undefined);
    const incSkillEffMods = skillEffMods.filter(
      (m) => m.addn === undefined || m.addn === false,
    );
    const incSkillEff = calculateInc(incSkillEffMods.map((m) => m.value));
    const addnSkillEffMods = skillEffMods.filter((m) => m.addn === true);
    const addnSkillEff = calculateAddn(addnSkillEffMods.map((m) => m.value));
    const skillEffMult = (1 + incSkillEff) * addnSkillEff;

    // === Resolve raw buff mods from skill's levelBuffMods ===
    const rawBuffMods: Mod[] =
      skill.levelBuffMods?.map((m) => {
        return {
          ...m.template,
          value: m.levels[level],
          src: `${isAuraSkill ? "Aura" : "Buff"}: ${skill.name} Lv.${level}`,
        } as Mod;
      }) || [];

    // === Calculate AuraEffPct multiplier (from support skills + own levelBuffMods) ===
    // Only applies if this is an Aura skill
    let auraEffMult = 1;
    if (isAuraSkill) {
      // Collect AuraEffPct from support skills
      const supportAuraEffMods = supportMods.filter(
        (m): m is Extract<Mod, { type: "AuraEffPct" }> =>
          m.type === "AuraEffPct",
      );

      // Collect AuraEffPct from own levelBuffMods (own_skill_only ones)
      const ownAuraEffMods = rawBuffMods.filter(
        (m): m is Extract<Mod, { type: "AuraEffPct" }> =>
          m.type === "AuraEffPct" && hasOwnSkillOnlyTarget(m),
      );

      // Combine and normalize all AuraEffPct mods
      const allAuraEffMods = [...supportAuraEffMods, ...ownAuraEffMods]
        .map((m) => normalizeAuraEffMod(m, config))
        .filter((m) => m !== undefined);

      const incAuraEffMods = allAuraEffMods.filter(
        (m) => m.addn === undefined || m.addn === false,
      );
      const addnAuraEffMods = allAuraEffMods.filter((m) => m.addn === true);
      auraEffMult =
        (1 + calculateInc(incAuraEffMods.map((m) => m.value))) *
        calculateAddn(addnAuraEffMods.map((m) => m.value));
    }

    // === Apply multipliers and filter own_skill_only mods ===
    for (const mod of rawBuffMods) {
      // Skip mods with target: "own_skill_only" from shared output
      // (they were already used to calculate multipliers above)
      if (hasOwnSkillOnlyTarget(mod)) {
        continue;
      }

      // Skip mods without value property (like CoreTalent)
      if (!("value" in mod)) {
        resolvedMods.push(mod);
        continue;
      }

      // Calculate final value
      let finalValue = mod.value;
      if (!("unscalable" in mod && mod.unscalable === true)) {
        // Apply skill effect multiplier
        finalValue = multValue(finalValue, skillEffMult);
        // Apply aura effect multiplier (only for aura skills)
        if (isAuraSkill) {
          finalValue = multValue(finalValue, auraEffMult);
        }
      }

      resolvedMods.push({ ...mod, value: finalValue } as Mod);
    }
  }
  return resolvedMods;
};

const resolveMainSkillMods = (
  mainSkillName: OffenseSkillName,
  level: number,
): Mod[] => {
  const skill = findActiveSkill(mainSkillName);
  if (skill.levelMods === undefined) {
    return [];
  }
  const mods: Mod[] = [];
  for (const levelMod of skill.levelMods) {
    const value = levelMod.levels[level];
    mods.push({
      ...levelMod.template,
      value,
      src: `Selected Active Skill: ${skill.name} Lv.${level}`,
    } as Mod);
  }
  return mods;
};

const resolveSelectedSkillSupportMods = (slot: SkillSlot): Mod[] => {
  const supportSlots = Object.values(slot.supportSkills) as (
    | SupportSkillSlot
    | undefined
  )[];

  const supportMods: Mod[] = [];
  for (const ss of supportSlots) {
    if (ss === undefined) continue;
    const supportSkill = SupportSkills.find((s) => s.name === ss.name) as
      | BaseSupportSkill
      | undefined;
    if (supportSkill === undefined) continue;

    const level = ss.level || 20;
    for (const levelMods of supportSkill.levelMods || []) {
      const mod: Mod = {
        ...levelMods.template,
        value: levelMods.levels[level],
        src: `Support: ${supportSkill.name} Lv.${level}`,
      } as Mod;
      supportMods.push(mod);
    }
  }
  return supportMods;
};

// Context for mods that are shared across all skill calculations
interface SharedModContext {
  gearMods: Mod[];
  buffSkillMods: Mod[];
  stats: { str: number; dex: number; int: number };
  willpowerStacks: number;
}

// Resolves mods that are shared across all skill calculations
const resolveSharedMods = (
  loadout: Loadout,
  config: Configuration,
): SharedModContext => {
  const gearMods = collectMods(loadout);
  const buffSkillMods = resolveBuffSkillMods(loadout, config);
  const allMods = [...gearMods, ...buffSkillMods];
  const stats = calculateStats(allMods);
  const willpowerStacks = findAffix(allMods, "MaxWillpowerStacks")?.value || 0;
  return { gearMods, buffSkillMods, stats, willpowerStacks };
};

// Context for mods specific to a single skill
interface PerSkillModContext {
  mods: Mod[];
  skill: BaseActiveSkill;
  skillSlot: SkillSlot;
}

// Resolves mods specific to a single skill slot
// Returns undefined if the skill is not implemented (no levelOffense)
const resolvePerSkillMods = (
  skillSlot: SkillSlot,
): PerSkillModContext | undefined => {
  const skill = findActiveSkill(skillSlot.skillName as ActiveSkillName);

  // Skip non-implemented skills (those without levelOffense)
  if (!("levelOffense" in skill) || skill.levelOffense === undefined) {
    return undefined;
  }

  const level = skillSlot.level || 20;
  const mainSkillMods = resolveMainSkillMods(
    skillSlot.skillName as OffenseSkillName,
    level,
  );
  const supportMods = resolveSelectedSkillSupportMods(skillSlot);

  return {
    mods: [...mainSkillMods, ...supportMods],
    skill,
    skillSlot,
  };
};

// Normalizes mods for a specific skill, handling "per" properties
const normalizeModsForSkill = (
  sharedMods: Mod[],
  perSkillMods: Mod[],
  skill: BaseActiveSkill,
  sharedContext: SharedModContext,
  config: Configuration,
): Mod[] => {
  // Create stat-based damage mod
  const statBasedDmgMod: Mod = {
    type: "DmgPct",
    // .5% additional damage per main stat
    value: 0.005,
    modType: "global",
    addn: true,
    per: { stackable: "main_stat" },
    src: "Additional Damage from skill Main Stat (.5% per stat)",
  };

  const allMods = [...sharedMods, ...perSkillMods, statBasedDmgMod];

  // Calculate willpower stacks from ALL mods (including per-skill mods like Willpower support)
  const willpowerStacks =
    findAffix(allMods, "MaxWillpowerStacks")?.value ||
    sharedContext.willpowerStacks ||
    0;

  // Calculate main stat for the skill
  if (skill.mainStats === undefined) {
    throw new Error(`Skill "${skill.name}" has no mainStats defined`);
  }
  let mainStat = 0;
  for (const mainStatType of skill.mainStats) {
    mainStat += sharedContext.stats[mainStatType];
  }

  // TODO: figure these out
  const normContext: NormalizationContext = {
    willpower: willpowerStacks,
    frostbiteRating: 0,
    projectile: 0,
    skillUse: 0,
    skillChargesOnUse: 0,
    mainStat,
    crueltyBuffStacks: config.crueltyBuffStacks,
  };

  return allMods
    .map((mod) => normalizeMod(mod, normContext, config))
    .filter((mod) => mod !== undefined);
};

// Calculates offense for all enabled implemented skills
export const calculateOffense = (input: OffenseInput): OffenseResults => {
  const { loadout, configuration } = input;

  // Phase 1: Resolve shared mods once
  const sharedContext = resolveSharedMods(loadout, configuration);
  const sharedMods = [
    ...sharedContext.gearMods,
    ...sharedContext.buffSkillMods,
  ];

  // Phase 2: Get enabled skill slots
  const skillSlots = listActiveSkillSlots(loadout);
  const enabledSlots = skillSlots.filter((s) => s.enabled);

  // Phase 3: Calculate for each implemented skill
  const results: OffenseResults = {};
  for (const slot of enabledSlots) {
    const perSkillContext = resolvePerSkillMods(slot);
    if (perSkillContext === undefined) {
      continue; // Skip non-implemented skills
    }

    const mods = normalizeModsForSkill(
      sharedMods,
      perSkillContext.mods,
      perSkillContext.skill,
      sharedContext,
      configuration,
    );

    const gearDmg = calculateGearDmg(loadout, mods);
    const flatDmg = calculateFlatDmg(mods, "attack");

    const aspd = calculateAspd(loadout, mods);
    const critChance = calculateCritRating(mods, configuration);
    const critDmgMult = calculateCritDmg(mods, configuration);

    const skillHit = calculateSkillHit(
      gearDmg,
      flatDmg,
      mods,
      perSkillContext.skill,
      perSkillContext.skillSlot.level || 20,
    );
    const avgHitWithCrit =
      skillHit.avg * critChance * critDmgMult + skillHit.avg * (1 - critChance);
    const avgDps = avgHitWithCrit * aspd;

    results[slot.skillName as ImplementedActiveSkillName] = {
      critChance,
      critDmgMult,
      aspd,
      avgHit: skillHit.avg,
      avgHitWithCrit,
      avgDps,
      resolvedMods: mods,
    };
  }

  return results;
};
