import * as R from "remeda";
import { match } from "ts-pattern";
import type { DmgModType } from "./constants";
import {
  type Affix,
  type Configuration,
  type DmgRange,
  getAllAffixes,
  getTalentAffixes,
  type Loadout,
} from "./core";
import type * as Mod from "./mod";
import {
  offensiveSkillConfs,
  type Skill,
  type SkillConfiguration,
  type SkillTag,
} from "./skill_confs";

export type Stat = "dex" | "int" | "str";

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

const collectModsFromAffixes = (affixes: Affix[]): Mod.Mod[] => {
  return affixes.flatMap((a) =>
    a.affixLines.map((l) => l.mod).filter((m) => m !== undefined),
  );
};

const getGearAffixes = (
  gear: Loadout["gearPage"]["equippedGear"][keyof Loadout["gearPage"]["equippedGear"]],
): Affix[] => {
  return gear ? getAllAffixes(gear) : [];
};

export const collectMods = (loadout: Loadout): Mod.Mod[] => {
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

const findAffix = <T extends Mod.Mod["type"]>(
  mods: Mod.Mod[],
  type: T,
): Extract<Mod.Mod, { type: T }> | undefined => {
  return mods.find((a) => a.type === type) as
    | Extract<Mod.Mod, { type: T }>
    | undefined;
};

const filterAffix = <T extends Mod.Mod["type"]>(
  mods: Mod.Mod[],
  type: T,
): Extract<Mod.Mod, { type: T }>[] => {
  return mods.filter((a) => a.type === type) as Extract<Mod.Mod, { type: T }>[];
};

// A chunk of damage that tracks its conversion history
export interface DmgChunk {
  range: DmgRange;
  // Types this damage has been converted from (not including current pool type)
  history: Mod.DmgType[];
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
export const convertDmg = (
  dmgRanges: DmgRanges,
  allMods: Mod.Mod[],
): DmgPools => {
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
const calculateGearDmg = (loadout: Loadout, allMods: Mod.Mod[]): GearDmg => {
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
  allMods: Mod.Mod[],
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

const calculateGearAspd = (loadout: Loadout, allMods: Mod.Mod[]): number => {
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
  allMods: Mod.Mod[],
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
  allMods: Mod.Mod[],
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

const calculateAspd = (loadout: Loadout, allMods: Mod.Mod[]): number => {
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
  Melee: "attack",
  Area: "attack",
};

const dmgModTypesForSkill = (conf: SkillConfiguration) => {
  const dmgModTypes: DmgModType[] = ["global"];
  conf.tags.forEach((t) => {
    const dmgModType = dmgModTypePerSkillTag[t];
    if (dmgModType !== undefined) {
      dmgModTypes.push(dmgModType);
    }
  });
  return dmgModTypes;
};

const filterDmgPctMods = (
  dmgPctMods: Extract<Mod.Mod, { type: "DmgPct" }>[],
  dmgModTypes: DmgModType[],
) => {
  return dmgPctMods.filter((p) => dmgModTypes.includes(p.modType));
};

interface DmgModsAggr {
  inc: number;
  addn: number;
}

interface TotalDmgModsPerType {
  phys: DmgModsAggr;
  cold: DmgModsAggr;
  lightning: DmgModsAggr;
  fire: DmgModsAggr;
  erosion: DmgModsAggr;
}

const calculateDmgInc = (mods: Extract<Mod.Mod, { type: "DmgPct" }>[]) => {
  return calculateInc(mods.filter((m) => !m.addn).map((m) => m.value));
};

const calculateDmgAddn = (mods: Extract<Mod.Mod, { type: "DmgPct" }>[]) => {
  return calculateAddn(mods.filter((m) => m.addn).map((m) => m.value));
};

const getTotalDmgModsPerType = (
  allDmgPctMods: Extract<Mod.Mod, { type: "DmgPct" }>[],
  skillConf: SkillConfiguration,
): TotalDmgModsPerType => {
  const dmgModTypes = dmgModTypesForSkill(skillConf);
  const dmgModTypesForPhys: DmgModType[] = [...dmgModTypes, "physical"];
  const dmgModTypesForCold: DmgModType[] = [
    ...dmgModTypes,
    "cold",
    "elemental",
  ];
  const dmgModTypesForLightning: DmgModType[] = [
    ...dmgModTypes,
    "lightning",
    "elemental",
  ];
  const dmgModTypesForFire: DmgModType[] = [
    ...dmgModTypes,
    "fire",
    "elemental",
  ];
  const dmgModTypesForErosion: DmgModType[] = [...dmgModTypes, "erosion"];

  const dmgPctModsForPhys = filterDmgPctMods(allDmgPctMods, dmgModTypesForPhys);
  const dmgPctModsForCold = filterDmgPctMods(allDmgPctMods, dmgModTypesForCold);
  const dmgPctModsForLightning = filterDmgPctMods(
    allDmgPctMods,
    dmgModTypesForLightning,
  );
  const dmgPctModsForFire = filterDmgPctMods(allDmgPctMods, dmgModTypesForFire);
  const dmgPctModsForErosion = filterDmgPctMods(
    allDmgPctMods,
    dmgModTypesForErosion,
  );

  return {
    phys: {
      inc: calculateDmgInc(dmgPctModsForPhys),
      addn: calculateDmgAddn(dmgPctModsForPhys),
    },
    cold: {
      inc: calculateDmgInc(dmgPctModsForCold),
      addn: calculateDmgAddn(dmgPctModsForCold),
    },
    lightning: {
      inc: calculateDmgInc(dmgPctModsForLightning),
      addn: calculateDmgAddn(dmgPctModsForLightning),
    },
    fire: {
      inc: calculateDmgInc(dmgPctModsForFire),
      addn: calculateDmgAddn(dmgPctModsForFire),
    },
    erosion: {
      inc: calculateDmgInc(dmgPctModsForErosion),
      addn: calculateDmgAddn(dmgPctModsForErosion),
    },
  };
};

const calculateDmgRange = (
  dmgRange: DmgRange,
  dmgModsAggr: DmgModsAggr,
): DmgRange => {
  const mult = (1 + dmgModsAggr.inc) * dmgModsAggr.addn;
  return multDR(dmgRange, mult);
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

const calculateSkillHit = (
  gearDmg: GearDmg,
  flatDmg: DmgRanges,
  allDmgPcts: Extract<Mod.Mod, { type: "DmgPct" }>[],
  skillConf: SkillConfiguration,
): SkillHitOverview => {
  const skillWeaponDR = match(skillConf.skill)
    .with("Berserking Blade", () => {
      return multDRs(gearDmg.mainHand, 2.1);
    })
    .with("[Test] Simple Attack", () => {
      return gearDmg.mainHand;
    })
    .otherwise(() => {
      // either it's unimplemented, not an attack
      return emptyDmgRanges();
    });
  const skillFlatDR = multDRs(flatDmg, skillConf.addedDmgEffPct);
  const skillBaseDmg = addDRs(skillWeaponDR, skillFlatDR);

  const totalDmgModsPerType = getTotalDmgModsPerType(allDmgPcts, skillConf);
  const phys = calculateDmgRange(skillBaseDmg.phys, totalDmgModsPerType.phys);
  const cold = calculateDmgRange(skillBaseDmg.cold, totalDmgModsPerType.cold);
  const lightning = calculateDmgRange(
    skillBaseDmg.lightning,
    totalDmgModsPerType.lightning,
  );
  const fire = calculateDmgRange(skillBaseDmg.fire, totalDmgModsPerType.fire);
  const erosion = calculateDmgRange(
    skillBaseDmg.erosion,
    totalDmgModsPerType.erosion,
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

// return undefined if skill unimplemented or it's not an offensive skill
export const calculateOffense = (
  loadout: Loadout,
  mods: Mod.Mod[],
  skill: Skill,
  configuration: Configuration,
): OffenseSummary | undefined => {
  const skillConf = offensiveSkillConfs.find((c) => c.skill === skill);
  if (skillConf === undefined) {
    return undefined;
  }
  const gearDmg = calculateGearDmg(loadout, mods);
  const flatDmg = calculateFlatDmg(mods, "attack");

  const aspd = calculateAspd(loadout, mods);
  const dmgPcts = filterAffix(mods, "DmgPct");
  const critChance = calculateCritRating(mods, configuration);
  const critDmgMult = calculateCritDmg(mods, configuration);

  const skillHit = calculateSkillHit(gearDmg, flatDmg, dmgPcts, skillConf);
  const avgHitWithCrit =
    skillHit.avg * critChance * critDmgMult + skillHit.avg * (1 - critChance);
  const avgDps = avgHitWithCrit * aspd;

  return {
    critChance: critChance,
    critDmgMult: critDmgMult,
    aspd: aspd,
    avgHit: skillHit.avg,
    avgHitWithCrit: avgHitWithCrit,
    avgDps: avgDps,
  };
};
