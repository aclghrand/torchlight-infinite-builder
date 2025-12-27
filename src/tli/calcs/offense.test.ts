import { describe, expect, test } from "vitest";
import type { ImplementedActiveSkillName } from "../../data/skill";
import type { Affix, Configuration, Loadout } from "../core";
import type { Mod } from "../mod";
import {
  calculateOffense,
  convertDmg,
  type DmgPools,
  type DmgRanges,
  type OffenseResults,
} from "./offense";
import type { OffenseSkillName } from "./skill_confs";

type DmgPctMod = Extract<Mod, { type: "DmgPct" }>;

const createDefaultConfiguration = (): Configuration => ({
  level: 95,
  fervorEnabled: false,
  fervorPoints: undefined,
  enemyFrostbittenEnabled: false,
  enemyFrostbittenPoints: undefined,
  crueltyBuffStacks: undefined,
  numShadowHits: undefined,
  manaConsumedRecently: undefined,
  unsealedManaWholePct: undefined,
  realmOfMercuryEnabled: false,
  enemyRes: 0,
  enemyArmor: 0,
});

// Helper to create Affix objects from mods for tests
const affix = (mods: Mod[]): Affix => ({
  affixLines: mods.map((mod) => ({ text: "", mods: [mod] })),
});

// Base weapon used by most tests: 100 physical damage sword
const baseWeapon = {
  equipmentType: "One-Handed Sword" as const,
  baseStats: {
    baseStatLines: [
      {
        text: "100 - 100 physical damage",
        mod: { type: "FlatPhysDmg", value: 100 } as const,
      },
    ],
  },
};

const emptySkillPage = () => ({
  activeSkills: {},
  passiveSkills: {},
});

const simpleAttackSkillPage = () => ({
  activeSkills: {
    1: {
      skillName: "[Test] Simple Attack" as const,
      enabled: true,
      level: 20,
      supportSkills: {},
    },
  },
  passiveSkills: {},
});

const emptyAffix = (): Affix => ({ affixLines: [] });

const emptyRingSlotState = () => ({
  originalRingName: "Test Ring",
  originalAffix: emptyAffix(),
});

const ringSlotWithOriginalAffix = (originalAffix: Affix) => ({
  originalRingName: "Test Ring",
  originalAffix,
});

const initLoadout = (pl: Partial<Loadout> = {}): Loadout => {
  return {
    gearPage: pl.gearPage || { equippedGear: {}, inventory: [] },
    talentPage: pl.talentPage || {
      talentTrees: {},
      inventory: { prismList: [], inverseImageList: [] },
    },
    divinityPage: pl.divinityPage || { placedSlates: [], inventory: [] },
    skillPage: pl.skillPage || emptySkillPage(),
    heroPage: pl.heroPage || {
      selectedHero: undefined,
      traits: {},
      memorySlots: {},
      memoryInventory: [],
    },
    pactspiritPage: pl.pactspiritPage || {},
    customConfiguration: pl.customConfiguration || [],
  };
};

const defaultConfiguration = createDefaultConfiguration();

// Configuration with enemyFrostbitten enabled for tests that need Ice Bond's conditional buff
const frostbittenEnabledConfig: Configuration = {
  ...createDefaultConfiguration(),
  enemyFrostbittenEnabled: true,
  enemyFrostbittenPoints: 0,
};

type ExpectedOutput = Partial<{
  avgHit: number;
  avgHitWithCrit: number;
  critChance: number;
  critDmgMult: number;
  aspd: number;
  avgDps: number;
}>;

const validate = (
  results: OffenseResults,
  skillName: OffenseSkillName,
  expected: ExpectedOutput,
) => {
  const actual = results.skills[skillName as ImplementedActiveSkillName];
  expect(actual).toBeDefined();
  for (const [key, value] of Object.entries(expected)) {
    expect(actual?.[key as keyof typeof expected]).toBeCloseTo(value);
  }
};

