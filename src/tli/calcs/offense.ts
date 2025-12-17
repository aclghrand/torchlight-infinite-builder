import * as R from "remeda";
import { match, P } from "ts-pattern";
import {
  type ActiveSkillName,
  ActiveSkills,
  type BaseActiveSkill,
  type BaseSupportSkill,
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
import type { DmgChunkType, Mod, Stackable } from "../mod";
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
  Melee: "attack",
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
  mainSkillName: OffenseSkillName;
  configuration: Configuration;
}

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

const listActiveSkillSlots = (input: OffenseInput): SkillSlot[] => {
  // we're sure that SkillSlots properties only has SkillSlot as values
  const slots = Object.values(input.loadout.skillPage.activeSkills) as (
    | SkillSlot
    | undefined
  )[];
  return slots.filter((s) => s !== undefined);
};

const getSkillSlot = (input: OffenseInput): SkillSlot => {
  const name = input.mainSkillName;
  const slots = listActiveSkillSlots(input);
  const slot = slots.find((s) => s?.skillName === name);
  if (slot === undefined) {
    throw new Error(`Skill "${name}" not found in skill page activeSkills`);
  }
  return slot;
};

const resolveMainSkill = (input: OffenseInput): Mod[] => {
  const name = input.mainSkillName;
  const slots = listActiveSkillSlots(input);
  const slot = slots.find((s) => s?.skillName === name);
  if (slot === undefined) {
    return [];
  }

  return [
    ...resolveMainSkillMods(name, slot.level || 20),
    ...resolveSelectedSkillSupportMods(slot),
  ];
};

const findActiveSkill = (name: ActiveSkillName): BaseActiveSkill => {
  // ActiveSkillName should be guaranteed to be something within ActiveSkills
  return ActiveSkills.find((s) => s.name === name) as BaseActiveSkill;
};

// resolves mods coming from skills that are NOT the selected main skill
// for example, "Bull's Rage" provides a buff that increases all melee damage
const resolveBuffSkillMods = (input: OffenseInput): Mod[] => {
  const activeSkillSlots = listActiveSkillSlots(input);
  const resolvedMods = [];
  for (const skillSlot of activeSkillSlots) {
    if (!skillSlot.enabled) {
      continue;
    }

    // we only care about skill effect for now
    // todo: add area, cdr, duration, and other buff-skill modifiers
    const skillEffMods = resolveSelectedSkillSupportMods(skillSlot).filter(
      (m) => m.type === "SkillEffPct",
    );
    const incSkillEffMods = skillEffMods.filter(
      (m) => m.addn === undefined || m.addn === false,
    );
    const incSkillEff = calculateInc(incSkillEffMods.map((m) => m.value));
    const addnSkillEffMods = skillEffMods.filter((m) => m.addn === true);
    const addnSkillEff = calculateAddn(addnSkillEffMods.map((m) => m.value));
    const skillEffMult = (1 + incSkillEff) * addnSkillEff;

    const level = skillSlot.level || 20;
    // todo: refactor skillname to be an ActiveSkillName?
    const skill = findActiveSkill(skillSlot.skillName as ActiveSkillName);
    const extraMult = match(skill.name)
      // Hard-code Well-Fought Battle to assume that the user has
      // already cast the support skill the max number of times
      .with("Well-Fought Battle", () => 3)
      .otherwise(() => 1);

    // todo: do we need a more granular way of applying skill effect than just multiplying
    //  it against the template value?
    const buffMods: Mod[] =
      skill.levelBuffMods?.map((m) => {
        return {
          ...m.template,
          value: multValue(m.levels[level], skillEffMult * extraMult),
        } as Mod;
      }) || [];
    resolvedMods.push(...buffMods);
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

// retrieves all mods, and filters or normalizes them in the following ways:
// * value multiplied by the per? property based on the referenced StackableBuff
// * filtered based on various criteria
const resolveMods = (
  input: OffenseInput,
  mainSkill: BaseActiveSkill,
): Mod[] => {
  // includes mods from loadout and from base effects, such as from stats
  const allOriginalMods: Mod[] = [
    ...collectMods(input.loadout),
    ...resolveMainSkill(input),
    ...resolveBuffSkillMods(input),
    {
      type: "DmgPct",
      // .5% additional damage per main stat
      // todo: verify in-game that this number is correct
      value: 0.005,
      modType: "global",
      addn: true,
      per: { stackable: "main_stat" },
      src: "Additional Damage from skill Main Stat (.5% per stat)",
    },
  ];
  const stats = calculateStats(allOriginalMods);
  const willpowerStacks =
    findAffix(allOriginalMods, "MaxWillpowerStacks")?.value || 0;

  const normalizedMods = [];
  for (const mod of allOriginalMods) {
    if ("per" in mod && mod.per !== undefined) {
      const div = mod.per.amt || 1;
      const normalizedMod = match<Stackable, Mod>(mod.per.stackable)
        .with(
          P.union(
            "willpower",
            "frostbite_rating",
            "projectile",
            "skill_use",
            "skill_charges_on_use",
          ),
          () => multModValue(mod, willpowerStacks / div),
        )
        .with("main_stat", () => {
          if (mainSkill.mainStats === undefined) {
            throw new Error(
              `Skill "${mainSkill.name}" has no mainStats defined`,
            );
          }
          let totalMainStats = 0;
          for (const mainStatType of mainSkill.mainStats) {
            totalMainStats += stats[mainStatType];
          }
          return multModValue(mod, totalMainStats / div);
        })
        .exhaustive();
      normalizedMods.push(normalizedMod);
    } else {
      normalizedMods.push(mod);
    }
  }

  return normalizedMods;
};

// return undefined if skill unimplemented or it's not an offensive skill
export const calculateOffense = (
  input: OffenseInput,
): OffenseSummary | undefined => {
  const { loadout, mainSkillName, configuration } = input;
  const mainSkill = findActiveSkill(mainSkillName);
  const mainSkillSlot = getSkillSlot(input);
  const mods = resolveMods(input, mainSkill);
  const gearDmg = calculateGearDmg(loadout, mods);
  const flatDmg = calculateFlatDmg(mods, "attack");

  const aspd = calculateAspd(loadout, mods);
  const critChance = calculateCritRating(mods, configuration);
  const critDmgMult = calculateCritDmg(mods, configuration);

  const skillHit = calculateSkillHit(
    gearDmg,
    flatDmg,
    mods,
    mainSkill,
    mainSkillSlot.level || 20,
  );
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
    resolvedMods: mods,
  };
};
