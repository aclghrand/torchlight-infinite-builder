import { describe, expect, test } from "vitest";

import type { ImplementedActiveSkillName } from "../../data/skill";
import {
  type Affix,
  type AffixLine,
  type Configuration,
  DEFAULT_CONFIGURATION,
  type DmgRange,
  type Loadout,
  type SupportAffix,
} from "../core";
import type { Mod } from "../mod";
import { buildSupportSkillAffixes } from "../storage/load-save";
import {
  calculateOffense,
  convertDmg,
  type DmgPools,
  type DmgRanges,
  type OffenseResults,
  type WeaponAttackSummary,
} from "./offense";
import type { OffenseSkillName } from "./skill-confs";

type DmgPctMod = Extract<Mod, { type: "DmgPct" }>;

// Test-specific defaults: override some values for easier testing
// (e.g., set resistances to 0 so tests don't need to account for defaults)
const createDefaultConfiguration = (): Configuration => ({
  ...DEFAULT_CONFIGURATION,
  crueltyBuffStacks: undefined,
  focusBlessings: 0,
  agilityBlessings: 0,
  tenacityBlessings: 0,
  enemyColdRes: 0,
  enemyLightningRes: 0,
  enemyFireRes: 0,
  enemyErosionRes: 0,
  enemyArmor: 0,
});

// Helper to create Affix objects from mods for tests
const affix = (mods: Mod[]): Affix => ({
  affixLines: mods.map((mod) => ({ text: "", mods: [mod] })),
});

// Helper to create AffixLine[] from mods for customAffixLines
const affixLines = (mods: Mod[]): AffixLine[] =>
  mods.map((mod) => ({ text: "", mods: [mod] }));

// Base weapon used by most tests: 100 physical damage sword
const baseWeapon = {
  equipmentType: "One-Handed Sword" as const,
  baseStats: {
    baseStatLines: [
      {
        text: "100 - 100 physical damage",
        mods: [{ type: "GearBasePhysDmg", value: 100 } as const],
      },
    ],
  },
};

const emptySkillPage = () => ({ activeSkills: {}, passiveSkills: {} });

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