describe("basic damage modifiers", () => {
  const skillName = "[Test] Simple Attack" as const;

  // Bespoke helper: 100 phys weapon + custom mods
  const createModsInput = (mods: Affix[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customConfiguration: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  // Bespoke helper: weapon with base affixes (adds to 100 phys weapon) + mods
  const createWeaponModsInput = (weaponAffixes: Affix[], mods: Affix[]) => ({
    loadout: initLoadout({
      gearPage: {
        equippedGear: {
          mainHand: { ...baseWeapon, base_affixes: weaponAffixes },
        },
        inventory: [],
      },
      customConfiguration: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  test("calculate offense very basic", () => {
    // base * bonusdmg
    // 100 * 2 = 200
    const input = createModsInput([
      affix([{ type: "DmgPct", value: 1, modType: "global", addn: false }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 200 });
  });

  test("calculate offense multiple inc dmg", () => {
    // base * (1 + sum of increased)
    // 100 * (1 + 0.5 + 0.3) = 180
    const input = createModsInput([
      affix([{ type: "DmgPct", value: 0.5, modType: "global", addn: false }]), // +50% increased
      affix([{ type: "DmgPct", value: 0.3, modType: "global", addn: false }]), // +30% increased
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 180 });
  });

  test("calculate offense multiple addn dmg", () => {
    // base * (1 + more1) * (1 + more2)
    // 100 * 1.5 * 1.2 = 180
    const input = createModsInput([
      affix([{ type: "DmgPct", value: 0.5, modType: "global", addn: true }]), // +50% more
      affix([{ type: "DmgPct", value: 0.2, modType: "global", addn: true }]), // +20% more
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 180 });
  });

  test("calculate offense multiple mix inc and addn dmg", () => {
    // base * (1 + sum of increased) * (1 + more)
    // 100 * (1 + 0.5 + 0.3) * 1.2 = 100 * 1.8 * 1.2 = 216
    const input = createModsInput([
      affix([{ type: "DmgPct", value: 0.5, modType: "global", addn: false }]), // +50% increased
      affix([{ type: "DmgPct", value: 0.3, modType: "global", addn: false }]), // +30% increased
      affix([{ type: "DmgPct", value: 0.2, modType: "global", addn: true }]), // +20% more
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 216 });
  });

  test("calculate offense atk dmg mod", () => {
    // [Test] Simple Attack has "Attack" tag, so attack modifiers apply
    // 100 * (1 + 0.5) = 150
    const input = createModsInput([
      affix([{ type: "DmgPct", value: 0.5, modType: "attack", addn: false }]), // +50% increased attack damage
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 150 });
  });

  test("calculate offense spell dmg mod doesn't affect attack skill", () => {
    // [Test] Simple Attack has "Attack" tag, NOT "Spell" tag
    // So spell modifiers don't apply - only base damage
    // 100 * 1 (no applicable modifiers) = 100
    const input = createModsInput([
      affix([{ type: "DmgPct", value: 0.5, modType: "spell", addn: false }]), // +50% increased spell damage
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 100 });
  });

  test("calculate offense elemental damage", () => {
    // 100 phys weapon + 50 elemental (cold/lightning/fire each)
    // GearPhysDmgPct -1 removes all physical damage
    // Cold/Lightning/Fire: 50 each * 1.5 (elemental bonus) = 75 each
    // Total avg hit: 0 + 75 + 75 + 75 = 225
    const input = createWeaponModsInput(
      [
        affix([
          {
            type: "FlatGearDmg",
            modType: "elemental",
            value: { min: 50, max: 50 },
          },
          { type: "GearPhysDmgPct", value: -1 },
        ]),
      ],
      [
        affix([
          { type: "DmgPct", value: 0.5, modType: "elemental", addn: false },
        ]),
      ], // +50% elemental
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 225 });
  });

  test("calculate offense cold damage", () => {
    // Physical: 100 (no bonuses)
    // Cold: 30 * 1.8 (cold bonus) = 54
    // Total avg hit: 100 + 54 = 154
    const input = createWeaponModsInput(
      [
        affix([
          { type: "FlatGearDmg", value: { min: 30, max: 30 }, modType: "cold" },
        ]),
      ],
      [affix([{ type: "DmgPct", value: 0.8, modType: "cold", addn: false }])], // +80% cold damage
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 154 });
  });
});

describe("fervor mechanics", () => {
  const skillName = "[Test] Simple Attack" as const;

  const createFervorConfig = (fervor: { enabled: boolean; points: number }) => {
    const config = createDefaultConfiguration();
    config.fervorEnabled = fervor.enabled;
    config.fervorPoints = fervor.points;
    return config;
  };

  // Bespoke helper for fervor tests
  const createFervorInput = (
    fervor: { enabled: boolean; points: number },
    affixes?: Affix[],
  ) => ({
    loadout: initLoadout({
      gearPage: {
        equippedGear: {
          mainHand: affixes
            ? { ...baseWeapon, base_affixes: affixes }
            : baseWeapon,
        },
        inventory: [],
      },
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: createFervorConfig(fervor),
  });

  test("calculate offense with fervor enabled default points", () => {
    // Base damage: 100
    // Fervor: 100 points * 2% = 200% increased crit rating
    // Crit chance: 0.05 * (1 + 2.0) = 0.15 (15%)
    // Crit damage: 1.5 (default)
    // AvgHitWithCrit: 100 * 0.15 * 1.5 + 100 * 0.85 = 22.5 + 85 = 107.5
    const input = createFervorInput({ enabled: true, points: 100 });
    const results = calculateOffense(input);
    validate(results, skillName, {
      avgHit: 100,
      critChance: 0.15,
      avgHitWithCrit: 107.5,
    });
  });

  test("calculate offense with fervor enabled custom points", () => {
    // Base damage: 100
    // Fervor: 50 points * 2% = 100% increased crit rating
    // Crit chance: 0.05 * (1 + 1.0) = 0.10 (10%)
    // Crit damage: 1.5 (default)
    // AvgHitWithCrit: 100 * 0.10 * 1.5 + 100 * 0.90 = 15 + 90 = 105
    const input = createFervorInput({ enabled: true, points: 50 });
    const results = calculateOffense(input);
    validate(results, skillName, {
      avgHit: 100,
      critChance: 0.1,
      avgHitWithCrit: 105,
    });
  });

  test("calculate offense with fervor disabled", () => {
    // Fervor disabled, so no bonus despite having 100 points
    // Crit chance: 0.05 * (1 + 0) = 0.05 (5%)
    // Crit damage: 1.5 (default)
    // AvgHitWithCrit: 100 * 0.05 * 1.5 + 100 * 0.95 = 7.5 + 95 = 102.5
    const input = createFervorInput({ enabled: false, points: 100 });
    const results = calculateOffense(input);
    validate(results, skillName, {
      avgHit: 100,
      critChance: 0.05,
      avgHitWithCrit: 102.5,
    });
  });

  test("calculate offense with fervor and other crit rating affixes", () => {
    // Base damage: 100
    // Crit rating from gear: +50%
    // Fervor: 25 points * 2% = 50% increased crit rating
    // Total crit rating bonus: 50% + 50% = 100%
    // Crit chance: 0.05 * (1 + 1.0) = 0.10 (10%)
    // Crit damage: 1.5 (default)
    // AvgHitWithCrit: 100 * 0.10 * 1.5 + 100 * 0.90 = 15 + 90 = 105
    const input = createFervorInput({ enabled: true, points: 25 }, [
      affix([{ type: "CritRatingPct", value: 0.5, modType: "global" }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, {
      avgHit: 100,
      critChance: 0.1,
      avgHitWithCrit: 105,
    });
  });

  test("calculate offense with fervor and single FervorEff modifier", () => {
    // Base damage: 100
    // Fervor: 100 points * 2% * (1 + 0.5) = 100 * 0.02 * 1.5 = 3.0 (300% increased crit rating)
    // Crit chance: 0.05 * (1 + 3.0) = 0.20 (20%)
    // Crit damage: 1.5 (default)
    // AvgHitWithCrit: 100 * 0.20 * 1.5 + 100 * 0.80 = 30 + 80 = 110
    const input = createFervorInput({ enabled: true, points: 100 }, [
      affix([{ type: "FervorEff", value: 0.5 }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, {
      avgHit: 100,
      critChance: 0.2,
      avgHitWithCrit: 110,
    });
  });

  test("calculate offense with fervor and multiple FervorEff modifiers stacking", () => {
    // Base damage: 100
    // FervorEff total: 0.1 + 0.1 = 0.2 (20% total)
    // Fervor: 100 points * 2% * (1 + 0.2) = 100 * 0.02 * 1.2 = 2.4 (240% increased crit rating)
    // Crit chance: 0.05 * (1 + 2.4) = 0.17 (17%)
    // Crit damage: 1.5 (default)
    // AvgHitWithCrit: 100 * 0.17 * 1.5 + 100 * 0.83 = 25.5 + 83 = 108.5
    const input = createFervorInput({ enabled: true, points: 100 }, [
      affix([{ type: "FervorEff", value: 0.1 }]),
      affix([{ type: "FervorEff", value: 0.1 }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, {
      avgHit: 100,
      critChance: 0.17,
      avgHitWithCrit: 108.5,
    });
  });

  test("calculate offense with fervor and FervorEff with custom fervor points", () => {
    // Base damage: 100
    // Fervor: 50 points * 2% * (1 + 1.0) = 50 * 0.02 * 2.0 = 2.0 (200% increased crit rating)
    // Crit chance: 0.05 * (1 + 2.0) = 0.15 (15%)
    // Crit damage: 1.5 (default)
    // AvgHitWithCrit: 100 * 0.15 * 1.5 + 100 * 0.85 = 22.5 + 85 = 107.5
    const input = createFervorInput({ enabled: true, points: 50 }, [
      affix([{ type: "FervorEff", value: 1.0 }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, {
      avgHit: 100,
      critChance: 0.15,
      avgHitWithCrit: 107.5,
    });
  });

  test("calculate offense with FervorEff but fervor disabled", () => {
    // FervorEff has no effect when fervor is disabled
    // Crit chance: 0.05 * (1 + 0) = 0.05 (5%)
    // Crit damage: 1.5 (default)
    // AvgHitWithCrit: 100 * 0.05 * 1.5 + 100 * 0.95 = 7.5 + 95 = 102.5
    const input = createFervorInput({ enabled: false, points: 100 }, [
      affix([{ type: "FervorEff", value: 0.5 }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, {
      avgHit: 100,
      critChance: 0.05,
      avgHitWithCrit: 102.5,
    });
  });

  test("calculate offense with CritDmgPerFervor single affix", () => {
    // Base damage: 100
    // Fervor: 100 points * 2% = 200% increased crit rating
    // Crit chance: 0.05 * (1 + 2.0) = 0.15 (15%)
    // CritDmgPerFervor: 0.005 * 100 = 0.5 (50% increased crit damage)
    // Crit damage: 1.5 * (1 + 0.5) = 2.25
    // AvgHitWithCrit: 100 * 0.15 * 2.25 + 100 * 0.85 = 33.75 + 85 = 118.75
    const input = createFervorInput({ enabled: true, points: 100 }, [
      affix([
        {
          type: "CritDmgPct",
          value: 0.005,
          addn: false,
          modType: "global",
          per: { stackable: "fervor" },
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, {
      avgHit: 100,
      critChance: 0.15,
      critDmgMult: 2.25,
      avgHitWithCrit: 118.75,
    });
  });

  test("calculate offense with multiple CritDmgPerFervor affixes stacking", () => {
    // Base damage: 100
    // Fervor: 100 points * 2% = 200% increased crit rating
    // Crit chance: 0.05 * (1 + 2.0) = 0.15 (15%)
    // CritDmgPerFervor total: (0.005 * 100) + (0.003 * 100) = 0.5 + 0.3 = 0.8
    // Crit damage: 1.5 * (1 + 0.8) = 2.7
    // AvgHitWithCrit: 100 * 0.15 * 2.7 + 100 * 0.85 = 40.5 + 85 = 125.5
    const input = createFervorInput({ enabled: true, points: 100 }, [
      affix([
        {
          type: "CritDmgPct",
          value: 0.005,
          addn: false,
          modType: "global",
          per: { stackable: "fervor" },
        },
      ]),
      affix([
        {
          type: "CritDmgPct",
          value: 0.003,
          addn: false,
          modType: "global",
          per: { stackable: "fervor" },
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, {
      avgHit: 100,
      critChance: 0.15,
      critDmgMult: 2.7,
      avgHitWithCrit: 125.5,
    });
  });

  test("calculate offense with CritDmgPerFervor with custom fervor points", () => {
    // Base damage: 100
    // Fervor: 50 points * 2% = 100% increased crit rating
    // Crit chance: 0.05 * (1 + 1.0) = 0.10 (10%)
    // CritDmgPerFervor: 0.01 * 50 = 0.5 (50% increased crit damage)
    // Crit damage: 1.5 * (1 + 0.5) = 2.25
    // AvgHitWithCrit: 100 * 0.10 * 2.25 + 100 * 0.90 = 22.5 + 90 = 112.5
    const input = createFervorInput({ enabled: true, points: 50 }, [
      affix([
        {
          type: "CritDmgPct",
          value: 0.01,
          addn: false,
          modType: "global",
          per: { stackable: "fervor" },
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, {
      avgHit: 100,
      critChance: 0.1,
      critDmgMult: 2.25,
      avgHitWithCrit: 112.5,
    });
  });

  test("calculate offense with CritDmgPerFervor but fervor disabled", () => {
    // CritDmgPerFervor has no effect when fervor is disabled
    // Crit chance: 0.05 (5%, no fervor bonus)
    // Crit damage: 1.5 (no bonus)
    // AvgHitWithCrit: 100 * 0.05 * 1.5 + 100 * 0.95 = 7.5 + 95 = 102.5
    const input = createFervorInput({ enabled: false, points: 100 }, [
      affix([
        {
          type: "CritDmgPct",
          value: 0.005,
          addn: false,
          modType: "global",
          per: { stackable: "fervor" },
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, {
      avgHit: 100,
      critChance: 0.05,
      critDmgMult: 1.5,
      avgHitWithCrit: 102.5,
    });
  });

  test("calculate offense with CritDmgPerFervor and other crit damage modifiers", () => {
    // Base damage: 100
    // Fervor: 100 points * 2% = 200% increased crit rating
    // Crit chance: 0.05 * (1 + 2.0) = 0.15 (15%)
    // CritDmgPerFervor: 0.005 * 100 = 0.5 (50%)
    // CritDmgPct: 0.3 (30%)
    // Total increased crit damage: 0.5 + 0.3 = 0.8 (80%)
    // Crit damage: 1.5 * (1 + 0.8) = 2.7
    // AvgHitWithCrit: 100 * 0.15 * 2.7 + 100 * 0.85 = 40.5 + 85 = 125.5
    const input = createFervorInput({ enabled: true, points: 100 }, [
      affix([
        {
          type: "CritDmgPct",
          value: 0.005,
          addn: false,
          modType: "global",
          per: { stackable: "fervor" },
        },
      ]),
      affix([
        { type: "CritDmgPct", value: 0.3, modType: "global", addn: false },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, {
      avgHit: 100,
      critChance: 0.15,
      critDmgMult: 2.7,
      avgHitWithCrit: 125.5,
    });
  });
});

describe("flat damage to attacks", () => {
  const skillName = "[Test] Simple Attack" as const;

  // Bespoke helper: 100 phys weapon + custom mods
  const createModsInput = (mods: Affix[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customConfiguration: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  // Bespoke helper: no weapon, just flat damage mods
  const createNoWeaponInput = (mods: Affix[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: {}, inventory: [] },
      customConfiguration: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  // Bespoke helper: Frost Spike skill with mods
  const createFrostSpikeInput = (mods: Affix[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customConfiguration: mods,
      skillPage: {
        activeSkills: {
          1: {
            skillName: "Frost Spike" as const,
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
        passiveSkills: {},
      },
    }),
    configuration: defaultConfiguration,
  });

  test("calculate offense with flat physical damage to attacks", () => {
    // Weapon damage: 100
    // Flat damage: 50 (scaled by addedDmgEffPct = 1.0)
    // Total: 100 + 50 = 150
    const input = createModsInput([
      affix([
        {
          type: "FlatDmgToAtks",
          value: { min: 50, max: 50 },
          dmgType: "physical",
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 150 });
  });

  test("calculate offense with flat elemental damage to attacks", () => {
    // Weapon: 100 phys
    // Flat: 20 cold + 30 fire + 10 lightning = 60 elemental
    // Total: 100 + 60 = 160
    const input = createModsInput([
      affix([
        { type: "FlatDmgToAtks", value: { min: 20, max: 20 }, dmgType: "cold" },
      ]),
      affix([
        { type: "FlatDmgToAtks", value: { min: 30, max: 30 }, dmgType: "fire" },
      ]),
      affix([
        {
          type: "FlatDmgToAtks",
          value: { min: 10, max: 10 },
          dmgType: "lightning",
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 160 });
  });

  test("calculate offense with multiple flat damage sources stacking", () => {
    // Weapon: 100 phys
    // Flat: 25 + 25 = 50 phys (stacks additively)
    // Total: 100 + 50 = 150
    const input = createModsInput([
      affix([
        {
          type: "FlatDmgToAtks",
          value: { min: 25, max: 25 },
          dmgType: "physical",
        },
      ]),
      affix([
        {
          type: "FlatDmgToAtks",
          value: { min: 25, max: 25 },
          dmgType: "physical",
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 150 });
  });

  test("calculate offense with flat damage scaled by addedDmgEffPct (Frost Spike)", () => {
    // Frost Spike at level 20 has addedDmgEffPct = 2.01 and WeaponAtkDmgPct = 2.01
    // Weapon damage: 100 * 2.01 = 201 (converted to cold)
    // Flat damage: 100 * 2.01 = 201 (converted to cold)
    // Total: 201 + 201 = 402 cold
    const input = createFrostSpikeInput([
      affix([
        {
          type: "FlatDmgToAtks",
          value: { min: 100, max: 100 },
          dmgType: "physical",
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, "Frost Spike", { avgHit: 402 });
  });

  test("calculate offense with flat damage and % damage modifiers", () => {
    // Weapon: 100 phys
    // Flat: 50 phys
    // Base total: 150
    // After +100% physical: 150 * 2 = 300
    const input = createModsInput([
      affix([
        {
          type: "FlatDmgToAtks",
          value: { min: 50, max: 50 },
          dmgType: "physical",
        },
      ]),
      affix([{ type: "DmgPct", value: 1.0, modType: "physical", addn: false }]), // +100% physical damage
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 300 });
  });

  test("calculate offense with flat damage only (no weapon damage)", () => {
    // No weapon equipped, only flat damage
    // Flat: 100 fire * 1.0 (addedDmgEffPct) = 100
    const input = createNoWeaponInput([
      affix([
        {
          type: "FlatDmgToAtks",
          value: { min: 100, max: 100 },
          dmgType: "fire",
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 100 });
  });

  test("calculate offense with flat erosion damage", () => {
    // Weapon: 100 phys (no bonus)
    // Flat: 50 erosion * 1.5 (50% erosion bonus) = 75
    // Total: 100 + 75 = 175
    const input = createModsInput([
      affix([
        {
          type: "FlatDmgToAtks",
          value: { min: 50, max: 50 },
          dmgType: "erosion",
        },
      ]),
      affix([{ type: "DmgPct", value: 0.5, modType: "erosion", addn: false }]), // +50% erosion damage
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 175 });
  });
});

// Damage Conversion Tests
// Conversion chain: Physical → Lightning → Cold → Fire → Erosion
// Damage can skip steps but never convert backwards
// Converted damage benefits from modifiers of all types it passed through

const emptyDmgRanges = (): DmgRanges => ({
  phys: { min: 0, max: 0 },
  cold: { min: 0, max: 0 },
  lightning: { min: 0, max: 0 },
  fire: { min: 0, max: 0 },
  erosion: { min: 0, max: 0 },
});

const sumPoolRanges = (pools: DmgPools, type: keyof DmgPools) => {
  return pools[type].reduce(
    (acc, p) => ({ min: acc.min + p.range.min, max: acc.max + p.range.max }),
    { min: 0, max: 0 },
  );
};

const findConvertedEntry = (pools: DmgPools, type: keyof DmgPools) => {
  // Find entry with non-zero damage (the converted one, not original zero)
  return pools[type].find((p) => p.range.min > 0 || p.range.max > 0);
};

describe("convertDmg", () => {
  test("no conversion mods - damage passes through unchanged", () => {
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      phys: { min: 100, max: 100 },
    };

    const result = convertDmg(dmgRanges, []);

    expect(sumPoolRanges(result, "physical")).toEqual({ min: 100, max: 100 });
    expect(sumPoolRanges(result, "cold")).toEqual({ min: 0, max: 0 });
    expect(sumPoolRanges(result, "lightning")).toEqual({ min: 0, max: 0 });
    expect(sumPoolRanges(result, "fire")).toEqual({ min: 0, max: 0 });
    expect(sumPoolRanges(result, "erosion")).toEqual({ min: 0, max: 0 });
  });

  test("100% physical to cold conversion", () => {
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      phys: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "cold", value: 1.0 },
    ];

    const result = convertDmg(dmgRanges, mods);

    expect(sumPoolRanges(result, "physical")).toEqual({ min: 0, max: 0 });
    expect(sumPoolRanges(result, "cold")).toEqual({ min: 100, max: 100 });
    // Converted cold should track that it came from physical
    const convertedCold = findConvertedEntry(result, "cold");
    expect(convertedCold?.history).toContain("physical");
  });

  test("50% physical to cold conversion - splits damage", () => {
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      phys: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "cold", value: 0.5 },
    ];

    const result = convertDmg(dmgRanges, mods);

    expect(sumPoolRanges(result, "physical")).toEqual({ min: 50, max: 50 });
    expect(sumPoolRanges(result, "cold")).toEqual({ min: 50, max: 50 });
    // Unconverted phys has no extra mod types
    const unconvertedPhys = findConvertedEntry(result, "physical");
    expect(unconvertedPhys?.history).toEqual([]);
    // Converted cold should track physical
    const convertedCold = findConvertedEntry(result, "cold");
    expect(convertedCold?.history).toContain("physical");
  });

  test("physical splits to multiple types", () => {
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      phys: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "cold", value: 0.3 },
      { type: "ConvertDmgPct", from: "physical", to: "fire", value: 0.5 },
    ];

    const result = convertDmg(dmgRanges, mods);

    // 20% remains as physical (100% - 30% - 50%)
    const physSum = sumPoolRanges(result, "physical");
    expect(physSum.min).toBeCloseTo(20);
    expect(physSum.max).toBeCloseTo(20);
    expect(sumPoolRanges(result, "cold")).toEqual({ min: 30, max: 30 });
    expect(sumPoolRanges(result, "fire")).toEqual({ min: 50, max: 50 });
  });

  test("overconversion (>100%) is prorated", () => {
    // 60% to cold + 60% to fire = 120% total
    // Should prorate to: 50% cold, 50% fire
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      phys: { min: 120, max: 120 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "cold", value: 0.6 },
      { type: "ConvertDmgPct", from: "physical", to: "fire", value: 0.6 },
    ];

    const result = convertDmg(dmgRanges, mods);

    // Proration: 1/1.2 = 0.833...
    // Cold: 120 * 0.6 * (1/1.2) = 60
    // Fire: 120 * 0.6 * (1/1.2) = 60
    // Physical: 0 (all converted)
    expect(sumPoolRanges(result, "physical")).toEqual({ min: 0, max: 0 });
    expect(sumPoolRanges(result, "cold")).toEqual({ min: 60, max: 60 });
    expect(sumPoolRanges(result, "fire")).toEqual({ min: 60, max: 60 });
  });

  test("chain conversion: physical → lightning → cold", () => {
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      phys: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "lightning", value: 1.0 },
      { type: "ConvertDmgPct", from: "lightning", to: "cold", value: 1.0 },
    ];

    const result = convertDmg(dmgRanges, mods);

    expect(sumPoolRanges(result, "physical")).toEqual({ min: 0, max: 0 });
    expect(sumPoolRanges(result, "lightning")).toEqual({ min: 0, max: 0 });
    expect(sumPoolRanges(result, "cold")).toEqual({ min: 100, max: 100 });
    // Cold damage should track both physical and lightning
    const convertedCold = findConvertedEntry(result, "cold");
    expect(convertedCold?.history).toContain("physical");
    expect(convertedCold?.history).toContain("lightning");
  });

  test("chain conversion with partial: physical → lightning (50%) → cold (50%)", () => {
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      phys: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "lightning", value: 0.5 },
      { type: "ConvertDmgPct", from: "lightning", to: "cold", value: 0.5 },
    ];

    const result = convertDmg(dmgRanges, mods);

    // 50 phys remains
    expect(sumPoolRanges(result, "physical")).toEqual({ min: 50, max: 50 });
    // 50 became lightning, 25 of that became cold, 25 remains lightning
    expect(sumPoolRanges(result, "lightning")).toEqual({ min: 25, max: 25 });
    expect(sumPoolRanges(result, "cold")).toEqual({ min: 25, max: 25 });
  });

  test("full chain: physical → lightning → cold → fire → erosion", () => {
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      phys: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "lightning", value: 1.0 },
      { type: "ConvertDmgPct", from: "lightning", to: "cold", value: 1.0 },
      { type: "ConvertDmgPct", from: "cold", to: "fire", value: 1.0 },
      { type: "ConvertDmgPct", from: "fire", to: "erosion", value: 1.0 },
    ];

    const result = convertDmg(dmgRanges, mods);

    expect(sumPoolRanges(result, "physical")).toEqual({ min: 0, max: 0 });
    expect(sumPoolRanges(result, "lightning")).toEqual({ min: 0, max: 0 });
    expect(sumPoolRanges(result, "cold")).toEqual({ min: 0, max: 0 });
    expect(sumPoolRanges(result, "fire")).toEqual({ min: 0, max: 0 });
    expect(sumPoolRanges(result, "erosion")).toEqual({ min: 100, max: 100 });
    // Erosion damage should track all previous types
    const convertedErosion = findConvertedEntry(result, "erosion");
    expect(convertedErosion?.history).toContain("physical");
    expect(convertedErosion?.history).toContain("lightning");
    expect(convertedErosion?.history).toContain("cold");
    expect(convertedErosion?.history).toContain("fire");
  });

  test("original elemental damage is not affected by physical conversion", () => {
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      phys: { min: 100, max: 100 },
      cold: { min: 50, max: 50 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "fire", value: 1.0 },
    ];

    const result = convertDmg(dmgRanges, mods);

    expect(sumPoolRanges(result, "physical")).toEqual({ min: 0, max: 0 });
    expect(sumPoolRanges(result, "fire")).toEqual({ min: 100, max: 100 });
    // Original cold remains unchanged
    expect(sumPoolRanges(result, "cold")).toEqual({ min: 50, max: 50 });
    // Original cold has no extra mods (wasn't converted)
    const originalCold = findConvertedEntry(result, "cold");
    expect(originalCold?.history).toEqual([]);
  });

  test("multiple damage sources combine in pool", () => {
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      phys: { min: 100, max: 100 },
      lightning: { min: 50, max: 50 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "lightning", value: 1.0 },
    ];

    const result = convertDmg(dmgRanges, mods);

    // 100 phys converted to lightning + 50 original lightning
    expect(sumPoolRanges(result, "lightning")).toEqual({ min: 150, max: 150 });
    // Should have 2 entries in lightning pool: converted and original
    expect(result.lightning.length).toBe(2);
  });

  test("skip-step conversion: physical directly to fire", () => {
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      phys: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "fire", value: 1.0 },
    ];

    const result = convertDmg(dmgRanges, mods);

    expect(sumPoolRanges(result, "physical")).toEqual({ min: 0, max: 0 });
    expect(sumPoolRanges(result, "lightning")).toEqual({ min: 0, max: 0 });
    expect(sumPoolRanges(result, "cold")).toEqual({ min: 0, max: 0 });
    expect(sumPoolRanges(result, "fire")).toEqual({ min: 100, max: 100 });
    // Fire should track physical (skipping lightning and cold)
    const convertedFire = findConvertedEntry(result, "fire");
    expect(convertedFire?.history).toContain("physical");
    expect(convertedFire?.history).not.toContain("lightning");
    expect(convertedFire?.history).not.toContain("cold");
  });

  test("damage range min/max are handled correctly", () => {
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      phys: { min: 80, max: 120 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "cold", value: 0.5 },
    ];

    const result = convertDmg(dmgRanges, mods);

    expect(sumPoolRanges(result, "physical")).toEqual({ min: 40, max: 60 });
    expect(sumPoolRanges(result, "cold")).toEqual({ min: 40, max: 60 });
  });

  test("triple overconversion prorates correctly", () => {
    // 50% + 40% + 30% = 120%, should prorate to ~41.67%, ~33.33%, 25%
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      phys: { min: 120, max: 120 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "cold", value: 0.5 },
      { type: "ConvertDmgPct", from: "physical", to: "fire", value: 0.4 },
      { type: "ConvertDmgPct", from: "physical", to: "erosion", value: 0.3 },
    ];

    const result = convertDmg(dmgRanges, mods);

    // Proration factor: 1/1.2 = 0.8333...
    // Cold: 120 * 0.5 * (1/1.2) = 50
    // Fire: 120 * 0.4 * (1/1.2) = 40
    // Erosion: 120 * 0.3 * (1/1.2) = 30
    expect(sumPoolRanges(result, "physical")).toEqual({ min: 0, max: 0 });
    const coldSum = sumPoolRanges(result, "cold");
    expect(coldSum.min).toBeCloseTo(50);
    expect(coldSum.max).toBeCloseTo(50);
    const fireSum = sumPoolRanges(result, "fire");
    expect(fireSum.min).toBeCloseTo(40);
    expect(fireSum.max).toBeCloseTo(40);
    const erosionSum = sumPoolRanges(result, "erosion");
    expect(erosionSum.min).toBeCloseTo(30);
    expect(erosionSum.max).toBeCloseTo(30);
  });

  // AddsDmgAs (Gain as Extra) Tests
  // "Gain as Extra" adds damage without removing from source
  // Calculated BEFORE conversion within each damage type's processing

  test("basic gain as extra - physical to cold", () => {
    // 100 phys with 20% gain as cold
    // Result: 100 phys + 20 cold (source remains intact)
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      phys: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "AddsDmgAs", from: "physical", to: "cold", value: 0.2 },
    ];

    const result = convertDmg(dmgRanges, mods);

    expect(sumPoolRanges(result, "physical")).toEqual({ min: 100, max: 100 });
    expect(sumPoolRanges(result, "cold")).toEqual({ min: 20, max: 20 });
    // Cold gained from physical should track physical in history
    const gainedCold = findConvertedEntry(result, "cold");
    expect(gainedCold?.history).toContain("physical");
  });

  test("gain as extra with conversion - calculated before conversion", () => {
    // 100 phys with 100% phys→fire conversion + 20% phys as cold
    // Gain as extra calculated on original 100 phys BEFORE conversion
    // Result: 0 phys, 100 fire, 20 cold
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      phys: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "AddsDmgAs", from: "physical", to: "cold", value: 0.2 },
      { type: "ConvertDmgPct", from: "physical", to: "fire", value: 1.0 },
    ];

    const result = convertDmg(dmgRanges, mods);

    expect(sumPoolRanges(result, "physical")).toEqual({ min: 0, max: 0 });
    expect(sumPoolRanges(result, "fire")).toEqual({ min: 100, max: 100 });
    expect(sumPoolRanges(result, "cold")).toEqual({ min: 20, max: 20 });
  });

  test("gain as extra with partial conversion", () => {
    // 100 phys with 50% phys→fire conversion + 20% phys as cold
    // Result: 50 phys, 50 fire, 20 cold (total 120)
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      phys: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "AddsDmgAs", from: "physical", to: "cold", value: 0.2 },
      { type: "ConvertDmgPct", from: "physical", to: "fire", value: 0.5 },
    ];

    const result = convertDmg(dmgRanges, mods);

    expect(sumPoolRanges(result, "physical")).toEqual({ min: 50, max: 50 });
    expect(sumPoolRanges(result, "fire")).toEqual({ min: 50, max: 50 });
    expect(sumPoolRanges(result, "cold")).toEqual({ min: 20, max: 20 });
  });

  test("multiple gain as extra mods stack additively", () => {
    // 100 phys with 20% gain as cold + 30% gain as fire
    // Result: 100 phys + 20 cold + 30 fire (total 150)
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      phys: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "AddsDmgAs", from: "physical", to: "cold", value: 0.2 },
      { type: "AddsDmgAs", from: "physical", to: "fire", value: 0.3 },
    ];

    const result = convertDmg(dmgRanges, mods);

    expect(sumPoolRanges(result, "physical")).toEqual({ min: 100, max: 100 });
    expect(sumPoolRanges(result, "cold")).toEqual({ min: 20, max: 20 });
    expect(sumPoolRanges(result, "fire")).toEqual({ min: 30, max: 30 });
  });

  test("gain as extra from converted damage", () => {
    // 100 phys → 100% to lightning → 20% lightning as fire
    // Result: 0 phys, 100 lightning, 20 fire
    // Fire should track both physical and lightning in history
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      phys: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "lightning", value: 1.0 },
      { type: "AddsDmgAs", from: "lightning", to: "fire", value: 0.2 },
    ];

    const result = convertDmg(dmgRanges, mods);

    expect(sumPoolRanges(result, "physical")).toEqual({ min: 0, max: 0 });
    expect(sumPoolRanges(result, "lightning")).toEqual({ min: 100, max: 100 });
    expect(sumPoolRanges(result, "fire")).toEqual({ min: 20, max: 20 });
    // Fire gained from converted lightning should track full history
    const gainedFire = findConvertedEntry(result, "fire");
    expect(gainedFire?.history).toContain("physical");
    expect(gainedFire?.history).toContain("lightning");
  });

  test("gain as extra does not affect original elemental damage", () => {
    // 100 phys + 50 cold, with 20% phys as cold
    // Result: 100 phys, 70 cold (50 original + 20 gained)
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      phys: { min: 100, max: 100 },
      cold: { min: 50, max: 50 },
    };

    const mods: Mod[] = [
      { type: "AddsDmgAs", from: "physical", to: "cold", value: 0.2 },
    ];

    const result = convertDmg(dmgRanges, mods);

    expect(sumPoolRanges(result, "physical")).toEqual({ min: 100, max: 100 });
    expect(sumPoolRanges(result, "cold")).toEqual({ min: 70, max: 70 });
    // Should have 2 cold entries: original (no history) and gained (physical history)
    expect(result.cold.length).toBe(2);
    const originalCold = result.cold.find((c) => c.history.length === 0);
    const gainedCold = result.cold.find((c) => c.history.includes("physical"));
    expect(originalCold?.range).toEqual({ min: 50, max: 50 });
    expect(gainedCold?.range).toEqual({ min: 20, max: 20 });
  });

  test("gain as extra from fire (last in conversion order)", () => {
    // 100 fire with 20% gain as erosion
    // Result: 100 fire + 20 erosion
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      fire: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "AddsDmgAs", from: "fire", to: "erosion", value: 0.2 },
    ];

    const result = convertDmg(dmgRanges, mods);

    expect(sumPoolRanges(result, "fire")).toEqual({ min: 100, max: 100 });
    expect(sumPoolRanges(result, "erosion")).toEqual({ min: 20, max: 20 });
  });

  test("gain as extra from erosion does nothing (not in conversion order)", () => {
    // 100 erosion with 20% gain as fire - should NOT add any fire
    // Erosion is not in CONVERSION_ORDER, so AddsDmgAs from erosion is not processed
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      erosion: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "AddsDmgAs", from: "erosion", to: "fire", value: 0.2 },
    ];

    const result = convertDmg(dmgRanges, mods);

    expect(sumPoolRanges(result, "erosion")).toEqual({ min: 100, max: 100 });
    expect(sumPoolRanges(result, "fire")).toEqual({ min: 0, max: 0 });
  });
});

// Mod normalization tests (per-stack mods like "X per willpower stack")
describe("mod normalization with per-stack mods", () => {
  const skillName = "[Test] Simple Attack" as const;

  // Bespoke helper: 100 phys weapon + custom mods
  const createModsInput = (mods: Affix[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customConfiguration: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  test("DmgPct per willpower normalizes to stacks * value", () => {
    // +10% damage per willpower stack with 5 stacks = +50% damage
    // 100 * (1 + 0.5) = 150
    const input = createModsInput([
      affix([{ type: "MaxWillpowerStacks", value: 5 }]),
      affix([
        {
          type: "DmgPct",
          value: 0.1,
          modType: "global",
          addn: false,
          per: { stackable: "willpower" },
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 150 });
  });

  test("DmgPct per willpower with zero stacks has no effect", () => {
    // +10% damage per willpower stack with 0 stacks = +0% damage
    // 100 * (1 + 0) = 100
    const input = createModsInput([
      affix([
        {
          type: "DmgPct",
          value: 0.1,
          modType: "global",
          addn: false,
          per: { stackable: "willpower" },
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 100 });
  });

  test("DmgPct per willpower stacks with regular DmgPct", () => {
    // +10% damage per willpower (5 stacks = 50%) + 30% regular = 80% total
    // 100 * (1 + 0.5 + 0.3) = 180
    const input = createModsInput([
      affix([{ type: "MaxWillpowerStacks", value: 5 }]),
      affix([
        {
          type: "DmgPct",
          value: 0.1,
          modType: "global",
          addn: false,
          per: { stackable: "willpower" },
        },
      ]),
      affix([{ type: "DmgPct", value: 0.3, modType: "global", addn: false }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 180 });
  });

  test("FlatDmgToAtks per willpower normalizes DmgRange", () => {
    // +10-10 flat phys per willpower stack with 3 stacks = +30-30 flat phys
    // Weapon: 100, Flat: 30, Total: 130
    const input = createModsInput([
      affix([{ type: "MaxWillpowerStacks", value: 3 }]),
      affix([
        {
          type: "FlatDmgToAtks",
          value: { min: 10, max: 10 },
          dmgType: "physical",
          per: { stackable: "willpower" },
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 130 });
  });

  test("CritRatingPct per willpower normalizes correctly", () => {
    // +20% crit rating per willpower stack with 2 stacks = +40% crit rating
    // Crit chance: 0.05 * (1 + 0.4) = 0.07 (7%)
    const input = createModsInput([
      affix([{ type: "MaxWillpowerStacks", value: 2 }]),
      affix([
        {
          type: "CritRatingPct",
          value: 0.2,
          modType: "global",
          per: { stackable: "willpower" },
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { critChance: 0.07 });
  });

  test("multiple per-willpower mods all normalize correctly", () => {
    // With 4 willpower stacks:
    // +5% damage per stack = +20% damage
    // +10% crit rating per stack = +40% crit rating
    // Crit chance: 0.05 * (1 + 0.4) = 0.07
    // Avg hit: 100 * (1 + 0.2) = 120
    const input = createModsInput([
      affix([{ type: "MaxWillpowerStacks", value: 4 }]),
      affix([
        {
          type: "DmgPct",
          value: 0.05,
          modType: "global",
          addn: false,
          per: { stackable: "willpower" },
        },
      ]),
      affix([
        {
          type: "CritRatingPct",
          value: 0.1,
          modType: "global",
          per: { stackable: "willpower" },
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 120, critChance: 0.07 });
  });

  test("per-stack limit caps the effective stack count", () => {
    // +10% damage per willpower stack, limit 3, with 10 stacks
    // Effective stacks: min(10, 3) = 3
    // Damage bonus: 3 * 10% = 30%
    // 100 * (1 + 0.3) = 130
    const input = createModsInput([
      affix([{ type: "MaxWillpowerStacks", value: 10 }]),
      affix([
        {
          type: "DmgPct",
          value: 0.1,
          modType: "global",
          addn: false,
          per: { stackable: "willpower", limit: 3 },
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 130 });
  });

  test("per-stack limit has no effect when stacks below limit", () => {
    // +10% damage per willpower stack, limit 10, with 3 stacks
    // Effective stacks: min(3, 10) = 3
    // Damage bonus: 3 * 10% = 30%
    // 100 * (1 + 0.3) = 130
    const input = createModsInput([
      affix([{ type: "MaxWillpowerStacks", value: 3 }]),
      affix([
        {
          type: "DmgPct",
          value: 0.1,
          modType: "global",
          addn: false,
          per: { stackable: "willpower", limit: 10 },
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 130 });
  });

  test("per-stack valueLimit caps the final computed value", () => {
    // +10% damage per willpower stack, valueLimit 0.25, with 10 stacks
    // Raw value: 10 * 0.1 = 1.0 (100% damage)
    // Capped value: min(1.0, 0.25) = 0.25 (25% damage)
    // 100 * (1 + 0.25) = 125
    const input = createModsInput([
      affix([{ type: "MaxWillpowerStacks", value: 10 }]),
      affix([
        {
          type: "DmgPct",
          value: 0.1,
          modType: "global",
          addn: false,
          per: { stackable: "willpower", valueLimit: 0.25 },
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 125 });
  });

  test("per-stack valueLimit has no effect when value below limit", () => {
    // +10% damage per willpower stack, valueLimit 1.0, with 3 stacks
    // Raw value: 3 * 0.1 = 0.3 (30% damage)
    // Capped value: min(0.3, 1.0) = 0.3 (no cap applied)
    // 100 * (1 + 0.3) = 130
    const input = createModsInput([
      affix([{ type: "MaxWillpowerStacks", value: 3 }]),
      affix([
        {
          type: "DmgPct",
          value: 0.1,
          modType: "global",
          addn: false,
          per: { stackable: "willpower", valueLimit: 1.0 },
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 130 });
  });

  test("per-stack with both limit and valueLimit applies both constraints", () => {
    // +20% damage per willpower stack, limit 5, valueLimit 0.5, with 10 stacks
    // Effective stacks: min(10, 5) = 5
    // Raw value: 5 * 0.2 = 1.0 (100% damage)
    // Capped value: min(1.0, 0.5) = 0.5 (50% damage)
    // 100 * (1 + 0.5) = 150
    const input = createModsInput([
      affix([{ type: "MaxWillpowerStacks", value: 10 }]),
      affix([
        {
          type: "DmgPct",
          value: 0.2,
          modType: "global",
          addn: false,
          per: { stackable: "willpower", limit: 5, valueLimit: 0.5 },
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 150 });
  });

  test("per-stack with amt divides stacks before applying limit", () => {
    // +30% damage per 3 willpower stacks, limit 2, with 10 stacks
    // Effective stack multiplier: min(10/3, 2) = min(3.33, 2) = 2
    // Damage bonus: 2 * 30% = 60%
    // 100 * (1 + 0.6) = 160
    const input = createModsInput([
      affix([{ type: "MaxWillpowerStacks", value: 10 }]),
      affix([
        {
          type: "DmgPct",
          value: 0.3,
          modType: "global",
          addn: false,
          per: { stackable: "willpower", amt: 3, limit: 2 },
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 160 });
  });
});

// Additional damage per stat tests
// The calculator automatically adds +0.5% additional damage per main stat
describe("automatic additional damage from main stats", () => {
  const skillName = "[Test] Simple Attack" as const;

  // Bespoke helper: 100 phys weapon + custom mods
  const createModsInput = (mods: Affix[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customConfiguration: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  // Bespoke helper: Frost Spike skill with mods
  const createFrostSpikeInput = (mods: Affix[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customConfiguration: mods,
      skillPage: {
        activeSkills: {
          1: {
            skillName: "Frost Spike" as const,
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
        passiveSkills: {},
      },
    }),
    configuration: defaultConfiguration,
  });

  test("adds additional damage based on skill main stats", () => {
    // [Test] Simple Attack has main stats: dex, str
    // With 100 dex + 100 str = 200 total main stats
    // Additional damage: 200 * 0.5% = 100% additional (addn/more multiplier)
    // Base: 100, with 100% more = 100 * 2 = 200
    const input = createModsInput([
      affix([{ type: "Stat", statType: "dex", value: 100 }]),
      affix([{ type: "Stat", statType: "str", value: 100 }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 200 });
  });

  test("works with only one main stat type", () => {
    // [Test] Simple Attack has main stats: dex, str
    // With 100 dex only = 100 total main stats
    // Additional damage: 100 * 0.5% = 50% additional
    // Base: 100, with 50% more = 100 * 1.5 = 150
    const input = createModsInput([
      affix([{ type: "Stat", statType: "dex", value: 100 }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 150 });
  });

  test("zero stats has no effect", () => {
    // No stat mods = 0 total main stats
    // Additional damage: 0 * 0.5% = 0% additional
    // Base: 100, with 0% more = 100 * 1 = 100
    const input = createModsInput([]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 100 });
  });

  test("ignores non-main stats", () => {
    // [Test] Simple Attack has main stats: dex, str (NOT int)
    // With 100 int only = 0 main stats counted
    // Additional damage: 0 * 0.5% = 0%
    // Base: 100, with 0% more = 100
    const input = createModsInput([
      affix([{ type: "Stat", statType: "int", value: 100 }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 100 });
  });

  test("uses correct main stats for different skills", () => {
    // Frost Spike has main stats: dex, int (NOT str)
    // With 100 dex + 100 int = 200 total main stats
    // Additional damage: 200 * 0.5% = 100% additional
    // Frost Spike: 100 weapon * 2.01 = 201 phys → converted to cold
    // With 100% more: 201 * 2 = 402
    const input = createFrostSpikeInput([
      affix([{ type: "Stat", statType: "dex", value: 100 }]),
      affix([{ type: "Stat", statType: "int", value: 100 }]),
    ]);
    const results = calculateOffense(input);
    validate(results, "Frost Spike", { avgHit: 402 });
  });

  test("combines with other damage modifiers", () => {
    // [Test] Simple Attack with 100 dex = 50% additional damage
    // Plus 50% increased damage
    // Base: 100, with 50% inc = 150, with 50% more = 150 * 1.5 = 225
    const input = createModsInput([
      affix([{ type: "Stat", statType: "dex", value: 100 }]),
      affix([{ type: "DmgPct", value: 0.5, modType: "global", addn: false }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 225 });
  });
});

// Support skill mods resolution tests
describe("resolveSelectedSkillSupportMods via calculateOffense", () => {
  // Test with haunt, willpower, steamroll, quick decision support skills
  // This verifies that support skills attached to active skills have their mods correctly resolved

  // Helper to create a SkillSlot with support skills
  const createSkillSlotWithSupports = (
    skillName: string,
    supportNames: { name: string; level?: number }[],
  ) => ({
    skillName,
    enabled: true,
    level: 20,
    supportSkills: Object.fromEntries(
      supportNames.map((s, i) => [i + 1, { name: s.name, level: s.level }]),
    ),
  });

  // Base weapon with attack speed for testing
  const weaponWithAspd = {
    equipmentType: "One-Handed Sword" as const,
    baseStats: {
      baseStatLines: [
        {
          text: "100 - 100 physical damage",
          mod: { type: "FlatPhysDmg", value: 100 } as const,
        },
        {
          text: "1.0 attack speed",
          mod: { type: "AttackSpeed", value: 1.0 } as const,
        },
      ],
    },
  };

  test("all four support skills (haunt, willpower, steamroll, quick decision) combine correctly", () => {
    // All at level 20:
    //   Haunt: DmgPct 0.008 (additional/more, global)
    //   Willpower: MaxWillpowerStacks 6, DmgPct 0.06 per stack (increased, global)
    //   Steamroll: AspdPct -0.15 (increased), DmgPct 0.405 (additional, melee)
    //   Quick Decision: AspdAndCspdPct 0.245 (additional/more)
    //
    // Damage calculation:
    //   Base: 100
    //   Willpower (6 * 0.06 = 36% increased): 100 * 1.36 = 136
    //   Haunt (+0.8% more): 136 * 1.008 = 137.088
    //   Steamroll (+40.5% more melee): 137.088 * 1.405 = 192.60864
    //
    // Attack speed calculation:
    //   Base: 1.0
    //   Steamroll (-15% increased): 1.0 * 0.85 = 0.85
    //   Quick Decision (+24.5% more): 0.85 * 1.245 = 1.05825

    const loadout = initLoadout({
      gearPage: {
        equippedGear: { mainHand: weaponWithAspd },
        inventory: [],
      },
      skillPage: {
        activeSkills: {
          1: createSkillSlotWithSupports("[Test] Simple Attack", [
            { name: "Haunt", level: 20 },
            { name: "Willpower", level: 20 },
            { name: "Steamroll", level: 20 },
            { name: "Quick Decision", level: 20 },
          ]),
        },
        passiveSkills: {},
      },
    });

    const results = calculateOffense({
      loadout,
      configuration: defaultConfiguration,
    });

    validate(results, "[Test] Simple Attack", {
      avgHit: 192.60864,
      aspd: 1.05825,
    });
  });

  test("support skills at different levels use correct values", () => {
    // Testing level interpolation:
    //   Quick Decision at level 1: AspdAndCspdPct 0.15 (additional)
    //   Quick Decision at level 40: AspdAndCspdPct 0.345 (additional)
    //
    // Attack speed at level 1: 1.0 * 1.15 = 1.15
    // Attack speed at level 40: 1.0 * 1.345 = 1.345

    const loadoutL1 = initLoadout({
      gearPage: {
        equippedGear: { mainHand: weaponWithAspd },
        inventory: [],
      },
      skillPage: {
        activeSkills: {
          1: createSkillSlotWithSupports("[Test] Simple Attack", [
            { name: "Quick Decision", level: 1 },
          ]),
        },
        passiveSkills: {},
      },
    });

    const loadoutL40 = initLoadout({
      gearPage: {
        equippedGear: { mainHand: weaponWithAspd },
        inventory: [],
      },
      skillPage: {
        activeSkills: {
          1: createSkillSlotWithSupports("[Test] Simple Attack", [
            { name: "Quick Decision", level: 40 },
          ]),
        },
        passiveSkills: {},
      },
    });

    const resultsL1 = calculateOffense({
      loadout: loadoutL1,
      configuration: defaultConfiguration,
    });

    const resultsL40 = calculateOffense({
      loadout: loadoutL40,
      configuration: defaultConfiguration,
    });

    validate(resultsL1, "[Test] Simple Attack", { aspd: 1.15 });
    validate(resultsL40, "[Test] Simple Attack", { aspd: 1.345 });
  });
});

describe("calculateOffense with damage conversion", () => {
  const skillName = "[Test] Simple Attack" as const;

  // Bespoke helper: 100 phys weapon + custom mods
  const createModsInput = (mods: Affix[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customConfiguration: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  // Bespoke helper: Frost Spike skill with mods
  const createFrostSpikeInput = (mods: Affix[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customConfiguration: mods,
      skillPage: {
        activeSkills: {
          1: {
            skillName: "Frost Spike" as const,
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
        passiveSkills: {},
      },
    }),
    configuration: defaultConfiguration,
  });

  test("100% phys to cold conversion - cold gets both phys% and cold% bonuses", () => {
    // 100 phys → 100 cold via conversion
    // Cold now benefits from: 50% physical bonus + 30% cold bonus = 80% inc
    // 100 * (1 + 0.8) = 180
    const input = createModsInput([
      affix([
        { type: "ConvertDmgPct", from: "physical", to: "cold", value: 1 },
      ]),
      affix([{ type: "DmgPct", value: 0.5, modType: "physical", addn: false }]),
      affix([{ type: "DmgPct", value: 0.3, modType: "cold", addn: false }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 180 });
  });

  test("50% phys to cold conversion - unconverted phys gets phys%, converted cold gets both", () => {
    // 100 phys → 50 phys + 50 cold
    // Unconverted phys: 50 * (1 + 0.5) = 75
    // Converted cold: 50 * (1 + 0.5 + 0.3) = 90
    // Total: 75 + 90 = 165
    const input = createModsInput([
      affix([
        { type: "ConvertDmgPct", from: "physical", to: "cold", value: 0.5 },
      ]),
      affix([{ type: "DmgPct", value: 0.5, modType: "physical", addn: false }]),
      affix([{ type: "DmgPct", value: 0.3, modType: "cold", addn: false }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 165 });
  });

  test("chain conversion phys→lightning→cold gets bonuses from all three types", () => {
    // 100 phys → 100 lightning → 100 cold
    // Cold benefits from: 20% physical + 30% lightning + 40% cold = 90% inc
    // 100 * (1 + 0.9) = 190
    const input = createModsInput([
      affix([
        { type: "ConvertDmgPct", from: "physical", to: "lightning", value: 1 },
      ]),
      affix([
        { type: "ConvertDmgPct", from: "lightning", to: "cold", value: 1 },
      ]),
      affix([{ type: "DmgPct", value: 0.2, modType: "physical", addn: false }]),
      affix([
        { type: "DmgPct", value: 0.3, modType: "lightning", addn: false },
      ]),
      affix([{ type: "DmgPct", value: 0.4, modType: "cold", addn: false }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 190 });
  });

  test("elemental bonus applies to converted cold damage", () => {
    // 100 phys → 100 cold
    // Cold benefits from: 50% elemental (applies to cold) = 50% inc
    // 100 * (1 + 0.5) = 150
    const input = createModsInput([
      affix([
        { type: "ConvertDmgPct", from: "physical", to: "cold", value: 1 },
      ]),
      affix([
        { type: "DmgPct", value: 0.5, modType: "elemental", addn: false },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 150 });
  });

  test("no conversion - damage bonuses apply normally by type", () => {
    // 100 phys, no conversion
    // Physical: 100 * (1 + 0.5) = 150
    // Cold bonus doesn't apply (no cold damage)
    const input = createModsInput([
      affix([{ type: "DmgPct", value: 0.5, modType: "physical", addn: false }]),
      affix([{ type: "DmgPct", value: 0.3, modType: "cold", addn: false }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 150 });
  });

  test("Frost Spike skill converts phys to cold via levelMods", () => {
    // Frost Spike has 100% phys→cold conversion from levelMods and 2.01× weapon mult
    // Requires Frost Spike to be in skill slot for levelMods to be resolved
    // 100 phys weapon * 2.01 = 201 phys → 201 cold via skill's conversion
    // Cold damage with 50% cold bonus: 201 * (1 + 0.5) = 301.5
    const input = createFrostSpikeInput([
      affix([{ type: "DmgPct", value: 0.5, modType: "cold", addn: false }]),
    ]);
    const results = calculateOffense(input);
    validate(results, "Frost Spike", { avgHit: 301.5 });
  });
});

// Active skill levelMods resolution tests
describe("resolveSelectedSkillMods via calculateOffense", () => {
  // Helper to create a loadout with Frost Spike in skill slot
  const createFrostSpikeLoadout = (level: number = 20) =>
    initLoadout({
      gearPage: {
        equippedGear: { mainHand: baseWeapon },
        inventory: [],
      },
      skillPage: {
        activeSkills: {
          1: {
            skillName: "Frost Spike",
            enabled: true,
            level,
            supportSkills: {},
          },
        },
        passiveSkills: {},
      },
    });

  test("Frost Spike levelMods are resolved into resolvedMods at level 20", () => {
    // Frost Spike has 5 levelMods:
    // 1. ConvertDmgPct (100% phys → cold)
    // 2. MaxProjectile (5, override: true)
    // 3. Projectile per frostbite_rating (1 per 35 rating) - normalized, per removed
    // 4. Projectile (base 2)
    // 5. DmgPct (8% additional per projectile) - normalized, per removed
    //
    // Note: Mods with `per` property have values normalized (multiplied by stack count)
    // and `per` is removed. Since willpower/frostbite/projectile stacks default to 0,
    // those mods will have value 0 after normalization.
    const results = calculateOffense({
      loadout: createFrostSpikeLoadout(20),
      configuration: defaultConfiguration,
    });
    const actual = results.skills["Frost Spike"];
    if (actual === undefined) throw new Error("Expected actual to be defined");

    const mods = actual.resolvedMods;
    const skillMods = mods.filter((m) => m.src?.includes("Frost Spike Lv.20"));

    // Should have exactly 5 mods from Frost Spike levelMods
    expect(skillMods.length).toBe(5);

    // Check ConvertDmgPct mod
    const convertMod = skillMods
      .filter((m) => m.type === "ConvertDmgPct")
      .find((m) => m.from === "physical" && m.to === "cold");
    expect(convertMod?.value).toBe(1);

    // Check MaxProjectile mod
    const maxProjMod = skillMods.find((m) => m.type === "MaxProjectile");
    expect(maxProjMod?.value).toBe(5);
    expect((maxProjMod as { override?: boolean }).override).toBe(true);

    // Check Projectile mods (2 total: base projectiles and per-frostbite)
    // After normalization, per-frostbite mod has value 0 (no stacks)
    const projMods = skillMods.filter((m) => m.type === "Projectile");
    expect(projMods.length).toBe(2);
    // One should have value 2 (base projectiles)
    expect(projMods.some((m) => m.value === 2)).toBe(true);
    // One should have value 0 (per frostbite_rating with 0 stacks)
    expect(projMods.some((m) => m.value === 0)).toBe(true);

    // Check DmgPct per projectile mod (normalized to 0 with no projectile stacks)
    const dmgPctMod = skillMods.find((m) => m.type === "DmgPct");
    expect(dmgPctMod?.value).toBe(0); // 0.08 * 0 stacks = 0
    expect((dmgPctMod as { addn?: boolean }).addn).toBe(true);
  });

  test("Frost Spike conversion mod affects damage calculation", () => {
    // This verifies the integration: levelMods are resolved AND used in calculation
    // Frost Spike: 100 weapon * 2.01 = 201 phys → converted to 201 cold
    // No bonuses, so avgHit = 201
    const results = calculateOffense({
      loadout: createFrostSpikeLoadout(20),
      configuration: defaultConfiguration,
    });
    const actual = results.skills["Frost Spike"];

    if (actual === undefined) throw new Error("Expected actual to be defined");
    validate(results, "Frost Spike", { avgHit: 201 });

    // Verify the conversion mod is present in resolvedMods
    const convertMod = actual.resolvedMods.find(
      (m) => m.type === "ConvertDmgPct" && m.from === "physical",
    );
    expect(convertMod).toBeDefined();
  });

  test("Frost Spike at level 1 uses level 1 offense values", () => {
    // Frost Spike at level 1 has WeaponAtkDmgPct = 1.49 and AddedDmgEffPct = 1.49
    // 100 weapon * 1.49 = 149 phys → converted to cold
    const results = calculateOffense({
      loadout: createFrostSpikeLoadout(1),
      configuration: defaultConfiguration,
    });
    const actual = results.skills["Frost Spike"];

    if (actual === undefined) throw new Error("Expected actual to be defined");
    validate(results, "Frost Spike", { avgHit: 149 });
  });
});

// Buff skill resolution tests
// Tests for resolveBuffSkillMods - how active skills that provide buffs (like Ice Bond, Bull's Rage)
// interact with SkillEffPct modifiers from support skills (like Mass Effect, Well-Fought Battle)
describe("resolveBuffSkillMods", () => {
  // Helper to create a loadout with buff skills and supports
  const createBuffSkillLoadout = (
    mainSkill: {
      name: string;
      supports?: { name: string; level?: number }[];
      enabled?: boolean;
      level?: number;
    },
    buffSkills: {
      name: string;
      supports?: { name: string; level?: number }[];
      enabled?: boolean;
      level?: number;
    }[] = [],
  ) => {
    const skillSlots: Record<
      number,
      {
        skillName: string;
        enabled: boolean;
        level: number;
        supportSkills: Record<
          number,
          { name: string; level: number } | undefined
        >;
      }
    > = {
      1: {
        skillName: mainSkill.name,
        enabled: mainSkill.enabled ?? true,
        level: mainSkill.level ?? 20,
        supportSkills: Object.fromEntries(
          (mainSkill.supports ?? []).map((s, i) => [
            i + 1,
            { name: s.name, level: s.level ?? 20 },
          ]),
        ),
      },
    };

    buffSkills.forEach((buff, idx) => {
      skillSlots[idx + 2] = {
        skillName: buff.name,
        enabled: buff.enabled ?? true,
        level: buff.level ?? 20,
        supportSkills: Object.fromEntries(
          (buff.supports ?? []).map((s, i) => [
            i + 1,
            { name: s.name, level: s.level ?? 20 },
          ]),
        ),
      };
    });

    return initLoadout({
      gearPage: {
        equippedGear: { mainHand: baseWeapon },
        inventory: [],
      },
      skillPage: {
        activeSkills: skillSlots,
        passiveSkills: {},
      },
    });
  };

  test("Ice Bond provides buff mod when enabled", () => {
    // Ice Bond at level 20 provides: 33% additional cold damage vs frostbitten enemies
    // The buff mod should appear in resolvedMods
    const loadout = createBuffSkillLoadout({ name: "[Test] Simple Attack" }, [
      { name: "Ice Bond", enabled: true },
    ]);

    const results = calculateOffense({
      loadout,
      configuration: frostbittenEnabledConfig,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;
    expect(iceBondBuffMod).toBeDefined();
    expect(iceBondBuffMod?.value).toBeCloseTo(0.33);
  });

  test("Bull's Rage provides buff mod when enabled", () => {
    // Bull's Rage at level 20 provides: 27% additional melee damage
    const loadout = createBuffSkillLoadout({ name: "[Test] Simple Attack" }, [
      { name: "Bull's Rage", enabled: true },
    ]);

    const results = calculateOffense({
      loadout,
      configuration: defaultConfiguration,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    const bullsRageBuffMod = actual?.resolvedMods.find(
      (m) => m.type === "DmgPct" && m.modType === "melee" && m.addn === true,
    ) as DmgPctMod | undefined;
    expect(bullsRageBuffMod).toBeDefined();
    expect(bullsRageBuffMod?.value).toBeCloseTo(0.27);
  });

  test("disabled buff skill does not provide buff mod", () => {
    // When Ice Bond is disabled, it should not contribute its buff
    const loadout = createBuffSkillLoadout({ name: "[Test] Simple Attack" }, [
      { name: "Ice Bond", enabled: false },
    ]);

    const results = calculateOffense({
      loadout,
      configuration: defaultConfiguration,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    );
    expect(iceBondBuffMod).toBeUndefined();
  });

  test("Ice Bond buff mod is excluded when enemyFrobitten condition is disabled", () => {
    // Ice Bond provides +33% cold damage to frostbitten enemies
    // When enemyFrobitten is disabled, this condition is not met so the mod should be filtered out
    const loadout = createBuffSkillLoadout({ name: "[Test] Simple Attack" }, [
      { name: "Ice Bond", enabled: true },
    ]);

    const results = calculateOffense({
      loadout,
      configuration: {
        level: 95,
        fervorEnabled: false,
        fervorPoints: 0,
        enemyFrostbittenEnabled: false,
        enemyFrostbittenPoints: 0,
        crueltyBuffStacks: 40,
        numShadowHits: undefined,
        manaConsumedRecently: undefined,
        unsealedManaWholePct: undefined,
        realmOfMercuryEnabled: false,
        enemyRes: undefined,
        enemyArmor: undefined,
      },
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    );
    expect(iceBondBuffMod).toBeUndefined();
  });

  test("buff skill level affects buff value", () => {
    // Ice Bond at level 1: 23.5% additional cold damage
    // Ice Bond at level 20: 33% additional cold damage
    const loadoutL1 = createBuffSkillLoadout({ name: "[Test] Simple Attack" }, [
      { name: "Ice Bond", level: 1 },
    ]);
    const loadoutL20 = createBuffSkillLoadout(
      { name: "[Test] Simple Attack" },
      [{ name: "Ice Bond", level: 20 }],
    );

    const resultsL1 = calculateOffense({
      loadout: loadoutL1,
      configuration: frostbittenEnabledConfig,
    });
    const resultsL20 = calculateOffense({
      loadout: loadoutL20,
      configuration: frostbittenEnabledConfig,
    });
    const actualL1 = resultsL1.skills["[Test] Simple Attack"];
    const actualL20 = resultsL20.skills["[Test] Simple Attack"];

    const buffModL1 = actualL1?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;
    const buffModL20 = actualL20?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;

    expect(buffModL1?.value).toBeCloseTo(0.235);
    expect(buffModL20?.value).toBeCloseTo(0.33);
  });

  test("Mass Effect increases buff skill effect", () => {
    // Ice Bond at level 20: 33% base
    // Mass Effect at level 20: 20% skill effect per charge, with 2 charges = 40%
    // Expected: 33% * (1 + 0.4) = 46.2%
    const loadout = createBuffSkillLoadout({ name: "[Test] Simple Attack" }, [
      { name: "Ice Bond", supports: [{ name: "Mass Effect" }] },
    ]);

    const results = calculateOffense({
      loadout,
      configuration: frostbittenEnabledConfig,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;
    expect(iceBondBuffMod?.value).toBeCloseTo(0.33 * 1.4);
  });

  test("Well-Fought Battle increases buff skill effect", () => {
    // Ice Bond at level 20: 33% base
    // Well-Fought Battle at level 20: 10% skill effect per use, with 3 uses = 30%
    // Expected: 33% * (1 + 0.3) = 42.9%
    const loadout = createBuffSkillLoadout({ name: "[Test] Simple Attack" }, [
      { name: "Ice Bond", supports: [{ name: "Well-Fought Battle" }] },
    ]);

    const results = calculateOffense({
      loadout,
      configuration: frostbittenEnabledConfig,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;
    expect(iceBondBuffMod?.value).toBeCloseTo(0.33 * 1.3);
  });

  test("Ice Bond and Bull's Rage with Mass Effect and Well-Fought Battle - supports only affect their attached skill", () => {
    // Setup:
    // - Main skill: Frost Spike (melee, cold, 2.01x weapon damage)
    // - Ice Bond with Mass Effect and Well-Fought Battle attached
    // - Bull's Rage with Mass Effect and Well-Fought Battle attached
    //
    // Ice Bond at level 20: 33% base cold damage (modType: "cold")
    // Bull's Rage at level 20: 27% base melee damage (modType: "melee")
    // Mass Effect at level 20: 20% per charge * 2 charges = 40% skill effect
    // Well-Fought Battle at level 20: 10% per use * 3 uses = 30% skill effect
    //
    // Ice Bond buff = 33% * 1.7 = 56.1% additional cold damage
    // Bull's Rage buff = 27% * 1.7 = 45.9% additional melee damage
    //
    // Frost Spike damage calculation:
    // - Base: 100 weapon * 2.01 = 201 phys → converted to 201 cold
    // - Ice Bond buff applies (modType: "cold" matches Frost Spike's cold damage)
    // - Bull's Rage buff applies (modType: "melee" matches Frost Spike's Melee tag)
    // - avgHit = 201 * 1.561 * 1.459 = 457.78
    //
    // Key assertion: Each skill's supports only affect that skill's buff, not other skills
    const loadout = createBuffSkillLoadout({ name: "Frost Spike" }, [
      {
        name: "Ice Bond",
        supports: [{ name: "Mass Effect" }, { name: "Well-Fought Battle" }],
      },
      {
        name: "Bull's Rage",
        supports: [{ name: "Mass Effect" }, { name: "Well-Fought Battle" }],
      },
    ]);

    const results = calculateOffense({
      loadout,
      configuration: frostbittenEnabledConfig,
    });
    const actual = results.skills["Frost Spike"];

    expect(actual).toBeDefined();

    // Check Ice Bond buff
    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;
    expect(iceBondBuffMod?.value).toBeCloseTo(0.33 * 1.7);

    // Check Bull's Rage buff
    const bullsRageBuffMod = actual?.resolvedMods.find(
      (m) => m.type === "DmgPct" && m.modType === "melee" && m.addn === true,
    ) as DmgPctMod | undefined;
    expect(bullsRageBuffMod?.value).toBeCloseTo(0.27 * 1.7);

    // Verify final avgHit includes both Ice Bond's cold buff and Bull's Rage's melee buff
    expect(actual?.avgHit).toBeCloseTo(201 * 1.561 * 1.459);
  });

  test("supports on main skill do not affect buff skills", () => {
    // Setup:
    // - Main skill: [Test] Simple Attack with Mass Effect (should not affect buffs)
    // - Ice Bond without supports
    //
    // Ice Bond should still have its base 33% buff, not affected by main skill's Mass Effect
    const loadout = createBuffSkillLoadout(
      { name: "[Test] Simple Attack", supports: [{ name: "Mass Effect" }] },
      [{ name: "Ice Bond" }],
    );

    const results = calculateOffense({
      loadout,
      configuration: frostbittenEnabledConfig,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;
    // Should be base 33%, not affected by main skill's Mass Effect
    expect(iceBondBuffMod?.value).toBeCloseTo(0.33);
  });

  test("supports on one buff skill do not affect another buff skill", () => {
    // Setup:
    // - Ice Bond with Mass Effect (20% per charge * 2 = 40% skill effect)
    // - Bull's Rage without supports
    //
    // Ice Bond buff = 33% * 1.4 = 46.2%
    // Bull's Rage buff = 27% (no effect from Ice Bond's supports)
    const loadout = createBuffSkillLoadout({ name: "[Test] Simple Attack" }, [
      { name: "Ice Bond", supports: [{ name: "Mass Effect" }] },
      { name: "Bull's Rage" }, // No supports
    ]);

    const results = calculateOffense({
      loadout,
      configuration: frostbittenEnabledConfig,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();

    // Ice Bond should be boosted by Mass Effect
    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;
    expect(iceBondBuffMod?.value).toBeCloseTo(0.33 * 1.4);

    // Bull's Rage should NOT be affected by Ice Bond's Mass Effect
    const bullsRageBuffMod = actual?.resolvedMods.find(
      (m) => m.type === "DmgPct" && m.modType === "melee" && m.addn === true,
    ) as DmgPctMod | undefined;
    expect(bullsRageBuffMod?.value).toBeCloseTo(0.27); // Base value, no boost
  });

  test("multiple SkillEffPct supports stack additively", () => {
    // Setup:
    // - Ice Bond with Mass Effect (40% after normalization) and Well-Fought Battle (30% after normalization)
    //
    // Total skill effect = 40% + 30% = 70%
    // Ice Bond buff = 33% * (1 + 0.7) = 56.1%
    const loadout = createBuffSkillLoadout({ name: "[Test] Simple Attack" }, [
      {
        name: "Ice Bond",
        supports: [{ name: "Mass Effect" }, { name: "Well-Fought Battle" }],
      },
    ]);

    const results = calculateOffense({
      loadout,
      configuration: frostbittenEnabledConfig,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;
    expect(iceBondBuffMod?.value).toBeCloseTo(0.33 * 1.7);
  });

  test("support skill level affects skill effect bonus", () => {
    // Mass Effect at level 1: 10.5% per charge * 2 charges = 21%
    // Mass Effect at level 20: 20% per charge * 2 charges = 40%
    //
    // Ice Bond at level 20: 33% base
    // With Mass Effect L1: 33% * (1 + 0.21) = 39.93%
    // With Mass Effect L20: 33% * (1 + 0.4) = 46.2%
    const loadoutL1 = createBuffSkillLoadout({ name: "[Test] Simple Attack" }, [
      { name: "Ice Bond", supports: [{ name: "Mass Effect", level: 1 }] },
    ]);
    const loadoutL20 = createBuffSkillLoadout(
      { name: "[Test] Simple Attack" },
      [{ name: "Ice Bond", supports: [{ name: "Mass Effect", level: 20 }] }],
    );

    const resultsL1 = calculateOffense({
      loadout: loadoutL1,
      configuration: frostbittenEnabledConfig,
    });
    const resultsL20 = calculateOffense({
      loadout: loadoutL20,
      configuration: frostbittenEnabledConfig,
    });
    const actualL1 = resultsL1.skills["[Test] Simple Attack"];
    const actualL20 = resultsL20.skills["[Test] Simple Attack"];

    const buffModL1 = actualL1?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;
    const buffModL20 = actualL20?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;

    expect(buffModL1?.value).toBeCloseTo(0.33 * 1.21);
    expect(buffModL20?.value).toBeCloseTo(0.33 * 1.4);
  });

  test("passive skill Precise: Cruelty provides additional attack damage scaled by AuraEffPct", () => {
    // Precise: Cruelty at level 20 provides:
    // - Base: 22% additional attack damage
    // - AuraEffPct: 2.5% per cruelty_buff stack, default 40 stacks = 100% aura effect
    // - Final: 22% * (1 + 1.0) = 44%
    const loadout = initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      skillPage: {
        activeSkills: {
          1: {
            skillName: "[Test] Simple Attack",
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
        passiveSkills: {
          1: {
            skillName: "Precise: Cruelty",
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
      },
    });

    const results = calculateOffense({
      loadout,
      configuration: defaultConfiguration,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    const preciseCrueltyBuffMod = actual?.resolvedMods.find(
      (m) => m.type === "DmgPct" && m.modType === "attack" && m.addn === true,
    ) as DmgPctMod | undefined;
    expect(preciseCrueltyBuffMod).toBeDefined();
    // Base 22% scaled by 100% aura effect = 44%
    expect(preciseCrueltyBuffMod?.value).toBeCloseTo(0.22 * 2);
  });

  test("Precise: Cruelty AuraEffPct scales with crueltyBuffStacks config", () => {
    // Precise: Cruelty at level 20 with only 20 stacks:
    // - Base: 22% additional attack damage
    // - AuraEffPct: 2.5% * 20 = 50% aura effect
    // - Final: 22% * (1 + 0.5) = 33%
    const loadout = initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      skillPage: {
        activeSkills: {
          1: {
            skillName: "[Test] Simple Attack",
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
        passiveSkills: {
          1: {
            skillName: "Precise: Cruelty",
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
      },
    });

    const configWith20Stacks: Configuration = {
      ...createDefaultConfiguration(),
      crueltyBuffStacks: 20,
    };

    const results = calculateOffense({
      loadout,
      configuration: configWith20Stacks,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    const preciseCrueltyBuffMod = actual?.resolvedMods.find(
      (m) => m.type === "DmgPct" && m.modType === "attack" && m.addn === true,
    ) as DmgPctMod | undefined;
    expect(preciseCrueltyBuffMod).toBeDefined();
    // Base 22% scaled by 50% aura effect = 33%
    expect(preciseCrueltyBuffMod?.value).toBeCloseTo(0.22 * 1.5);
  });

  test("AuraEffPct from levelMods does not appear in resolvedMods", () => {
    // The AuraEffPct mod from Precise: Cruelty is in levelMods (not levelBuffMods)
    // so it should not be included in the resolvedMods output
    const loadout = initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      skillPage: {
        activeSkills: {
          1: {
            skillName: "[Test] Simple Attack",
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
        passiveSkills: {
          1: {
            skillName: "Precise: Cruelty",
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
      },
    });

    const results = calculateOffense({
      loadout,
      configuration: defaultConfiguration,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    // AuraEffPct from levelMods should not be in resolvedMods
    const auraEffMod = actual?.resolvedMods.find(
      (m) => m.type === "AuraEffPct",
    );
    expect(auraEffMod).toBeUndefined();
  });

  test("AuraEffPct from loadout mods affects Precise: Cruelty", () => {
    // Precise: Cruelty at level 20 provides:
    // - Base: 22% additional attack damage
    // - Own AuraEffPct (addn: true): 2.5% * 40 stacks = 100% multiplicative
    // - Loadout AuraEffPct (addn: false): 50% additive
    // - Aura multiplier: (1 + 0.5) * (1 + 1.0) = 1.5 * 2 = 3
    // - Final: 22% * 3 = 66%
    const loadout = initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customConfiguration: [
        affix([{ type: "AuraEffPct", value: 0.5, addn: false }]),
      ],
      skillPage: {
        activeSkills: {
          1: {
            skillName: "[Test] Simple Attack",
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
        passiveSkills: {
          1: {
            skillName: "Precise: Cruelty",
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
      },
    });

    const results = calculateOffense({
      loadout,
      configuration: defaultConfiguration,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    const preciseCrueltyBuffMod = actual?.resolvedMods.find(
      (m) => m.type === "DmgPct" && m.modType === "attack" && m.addn === true,
    ) as DmgPctMod | undefined;
    expect(preciseCrueltyBuffMod).toBeDefined();
    // Base 22% with aura multiplier 3 = 66%
    expect(preciseCrueltyBuffMod?.value).toBeCloseTo(0.22 * 3);

    // Verify avgHit: 100 base weapon * (1 + 0.66 addn dmg) = 166
    expect(actual?.avgHit).toBeCloseTo(100 * (1 + 0.22 * 3));
  });

  test("AuraEffPct only affects Aura-tagged skills", () => {
    // Bull's Rage is NOT an Aura skill, so it should not be affected by AuraEffPct
    // Even if we somehow had AuraEffPct in the loadout, Bull's Rage buff should remain at base value
    const loadout = createBuffSkillLoadout({ name: "[Test] Simple Attack" }, [
      { name: "Bull's Rage" },
    ]);

    const results = calculateOffense({
      loadout,
      configuration: defaultConfiguration,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    // Bull's Rage at level 20 provides 27% additional melee damage (no aura scaling)
    const bullsRageBuffMod = actual?.resolvedMods.find(
      (m) => m.type === "DmgPct" && m.modType === "melee" && m.addn === true,
    ) as DmgPctMod | undefined;
    expect(bullsRageBuffMod?.value).toBeCloseTo(0.27);
  });
});

describe("Pactspirit Ring Mods", () => {
  test("pactspirit original ring affixes are included in damage calculations", () => {
    // Use a pactspirit slot with an originalAffix (from pactspirit data)
    // The affix provides +50% global damage
    const loadout = initLoadout({
      gearPage: {
        equippedGear: { mainHand: baseWeapon },
        inventory: [],
      },
      skillPage: {
        activeSkills: {
          1: {
            skillName: "[Test] Simple Attack",
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
        passiveSkills: {},
      },
      pactspiritPage: {
        slot1: {
          pactspiritName: "Test Pactspirit",
          level: 1,
          mainAffix: emptyAffix(),
          rings: {
            innerRing1: ringSlotWithOriginalAffix(
              affix([
                { type: "DmgPct", value: 0.5, modType: "global", addn: false },
              ]),
            ),
            innerRing2: emptyRingSlotState(),
            innerRing3: emptyRingSlotState(),
            innerRing4: emptyRingSlotState(),
            innerRing5: emptyRingSlotState(),
            innerRing6: emptyRingSlotState(),
            midRing1: emptyRingSlotState(),
            midRing2: emptyRingSlotState(),
            midRing3: emptyRingSlotState(),
          },
        },
      },
    });

    const results = calculateOffense({
      loadout,
      configuration: defaultConfiguration,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    // 100 base damage * (1 + 0.5) = 150
    expect(actual?.avgHit).toBeCloseTo(150);
  });

  test("multiple pactspirit ring affixes stack additively", () => {
    // Two rings with +30% damage each should add to +60% total
    const loadout = initLoadout({
      gearPage: {
        equippedGear: { mainHand: baseWeapon },
        inventory: [],
      },
      skillPage: {
        activeSkills: {
          1: {
            skillName: "[Test] Simple Attack",
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
        passiveSkills: {},
      },
      pactspiritPage: {
        slot1: {
          pactspiritName: "Test Pactspirit",
          level: 1,
          mainAffix: emptyAffix(),
          rings: {
            innerRing1: ringSlotWithOriginalAffix(
              affix([
                { type: "DmgPct", value: 0.3, modType: "global", addn: false },
              ]),
            ),
            innerRing2: ringSlotWithOriginalAffix(
              affix([
                { type: "DmgPct", value: 0.3, modType: "global", addn: false },
              ]),
            ),
            innerRing3: emptyRingSlotState(),
            innerRing4: emptyRingSlotState(),
            innerRing5: emptyRingSlotState(),
            innerRing6: emptyRingSlotState(),
            midRing1: emptyRingSlotState(),
            midRing2: emptyRingSlotState(),
            midRing3: emptyRingSlotState(),
          },
        },
      },
    });

    const results = calculateOffense({
      loadout,
      configuration: defaultConfiguration,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    // 100 base damage * (1 + 0.3 + 0.3) = 160
    expect(actual?.avgHit).toBeCloseTo(160);
  });

  test("installed destiny affix overrides original affix", () => {
    // A ring with an installed destiny should use the destiny's affix, not the original
    // originalAffix is +25% but installedDestiny.affix is +75%, should use +75%
    const loadout = initLoadout({
      gearPage: {
        equippedGear: { mainHand: baseWeapon },
        inventory: [],
      },
      skillPage: {
        activeSkills: {
          1: {
            skillName: "[Test] Simple Attack",
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
        passiveSkills: {},
      },
      pactspiritPage: {
        slot1: {
          pactspiritName: "Test Pactspirit",
          level: 1,
          mainAffix: emptyAffix(),
          rings: {
            innerRing1: {
              installedDestiny: {
                destinyName: "Test Destiny",
                destinyType: "Micro Fate",
                affix: affix([
                  {
                    type: "DmgPct",
                    value: 0.75,
                    modType: "global",
                    addn: false,
                  },
                ]),
              },
              originalRingName: "Test Ring",
              originalAffix: affix([
                { type: "DmgPct", value: 0.25, modType: "global", addn: false },
              ]),
            },
            innerRing2: emptyRingSlotState(),
            innerRing3: emptyRingSlotState(),
            innerRing4: emptyRingSlotState(),
            innerRing5: emptyRingSlotState(),
            innerRing6: emptyRingSlotState(),
            midRing1: emptyRingSlotState(),
            midRing2: emptyRingSlotState(),
            midRing3: emptyRingSlotState(),
          },
        },
      },
    });

    const results = calculateOffense({
      loadout,
      configuration: defaultConfiguration,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    // 100 base damage * (1 + 0.75 from destiny, NOT 0.25 from original) = 175
    expect(actual?.avgHit).toBeCloseTo(175);
  });

  test("rings from multiple pactspirit slots contribute to damage", () => {
    // Rings from slot1 and slot2 should both contribute
    const loadout = initLoadout({
      gearPage: {
        equippedGear: { mainHand: baseWeapon },
        inventory: [],
      },
      skillPage: {
        activeSkills: {
          1: {
            skillName: "[Test] Simple Attack",
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
        passiveSkills: {},
      },
      pactspiritPage: {
        slot1: {
          pactspiritName: "Test Pactspirit 1",
          level: 1,
          mainAffix: emptyAffix(),
          rings: {
            innerRing1: ringSlotWithOriginalAffix(
              affix([
                { type: "DmgPct", value: 0.2, modType: "global", addn: false },
              ]),
            ),
            innerRing2: emptyRingSlotState(),
            innerRing3: emptyRingSlotState(),
            innerRing4: emptyRingSlotState(),
            innerRing5: emptyRingSlotState(),
            innerRing6: emptyRingSlotState(),
            midRing1: emptyRingSlotState(),
            midRing2: emptyRingSlotState(),
            midRing3: emptyRingSlotState(),
          },
        },
        slot2: {
          pactspiritName: "Test Pactspirit 2",
          level: 1,
          mainAffix: emptyAffix(),
          rings: {
            innerRing1: ringSlotWithOriginalAffix(
              affix([
                { type: "DmgPct", value: 0.3, modType: "global", addn: false },
              ]),
            ),
            innerRing2: emptyRingSlotState(),
            innerRing3: emptyRingSlotState(),
            innerRing4: emptyRingSlotState(),
            innerRing5: emptyRingSlotState(),
            innerRing6: emptyRingSlotState(),
            midRing1: emptyRingSlotState(),
            midRing2: emptyRingSlotState(),
            midRing3: emptyRingSlotState(),
          },
        },
      },
    });

    const results = calculateOffense({
      loadout,
      configuration: defaultConfiguration,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    // 100 base damage * (1 + 0.2 + 0.3) = 150
    expect(actual?.avgHit).toBeCloseTo(150);
  });
});

describe("Divinity Slate Mods", () => {
  test("placed divinity slate affixes are included in damage calculations", () => {
    const loadout = initLoadout({
      gearPage: {
        equippedGear: { mainHand: baseWeapon },
        inventory: [],
      },
      skillPage: {
        activeSkills: {
          1: {
            skillName: "[Test] Simple Attack",
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
        passiveSkills: {},
      },
      divinityPage: {
        placedSlates: [{ slateId: "slate-1", position: { row: 2, col: 2 } }],
        inventory: [
          {
            id: "slate-1",
            shape: "Single",
            rotation: 0,
            flippedH: false,
            flippedV: false,
            affixes: [
              affix([
                { type: "DmgPct", value: 0.5, modType: "global", addn: false },
              ]),
            ],
            metaAffixes: [],
          },
        ],
      },
    });

    const results = calculateOffense({
      loadout,
      configuration: defaultConfiguration,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    // 100 base damage * (1 + 0.5) = 150
    expect(actual?.avgHit).toBeCloseTo(150);
  });

  test("only placed slates contribute to damage, not inventory-only slates", () => {
    const loadout = initLoadout({
      gearPage: {
        equippedGear: { mainHand: baseWeapon },
        inventory: [],
      },
      skillPage: {
        activeSkills: {
          1: {
            skillName: "[Test] Simple Attack",
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
        passiveSkills: {},
      },
      divinityPage: {
        placedSlates: [], // No slates placed
        inventory: [
          {
            id: "slate-1",
            shape: "Single",
            rotation: 0,
            flippedH: false,
            flippedV: false,
            affixes: [
              affix([
                { type: "DmgPct", value: 0.5, modType: "global", addn: false },
              ]),
            ],
            metaAffixes: [],
          },
        ],
      },
    });

    const results = calculateOffense({
      loadout,
      configuration: defaultConfiguration,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    // 100 base damage * 1 = 100 (no bonus from unplaced slate)
    expect(actual?.avgHit).toBeCloseTo(100);
  });

  test("multiple placed slates stack additively", () => {
    const loadout = initLoadout({
      gearPage: {
        equippedGear: { mainHand: baseWeapon },
        inventory: [],
      },
      skillPage: {
        activeSkills: {
          1: {
            skillName: "[Test] Simple Attack",
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
        passiveSkills: {},
      },
      divinityPage: {
        placedSlates: [
          { slateId: "slate-1", position: { row: 2, col: 2 } },
          { slateId: "slate-2", position: { row: 3, col: 3 } },
        ],
        inventory: [
          {
            id: "slate-1",
            shape: "Single",
            rotation: 0,
            flippedH: false,
            flippedV: false,
            affixes: [
              affix([
                { type: "DmgPct", value: 0.3, modType: "global", addn: false },
              ]),
            ],
            metaAffixes: [],
          },
          {
            id: "slate-2",
            shape: "Single",
            rotation: 0,
            flippedH: false,
            flippedV: false,
            affixes: [
              affix([
                { type: "DmgPct", value: 0.2, modType: "global", addn: false },
              ]),
            ],
            metaAffixes: [],
          },
        ],
      },
    });

    const results = calculateOffense({
      loadout,
      configuration: defaultConfiguration,
    });
    const actual = results.skills["[Test] Simple Attack"];

    expect(actual).toBeDefined();
    // 100 base damage * (1 + 0.3 + 0.2) = 150
    expect(actual?.avgHit).toBeCloseTo(150);
  });
});

describe("shadow damage", () => {
  // Shadow damage mechanics:
  // - First shadow deals 100% of original hit damage
  // - Each subsequent shadow deals 30% of the previous shadow's damage
  // - Shadow damage bonuses only apply to shadow hits, not the original hit
  //
  // Frost Spike at level 20: WeaponAtkDmgPct = 2.01
  // Base weapon 100 * 2.01 = 201 base damage

  const createShadowConfig = (numShadowHits: number) => {
    const config = createDefaultConfiguration();
    config.numShadowHits = numShadowHits;
    return config;
  };

  // Bespoke helper: Frost Spike (Shadow Strike skill) with shadow config
  const createFrostSpikeInput = (
    numShadowHits: number,
    mods: Affix[] = [],
  ) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customConfiguration: mods,
      skillPage: {
        activeSkills: {
          1: {
            skillName: "Frost Spike" as const,
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
        passiveSkills: {},
      },
    }),
    configuration: createShadowConfig(numShadowHits),
  });

  // Bespoke helper: Simple Attack (non-Shadow Strike skill) with shadow config
  const createSimpleAttackInput = (
    numShadowHits: number,
    mods: Affix[] = [],
  ) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customConfiguration: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: createShadowConfig(numShadowHits),
  });

  test("shadow strike skill with 1 shadow hit doubles damage", () => {
    // 1 shadow hit = 100% additional damage (doubles the hit)
    const input = createFrostSpikeInput(1);
    const results = calculateOffense(input);
    // Base: 100 * 2.01 = 201
    // With 1 shadow hit: 201 * (1 + 1.0) = 402
    validate(results, "Frost Spike", { avgHit: 402 });
  });

  test("shadow strike skill with 3 shadow hits applies geometric falloff", () => {
    // 3 shadow hits: 1 + 0.3 + 0.09 = 1.39 total shadow damage ratio
    const input = createFrostSpikeInput(3);
    const results = calculateOffense(input);
    // Base: 201
    // Shadow geometric sum: (1 - 0.3^3) / 0.7 ≈ 1.39
    // Total: 201 * (1 + 1.39) ≈ 480.39
    validate(results, "Frost Spike", { avgHit: 480.39 });
  });

  test("shadow damage bonus applies to shadow hits only", () => {
    // 100% shadow damage bonus with 3 shadows
    // Shadow damage gets multiplied by 2, original hit does not
    const input = createFrostSpikeInput(3, [
      affix([{ type: "ShadowDmgPct", value: 1.0, addn: false }]), // +100% shadow damage
    ]);
    const results = calculateOffense(input);
    // Base: 201
    // Shadow contribution: 1.39 * 2 (100% bonus) = 2.78
    // Total: 201 * (1 + 2.78) ≈ 759.78
    validate(results, "Frost Spike", { avgHit: 759.78 });
  });

  test("zero shadow hits means no shadow damage bonus", () => {
    const input = createFrostSpikeInput(0);
    const results = calculateOffense(input);
    // Base: 201 (no shadow damage)
    validate(results, "Frost Spike", { avgHit: 201 });
  });

  test("non-shadow strike skill ignores shadow mechanics", () => {
    // [Test] Simple Attack does not have Shadow Strike tag
    const input = createSimpleAttackInput(3, [
      affix([{ type: "ShadowDmgPct", value: 1.0, addn: false }]), // This should have no effect
    ]);
    const results = calculateOffense(input);
    // Base: 100 (no shadow mechanics applied)
    validate(results, "[Test] Simple Attack", { avgHit: 100 });
  });

  test("shadow damage stacks with regular damage modifiers", () => {
    // +50% global damage AND 3 shadow hits with 100% shadow bonus
    const input = createFrostSpikeInput(3, [
      affix([{ type: "DmgPct", value: 0.5, modType: "global", addn: false }]), // +50% damage
      affix([{ type: "ShadowDmgPct", value: 1.0, addn: false }]), // +100% shadow damage
    ]);
    const results = calculateOffense(input);
    // Base with +50% dmg: 201 * 1.5 = 301.5
    // Shadow contribution: 1.39 * 2 = 2.78
    // Total: 301.5 * (1 + 2.78) ≈ 1139.67
    validate(results, "Frost Spike", { avgHit: 1139.67 });
  });

  test("ShadowQuant mods contribute to shadow hit count", () => {
    // +2 Shadow Quantity from mod - uses default config with 0 shadow hits
    const input = {
      loadout: initLoadout({
        gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
        customConfiguration: [affix([{ type: "ShadowQuant", value: 2 }])],
        skillPage: {
          activeSkills: {
            1: {
              skillName: "Frost Spike" as const,
              enabled: true,
              level: 20,
              supportSkills: {},
            },
          },
          passiveSkills: {},
        },
      }),
      configuration: defaultConfiguration,
    };
    const results = calculateOffense(input);
    // Base: 201
    // 2 shadow hits: geometric sum = (1 - 0.3^2) / 0.7 = 0.91 / 0.7 = 1.3
    // Total: 201 * (1 + 1.3) = 462.3
    validate(results, "Frost Spike", { avgHit: 462.3 });
  });
});

// Resistance and Armor Penetration tests
describe("penetration", () => {
  const skillName = "[Test] Simple Attack" as const;

  interface PenConfigInput {
    enemyRes?: number;
    enemyArmor?: number;
  }

  const createPenetrationConfig = (input: PenConfigInput = {}) => {
    const config = createDefaultConfiguration();
    const { enemyRes, enemyArmor } = input;
    if (enemyRes !== undefined) config.enemyRes = enemyRes;
    if (enemyArmor !== undefined) config.enemyArmor = enemyArmor;
    return config;
  };

  // Bespoke input for penetration tests with configurable damage type
  const createDmgInput = (
    dmg: number,
    modType: "physical" | "cold" | "erosion",
    options: { mods?: Affix[]; res?: number; armor?: number } = {},
  ) => {
    const weapon =
      modType === "physical"
        ? baseWeapon
        : {
            ...baseWeapon,
            base_affixes: [
              affix([
                { type: "FlatGearDmg", modType, value: { min: dmg, max: dmg } },
                { type: "GearPhysDmgPct", value: -1 },
              ]),
            ],
          };
    return {
      loadout: initLoadout({
        gearPage: { equippedGear: { mainHand: weapon }, inventory: [] },
        customConfiguration: options.mods ?? [],
        skillPage: simpleAttackSkillPage(),
      }),
      configuration: createPenetrationConfig({
        enemyRes: options.res,
        enemyArmor: options.armor,
      }),
    };
  };

  test("cold penetration counters cold resistance", () => {
    // 30% resistance, 10% penetration -> effective 20% resistance
    // 100 cold * (1 - 0.3 + 0.1) = 80
    const input = createDmgInput(100, "cold", {
      mods: [affix([{ type: "ResPenPct", value: 0.1, penType: "cold" }])],
      res: 0.3,
    });
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 80 });
  });

  test("elemental penetration applies to all elemental types", () => {
    // 30% res, 10% elemental pen -> 20% effective res
    const input = createDmgInput(100, "cold", {
      mods: [affix([{ type: "ResPenPct", value: 0.1, penType: "elemental" }])],
      res: 0.3,
    });
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 80 });
  });

  test("all penetration applies to erosion", () => {
    // erosion damage with "all" penetration
    const input = createDmgInput(100, "erosion", {
      mods: [affix([{ type: "ResPenPct", value: 0.1, penType: "all" }])],
      res: 0.3,
    });
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 80 });
  });

  test("penetration stacks additively", () => {
    // 30% res, 5% cold pen + 5% elemental pen = 10% total pen
    const input = createDmgInput(100, "cold", {
      mods: [
        affix([{ type: "ResPenPct", value: 0.05, penType: "cold" }]),
        affix([{ type: "ResPenPct", value: 0.05, penType: "elemental" }]),
      ],
      res: 0.3,
    });
    const results = calculateOffense(input);
    // 100 * (1 - 0.3 + 0.1) = 80
    validate(results, skillName, { avgHit: 80 });
  });

  test("wrong penetration type does not apply", () => {
    // cold damage with fire penetration - should not help
    const input = createDmgInput(100, "cold", {
      mods: [affix([{ type: "ResPenPct", value: 0.1, penType: "fire" }])],
      res: 0.3,
    });
    const results = calculateOffense(input);
    // 100 * (1 - 0.3) = 70 (pen doesn't apply)
    validate(results, skillName, { avgHit: 70 });
  });

  test("penetration exceeding resistance deals bonus damage", () => {
    // 10% resistance, 30% penetration -> -20% effective resistance = 120% damage
    const input = createDmgInput(100, "cold", {
      mods: [affix([{ type: "ResPenPct", value: 0.3, penType: "cold" }])],
      res: 0.1,
    });
    const results = calculateOffense(input);
    // 100 * (1 - 0.1 + 0.3) = 100 * 1.2 = 120
    validate(results, skillName, { avgHit: 120 });
  });

  test("armor reduces physical damage", () => {
    // Formula: armor / (0.9 * armor + 30000)
    // With 27273 armor: 27273 / (0.9 * 27273 + 30000) = 27273 / 54545.7 ≈ 0.5 (50%)
    const input = createDmgInput(100, "physical", { armor: 27273 });
    const results = calculateOffense(input);
    // 100 phys * (1 - 0.5) = 50
    validate(results, skillName, { avgHit: 50 });
  });

  test("armor reduces non-physical damage at 60% rate", () => {
    // Non-physical mitigation = physical mitigation * 0.6
    // With 27273 armor: 50% phys reduction -> 30% non-phys reduction
    const input = createDmgInput(100, "cold", { armor: 27273, res: 0 });
    const results = calculateOffense(input);
    // 100 cold * (1 - 0.3) = 70
    validate(results, skillName, { avgHit: 70 });
  });

  test("armor penetration reduces physical damage mitigation", () => {
    // 50% armor mitigation, 10% armor pen -> 40% effective mitigation
    const input = createDmgInput(100, "physical", {
      mods: [affix([{ type: "ArmorPenPct", value: 0.1 }])],
      armor: 27273,
    });
    const results = calculateOffense(input);
    // 100 phys * (1 - 0.5 + 0.1) = 60
    validate(results, skillName, { avgHit: 60 });
  });

  test("armor penetration reduces non-physical damage mitigation equally", () => {
    // 30% non-phys armor mitigation, 10% armor pen -> 20% effective
    const input = createDmgInput(100, "cold", {
      mods: [affix([{ type: "ArmorPenPct", value: 0.1 }])],
      armor: 27273,
      res: 0,
    });
    const results = calculateOffense(input);
    // 100 cold * (1 - 0.3 + 0.1) = 80
    validate(results, skillName, { avgHit: 80 });
  });

  test("armor penetration stacks additively", () => {
    // 50% armor mitigation, 5% + 5% armor pen -> 40% effective
    const input = createDmgInput(100, "physical", {
      mods: [
        affix([{ type: "ArmorPenPct", value: 0.05 }]),
        affix([{ type: "ArmorPenPct", value: 0.05 }]),
      ],
      armor: 27273,
    });
    const results = calculateOffense(input);
    // 100 phys * (1 - 0.5 + 0.1) = 60
    validate(results, skillName, { avgHit: 60 });
  });

  test("elemental damage affected by both resistance and armor", () => {
    // Cold damage: 30% resistance, 30% armor mitigation (non-phys at 60% of 50%)
    // Damage = 100 * (1 - res) * (1 - armor_nonphys)
    // Damage = 100 * (1 - 0.3) * (1 - 0.3) = 100 * 0.7 * 0.7 = 49
    const input = createDmgInput(100, "cold", { armor: 27273, res: 0.3 });
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 49 });
  });

  test("penetration reduces both resistance and armor effects", () => {
    // 30% res with 10% pen -> 20% res, 30% armor with 10% pen -> 20% armor
    // Damage = 100 * (1 - 0.2) * (1 - 0.2) = 100 * 0.8 * 0.8 = 64
    const input = createDmgInput(100, "cold", {
      mods: [
        affix([{ type: "ResPenPct", value: 0.1, penType: "cold" }]),
        affix([{ type: "ArmorPenPct", value: 0.1 }]),
      ],
      armor: 27273,
      res: 0.3,
    });
    const results = calculateOffense(input);
    // 100 * (1 - 0.3 + 0.1) * (1 - 0.3 + 0.1) = 100 * 0.8 * 0.8 = 64
    validate(results, skillName, { avgHit: 64 });
  });

  test("physical damage only affected by armor, not resistance", () => {
    // Physical damage should ignore elemental resistance
    const input = createDmgInput(100, "physical", { armor: 27273, res: 0.3 });
    const results = calculateOffense(input);
    // 100 phys * (1 - 0.5) = 50 (resistance doesn't apply)
    validate(results, skillName, { avgHit: 50 });
  });
});

describe("double damage chance", () => {
  const skillName = "[Test] Simple Attack" as const;

  // Weapon with attack speed for DPS calculations
  const weaponWithAspd = {
    equipmentType: "One-Handed Sword" as const,
    baseStats: {
      baseStatLines: [
        {
          text: "100 - 100 physical damage",
          mod: { type: "FlatPhysDmg", value: 100 } as const,
        },
        {
          text: "1.0 attack speed",
          mod: { type: "AttackSpeed", value: 1.0 } as const,
        },
      ],
    },
  };

  const createDoubleDmgInput = (mods: Affix[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: weaponWithAspd }, inventory: [] },
      customConfiguration: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  test("30% double damage chance increases avgDps by 30%", () => {
    // Base: 100 damage, 1.0 aspd, no crit
    // avgHit = 100
    // avgHitWithCrit = 100 * 0.05 * 1.5 + 100 * 0.95 = 7.5 + 95 = 102.5
    // doubleDmgMult = 1 + 0.30 = 1.30
    // avgDps = 102.5 * 1.30 * 1.0 = 133.25
    const input = createDoubleDmgInput([
      affix([{ type: "DoubleDmgChancePct", value: 0.3 }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgDps: 133.25 });
  });

  test("multiple double damage chance sources stack additively", () => {
    // 20% + 15% = 35% total double damage chance
    // avgHitWithCrit = 102.5 (same as above)
    // doubleDmgMult = 1 + 0.35 = 1.35
    // avgDps = 102.5 * 1.35 * 1.0 = 138.375
    const input = createDoubleDmgInput([
      affix([{ type: "DoubleDmgChancePct", value: 0.2 }]),
      affix([{ type: "DoubleDmgChancePct", value: 0.15 }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgDps: 138.375 });
  });

  test("double damage chance caps at 100%", () => {
    // 70% + 50% = 120%, but capped at 100%
    // avgHitWithCrit = 102.5
    // doubleDmgMult = 1 + 1.0 = 2.0 (capped)
    // avgDps = 102.5 * 2.0 * 1.0 = 205
    const input = createDoubleDmgInput([
      affix([{ type: "DoubleDmgChancePct", value: 0.7 }]),
      affix([{ type: "DoubleDmgChancePct", value: 0.5 }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgDps: 205 });
  });

  test("no double damage mod results in no DPS multiplier", () => {
    // No double damage mods
    // avgHitWithCrit = 102.5
    // doubleDmgMult = 1.0
    // avgDps = 102.5 * 1.0 * 1.0 = 102.5
    const input = createDoubleDmgInput([]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgDps: 102.5 });
  });
});

describe("resource pool: mana and mercury pts", () => {
  const skillName = "[Test] Simple Attack" as const;

  // Cold damage weapon for testing elemental damage scaling
  const coldWeapon = {
    equipmentType: "One-Handed Sword" as const,
    baseStats: {
      baseStatLines: [
        {
          text: "100 - 100 cold damage",
          mod: { type: "FlatPhysDmg", value: 0 } as const,
        },
      ],
    },
    base_affixes: [
      {
        affixLines: [
          {
            text: "100 cold damage",
            mods: [
              {
                type: "FlatGearDmg",
                value: { min: 100, max: 100 },
                modType: "cold",
              } as const,
            ],
          },
        ],
      },
    ],
  };

  // Base mana at level 95 = 40 + 95*5 = 515
  // Add 485 flat mana → 1000 total mana
  const flatManaTo1000 = { type: "MaxMana", value: 485 } as const;

  const createInput = (mods: Affix[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: coldWeapon }, inventory: [] },
      customConfiguration: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  test("mercury pts scale from max mana", () => {
    // 1000 mana
    // MaxMercuryPtsPct: 1.0 per 1000 mana → 100% bonus → 200 mercury pts
    // DmgPct: 0.01 per mercury pt → 200 * 0.01 = 2.0 (200% more) → 3x
    // 100 cold * 3 = 300
    const input = createInput([
      affix([
        flatManaTo1000,
        {
          type: "MaxMercuryPtsPct",
          value: 1.0,
          per: { stackable: "max_mana", amt: 1000 },
        },
        {
          type: "DmgPct",
          value: 0.01,
          modType: "cold",
          addn: true,
          per: { stackable: "mercury_pt" },
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 300 });
  });

  test("mercury pts scale linearly with more mana", () => {
    // 2000 mana (add 1485 instead of 485)
    // MaxMercuryPtsPct: 1.0 per 1000 mana → 200% bonus → 300 mercury pts
    // DmgPct: 0.01 per mercury pt → 300 * 0.01 = 3.0 (300% more) → 4x
    // 100 cold * 4 = 400
    const input = createInput([
      affix([
        { type: "MaxMana", value: 1485 },
        {
          type: "MaxMercuryPtsPct",
          value: 1.0,
          per: { stackable: "max_mana", amt: 1000 },
        },
        {
          type: "DmgPct",
          value: 0.01,
          modType: "cold",
          addn: true,
          per: { stackable: "mercury_pt" },
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 400 });
  });

  test("mercury pts respect valueLimit cap", () => {
    // 2000 mana, but mercury pts capped at 50% bonus
    // MaxMercuryPtsPct: 1.0 per 1000 mana, valueLimit 0.5 → capped at 50% → 150 mercury pts
    // DmgPct: 0.01 per mercury pt → 150 * 0.01 = 1.5 (150% more) → 2.5x
    // 100 cold * 2.5 = 250
    const input = createInput([
      affix([
        { type: "MaxMana", value: 1485 },
        {
          type: "MaxMercuryPtsPct",
          value: 1.0,
          per: { stackable: "max_mana", amt: 1000, valueLimit: 0.5 },
        },
        {
          type: "DmgPct",
          value: 0.01,
          modType: "cold",
          addn: true,
          per: { stackable: "mercury_pt" },
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 250 });
  });

  test("multiple more multipliers from mana and mercury pts", () => {
    // 1000 mana → 200 mercury pts (same as first test)
    // DmgPct per mercury: 0.01 * 200 = 2.0 → 3x
    // Additional DmgPct per mana: 0.001 * 1000 = 1.0 → 2x
    // Combined more multipliers: 3 * 2 = 6x
    // 100 cold * 6 = 600
    const input = createInput([
      affix([
        flatManaTo1000,
        {
          type: "MaxMercuryPtsPct",
          value: 1.0,
          per: { stackable: "max_mana", amt: 1000 },
        },
        {
          type: "DmgPct",
          value: 0.01,
          modType: "cold",
          addn: true,
          per: { stackable: "mercury_pt" },
        },
        {
          type: "DmgPct",
          value: 0.001,
          modType: "cold",
          addn: true,
          per: { stackable: "max_mana" },
        },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 600 });
  });
});
