import * as R from "remeda";
import { match } from "ts-pattern";
import * as Mod from "./mod";
import { DmgModType } from "./constants";
import {
  Affix,
  Loadout,
  GearPage,
  Gear,
  TalentPage,
  DivinityPage,
  DivinitySlate,
  Configuration,
  DmgRange,
} from "./core";

let dummy40Armor = 0.11;
let dummy85Armor = 0.44;

type Stat = "dex" | "int" | "str";

type SkillTag =
  | "Attack"
  | "Spell"
  | "Melee"
  | "Area"
  | "Physical"
  | "Slash-Stike"
  | "Persistent";

export type Skill = "[Test] Simple Attack" | "Berserking Blade";

interface SkillConfiguration {
  skill: Skill;
  tags: SkillTag[];
  stats: Stat[];
  addedDmgEffPct: number;
}

let offensiveSkillConfs: SkillConfiguration[] = [
  {
    skill: "[Test] Simple Attack",
    tags: ["Attack"],
    stats: ["dex", "str"],
    addedDmgEffPct: 1,
  },
  {
    skill: "Berserking Blade",
    tags: ["Attack", "Melee", "Area", "Physical", "Slash-Stike", "Persistent"],
    stats: ["dex", "str"],
    addedDmgEffPct: 2.1,
  },
];

const addDR = (dr1: DmgRange, dr2: DmgRange): DmgRange => {
  return {
    min: dr1.min + dr2.min,
    max: dr1.max + dr2.max,
  };
};

const multDR = (dr: DmgRange, multiplier: number): DmgRange => {
  return {
    min: dr.min * multiplier,
    max: dr.max * multiplier,
  };
};

const emptyDamageRange = (): DmgRange => {
  return { min: 0, max: 0 };
};

const calculateInc = (bonuses: number[]) => {
  return R.pipe(
    bonuses,
    R.filter((b) => true),
    R.sum(),
  );
};

const calculateAddn = (bonuses: number[]) => {
  return R.pipe(
    bonuses,
    R.filter((b) => true),
    R.reduce((b1, b2) => b1 * (1 + b2), 1),
  );
};

const collectModsFromAffixes = (affixes: Affix[]): Mod.Mod[] => {
  return affixes?.map((a) => a.mods).flat() || [];
};