const simplePersistentSpellSkillPage = () => ({
  activeSkills: {
    1: {
      skillName: "[Test] Simple Persistent Spell" as const,
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
    customAffixLines: pl.customAffixLines || [],
  };
};

const defaultConfiguration = createDefaultConfiguration();

// Configuration with enemyFrostbitten enabled for tests that need Ice Bond's conditional buff
const frostbittenEnabledConfig: Configuration = {
  ...createDefaultConfiguration(),
  enemyFrostbittenEnabled: true,
  enemyFrostbittenPoints: 0,
};

// ExpectedOutput supports both flat keys (mapped to mainhand) and top-level keys
type ExpectedOutput = Partial<{
  // Flat keys mapped to mainhand for backwards compatibility
  avgHit: number;
  avgHitWithCrit: number;
  critChance: number;
  aspd: number;
  // Top-level keys
  critDmgMult: number;
  avgDps: number;
}>;

const WEAPON_SUMMARY_KEYS: (keyof WeaponAttackSummary)[] = [
  "avgHit",
  "avgHitWithCrit",
  "critChance",
  "aspd",
];

const validate = (
  results: OffenseResults,
  skillName: OffenseSkillName,
  expected: ExpectedOutput,
) => {
  const actual = results.skills[skillName as ImplementedActiveSkillName];
  expect(actual).toBeDefined();
  expect(actual?.attackDpsSummary).toBeDefined();
  const summary = actual?.attackDpsSummary;

  for (const [key, value] of Object.entries(expected)) {
    // Map legacy flat keys to mainhand
    if (WEAPON_SUMMARY_KEYS.includes(key as keyof WeaponAttackSummary)) {
      expect(summary?.mainhand[key as keyof WeaponAttackSummary]).toBeCloseTo(
        value,
      );
    } else if (key === "critDmgMult" || key === "avgDps") {
      expect(summary?.[key]).toBeCloseTo(value);
    }
  }
};

describe("basic damage modifiers", () => {
  const skillName = "[Test] Simple Attack" as const;

  // Bespoke helper: 100 phys weapon + custom mods
  const createModsInput = (mods: AffixLine[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customAffixLines: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  // Bespoke helper: weapon with base affixes (adds to 100 phys weapon) + mods
  const createWeaponModsInput = (
    weaponAffixes: Affix[],
    mods: AffixLine[],
  ) => ({
    loadout: initLoadout({
      gearPage: {
        equippedGear: {
          mainHand: { ...baseWeapon, base_affixes: weaponAffixes },
        },
        inventory: [],
      },
      customAffixLines: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  test("calculate offense very basic", () => {
    // base * bonusdmg
    // 100 * 2 = 200
    const input = createModsInput(
      affixLines([
        { type: "DmgPct", value: 100, dmgModType: "global", addn: false },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 200 });
  });

  test("calculate offense multiple inc dmg", () => {
    // base * (1 + sum of increased)
    // 100 * (1 + 0.5 + 0.3) = 180
    const input = createModsInput(
      affixLines([
        { type: "DmgPct", value: 50, dmgModType: "global", addn: false }, // +50% increased
        { type: "DmgPct", value: 30, dmgModType: "global", addn: false }, // +30% increased
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 180 });
  });

  test("calculate offense multiple addn dmg", () => {
    // base * (1 + more1) * (1 + more2)
    // 100 * 1.5 * 1.2 = 180
    const input = createModsInput(
      affixLines([
        { type: "DmgPct", value: 50, dmgModType: "global", addn: true }, // +50% more
        { type: "DmgPct", value: 20, dmgModType: "global", addn: true }, // +20% more
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 180 });
  });

  test("calculate offense multiple mix inc and addn dmg", () => {
    // base * (1 + sum of increased) * (1 + more)
    // 100 * (1 + 0.5 + 0.3) * 1.2 = 100 * 1.8 * 1.2 = 216
    const input = createModsInput(
      affixLines([
        { type: "DmgPct", value: 50, dmgModType: "global", addn: false }, // +50% increased
        { type: "DmgPct", value: 30, dmgModType: "global", addn: false }, // +30% increased
        { type: "DmgPct", value: 20, dmgModType: "global", addn: true }, // +20% more
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 216 });
  });

  test("calculate offense atk dmg mod", () => {
    // [Test] Simple Attack has "Attack" tag, so attack modifiers apply
    // 100 * (1 + 0.5) = 150
    const input = createModsInput(
      affixLines([
        { type: "DmgPct", value: 50, dmgModType: "attack", addn: false },
      ]), // +50% increased attack damage
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 150 });
  });

  test("calculate offense spell dmg mod doesn't affect attack skill", () => {
    // [Test] Simple Attack has "Attack" tag, NOT "Spell" tag
    // So spell modifiers don't apply - only base damage
    // 100 * 1 (no applicable modifiers) = 100
    const input = createModsInput(
      affixLines([
        { type: "DmgPct", value: 50, dmgModType: "spell", addn: false },
      ]), // +50% increased spell damage
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 100 });
  });

  test("calculate offense shadow_strike_skill dmg mod doesn't affect non-Shadow Strike skill", () => {
    // [Test] Simple Attack does NOT have "Shadow Strike" tag
    // So shadow_strike_skill modifiers don't apply - only base damage
    // 100 * 1 (no applicable modifiers) = 100
    const input = createModsInput(
      affixLines([
        {
          type: "DmgPct",
          value: 50,
          dmgModType: "shadow_strike_skill",
          addn: false,
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 100 });
  });

  test("calculate offense shadow_strike_skill dmg mod applies to Frost Spike", () => {
    // Frost Spike has "Shadow Strike" tag, so shadow_strike_skill modifiers apply
    // Frost Spike level 20: weaponAtkDmgPct = 2.01, converts 100% phys to cold
    // 100 * 2.01 = 201 cold, then * 1.5 (50% inc) = 301.5
    const input = {
      loadout: initLoadout({
        gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
        customAffixLines: affixLines([
          {
            type: "DmgPct",
            value: 50,
            dmgModType: "shadow_strike_skill",
            addn: false,
          },
        ]),
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
    validate(results, "Frost Spike", { avgHit: 301.5 });
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
      affixLines([
        { type: "DmgPct", value: 50, dmgModType: "elemental", addn: false },
      ]), // +50% elemental
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
      affixLines([
        { type: "DmgPct", value: 80, dmgModType: "cold", addn: false },
      ]), // +80% cold damage
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 154 });
  });
});

describe("additional min/max damage", () => {
  const skillName = "[Test] Simple Attack" as const;

  // Bespoke helper: 100 phys weapon + custom mods
  const createModsInput = (mods: AffixLine[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customAffixLines: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: createDefaultConfiguration(),
  });

  test("global additional min/max damage applies to all damage types", () => {
    // Base weapon: 100-100 physical damage
    // -50% additional min damage, +100% additional max damage (global, no dmgType)
    // Result: min becomes 50, max becomes 200
    // avgHit = (50 + 200) / 2 = 125
    const input = createModsInput(
      affixLines([
        { type: "AddnMinDmgPct", value: -50, addn: true },
        { type: "AddnMaxDmgPct", value: 100, addn: true },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 125 });
  });

  test("typed additional damage does not apply to non-matching damage type", () => {
    // Base weapon: 100-100 physical damage
    // +50% additional max cold damage (dmgType: cold)
    // Physical damage should be unaffected since dmgType doesn't match
    // avgHit = (100 + 100) / 2 = 100
    const input = createModsInput(
      affixLines([
        { type: "AddnMaxDmgPct", value: 50, addn: true, dmgType: "cold" },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 100 });
  });

  test("typed additional damage applies to converted damage via history", () => {
    // Base weapon: 100-100 physical damage
    // 100% physical to cold conversion
    // +50% additional max physical damage (dmgType: physical)
    // Converted cold damage retains physical in its history, so the bonus applies
    // Result: 0 physical, 100-150 cold
    // avgHit = (100 + 150) / 2 = 125
    const input = createModsInput(
      affixLines([
        { type: "ConvertDmgPct", from: "physical", to: "cold", value: 100 },
        { type: "AddnMaxDmgPct", value: 50, addn: true, dmgType: "physical" },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 125 });
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
      affix([{ type: "CritRatingPct", value: 50, modType: "global" }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, {
      avgHit: 100,
      critChance: 0.1,
      avgHitWithCrit: 105,
    });
  });

  test("calculate offense with fervor and single FervorEffPct modifier", () => {
    // Base damage: 100
    // Fervor: 100 points * 2% * (1 + 0.5) = 100 * 0.02 * 1.5 = 3.0 (300% increased crit rating)
    // Crit chance: 0.05 * (1 + 3.0) = 0.20 (20%)
    // Crit damage: 1.5 (default)
    // AvgHitWithCrit: 100 * 0.20 * 1.5 + 100 * 0.80 = 30 + 80 = 110
    const input = createFervorInput({ enabled: true, points: 100 }, [
      affix([{ type: "FervorEffPct", value: 50 }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, {
      avgHit: 100,
      critChance: 0.2,
      avgHitWithCrit: 110,
    });
  });

  test("calculate offense with fervor and multiple FervorEffPct modifiers stacking", () => {
    // Base damage: 100
    // FervorEffPct total: 0.1 + 0.1 = 0.2 (20% total)
    // Fervor: 100 points * 2% * (1 + 0.2) = 100 * 0.02 * 1.2 = 2.4 (240% increased crit rating)
    // Crit chance: 0.05 * (1 + 2.4) = 0.17 (17%)
    // Crit damage: 1.5 (default)
    // AvgHitWithCrit: 100 * 0.17 * 1.5 + 100 * 0.83 = 25.5 + 83 = 108.5
    const input = createFervorInput({ enabled: true, points: 100 }, [
      affix([{ type: "FervorEffPct", value: 10 }]),
      affix([{ type: "FervorEffPct", value: 10 }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, {
      avgHit: 100,
      critChance: 0.17,
      avgHitWithCrit: 108.5,
    });
  });

  test("calculate offense with fervor and FervorEffPct with custom fervor points", () => {
    // Base damage: 100
    // Fervor: 50 points * 2% * (1 + 1.0) = 50 * 0.02 * 2.0 = 2.0 (200% increased crit rating)
    // Crit chance: 0.05 * (1 + 2.0) = 0.15 (15%)
    // Crit damage: 1.5 (default)
    // AvgHitWithCrit: 100 * 0.15 * 1.5 + 100 * 0.85 = 22.5 + 85 = 107.5
    const input = createFervorInput({ enabled: true, points: 50 }, [
      affix([{ type: "FervorEffPct", value: 100 }]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, {
      avgHit: 100,
      critChance: 0.15,
      avgHitWithCrit: 107.5,
    });
  });

  test("calculate offense with FervorEffPct but fervor disabled", () => {
    // FervorEffPct has no effect when fervor is disabled
    // Crit chance: 0.05 * (1 + 0) = 0.05 (5%)
    // Crit damage: 1.5 (default)
    // AvgHitWithCrit: 100 * 0.05 * 1.5 + 100 * 0.95 = 7.5 + 95 = 102.5
    const input = createFervorInput({ enabled: false, points: 100 }, [
      affix([{ type: "FervorEffPct", value: 50 }]),
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
    // Crit damage: 1.5 + 0.5 = 2.0
    // AvgHitWithCrit: 100 * 0.15 * 2.0 + 100 * 0.85 = 30 + 85 = 115
    const input = createFervorInput({ enabled: true, points: 100 }, [
      affix([
        {
          type: "CritDmgPct",
          value: 0.5,
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
      critDmgMult: 2.0,
      avgHitWithCrit: 115,
    });
  });

  test("calculate offense with multiple CritDmgPerFervor affixes stacking", () => {
    // Base damage: 100
    // Fervor: 100 points * 2% = 200% increased crit rating
    // Crit chance: 0.05 * (1 + 2.0) = 0.15 (15%)
    // CritDmgPerFervor total: (0.005 * 100) + (0.003 * 100) = 0.5 + 0.3 = 0.8
    // Crit damage: 1.5 + 0.8 = 2.3
    // AvgHitWithCrit: 100 * 0.15 * 2.3 + 100 * 0.85 = 34.5 + 85 = 119.5
    const input = createFervorInput({ enabled: true, points: 100 }, [
      affix([
        {
          type: "CritDmgPct",
          value: 0.5,
          addn: false,
          modType: "global",
          per: { stackable: "fervor" },
        },
      ]),
      affix([
        {
          type: "CritDmgPct",
          value: 0.3,
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
      critDmgMult: 2.3,
      avgHitWithCrit: 119.5,
    });
  });

  test("calculate offense with CritDmgPerFervor with custom fervor points", () => {
    // Base damage: 100
    // Fervor: 50 points * 2% = 100% increased crit rating
    // Crit chance: 0.05 * (1 + 1.0) = 0.10 (10%)
    // CritDmgPerFervor: 0.01 * 50 = 0.5 (50% increased crit damage)
    // Crit damage: 1.5 + 0.5 = 2.0
    // AvgHitWithCrit: 100 * 0.10 * 2.0 + 100 * 0.90 = 20 + 90 = 110
    const input = createFervorInput({ enabled: true, points: 50 }, [
      affix([
        {
          type: "CritDmgPct",
          value: 1,
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
      critDmgMult: 2.0,
      avgHitWithCrit: 110,
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
          value: 0.5,
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
    // Crit damage: 1.5 + 0.8 = 2.3
    // AvgHitWithCrit: 100 * 0.15 * 2.3 + 100 * 0.85 = 34.5 + 85 = 119.5
    const input = createFervorInput({ enabled: true, points: 100 }, [
      affix([
        {
          type: "CritDmgPct",
          value: 0.5,
          addn: false,
          modType: "global",
          per: { stackable: "fervor" },
        },
      ]),
      affix([
        { type: "CritDmgPct", value: 30, modType: "global", addn: false },
      ]),
    ]);
    const results = calculateOffense(input);
    validate(results, skillName, {
      avgHit: 100,
      critChance: 0.15,
      critDmgMult: 2.3,
      avgHitWithCrit: 119.5,
    });
  });
});

describe("flat crit rating", () => {
  const skillName = "[Test] Simple Attack" as const;

  // Bespoke helper: 100 phys weapon + custom mods
  const createModsInput = (mods: AffixLine[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customAffixLines: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  test("FlatCritRating with CritRatingPct", () => {
    // Base crit rating: 500
    // Added flat crit rating: 100
    // Base crit chance: (500 + 100) / 100 / 100 = 0.06 (6%)
    // Crit rating pct: 100% → multiplier = 1 + 1 = 2
    // Final crit chance: 0.06 * 2 = 0.12 (12%)
    const input = createModsInput(
      affixLines([
        { type: "FlatCritRating", value: 100, modType: "global" },
        { type: "CritRatingPct", value: 100, modType: "global" },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { critChance: 0.12 });
  });
});

describe("flat damage to attacks", () => {
  const skillName = "[Test] Simple Attack" as const;

  // Bespoke helper: 100 phys weapon + custom mods
  const createModsInput = (mods: AffixLine[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customAffixLines: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  // Bespoke helper: no weapon, just flat damage mods
  const createNoWeaponInput = (mods: AffixLine[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: {}, inventory: [] },
      customAffixLines: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  // Bespoke helper: Frost Spike skill with mods
  const createFrostSpikeInput = (mods: AffixLine[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customAffixLines: mods,
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
    const input = createModsInput(
      affixLines([
        {
          type: "FlatDmgToAtks",
          value: { min: 50, max: 50 },
          dmgType: "physical",
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 150 });
  });

  test("calculate offense with flat elemental damage to attacks", () => {
    // Weapon: 100 phys
    // Flat: 20 cold + 30 fire + 10 lightning = 60 elemental
    // Total: 100 + 60 = 160
    const input = createModsInput(
      affixLines([
        { type: "FlatDmgToAtks", value: { min: 20, max: 20 }, dmgType: "cold" },
        { type: "FlatDmgToAtks", value: { min: 30, max: 30 }, dmgType: "fire" },
        {
          type: "FlatDmgToAtks",
          value: { min: 10, max: 10 },
          dmgType: "lightning",
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 160 });
  });

  test("calculate offense with multiple flat damage sources stacking", () => {
    // Weapon: 100 phys
    // Flat: 25 + 25 = 50 phys (stacks additively)
    // Total: 100 + 50 = 150
    const input = createModsInput(
      affixLines([
        {
          type: "FlatDmgToAtks",
          value: { min: 25, max: 25 },
          dmgType: "physical",
        },
        {
          type: "FlatDmgToAtks",
          value: { min: 25, max: 25 },
          dmgType: "physical",
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 150 });
  });

  test("calculate offense with flat damage scaled by addedDmgEffPct (Frost Spike)", () => {
    // Frost Spike at level 20 has addedDmgEffPct = 2.01 and WeaponAtkDmgPct = 2.01
    // Weapon damage: 100 * 2.01 = 201 (converted to cold)
    // Flat damage: 100 * 2.01 = 201 (converted to cold)
    // Total: 201 + 201 = 402 cold
    const input = createFrostSpikeInput(
      affixLines([
        {
          type: "FlatDmgToAtks",
          value: { min: 100, max: 100 },
          dmgType: "physical",
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, "Frost Spike", { avgHit: 402 });
  });

  test("calculate offense with flat damage and % damage modifiers", () => {
    // Weapon: 100 phys
    // Flat: 50 phys
    // Base total: 150
    // After +100% physical: 150 * 2 = 300
    const input = createModsInput(
      affixLines([
        {
          type: "FlatDmgToAtks",
          value: { min: 50, max: 50 },
          dmgType: "physical",
        },
        { type: "DmgPct", value: 100, dmgModType: "physical", addn: false }, // +100% physical damage
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 300 });
  });

  test("calculate offense with no weapon returns undefined attack DPS", () => {
    // No weapon equipped - attack DPS should be undefined
    const input = createNoWeaponInput(
      affixLines([
        {
          type: "FlatDmgToAtks",
          value: { min: 100, max: 100 },
          dmgType: "fire",
        },
      ]),
    );
    const results = calculateOffense(input);
    const actual = results.skills[skillName];
    expect(actual?.attackDpsSummary).toBeUndefined();
  });

  test("calculate offense with flat erosion damage", () => {
    // Weapon: 100 phys (no bonus)
    // Flat: 50 erosion * 1.5 (50% erosion bonus) = 75
    // Total: 100 + 75 = 175
    const input = createModsInput(
      affixLines([
        {
          type: "FlatDmgToAtks",
          value: { min: 50, max: 50 },
          dmgType: "erosion",
        },
        { type: "DmgPct", value: 50, dmgModType: "erosion", addn: false }, // +50% erosion damage
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 175 });
  });
});

// Damage Conversion Tests
// Conversion chain: Physical → Lightning → Cold → Fire → Erosion
// Damage can skip steps but never convert backwards
// Converted damage benefits from modifiers of all types it passed through

const emptyDmgRanges = (): DmgRanges => ({
  physical: { min: 0, max: 0 },
  cold: { min: 0, max: 0 },
  lightning: { min: 0, max: 0 },
  fire: { min: 0, max: 0 },
  erosion: { min: 0, max: 0 },
});

const sumPoolRanges = (
  pools: DmgPools<DmgRange>,
  type: keyof DmgPools<DmgRange>,
) => {
  return pools[type].reduce(
    (acc, p) => {
      return { min: acc.min + p.value.min, max: acc.max + p.value.max };
    },
    { min: 0, max: 0 },
  );
};

const findConvertedEntry = (
  pools: DmgPools<DmgRange>,
  type: keyof DmgPools<DmgRange>,
) => {
  // Find entry with non-zero damage (the converted one, not original zero)
  return pools[type].find((p) => {
    return p.value.min > 0 || p.value.max > 0;
  });
};

describe("convertDmg", () => {
  test("no conversion mods - damage passes through unchanged", () => {
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      physical: { min: 100, max: 100 },
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
      physical: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "cold", value: 100 },
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
      physical: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "cold", value: 50 },
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
      physical: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "cold", value: 30 },
      { type: "ConvertDmgPct", from: "physical", to: "fire", value: 50 },
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
      physical: { min: 120, max: 120 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "cold", value: 60 },
      { type: "ConvertDmgPct", from: "physical", to: "fire", value: 60 },
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
      physical: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "lightning", value: 100 },
      { type: "ConvertDmgPct", from: "lightning", to: "cold", value: 100 },
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
      physical: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "lightning", value: 50 },
      { type: "ConvertDmgPct", from: "lightning", to: "cold", value: 50 },
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
      physical: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "lightning", value: 100 },
      { type: "ConvertDmgPct", from: "lightning", to: "cold", value: 100 },
      { type: "ConvertDmgPct", from: "cold", to: "fire", value: 100 },
      { type: "ConvertDmgPct", from: "fire", to: "erosion", value: 100 },
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
      physical: { min: 100, max: 100 },
      cold: { min: 50, max: 50 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "fire", value: 100 },
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
      physical: { min: 100, max: 100 },
      lightning: { min: 50, max: 50 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "lightning", value: 100 },
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
      physical: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "fire", value: 100 },
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
      physical: { min: 80, max: 120 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "cold", value: 50 },
    ];

    const result = convertDmg(dmgRanges, mods);

    expect(sumPoolRanges(result, "physical")).toEqual({ min: 40, max: 60 });
    expect(sumPoolRanges(result, "cold")).toEqual({ min: 40, max: 60 });
  });

  test("triple overconversion prorates correctly", () => {
    // 50% + 40% + 30% = 120%, should prorate to ~41.67%, ~33.33%, 25%
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      physical: { min: 120, max: 120 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "cold", value: 50 },
      { type: "ConvertDmgPct", from: "physical", to: "fire", value: 40 },
      { type: "ConvertDmgPct", from: "physical", to: "erosion", value: 30 },
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

  // AddsDmgAsPct (Gain as Extra) Tests
  // "Gain as Extra" adds damage without removing from source
  // Calculated BEFORE conversion within each damage type's processing

  test("basic gain as extra - physical to cold", () => {
    // 100 phys with 20% gain as cold
    // Result: 100 phys + 20 cold (source remains intact)
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      physical: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "AddsDmgAsPct", from: "physical", to: "cold", value: 20 },
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
      physical: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "AddsDmgAsPct", from: "physical", to: "cold", value: 20 },
      { type: "ConvertDmgPct", from: "physical", to: "fire", value: 100 },
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
      physical: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "AddsDmgAsPct", from: "physical", to: "cold", value: 20 },
      { type: "ConvertDmgPct", from: "physical", to: "fire", value: 50 },
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
      physical: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "AddsDmgAsPct", from: "physical", to: "cold", value: 20 },
      { type: "AddsDmgAsPct", from: "physical", to: "fire", value: 30 },
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
      physical: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "ConvertDmgPct", from: "physical", to: "lightning", value: 100 },
      { type: "AddsDmgAsPct", from: "lightning", to: "fire", value: 20 },
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
      physical: { min: 100, max: 100 },
      cold: { min: 50, max: 50 },
    };

    const mods: Mod[] = [
      { type: "AddsDmgAsPct", from: "physical", to: "cold", value: 20 },
    ];

    const result = convertDmg(dmgRanges, mods);

    expect(sumPoolRanges(result, "physical")).toEqual({ min: 100, max: 100 });
    expect(sumPoolRanges(result, "cold")).toEqual({ min: 70, max: 70 });
    // Should have 2 cold entries: original (no history) and gained (physical history)
    expect(result.cold.length).toBe(2);
    const originalCold = result.cold.find((c) => c.history.length === 0);
    const gainedCold = result.cold.find((c) => c.history.includes("physical"));
    expect(originalCold?.value).toEqual({ min: 50, max: 50 });
    expect(gainedCold?.value).toEqual({ min: 20, max: 20 });
  });

  test("gain as extra from fire (last in conversion order)", () => {
    // 100 fire with 20% gain as erosion
    // Result: 100 fire + 20 erosion
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      fire: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "AddsDmgAsPct", from: "fire", to: "erosion", value: 20 },
    ];

    const result = convertDmg(dmgRanges, mods);

    expect(sumPoolRanges(result, "fire")).toEqual({ min: 100, max: 100 });
    expect(sumPoolRanges(result, "erosion")).toEqual({ min: 20, max: 20 });
  });

  test("gain as extra from erosion does nothing (not in conversion order)", () => {
    // 100 erosion with 20% gain as fire - should NOT add any fire
    // Erosion is not in CONVERSION_ORDER, so AddsDmgAsPct from erosion is not processed
    const dmgRanges: DmgRanges = {
      ...emptyDmgRanges(),
      erosion: { min: 100, max: 100 },
    };

    const mods: Mod[] = [
      { type: "AddsDmgAsPct", from: "erosion", to: "fire", value: 20 },
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
  const createModsInput = (mods: AffixLine[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customAffixLines: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  test("DmgPct per willpower normalizes to stacks * value", () => {
    // +10% damage per willpower stack with 5 stacks = +50% damage
    // 100 * (1 + 0.5) = 150
    const input = createModsInput(
      affixLines([
        { type: "MaxWillpowerStacks", value: 5 },
        {
          type: "DmgPct",
          value: 10,
          dmgModType: "global",
          addn: false,
          per: { stackable: "willpower" },
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 150 });
  });

  test("DmgPct per willpower with zero stacks has no effect", () => {
    // +10% damage per willpower stack with 0 stacks = +0% damage
    // 100 * (1 + 0) = 100
    const input = createModsInput(
      affixLines([
        {
          type: "DmgPct",
          value: 10,
          dmgModType: "global",
          addn: false,
          per: { stackable: "willpower" },
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 100 });
  });

  test("DmgPct per willpower stacks with regular DmgPct", () => {
    // +10% damage per willpower (5 stacks = 50%) + 30% regular = 80% total
    // 100 * (1 + 0.5 + 0.3) = 180
    const input = createModsInput(
      affixLines([
        { type: "MaxWillpowerStacks", value: 5 },
        {
          type: "DmgPct",
          value: 10,
          dmgModType: "global",
          addn: false,
          per: { stackable: "willpower" },
        },
        { type: "DmgPct", value: 30, dmgModType: "global", addn: false },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 180 });
  });

  test("FlatDmgToAtks per willpower normalizes DmgRange", () => {
    // +10-10 flat phys per willpower stack with 3 stacks = +30-30 flat phys
    // Weapon: 100, Flat: 30, Total: 130
    const input = createModsInput(
      affixLines([
        { type: "MaxWillpowerStacks", value: 3 },
        {
          type: "FlatDmgToAtks",
          value: { min: 10, max: 10 },
          dmgType: "physical",
          per: { stackable: "willpower" },
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 130 });
  });

  test("CritRatingPct per willpower normalizes correctly", () => {
    // +20% crit rating per willpower stack with 2 stacks = +40% crit rating
    // Crit chance: 0.05 * (1 + 0.4) = 0.07 (7%)
    const input = createModsInput(
      affixLines([
        { type: "MaxWillpowerStacks", value: 2 },
        {
          type: "CritRatingPct",
          value: 20,
          modType: "global",
          per: { stackable: "willpower" },
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { critChance: 0.07 });
  });

  test("multiple per-willpower mods all normalize correctly", () => {
    // With 4 willpower stacks:
    // +5% damage per stack = +20% damage
    // +10% crit rating per stack = +40% crit rating
    // Crit chance: 0.05 * (1 + 0.4) = 0.07
    // Avg hit: 100 * (1 + 0.2) = 120
    const input = createModsInput(
      affixLines([
        { type: "MaxWillpowerStacks", value: 4 },
        {
          type: "DmgPct",
          value: 5,
          dmgModType: "global",
          addn: false,
          per: { stackable: "willpower" },
        },
        {
          type: "CritRatingPct",
          value: 10,
          modType: "global",
          per: { stackable: "willpower" },
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 120, critChance: 0.07 });
  });

  test("per-stack limit caps the effective stack count", () => {
    // +10% damage per willpower stack, limit 3, with 10 stacks
    // Effective stacks: min(10, 3) = 3
    // Damage bonus: 3 * 10% = 30%
    // 100 * (1 + 0.3) = 130
    const input = createModsInput(
      affixLines([
        { type: "MaxWillpowerStacks", value: 10 },
        {
          type: "DmgPct",
          value: 10,
          dmgModType: "global",
          addn: false,
          per: { stackable: "willpower", limit: 3 },
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 130 });
  });

  test("per-stack limit has no effect when stacks below limit", () => {
    // +10% damage per willpower stack, limit 10, with 3 stacks
    // Effective stacks: min(3, 10) = 3
    // Damage bonus: 3 * 10% = 30%
    // 100 * (1 + 0.3) = 130
    const input = createModsInput(
      affixLines([
        { type: "MaxWillpowerStacks", value: 3 },
        {
          type: "DmgPct",
          value: 10,
          dmgModType: "global",
          addn: false,
          per: { stackable: "willpower", limit: 10 },
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 130 });
  });

  test("per-stack valueLimit caps the final computed value", () => {
    // +10% damage per willpower stack, valueLimit 0.25, with 10 stacks
    // Raw value: 10 * 0.1 = 1.0 (100% damage)
    // Capped value: min(1.0, 0.25) = 0.25 (25% damage)
    // 100 * (1 + 0.25) = 125
    const input = createModsInput(
      affixLines([
        { type: "MaxWillpowerStacks", value: 10 },
        {
          type: "DmgPct",
          value: 10,
          dmgModType: "global",
          addn: false,
          per: { stackable: "willpower", valueLimit: 25 },
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 125 });
  });

  test("per-stack valueLimit has no effect when value below limit", () => {
    // +10% damage per willpower stack, valueLimit 1.0, with 3 stacks
    // Raw value: 3 * 0.1 = 0.3 (30% damage)
    // Capped value: min(0.3, 1.0) = 0.3 (no cap applied)
    // 100 * (1 + 0.3) = 130
    const input = createModsInput(
      affixLines([
        { type: "MaxWillpowerStacks", value: 3 },
        {
          type: "DmgPct",
          value: 10,
          dmgModType: "global",
          addn: false,
          per: { stackable: "willpower", valueLimit: 100 },
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 130 });
  });

  test("per-stack with both limit and valueLimit applies both constraints", () => {
    // +20% damage per willpower stack, limit 5, valueLimit 0.5, with 10 stacks
    // Effective stacks: min(10, 5) = 5
    // Raw value: 5 * 0.2 = 1.0 (100% damage)
    // Capped value: min(1.0, 0.5) = 0.5 (50% damage)
    // 100 * (1 + 0.5) = 150
    const input = createModsInput(
      affixLines([
        { type: "MaxWillpowerStacks", value: 10 },
        {
          type: "DmgPct",
          value: 20,
          dmgModType: "global",
          addn: false,
          per: { stackable: "willpower", limit: 5, valueLimit: 50 },
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 150 });
  });

  test("per-stack with amt divides stacks before applying limit", () => {
    // +30% damage per 3 willpower stacks, limit 2, with 10 stacks
    // Effective stack multiplier: min(10/3, 2) = min(3.33, 2) = 2
    // Damage bonus: 2 * 30% = 60%
    // 100 * (1 + 0.6) = 160
    const input = createModsInput(
      affixLines([
        { type: "MaxWillpowerStacks", value: 10 },
        {
          type: "DmgPct",
          value: 30,
          dmgModType: "global",
          addn: false,
          per: { stackable: "willpower", amt: 3, limit: 2 },
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 160 });
  });

  test("multiplicative stacking compounds percentage bonuses", () => {
    // 2 willpower stacks, 10% per stack multiplicative
    // stackCount = 2
    // newValue = (1 + 0.10)^2 - 1 = 0.21 (21%)
    // avgHit = 100 * (1 + 0.21) = 121
    const input = createModsInput(
      affixLines([
        { type: "MaxWillpowerStacks", value: 2 },
        {
          type: "DmgPct",
          value: 10,
          dmgModType: "global",
          addn: false,
          per: { stackable: "willpower", multiplicative: true },
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 121 });
  });

  test("multiplicative stacking with amt divides stacks correctly", () => {
    // 6 willpower stacks, 10% per 2 willpower multiplicative
    // stackCount = 6/2 = 3
    // newValue = (1 + 0.10)^3 - 1 = 0.331 (33.1%)
    // avgHit = 100 * (1 + 0.331) = 133.1
    const input = createModsInput(
      affixLines([
        { type: "MaxWillpowerStacks", value: 6 },
        {
          type: "DmgPct",
          value: 10,
          dmgModType: "global",
          addn: false,
          per: { stackable: "willpower", amt: 2, multiplicative: true },
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 133.1 });
  });

  test("multiplicative stacking respects valueLimit", () => {
    // 3 willpower stacks, 10% per stack multiplicative, valueLimit: 25
    // stackCount = 3
    // newValue = (1 + 0.10)^3 - 1 = 0.331 (33.1%), capped to 25%
    // avgHit = 100 * (1 + 0.25) = 125
    const input = createModsInput(
      affixLines([
        { type: "MaxWillpowerStacks", value: 3 },
        {
          type: "DmgPct",
          value: 10,
          dmgModType: "global",
          addn: false,
          per: { stackable: "willpower", multiplicative: true, valueLimit: 25 },
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 125 });
  });
});

// Additional damage per stat tests
// The calculator automatically adds +0.5% additional damage per main stat
describe("automatic additional damage from main stats", () => {
  const skillName = "[Test] Simple Attack" as const;

  // Bespoke helper: 100 phys weapon + custom mods
  const createModsInput = (mods: AffixLine[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customAffixLines: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  // Bespoke helper: Frost Spike skill with mods
  const createFrostSpikeInput = (mods: AffixLine[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customAffixLines: mods,
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
    const input = createModsInput(
      affixLines([
        { type: "Stat", statModType: "dex", value: 100 },
        { type: "Stat", statModType: "str", value: 100 },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 200 });
  });

  test("works with only one main stat type", () => {
    // [Test] Simple Attack has main stats: dex, str
    // With 100 dex only = 100 total main stats
    // Additional damage: 100 * 0.5% = 50% additional
    // Base: 100, with 50% more = 100 * 1.5 = 150
    const input = createModsInput(
      affixLines([{ type: "Stat", statModType: "dex", value: 100 }]),
    );
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
    const input = createModsInput(
      affixLines([{ type: "Stat", statModType: "int", value: 100 }]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 100 });
  });

  test("uses correct main stats for different skills", () => {
    // Frost Spike has main stats: dex, int (NOT str)
    // With 100 dex + 100 int = 200 total main stats
    // Additional damage: 200 * 0.5% = 100% additional
    // Frost Spike: 100 weapon * 2.01 = 201 phys → converted to cold
    // With 100% more: 201 * 2 = 402
    const input = createFrostSpikeInput(
      affixLines([
        { type: "Stat", statModType: "dex", value: 100 },
        { type: "Stat", statModType: "int", value: 100 },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, "Frost Spike", { avgHit: 402 });
  });

  test("combines with other damage modifiers", () => {
    // [Test] Simple Attack with 100 dex = 50% additional damage
    // Plus 50% increased damage
    // Base: 100, with 50% inc = 150, with 50% more = 150 * 1.5 = 225
    const input = createModsInput(
      affixLines([
        { type: "Stat", statModType: "dex", value: 100 },
        { type: "DmgPct", value: 50, dmgModType: "global", addn: false },
      ]),
    );
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
      supportNames.map((s, i) => {
        const level = s.level ?? 20;
        return [
          i + 1,
          {
            skillType: "support" as const,
            name: s.name,
            level,
            affixes: buildSupportSkillAffixes(s.name, level),
          },
        ];
      }),
    ),
  });

  // Base weapon with attack speed for testing
  const weaponWithAspd = {
    equipmentType: "One-Handed Sword" as const,
    baseStats: {
      baseStatLines: [
        {
          text: "100 - 100 physical damage",
          mods: [{ type: "GearBasePhysDmg", value: 100 } as const],
        },
        {
          text: "1.0 attack speed",
          mods: [{ type: "GearBaseAttackSpeed", value: 1.0 } as const],
        },
      ],
    },
  };

  test("all four support skills (haunt, willpower, steamroll, quick decision) combine correctly", () => {
    // All at level 20:
    //   Haunt: DmgPct 0.8% (additional/more, global)
    //   Willpower: MaxWillpowerStacks 6, DmgPct 6% additional per stack (36% total)
    //   Steamroll: AspdPct -15% (increased), DmgPct 40.5% (additional, melee)
    //   Quick Decision: AspdAndCspdPct 24.5% (additional/more)
    //
    // Damage calculation:
    //   Base: 100
    //   Haunt (+0.8% more): 100 * 1.008 = 100.8
    //   Willpower (+6% * 6 stacks = +36% more): 100.8 * 1.36 = 137.088
    //   Steamroll (+40.5% more melee): 137.088 * 1.405 = 192.609
    //
    // Attack speed calculation:
    //   Base: 1.0
    //   Steamroll (-15% increased): 1.0 * 0.85 = 0.85
    //   Quick Decision (+24.5% more): 0.85 * 1.245 = 1.05825

    const loadout = initLoadout({
      gearPage: { equippedGear: { mainHand: weaponWithAspd }, inventory: [] },
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
      avgHit: 192.609,
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
      gearPage: { equippedGear: { mainHand: weaponWithAspd }, inventory: [] },
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
      gearPage: { equippedGear: { mainHand: weaponWithAspd }, inventory: [] },
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
  const createModsInput = (mods: AffixLine[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customAffixLines: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  // Bespoke helper: Frost Spike skill with mods
  const createFrostSpikeInput = (mods: AffixLine[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customAffixLines: mods,
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
    const input = createModsInput(
      affixLines([
        { type: "ConvertDmgPct", from: "physical", to: "cold", value: 100 },
        { type: "DmgPct", value: 50, dmgModType: "physical", addn: false },
        { type: "DmgPct", value: 30, dmgModType: "cold", addn: false },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 180 });
  });

  test("50% phys to cold conversion - unconverted phys gets phys%, converted cold gets both", () => {
    // 100 phys → 50 phys + 50 cold
    // Unconverted physical: 50 * (1 + 0.5) = 75
    // Converted cold: 50 * (1 + 0.5 + 0.3) = 90
    // Total: 75 + 90 = 165
    const input = createModsInput(
      affixLines([
        { type: "ConvertDmgPct", from: "physical", to: "cold", value: 50 },
        { type: "DmgPct", value: 50, dmgModType: "physical", addn: false },
        { type: "DmgPct", value: 30, dmgModType: "cold", addn: false },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 165 });
  });

  test("chain conversion phys→lightning→cold gets bonuses from all three types", () => {
    // 100 phys → 100 lightning → 100 cold
    // Cold benefits from: 20% physical + 30% lightning + 40% cold = 90% inc
    // 100 * (1 + 0.9) = 190
    const input = createModsInput(
      affixLines([
        {
          type: "ConvertDmgPct",
          from: "physical",
          to: "lightning",
          value: 100,
        },
        { type: "ConvertDmgPct", from: "lightning", to: "cold", value: 100 },
        { type: "DmgPct", value: 20, dmgModType: "physical", addn: false },
        { type: "DmgPct", value: 30, dmgModType: "lightning", addn: false },
        { type: "DmgPct", value: 40, dmgModType: "cold", addn: false },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 190 });
  });

  test("elemental bonus applies to converted cold damage", () => {
    // 100 phys → 100 cold
    // Cold benefits from: 50% elemental (applies to cold) = 50% inc
    // 100 * (1 + 0.5) = 150
    const input = createModsInput(
      affixLines([
        { type: "ConvertDmgPct", from: "physical", to: "cold", value: 100 },
        { type: "DmgPct", value: 50, dmgModType: "elemental", addn: false },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 150 });
  });

  test("no conversion - damage bonuses apply normally by type", () => {
    // 100 phys, no conversion
    // Physical: 100 * (1 + 0.5) = 150
    // Cold bonus doesn't apply (no cold damage)
    const input = createModsInput(
      affixLines([
        { type: "DmgPct", value: 50, dmgModType: "physical", addn: false },
        { type: "DmgPct", value: 30, dmgModType: "cold", addn: false },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 150 });
  });

  test("Frost Spike skill converts phys to cold via levelMods", () => {
    // Frost Spike has 100% phys→cold conversion from levelMods and 2.01× weapon mult
    // Requires Frost Spike to be in skill slot for levelMods to be resolved
    // 100 phys weapon * 2.01 = 201 phys → 201 cold via skill's conversion
    // Cold damage with 50% cold bonus: 201 * (1 + 0.5) = 301.5
    const input = createFrostSpikeInput(
      affixLines([
        { type: "DmgPct", value: 50, dmgModType: "cold", addn: false },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, "Frost Spike", { avgHit: 301.5 });
  });
});

// Active skill levelMods resolution tests
describe("resolveSelectedSkillMods via calculateOffense", () => {
  // Helper to create a loadout with Frost Spike in skill slot
  const createFrostSpikeLoadout = (level: number = 20) =>
    initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
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
    // 4. BaseProjectileQuant (base 2)
    // 5. DmgPct (8% additional per projectile) - normalized, per removed
    //
    // Note: Mods with `per` property have values normalized (multiplied by stack count)
    // and `per` is removed. BaseProjectileQuant does NOT count toward projectile stacks.
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
    expect(convertMod?.value).toBe(100);

    // Check MaxProjectile mod
    const maxProjMod = skillMods.find((m) => m.type === "MaxProjectile");
    expect(maxProjMod?.value).toBe(5);
    expect((maxProjMod as { override?: boolean }).override).toBe(true);

    // Check BaseProjectileQuant mod (base 2 projectiles)
    const baseProjMod = skillMods.find((m) => m.type === "BaseProjectileQuant");
    expect(baseProjMod?.value).toBe(2);

    // Check Projectile mod (per frostbite, normalized to 0 with no stacks)
    const projMod = skillMods.find((m) => m.type === "Projectile");
    expect(projMod?.value).toBe(0); // 1 per 35 frostbite_rating with 0 stacks

    // Check DmgPct per projectile mod (normalized to 0 with no projectile stacks)
    const dmgPctMod = skillMods.find((m) => m.type === "DmgPct");
    expect(dmgPctMod?.value).toBe(0); // 8% * 0 projectile stacks = 0
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
    const buildSupportSlots = (
      supports: { name: string; level?: number }[] = [],
    ): Record<
      number,
      | {
          skillType: "support";
          name: string;
          level: number;
          affixes: SupportAffix[];
        }
      | undefined
    > => {
      return Object.fromEntries(
        supports.map((s, i) => {
          const level = s.level ?? 20;
          return [
            i + 1,
            {
              skillType: "support" as const,
              name: s.name,
              level,
              affixes: buildSupportSkillAffixes(s.name, level),
            },
          ];
        }),
      );
    };

    const skillSlots: Record<
      number,
      {
        skillName: string;
        enabled: boolean;
        level: number;
        supportSkills: Record<
          number,
          | {
              skillType: "support";
              name: string;
              level: number;
              affixes: SupportAffix[];
            }
          | undefined
        >;
      }
    > = {
      1: {
        skillName: mainSkill.name,
        enabled: mainSkill.enabled ?? true,
        level: mainSkill.level ?? 20,
        supportSkills: buildSupportSlots(mainSkill.supports),
      },
    };

    buffSkills.forEach((buff, idx) => {
      skillSlots[idx + 2] = {
        skillName: buff.name,
        enabled: buff.enabled ?? true,
        level: buff.level ?? 20,
        supportSkills: buildSupportSlots(buff.supports),
      };
    });

    return initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      skillPage: { activeSkills: skillSlots, passiveSkills: {} },
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

    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.dmgModType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;
    expect(iceBondBuffMod?.value).toBeCloseTo(33);
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

    const bullsRageBuffMod = actual?.resolvedMods.find(
      (m) => m.type === "DmgPct" && m.dmgModType === "melee" && m.addn === true,
    ) as DmgPctMod | undefined;
    expect(bullsRageBuffMod?.value).toBeCloseTo(27);
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

    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.dmgModType === "cold" &&
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
        ...createDefaultConfiguration(),
        enemyFrostbittenEnabled: false,
      },
    });
    const actual = results.skills["[Test] Simple Attack"];

    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.dmgModType === "cold" &&
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
        m.dmgModType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;
    const buffModL20 = actualL20?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.dmgModType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;

    expect(buffModL1?.value).toBeCloseTo(23.5);
    expect(buffModL20?.value).toBeCloseTo(33);
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

    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.dmgModType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;
    expect(iceBondBuffMod?.value).toBeCloseTo(33 * 1.4);
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

    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.dmgModType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;
    expect(iceBondBuffMod?.value).toBeCloseTo(38.1975);
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
    // Well-Fought Battle at level 20: 5.25% per use * 3 uses = 15.75% skill effect
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

    // Check Ice Bond buff
    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.dmgModType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;
    expect(iceBondBuffMod?.value).toBeCloseTo(51.3975);

    // Check Bull's Rage buff
    const bullsRageBuffMod = actual?.resolvedMods.find(
      (m) => m.type === "DmgPct" && m.dmgModType === "melee" && m.addn === true,
    ) as DmgPctMod | undefined;
    expect(bullsRageBuffMod?.value).toBeCloseTo(42.0525);

    // Verify final avgHit includes both Ice Bond's cold buff and Bull's Rage's melee buff
    expect(actual?.attackDpsSummary?.mainhand.avgHit).toBeCloseTo(
      201 * 1.514 * 1.4205,
    );
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

    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.dmgModType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;
    // Should be base 33%, not affected by main skill's Mass Effect
    expect(iceBondBuffMod?.value).toBeCloseTo(33);
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

    // Ice Bond should be boosted by Mass Effect
    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.dmgModType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;
    expect(iceBondBuffMod?.value).toBeCloseTo(33 * 1.4);

    // Bull's Rage should NOT be affected by Ice Bond's Mass Effect
    const bullsRageBuffMod = actual?.resolvedMods.find(
      (m) => m.type === "DmgPct" && m.dmgModType === "melee" && m.addn === true,
    ) as DmgPctMod | undefined;
    expect(bullsRageBuffMod?.value).toBeCloseTo(27); // Base value, no boost
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

    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.dmgModType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;
    expect(iceBondBuffMod?.value).toBeCloseTo(51.3975);
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
        m.dmgModType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;
    const buffModL20 = actualL20?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.dmgModType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    ) as DmgPctMod | undefined;

    expect(buffModL1?.value).toBeCloseTo(33 * 1.21);
    expect(buffModL20?.value).toBeCloseTo(33 * 1.4);
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

    const preciseCrueltyBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" && m.dmgModType === "attack" && m.addn === true,
    ) as DmgPctMod | undefined;
    // Base 22% scaled by 100% aura effect = 44%
    expect(preciseCrueltyBuffMod?.value).toBeCloseTo(22 * 2);
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

    const preciseCrueltyBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" && m.dmgModType === "attack" && m.addn === true,
    ) as DmgPctMod | undefined;
    // Base 22% scaled by 50% aura effect = 33%
    expect(preciseCrueltyBuffMod?.value).toBeCloseTo(22 * 1.5);
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
      customAffixLines: affixLines([
        { type: "AuraEffPct", value: 50, addn: false },
      ]),
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

    const preciseCrueltyBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" && m.dmgModType === "attack" && m.addn === true,
    ) as DmgPctMod | undefined;
    // Base 22% with aura multiplier 3 = 66%
    expect(preciseCrueltyBuffMod?.value).toBeCloseTo(22 * 3);

    // Verify avgHit: 100 base weapon * (1 + 0.66 addn dmg) = 166
    expect(actual?.attackDpsSummary?.mainhand.avgHit).toBeCloseTo(
      100 * (1 + 0.22 * 3),
    );
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

    // Bull's Rage at level 20 provides 27% additional melee damage (no aura scaling)
    const bullsRageBuffMod = actual?.resolvedMods.find(
      (m) => m.type === "DmgPct" && m.dmgModType === "melee" && m.addn === true,
    ) as DmgPctMod | undefined;
    expect(bullsRageBuffMod?.value).toBeCloseTo(27);
  });
});

describe("Pactspirit Ring Mods", () => {
  test("pactspirit original ring affixes are included in damage calculations", () => {
    // Use a pactspirit slot with an originalAffix (from pactspirit data)
    // The affix provides +50% global damage
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
                {
                  type: "DmgPct",
                  value: 50,
                  dmgModType: "global",
                  addn: false,
                },
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

    // 100 base damage * (1 + 0.5) = 150
    expect(actual?.attackDpsSummary?.mainhand.avgHit).toBeCloseTo(150);
  });

  test("multiple pactspirit ring affixes stack additively", () => {
    // Two rings with +30% damage each should add to +60% total
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
                {
                  type: "DmgPct",
                  value: 30,
                  dmgModType: "global",
                  addn: false,
                },
              ]),
            ),
            innerRing2: ringSlotWithOriginalAffix(
              affix([
                {
                  type: "DmgPct",
                  value: 30,
                  dmgModType: "global",
                  addn: false,
                },
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

    // 100 base damage * (1 + 0.3 + 0.3) = 160
    expect(actual?.attackDpsSummary?.mainhand.avgHit).toBeCloseTo(160);
  });

  test("installed destiny affix overrides original affix", () => {
    // A ring with an installed destiny should use the destiny's affix, not the original
    // originalAffix is +25% but installedDestiny.affix is +75%, should use +75%
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
                    value: 75,
                    dmgModType: "global",
                    addn: false,
                  },
                ]),
              },
              originalRingName: "Test Ring",
              originalAffix: affix([
                {
                  type: "DmgPct",
                  value: 25,
                  dmgModType: "global",
                  addn: false,
                },
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

    // 100 base damage * (1 + 0.75 from destiny, NOT 0.25 from original) = 175
    expect(actual?.attackDpsSummary?.mainhand.avgHit).toBeCloseTo(175);
  });

  test("rings from multiple pactspirit slots contribute to damage", () => {
    // Rings from slot1 and slot2 should both contribute
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
                {
                  type: "DmgPct",
                  value: 20,
                  dmgModType: "global",
                  addn: false,
                },
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
                {
                  type: "DmgPct",
                  value: 30,
                  dmgModType: "global",
                  addn: false,
                },
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

    // 100 base damage * (1 + 0.2 + 0.3) = 150
    expect(actual?.attackDpsSummary?.mainhand.avgHit).toBeCloseTo(150);
  });
});

describe("Divinity Slate Mods", () => {
  test("placed divinity slate affixes are included in damage calculations", () => {
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
                {
                  type: "DmgPct",
                  value: 50,
                  dmgModType: "global",
                  addn: false,
                },
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

    // 100 base damage * (1 + 0.5) = 150
    expect(actual?.attackDpsSummary?.mainhand.avgHit).toBeCloseTo(150);
  });

  test("only placed slates contribute to damage, not inventory-only slates", () => {
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
                {
                  type: "DmgPct",
                  value: 50,
                  dmgModType: "global",
                  addn: false,
                },
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

    // 100 base damage * 1 = 100 (no bonus from unplaced slate)
    expect(actual?.attackDpsSummary?.mainhand.avgHit).toBeCloseTo(100);
  });

  test("multiple placed slates stack additively", () => {
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
                {
                  type: "DmgPct",
                  value: 30,
                  dmgModType: "global",
                  addn: false,
                },
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
                {
                  type: "DmgPct",
                  value: 20,
                  dmgModType: "global",
                  addn: false,
                },
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

    // 100 base damage * (1 + 0.3 + 0.2) = 150
    expect(actual?.attackDpsSummary?.mainhand.avgHit).toBeCloseTo(150);
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
    mods: AffixLine[] = [],
  ) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customAffixLines: mods,
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
    mods: AffixLine[] = [],
  ) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customAffixLines: mods,
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
    const input = createFrostSpikeInput(
      3,
      affixLines([{ type: "ShadowDmgPct", value: 100, addn: false }]), // +100% shadow damage
    );
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
    const input = createSimpleAttackInput(
      3,
      affixLines([{ type: "ShadowDmgPct", value: 100, addn: false }]), // This should have no effect
    );
    const results = calculateOffense(input);
    // Base: 100 (no shadow mechanics applied)
    validate(results, "[Test] Simple Attack", { avgHit: 100 });
  });

  test("shadow damage stacks with regular damage modifiers", () => {
    // +50% global damage AND 3 shadow hits with 100% shadow bonus
    const input = createFrostSpikeInput(
      3,
      affixLines([
        { type: "DmgPct", value: 50, dmgModType: "global", addn: false }, // +50% damage
        { type: "ShadowDmgPct", value: 100, addn: false }, // +100% shadow damage
      ]),
    );
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
        customAffixLines: affixLines([{ type: "ShadowQuant", value: 2 }]),
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
    enemyColdRes?: number;
    enemyErosionRes?: number;
    enemyArmor?: number;
  }

  const createPenetrationConfig = (
    input: PenConfigInput = {},
  ): Configuration => {
    const config = createDefaultConfiguration();
    const { enemyColdRes, enemyErosionRes, enemyArmor } = input;
    if (enemyColdRes !== undefined) config.enemyColdRes = enemyColdRes;
    if (enemyErosionRes !== undefined) config.enemyErosionRes = enemyErosionRes;
    if (enemyArmor !== undefined) config.enemyArmor = enemyArmor;
    return config;
  };

  // Bespoke input for penetration tests with configurable damage type
  const createDmgInput = (
    dmg: number,
    modType: "physical" | "cold" | "erosion",
    options: { mods?: AffixLine[]; res?: number; armor?: number } = {},
  ): { loadout: Loadout; configuration: Configuration } => {
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
    // Set element-specific resistance based on damage type
    const penConfig: PenConfigInput = { enemyArmor: options.armor };
    if (options.res !== undefined) {
      if (modType === "cold") {
        penConfig.enemyColdRes = options.res;
      } else if (modType === "erosion") {
        penConfig.enemyErosionRes = options.res;
      }
    }
    return {
      loadout: initLoadout({
        gearPage: { equippedGear: { mainHand: weapon }, inventory: [] },
        customAffixLines: options.mods ?? [],
        skillPage: simpleAttackSkillPage(),
      }),
      configuration: createPenetrationConfig(penConfig),
    };
  };

  test("cold penetration counters cold resistance", () => {
    // 30% resistance, 10% penetration -> effective 20% resistance
    // 100 cold * (1 - 0.3 + 0.1) = 80
    const input = createDmgInput(100, "cold", {
      mods: affixLines([{ type: "ResPenPct", value: 10, penType: "cold" }]),
      res: 30,
    });
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 80 });
  });

  test("elemental penetration applies to all elemental types", () => {
    // 30% res, 10% elemental pen -> 20% effective res
    const input = createDmgInput(100, "cold", {
      mods: affixLines([
        { type: "ResPenPct", value: 10, penType: "elemental" },
      ]),
      res: 30,
    });
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 80 });
  });

  test("all penetration applies to erosion", () => {
    // erosion damage with "all" penetration
    const input = createDmgInput(100, "erosion", {
      mods: affixLines([{ type: "ResPenPct", value: 10, penType: "all" }]),
      res: 30,
    });
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 80 });
  });

  test("penetration stacks additively", () => {
    // 30% res, 5% cold pen + 5% elemental pen = 10% total pen
    const input = createDmgInput(100, "cold", {
      mods: affixLines([
        { type: "ResPenPct", value: 5, penType: "cold" },
        { type: "ResPenPct", value: 5, penType: "elemental" },
      ]),
      res: 30,
    });
    const results = calculateOffense(input);
    // 100 * (1 - 0.3 + 0.1) = 80
    validate(results, skillName, { avgHit: 80 });
  });

  test("wrong penetration type does not apply", () => {
    // cold damage with fire penetration - should not help
    const input = createDmgInput(100, "cold", {
      mods: affixLines([{ type: "ResPenPct", value: 10, penType: "fire" }]),
      res: 30,
    });
    const results = calculateOffense(input);
    // 100 * (1 - 0.3) = 70 (pen doesn't apply)
    validate(results, skillName, { avgHit: 70 });
  });

  test("penetration exceeding resistance deals bonus damage", () => {
    // 10% resistance, 30% penetration -> -20% effective resistance = 120% damage
    const input = createDmgInput(100, "cold", {
      mods: affixLines([{ type: "ResPenPct", value: 30, penType: "cold" }]),
      res: 10,
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
      mods: affixLines([{ type: "ArmorPenPct", value: 10 }]),
      armor: 27273,
    });
    const results = calculateOffense(input);
    // 100 phys * (1 - 0.5 + 0.1) = 60
    validate(results, skillName, { avgHit: 60 });
  });

  test("armor penetration reduces non-physical damage mitigation equally", () => {
    // 30% non-phys armor mitigation, 10% armor pen -> 20% effective
    const input = createDmgInput(100, "cold", {
      mods: affixLines([{ type: "ArmorPenPct", value: 10 }]),
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
      mods: affixLines([
        { type: "ArmorPenPct", value: 5 },
        { type: "ArmorPenPct", value: 5 },
      ]),
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
    const input = createDmgInput(100, "cold", { armor: 27273, res: 30 });
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 49 });
  });

  test("penetration reduces both resistance and armor effects", () => {
    // 30% res with 10% pen -> 20% res, 30% armor with 10% pen -> 20% armor
    // Damage = 100 * (1 - 0.2) * (1 - 0.2) = 100 * 0.8 * 0.8 = 64
    const input = createDmgInput(100, "cold", {
      mods: affixLines([
        { type: "ResPenPct", value: 10, penType: "cold" },
        { type: "ArmorPenPct", value: 10 },
      ]),
      armor: 27273,
      res: 30,
    });
    const results = calculateOffense(input);
    // 100 * (1 - 0.3 + 0.1) * (1 - 0.3 + 0.1) = 100 * 0.8 * 0.8 = 64
    validate(results, skillName, { avgHit: 64 });
  });

  test("physical damage only affected by armor, not resistance", () => {
    // Physical damage should ignore elemental resistance
    const input = createDmgInput(100, "physical", { armor: 27273, res: 30 });
    const results = calculateOffense(input);
    // 100 phys * (1 - 0.5) = 50 (resistance doesn't apply)
    validate(results, skillName, { avgHit: 50 });
  });

  describe("enemy resistance reduction (EnemyRes mod)", () => {
    test("EnemyRes mod reduces cold resistance", () => {
      // 30% base resistance, -10% from EnemyRes mod -> 20% effective resistance
      // 100 cold * (1 - 0.2) = 80
      const input = createDmgInput(100, "cold", {
        mods: affixLines([{ type: "EnemyRes", value: -10, resType: "cold" }]),
        res: 30,
      });
      const results = calculateOffense(input);
      validate(results, skillName, { avgHit: 80 });
    });

    test("EnemyRes with elemental type applies to cold, lightning, fire", () => {
      // -10% elemental resistance reduction applies to cold damage
      // 30% base res - 10% = 20% effective resistance
      const input = createDmgInput(100, "cold", {
        mods: affixLines([
          { type: "EnemyRes", value: -10, resType: "elemental" },
        ]),
        res: 30,
      });
      const results = calculateOffense(input);
      validate(results, skillName, { avgHit: 80 });
    });

    test("EnemyRes with erosion type applies to erosion damage", () => {
      // -10% erosion resistance reduction
      // 30% base res - 10% = 20% effective resistance
      const input = createDmgInput(100, "erosion", {
        mods: affixLines([
          { type: "EnemyRes", value: -10, resType: "erosion" },
        ]),
        res: 30,
      });
      const results = calculateOffense(input);
      validate(results, skillName, { avgHit: 80 });
    });

    test("EnemyRes mods stack additively", () => {
      // 30% base res, -5% cold + -5% elemental = 20% effective
      const input = createDmgInput(100, "cold", {
        mods: affixLines([
          { type: "EnemyRes", value: -5, resType: "cold" },
          { type: "EnemyRes", value: -5, resType: "elemental" },
        ]),
        res: 30,
      });
      const results = calculateOffense(input);
      validate(results, skillName, { avgHit: 80 });
    });

    test("wrong EnemyRes type does not apply", () => {
      // -10% fire resistance on cold damage - should not help
      const input = createDmgInput(100, "cold", {
        mods: affixLines([{ type: "EnemyRes", value: -10, resType: "fire" }]),
        res: 30,
      });
      const results = calculateOffense(input);
      // 100 * (1 - 0.3) = 70 (reduction doesn't apply)
      validate(results, skillName, { avgHit: 70 });
    });

    test("elemental EnemyRes does not apply to erosion", () => {
      // -10% elemental resistance on erosion damage - should not help
      const input = createDmgInput(100, "erosion", {
        mods: affixLines([
          { type: "EnemyRes", value: -10, resType: "elemental" },
        ]),
        res: 30,
      });
      const results = calculateOffense(input);
      // 100 * (1 - 0.3) = 70 (elemental doesn't apply to erosion)
      validate(results, skillName, { avgHit: 70 });
    });

    test("EnemyRes can reduce resistance below zero for bonus damage", () => {
      // 10% base res, -30% reduction -> -20% effective = 120% damage
      const input = createDmgInput(100, "cold", {
        mods: affixLines([{ type: "EnemyRes", value: -30, resType: "cold" }]),
        res: 10,
      });
      const results = calculateOffense(input);
      // 100 * (1 - (-0.2)) = 100 * 1.2 = 120
      validate(results, skillName, { avgHit: 120 });
    });

    test("EnemyRes combines with penetration", () => {
      // 40% base res, -10% EnemyRes = 30% res, then 10% pen -> 20% effective
      const input = createDmgInput(100, "cold", {
        mods: affixLines([
          { type: "EnemyRes", value: -10, resType: "cold" },
          { type: "ResPenPct", value: 10, penType: "cold" },
        ]),
        res: 40,
      });
      const results = calculateOffense(input);
      // 100 * (1 - 0.3 + 0.1) = 80
      validate(results, skillName, { avgHit: 80 });
    });
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
          mods: [{ type: "GearBasePhysDmg", value: 100 } as const],
        },
        {
          text: "1.0 attack speed",
          mods: [{ type: "GearBaseAttackSpeed", value: 1.0 } as const],
        },
      ],
    },
  };

  const createDoubleDmgInput = (mods: AffixLine[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: weaponWithAspd }, inventory: [] },
      customAffixLines: mods,
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
    const input = createDoubleDmgInput(
      affixLines([{ type: "DoubleDmgChancePct", value: 30 }]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgDps: 133.25 });
  });

  test("multiple double damage chance sources stack additively", () => {
    // 20% + 15% = 35% total double damage chance
    // avgHitWithCrit = 102.5 (same as above)
    // doubleDmgMult = 1 + 0.35 = 1.35
    // avgDps = 102.5 * 1.35 * 1.0 = 138.375
    const input = createDoubleDmgInput(
      affixLines([
        { type: "DoubleDmgChancePct", value: 20 },
        { type: "DoubleDmgChancePct", value: 15 },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgDps: 138.375 });
  });

  test("double damage chance caps at 100%", () => {
    // 70% + 50% = 120%, but capped at 100%
    // avgHitWithCrit = 102.5
    // doubleDmgMult = 1 + 1.0 = 2.0 (capped)
    // avgDps = 102.5 * 2.0 * 1.0 = 205
    const input = createDoubleDmgInput(
      affixLines([
        { type: "DoubleDmgChancePct", value: 70 },
        { type: "DoubleDmgChancePct", value: 50 },
      ]),
    );
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
          mods: [{ type: "GearBasePhysDmg", value: 0 } as const],
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

  const createInput = (mods: AffixLine[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: coldWeapon }, inventory: [] },
      customAffixLines: mods,
      skillPage: simpleAttackSkillPage(),
      heroPage: {
        selectedHero: "Lightbringer Rosa: Unsullied Blade (#2)" as const,
        traits: {},
        memorySlots: {},
        memoryInventory: [],
      },
    }),
    configuration: defaultConfiguration,
  });

  test("mercury pts scale from max mana", () => {
    // 1000 mana
    // MaxMercuryPtsPct: 1.0 per 1000 mana → 100% bonus → 200 mercury pts
    // DmgPct: 0.01 per mercury pt → 200 * 0.01 = 2.0 (200% more) → 3x
    // 100 cold * 3 = 300
    const input = createInput(
      affixLines([
        flatManaTo1000,
        {
          type: "MaxMercuryPtsPct",
          value: 100,
          per: { stackable: "max_mana", amt: 1000 },
        },
        {
          type: "DmgPct",
          value: 1,
          dmgModType: "cold",
          addn: true,
          per: { stackable: "mercury_pt" },
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 300 });
  });

  test("mercury pts scale linearly with more mana", () => {
    // 2000 mana (add 1485 instead of 485)
    // MaxMercuryPtsPct: 1.0 per 1000 mana → 200% bonus → 300 mercury pts
    // DmgPct: 0.01 per mercury pt → 300 * 0.01 = 3.0 (300% more) → 4x
    // 100 cold * 4 = 400
    const input = createInput(
      affixLines([
        { type: "MaxMana", value: 1485 },
        {
          type: "MaxMercuryPtsPct",
          value: 100,
          per: { stackable: "max_mana", amt: 1000 },
        },
        {
          type: "DmgPct",
          value: 1,
          dmgModType: "cold",
          addn: true,
          per: { stackable: "mercury_pt" },
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 400 });
  });

  test("mercury pts respect valueLimit cap", () => {
    // 2000 mana, but mercury pts capped at 50% bonus
    // MaxMercuryPtsPct: 1.0 per 1000 mana, valueLimit 0.5 → capped at 50% → 150 mercury pts
    // DmgPct: 0.01 per mercury pt → 150 * 0.01 = 1.5 (150% more) → 2.5x
    // 100 cold * 2.5 = 250
    const input = createInput(
      affixLines([
        { type: "MaxMana", value: 1485 },
        {
          type: "MaxMercuryPtsPct",
          value: 100,
          per: { stackable: "max_mana", amt: 1000, valueLimit: 50 },
        },
        {
          type: "DmgPct",
          value: 1,
          dmgModType: "cold",
          addn: true,
          per: { stackable: "mercury_pt" },
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 250 });
  });

  test("multiple more multipliers from mana and mercury pts", () => {
    // 1000 mana → 200 mercury pts (same as first test)
    // DmgPct per mercury: 0.01 * 200 = 2.0 → 3x
    // Additional DmgPct per mana: 0.001 * 1000 = 1.0 → 2x
    // Combined more multipliers: 3 * 2 = 6x
    // 100 cold * 6 = 600
    const input = createInput(
      affixLines([
        flatManaTo1000,
        {
          type: "MaxMercuryPtsPct",
          value: 100,
          per: { stackable: "max_mana", amt: 1000 },
        },
        {
          type: "DmgPct",
          value: 1,
          dmgModType: "cold",
          addn: true,
          per: { stackable: "mercury_pt" },
        },
        {
          type: "DmgPct",
          value: 0.1,
          dmgModType: "cold",
          addn: true,
          per: { stackable: "max_mana" },
        },
      ]),
    );
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 600 });
  });
});

describe("condThreshold filtering", () => {
  const skillName = "[Test] Simple Attack" as const;

  const createInput = (
    mods: AffixLine[],
    configOverrides: Partial<Configuration> = {},
  ) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customAffixLines: mods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: { ...createDefaultConfiguration(), ...configOverrides },
  });

  test("mod without condThreshold is always included", () => {
    const input = createInput(
      affixLines([
        { type: "DmgPct", value: 100, dmgModType: "physical", addn: false },
      ]),
    );
    const results = calculateOffense(input);
    // 100 phys * 2x = 200
    validate(results, skillName, { avgHit: 200 });
  });

  test("num_enemies_nearby gt threshold - satisfied", () => {
    const input = createInput(
      affixLines([
        {
          type: "DmgPct",
          value: 100,
          dmgModType: "physical",
          addn: false,
          condThreshold: {
            target: "num_enemies_nearby",
            comparator: "gt",
            value: 2,
          },
        },
      ]),
      { numEnemiesNearby: 3 },
    );
    const results = calculateOffense(input);
    // 3 > 2, mod included: 100 * 2x = 200
    validate(results, skillName, { avgHit: 200 });
  });

  test("num_enemies_nearby gt threshold - not satisfied", () => {
    const input = createInput(
      affixLines([
        {
          type: "DmgPct",
          value: 100,
          dmgModType: "physical",
          addn: false,
          condThreshold: {
            target: "num_enemies_nearby",
            comparator: "gt",
            value: 2,
          },
        },
      ]),
      { numEnemiesNearby: 2 },
    );
    const results = calculateOffense(input);
    // 2 > 2 is false, mod excluded: 100 * 1x = 100
    validate(results, skillName, { avgHit: 100 });
  });

  test("num_enemies_nearby gte threshold - boundary satisfied", () => {
    const input = createInput(
      affixLines([
        {
          type: "DmgPct",
          value: 100,
          dmgModType: "physical",
          addn: false,
          condThreshold: {
            target: "num_enemies_nearby",
            comparator: "gte",
            value: 3,
          },
        },
      ]),
      { numEnemiesNearby: 3 },
    );
    const results = calculateOffense(input);
    // 3 >= 3, mod included: 100 * 2x = 200
    validate(results, skillName, { avgHit: 200 });
  });

  test("num_enemies_nearby lt threshold", () => {
    const input = createInput(
      affixLines([
        {
          type: "DmgPct",
          value: 100,
          dmgModType: "physical",
          addn: false,
          condThreshold: {
            target: "num_enemies_nearby",
            comparator: "lt",
            value: 5,
          },
        },
      ]),
      { numEnemiesNearby: 3 },
    );
    const results = calculateOffense(input);
    // 3 < 5, mod included: 100 * 2x = 200
    validate(results, skillName, { avgHit: 200 });
  });

  test("num_enemies_nearby eq threshold", () => {
    const input = createInput(
      affixLines([
        {
          type: "DmgPct",
          value: 100,
          dmgModType: "physical",
          addn: false,
          condThreshold: {
            target: "num_enemies_nearby",
            comparator: "eq",
            value: 5,
          },
        },
      ]),
      { numEnemiesNearby: 5 },
    );
    const results = calculateOffense(input);
    // 5 === 5, mod included: 100 * 2x = 200
    validate(results, skillName, { avgHit: 200 });
  });

  test("num_enemies_affected_by_warcry threshold", () => {
    const input = createInput(
      affixLines([
        {
          type: "DmgPct",
          value: 100,
          dmgModType: "physical",
          addn: false,
          condThreshold: {
            target: "num_enemies_affected_by_warcry",
            comparator: "gte",
            value: 10,
          },
        },
      ]),
      { numEnemiesAffectedByWarcry: 15 },
    );
    const results = calculateOffense(input);
    // 15 >= 10, mod included: 100 * 2x = 200
    validate(results, skillName, { avgHit: 200 });
  });
});

describe("added skill levels from mods", () => {
  const skillName = "[Test] Simple Attack" as const;

  const createInputWithSkillLevelMod = (
    baseLevel: number,
    skillLevelMods: AffixLine[],
  ) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customAffixLines: skillLevelMods,
      skillPage: {
        activeSkills: {
          1: {
            skillName: "[Test] Simple Attack" as const,
            enabled: true,
            level: baseLevel,
            supportSkills: {},
          },
        },
        passiveSkills: {},
      },
    }),
    configuration: defaultConfiguration,
  });

  test("SkillLevel mod with 'main' type adds to main skill", () => {
    const input = createInputWithSkillLevelMod(
      20,
      affixLines([{ type: "SkillLevel", value: 5, skillLevelType: "main" }]),
    );
    const results = calculateOffense(input);
    // Base level 20 + 5 = 25, so 100 * 1.1^5 = 161.051
    validate(results, skillName, { avgHit: 161.051 });
  });

  test("multiple SkillLevel mods stack additively", () => {
    const input = createInputWithSkillLevelMod(
      20,
      affixLines([
        { type: "SkillLevel", value: 3, skillLevelType: "main" },
        { type: "SkillLevel", value: 2, skillLevelType: "main" },
      ]),
    );
    const results = calculateOffense(input);
    // Base level 20 + 3 + 2 = 25, so 100 * 1.1^5 = 161.051
    validate(results, skillName, { avgHit: 161.051 });
  });

  test("SkillLevel mod with 'support' type does not affect main skill", () => {
    const input = createInputWithSkillLevelMod(
      20,
      affixLines([{ type: "SkillLevel", value: 5, skillLevelType: "support" }]),
    );
    const results = calculateOffense(input);
    // Support skill level mod doesn't affect main skill, stays at level 20
    validate(results, skillName, { avgHit: 100 });
  });

  test("SkillLevel mod can push skill above level 30 threshold", () => {
    const input = createInputWithSkillLevelMod(
      28,
      affixLines([{ type: "SkillLevel", value: 7, skillLevelType: "main" }]),
    );
    const results = calculateOffense(input);
    // Base level 28 + 7 = 35, so 100 * 1.1^10 * 1.08^5 = 381.106
    validate(results, skillName, { avgHit: 381.106 });
  });
});

describe("resistance calculations", () => {
  const createResInput = (mods: Mod[]) => ({
    loadout: initLoadout({ customAffixLines: affixLines(mods) }),
    configuration: createDefaultConfiguration(),
  });

  test("default resistances with no mods", () => {
    const input = createResInput([]);
    const results = calculateOffense(input);
    expect(results.defenses).toEqual({
      coldRes: { max: 60, potential: 0, actual: 0 },
      lightningRes: { max: 60, potential: 0, actual: 0 },
      fireRes: { max: 60, potential: 0, actual: 0 },
      erosionRes: { max: 60, potential: 0, actual: 0 },
      attackBlockPct: 0,
      spellBlockPct: 0,
      blockRatioPct: 30,
    });
  });

  test("single cold resistance mod", () => {
    const input = createResInput([
      { type: "ResistancePct", value: 30, resType: "cold" },
    ]);
    const results = calculateOffense(input);
    expect(results.defenses.coldRes).toEqual({
      max: 60,
      potential: 30,
      actual: 30,
    });
    expect(results.defenses.lightningRes.actual).toBe(0);
    expect(results.defenses.fireRes.actual).toBe(0);
    expect(results.defenses.erosionRes.actual).toBe(0);
  });

  test("stacking resistance mods", () => {
    const input = createResInput([
      { type: "ResistancePct", value: 20, resType: "fire" },
      { type: "ResistancePct", value: 15, resType: "fire" },
    ]);
    const results = calculateOffense(input);
    expect(results.defenses.fireRes).toEqual({
      max: 60,
      potential: 35,
      actual: 35,
    });
  });

  test("elemental resistance applies to cold, lightning, and fire", () => {
    const input = createResInput([
      { type: "ResistancePct", value: 25, resType: "elemental" },
    ]);
    const results = calculateOffense(input);
    expect(results.defenses.coldRes.actual).toBe(25);
    expect(results.defenses.lightningRes.actual).toBe(25);
    expect(results.defenses.fireRes.actual).toBe(25);
    expect(results.defenses.erosionRes.actual).toBe(0);
  });

  test("elemental resistance stacks with specific element resistance", () => {
    const input = createResInput([
      { type: "ResistancePct", value: 20, resType: "elemental" },
      { type: "ResistancePct", value: 15, resType: "cold" },
    ]);
    const results = calculateOffense(input);
    expect(results.defenses.coldRes.actual).toBe(35);
    expect(results.defenses.lightningRes.actual).toBe(20);
    expect(results.defenses.fireRes.actual).toBe(20);
  });

  test("max resistance mod increases cap", () => {
    const input = createResInput([
      { type: "MaxResistancePct", value: 5, resType: "fire" },
    ]);
    const results = calculateOffense(input);
    expect(results.defenses.fireRes.max).toBe(65);
    expect(results.defenses.coldRes.max).toBe(60);
  });

  test("max resistance capped at 90", () => {
    const input = createResInput([
      { type: "MaxResistancePct", value: 50, resType: "lightning" },
    ]);
    const results = calculateOffense(input);
    expect(results.defenses.lightningRes.max).toBe(90);
  });

  test("elemental max resistance applies to cold, lightning, and fire", () => {
    const input = createResInput([
      { type: "MaxResistancePct", value: 10, resType: "elemental" },
    ]);
    const results = calculateOffense(input);
    expect(results.defenses.coldRes.max).toBe(70);
    expect(results.defenses.lightningRes.max).toBe(70);
    expect(results.defenses.fireRes.max).toBe(70);
    expect(results.defenses.erosionRes.max).toBe(60);
  });

  test("actual resistance capped at max, potential uncapped", () => {
    const input = createResInput([
      { type: "ResistancePct", value: 80, resType: "cold" },
    ]);
    const results = calculateOffense(input);
    expect(results.defenses.coldRes).toEqual({
      max: 60,
      potential: 80,
      actual: 60,
    });
  });

  test("actual resistance respects increased max", () => {
    const input = createResInput([
      { type: "MaxResistancePct", value: 15, resType: "erosion" },
      { type: "ResistancePct", value: 70, resType: "erosion" },
    ]);
    const results = calculateOffense(input);
    expect(results.defenses.erosionRes).toEqual({
      max: 75,
      potential: 70,
      actual: 70,
    });
  });

  test("negative resistance allowed", () => {
    const input = createResInput([
      { type: "ResistancePct", value: -20, resType: "fire" },
    ]);
    const results = calculateOffense(input);
    expect(results.defenses.fireRes).toEqual({
      max: 60,
      potential: -20,
      actual: -20,
    });
  });
});

const simpleSpellSkillPage = () => ({
  activeSkills: {
    1: {
      skillName: "[Test] Simple Spell" as const,
      enabled: true,
      level: 20,
      supportSkills: {},
    },
  },
  passiveSkills: {},
});

describe("spell damage", () => {
  const skillName = "[Test] Simple Spell" as const;

  const createSpellInput = (mods: AffixLine[], config?: Configuration) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: {}, inventory: [] },
      customAffixLines: mods,
      skillPage: simpleSpellSkillPage(),
    }),
    configuration: config ?? defaultConfiguration,
  });

  type SpellExpectedOutput = Partial<{
    avgHitWithCrit: number;
    critChance: number;
    critDmgMult: number;
    castsPerSec: number;
    avgDps: number;
  }>;

  const validateSpell = (
    results: OffenseResults,
    expected: SpellExpectedOutput,
  ) => {
    const actual = results.skills[skillName];
    expect(actual).toBeDefined();
    expect(actual?.spellDpsSummary).toBeDefined();
    for (const [key, value] of Object.entries(expected)) {
      expect(
        actual?.spellDpsSummary?.[key as keyof SpellExpectedOutput],
      ).toBeCloseTo(value);
    }
  };

  // Helper: base crit is 5% chance, 150% damage
  // avgHitWithCrit = avg * 0.05 * 1.5 + avg * 0.95 = avg * 1.025
  const baseCritMult = 1.025;

  test("basic spell damage calculation", () => {
    // [Test] Simple Spell at level 20: 100 physical damage, 1s cast time
    // With base crit (5% @ 150%): avgHitWithCrit = 100 * 1.025 = 102.5
    const input = createSpellInput([]);
    const results = calculateOffense(input);
    validateSpell(results, {
      avgHitWithCrit: 100 * baseCritMult,
      castsPerSec: 1,
      avgDps: 100 * baseCritMult,
    });
  });

  test("damage modifiers apply correctly", () => {
    // 100% increased spell + 100% increased global + 50% more = 100 * 3 * 1.5 = 450 base
    const input = createSpellInput(
      affixLines([
        { type: "DmgPct", value: 100, dmgModType: "spell", addn: false },
        { type: "DmgPct", value: 100, dmgModType: "global", addn: false },
        { type: "DmgPct", value: 50, dmgModType: "global", addn: true },
      ]),
    );
    const results = calculateOffense(input);
    validateSpell(results, {
      avgHitWithCrit: 450 * baseCritMult,
      avgDps: 450 * baseCritMult,
    });
  });

  test("attack damage does not affect spell", () => {
    // Attack damage modifiers should not apply to spells
    const input = createSpellInput(
      affixLines([
        { type: "DmgPct", value: 100, dmgModType: "attack", addn: false },
      ]),
    );
    const results = calculateOffense(input);
    validateSpell(results, {
      avgHitWithCrit: 100 * baseCritMult,
      avgDps: 100 * baseCritMult,
    });
  });

  test("cast speed modifier applies", () => {
    // 100% increased cast speed: 1 cast/sec * 2 = 2 casts/sec
    // avgDps = 100 * baseCritMult * 2
    const input = createSpellInput(
      affixLines([{ type: "CspdPct", value: 100, addn: false }]),
    );
    const results = calculateOffense(input);
    validateSpell(results, { castsPerSec: 2, avgDps: 100 * baseCritMult * 2 });
  });

  test("crit rating and crit damage apply", () => {
    // Base crit: 5% @ 150%. CritRatingPct is a multiplier on the 5%.
    // +1900% crit rating = 5% * 20 = 100% crit chance (capped at 100%)
    // +150% crit dmg = 150% + 150% = 300% crit multiplier
    // avgHitWithCrit = 100 * 1.0 * 3.0 = 300
    const input = createSpellInput(
      affixLines([
        { type: "CritRatingPct", value: 1900, modType: "global" },
        { type: "CritDmgPct", value: 150, modType: "global", addn: false },
      ]),
    );
    const results = calculateOffense(input);
    validateSpell(results, {
      critChance: 1,
      critDmgMult: 3,
      avgHitWithCrit: 300,
    });
  });

  test("flat damage to spells applies", () => {
    // +100 flat physical to spells with 100% added dmg effectiveness = +100 base
    // Total: 100 + 100 = 200 base
    const input = createSpellInput(
      affixLines([
        {
          type: "FlatDmgToSpells",
          value: { min: 100, max: 100 },
          dmgType: "physical",
        },
      ]),
    );
    const results = calculateOffense(input);
    validateSpell(results, {
      avgHitWithCrit: 200 * baseCritMult,
      avgDps: 200 * baseCritMult,
    });
  });

  test("flat damage to attacks does not affect spell", () => {
    // Flat damage to attacks should not apply to spells
    const input = createSpellInput(
      affixLines([
        {
          type: "FlatDmgToAtks",
          value: { min: 100, max: 100 },
          dmgType: "physical",
        },
      ]),
    );
    const results = calculateOffense(input);
    validateSpell(results, {
      avgHitWithCrit: 100 * baseCritMult,
      avgDps: 100 * baseCritMult,
    });
  });

  test("physical damage modifier applies to physical spell", () => {
    // [Test] Simple Spell deals physical damage
    // 100% increased physical damage: 100 * 2 = 200 base
    const input = createSpellInput(
      affixLines([
        { type: "DmgPct", value: 100, dmgModType: "physical", addn: false },
      ]),
    );
    const results = calculateOffense(input);
    validateSpell(results, {
      avgHitWithCrit: 200 * baseCritMult,
      avgDps: 200 * baseCritMult,
    });
  });

  test("damage conversion works for spells", () => {
    // Convert 100% physical to cold, then cold damage bonus applies
    // 100 phys -> 100 cold, then 100% increased cold = 200 base
    const input = createSpellInput(
      affixLines([
        { type: "ConvertDmgPct", from: "physical", to: "cold", value: 100 },
        { type: "DmgPct", value: 100, dmgModType: "cold", addn: false },
      ]),
    );
    const results = calculateOffense(input);
    validateSpell(results, {
      avgHitWithCrit: 200 * baseCritMult,
      avgDps: 200 * baseCritMult,
    });
  });

  test("enemy resistance reduces spell damage", () => {
    // Convert to cold, enemy has 50% cold resistance
    // 100 cold * 0.5 = 50 base
    const config: Configuration = {
      ...createDefaultConfiguration(),
      enemyColdRes: 50,
    };
    const input = createSpellInput(
      affixLines([
        { type: "ConvertDmgPct", from: "physical", to: "cold", value: 100 },
      ]),
      config,
    );
    const results = calculateOffense(input);
    validateSpell(results, {
      avgHitWithCrit: 50 * baseCritMult,
      avgDps: 50 * baseCritMult,
    });
  });

  test("Chain Lightning basic calculation", () => {
    // Chain Lightning at level 20: 95-1811 lightning damage (avg 953), 0.65s cast time
    const input = {
      loadout: initLoadout({
        gearPage: { equippedGear: {}, inventory: [] },
        skillPage: {
          activeSkills: {
            1: {
              skillName: "Chain Lightning" as const,
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
    const skill = results.skills["Chain Lightning"];
    expect(skill).toBeDefined();
    expect(skill?.spellDpsSummary).toBeDefined();
    // avg damage = (95 + 1371) / 2 = 733
    // castsPerSec = 1 / 0.65 ≈ 1.538
    // With base crit: avgHitWithCrit = 733 * 1.025 = 751.325
    // avgDps = 751.325 * 1.538 ≈ 1155.5
    expect(skill?.spellDpsSummary?.castsPerSec).toBeCloseTo(1 / 0.65);
    expect(skill?.spellDpsSummary?.avgHitWithCrit).toBeCloseTo(
      733 * baseCritMult,
    );
    expect(skill?.spellDpsSummary?.avgDps).toBeCloseTo(
      733 * baseCritMult * (1 / 0.65),
    );
  });
});

describe("spell burst", () => {
  const skillName = "[Test] Simple Spell" as const;
  const baseCritMult = 1.025;

  const createSpellBurstInput = (
    mods: AffixLine[],
    config?: Configuration,
  ) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: {}, inventory: [] },
      customAffixLines: mods,
      skillPage: simpleSpellSkillPage(),
    }),
    configuration: config ?? defaultConfiguration,
  });

  test("spell burst DPS with max burst stacks and no charge speed", () => {
    // Base spell: 100 damage, avgHitWithCrit = 100 * 1.025 = 102.5
    // maxSpellBurst = 3, base burstsPerSec = 0.5 (2s full charge)
    // Expected DPS = 0.5 * 3 * 102.5 = 153.75
    const input = createSpellBurstInput(
      affixLines([{ type: "MaxSpellBurst", value: 3 }]),
    );
    const results = calculateOffense(input);
    const skill = results.skills[skillName];
    expect(skill?.spellBurstDpsSummary).toBeDefined();
    expect(skill?.spellBurstDpsSummary?.maxSpellBurst).toBe(3);
    expect(skill?.spellBurstDpsSummary?.burstsPerSec).toBeCloseTo(0.5);
    expect(skill?.spellBurstDpsSummary?.avgDps).toBeCloseTo(
      0.5 * 3 * 100 * baseCritMult,
    );
  });

  test("spell burst charge speed increases bursts per second", () => {
    // Base spell: 100 damage, avgHitWithCrit = 102.5
    // maxSpellBurst = 3, chargeSpeed = 100%
    // burstsPerSec = 0.5 * (100 + 100) / 100 = 1
    // Expected DPS = 1 * 3 * 102.5 = 307.5
    const input = createSpellBurstInput(
      affixLines([
        { type: "MaxSpellBurst", value: 3 },
        { type: "SpellBurstChargeSpeedPct", value: 100 },
      ]),
    );
    const results = calculateOffense(input);
    const skill = results.skills[skillName];
    expect(skill?.spellBurstDpsSummary).toBeDefined();
    expect(skill?.spellBurstDpsSummary?.burstsPerSec).toBeCloseTo(1);
    expect(skill?.spellBurstDpsSummary?.avgDps).toBeCloseTo(
      1 * 3 * 100 * baseCritMult,
    );
  });

  test("spell burst DPS is zero when max burst is zero", () => {
    // No MaxSpellBurst mod means maxSpellBurst = 0
    // DPS should be 0 regardless of charge speed
    const input = createSpellBurstInput(
      affixLines([{ type: "SpellBurstChargeSpeedPct", value: 100 }]),
    );
    const results = calculateOffense(input);
    const skill = results.skills[skillName];
    expect(skill?.spellBurstDpsSummary).toBeDefined();
    expect(skill?.spellBurstDpsSummary?.maxSpellBurst).toBe(0);
    expect(skill?.spellBurstDpsSummary?.avgDps).toBe(0);
  });

  test("PlaySafe applies cast speed bonus to spell burst charge speed", () => {
    // PlaySafe: 100% of cast speed bonus applies to spell burst charge speed
    // CspdPct = 50%, PlaySafe = 100% → effective charge speed = 50%
    // burstsPerSec = 0.5 * (100 + 50) / 100 = 0.75
    const input = createSpellBurstInput(
      affixLines([
        { type: "MaxSpellBurst", value: 3 },
        { type: "CspdPct", value: 50, addn: false },
        { type: "PlaySafe", value: 100 },
      ]),
    );
    const results = calculateOffense(input);
    const skill = results.skills[skillName];
    expect(skill?.spellBurstDpsSummary).toBeDefined();
    expect(skill?.spellBurstDpsSummary?.burstsPerSec).toBeCloseTo(0.75);
    expect(skill?.spellBurstDpsSummary?.avgDps).toBeCloseTo(
      0.75 * 3 * 100 * baseCritMult,
    );
  });

  test("cast speed does not affect spell burst charge speed without PlaySafe", () => {
    // Without PlaySafe, CspdPct should not affect spell burst charge speed
    // burstsPerSec should remain at base 0.5
    const input = createSpellBurstInput(
      affixLines([
        { type: "MaxSpellBurst", value: 3 },
        { type: "CspdPct", value: 50, addn: false },
      ]),
    );
    const results = calculateOffense(input);
    const skill = results.skills[skillName];
    expect(skill?.spellBurstDpsSummary).toBeDefined();
    expect(skill?.spellBurstDpsSummary?.burstsPerSec).toBeCloseTo(0.5);
    expect(skill?.spellBurstDpsSummary?.avgDps).toBeCloseTo(
      0.5 * 3 * 100 * baseCritMult,
    );
  });
});

describe("persistent damage", () => {
  const skillName = "[Test] Simple Persistent Spell" as const;

  const createPersistentInput = (
    mods: AffixLine[],
    config?: Configuration,
  ) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: {}, inventory: [] },
      customAffixLines: mods,
      skillPage: simplePersistentSpellSkillPage(),
    }),
    configuration: config ?? defaultConfiguration,
  });

  test("basic persistent damage", () => {
    // [Test] Simple Persistent Spell at level 20: 100 physical damage, 1s duration
    const input = createPersistentInput([]);
    const results = calculateOffense(input);
    const skill = results.skills[skillName];
    expect(skill?.persistentDpsSummary?.total).toBeCloseTo(100);
    expect(skill?.persistentDpsSummary?.duration).toBe(1);
    expect(skill?.persistentDpsSummary?.base.physical).toBeCloseTo(100);
  });

  test("increased damage modifier applies", () => {
    // 100% increased damage: 100 * 2 = 200
    const input = createPersistentInput(
      affixLines([
        { type: "DmgPct", value: 100, dmgModType: "global", addn: false },
      ]),
    );
    const results = calculateOffense(input);
    expect(results.skills[skillName]?.persistentDpsSummary?.total).toBeCloseTo(
      200,
    );
  });

  test("multiplicative damage modifier applies", () => {
    // 50% more damage: 100 * 1.5 = 150
    const input = createPersistentInput(
      affixLines([
        { type: "DmgPct", value: 50, dmgModType: "global", addn: true },
      ]),
    );
    const results = calculateOffense(input);
    expect(results.skills[skillName]?.persistentDpsSummary?.total).toBeCloseTo(
      150,
    );
  });

  test("physical damage modifier applies", () => {
    // 100% increased physical damage: 100 * 2 = 200
    const input = createPersistentInput(
      affixLines([
        { type: "DmgPct", value: 100, dmgModType: "physical", addn: false },
      ]),
    );
    const results = calculateOffense(input);
    expect(results.skills[skillName]?.persistentDpsSummary?.total).toBeCloseTo(
      200,
    );
  });

  test("damage conversion applies", () => {
    // 100% physical to cold: all damage becomes cold
    const input = createPersistentInput(
      affixLines([
        { type: "ConvertDmgPct", from: "physical", to: "cold", value: 100 },
      ]),
    );
    const results = calculateOffense(input);
    const summary = results.skills[skillName]?.persistentDpsSummary;
    expect(summary?.base.cold).toBeCloseTo(100);
    expect(summary?.base.physical).toBeCloseTo(0);
    expect(summary?.total).toBeCloseTo(100);
  });

  test("persistent damage ignores enemy armor", () => {
    // Enemy armor should not reduce persistent damage
    const config: Configuration = {
      ...createDefaultConfiguration(),
      enemyArmor: 1000,
    };
    const input = createPersistentInput([], config);
    const results = calculateOffense(input);
    const summary = results.skills[skillName]?.persistentDpsSummary;
    // Persistent damage should be unaffected by armor (still 100)
    expect(summary?.total).toBeCloseTo(100);
  });

  test("spell damage modifier applies", () => {
    // Skill has "Spell" tag, so spell damage should apply
    const input = createPersistentInput(
      affixLines([
        { type: "DmgPct", value: 100, dmgModType: "spell", addn: false },
      ]),
    );
    const results = calculateOffense(input);
    expect(results.skills[skillName]?.persistentDpsSummary?.total).toBeCloseTo(
      200,
    );
  });

  test("non-persistent skill has no persistentDpsSummary", () => {
    const input = {
      loadout: initLoadout({
        gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
        skillPage: simpleAttackSkillPage(),
      }),
      configuration: defaultConfiguration,
    };
    const results = calculateOffense(input);
    const skill = results.skills["[Test] Simple Attack"];
    expect(skill?.persistentDpsSummary).toBeUndefined();
  });
});

describe("reap mechanics", () => {
  const skillName = "[Test] Simple Persistent Spell" as const;

  const createReapInput = (mods: AffixLine[], config?: Configuration) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: {}, inventory: [] },
      customAffixLines: mods,
      skillPage: simplePersistentSpellSkillPage(),
    }),
    configuration: config ?? defaultConfiguration,
  });

  test("basic reap damage calculation", () => {
    // DOT: 100 DPS, 1s duration
    // Reap: 0.5s duration, 1s cooldown
    // Expected: dmgPerReap = 100 * 0.5 = 50
    // reapsPerSecond = 1 / 1 = 1
    // reapDps = 50 * 1 = 50
    const input = createReapInput(
      affixLines([{ type: "Reap", duration: 0.5, cooldown: 1 }]),
    );
    const results = calculateOffense(input);
    const reapSummary = results.skills[skillName]?.totalReapDpsSummary;

    expect(reapSummary).toBeDefined();
    expect(reapSummary?.reaps).toHaveLength(1);
    expect(reapSummary?.reaps[0].duration).toBeCloseTo(0.5);
    expect(reapSummary?.reaps[0].dmgPerReap).toBeCloseTo(50);
    expect(reapSummary?.reaps[0].reapsPerSecond).toBeCloseTo(1);
    expect(reapSummary?.reaps[0].reapDps).toBeCloseTo(50);
    expect(reapSummary?.totalReapDps).toBeCloseTo(50);
  });

  test("cooldown is rounded up to nearest 1/30 second", () => {
    // Cooldown of 0.4s should round up to 13/30 ≈ 0.4333s
    // reapsPerSecond = 1 / (13/30) = 30/13 ≈ 2.3077
    const input = createReapInput(
      affixLines([{ type: "Reap", duration: 0.5, cooldown: 0.4 }]),
    );
    const results = calculateOffense(input);
    const reapSummary = results.skills[skillName]?.totalReapDpsSummary;

    const expectedRoundedCooldown = Math.ceil(0.4 * 30) / 30; // 12/30 = 0.4, but ceil(12) = 12, so 12/30 = 0.4
    const expectedReapsPerSecond = 1 / expectedRoundedCooldown;

    expect(reapSummary?.reaps[0].reapsPerSecond).toBeCloseTo(
      expectedReapsPerSecond,
    );
  });

  test("cooldown rounding for non-aligned values", () => {
    // Cooldown of 0.35s: ceil(0.35 * 30) = ceil(10.5) = 11, so 11/30 ≈ 0.3667s
    // reapsPerSecond = 30/11 ≈ 2.727
    const input = createReapInput(
      affixLines([{ type: "Reap", duration: 0.5, cooldown: 0.35 }]),
    );
    const results = calculateOffense(input);
    const reapSummary = results.skills[skillName]?.totalReapDpsSummary;

    const expectedRoundedCooldown = Math.ceil(0.35 * 30) / 30; // 11/30
    const expectedReapsPerSecond = 1 / expectedRoundedCooldown;

    expect(reapSummary?.reaps[0].reapsPerSecond).toBeCloseTo(
      expectedReapsPerSecond,
    );
  });

  test("reap duration is capped at DOT duration", () => {
    // DOT duration is 1s, reap duration is 2s
    // Effective reap duration should be capped at 1s
    const input = createReapInput(
      affixLines([{ type: "Reap", duration: 2, cooldown: 1 }]),
    );
    const results = calculateOffense(input);
    const reapSummary = results.skills[skillName]?.totalReapDpsSummary;

    expect(reapSummary?.reaps[0].duration).toBeCloseTo(1); // capped at DOT duration
    expect(reapSummary?.reaps[0].dmgPerReap).toBeCloseTo(100); // 100 DPS * 1s
  });

  test("ReapDurationPct modifier increases reap duration", () => {
    // Base reap: 0.5s duration
    // +100% ReapDurationPct: 0.5 * 2 = 1s duration
    // dmgPerReap = 100 * 1 = 100
    const input = createReapInput(
      affixLines([
        { type: "Reap", duration: 0.5, cooldown: 1 },
        { type: "ReapDurationPct", value: 100 },
      ]),
    );
    const results = calculateOffense(input);
    const reapSummary = results.skills[skillName]?.totalReapDpsSummary;

    expect(reapSummary?.reapDurationBonusPct).toBeCloseTo(100);
    expect(reapSummary?.reaps[0].duration).toBeCloseTo(1);
    expect(reapSummary?.reaps[0].dmgPerReap).toBeCloseTo(100);
  });

  test("ReapCdrPct modifier reduces cooldown", () => {
    // Base cooldown: 1s
    // +100% ReapCdrPct: 1 / 2 = 0.5s cooldown
    // reapsPerSecond = 1 / 0.5 = 2
    const input = createReapInput(
      affixLines([
        { type: "Reap", duration: 0.5, cooldown: 1 },
        { type: "ReapCdrPct", value: 100 },
      ]),
    );
    const results = calculateOffense(input);
    const reapSummary = results.skills[skillName]?.totalReapDpsSummary;

    expect(reapSummary?.reapCdrBonusPct).toBeCloseTo(100);
    expect(reapSummary?.reaps[0].rawCooldown).toBeCloseTo(0.5);
    expect(reapSummary?.reaps[0].reapsPerSecond).toBeCloseTo(2);
    expect(reapSummary?.reaps[0].reapDps).toBeCloseTo(100); // 50 dmg * 2 reaps/s
  });

  test("multiple reap instances stack independently", () => {
    // Reap 1: 0.5s duration, 1s cooldown -> 50 dmg * 1 reap/s = 50 DPS
    // Reap 2: 0.3s duration, 0.5s cooldown -> 30 dmg * 2 reaps/s = 60 DPS
    // Total: 110 DPS
    const input = createReapInput(
      affixLines([
        { type: "Reap", duration: 0.5, cooldown: 1 },
        { type: "Reap", duration: 0.3, cooldown: 0.5 },
      ]),
    );
    const results = calculateOffense(input);
    const reapSummary = results.skills[skillName]?.totalReapDpsSummary;

    expect(reapSummary?.reaps).toHaveLength(2);
    expect(reapSummary?.reaps[0].reapDps).toBeCloseTo(50);
    expect(reapSummary?.reaps[1].reapDps).toBeCloseTo(60);
    expect(reapSummary?.totalReapDps).toBeCloseTo(110);
  });

  test("no reap summary when no Reap mods present", () => {
    const input = createReapInput([]);
    const results = calculateOffense(input);
    const reapSummary = results.skills[skillName]?.totalReapDpsSummary;

    expect(reapSummary).toBeUndefined();
  });

  test("reap damage scales with DOT damage modifiers", () => {
    // DOT with +100% damage: 100 * 2 = 200 DPS
    // Reap 0.5s: 200 * 0.5 = 100 dmgPerReap
    const input = createReapInput(
      affixLines([
        { type: "Reap", duration: 0.5, cooldown: 1 },
        { type: "DmgPct", value: 100, dmgModType: "global", addn: false },
      ]),
    );
    const results = calculateOffense(input);
    const reapSummary = results.skills[skillName]?.totalReapDpsSummary;

    expect(reapSummary?.reaps[0].dmgPerReap).toBeCloseTo(100);
    expect(reapSummary?.totalReapDps).toBeCloseTo(100);
  });

  test("non-persistent skill has no reap summary", () => {
    const input = {
      loadout: initLoadout({
        gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
        customAffixLines: affixLines([
          { type: "Reap", duration: 0.5, cooldown: 1 },
        ]),
        skillPage: simpleAttackSkillPage(),
      }),
      configuration: defaultConfiguration,
    };
    const results = calculateOffense(input);
    const skill = results.skills["[Test] Simple Attack"];
    expect(skill?.totalReapDpsSummary).toBeUndefined();
  });
});

describe("affliction mechanics", () => {
  const skillName = "[Test] Simple Persistent Spell" as const;

  const createAfflictionInput = (
    mods: AffixLine[],
    config: Partial<Configuration> = {},
  ) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: {}, inventory: [] },
      customAffixLines: mods,
      skillPage: simplePersistentSpellSkillPage(),
    }),
    configuration: { ...defaultConfiguration, ...config },
  });

  test("affliction effect percent increases affliction value", () => {
    // Base DOT: 100 DPS
    // Affliction: 100 pts * (1 + 50% inc) = 150 = +150% additional damage
    // Total: 100 * 2.5 = 250
    const input = createAfflictionInput(
      affixLines([{ type: "AfflictionEffectPct", value: 50, addn: false }]),
      { enemyHasAffliction: true, afflictionPts: 100 },
    );
    const results = calculateOffense(input);
    expect(results.skills[skillName]?.persistentDpsSummary?.total).toBeCloseTo(
      250,
    );
  });

  test("no affliction damage when enemyHasAffliction is false", () => {
    // Base DOT: 100 DPS, no affliction bonus
    const input = createAfflictionInput([], {
      enemyHasAffliction: false,
      afflictionPts: 100,
    });
    const results = calculateOffense(input);
    expect(results.skills[skillName]?.persistentDpsSummary?.total).toBeCloseTo(
      100,
    );
  });
});

describe("desecration mechanics", () => {
  const skillName = "[Test] Simple Persistent Spell" as const;

  const createDesecrationInput = (
    mods: AffixLine[],
    config: Partial<Configuration> = {},
  ) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: {}, inventory: [] },
      customAffixLines: mods,
      skillPage: simplePersistentSpellSkillPage(),
    }),
    configuration: { ...defaultConfiguration, ...config },
  });

  test("desecration stacks scale with max blessing additions (base 3, +1 per added max blessing up to 4 each)", () => {
    // With Blasphemer: base 3 desecration
    // +2 MaxFocusBlessing, +3 MaxAgilityBlessing, +5 MaxTenacityBlessing (capped at 4)
    // Total: 3 + 2 + 3 + 4 = 12 stacks
    // Each stack = 15% additional DOT damage, stacking multiplicatively
    // 1.15^12 = 5.35025x multiplier
    // Base DOT: 100 DPS * 5.35025 ≈ 535 DPS
    const input = createDesecrationInput(
      affixLines([
        { type: "Blasphemer" },
        { type: "MaxFocusBlessing", value: 2 },
        { type: "MaxAgilityBlessing", value: 3 },
        { type: "MaxTenacityBlessing", value: 5 },
      ]),
      { enemyHasDesecration: true },
    );
    const results = calculateOffense(input);

    expect(results.resourcePool.desecration).toBe(12);
    expect(results.skills[skillName]?.persistentDpsSummary?.total).toBeCloseTo(
      535.025,
    );
  });

  test("blasphemer trait reduces max blessings instead of increasing them", () => {
    // Without Blasphemer: max focus = 4 + 2 = 6
    // With Blasphemer: max focus = 4 - 2 = 2
    const inputWithBlasphemer = createDesecrationInput(
      affixLines([
        { type: "Blasphemer" },
        { type: "MaxFocusBlessing", value: 2 },
      ]),
    );
    const inputWithoutBlasphemer = createDesecrationInput(
      affixLines([{ type: "MaxFocusBlessing", value: 2 }]),
    );

    const resultsWithBlasphemer = calculateOffense(inputWithBlasphemer);
    const resultsWithoutBlasphemer = calculateOffense(inputWithoutBlasphemer);

    expect(resultsWithBlasphemer.resourcePool.maxFocusBlessings).toBe(2);
    expect(resultsWithoutBlasphemer.resourcePool.maxFocusBlessings).toBe(6);
    expect(resultsWithBlasphemer.resourcePool.desecration).toBe(5); // 3 base + 2 from focus
    expect(resultsWithoutBlasphemer.resourcePool.desecration).toBeUndefined();
  });
});

describe("lucky damage", () => {
  const skillName = "[Test] Simple Attack" as const;

  // Zero-damage weapon so we can isolate flat damage calculations
  const zeroDmgWeapon = {
    equipmentType: "Two-Handed Sword" as const,
    baseStats: {
      baseStatLines: [
        {
          text: "0 - 0 physical damage",
          mods: [{ type: "GearBasePhysDmg" as const, value: 0 }],
        },
        {
          text: "1.0 Attack Speed",
          mods: [{ type: "GearBaseAttackSpeed" as const, value: 1 }],
        },
      ],
    },
  };

  const createLuckyDmgInput = (
    dmgRange: { min: number; max: number },
    luckyDmg: boolean,
  ) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: zeroDmgWeapon }, inventory: [] },
      customAffixLines: affixLines([
        { type: "FlatDmgToAtks", value: dmgRange, dmgType: "physical" },
        ...(luckyDmg ? [{ type: "LuckyDmg" as const }] : []),
      ]),
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  test("lucky damage calculates average as (min + 2*max) / 3", () => {
    // Lucky damage: best of two rolls
    // min: 1095, max: 1643
    // Expected: (1095 + 2*1643) / 3 = 4381 / 3 ≈ 1460.3
    const input = createLuckyDmgInput({ min: 1095, max: 1643 }, true);
    const results = calculateOffense(input);
    const actual = results.skills[skillName];
    expect(actual?.attackDpsSummary?.mainhand.avgHit).toBeCloseTo(1460.3, 1);
  });

  test("lucky damage with wide range", () => {
    // min: 63, max: 1198
    // Expected: (63 + 2*1198) / 3 = 2459 / 3 ≈ 819.7
    const input = createLuckyDmgInput({ min: 63, max: 1198 }, true);
    const results = calculateOffense(input);
    const actual = results.skills[skillName];
    expect(actual?.attackDpsSummary?.mainhand.avgHit).toBeCloseTo(819.7, 1);
  });

  test("without lucky damage, average is (min + max) / 2", () => {
    // Same range as first test, but without lucky damage
    // Expected: (1095 + 1643) / 2 = 1369
    const input = createLuckyDmgInput({ min: 1095, max: 1643 }, false);
    const results = calculateOffense(input);
    const actual = results.skills[skillName];
    expect(actual?.attackDpsSummary?.mainhand.avgHit).toBeCloseTo(1369, 1);
  });
});

describe("dual wielding", () => {
  const skillName = "[Test] Simple Attack" as const;

  // Helper to create dual wielding input with two one-handed weapons
  const createDualWieldInput = (
    mainhand: { physDmg: number; aspd: number },
    offhand: { physDmg: number; aspd: number },
    extraMods: AffixLine[] = [],
  ) => ({
    loadout: initLoadout({
      gearPage: {
        equippedGear: {
          mainHand: {
            equipmentType: "One-Handed Sword" as const,
            baseStats: {
              baseStatLines: [
                {
                  text: `${mainhand.physDmg} - ${mainhand.physDmg} physical damage`,
                  mods: [
                    {
                      type: "GearBasePhysDmg" as const,
                      value: mainhand.physDmg,
                    },
                  ],
                },
                {
                  text: `${mainhand.aspd} Attack Speed`,
                  mods: [
                    {
                      type: "GearBaseAttackSpeed" as const,
                      value: mainhand.aspd,
                    },
                  ],
                },
              ],
            },
          },
          offHand: {
            equipmentType: "One-Handed Sword" as const,
            baseStats: {
              baseStatLines: [
                {
                  text: `${offhand.physDmg} - ${offhand.physDmg} physical damage`,
                  mods: [
                    {
                      type: "GearBasePhysDmg" as const,
                      value: offhand.physDmg,
                    },
                  ],
                },
                {
                  text: `${offhand.aspd} Attack Speed`,
                  mods: [
                    {
                      type: "GearBaseAttackSpeed" as const,
                      value: offhand.aspd,
                    },
                  ],
                },
              ],
            },
          },
        },
        inventory: [],
      },
      customAffixLines: extraMods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  // Helper to create mainhand-only input (for comparison)
  const createMainhandOnlyInput = (
    mainhand: { physDmg: number; aspd: number },
    extraMods: AffixLine[] = [],
  ) => ({
    loadout: initLoadout({
      gearPage: {
        equippedGear: {
          mainHand: {
            equipmentType: "One-Handed Sword" as const,
            baseStats: {
              baseStatLines: [
                {
                  text: `${mainhand.physDmg} - ${mainhand.physDmg} physical damage`,
                  mods: [
                    {
                      type: "GearBasePhysDmg" as const,
                      value: mainhand.physDmg,
                    },
                  ],
                },
                {
                  text: `${mainhand.aspd} Attack Speed`,
                  mods: [
                    {
                      type: "GearBaseAttackSpeed" as const,
                      value: mainhand.aspd,
                    },
                  ],
                },
              ],
            },
          },
        },
        inventory: [],
      },
      customAffixLines: extraMods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  // Helper to create weapon + shield input
  const createWeaponAndShieldInput = (
    mainhand: { physDmg: number; aspd: number },
    extraMods: AffixLine[] = [],
  ) => ({
    loadout: initLoadout({
      gearPage: {
        equippedGear: {
          mainHand: {
            equipmentType: "One-Handed Sword" as const,
            baseStats: {
              baseStatLines: [
                {
                  text: `${mainhand.physDmg} - ${mainhand.physDmg} physical damage`,
                  mods: [
                    {
                      type: "GearBasePhysDmg" as const,
                      value: mainhand.physDmg,
                    },
                  ],
                },
                {
                  text: `${mainhand.aspd} Attack Speed`,
                  mods: [
                    {
                      type: "GearBaseAttackSpeed" as const,
                      value: mainhand.aspd,
                    },
                  ],
                },
              ],
            },
          },
          offHand: {
            equipmentType: "Shield (STR)" as const,
            baseStats: { baseStatLines: [] },
          },
        },
        inventory: [],
      },
      customAffixLines: extraMods,
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  test("basic dual wielding with same weapons", () => {
    // Both weapons: 100 phys dmg, 1.0 base aspd
    // Dual wielding gives +10% additional attack speed
    // Final aspd: 1.0 * 1.1 = 1.1
    // Mainhand attack interval: 1 / 1.1 = 0.909s
    // Offhand attack interval: 1 / 1.1 = 0.909s
    // Full cycle: 1.818s
    // avgHitWithCrit per weapon: 100 * (0.05 * 1.5 + 0.95) = 100 * 1.025 = 102.5
    // avgDps = (102.5 + 102.5) / 1.818 = 112.75
    const input = createDualWieldInput(
      { physDmg: 100, aspd: 1.0 },
      { physDmg: 100, aspd: 1.0 },
    );
    const results = calculateOffense(input);
    const summary = results.skills[skillName]?.attackDpsSummary;

    expect(summary?.mainhand.avgHit).toBeCloseTo(100);
    expect(summary?.mainhand.aspd).toBeCloseTo(1.1);
    expect(summary?.offhand?.avgHit).toBeCloseTo(100);
    expect(summary?.offhand?.aspd).toBeCloseTo(1.1);
    expect(summary?.avgDps).toBeCloseTo(112.75);
  });

  test("dual wielding with different attack speeds", () => {
    // Mainhand: 100 phys dmg, 2.0 base aspd
    // Offhand: 100 phys dmg, 1.0 base aspd
    // Dual wielding gives +10% additional attack speed to both
    // Final mainhand aspd: 2.0 * 1.1 = 2.2, interval = 0.455s
    // Final offhand aspd: 1.0 * 1.1 = 1.1, interval = 0.909s
    // Full cycle: 0.455s + 0.909s = 1.364s
    // avgHitWithCrit per weapon: 102.5
    // avgDps = (102.5 + 102.5) / 1.364 = 150.37
    const input = createDualWieldInput(
      { physDmg: 100, aspd: 2.0 },
      { physDmg: 100, aspd: 1.0 },
    );
    const results = calculateOffense(input);
    const summary = results.skills[skillName]?.attackDpsSummary;

    expect(summary?.mainhand.aspd).toBeCloseTo(2.2); // 2.0 * 1.1 dual wield bonus
    expect(summary?.offhand?.aspd).toBeCloseTo(1.1); // 1.0 * 1.1 dual wield bonus
    expect(summary?.avgDps).toBeCloseTo(150.37, 1);
  });

  test("dual wielding with different damage values", () => {
    // Mainhand: 150 phys dmg, 1.0 base aspd
    // Offhand: 50 phys dmg, 1.0 base aspd
    // Dual wielding gives +10% additional attack speed
    // Final aspd: 1.0 * 1.1 = 1.1 for both
    // Full cycle: 1/1.1 + 1/1.1 = 1.818s
    // Mainhand avgHitWithCrit: 150 * 1.025 = 153.75
    // Offhand avgHitWithCrit: 50 * 1.025 = 51.25
    // avgDps = (153.75 + 51.25) / 1.818 = 112.75
    const input = createDualWieldInput(
      { physDmg: 150, aspd: 1.0 },
      { physDmg: 50, aspd: 1.0 },
    );
    const results = calculateOffense(input);
    const summary = results.skills[skillName]?.attackDpsSummary;

    expect(summary?.mainhand.avgHit).toBeCloseTo(150);
    expect(summary?.offhand?.avgHit).toBeCloseTo(50);
    expect(summary?.avgDps).toBeCloseTo(112.75);
  });

  test("mainhand-only DPS matches expected calculation", () => {
    // Mainhand: 100 phys dmg, 1.0 aspd
    // avgHitWithCrit: 102.5
    // avgDps = 102.5 * 1.0 = 102.5
    const input = createMainhandOnlyInput({ physDmg: 100, aspd: 1.0 });
    const results = calculateOffense(input);
    const summary = results.skills[skillName]?.attackDpsSummary;

    expect(summary?.mainhand.avgHit).toBeCloseTo(100);
    expect(summary?.mainhand.aspd).toBeCloseTo(1.0);
    expect(summary?.offhand).toBeUndefined();
    expect(summary?.avgDps).toBeCloseTo(102.5);
  });

  test("weapon with shield is not dual wielding", () => {
    // Mainhand: 100 phys dmg, 1.0 aspd + Shield
    // Should not have offhand weapon stats
    // avgDps should be same as mainhand-only: 102.5
    const input = createWeaponAndShieldInput({ physDmg: 100, aspd: 1.0 });
    const results = calculateOffense(input);
    const summary = results.skills[skillName]?.attackDpsSummary;

    expect(summary?.mainhand.avgHit).toBeCloseTo(100);
    expect(summary?.mainhand.aspd).toBeCloseTo(1.0);
    expect(summary?.offhand).toBeUndefined();
    expect(summary?.avgDps).toBeCloseTo(102.5);
  });

  test("dual wielding crit damage is shared", () => {
    // Both weapons same stats, add crit damage modifier
    // +100% crit damage -> critDmgMult = 2.5
    // Dual wielding gives +10% additional attack speed
    // Final aspd: 1.0 * 1.1 = 1.1, full cycle = 1.818s
    // avgHitWithCrit: 100 * (0.05 * 2.5 + 0.95) = 100 * 1.075 = 107.5
    // avgDps = (107.5 + 107.5) / 1.818 = 118.25
    const input = createDualWieldInput(
      { physDmg: 100, aspd: 1.0 },
      { physDmg: 100, aspd: 1.0 },
      affixLines([
        { type: "CritDmgPct", value: 100, modType: "global", addn: false },
      ]),
    );
    const results = calculateOffense(input);
    const summary = results.skills[skillName]?.attackDpsSummary;

    expect(summary?.critDmgMult).toBeCloseTo(2.5);
    expect(summary?.mainhand.avgHitWithCrit).toBeCloseTo(107.5);
    expect(summary?.offhand?.avgHitWithCrit).toBeCloseTo(107.5);
    expect(summary?.avgDps).toBeCloseTo(118.25);
  });

  test("joined force adds 60% of offhand damage to mainhand and disables offhand attacks", () => {
    // Joined Force:
    // - Off-Hand Weapons do not participate in attacks while Dual Wielding
    // - Adds 60% of Off-Hand Weapon damage to Main-Hand Weapon
    // Mainhand: 100 phys dmg, Offhand: 200 phys dmg
    // Both 1.0 base aspd, dual wielding +10% = 1.1 aspd
    // Offhand avgHit = 200, 60% of that = 120
    // Mainhand avgHit = 100 + 120 = 220
    // avgHitWithCrit = 220 * 1.025 = 225.5
    // Only mainhand attacks at 1.1 aspd: avgDps = 225.5 * 1.1 = 248.05
    const input = createDualWieldInput(
      { physDmg: 100, aspd: 1.0 },
      { physDmg: 200, aspd: 1.0 },
      affixLines([
        { type: "JoinedForceAddOffhandToMainhandPct", value: 60 },
        { type: "JoinedForceDisableOffhand" },
      ]),
    );
    const results = calculateOffense(input);
    const summary = results.skills[skillName]?.attackDpsSummary;

    // Mainhand gets 60% of offhand's avgHit added
    expect(summary?.mainhand.avgHit).toBeCloseTo(220);
    expect(summary?.mainhand.avgHitWithCrit).toBeCloseTo(225.5);
    expect(summary?.mainhand.aspd).toBeCloseTo(1.1);
    // Offhand is undefined in output (doesn't participate in attacks)
    expect(summary?.offhand).toBeUndefined();
    // DPS only comes from mainhand: 225.5 * 1.1 = 248.05
    expect(summary?.avgDps).toBeCloseTo(248.05);
  });
});

describe("multistrike damage bonus", () => {
  const skillName = "[Test] Simple Attack" as const;

  // Weapon with base attack speed for multistrike tests
  const weaponWithAspd = {
    equipmentType: "One-Handed Sword" as const,
    baseStats: {
      baseStatLines: [
        {
          text: "100 - 100 physical damage",
          mods: [{ type: "GearBasePhysDmg" as const, value: 100 }],
        },
        {
          text: "1.0 Attack Speed",
          mods: [{ type: "GearBaseAttackSpeed" as const, value: 1.0 }],
        },
      ],
    },
  };

  const createMultistrikeInput = (
    multistrikeChancePct: number,
    multistrikeIncDmgPct: number,
  ) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: weaponWithAspd }, inventory: [] },
      customAffixLines: affixLines([
        { type: "MultistrikeChancePct", value: multistrikeChancePct },
        { type: "MultistrikeIncDmgPct", value: multistrikeIncDmgPct },
      ]),
      skillPage: simpleAttackSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  test("no multistrike chance results in no damage change", () => {
    // 0% multistrike chance, 50% increasing damage
    // Should have no effect on damage (early return)
    const input = createMultistrikeInput(0, 50);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 100 });
  });

  test("multistrike with 0% increasing damage results in no damage change", () => {
    // 100% multistrike chance, 0% increasing damage
    // Should have no effect on damage (early return when incDmgPct <= 0)
    const input = createMultistrikeInput(100, 0);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 100 });
  });

  test("100% multistrike with 50% increasing damage", () => {
    // 100% multistrike = always 2 hits
    // hitNumber 0: prob=1.0, mult=1.0 → 1.0
    // hitNumber 1: prob=1.0, mult=1.5 → 1.5
    // expectedDmgMult = 2.5, expectedHits = 2.0
    // avgDmgPerHit = 2.5 / 2.0 = 1.25, bonus = 25%
    // Base 100 * 1.25 = 125
    const input = createMultistrikeInput(100, 50);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 125 });
  });

  test("50% multistrike with 50% increasing damage", () => {
    // 50% multistrike = 50% chance for 2nd hit
    // hitNumber 0: prob=1.0, mult=1.0 → 1.0
    // hitNumber 1: prob=0.5, mult=1.5 → 0.75
    // expectedDmgMult = 1.75, expectedHits = 1.5
    // avgDmgPerHit = 1.75 / 1.5 ≈ 1.167, bonus ≈ 16.67%
    // Base 100 * 1.167 ≈ 116.67
    const input = createMultistrikeInput(50, 50);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 116.67 });
  });

  test("150% multistrike with 50% increasing damage", () => {
    // 150% multistrike = always 2 hits, 50% chance for 3rd hit
    // hitNumber 0: prob=1.0, mult=1.0 → 1.0
    // hitNumber 1: prob=1.0, mult=1.5 → 1.5
    // hitNumber 2: prob=0.5, mult=2.0 → 1.0
    // expectedDmgMult = 3.5, expectedHits = 2.5
    // avgDmgPerHit = 3.5 / 2.5 = 1.4, bonus = 40%
    // Base 100 * 1.4 = 140
    const input = createMultistrikeInput(150, 50);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 140 });
  });

  test("200% multistrike with 30% increasing damage", () => {
    // 200% multistrike = always 3 hits
    // hitNumber 0: prob=1.0, mult=1.0 → 1.0
    // hitNumber 1: prob=1.0, mult=1.3 → 1.3
    // hitNumber 2: prob=1.0, mult=1.6 → 1.6
    // expectedDmgMult = 3.9, expectedHits = 3.0
    // avgDmgPerHit = 3.9 / 3.0 = 1.3, bonus = 30%
    // Base 100 * 1.3 = 130
    const input = createMultistrikeInput(200, 30);
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 130 });
  });

  test("multistrike attack speed bonus at 100%", () => {
    // 100% multistrike gives full 20% attack speed bonus
    // Base aspd 1.0 * 1.2 = 1.2
    const input = createMultistrikeInput(100, 50);
    const results = calculateOffense(input);
    validate(results, skillName, { aspd: 1.2 });
  });

  test("multistrike attack speed bonus at 50%", () => {
    // 50% multistrike gives half the attack speed bonus: 20% * 0.5 = 10%
    // Base aspd 1.0 * 1.1 = 1.1
    const input = createMultistrikeInput(50, 50);
    const results = calculateOffense(input);
    validate(results, skillName, { aspd: 1.1 });
  });

  test("100% multistrike with 30% increasing damage and initial count 2", () => {
    // Initial count 2 means first hit uses hitNumber=2 (as if 3rd hit)
    // 100% multistrike = always 2 hits
    // hitNumber 2: prob=1.0, mult=1.6 → 1.6
    // hitNumber 3: prob=1.0, mult=1.9 → 1.9
    // expectedDmgMult = 3.5, expectedHits = 2.0
    // avgDmgPerHit = 3.5 / 2.0 = 1.75, bonus = 75%
    // Base 100 * 1.75 = 175
    const input = {
      loadout: initLoadout({
        gearPage: { equippedGear: { mainHand: weaponWithAspd }, inventory: [] },
        customAffixLines: affixLines([
          { type: "MultistrikeChancePct", value: 100 },
          { type: "MultistrikeIncDmgPct", value: 30 },
          { type: "InitialMultistrikeCount", value: 2 },
        ]),
        skillPage: simpleAttackSkillPage(),
      }),
      configuration: defaultConfiguration,
    };
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 175 });
  });
});

describe("MainSkillSupportedBy mods", () => {
  // Tests for mods that add support skills to the main skill (e.g., from hero traits)
  // Uses Electric Overload which provides a simple additional lightning damage bonus

  const skillName = "[Test] Simple Attack" as const;

  test("MainSkillSupportedBy adds support skill mods to main skill", () => {
    // Electric Overload at level 10: 12.5% additional lightning damage
    // With 100% phys to lightning conversion: 100 lightning → 100 * 1.125 = 112.5
    const input = {
      loadout: initLoadout({
        gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
        customAffixLines: affixLines([
          {
            type: "ConvertDmgPct",
            from: "physical",
            to: "lightning",
            value: 100,
          },
          {
            type: "MainSkillSupportedBy",
            skillName: "Electric Overload",
            level: 10,
          },
        ]),
        skillPage: {
          activeSkills: {
            1: { skillName, enabled: true, level: 20, supportSkills: {} },
          },
          passiveSkills: {},
        },
      }),
      configuration: defaultConfiguration,
    };
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 112.5 });
  });

  test("MainSkillSupportedBy only applies to main skill (slot 1), not other slots", () => {
    // Skill in slot 2 should NOT receive the Electric Overload support
    // Expected: no bonus, avgHit = 100
    const input = {
      loadout: initLoadout({
        gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
        customAffixLines: affixLines([
          {
            type: "ConvertDmgPct",
            from: "physical",
            to: "lightning",
            value: 100,
          },
          {
            type: "MainSkillSupportedBy",
            skillName: "Electric Overload",
            level: 10,
          },
        ]),
        skillPage: {
          activeSkills: {
            2: { skillName, enabled: true, level: 20, supportSkills: {} },
          },
          passiveSkills: {},
        },
      }),
      configuration: defaultConfiguration,
    };
    const results = calculateOffense(input);
    validate(results, skillName, { avgHit: 100 });
  });
});

describe("slash-strike damage (Berserking Blade)", () => {
  const skillName = "Berserking Blade" as const;

  const berserkingBladeSkillPage = () => ({
    activeSkills: {
      1: { skillName, enabled: true, level: 20, supportSkills: {} },
    },
    passiveSkills: {},
  });

  const createSlashStrikeInput = (mods: AffixLine[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customAffixLines: mods,
      skillPage: berserkingBladeSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  test("basic sweep/steep calculation at level 20", () => {
    // 100 phys weapon, level 20:
    // - sweep weaponAtkDmgPct: 210%, addedDmgEffPct: 210%
    // - steep weaponAtkDmgPct: 421%, addedDmgEffPct: 421%
    // - steepStrikeChancePct: 20%
    const input = createSlashStrikeInput([]);
    const results = calculateOffense(input);
    const summary =
      results.skills[skillName as ImplementedActiveSkillName]
        ?.slashStrikeDpsSummary;

    expect(summary).toBeDefined();
    expect(summary?.steepStrikeChancePct).toBe(20);

    // Sweep avgHit = 100 * 2.10 = 210
    expect(summary?.sweep.mainhand.avgHit).toBeCloseTo(210);
    // Steep avgHit = 100 * 4.21 = 421
    expect(summary?.steep.mainhand.avgHit).toBeCloseTo(421);
  });

  test("weighted average DPS based on steep strike chance", () => {
    // With 20% steep strike chance:
    // avgDps = 0.8 * sweepDps + 0.2 * steepDps
    const input = createSlashStrikeInput([]);
    const results = calculateOffense(input);
    const summary =
      results.skills[skillName as ImplementedActiveSkillName]
        ?.slashStrikeDpsSummary;

    expect(summary).toBeDefined();
    if (summary === undefined) return;
    const sweepDps = summary.sweep.avgDps;
    const steepDps = summary.steep.avgDps;
    const expectedAvgDps = 0.8 * sweepDps + 0.2 * steepDps;
    expect(summary.avgDps).toBeCloseTo(expectedAvgDps);
  });

  test("steep strike chance stacks from mods", () => {
    // Add +30% steep strike chance from gear
    // Total should be 20 (base) + 30 (gear) = 50%
    const input = createSlashStrikeInput(
      affixLines([{ type: "SteepStrikeChancePct", value: 30 }]),
    );
    const results = calculateOffense(input);
    const summary =
      results.skills[skillName as ImplementedActiveSkillName]
        ?.slashStrikeDpsSummary;

    expect(summary).toBeDefined();
    if (summary === undefined) return;
    expect(summary.steepStrikeChancePct).toBe(50);

    // Verify weighted average uses 50/50 split
    const sweepDps = summary.sweep.avgDps;
    const steepDps = summary.steep.avgDps;
    const expectedAvgDps = 0.5 * sweepDps + 0.5 * steepDps;
    expect(summary.avgDps).toBeCloseTo(expectedAvgDps);
  });

  test("steep strike chance caps at 100%", () => {
    // Add excessive steep strike chance from gear (base 20 + 90 = 110, should cap at 100)
    const input = createSlashStrikeInput(
      affixLines([{ type: "SteepStrikeChancePct", value: 90 }]),
    );
    const results = calculateOffense(input);
    const summary =
      results.skills[skillName as ImplementedActiveSkillName]
        ?.slashStrikeDpsSummary;

    expect(summary).toBeDefined();
    if (summary === undefined) return;
    expect(summary.steepStrikeChancePct).toBe(100);

    // At 100% steep strike chance, avgDps should equal steepDps
    expect(summary.avgDps).toBeCloseTo(summary.steep.avgDps);
  });

  test("damage mods apply to both sweep and steep", () => {
    // Add +100% global damage
    const input = createSlashStrikeInput(
      affixLines([
        { type: "DmgPct", value: 100, dmgModType: "global", addn: false },
      ]),
    );
    const results = calculateOffense(input);
    const summary =
      results.skills[skillName as ImplementedActiveSkillName]
        ?.slashStrikeDpsSummary;

    expect(summary).toBeDefined();
    // Sweep: 100 * 2.1 * 2.0 = 420
    expect(summary?.sweep.mainhand.avgHit).toBeCloseTo(420);
    // Steep: 100 * 4.21 * 2.0 = 842
    expect(summary?.steep.mainhand.avgHit).toBeCloseTo(842);
  });

  test("totalDps includes slash strike DPS", () => {
    const input = createSlashStrikeInput([]);
    const results = calculateOffense(input);
    const skillResults =
      results.skills[skillName as ImplementedActiveSkillName];

    expect(skillResults).toBeDefined();
    expect(skillResults?.totalDps).toBeCloseTo(
      skillResults?.slashStrikeDpsSummary?.avgDps ?? 0,
    );
  });
});

describe("slash-strike damage ([Test] Slash Strike Skill)", () => {
  // Test skill has simple values:
  // - sweep: 100% weapon damage, 100% added damage effectiveness
  // - steep: 200% weapon damage, 200% added damage effectiveness
  // - 50% base steep strike chance
  const skillName = "[Test] Slash Strike Skill" as const;

  const testSlashStrikeSkillPage = () => ({
    activeSkills: {
      1: { skillName, enabled: true, level: 20, supportSkills: {} },
    },
    passiveSkills: {},
  });

  const createTestSlashStrikeInput = (mods: AffixLine[]) => ({
    loadout: initLoadout({
      gearPage: { equippedGear: { mainHand: baseWeapon }, inventory: [] },
      customAffixLines: mods,
      skillPage: testSlashStrikeSkillPage(),
    }),
    configuration: defaultConfiguration,
  });

  test("basic sweep/steep calculation with 50% weighted average", () => {
    // 100 phys weapon, level 20:
    // - sweep: 100% weapon damage → avgHit = 100
    // - steep: 200% weapon damage → avgHit = 200
    // - 50% steep strike chance → avgDps = 0.5 * sweepDps + 0.5 * steepDps
    const input = createTestSlashStrikeInput([]);
    const results = calculateOffense(input);
    const summary =
      results.skills[skillName as ImplementedActiveSkillName]
        ?.slashStrikeDpsSummary;

    expect(summary).toBeDefined();
    if (summary === undefined) return;

    expect(summary.steepStrikeChancePct).toBe(50);
    expect(summary.sweep.mainhand.avgHit).toBeCloseTo(100);
    expect(summary.steep.mainhand.avgHit).toBeCloseTo(200);

    const expectedAvgDps =
      0.5 * summary.sweep.avgDps + 0.5 * summary.steep.avgDps;
    expect(summary.avgDps).toBeCloseTo(expectedAvgDps);
  });

  test("adding steep strike chance shifts weighted average toward steep", () => {
    // Add +30% steep strike chance from gear
    // Total should be 50 (base) + 30 (gear) = 80%
    const input = createTestSlashStrikeInput(
      affixLines([{ type: "SteepStrikeChancePct", value: 30 }]),
    );
    const results = calculateOffense(input);
    const summary =
      results.skills[skillName as ImplementedActiveSkillName]
        ?.slashStrikeDpsSummary;

    expect(summary).toBeDefined();
    if (summary === undefined) return;

    expect(summary.steepStrikeChancePct).toBe(80);

    // Verify weighted average uses 20/80 split (80% steep)
    const sweepDps = summary.sweep.avgDps;
    const steepDps = summary.steep.avgDps;
    const expectedAvgDps = 0.2 * sweepDps + 0.8 * steepDps;
    expect(summary.avgDps).toBeCloseTo(expectedAvgDps);
  });
});

describe("resource pool calculation", () => {
  test("calculate energy shield with gear affixes and hero memory", () => {
    // Base energy shield from helmet: 146
    // Flat gear energy shield: 337
    // Total before gear percentage: 146 + 337 = 483
    // With 62% gear energy shield: 483 * (1 + 0.62) = 483 * 1.62 = 782.46
    // Memory of Discipline flat energy shield: +525
    // Total energy shield: 782.46 + 525 = 1307.46
    const input = {
      loadout: initLoadout({
        gearPage: {
          equippedGear: {
            helmet: {
              equipmentType: "Helmet (INT)" as const,
              baseStats: {
                baseStatLines: [
                  {
                    text: "146 energy shield",
                    mods: [{ type: "GearEnergyShield", value: 146 } as const],
                  },
                ],
              },
              base_affixes: [
                affix([
                  { type: "GearEnergyShield", value: 337 },
                  { type: "GearEnergyShieldPct", value: 62 },
                ]),
              ],
            },
          },
          inventory: [],
        },
        heroPage: {
          selectedHero: undefined,
          traits: {},
          memorySlots: {
            slot45: {
              id: "test-memory",
              memoryType: "Memory of Discipline" as const,
              affixes: [affix([{ type: "MaxEnergyShield", value: 525 }])],
            },
          },
          memoryInventory: [],
        },
        skillPage: emptySkillPage(),
      }),
      configuration: defaultConfiguration,
    };

    const results = calculateOffense(input);
    expect(results.resourcePool.energyShield).toBeCloseTo(1307.46);
  });

  test("calculate max life with flat and percentage modifiers", () => {
    // Base: 50 + (level 95) * 13 = 50 + 1235 = 1285
    // Flat MaxLife: +200
    // Total before percentage: 1285 + 200 = 1485
    // With 50% increased: 1485 * (1 + 0.5) = 1485 * 1.5 = 2227.5
    const input = {
      loadout: initLoadout({
        gearPage: { equippedGear: {}, inventory: [] },
        customAffixLines: affixLines([
          { type: "MaxLife", value: 200 },
          { type: "MaxLifePct", value: 50, addn: false },
        ]),
        skillPage: emptySkillPage(),
      }),
      configuration: defaultConfiguration,
    };

    const results = calculateOffense(input);
    expect(results.resourcePool.maxLife).toBeCloseTo(2227.5);
  });

  test("calculate max mana with flat and percentage modifiers", () => {
    // Base: 40 + (level 95) * 5 = 40 + 475 = 515
    // Flat MaxMana: +150
    // Total before percentage: 515 + 150 = 665
    // With 80% increased: 665 * (1 + 0.8) = 665 * 1.8 = 1197
    const input = {
      loadout: initLoadout({
        gearPage: { equippedGear: {}, inventory: [] },
        customAffixLines: affixLines([
          { type: "MaxMana", value: 150 },
          { type: "MaxManaPct", value: 80, addn: false },
        ]),
        skillPage: emptySkillPage(),
      }),
      configuration: defaultConfiguration,
    };

    const results = calculateOffense(input);
    expect(results.resourcePool.maxMana).toBeCloseTo(1197);
  });

  test("calculate armor with gear affixes and flat modifiers", () => {
    // Base armor from gear: 250
    // Flat gear armor: 180
    // Total before gear percentage: 250 + 180 = 430
    // With 45% gear armor: 430 * (1 + 0.45) = 430 * 1.45 = 623.5
    // Flat Armor: +100
    // Total before final percentage: 623.5 + 100 = 723.5
    // With 30% increased armor: 723.5 * (1 + 0.3) = 723.5 * 1.3 = 940.55
    const input = {
      loadout: initLoadout({
        gearPage: {
          equippedGear: {
            chest: {
              equipmentType: "Chest Armor (STR)" as const,
              baseStats: {
                baseStatLines: [
                  {
                    text: "250 armor",
                    mods: [{ type: "GearArmor", value: 250 } as const],
                  },
                ],
              },
              base_affixes: [
                affix([
                  { type: "GearArmor", value: 180 },
                  { type: "GearArmorPct", value: 45 },
                ]),
              ],
            },
          },
          inventory: [],
        },
        customAffixLines: affixLines([
          { type: "Armor", value: 100 },
          { type: "ArmorPct", value: 30, addn: false },
        ]),
        skillPage: emptySkillPage(),
      }),
      configuration: defaultConfiguration,
    };

    const results = calculateOffense(input);
    expect(results.resourcePool.armor).toBeCloseTo(940.55);
  });

  test("calculate evasion with gear affixes and flat modifiers", () => {
    // Base evasion from gear: 180
    // Flat gear evasion: 220
    // Total before gear percentage: 180 + 220 = 400
    // With 50% gear evasion: 400 * (1 + 0.5) = 400 * 1.5 = 600
    // Flat Evasion: +80
    // Total before final percentage: 600 + 80 = 680
    // With 25% increased evasion: 680 * (1 + 0.25) = 680 * 1.25 = 850
    const input = {
      loadout: initLoadout({
        gearPage: {
          equippedGear: {
            boots: {
              equipmentType: "Boots (DEX)" as const,
              baseStats: {
                baseStatLines: [
                  {
                    text: "180 evasion",
                    mods: [{ type: "GearEvasion", value: 180 } as const],
                  },
                ],
              },
              base_affixes: [
                affix([
                  { type: "GearEvasion", value: 220 },
                  { type: "GearEvasionPct", value: 50 },
                ]),
              ],
            },
          },
          inventory: [],
        },
        customAffixLines: affixLines([
          { type: "Evasion", value: 80 },
          { type: "EvasionPct", value: 25, addn: false },
        ]),
        skillPage: emptySkillPage(),
      }),
      configuration: defaultConfiguration,
    };

    const results = calculateOffense(input);
    expect(results.resourcePool.evasion).toBeCloseTo(850);
  });
});
