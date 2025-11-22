import { expect, test } from "vitest";
import { calculateOffense, Loadout, Configuration } from "./stuff";

const initLoadout = (pl: Partial<Loadout>) => {
  return {
    equipmentPage: {},
    talentPage: {
      affixes: [],
      coreTalents: [],
    },
    divinityPage: {
      slates: [],
    },
    customConfiguration: [],
  };
};

const defaultConfiguration: Configuration = {
  fervor: {
    enabled: false,
    points: 100,
  },
};

test("calculate offense very basic", () => {
  let loadout: Loadout = {
    equipmentPage: {
      mainHand: {
        gearType: "sword",
        affixes: [{ type: "GearBasePhysFlatDmg", value: 100 }],
      },
    },
    talentPage: {
      affixes: [],
      coreTalents: [],
    },
    divinityPage: {
      slates: [],
    },
    customConfiguration: [
      { type: "DmgPct", value: 1, modType: "global", addn: false },
    ],
  };

  let res = calculateOffense(loadout, "[Test] Simple Attack", defaultConfiguration);

  // base * bonusdmg * crit * skill bonus
  // 100 * 2 * 1.025
  expect(res).toMatchObject({ avgHit: 200, avgHitWithCrit: 205 });
});

test("calculate offense multiple inc dmg", () => {
  let loadout: Loadout = {
    equipmentPage: {
      mainHand: {
        gearType: "sword",
        affixes: [{ type: "GearBasePhysFlatDmg", value: 100 }],
      },
    },
    talentPage: {
      affixes: [],
      coreTalents: [],
    },
    divinityPage: {
      slates: [],
    },
    customConfiguration: [
      { type: "DmgPct", value: 0.5, modType: "global", addn: false }, // +50% increased
      { type: "DmgPct", value: 0.3, modType: "global", addn: false }, // +30% increased
    ],
  };

  let res = calculateOffense(loadout, "[Test] Simple Attack", defaultConfiguration);

  // base * (1 + sum of increased) * crit
  // 100 * (1 + 0.5 + 0.3) = 180
  // 180 * 1.025 (crit) = 184.5
  expect(res).toMatchObject({ avgHit: 180, avgHitWithCrit: 184.5 });
});

test("calculate offense multiple addn dmg", () => {
  let loadout: Loadout = {
    equipmentPage: {
      mainHand: {
        gearType: "sword",
        affixes: [{ type: "GearBasePhysFlatDmg", value: 100 }],
      },
    },
    talentPage: {
      affixes: [],
      coreTalents: [],
    },
    divinityPage: {
      slates: [],
    },
    customConfiguration: [
      { type: "DmgPct", value: 0.5, modType: "global", addn: true }, // +50% more
      { type: "DmgPct", value: 0.2, modType: "global", addn: true }, // +20% more
    ],
  };

  let res = calculateOffense(loadout, "[Test] Simple Attack", defaultConfiguration);

  // base * (1 + more1) * (1 + more2) * crit
  // 100 * 1.5 * 1.2 = 180
  // 180 * 1.025 (crit) = 184.5
  expect(res?.avgHit).toBeCloseTo(180);
  expect(res?.avgHitWithCrit).toBeCloseTo(184.5);
});

test("calculate offense multiple mix inc and addn dmg", () => {
  let loadout: Loadout = {
    equipmentPage: {
      mainHand: {
        gearType: "sword",
        affixes: [{ type: "GearBasePhysFlatDmg", value: 100 }],
      },
    },
    talentPage: {
      affixes: [],
      coreTalents: [],
    },
    divinityPage: {
      slates: [],
    },
    customConfiguration: [
      { type: "DmgPct", value: 0.5, modType: "global", addn: false }, // +50% increased
      { type: "DmgPct", value: 0.3, modType: "global", addn: false }, // +30% increased
      { type: "DmgPct", value: 0.2, modType: "global", addn: true }, // +20% more
    ],
  };

  let res = calculateOffense(loadout, "[Test] Simple Attack", defaultConfiguration);

  // base * (1 + sum of increased) * (1 + more) * crit
  // 100 * (1 + 0.5 + 0.3) * 1.2 = 100 * 1.8 * 1.2 = 216
  // 216 * 1.025 (crit) = 221.4
  expect(res?.avgHit).toBeCloseTo(216);
  expect(res?.avgHitWithCrit).toBeCloseTo(221.4);
});

