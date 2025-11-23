import * as R from "remeda";
import { match } from "ts-pattern";
import * as Affix from "./affix";
import { Mod } from "./mods";
import { DmgModType } from "./constants";

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

export interface DmgRange {
  // inclusive on both ends
  min: number;
  max: number;
}

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

export interface TalentPage {
  affixes: Affix.Affix[];
  coreTalents: Affix.Affix[];
}

export interface DivinitySlate {
  affixes: Affix.Affix[];
}

export interface DivinityPage {
  slates: DivinitySlate[];
}

export interface Configuration {
  fervor: {
    enabled: boolean;
    points: number;
  };
}

export interface Gear {
  gearType:
    | "helmet"
    | "chest"
    | "neck"
    | "gloves"
    | "belt"
    | "boots"
    | "ring"
    | "sword"
    | "shield";
  affixes: Affix.Affix[];
}

export interface GearPage {
  helmet?: Gear;
  chest?: Gear;
  neck?: Gear;
  gloves?: Gear;
  belt?: Gear;
  boots?: Gear;
  leftRing?: Gear;
  rightRing?: Gear;
  mainHand?: Gear;
  offHand?: Gear;
}

export interface Loadout {
  equipmentPage: GearPage;
  talentPage: TalentPage;
  divinityPage: DivinityPage;
  customConfiguration: Affix.Affix[];
}

const calculateInc = (bonuses: number[]) => {
  return R.pipe(
    bonuses,
    R.filter((b) => true),
    R.sum()
  );
};

const calculateAddn = (bonuses: number[]) => {
  return R.pipe(
    bonuses,
    R.filter((b) => true),
    R.reduce((b1, b2) => b1 * (1 + b2), 1)
  );
};