export const collectMods = (loadout: Loadout): Mod.Mod[] => {
  return [
    ...collectModsFromAffixes(
      loadout.divinityPage.slates.flatMap((s) => s.affixes),
    ),
    ...collectModsFromAffixes(loadout.talentPage.affixes),
    ...collectModsFromAffixes(loadout.equipmentPage.helmet?.affixes || []),
    ...collectModsFromAffixes(loadout.equipmentPage.chest?.affixes || []),
    ...collectModsFromAffixes(loadout.equipmentPage.neck?.affixes || []),
    ...collectModsFromAffixes(loadout.equipmentPage.gloves?.affixes || []),
    ...collectModsFromAffixes(loadout.equipmentPage.belt?.affixes || []),
    ...collectModsFromAffixes(loadout.equipmentPage.boots?.affixes || []),
    ...collectModsFromAffixes(loadout.equipmentPage.leftRing?.affixes || []),
    ...collectModsFromAffixes(loadout.equipmentPage.rightRing?.affixes || []),
    ...collectModsFromAffixes(loadout.equipmentPage.mainHand?.affixes || []),
    ...collectModsFromAffixes(loadout.equipmentPage.offHand?.affixes || []),
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
  mainHand: WeaponDmg;
  offHand?: WeaponDmg;
}

interface WeaponDmg {
  phys: DmgRange;
  cold: DmgRange;
  lightning: DmgRange;
  fire: DmgRange;
  erosion: DmgRange;
}

const emptyGearDmg = (): GearDmg => {
  return {
    mainHand: {
      phys: { min: 0, max: 0 },
      cold: { min: 0, max: 0 },
      lightning: { min: 0, max: 0 },
      fire: { min: 0, max: 0 },
      erosion: { min: 0, max: 0 },
    },
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

// currently only calculating mainhand
const calculateGearDmg = (loadout: Loadout, allMods: Mod.Mod[]): GearDmg => {
  let mainhand = loadout.equipmentPage.mainHand;
  if (mainhand === undefined) {
    return emptyGearDmg();
  }
  let mainhandMods = mainhand.affixes.map((a) => a.mods).flat();
  let basePhysDmg = findAffix(mainhandMods, "GearBasePhysFlatDmg");
  if (basePhysDmg === undefined) {
    return emptyGearDmg();
  }

  let phys = emptyDamageRange();
  let cold = emptyDamageRange();
  let lightning = emptyDamageRange();
  let fire = emptyDamageRange();
  let erosion = emptyDamageRange();

  phys.min += basePhysDmg.value;
  phys.max += basePhysDmg.value;
  let physBonusPct = 0;

  let gearPhysDmgPct = findAffix(mainhandMods, "GearPhysDmgPct");
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

const calculateGearAspd = (allMods: Mod.Mod[]): number => {
  let baseAspd = findAffix(allMods, "GearBaseAspd");
  if (baseAspd === undefined) {
    return 0;
  }
  let gearAspdPctBonus = calculateInc(
    filterAffix(allMods, "GearAspdPct").map((b) => b.value),
  );
  return baseAspd.value * (1 + gearAspdPctBonus);
};

const calculateCritRating = (
  allMods: Mod.Mod[],
  configuration: Configuration,
): number => {
  let critRatingPctMods = filterAffix(allMods, "CritRatingPct");
  let mods = critRatingPctMods.map((a) => {
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
    let fervorEffMods = filterAffix(allMods, "FervorEff");
    let fervorEffTotal = calculateInc(fervorEffMods.map((a) => a.value));

    // Base fervor: 2% per point, modified by FervorEff
    // Example: 100 points * 0.02 * (1 + 0.5) = 3.0 (with 50% FervorEff)
    let fervorPerPoint = 0.02 * (1 + fervorEffTotal);
    let fervorBonus = configuration.fervor.points * fervorPerPoint;

    mods.push({
      type: "CritRatingPct",
      value: fervorBonus,
      modType: "global",
      src: "fervor",
    });
  }

  let inc = calculateInc(mods.map((v) => v.value));
  return 0.05 * (1 + inc);
};

const calculateCritDmg = (
  allMods: Mod.Mod[],
  configuration: Configuration,
): number => {
  let critDmgPctMods = filterAffix(allMods, "CritDmgPct");
  let mods = critDmgPctMods.map((a) => {
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
    let critDmgPerFervorMods = filterAffix(allMods, "CritDmgPerFervor");
    critDmgPerFervorMods.forEach((a) => {
      // Calculate bonus: value * fervor points
      // Example: 0.005 (0.5%) * 100 points = 0.5 (50% increased crit damage)
      let bonus = a.value * configuration.fervor.points;
      mods.push({
        type: "CritDmgPct",
        value: bonus,
        addn: false, // Treated as "increased" modifier
        modType: "global",
        src: a.src || "CritDmgPerFervor",
      });
    });
  }

  let inc = calculateInc(mods.filter((m) => !m.addn).map((v) => v.value));
  let addn = calculateAddn(mods.filter((m) => m.addn).map((v) => v.value));

  return 1.5 * (1 + inc) * addn;
};

const calculateAspd = (allMods: Mod.Mod[]): number => {
  let gearAspd = calculateGearAspd(allMods);
  let aspdPctMods = filterAffix(allMods, "AspdPct");
  let inc = calculateInc(
    aspdPctMods.filter((m) => !m.addn).map((v) => v.value),
  );
  let addn = calculateAddn(
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
  let dmgModTypes: DmgModType[] = ["global"];
  conf.tags.forEach((t) => {
    let dmgModType = dmgModTypePerSkillTag[t];
    if (dmgModType !== undefined) {
      dmgModTypes.push(dmgModType);
    }
  });
  return dmgModTypes;
};

interface DmgOverview {
  phys: DmgRange;
  cold: DmgRange;
  lightning: DmgRange;
  fire: DmgRange;
  erosion: DmgRange;
}

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
  let dmgModTypes = dmgModTypesForSkill(skillConf);
  let dmgModTypesForPhys: DmgModType[] = [...dmgModTypes, "physical"];
  let dmgModTypesForCold: DmgModType[] = [...dmgModTypes, "cold", "elemental"];
  let dmgModTypesForLightning: DmgModType[] = [
    ...dmgModTypes,
    "lightning",
    "elemental",
  ];
  let dmgModTypesForFire: DmgModType[] = [...dmgModTypes, "fire", "elemental"];
  let dmgModTypesForErosion: DmgModType[] = [...dmgModTypes, "erosion"];

  let dmgPctModsForPhys = filterDmgPctMods(allDmgPctMods, dmgModTypesForPhys);
  let dmgPctModsForCold = filterDmgPctMods(allDmgPctMods, dmgModTypesForCold);
  let dmgPctModsForLightning = filterDmgPctMods(
    allDmgPctMods,
    dmgModTypesForLightning,
  );
  let dmgPctModsForFire = filterDmgPctMods(allDmgPctMods, dmgModTypesForFire);
  let dmgPctModsForErosion = filterDmgPctMods(
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
  let mult = (1 + dmgModsAggr.inc) * dmgModsAggr.addn;
  return multDR(dmgRange, mult);
};

interface SkillHitOverview {
  base: {
    phys: DmgRange;
    cold: DmgRange;
    lightning: DmgRange;
    fire: DmgRange;
    erosion: DmgRange;
    total: DmgRange;
    totalAvg: number;
  };
  avg: number;
}

const calculateSkillHit = (
  gearDmg: GearDmg,
  allDmgPcts: Extract<Mod.Mod, { type: "DmgPct" }>[],
  skillConf: SkillConfiguration,
): SkillHitOverview => {
  let totalDmgModsPerType = getTotalDmgModsPerType(allDmgPcts, skillConf);
  let phys = calculateDmgRange(gearDmg.mainHand.phys, totalDmgModsPerType.phys);
  let cold = calculateDmgRange(gearDmg.mainHand.cold, totalDmgModsPerType.cold);
  let lightning = calculateDmgRange(
    gearDmg.mainHand.lightning,
    totalDmgModsPerType.lightning,
  );
  let fire = calculateDmgRange(gearDmg.mainHand.fire, totalDmgModsPerType.fire);
  let erosion = calculateDmgRange(
    gearDmg.mainHand.erosion,
    totalDmgModsPerType.erosion,
  );
  let total = {
    min: phys.min + cold.min + lightning.min + fire.min + erosion.min,
    max: phys.max + cold.max + lightning.max + fire.max + erosion.max,
  };
  let totalAvg = (total.min + total.max) / 2;

  let finalAvg = match(skillConf.skill)
    .with("Berserking Blade", () => {
      return totalAvg * 2.1;
    })
    .with("[Test] Simple Attack", () => {
      return totalAvg;
    })
    .otherwise(() => {
      // either it's unimplemented, not an attack
      return 0;
    });

  return {
    base: {
      phys: phys,
      cold: cold,
      lightning: lightning,
      fire: fire,
      erosion: erosion,
      total: total,
      totalAvg: totalAvg,
    },
    avg: finalAvg,
  };
};

// return undefined if skill unimplemented or it's not an offensive skill
export const calculateOffense = (
  loadout: Loadout,
  mods: Mod.Mod[],
  skill: Skill,
  configuration: Configuration,
): OffenseSummary | undefined => {
  let skillConf = offensiveSkillConfs.find((c) => c.skill === skill);
  if (skillConf === undefined) {
    return undefined;
  }
  let gearDmg = calculateGearDmg(loadout, mods);
  let aspd = calculateAspd(mods);
  let dmgPcts = filterAffix(mods, "DmgPct");
  let critChance = calculateCritRating(mods, configuration);
  let critDmgMult = calculateCritDmg(mods, configuration);

  let skillHit = calculateSkillHit(gearDmg, dmgPcts, skillConf);
  let avgHitWithCrit =
    skillHit.avg * critChance * critDmgMult + skillHit.avg * (1 - critChance);
  let avgDps = avgHitWithCrit * aspd;

  return {
    critChance: critChance,
    critDmgMult: critDmgMult,
    aspd: aspd,
    avgHit: skillHit.avg,
    avgHitWithCrit: avgHitWithCrit,
    avgDps: avgDps,
  };
};