test("calculate offense atk dmg mod", () => {
  let loadout: Loadout = {
    equipmentPage: {
      mainHand: {
        gearType: "sword",
        affixes: [{ type: "GearBasePhysFlatDmg", value: 100 }],
      },
    },
    talentPage: {
      affixes: [],
      coreTalents: [],
    },
    divinityPage: {
      slates: [],
    },
    customConfiguration: [
      { type: "DmgPct", value: 0.5, modType: "attack", addn: false }, // +50% increased attack damage
    ],
  };

  let res = calculateOffense(loadout, "[Test] Simple Attack", defaultConfiguration);

  // [Test] Simple Attack has "Attack" tag, so attack modifiers apply
  // 100 * (1 + 0.5) = 150
  // 150 * 1.025 (crit) = 153.75
  expect(res).toMatchObject({ avgHit: 150, avgHitWithCrit: 153.75 });
});

test("calculate offense spell dmg mod doesn't affect attack skill", () => {
  let loadout: Loadout = {
    equipmentPage: {
      mainHand: {
        gearType: "sword",
        affixes: [{ type: "GearBasePhysFlatDmg", value: 100 }],
      },
    },
    talentPage: {
      affixes: [],
      coreTalents: [],
    },
    divinityPage: {
      slates: [],
    },
    customConfiguration: [
      { type: "DmgPct", value: 0.5, modType: "spell", addn: false }, // +50% increased spell damage
    ],
  };

  let res = calculateOffense(loadout, "[Test] Simple Attack", defaultConfiguration);

  // [Test] Simple Attack has "Attack" tag, NOT "Spell" tag
  // So spell modifiers don't apply - only base damage
  // 100 * 1 (no applicable modifiers) = 100
  // 100 * 1.025 (crit) = 102.5
  expect(res).toMatchObject({ avgHit: 100, avgHitWithCrit: 102.5 });
});

test("calculate offense elemental damage", () => {
  let loadout: Loadout = {
    equipmentPage: {
      mainHand: {
        gearType: "sword",
        affixes: [
          { type: "GearBasePhysFlatDmg", value: 100 },
          { type: "GearPlusEleMinusPhysDmg", value: { min: 50, max: 50 } },
        ],
      },
    },
    talentPage: {
      affixes: [],
      coreTalents: [],
    },
    divinityPage: {
      slates: [],
    },
    customConfiguration: [
      { type: "DmgPct", value: 0.5, modType: "elemental", addn: false }, // +50% elemental
    ],
  };

  let res = calculateOffense(loadout, "[Test] Simple Attack", defaultConfiguration);

  // GearPlusEleMinusPhysDmg removes all physical damage and adds elemental
  // Physical: 100 * (1 - 1) = 0 (removed by conversion)
  // Cold/Lightning/Fire: 50 each * 1.5 (elemental bonus) = 75 each
  // Total avg hit: 0 + 75 + 75 + 75 = 225
  // With crit: 225 * 1.025 = 230.625
  expect(res?.avgHit).toBeCloseTo(225);
  expect(res?.avgHitWithCrit).toBeCloseTo(230.625);
});

test("calculate offense cold damage", () => {
  let loadout: Loadout = {
    equipmentPage: {
      mainHand: {
        gearType: "sword",
        affixes: [
          { type: "GearBasePhysFlatDmg", value: 100 },
          { type: "FlatGearDmg", value: { min: 30, max: 30 }, modType: "cold" },
        ],
      },
    },
    talentPage: {
      affixes: [],
      coreTalents: [],
    },
    divinityPage: {
      slates: [],
    },
    customConfiguration: [
      { type: "DmgPct", value: 0.8, modType: "cold", addn: false }, // +80% cold damage
    ],
  };

  let res = calculateOffense(loadout, "[Test] Simple Attack", defaultConfiguration);

  // Physical: 100 (no bonuses)
  // Cold: 30 * 1.8 (cold bonus) = 54
  // Total avg hit: 100 + 54 = 154
  // With crit: 154 * 1.025 = 157.85
  expect(res?.avgHit).toBeCloseTo(154);
  expect(res?.avgHitWithCrit).toBeCloseTo(157.85);
});

test("calculate offense affixes from equipment, talents, and divinities combine", () => {
  let loadout: Loadout = {
    equipmentPage: {
      mainHand: {
        gearType: "sword",
        affixes: [
          { type: "GearBasePhysFlatDmg", value: 100 },
          { type: "DmgPct", value: 0.2, modType: "global", addn: false }, // +20% from weapon
        ],
      },
    },
    talentPage: {
      affixes: [
        { type: "DmgPct", value: 0.3, modType: "global", addn: false }, // +30% from talent
      ],
      coreTalents: [],
    },
    divinityPage: {
      slates: [
        {
          affixes: [
            { type: "DmgPct", value: 0.1, modType: "global", addn: false }, // +10% from divinity
          ],
        },
      ],
    },
    customConfiguration: [],
  };

  let res = calculateOffense(loadout, "[Test] Simple Attack", defaultConfiguration);

  // All affixes from equipment, talents, and divinities are collected
  // Total damage bonus: 20% + 30% + 10% = 60%
  // Base: 100 * 1.6 = 160
  // With crit: 160 * 1.025 = 164
  expect(res?.avgHit).toBeCloseTo(160);
  expect(res?.avgHitWithCrit).toBeCloseTo(164);
});

