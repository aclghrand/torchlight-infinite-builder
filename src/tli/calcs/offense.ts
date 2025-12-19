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
  type DivinityPage,
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

const getGearAffixes = (
  gear: Loadout["gearPage"]["equippedGear"][keyof Loadout["gearPage"]["equippedGear"]],
): Affix[] => {
  return gear ? getAllAffixes(gear) : [];
};

const getPactspiritAffixes = (
  pactspiritPage: Loadout["pactspiritPage"],
): Affix[] => {
  const affixes: Affix[] = [];
  const slots = [
    pactspiritPage.slot1,
    pactspiritPage.slot2,
    pactspiritPage.slot3,
  ];
  for (const slot of slots) {
    if (slot === undefined) continue;
    affixes.push(slot.mainAffix);
    for (const ring of Object.values(slot.rings)) {
      affixes.push(ring.installedDestiny?.affix ?? ring.originalAffix);
    }
  }
  return affixes;
};

const getDivinityAffixes = (divinityPage: DivinityPage): Affix[] => {
  const affixes: Affix[] = [];
  for (const placedSlate of divinityPage.placedSlates) {
    const slate = divinityPage.inventory.find(
      (s) => s.id === placedSlate.slateId,
    );
    if (slate !== undefined) {
      affixes.push(...slate.affixes);
    }
  }
  return affixes;
};

export const collectMods = (loadout: Loadout): Mod[] => {
  return [
    // todo: handle hero stuff
    ...collectModsFromAffixes(getDivinityAffixes(loadout.divinityPage)),
    ...collectModsFromAffixes(getPactspiritAffixes(loadout.pactspiritPage)),
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
    const addsDmgAsMods = filterMod(allMods, "AddsDmgAs").filter(
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
    const convMods = filterMod(allMods, "ConvertDmgPct").filter(
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
    filterMod(allMods, "FlatDmgToAtks"),
    filterMod(allMods, "FlatDmgToAtksAndSpells"),
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
    filterMod(allMods, "GearAspdPct").map((b) => b.value),
  );
  return baseAspd * (1 + gearAspdPctBonus);
};

const calculateCritRating = (
  allMods: Mod[],
  configuration: Configuration,
): number => {
  const critRatingPctMods = filterMod(allMods, "CritRatingPct");
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
    const fervorEffMods = filterMod(allMods, "FervorEff");
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

  // Handle CritDmgPerFervor mods
  if (configuration.fervor.enabled) {
    const critDmgPerFervorMods = filterMod(allMods, "CritDmgPerFervor");
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
    filterMod(allMods, "AspdPct"),
    filterMod(allMods, "AspdAndCspdPct"),
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
  const allDmgPcts = filterMod(allMods, "DmgPct");
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

interface NormalizationContextOptions {
  mods: Mod[];
  config: Configuration;
  stats: Stats;
  skill: BaseActiveSkill | BasePassiveSkill;
}

const calculateNormalizationContext = (
  options: NormalizationContextOptions,
): NormalizationContext => {
  const { mods, config, stats, skill } = options;

  const willpower = findMod(mods, "MaxWillpowerStacks")?.value || 0;
  const mainStats = skill.mainStats || [];
  let mainStat = 0;
  for (const mainStatType of mainStats) {
    mainStat += stats[mainStatType];
  }

  return {
    willpower,
    frostbiteRating: 0,
    projectile: 0,
    skillUse: 3,
    skillChargesOnUse: 2,
    mainStat,
    crueltyBuffStacks: config.crueltyBuffStacks,
  };
};

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

interface Stats {
  str: number;
  dex: number;
  int: number;
}

// todo: very basic stat calculation, will definitely need to handle things like pct, per, and conditionals
const calculateStats = (mods: Mod[]): Stats => {
  const statMods = filterMod(mods, "Stat");
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

// resolves mods coming from skills that provide buffs (levelBuffMods)
// for example, "Bull's Rage" provides a buff that increases all melee damage
const resolveBuffSkillMods = (
  loadout: Loadout,
  loadoutMods: Mod[],
  config: Configuration,
  stats: Stats,
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
    const levelMods =
      skill.levelMods?.map((m) => {
        return {
          ...m.template,
          value: m.levels[level],
          src: `${skill.name} Lv.${level}`,
        } as Mod;
      }) ?? [];
    const mods = [...loadoutMods, ...supportMods, ...levelMods];

    // === Calculate SkillEffPct multiplier (from support skills + loadout mods) ===
    // todo: add area, cdr, duration, and other buff-skill modifiers
    const effNormContext = calculateNormalizationContext({
      mods,
      config,
      stats,
      skill,
    });
    const skillEffMods = filterMod(mods, "SkillEffPct")
      .map((m) => normalizeMod(m, effNormContext, config))
      .filter((m) => m !== undefined);
    const skillEffMult = calculateEffMultiplier(skillEffMods);

    // === Resolve raw buff mods from skill's levelBuffMods ===
    const rawBuffMods: Mod[] =
      skill.levelBuffMods?.map((m) => {
        return {
          ...m.template,
          value: m.levels[level],
          src: `${isAuraSkill ? "Aura" : "Buff"}: ${skill.name} Lv.${level}`,
        } as Mod;
      }) || [];

    // === Calculate AuraEffPct multiplier (from loadout mods + support skills + own levelBuffMods) ===
    // Only applies if this is an Aura skill
    let auraEffMult = 1;
    if (isAuraSkill) {
      const allAuraEffMods = filterMod(mods, "AuraEffPct")
        .map((m) => normalizeMod(m, effNormContext, config))
        .filter((m) => m !== undefined);
      auraEffMult = calculateEffMultiplier(allAuraEffMods);
    }

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
  loadoutMods: Mod[];
  buffSkillMods: Mod[];
  stats: { str: number; dex: number; int: number };
  willpowerStacks: number;
}

// Resolves mods that are shared across all skill calculations
const resolveSharedMods = (
  loadout: Loadout,
  config: Configuration,
): SharedModContext => {
  const loadoutMods = collectMods(loadout);
  const stats = calculateStats(loadoutMods);
  const buffSkillMods = resolveBuffSkillMods(
    loadout,
    loadoutMods,
    config,
    stats,
  );
  const allMods = [...loadoutMods, ...buffSkillMods];
  const willpowerStacks = findMod(allMods, "MaxWillpowerStacks")?.value || 0;
  return { loadoutMods, buffSkillMods, stats, willpowerStacks };
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

  const normContext = calculateNormalizationContext({
    mods: allMods,
    config,
    stats: sharedContext.stats,
    skill,
  });

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
    ...sharedContext.loadoutMods,
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