const collectAffixes = (loadout: Loadout): Affix.Affix[] => {
  return [
    ...loadout.divinityPage.slates.map((s) => s.affixes).flat(),
    ...loadout.talentPage.affixes,
    ...loadout.talentPage.coreTalents,
    ...(loadout.equipmentPage.helmet?.affixes || []),
    ...(loadout.equipmentPage.chest?.affixes || []),
    ...(loadout.equipmentPage.neck?.affixes || []),
    ...(loadout.equipmentPage.gloves?.affixes || []),
    ...(loadout.equipmentPage.belt?.affixes || []),
    ...(loadout.equipmentPage.boots?.affixes || []),
    ...(loadout.equipmentPage.leftRing?.affixes || []),
    ...(loadout.equipmentPage.rightRing?.affixes || []),
    ...(loadout.equipmentPage.mainHand?.affixes || []),
    ...(loadout.equipmentPage.offHand?.affixes || []),
    ...loadout.customConfiguration,
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

const findAffix = <T extends Affix.Affix["type"]>(
  affixes: Affix.Affix[],
  type: T
): Extract<Affix.Affix, { type: T }> | undefined => {
  return affixes.find((a) => a.type === type) as
    | Extract<Affix.Affix, { type: T }>
    | undefined;
};

const filterAffix = <T extends Affix.Affix["type"]>(
  affixes: Affix.Affix[],
  type: T
): Extract<Affix.Affix, { type: T }>[] => {
  return affixes.filter((a) => a.type === type) as Extract<
    Affix.Affix,
    { type: T }
  >[];
};

// currently only calculating mainhand
const calculateGearDmg = (
  loadout: Loadout,
  allAffixes: Affix.Affix[]
): GearDmg => {
  let mh = loadout.equipmentPage.mainHand;
  if (mh === undefined) {
    return emptyGearDmg();
  }
  let basePhysDmg = findAffix(mh.affixes, "GearBasePhysFlatDmg");
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

  let gearEleMinusPhysDmg = findAffix(mh.affixes, "GearPlusEleMinusPhysDmg");
  if (gearEleMinusPhysDmg !== undefined) {
    physBonusPct -= 1;

    let min = gearEleMinusPhysDmg.value.min;
    let max = gearEleMinusPhysDmg.value.max;
    cold.min += min;
    cold.max += max;
    lightning.min += min;
    lightning.max += max;
    fire.min += min;
    fire.max += max;
  }

  let gearPhysDmgPct = findAffix(mh.affixes, "GearPhysDmgPct");
  if (gearPhysDmgPct !== undefined) {
    physBonusPct += gearPhysDmgPct.value;
  }

  filterAffix(mh.affixes, "FlatGearDmg").forEach((a) => {
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
      .exhaustive();
  });

  let addnMHDmgMult = 1;
  filterAffix(allAffixes, "AddnMainHandDmgPct").forEach((a) => {
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

const calculateGearAspd = (
  loadout: Loadout,
  allAffixes: Affix.Affix[]
): number => {
  let mh = loadout.equipmentPage.mainHand;
  if (mh === undefined) {
    return 0;
  }
  let baseAspd = findAffix(mh.affixes, "GearBaseAspd");
  if (baseAspd === undefined) {
    return 0;
  }
  let gearAspdPctBonus = calculateInc(
    filterAffix(mh.affixes, "GearAspdPct").map((b) => b.value)
  );
  return baseAspd.value * (1 + gearAspdPctBonus);
};

const calculateDmgPcts = (
  allAffixes: Affix.Affix[]
): Extract<Mod, { type: "DmgPct" }>[] => {
  let dmgPctAffixes = filterAffix(allAffixes, "DmgPct");
  return dmgPctAffixes.map((a) => {
    return {
      type: "DmgPct",
      value: a.value,
      addn: a.addn,
      modType: a.modType,
      src: a.src,
    };
  });
};

const calculateCritRating = (
  allAffixes: Affix.Affix[],
  configuration: Configuration
): number => {
  let critRatingPctAffixes = filterAffix(allAffixes, "CritRatingPct");
  let mods = critRatingPctAffixes.map((a) => {
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
    let fervorEffAffixes = filterAffix(allAffixes, "FervorEff");
    let fervorEffTotal = calculateInc(fervorEffAffixes.map((a) => a.value));

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
  allAffixes: Affix.Affix[],
  configuration: Configuration
): number => {
  let critDmgPctAffixes = filterAffix(allAffixes, "CritDmgPct");
  let mods = critDmgPctAffixes.map((a) => {
    return {
      type: "CritDmgPct",
      value: a.value,
      addn: a.addn,
      modType: a.modType,
      src: a.src,
    };
  });

  // Handle CritDmgPerFervor affixes
  if (configuration.fervor.enabled) {
    let critDmgPerFervorAffixes = filterAffix(allAffixes, "CritDmgPerFervor");
    critDmgPerFervorAffixes.forEach((a) => {
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

const calculateAspdPcts = (
  allAffixes: Affix.Affix[]
): Extract<Mod, { type: "AspdPct" }>[] => {
  let aspdPctAffixes = filterAffix(allAffixes, "AspdPct");
  return aspdPctAffixes.map((a) => {
    return { type: "AspdPct", value: a.value, addn: a.addn, src: a.src };
  });
};

const calculateAspd = (loadout: Loadout, allAffixes: Affix.Affix[]): number => {
  let gearAspd = calculateGearAspd(loadout, allAffixes);
  let aspdPctMods = calculateAspdPcts(allAffixes);
  let inc = calculateInc(
    aspdPctMods.filter((m) => !m.addn).map((v) => v.value)
  );
  let addn = calculateAddn(
    aspdPctMods.filter((m) => m.addn).map((v) => v.value)
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
  dmgPctMods: Extract<Mod, { type: "DmgPct" }>[],
  dmgModTypes: DmgModType[]
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

const calculateDmgInc = (mods: Extract<Mod, { type: "DmgPct" }>[]) => {
  return calculateInc(mods.filter((m) => !m.addn).map((m) => m.value));
};

const calculateDmgAddn = (mods: Extract<Mod, { type: "DmgPct" }>[]) => {
  return calculateAddn(mods.filter((m) => m.addn).map((m) => m.value));
};

const getTotalDmgModsPerType = (
  allDmgPctMods: Extract<Mod, { type: "DmgPct" }>[],
  skillConf: SkillConfiguration
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
    dmgModTypesForLightning
  );
  let dmgPctModsForFire = filterDmgPctMods(allDmgPctMods, dmgModTypesForFire);
  let dmgPctModsForErosion = filterDmgPctMods(
    allDmgPctMods,
    dmgModTypesForErosion
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
  dmgModsAggr: DmgModsAggr
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
  allDmgPcts: Extract<Mod, { type: "DmgPct" }>[],
  skillConf: SkillConfiguration
): SkillHitOverview => {
  let totalDmgModsPerType = getTotalDmgModsPerType(allDmgPcts, skillConf);
  let phys = calculateDmgRange(gearDmg.mainHand.phys, totalDmgModsPerType.phys);
  let cold = calculateDmgRange(gearDmg.mainHand.cold, totalDmgModsPerType.cold);
  let lightning = calculateDmgRange(
    gearDmg.mainHand.lightning,
    totalDmgModsPerType.lightning
  );
  let fire = calculateDmgRange(gearDmg.mainHand.fire, totalDmgModsPerType.fire);
  let erosion = calculateDmgRange(
    gearDmg.mainHand.erosion,
    totalDmgModsPerType.erosion
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
  skill: Skill,
  configuration: Configuration
): OffenseSummary | undefined => {
  let skillConf = offensiveSkillConfs.find((c) => c.skill === skill);
  if (skillConf === undefined) {
    return undefined;
  }
  let allAffixes = collectAffixes(loadout);
  let gearDmg = calculateGearDmg(loadout, allAffixes);
  let aspd = calculateAspd(loadout, allAffixes);
  let dmgPcts = calculateDmgPcts(allAffixes);
  let critChance = calculateCritRating(allAffixes, configuration);
  let critDmgMult = calculateCritDmg(allAffixes, configuration);

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