test("calculate offense with fervor enabled default points", () => {
  let loadout: Loadout = {
    equipmentPage: {
      mainHand: {
        gearType: "sword",
        affixes: [{ type: "GearBasePhysFlatDmg", value: 100 }],
      },
    },
    talentPage: {
      affixes: [],
      coreTalents: [],
    },
    divinityPage: {
      slates: [],
    },
    customConfiguration: [],
  };

  let configuration: Configuration = {
    fervor: {
      enabled: true,
      points: 100,
    },
  };

  let res = calculateOffense(loadout, "[Test] Simple Attack", configuration);

  // Base damage: 100
  // Fervor: 100 points * 2% = 200% increased crit rating
  // Crit chance: 0.05 * (1 + 2.0) = 0.15 (15%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.15 * 1.5 + 100 * 0.85 = 22.5 + 85 = 107.5
  expect(res?.avgHit).toBeCloseTo(100);
  expect(res?.critChance).toBeCloseTo(0.15);
  expect(res?.avgHitWithCrit).toBeCloseTo(107.5);
});

test("calculate offense with fervor enabled custom points", () => {
  let loadout: Loadout = {
    equipmentPage: {
      mainHand: {
        gearType: "sword",
        affixes: [{ type: "GearBasePhysFlatDmg", value: 100 }],
      },
    },
    talentPage: {
      affixes: [],
      coreTalents: [],
    },
    divinityPage: {
      slates: [],
    },
    customConfiguration: [],
  };

  let configuration: Configuration = {
    fervor: {
      enabled: true,
      points: 50,
    },
  };

  let res = calculateOffense(loadout, "[Test] Simple Attack", configuration);

  // Base damage: 100
  // Fervor: 50 points * 2% = 100% increased crit rating
  // Crit chance: 0.05 * (1 + 1.0) = 0.10 (10%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.10 * 1.5 + 100 * 0.90 = 15 + 90 = 105
  expect(res?.avgHit).toBeCloseTo(100);
  expect(res?.critChance).toBeCloseTo(0.10);
  expect(res?.avgHitWithCrit).toBeCloseTo(105);
});

test("calculate offense with fervor disabled", () => {
  let loadout: Loadout = {
    equipmentPage: {
      mainHand: {
        gearType: "sword",
        affixes: [{ type: "GearBasePhysFlatDmg", value: 100 }],
      },
    },
    talentPage: {
      affixes: [],
      coreTalents: [],
    },
    divinityPage: {
      slates: [],
    },
    customConfiguration: [],
  };

  let configuration: Configuration = {
    fervor: {
      enabled: false,
      points: 100,
    },
  };

  let res = calculateOffense(loadout, "[Test] Simple Attack", configuration);

  // Fervor disabled, so no bonus despite having 100 points
  // Crit chance: 0.05 * (1 + 0) = 0.05 (5%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.05 * 1.5 + 100 * 0.95 = 7.5 + 95 = 102.5
  expect(res?.avgHit).toBeCloseTo(100);
  expect(res?.critChance).toBeCloseTo(0.05);
  expect(res?.avgHitWithCrit).toBeCloseTo(102.5);
});

test("calculate offense with fervor and other crit rating affixes", () => {
  let loadout: Loadout = {
    equipmentPage: {
      mainHand: {
        gearType: "sword",
        affixes: [
          { type: "GearBasePhysFlatDmg", value: 100 },
          { type: "CritRatingPct", value: 0.5, modType: "global" }, // +50% crit rating
        ],
      },
    },
    talentPage: {
      affixes: [],
      coreTalents: [],
    },
    divinityPage: {
      slates: [],
    },
    customConfiguration: [],
  };

  let configuration: Configuration = {
    fervor: {
      enabled: true,
      points: 25,
    },
  };

  let res = calculateOffense(loadout, "[Test] Simple Attack", configuration);

  // Base damage: 100
  // Crit rating from gear: +50%
  // Fervor: 25 points * 2% = 50% increased crit rating
  // Total crit rating bonus: 50% + 50% = 100%
  // Crit chance: 0.05 * (1 + 1.0) = 0.10 (10%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.10 * 1.5 + 100 * 0.90 = 15 + 90 = 105
  expect(res?.avgHit).toBeCloseTo(100);
  expect(res?.critChance).toBeCloseTo(0.10);
  expect(res?.avgHitWithCrit).toBeCloseTo(105);
});

