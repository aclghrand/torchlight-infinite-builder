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
  type SupportSkillName,
  SupportSkills,
} from "../../data/skill";
import type { DmgModType } from "../constants";
import {
  type Affix,
  type Configuration,
  type DivinityPage,
  type DmgRange,
  getAllAffixes,
  getHeroAffixes,
  getTalentAffixes,
  type Loadout,
  type SkillSlot,
  type SupportSkillSlot,
} from "../core";
import type { DmgChunkType, Mod, ModOfType, Stackable } from "../mod";
import { getActiveSkillMods } from "../skills/active_mods";
import { getPassiveSkillMods } from "../skills/passive_mods";
import { getSupportSkillMods } from "../skills/support_mods";
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

const sumByValue = (mods: Extract<Mod, { value: number }>[]): number => {
  return R.sumBy(mods, (m) => m.value);
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
    ...collectModsFromAffixes(getHeroAffixes(loadout.heroPage)),
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

const calculateCritRating = (allMods: Mod[]): number => {
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
  return 0.05 * (1 + inc);
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

  return 1.5 * (1 + inc) * addn;
};

const calculateDoubleDmgMult = (mods: Mod[]): number => {
  const doubleDmgMods = filterMod(mods, "DoubleDmgChancePct");
  // capped at 100% chance to deal double damage
  const inc = Math.min(1, calculateInc(doubleDmgMods.map((v) => v.value)));
  return 1 + inc;
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
  return offense.value;
};

const calculateAddnDmgFromShadows = (
  numShadowHits: number,
): ModOfType<"DmgPct"> | undefined => {
  if (numShadowHits <= 0) return;
  if (numShadowHits === 1) {
    return {
      type: "DmgPct",
      addn: true,
      value: 1,
      modType: "global",
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
    value: geometricSum,
    modType: "global",
    src: `Shadow Strike: ${numShadowHits} hits`,
  };
};

const filterPenMods = (
  mods: ModOfType<"ResPenPct">[],
  penTypes: ModOfType<"ResPenPct">["penType"][],
): ModOfType<"ResPenPct">[] => {
  return mods.filter((m) => penTypes.includes(m.penType));
};

const calculatePenetration = (
  dmg: DmgRanges,
  mods: Mod[],
  config: Configuration,
) => {
  const {
    phys: physBeforePen,
    cold: coldBeforePen,
    lightning: lightningBeforePen,
    fire: fireBeforePen,
    erosion: erosionBeforePen,
  } = dmg;
  const enemyRes = calculateEnemyRes(config);
  const elePenMods = filterMod(mods, "ResPenPct");
  const coldPenMods = filterPenMods(elePenMods, ["all", "elemental", "cold"]);
  const lightningPenMods = filterPenMods(elePenMods, [
    "all",
    "elemental",
    "lightning",
  ]);
  const firePenMods = filterPenMods(elePenMods, ["all", "elemental", "fire"]);
  const erosionPenMods = filterPenMods(elePenMods, ["all", "erosion"]);
  const enemyColdResMult = 1 - enemyRes + sumByValue(coldPenMods);
  const enemyLightningResMult = 1 - enemyRes + sumByValue(lightningPenMods);
  const enemyFireResMult = 1 - enemyRes + sumByValue(firePenMods);
  const enemyErosionResMult = 1 - enemyRes + sumByValue(erosionPenMods);

  const enemyArmorDmgMitigation = calculateEnemyArmorDmgMitigation(
    calculateEnemyArmor(config),
  );
  const totalArmorPenPct = sumByValue(filterMod(mods, "ArmorPenPct"));
  const enemyArmorPhysMult =
    1 - enemyArmorDmgMitigation.phys + totalArmorPenPct;
  const enemyArmorNonPhysMult =
    1 - enemyArmorDmgMitigation.nonPhys + totalArmorPenPct;

  const phys = multValue(physBeforePen, enemyArmorPhysMult);
  const cold = multValue(
    coldBeforePen,
    enemyColdResMult,
    enemyArmorNonPhysMult,
  );
  const lightning = multValue(
    lightningBeforePen,
    enemyLightningResMult,
    enemyArmorNonPhysMult,
  );
  const fire = multValue(
    fireBeforePen,
    enemyFireResMult,
    enemyArmorNonPhysMult,
  );
  const erosion = multValue(
    erosionBeforePen,
    enemyErosionResMult,
    enemyArmorNonPhysMult,
  );

  return { phys, cold, lightning, fire, erosion };
};

const calculateSkillHit = (
  gearDmg: GearDmg,
  flatDmg: DmgRanges,
  allMods: Mod[],
  mainSkill: BaseActiveSkill,
  level: number,
  config: Configuration,
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
  const physBeforePen = calculatePoolTotal(
    dmgPools.physical,
    "physical",
    allDmgPcts,
    mainSkill,
  );
  const coldBeforePen = calculatePoolTotal(
    dmgPools.cold,
    "cold",
    allDmgPcts,
    mainSkill,
  );
  const lightningBeforePen = calculatePoolTotal(
    dmgPools.lightning,
    "lightning",
    allDmgPcts,
    mainSkill,
  );
  const fireBeforePen = calculatePoolTotal(
    dmgPools.fire,
    "fire",
    allDmgPcts,
    mainSkill,
  );
  const erosionBeforePen = calculatePoolTotal(
    dmgPools.erosion,
    "erosion",
    allDmgPcts,
    mainSkill,
  );

  const { phys, cold, lightning, fire, erosion } = calculatePenetration(
    {
      phys: physBeforePen,
      cold: coldBeforePen,
      lightning: lightningBeforePen,
      fire: fireBeforePen,
      erosion: erosionBeforePen,
    },
    allMods,
    config,
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
  ...multipliers: number[]
): T => {
  const mult = multiplier * multipliers.reduce((a, b) => a * b, 1);
  if (typeof value === "number") {
    return (value * mult) as T;
  } else {
    return multDR(value, mult) as T;
  }
};

type ModWithValue = Extract<Mod, { value: number | DmgRange }>;

const multModValue = <T extends ModWithValue>(
  mod: T,
  multiplier: number,
): T => {
  const newValue = match(mod.value)
    .with(P.number, (x) => x * multiplier)
    .otherwise((x) => multDR(x, multiplier));
  return { ...mod, value: newValue, per: undefined };
};

const filterModsByCond = (
  prenormalizedMods: Mod[],
  config: Configuration,
): Mod[] => {
  return prenormalizedMods.filter((m) => {
    if (!("cond" in m) || m.cond === undefined) return true;
    return match(m.cond)
      .with("enemy_frostbitten", () => config.enemyFrostbitten.enabled)
      .with("realm_of_mercury", () => config.realmOfMercuryEnabled)
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

  const div = mod.per.amt || 1;
  const mult = Math.min(stacks / div, mod.per.limit ?? Infinity);
  const newModValue = multValue(mod.value, mult);
  if (typeof newModValue === "number" && mod.per.valueLimit !== undefined) {
    return {
      ...mod,
      value: Math.min(newModValue, mod.per.valueLimit),
    };
  } else {
    return {
      ...mod,
      value: newModValue,
    };
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

// includes any mods that always apply, but don't come from loadout, like damage from stats
const calculateImplicitMods = (): Mod[] => {
  return [
    {
      type: "DmgPct",
      // .5% additional damage per main stat
      value: 0.005,
      modType: "global",
      addn: true,
      per: { stackable: "main_stat" },
      src: "Additional Damage from skill Main Stat (.5% per stat)",
    },
  ];
};

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

    // Get level mods from factory based on skill type
    let levelMods: Mod[] = [];
    let rawBuffMods: Mod[] = [];

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
    const mods = normalizeModsForSkill(prenormMods, skill, config);

    // === Calculate SkillEffPct multiplier (from support skills + loadout mods) ===
    // todo: add area, cdr, duration, and other buff-skill modifiers
    const skillEffMods = filterMod(mods, "SkillEffPct");
    const skillEffMult = calculateEffMultiplier(skillEffMods);

    // === Calculate AuraEffPct multiplier (from loadout mods + support skills + own levelBuffMods) ===
    // Only applies if this is an Aura skill
    let auraEffMult = 1;
    if (isAuraSkill) {
      const allAuraEffMods = filterMod(mods, "AuraEffPct");
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
  const skillMods = getActiveSkillMods(skill.name as ActiveSkillName, level);
  if (skillMods.mods === undefined) {
    return [];
  }
  return skillMods.mods.map((mod) => ({
    ...mod,
    src: `Selected Active Skill: ${skill.name} Lv.${level}`,
  }));
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
    const mods = getSupportSkillMods(
      supportSkill.name as SupportSkillName,
      level,
    );
    for (const mod of mods) {
      supportMods.push({
        ...mod,
        src: `Support: ${supportSkill.name} Lv.${level}`,
      });
    }
  }
  return supportMods;
};

// Context for mods specific to a single skill
interface PerSkillModContext {
  mods: Mod[];
  skill: BaseActiveSkill;
  skillSlot: SkillSlot;
}

// Resolves mods specific to a single skill slot
// Returns undefined if the skill is not implemented (no offense data)
const resolvePerSkillMods = (
  skillSlot: SkillSlot,
): PerSkillModContext | undefined => {
  const skill = findActiveSkill(skillSlot.skillName as ActiveSkillName);

  // Skip non-implemented skills (those without levelValues)
  if (!("levelValues" in skill) || skill.levelValues === undefined) {
    return undefined;
  }

  const level = skillSlot.level || 20;

  // Check if the skill's factory returns offense data
  const skillMods = getActiveSkillMods(skill.name as ActiveSkillName, level);
  if (skillMods.offense === undefined) {
    // Skill has levelValues but no offense (e.g., buff-only skills like Ice Bond)
    return undefined;
  }

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

interface FervorCtx {
  enabled: boolean;
  points: number;
  bonusIncEff: number;
}

const calculateFervor = (mods: Mod[], config: Configuration): FervorCtx => {
  const fervorEffMods = filterMod(mods, "FervorEff");
  const bonusIncEff = calculateInc(fervorEffMods.map((a) => a.value));
  return {
    enabled: config.fervor.enabled,
    points: config.fervor.points ?? 100,
    bonusIncEff: bonusIncEff,
  };
};

const calculateFervorCritRateMod = (fervor: FervorCtx): Mod => {
  const fervorPerPoint = 0.02 * (1 + fervor.bonusIncEff);
  const fervorBonus = fervor.points * fervorPerPoint;

  return {
    type: "CritRatingPct",
    value: fervorBonus,
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
    enabled: config.enemyFrostbitten.enabled,
    points: config.enemyFrostbitten.points ?? 0,
  };
};

const calculateNumShadowHits = (mods: Mod[], config: Configuration): number => {
  const shadowQuantMods = filterMod(mods, "ShadowQuant");
  const shadowQuant = R.sumBy(shadowQuantMods, (m) => m.value);
  return config.numShadowHits ?? shadowQuant;
};

const calculateEnemyRes = (config: Configuration): number => {
  // enemyRes is stored as decimal (0.5 for 50%)
  return config.enemyRes ?? 0.5;
};

const calculateEnemyArmor = (config: Configuration): number => {
  // default to max possible enemy armor, equivalent to 50% dmg reduction
  return config.enemyArmor ?? 27273;
};

// decimal percentages representing how much to reduce dmg by
// e.g. .7 reduction means that a hit will do 30% of its original value
interface ArmorDmgMitigation {
  phys: number;
  nonPhys: number;
}

const calculateEnemyArmorDmgMitigation = (
  armor: number,
): ArmorDmgMitigation => {
  const phys = armor / (0.9 * armor + 30000);
  const nonPhys = phys * 0.6;
  return { phys, nonPhys };
};

// replaces CoreTalent mods with their equivalent regular mods
const replaceCoreTalentMods = (mods: Mod[]): Mod[] => {
  // todo: implement some core talent replacements
  const coreTalentNames = mods
    .filter((m) => m.type === "CoreTalent")
    .map((m) => m.name);
  const newMods: Mod[] = coreTalentNames.flatMap((_m) => []);
  const withoutCoreTalentMods = mods.filter((m) => m.type !== "CoreTalent");
  return [...withoutCoreTalentMods, ...newMods];
};

// Normalizes mods for a specific skill, handling "per" properties
const normalizeModsForSkill = (
  prenormModsFromParam: Mod[],
  skill: BaseActiveSkill | BasePassiveSkill,
  config: Configuration,
): Mod[] => {
  // Create stat-based damage mod
  const prenormMods = filterModsByCond(
    replaceCoreTalentMods([
      ...prenormModsFromParam,
      ...calculateImplicitMods(),
    ]),
    config,
  );
  let mods = filterOutPerMods(prenormMods);

  const stats = calculateStats(prenormMods);
  const totalMainStats = calculateTotalMainStats(skill, stats);
  mods = mods.concat(
    normalizeStackables(prenormMods, "main_stat", totalMainStats),
  );

  const skillUse = 3;
  mods = mods.concat(normalizeStackables(prenormMods, "skill_use", skillUse));

  const skillChargesOnUse = 2;
  mods = mods.concat(
    normalizeStackables(prenormMods, "skill_charges_on_use", skillChargesOnUse),
  );

  const willpowerStacks = calculateWillpower(prenormMods);
  mods = mods.concat(
    normalizeStackables(prenormMods, "willpower", willpowerStacks),
  );

  const crueltyBuffStacks = config.crueltyBuffStacks ?? 40;
  mods = mods.concat(
    normalizeStackables(prenormMods, "cruelty_buff", crueltyBuffStacks),
  );

  const frostbitten = calculateEnemyFrostbitten(config);
  mods = mods.concat(
    normalizeStackables(prenormMods, "frostbite_rating", frostbitten.points),
  );

  // todo: calculate projectile count
  const projectiles = 0;
  mods = mods.concat(
    normalizeStackables(prenormMods, "projectile", projectiles),
  );

  const fervor = calculateFervor(mods, config);
  if (fervor.enabled) {
    mods.push(calculateFervorCritRateMod(fervor));
    mods = mods.concat(
      normalizeStackables(prenormMods, "fervor", fervor.points),
    );
  }

  if (skill.tags.includes("Shadow Strike")) {
    const numShadowHits = calculateNumShadowHits(mods, config);
    const dmgFromShadowMod = calculateAddnDmgFromShadows(numShadowHits);
    if (dmgFromShadowMod !== undefined) {
      const shadowDmgPctMods = filterMod(mods, "ShadowDmgPct");
      const shadowDmgMult = calculateEffMultiplier(shadowDmgPctMods);
      mods.push(multModValue(dmgFromShadowMod, shadowDmgMult));
    }
  }

  return mods;
};

// Calculates offense for all enabled implemented skills
export const calculateOffense = (input: OffenseInput): OffenseResults => {
  const { loadout, configuration } = input;
  const loadoutMods = collectMods(loadout);

  const prenormMods = [
    ...loadoutMods,
    ...resolveBuffSkillMods(loadout, loadoutMods, configuration),
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
      [...prenormMods, ...perSkillContext.mods],
      perSkillContext.skill,
      configuration,
    );

    const gearDmg = calculateGearDmg(loadout, mods);
    const flatDmg = calculateFlatDmg(mods, "attack");
    const skillHit = calculateSkillHit(
      gearDmg,
      flatDmg,
      mods,
      perSkillContext.skill,
      perSkillContext.skillSlot.level || 20,
      configuration,
    );

    const aspd = calculateAspd(loadout, mods);
    const critChance = calculateCritRating(mods);
    const critDmgMult = calculateCritDmg(mods);
    const doubleDmgMult = calculateDoubleDmgMult(mods);

    const avgHitWithCrit =
      skillHit.avg * critChance * critDmgMult + skillHit.avg * (1 - critChance);
    const avgDps = avgHitWithCrit * doubleDmgMult * aspd;

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
