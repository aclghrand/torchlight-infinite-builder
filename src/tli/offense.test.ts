import { expect, test } from "vitest";
import type { Affix, Configuration, Loadout } from "./core";
import type { Mod } from "./mod";
import { calculateOffense, collectMods } from "./offense";
import type { Skill } from "./skill_confs";

// Helper to create Affix objects from mods for tests
const affix = (mods: Mod[]): Affix => ({
  affixLines: mods.map((mod) => ({ text: "", mod })),
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

const emptyPactspiritSlot = () => ({
  level: 0,
  rings: {
    innerRing1: {},
    innerRing2: {},
    innerRing3: {},
    innerRing4: {},
    innerRing5: {},
    innerRing6: {},
    midRing1: {},
    midRing2: {},
    midRing3: {},
  },
});

const initLoadout = (pl: Partial<Loadout> = {}): Loadout => {
  return {
    gearPage: pl.gearPage || { equippedGear: {}, inventory: [] },
    talentPage: pl.talentPage || {
      talentTrees: {},
      inventory: { prismList: [], inverseImageList: [] },
    },
    divinityPage: pl.divinityPage || { placedSlates: [], inventory: [] },
    skillPage: pl.skillPage || {},
    heroPage: pl.heroPage || {
      selectedHero: undefined,
      traits: {},
      memorySlots: {},
      memoryInventory: [],
    },
    pactspiritPage: pl.pactspiritPage || {
      slot1: emptyPactspiritSlot(),
      slot2: emptyPactspiritSlot(),
      slot3: emptyPactspiritSlot(),
    },
    customConfiguration: pl.customConfiguration || [],
  };
};

const defaultConfiguration: Configuration = {
  fervor: {
    enabled: false,
    points: 100,
  },
};

type TestInput = {
  weapon?: {
    base_affixes?: Affix[];
  } | null; // null means no weapon
  mods?: Affix[]; // customConfiguration - array of affixes
  talentMods?: Affix[]; // for talent tree selectedCoreTalents
  skill?: Skill;
  configuration?: Configuration;
};

type ExpectedOutput = Partial<{
  avgHit: number;
  avgHitWithCrit: number;
  critChance: number;
  critDmgMult: number;
}>;

const runTest = (input: TestInput, expected: ExpectedOutput) => {
  const weapon =
    input.weapon === null
      ? undefined
      : input.weapon
        ? { ...baseWeapon, ...input.weapon }
        : baseWeapon;

  const loadout = initLoadout({
    gearPage: {
      equippedGear: weapon ? { mainHand: weapon } : {},
      inventory: [],
    },
    customConfiguration: input.mods ?? [],
    ...(input.talentMods && {
      talentPage: {
        talentTrees: {
          tree1: {
            name: "test",
            nodes: [],
            selectedCoreTalents: input.talentMods,
          },
        },
        inventory: { prismList: [], inverseImageList: [] },
      },
    }),
  });

  const mods = collectMods(loadout);
  const res = calculateOffense(
    loadout,
    mods,
    input.skill ?? "[Test] Simple Attack",
    input.configuration ?? defaultConfiguration,
  );

  for (const [key, value] of Object.entries(expected)) {
    expect(res?.[key as keyof typeof expected]).toBeCloseTo(value);
  }

  return res;
};

test("calculate offense very basic", () => {
  // base * bonusdmg * crit * skill bonus
  // 100 * 2 * 1.025
  runTest(
    {
      mods: [
        affix([{ type: "DmgPct", value: 1, modType: "global", addn: false }]),
      ],
    },
    { avgHit: 200, avgHitWithCrit: 205 },
  );
});

test("calculate offense multiple inc dmg", () => {
  // base * (1 + sum of increased) * crit
  // 100 * (1 + 0.5 + 0.3) = 180
  // 180 * 1.025 (crit) = 184.5
  runTest(
    {
      mods: [
        affix([{ type: "DmgPct", value: 0.5, modType: "global", addn: false }]), // +50% increased
        affix([{ type: "DmgPct", value: 0.3, modType: "global", addn: false }]), // +30% increased
      ],
    },
    { avgHit: 180, avgHitWithCrit: 184.5 },
  );
});

test("calculate offense multiple addn dmg", () => {
  // base * (1 + more1) * (1 + more2) * crit
  // 100 * 1.5 * 1.2 = 180
  // 180 * 1.025 (crit) = 184.5
  runTest(
    {
      mods: [
        affix([{ type: "DmgPct", value: 0.5, modType: "global", addn: true }]), // +50% more
        affix([{ type: "DmgPct", value: 0.2, modType: "global", addn: true }]), // +20% more
      ],
    },
    { avgHit: 180, avgHitWithCrit: 184.5 },
  );
});

test("calculate offense multiple mix inc and addn dmg", () => {
  // base * (1 + sum of increased) * (1 + more) * crit
  // 100 * (1 + 0.5 + 0.3) * 1.2 = 100 * 1.8 * 1.2 = 216
  // 216 * 1.025 (crit) = 221.4
  runTest(
    {
      mods: [
        affix([{ type: "DmgPct", value: 0.5, modType: "global", addn: false }]), // +50% increased
        affix([{ type: "DmgPct", value: 0.3, modType: "global", addn: false }]), // +30% increased
        affix([{ type: "DmgPct", value: 0.2, modType: "global", addn: true }]), // +20% more
      ],
    },
    { avgHit: 216, avgHitWithCrit: 221.4 },
  );
});

test("calculate offense atk dmg mod", () => {
  // [Test] Simple Attack has "Attack" tag, so attack modifiers apply
  // 100 * (1 + 0.5) = 150
  // 150 * 1.025 (crit) = 153.75
  runTest(
    {
      mods: [
        affix([{ type: "DmgPct", value: 0.5, modType: "attack", addn: false }]),
      ],
    }, // +50% increased attack damage
    { avgHit: 150, avgHitWithCrit: 153.75 },
  );
});

test("calculate offense spell dmg mod doesn't affect attack skill", () => {
  // [Test] Simple Attack has "Attack" tag, NOT "Spell" tag
  // So spell modifiers don't apply - only base damage
  // 100 * 1 (no applicable modifiers) = 100
  // 100 * 1.025 (crit) = 102.5
  runTest(
    {
      mods: [
        affix([{ type: "DmgPct", value: 0.5, modType: "spell", addn: false }]),
      ],
    }, // +50% increased spell damage
    { avgHit: 100, avgHitWithCrit: 102.5 },
  );
});

test("calculate offense elemental damage", () => {
  // GearPlusEleMinusPhysDmg removes all physical damage and adds elemental
  // Physical: 100 * (1 - 1) = 0 (removed by conversion)
  // Cold/Lightning/Fire: 50 each * 1.5 (elemental bonus) = 75 each
  // Total avg hit: 0 + 75 + 75 + 75 = 225
  // With crit: 225 * 1.025 = 230.625
  runTest(
    {
      weapon: {
        base_affixes: [
          affix([
            {
              type: "FlatGearDmg",
              modType: "elemental",
              value: { min: 50, max: 50 },
            },
            { type: "GearPhysDmgPct", value: -1 },
          ]),
        ],
      },
      mods: [
        affix([
          { type: "DmgPct", value: 0.5, modType: "elemental", addn: false },
        ]),
      ], // +50% elemental
    },
    { avgHit: 225, avgHitWithCrit: 230.625 },
  );
});

test("calculate offense cold damage", () => {
  // Physical: 100 (no bonuses)
  // Cold: 30 * 1.8 (cold bonus) = 54
  // Total avg hit: 100 + 54 = 154
  // With crit: 154 * 1.025 = 157.85
  runTest(
    {
      weapon: {
        base_affixes: [
          affix([
            {
              type: "FlatGearDmg",
              value: { min: 30, max: 30 },
              modType: "cold",
            },
          ]),
        ],
      },
      mods: [
        affix([{ type: "DmgPct", value: 0.8, modType: "cold", addn: false }]),
      ], // +80% cold damage
    },
    { avgHit: 154, avgHitWithCrit: 157.85 },
  );
});

test("calculate offense with fervor enabled default points", () => {
  // Base damage: 100
  // Fervor: 100 points * 2% = 200% increased crit rating
  // Crit chance: 0.05 * (1 + 2.0) = 0.15 (15%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.15 * 1.5 + 100 * 0.85 = 22.5 + 85 = 107.5
  runTest(
    { configuration: { fervor: { enabled: true, points: 100 } } },
    { avgHit: 100, critChance: 0.15, avgHitWithCrit: 107.5 },
  );
});

test("calculate offense with fervor enabled custom points", () => {
  // Base damage: 100
  // Fervor: 50 points * 2% = 100% increased crit rating
  // Crit chance: 0.05 * (1 + 1.0) = 0.10 (10%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.10 * 1.5 + 100 * 0.90 = 15 + 90 = 105
  runTest(
    { configuration: { fervor: { enabled: true, points: 50 } } },
    { avgHit: 100, critChance: 0.1, avgHitWithCrit: 105 },
  );
});

test("calculate offense with fervor disabled", () => {
  // Fervor disabled, so no bonus despite having 100 points
  // Crit chance: 0.05 * (1 + 0) = 0.05 (5%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.05 * 1.5 + 100 * 0.95 = 7.5 + 95 = 102.5
  runTest(
    { configuration: { fervor: { enabled: false, points: 100 } } },
    { avgHit: 100, critChance: 0.05, avgHitWithCrit: 102.5 },
  );
});

test("calculate offense with fervor and other crit rating affixes", () => {
  // Base damage: 100
  // Crit rating from gear: +50%
  // Fervor: 25 points * 2% = 50% increased crit rating
  // Total crit rating bonus: 50% + 50% = 100%
  // Crit chance: 0.05 * (1 + 1.0) = 0.10 (10%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.10 * 1.5 + 100 * 0.90 = 15 + 90 = 105
  runTest(
    {
      weapon: {
        base_affixes: [
          affix([{ type: "CritRatingPct", value: 0.5, modType: "global" }]),
        ], // +50% crit rating
      },
      configuration: { fervor: { enabled: true, points: 25 } },
    },
    { avgHit: 100, critChance: 0.1, avgHitWithCrit: 105 },
  );
});

test("calculate offense with fervor and single FervorEff modifier", () => {
  // Base damage: 100
  // Fervor: 100 points * 2% * (1 + 0.5) = 100 * 0.02 * 1.5 = 3.0 (300% increased crit rating)
  // Crit chance: 0.05 * (1 + 3.0) = 0.20 (20%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.20 * 1.5 + 100 * 0.80 = 30 + 80 = 110
  runTest(
    {
      weapon: {
        base_affixes: [affix([{ type: "FervorEff", value: 0.5 }])], // +50% fervor effectiveness
      },
      configuration: { fervor: { enabled: true, points: 100 } },
    },
    { avgHit: 100, critChance: 0.2, avgHitWithCrit: 110 },
  );
});

test("calculate offense with fervor and multiple FervorEff modifiers stacking", () => {
  // Base damage: 100
  // FervorEff total: 0.1 + 0.1 = 0.2 (20% total)
  // Fervor: 100 points * 2% * (1 + 0.2) = 100 * 0.02 * 1.2 = 2.4 (240% increased crit rating)
  // Crit chance: 0.05 * (1 + 2.4) = 0.17 (17%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.17 * 1.5 + 100 * 0.83 = 25.5 + 83 = 108.5
  runTest(
    {
      weapon: {
        base_affixes: [affix([{ type: "FervorEff", value: 0.1 }])], // +10% fervor effectiveness
      },
      talentMods: [affix([{ type: "FervorEff", value: 0.1 }])], // +10% fervor effectiveness
      configuration: { fervor: { enabled: true, points: 100 } },
    },
    { avgHit: 100, critChance: 0.17, avgHitWithCrit: 108.5 },
  );
});

test("calculate offense with fervor and FervorEff with custom fervor points", () => {
  // Base damage: 100
  // Fervor: 50 points * 2% * (1 + 1.0) = 50 * 0.02 * 2.0 = 2.0 (200% increased crit rating)
  // Crit chance: 0.05 * (1 + 2.0) = 0.15 (15%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.15 * 1.5 + 100 * 0.85 = 22.5 + 85 = 107.5
  runTest(
    {
      weapon: {
        base_affixes: [affix([{ type: "FervorEff", value: 1.0 }])], // +100% fervor effectiveness (doubles it)
      },
      configuration: { fervor: { enabled: true, points: 50 } },
    },
    { avgHit: 100, critChance: 0.15, avgHitWithCrit: 107.5 },
  );
});

test("calculate offense with FervorEff but fervor disabled", () => {
  // FervorEff has no effect when fervor is disabled
  // Crit chance: 0.05 * (1 + 0) = 0.05 (5%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.05 * 1.5 + 100 * 0.95 = 7.5 + 95 = 102.5
  runTest(
    {
      weapon: {
        base_affixes: [affix([{ type: "FervorEff", value: 0.5 }])], // +50% fervor effectiveness
      },
      configuration: { fervor: { enabled: false, points: 100 } },
    },
    { avgHit: 100, critChance: 0.05, avgHitWithCrit: 102.5 },
  );
});

test("calculate offense with CritDmgPerFervor single affix", () => {
  // Base damage: 100
  // Fervor: 100 points * 2% = 200% increased crit rating
  // Crit chance: 0.05 * (1 + 2.0) = 0.15 (15%)
  // CritDmgPerFervor: 0.005 * 100 = 0.5 (50% increased crit damage)
  // Crit damage: 1.5 * (1 + 0.5) = 2.25
  // AvgHitWithCrit: 100 * 0.15 * 2.25 + 100 * 0.85 = 33.75 + 85 = 118.75
  runTest(
    {
      weapon: {
        base_affixes: [affix([{ type: "CritDmgPerFervor", value: 0.005 }])], // +0.5% crit dmg per fervor point
      },
      configuration: { fervor: { enabled: true, points: 100 } },
    },
    {
      avgHit: 100,
      critChance: 0.15,
      critDmgMult: 2.25,
      avgHitWithCrit: 118.75,
    },
  );
});

test("calculate offense with multiple CritDmgPerFervor affixes stacking", () => {
  // Base damage: 100
  // Fervor: 100 points * 2% = 200% increased crit rating
  // Crit chance: 0.05 * (1 + 2.0) = 0.15 (15%)
  // CritDmgPerFervor total: (0.005 * 100) + (0.003 * 100) = 0.5 + 0.3 = 0.8
  // Crit damage: 1.5 * (1 + 0.8) = 2.7
  // AvgHitWithCrit: 100 * 0.15 * 2.7 + 100 * 0.85 = 40.5 + 85 = 125.5
  runTest(
    {
      weapon: {
        base_affixes: [affix([{ type: "CritDmgPerFervor", value: 0.005 }])], // +0.5% per point
      },
      talentMods: [affix([{ type: "CritDmgPerFervor", value: 0.003 }])], // +0.3% per point
      configuration: { fervor: { enabled: true, points: 100 } },
    },
    { avgHit: 100, critChance: 0.15, critDmgMult: 2.7, avgHitWithCrit: 125.5 },
  );
});

test("calculate offense with CritDmgPerFervor with custom fervor points", () => {
  // Base damage: 100
  // Fervor: 50 points * 2% = 100% increased crit rating
  // Crit chance: 0.05 * (1 + 1.0) = 0.10 (10%)
  // CritDmgPerFervor: 0.01 * 50 = 0.5 (50% increased crit damage)
  // Crit damage: 1.5 * (1 + 0.5) = 2.25
  // AvgHitWithCrit: 100 * 0.10 * 2.25 + 100 * 0.90 = 22.5 + 90 = 112.5
  runTest(
    {
      weapon: {
        base_affixes: [affix([{ type: "CritDmgPerFervor", value: 0.01 }])], // +1% crit dmg per fervor point
      },
      configuration: { fervor: { enabled: true, points: 50 } },
    },
    { avgHit: 100, critChance: 0.1, critDmgMult: 2.25, avgHitWithCrit: 112.5 },
  );
});

test("calculate offense with CritDmgPerFervor but fervor disabled", () => {
  // CritDmgPerFervor has no effect when fervor is disabled
  // Crit chance: 0.05 (5%, no fervor bonus)
  // Crit damage: 1.5 (no bonus)
  // AvgHitWithCrit: 100 * 0.05 * 1.5 + 100 * 0.95 = 7.5 + 95 = 102.5
  runTest(
    {
      weapon: {
        base_affixes: [affix([{ type: "CritDmgPerFervor", value: 0.005 }])], // +0.5% per point
      },
      configuration: { fervor: { enabled: false, points: 100 } },
    },
    { avgHit: 100, critChance: 0.05, critDmgMult: 1.5, avgHitWithCrit: 102.5 },
  );
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
  runTest(
    {
      weapon: {
        base_affixes: [
          affix([{ type: "CritDmgPerFervor", value: 0.005 }]), // +0.5% per point
          affix([
            { type: "CritDmgPct", value: 0.3, modType: "global", addn: false },
          ]), // +30% increased
        ],
      },
      configuration: { fervor: { enabled: true, points: 100 } },
    },
    { avgHit: 100, critChance: 0.15, critDmgMult: 2.7, avgHitWithCrit: 125.5 },
  );
});

// Flat damage tests
test("calculate offense with flat physical damage to attacks", () => {
  // Weapon damage: 100
  // Flat damage: 50 (scaled by addedDmgEffPct = 1.0)
  // Total: 100 + 50 = 150
  // With crit: 150 * 1.025 = 153.75
  runTest(
    {
      mods: [
        affix([
          {
            type: "FlatDmgToAtks",
            value: { min: 50, max: 50 },
            dmgType: "physical",
          },
        ]),
      ],
    },
    { avgHit: 150, avgHitWithCrit: 153.75 },
  );
});

test("calculate offense with flat elemental damage to attacks", () => {
  // Weapon: 100 phys
  // Flat: 20 cold + 30 fire + 10 lightning = 60 elemental
  // Total: 100 + 60 = 160
  // With crit: 160 * 1.025 = 164
  runTest(
    {
      mods: [
        affix([
          {
            type: "FlatDmgToAtks",
            value: { min: 20, max: 20 },
            dmgType: "cold",
          },
        ]),
        affix([
          {
            type: "FlatDmgToAtks",
            value: { min: 30, max: 30 },
            dmgType: "fire",
          },
        ]),
        affix([
          {
            type: "FlatDmgToAtks",
            value: { min: 10, max: 10 },
            dmgType: "lightning",
          },
        ]),
      ],
    },
    { avgHit: 160, avgHitWithCrit: 164 },
  );
});

test("calculate offense with multiple flat damage sources stacking", () => {
  // Weapon: 100 phys
  // Flat: 25 + 25 = 50 phys (stacks additively)
  // Total: 100 + 50 = 150
  // With crit: 150 * 1.025 = 153.75
  runTest(
    {
      mods: [
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
      ],
    },
    { avgHit: 150, avgHitWithCrit: 153.75 },
  );
});

test("calculate offense with flat damage scaled by addedDmgEffPct (Berserking Blade)", () => {
  // Berserking Blade has addedDmgEffPct = 2.1 and weapon mult = 2.1
  // Weapon damage: 100 * 2.1 = 210
  // Flat damage: 100 * 2.1 = 210
  // Total: 210 + 210 = 420
  // With crit: 420 * 1.025 = 430.5
  runTest(
    {
      mods: [
        affix([
          {
            type: "FlatDmgToAtks",
            value: { min: 100, max: 100 },
            dmgType: "physical",
          },
        ]),
      ],
      skill: "Berserking Blade",
    },
    { avgHit: 420, avgHitWithCrit: 430.5 },
  );
});

test("calculate offense with flat damage and % damage modifiers", () => {
  // Weapon: 100 phys
  // Flat: 50 phys
  // Base total: 150
  // After +100% physical: 150 * 2 = 300
  // With crit: 300 * 1.025 = 307.5
  runTest(
    {
      mods: [
        affix([
          {
            type: "FlatDmgToAtks",
            value: { min: 50, max: 50 },
            dmgType: "physical",
          },
        ]),
        affix([
          { type: "DmgPct", value: 1.0, modType: "physical", addn: false },
        ]), // +100% physical damage
      ],
    },
    { avgHit: 300, avgHitWithCrit: 307.5 },
  );
});

test("calculate offense with FlatDmgToAtksAndSpells on attack skill", () => {
  // Weapon: 100 phys
  // Flat (FlatDmgToAtksAndSpells): 40 cold
  // Total: 100 + 40 = 140
  // With crit: 140 * 1.025 = 143.5
  runTest(
    {
      mods: [
        affix([
          {
            type: "FlatDmgToAtksAndSpells",
            value: { min: 40, max: 40 },
            dmgType: "cold",
          },
        ]),
      ],
    },
    { avgHit: 140, avgHitWithCrit: 143.5 },
  );
});

test("calculate offense with flat damage only (no weapon damage)", () => {
  // No weapon equipped, only flat damage
  // Flat: 100 fire * 1.0 (addedDmgEffPct) = 100
  // With crit: 100 * 1.025 = 102.5
  runTest(
    {
      weapon: null, // no weapon
      mods: [
        affix([
          {
            type: "FlatDmgToAtks",
            value: { min: 100, max: 100 },
            dmgType: "fire",
          },
        ]),
      ],
    },
    { avgHit: 100, avgHitWithCrit: 102.5 },
  );
});

test("calculate offense with flat erosion damage", () => {
  // Weapon: 100 phys (no bonus)
  // Flat: 50 erosion * 1.5 (50% erosion bonus) = 75
  // Total: 100 + 75 = 175
  // With crit: 175 * 1.025 = 179.375
  runTest(
    {
      mods: [
        affix([
          {
            type: "FlatDmgToAtks",
            value: { min: 50, max: 50 },
            dmgType: "erosion",
          },
        ]),
        affix([
          { type: "DmgPct", value: 0.5, modType: "erosion", addn: false },
        ]), // +50% erosion damage
      ],
    },
    { avgHit: 175, avgHitWithCrit: 179.375 },
  );
});