test("calculate offense with fervor and single FervorEff modifier", () => {
  let loadout: Loadout = {
    equipmentPage: {
      mainHand: {
        gearType: "sword",
        affixes: [
          { type: "GearBasePhysFlatDmg", value: 100 },
          { type: "FervorEff", value: 0.5 }, // +50% fervor effectiveness
        ],
      },
    },
    talentPage: {
      affixes: [],
      coreTalents: [],
    },
    divinityPage: {
      slates: [],
    },
    customConfiguration: [],
  };

  let configuration: Configuration = {
    fervor: {
      enabled: true,
      points: 100,
    },
  };

  let res = calculateOffense(loadout, "[Test] Simple Attack", configuration);

  // Base damage: 100
  // Fervor: 100 points * 2% * (1 + 0.5) = 100 * 0.02 * 1.5 = 3.0 (300% increased crit rating)
  // Crit chance: 0.05 * (1 + 3.0) = 0.20 (20%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.20 * 1.5 + 100 * 0.80 = 30 + 80 = 110
  expect(res?.avgHit).toBeCloseTo(100);
  expect(res?.critChance).toBeCloseTo(0.20);
  expect(res?.avgHitWithCrit).toBeCloseTo(110);
});

test("calculate offense with fervor and multiple FervorEff modifiers stacking", () => {
  let loadout: Loadout = {
    equipmentPage: {
      mainHand: {
        gearType: "sword",
        affixes: [
          { type: "GearBasePhysFlatDmg", value: 100 },
          { type: "FervorEff", value: 0.1 }, // +10% fervor effectiveness
        ],
      },
    },
    talentPage: {
      affixes: [
        { type: "FervorEff", value: 0.1 }, // +10% fervor effectiveness
      ],
      coreTalents: [],
    },
    divinityPage: {
      slates: [],
    },
    customConfiguration: [],
  };

  let configuration: Configuration = {
    fervor: {
      enabled: true,
      points: 100,
    },
  };

  let res = calculateOffense(loadout, "[Test] Simple Attack", configuration);

  // Base damage: 100
  // FervorEff total: 0.1 + 0.1 = 0.2 (20% total)
  // Fervor: 100 points * 2% * (1 + 0.2) = 100 * 0.02 * 1.2 = 2.4 (240% increased crit rating)
  // Crit chance: 0.05 * (1 + 2.4) = 0.17 (17%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.17 * 1.5 + 100 * 0.83 = 25.5 + 83 = 108.5
  expect(res?.avgHit).toBeCloseTo(100);
  expect(res?.critChance).toBeCloseTo(0.17);
  expect(res?.avgHitWithCrit).toBeCloseTo(108.5);
});

test("calculate offense with fervor and FervorEff with custom fervor points", () => {
  let loadout: Loadout = {
    equipmentPage: {
      mainHand: {
        gearType: "sword",
        affixes: [
          { type: "GearBasePhysFlatDmg", value: 100 },
          { type: "FervorEff", value: 1.0 }, // +100% fervor effectiveness (doubles it)
        ],
      },
    },
    talentPage: {
      affixes: [],
      coreTalents: [],
    },
    divinityPage: {
      slates: [],
    },
    customConfiguration: [],
  };

  let configuration: Configuration = {
    fervor: {
      enabled: true,
      points: 50,
    },
  };

  let res = calculateOffense(loadout, "[Test] Simple Attack", configuration);

  // Base damage: 100
  // Fervor: 50 points * 2% * (1 + 1.0) = 50 * 0.02 * 2.0 = 2.0 (200% increased crit rating)
  // Crit chance: 0.05 * (1 + 2.0) = 0.15 (15%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.15 * 1.5 + 100 * 0.85 = 22.5 + 85 = 107.5
  expect(res?.avgHit).toBeCloseTo(100);
  expect(res?.critChance).toBeCloseTo(0.15);
  expect(res?.avgHitWithCrit).toBeCloseTo(107.5);
});

test("calculate offense with FervorEff but fervor disabled", () => {
  let loadout: Loadout = {
    equipmentPage: {
      mainHand: {
        gearType: "sword",
        affixes: [
          { type: "GearBasePhysFlatDmg", value: 100 },
          { type: "FervorEff", value: 0.5 }, // +50% fervor effectiveness
        ],
      },
    },
    talentPage: {
      affixes: [],
      coreTalents: [],
    },
    divinityPage: {
      slates: [],
    },
    customConfiguration: [],
  };

  let configuration: Configuration = {
    fervor: {
      enabled: false,
      points: 100,
    },
  };

  let res = calculateOffense(loadout, "[Test] Simple Attack", configuration);

  // FervorEff has no effect when fervor is disabled
  // Crit chance: 0.05 * (1 + 0) = 0.05 (5%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.05 * 1.5 + 100 * 0.95 = 7.5 + 95 = 102.5
  expect(res?.avgHit).toBeCloseTo(100);
  expect(res?.critChance).toBeCloseTo(0.05);
  expect(res?.avgHitWithCrit).toBeCloseTo(102.5);
});
