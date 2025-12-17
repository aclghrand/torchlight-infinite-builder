import { describe, expect, test } from "vitest";
import type { Affix, Configuration, Loadout } from "../core";
import type { Mod } from "../mod";
import {
  calculateOffense,
  convertDmg,
  type DmgPools,
  type DmgRanges,
  type OffenseInput,
} from "./offense";
import type { OffenseSkillName } from "./skill_confs";

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
    skillPage: pl.skillPage || emptySkillPage(),
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
  skill?: OffenseSkillName;
  configuration?: Configuration;
};

type ExpectedOutput = Partial<{
  avgHit: number;
  avgHitWithCrit: number;
  critChance: number;
  critDmgMult: number;
  aspd: number;
}>;

const createInput = (input: TestInput): OffenseInput => {
  const skillName = input.skill ?? "[Test] Simple Attack";

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
    skillPage: {
      activeSkills: {
        1: {
          skillName,
          enabled: true,
          level: 20,
          supportSkills: {},
        },
      },
      passiveSkills: {},
    },
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

  return {
    loadout,
    mainSkillName: skillName,
    configuration: input.configuration ?? defaultConfiguration,
  };
};

const validate = (
  actual: ReturnType<typeof calculateOffense>,
  expected: ExpectedOutput,
) => {
  for (const [key, value] of Object.entries(expected)) {
    expect(actual?.[key as keyof typeof expected]).toBeCloseTo(value);
  }
};

test("calculate offense very basic", () => {
  // base * bonusdmg
  // 100 * 2 = 200
  const input = createInput({
    mods: [
      affix([{ type: "DmgPct", value: 1, modType: "global", addn: false }]),
    ],
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 200 });
});

test("calculate offense multiple inc dmg", () => {
  // base * (1 + sum of increased)
  // 100 * (1 + 0.5 + 0.3) = 180
  const input = createInput({
    mods: [
      affix([{ type: "DmgPct", value: 0.5, modType: "global", addn: false }]), // +50% increased
      affix([{ type: "DmgPct", value: 0.3, modType: "global", addn: false }]), // +30% increased
    ],
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 180 });
});

test("calculate offense multiple addn dmg", () => {
  // base * (1 + more1) * (1 + more2)
  // 100 * 1.5 * 1.2 = 180
  const input = createInput({
    mods: [
      affix([{ type: "DmgPct", value: 0.5, modType: "global", addn: true }]), // +50% more
      affix([{ type: "DmgPct", value: 0.2, modType: "global", addn: true }]), // +20% more
    ],
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 180 });
});

test("calculate offense multiple mix inc and addn dmg", () => {
  // base * (1 + sum of increased) * (1 + more)
  // 100 * (1 + 0.5 + 0.3) * 1.2 = 100 * 1.8 * 1.2 = 216
  const input = createInput({
    mods: [
      affix([{ type: "DmgPct", value: 0.5, modType: "global", addn: false }]), // +50% increased
      affix([{ type: "DmgPct", value: 0.3, modType: "global", addn: false }]), // +30% increased
      affix([{ type: "DmgPct", value: 0.2, modType: "global", addn: true }]), // +20% more
    ],
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 216 });
});

test("calculate offense atk dmg mod", () => {
  // [Test] Simple Attack has "Attack" tag, so attack modifiers apply
  // 100 * (1 + 0.5) = 150
  const input = createInput({
    mods: [
      affix([{ type: "DmgPct", value: 0.5, modType: "attack", addn: false }]),
    ],
  }); // +50% increased attack damage
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 150 });
});

test("calculate offense spell dmg mod doesn't affect attack skill", () => {
  // [Test] Simple Attack has "Attack" tag, NOT "Spell" tag
  // So spell modifiers don't apply - only base damage
  // 100 * 1 (no applicable modifiers) = 100
  const input = createInput({
    mods: [
      affix([{ type: "DmgPct", value: 0.5, modType: "spell", addn: false }]),
    ],
  }); // +50% increased spell damage
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 100 });
});

test("calculate offense elemental damage", () => {
  // GearPlusEleMinusPhysDmg removes all physical damage and adds elemental
  // Physical: 100 * (1 - 1) = 0 (removed by conversion)
  // Cold/Lightning/Fire: 50 each * 1.5 (elemental bonus) = 75 each
  // Total avg hit: 0 + 75 + 75 + 75 = 225
  const input = createInput({
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
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 225 });
});

test("calculate offense cold damage", () => {
  // Physical: 100 (no bonuses)
  // Cold: 30 * 1.8 (cold bonus) = 54
  // Total avg hit: 100 + 54 = 154
  const input = createInput({
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
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 154 });
});

test("calculate offense with fervor enabled default points", () => {
  // Base damage: 100
  // Fervor: 100 points * 2% = 200% increased crit rating
  // Crit chance: 0.05 * (1 + 2.0) = 0.15 (15%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.15 * 1.5 + 100 * 0.85 = 22.5 + 85 = 107.5
  const input = createInput({
    configuration: { fervor: { enabled: true, points: 100 } },
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 100, critChance: 0.15, avgHitWithCrit: 107.5 });
});

test("calculate offense with fervor enabled custom points", () => {
  // Base damage: 100
  // Fervor: 50 points * 2% = 100% increased crit rating
  // Crit chance: 0.05 * (1 + 1.0) = 0.10 (10%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.10 * 1.5 + 100 * 0.90 = 15 + 90 = 105
  const input = createInput({
    configuration: { fervor: { enabled: true, points: 50 } },
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 100, critChance: 0.1, avgHitWithCrit: 105 });
});

test("calculate offense with fervor disabled", () => {
  // Fervor disabled, so no bonus despite having 100 points
  // Crit chance: 0.05 * (1 + 0) = 0.05 (5%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.05 * 1.5 + 100 * 0.95 = 7.5 + 95 = 102.5
  const input = createInput({
    configuration: { fervor: { enabled: false, points: 100 } },
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 100, critChance: 0.05, avgHitWithCrit: 102.5 });
});

test("calculate offense with fervor and other crit rating affixes", () => {
  // Base damage: 100
  // Crit rating from gear: +50%
  // Fervor: 25 points * 2% = 50% increased crit rating
  // Total crit rating bonus: 50% + 50% = 100%
  // Crit chance: 0.05 * (1 + 1.0) = 0.10 (10%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.10 * 1.5 + 100 * 0.90 = 15 + 90 = 105
  const input = createInput({
    weapon: {
      base_affixes: [
        affix([{ type: "CritRatingPct", value: 0.5, modType: "global" }]),
      ], // +50% crit rating
    },
    configuration: { fervor: { enabled: true, points: 25 } },
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 100, critChance: 0.1, avgHitWithCrit: 105 });
});

test("calculate offense with fervor and single FervorEff modifier", () => {
  // Base damage: 100
  // Fervor: 100 points * 2% * (1 + 0.5) = 100 * 0.02 * 1.5 = 3.0 (300% increased crit rating)
  // Crit chance: 0.05 * (1 + 3.0) = 0.20 (20%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.20 * 1.5 + 100 * 0.80 = 30 + 80 = 110
  const input = createInput({
    weapon: {
      base_affixes: [affix([{ type: "FervorEff", value: 0.5 }])], // +50% fervor effectiveness
    },
    configuration: { fervor: { enabled: true, points: 100 } },
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 100, critChance: 0.2, avgHitWithCrit: 110 });
});

test("calculate offense with fervor and multiple FervorEff modifiers stacking", () => {
  // Base damage: 100
  // FervorEff total: 0.1 + 0.1 = 0.2 (20% total)
  // Fervor: 100 points * 2% * (1 + 0.2) = 100 * 0.02 * 1.2 = 2.4 (240% increased crit rating)
  // Crit chance: 0.05 * (1 + 2.4) = 0.17 (17%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.17 * 1.5 + 100 * 0.83 = 25.5 + 83 = 108.5
  const input = createInput({
    weapon: {
      base_affixes: [affix([{ type: "FervorEff", value: 0.1 }])], // +10% fervor effectiveness
    },
    talentMods: [affix([{ type: "FervorEff", value: 0.1 }])], // +10% fervor effectiveness
    configuration: { fervor: { enabled: true, points: 100 } },
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 100, critChance: 0.17, avgHitWithCrit: 108.5 });
});

test("calculate offense with fervor and FervorEff with custom fervor points", () => {
  // Base damage: 100
  // Fervor: 50 points * 2% * (1 + 1.0) = 50 * 0.02 * 2.0 = 2.0 (200% increased crit rating)
  // Crit chance: 0.05 * (1 + 2.0) = 0.15 (15%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.15 * 1.5 + 100 * 0.85 = 22.5 + 85 = 107.5
  const input = createInput({
    weapon: {
      base_affixes: [affix([{ type: "FervorEff", value: 1.0 }])], // +100% fervor effectiveness (doubles it)
    },
    configuration: { fervor: { enabled: true, points: 50 } },
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 100, critChance: 0.15, avgHitWithCrit: 107.5 });
});

test("calculate offense with FervorEff but fervor disabled", () => {
  // FervorEff has no effect when fervor is disabled
  // Crit chance: 0.05 * (1 + 0) = 0.05 (5%)
  // Crit damage: 1.5 (default)
  // AvgHitWithCrit: 100 * 0.05 * 1.5 + 100 * 0.95 = 7.5 + 95 = 102.5
  const input = createInput({
    weapon: {
      base_affixes: [affix([{ type: "FervorEff", value: 0.5 }])], // +50% fervor effectiveness
    },
    configuration: { fervor: { enabled: false, points: 100 } },
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 100, critChance: 0.05, avgHitWithCrit: 102.5 });
});

test("calculate offense with CritDmgPerFervor single affix", () => {
  // Base damage: 100
  // Fervor: 100 points * 2% = 200% increased crit rating
  // Crit chance: 0.05 * (1 + 2.0) = 0.15 (15%)
  // CritDmgPerFervor: 0.005 * 100 = 0.5 (50% increased crit damage)
  // Crit damage: 1.5 * (1 + 0.5) = 2.25
  // AvgHitWithCrit: 100 * 0.15 * 2.25 + 100 * 0.85 = 33.75 + 85 = 118.75
  const input = createInput({
    weapon: {
      base_affixes: [affix([{ type: "CritDmgPerFervor", value: 0.005 }])], // +0.5% crit dmg per fervor point
    },
    configuration: { fervor: { enabled: true, points: 100 } },
  });
  const actual = calculateOffense(input);
  validate(actual, {
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
  const input = createInput({
    weapon: {
      base_affixes: [affix([{ type: "CritDmgPerFervor", value: 0.005 }])], // +0.5% per point
    },
    talentMods: [affix([{ type: "CritDmgPerFervor", value: 0.003 }])], // +0.3% per point
    configuration: { fervor: { enabled: true, points: 100 } },
  });
  const actual = calculateOffense(input);
  validate(actual, {
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
  const input = createInput({
    weapon: {
      base_affixes: [affix([{ type: "CritDmgPerFervor", value: 0.01 }])], // +1% crit dmg per fervor point
    },
    configuration: { fervor: { enabled: true, points: 50 } },
  });
  const actual = calculateOffense(input);
  validate(actual, {
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
  const input = createInput({
    weapon: {
      base_affixes: [affix([{ type: "CritDmgPerFervor", value: 0.005 }])], // +0.5% per point
    },
    configuration: { fervor: { enabled: false, points: 100 } },
  });
  const actual = calculateOffense(input);
  validate(actual, {
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
  const input = createInput({
    weapon: {
      base_affixes: [
        affix([{ type: "CritDmgPerFervor", value: 0.005 }]), // +0.5% per point
        affix([
          { type: "CritDmgPct", value: 0.3, modType: "global", addn: false },
        ]), // +30% increased
      ],
    },
    configuration: { fervor: { enabled: true, points: 100 } },
  });
  const actual = calculateOffense(input);
  validate(actual, {
    avgHit: 100,
    critChance: 0.15,
    critDmgMult: 2.7,
    avgHitWithCrit: 125.5,
  });
});

// Flat damage tests
test("calculate offense with flat physical damage to attacks", () => {
  // Weapon damage: 100
  // Flat damage: 50 (scaled by addedDmgEffPct = 1.0)
  // Total: 100 + 50 = 150
  const input = createInput({
    mods: [
      affix([
        {
          type: "FlatDmgToAtks",
          value: { min: 50, max: 50 },
          dmgType: "physical",
        },
      ]),
    ],
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 150 });
});

test("calculate offense with flat elemental damage to attacks", () => {
  // Weapon: 100 phys
  // Flat: 20 cold + 30 fire + 10 lightning = 60 elemental
  // Total: 100 + 60 = 160
  const input = createInput({
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
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 160 });
});

test("calculate offense with multiple flat damage sources stacking", () => {
  // Weapon: 100 phys
  // Flat: 25 + 25 = 50 phys (stacks additively)
  // Total: 100 + 50 = 150
  const input = createInput({
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
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 150 });
});

test("calculate offense with flat damage scaled by addedDmgEffPct (Frost Spike)", () => {
  // Frost Spike at level 20 has addedDmgEffPct = 2.01 and WeaponAtkDmgPct = 2.01
  // Weapon damage: 100 * 2.01 = 201 (converted to cold)
  // Flat damage: 100 * 2.01 = 201 (converted to cold)
  // Total: 201 + 201 = 402 cold
  const input = createInput({
    mods: [
      affix([
        {
          type: "FlatDmgToAtks",
          value: { min: 100, max: 100 },
          dmgType: "physical",
        },
      ]),
    ],
    skill: "Frost Spike",
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 402 });
});

test("calculate offense with flat damage and % damage modifiers", () => {
  // Weapon: 100 phys
  // Flat: 50 phys
  // Base total: 150
  // After +100% physical: 150 * 2 = 300
  const input = createInput({
    mods: [
      affix([
        {
          type: "FlatDmgToAtks",
          value: { min: 50, max: 50 },
          dmgType: "physical",
        },
      ]),
      affix([{ type: "DmgPct", value: 1.0, modType: "physical", addn: false }]), // +100% physical damage
    ],
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 300 });
});

test("calculate offense with FlatDmgToAtksAndSpells on attack skill", () => {
  // Weapon: 100 phys
  // Flat (FlatDmgToAtksAndSpells): 40 cold
  // Total: 100 + 40 = 140
  const input = createInput({
    mods: [
      affix([
        {
          type: "FlatDmgToAtksAndSpells",
          value: { min: 40, max: 40 },
          dmgType: "cold",
        },
      ]),
    ],
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 140 });
});

test("calculate offense with flat damage only (no weapon damage)", () => {
  // No weapon equipped, only flat damage
  // Flat: 100 fire * 1.0 (addedDmgEffPct) = 100
  const input = createInput({
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
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 100 });
});

test("calculate offense with flat erosion damage", () => {
  // Weapon: 100 phys (no bonus)
  // Flat: 50 erosion * 1.5 (50% erosion bonus) = 75
  // Total: 100 + 75 = 175
  const input = createInput({
    mods: [
      affix([
        {
          type: "FlatDmgToAtks",
          value: { min: 50, max: 50 },
          dmgType: "erosion",
        },
      ]),
      affix([{ type: "DmgPct", value: 0.5, modType: "erosion", addn: false }]), // +50% erosion damage
    ],
  });
  const actual = calculateOffense(input);
  validate(actual, { avgHit: 175 });
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
  test("DmgPct per willpower normalizes to stacks * value", () => {
    // +10% damage per willpower stack with 5 stacks = +50% damage
    // 100 * (1 + 0.5) = 150
    const input = createInput({
      mods: [
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
      ],
    });
    const actual = calculateOffense(input);
    validate(actual, { avgHit: 150 });
  });

  test("DmgPct per willpower with zero stacks has no effect", () => {
    // +10% damage per willpower stack with 0 stacks = +0% damage
    // 100 * (1 + 0) = 100
    const input = createInput({
      mods: [
        affix([
          {
            type: "DmgPct",
            value: 0.1,
            modType: "global",
            addn: false,
            per: { stackable: "willpower" },
          },
        ]),
      ],
    });
    const actual = calculateOffense(input);
    validate(actual, { avgHit: 100 });
  });

  test("DmgPct per willpower stacks with regular DmgPct", () => {
    // +10% damage per willpower (5 stacks = 50%) + 30% regular = 80% total
    // 100 * (1 + 0.5 + 0.3) = 180
    const input = createInput({
      mods: [
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
      ],
    });
    const actual = calculateOffense(input);
    validate(actual, { avgHit: 180 });
  });

  test("FlatDmgToAtks per willpower normalizes DmgRange", () => {
    // +10-10 flat phys per willpower stack with 3 stacks = +30-30 flat phys
    // Weapon: 100, Flat: 30, Total: 130
    const input = createInput({
      mods: [
        affix([{ type: "MaxWillpowerStacks", value: 3 }]),
        affix([
          {
            type: "FlatDmgToAtks",
            value: { min: 10, max: 10 },
            dmgType: "physical",
            per: { stackable: "willpower" },
          },
        ]),
      ],
    });
    const actual = calculateOffense(input);
    validate(actual, { avgHit: 130 });
  });

  test("CritRatingPct per willpower normalizes correctly", () => {
    // +20% crit rating per willpower stack with 2 stacks = +40% crit rating
    // Crit chance: 0.05 * (1 + 0.4) = 0.07 (7%)
    const input = createInput({
      mods: [
        affix([{ type: "MaxWillpowerStacks", value: 2 }]),
        affix([
          {
            type: "CritRatingPct",
            value: 0.2,
            modType: "global",
            per: { stackable: "willpower" },
          },
        ]),
      ],
    });
    const actual = calculateOffense(input);
    validate(actual, { critChance: 0.07 });
  });

  test("multiple per-willpower mods all normalize correctly", () => {
    // With 4 willpower stacks:
    // +5% damage per stack = +20% damage
    // +10% crit rating per stack = +40% crit rating
    // Crit chance: 0.05 * (1 + 0.4) = 0.07
    // Avg hit: 100 * (1 + 0.2) = 120
    const input = createInput({
      mods: [
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
      ],
    });
    const actual = calculateOffense(input);
    validate(actual, { avgHit: 120, critChance: 0.07 });
  });
});

// Additional damage per stat tests
// The calculator automatically adds +0.5% additional damage per main stat
describe("automatic additional damage from main stats", () => {
  test("adds additional damage based on skill main stats", () => {
    // [Test] Simple Attack has main stats: dex, str
    // With 100 dex + 100 str = 200 total main stats
    // Additional damage: 200 * 0.5% = 100% additional (addn/more multiplier)
    // Base: 100, with 100% more = 100 * 2 = 200
    const input = createInput({
      mods: [
        affix([{ type: "Stat", statType: "dex", value: 100 }]),
        affix([{ type: "Stat", statType: "str", value: 100 }]),
      ],
    });
    const actual = calculateOffense(input);
    validate(actual, { avgHit: 200 });
  });

  test("works with only one main stat type", () => {
    // [Test] Simple Attack has main stats: dex, str
    // With 100 dex only = 100 total main stats
    // Additional damage: 100 * 0.5% = 50% additional
    // Base: 100, with 50% more = 100 * 1.5 = 150
    const input = createInput({
      mods: [affix([{ type: "Stat", statType: "dex", value: 100 }])],
    });
    const actual = calculateOffense(input);
    validate(actual, { avgHit: 150 });
  });

  test("zero stats has no effect", () => {
    // No stat mods = 0 total main stats
    // Additional damage: 0 * 0.5% = 0% additional
    // Base: 100, with 0% more = 100 * 1 = 100
    const input = createInput({});
    const actual = calculateOffense(input);
    validate(actual, { avgHit: 100 });
  });

  test("ignores non-main stats", () => {
    // [Test] Simple Attack has main stats: dex, str (NOT int)
    // With 100 int only = 0 main stats counted
    // Additional damage: 0 * 0.5% = 0%
    // Base: 100, with 0% more = 100
    const input = createInput({
      mods: [affix([{ type: "Stat", statType: "int", value: 100 }])],
    });
    const actual = calculateOffense(input);
    validate(actual, { avgHit: 100 });
  });

  test("uses correct main stats for different skills", () => {
    // Frost Spike has main stats: dex, int (NOT str)
    // With 100 dex + 100 int = 200 total main stats
    // Additional damage: 200 * 0.5% = 100% additional
    // Frost Spike: 100 weapon * 2.01 = 201 phys → converted to cold
    // With 100% more: 201 * 2 = 402
    const input = createInput({
      skill: "Frost Spike",
      mods: [
        affix([{ type: "Stat", statType: "dex", value: 100 }]),
        affix([{ type: "Stat", statType: "int", value: 100 }]),
      ],
    });
    const actual = calculateOffense(input);
    validate(actual, { avgHit: 402 });
  });

  test("combines with other damage modifiers", () => {
    // [Test] Simple Attack with 100 dex = 50% additional damage
    // Plus 50% increased damage
    // Base: 100, with 50% inc = 150, with 50% more = 150 * 1.5 = 225
    const input = createInput({
      mods: [
        affix([{ type: "Stat", statType: "dex", value: 100 }]),
        affix([{ type: "DmgPct", value: 0.5, modType: "global", addn: false }]),
      ],
    });
    const actual = calculateOffense(input);
    validate(actual, { avgHit: 225 });
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
    //   Steamroll: AspdPct -0.15 (increased), melee/ailment bonuses don't apply
    //   Quick Decision: AspdAndCspdPct 0.245 (additional/more)
    //
    // Damage calculation:
    //   Base: 100
    //   Willpower (6 * 0.06 = 36% increased): 100 * 1.36 = 136
    //   Haunt (+0.8% more): 136 * 1.008 = 137.088
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

    const actual = calculateOffense({
      loadout,
      mainSkillName: "[Test] Simple Attack",
      configuration: defaultConfiguration,
    });

    validate(actual, { avgHit: 137.088, aspd: 1.05825 });
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

    const actualL1 = calculateOffense({
      loadout: loadoutL1,
      mainSkillName: "[Test] Simple Attack",
      configuration: defaultConfiguration,
    });

    const actualL40 = calculateOffense({
      loadout: loadoutL40,
      mainSkillName: "[Test] Simple Attack",
      configuration: defaultConfiguration,
    });

    validate(actualL1, { aspd: 1.15 });
    validate(actualL40, { aspd: 1.345 });
  });
});

describe("calculateOffense with damage conversion", () => {
  test("100% phys to cold conversion - cold gets both phys% and cold% bonuses", () => {
    // 100 phys → 100 cold via conversion
    // Cold now benefits from: 50% physical bonus + 30% cold bonus = 80% inc
    // 100 * (1 + 0.8) = 180
    const input = createInput({
      mods: [
        affix([
          { type: "ConvertDmgPct", from: "physical", to: "cold", value: 1 },
        ]),
        affix([
          { type: "DmgPct", value: 0.5, modType: "physical", addn: false },
        ]),
        affix([{ type: "DmgPct", value: 0.3, modType: "cold", addn: false }]),
      ],
    });
    const actual = calculateOffense(input);
    validate(actual, { avgHit: 180 });
  });

  test("50% phys to cold conversion - unconverted phys gets phys%, converted cold gets both", () => {
    // 100 phys → 50 phys + 50 cold
    // Unconverted phys: 50 * (1 + 0.5) = 75
    // Converted cold: 50 * (1 + 0.5 + 0.3) = 90
    // Total: 75 + 90 = 165
    const input = createInput({
      mods: [
        affix([
          { type: "ConvertDmgPct", from: "physical", to: "cold", value: 0.5 },
        ]),
        affix([
          { type: "DmgPct", value: 0.5, modType: "physical", addn: false },
        ]),
        affix([{ type: "DmgPct", value: 0.3, modType: "cold", addn: false }]),
      ],
    });
    const actual = calculateOffense(input);
    validate(actual, { avgHit: 165 });
  });

  test("chain conversion phys→lightning→cold gets bonuses from all three types", () => {
    // 100 phys → 100 lightning → 100 cold
    // Cold benefits from: 20% physical + 30% lightning + 40% cold = 90% inc
    // 100 * (1 + 0.9) = 190
    const input = createInput({
      mods: [
        affix([
          {
            type: "ConvertDmgPct",
            from: "physical",
            to: "lightning",
            value: 1,
          },
        ]),
        affix([
          { type: "ConvertDmgPct", from: "lightning", to: "cold", value: 1 },
        ]),
        affix([
          { type: "DmgPct", value: 0.2, modType: "physical", addn: false },
        ]),
        affix([
          { type: "DmgPct", value: 0.3, modType: "lightning", addn: false },
        ]),
        affix([{ type: "DmgPct", value: 0.4, modType: "cold", addn: false }]),
      ],
    });
    const actual = calculateOffense(input);
    validate(actual, { avgHit: 190 });
  });

  test("elemental bonus applies to converted cold damage", () => {
    // 100 phys → 100 cold
    // Cold benefits from: 50% elemental (applies to cold) = 50% inc
    // 100 * (1 + 0.5) = 150
    const input = createInput({
      mods: [
        affix([
          { type: "ConvertDmgPct", from: "physical", to: "cold", value: 1 },
        ]),
        affix([
          { type: "DmgPct", value: 0.5, modType: "elemental", addn: false },
        ]),
      ],
    });
    const actual = calculateOffense(input);
    validate(actual, { avgHit: 150 });
  });

  test("no conversion - damage bonuses apply normally by type", () => {
    // 100 phys, no conversion
    // Physical: 100 * (1 + 0.5) = 150
    // Cold bonus doesn't apply (no cold damage)
    const input = createInput({
      mods: [
        affix([
          { type: "DmgPct", value: 0.5, modType: "physical", addn: false },
        ]),
        affix([{ type: "DmgPct", value: 0.3, modType: "cold", addn: false }]),
      ],
    });
    const actual = calculateOffense(input);
    validate(actual, { avgHit: 150 });
  });

  test("Frost Spike skill converts phys to cold via levelMods", () => {
    // Frost Spike has 100% phys→cold conversion from levelMods and 2.01× weapon mult
    // Requires Frost Spike to be in skill slot for levelMods to be resolved
    // 100 phys weapon * 2.01 = 201 phys → 201 cold via skill's conversion
    // Cold damage with 50% cold bonus: 201 * (1 + 0.5) = 301.5
    const loadout = initLoadout({
      gearPage: {
        equippedGear: { mainHand: baseWeapon },
        inventory: [],
      },
      skillPage: {
        activeSkills: {
          1: {
            skillName: "Frost Spike",
            enabled: true,
            level: 20,
            supportSkills: {},
          },
        },
        passiveSkills: {},
      },
      customConfiguration: [
        affix([{ type: "DmgPct", value: 0.5, modType: "cold", addn: false }]),
      ],
    });
    const actual = calculateOffense({
      loadout,
      mainSkillName: "Frost Spike",
      configuration: defaultConfiguration,
    });
    validate(actual, { avgHit: 301.5 });
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
    const actual = calculateOffense({
      loadout: createFrostSpikeLoadout(20),
      mainSkillName: "Frost Spike",
      configuration: defaultConfiguration,
    });
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
    const actual = calculateOffense({
      loadout: createFrostSpikeLoadout(20),
      mainSkillName: "Frost Spike",
      configuration: defaultConfiguration,
    });

    if (actual === undefined) throw new Error("Expected actual to be defined");
    validate(actual, { avgHit: 201 });

    // Verify the conversion mod is present in resolvedMods
    const convertMod = actual.resolvedMods.find(
      (m) => m.type === "ConvertDmgPct" && m.from === "physical",
    );
    expect(convertMod).toBeDefined();
  });

  test("Frost Spike at level 1 uses level 1 offense values", () => {
    // Frost Spike at level 1 has WeaponAtkDmgPct = 1.49 and AddedDmgEffPct = 1.49
    // 100 weapon * 1.49 = 149 phys → converted to cold
    const actual = calculateOffense({
      loadout: createFrostSpikeLoadout(1),
      mainSkillName: "Frost Spike",
      configuration: defaultConfiguration,
    });

    if (actual === undefined) throw new Error("Expected actual to be defined");
    validate(actual, { avgHit: 149 });
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

    const actual = calculateOffense({
      loadout,
      mainSkillName: "[Test] Simple Attack",
      configuration: defaultConfiguration,
    });

    expect(actual).toBeDefined();
    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    );
    expect(iceBondBuffMod).toBeDefined();
    expect(iceBondBuffMod?.value).toBeCloseTo(0.33);
  });

  test("Bull's Rage provides buff mod when enabled", () => {
    // Bull's Rage at level 20 provides: 27% additional melee damage
    const loadout = createBuffSkillLoadout({ name: "[Test] Simple Attack" }, [
      { name: "Bull's Rage", enabled: true },
    ]);

    const actual = calculateOffense({
      loadout,
      mainSkillName: "[Test] Simple Attack",
      configuration: defaultConfiguration,
    });

    expect(actual).toBeDefined();
    const bullsRageBuffMod = actual?.resolvedMods.find(
      (m) => m.type === "DmgPct" && m.modType === "melee" && m.addn === true,
    );
    expect(bullsRageBuffMod).toBeDefined();
    expect(bullsRageBuffMod?.value).toBeCloseTo(0.27);
  });

  test("disabled buff skill does not provide buff mod", () => {
    // When Ice Bond is disabled, it should not contribute its buff
    const loadout = createBuffSkillLoadout({ name: "[Test] Simple Attack" }, [
      { name: "Ice Bond", enabled: false },
    ]);

    const actual = calculateOffense({
      loadout,
      mainSkillName: "[Test] Simple Attack",
      configuration: defaultConfiguration,
    });

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

    const actualL1 = calculateOffense({
      loadout: loadoutL1,
      mainSkillName: "[Test] Simple Attack",
      configuration: defaultConfiguration,
    });
    const actualL20 = calculateOffense({
      loadout: loadoutL20,
      mainSkillName: "[Test] Simple Attack",
      configuration: defaultConfiguration,
    });

    const buffModL1 = actualL1?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    );
    const buffModL20 = actualL20?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    );

    expect(buffModL1?.value).toBeCloseTo(0.235);
    expect(buffModL20?.value).toBeCloseTo(0.33);
  });

  test("Mass Effect increases buff skill effect", () => {
    // Ice Bond at level 20: 33% base
    // Mass Effect at level 20: 20% increased skill effect
    // Expected: 33% * (1 + 0.2) = 39.6%
    const loadout = createBuffSkillLoadout({ name: "[Test] Simple Attack" }, [
      { name: "Ice Bond", supports: [{ name: "Mass Effect" }] },
    ]);

    const actual = calculateOffense({
      loadout,
      mainSkillName: "[Test] Simple Attack",
      configuration: defaultConfiguration,
    });

    expect(actual).toBeDefined();
    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    );
    expect(iceBondBuffMod?.value).toBeCloseTo(0.33 * 1.2);
  });

  test("Well-Fought Battle increases buff skill effect", () => {
    // Ice Bond at level 20: 33% base
    // Well-Fought Battle at level 20: 10% skill effect per use, hard-coded to 3 uses
    // Expected: 33% * (1 + 0.1) * 3 = 108.9%
    // Note: The hard-coded 3x multiplier only applies if the skill is Well-Fought Battle,
    // which is a support skill, not an active skill. So the extraMult won't apply here.
    // Actual expected: 33% * (1 + 0.1) = 36.3%
    const loadout = createBuffSkillLoadout({ name: "[Test] Simple Attack" }, [
      { name: "Ice Bond", supports: [{ name: "Well-Fought Battle" }] },
    ]);

    const actual = calculateOffense({
      loadout,
      mainSkillName: "[Test] Simple Attack",
      configuration: defaultConfiguration,
    });

    expect(actual).toBeDefined();
    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    );
    expect(iceBondBuffMod?.value).toBeCloseTo(0.33 * 1.1);
  });

  test("Ice Bond and Bull's Rage with Mass Effect and Well-Fought Battle - supports only affect their attached skill", () => {
    // Setup:
    // - Main skill: [Test] Simple Attack
    // - Ice Bond with Mass Effect and Well-Fought Battle attached
    // - Bull's Rage with Mass Effect and Well-Fought Battle attached
    //
    // Ice Bond at level 20: 33% base cold damage
    // Bull's Rage at level 20: 27% base melee damage
    // Mass Effect at level 20: 20% skill effect
    // Well-Fought Battle at level 20: 10% skill effect
    //
    // Ice Bond buff = 33% * (1 + 0.2 + 0.1) = 33% * 1.3 = 42.9%
    // Bull's Rage buff = 27% * (1 + 0.2 + 0.1) = 27% * 1.3 = 35.1%
    //
    // Key assertion: Each skill's supports only affect that skill's buff, not other skills
    const loadout = createBuffSkillLoadout({ name: "[Test] Simple Attack" }, [
      {
        name: "Ice Bond",
        supports: [{ name: "Mass Effect" }, { name: "Well-Fought Battle" }],
      },
      {
        name: "Bull's Rage",
        supports: [{ name: "Mass Effect" }, { name: "Well-Fought Battle" }],
      },
    ]);

    const actual = calculateOffense({
      loadout,
      mainSkillName: "[Test] Simple Attack",
      configuration: defaultConfiguration,
    });

    expect(actual).toBeDefined();

    // Check Ice Bond buff
    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    );
    expect(iceBondBuffMod?.value).toBeCloseTo(0.33 * 1.3);

    // Check Bull's Rage buff
    const bullsRageBuffMod = actual?.resolvedMods.find(
      (m) => m.type === "DmgPct" && m.modType === "melee" && m.addn === true,
    );
    expect(bullsRageBuffMod?.value).toBeCloseTo(0.27 * 1.3);
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

    const actual = calculateOffense({
      loadout,
      mainSkillName: "[Test] Simple Attack",
      configuration: defaultConfiguration,
    });

    expect(actual).toBeDefined();
    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    );
    // Should be base 33%, not affected by main skill's Mass Effect
    expect(iceBondBuffMod?.value).toBeCloseTo(0.33);
  });

  test("supports on one buff skill do not affect another buff skill", () => {
    // Setup:
    // - Ice Bond with Mass Effect (20% skill effect)
    // - Bull's Rage without supports
    //
    // Ice Bond buff = 33% * 1.2 = 39.6%
    // Bull's Rage buff = 27% (no effect from Ice Bond's supports)
    const loadout = createBuffSkillLoadout({ name: "[Test] Simple Attack" }, [
      { name: "Ice Bond", supports: [{ name: "Mass Effect" }] },
      { name: "Bull's Rage" }, // No supports
    ]);

    const actual = calculateOffense({
      loadout,
      mainSkillName: "[Test] Simple Attack",
      configuration: defaultConfiguration,
    });

    expect(actual).toBeDefined();

    // Ice Bond should be boosted by Mass Effect
    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    );
    expect(iceBondBuffMod?.value).toBeCloseTo(0.33 * 1.2);

    // Bull's Rage should NOT be affected by Ice Bond's Mass Effect
    const bullsRageBuffMod = actual?.resolvedMods.find(
      (m) => m.type === "DmgPct" && m.modType === "melee" && m.addn === true,
    );
    expect(bullsRageBuffMod?.value).toBeCloseTo(0.27); // Base value, no boost
  });

  test("multiple SkillEffPct supports stack additively", () => {
    // Setup:
    // - Ice Bond with Mass Effect (20%) and Well-Fought Battle (10%)
    //
    // Total skill effect = 20% + 10% = 30%
    // Ice Bond buff = 33% * (1 + 0.3) = 42.9%
    const loadout = createBuffSkillLoadout({ name: "[Test] Simple Attack" }, [
      {
        name: "Ice Bond",
        supports: [{ name: "Mass Effect" }, { name: "Well-Fought Battle" }],
      },
    ]);

    const actual = calculateOffense({
      loadout,
      mainSkillName: "[Test] Simple Attack",
      configuration: defaultConfiguration,
    });

    expect(actual).toBeDefined();
    const iceBondBuffMod = actual?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    );
    expect(iceBondBuffMod?.value).toBeCloseTo(0.33 * 1.3);
  });

  test("support skill level affects skill effect bonus", () => {
    // Mass Effect at level 1: 10.5% skill effect
    // Mass Effect at level 20: 20% skill effect
    //
    // Ice Bond at level 20: 33% base
    // With Mass Effect L1: 33% * (1 + 0.105) = 36.465%
    // With Mass Effect L20: 33% * (1 + 0.2) = 39.6%
    const loadoutL1 = createBuffSkillLoadout({ name: "[Test] Simple Attack" }, [
      { name: "Ice Bond", supports: [{ name: "Mass Effect", level: 1 }] },
    ]);
    const loadoutL20 = createBuffSkillLoadout(
      { name: "[Test] Simple Attack" },
      [{ name: "Ice Bond", supports: [{ name: "Mass Effect", level: 20 }] }],
    );

    const actualL1 = calculateOffense({
      loadout: loadoutL1,
      mainSkillName: "[Test] Simple Attack",
      configuration: defaultConfiguration,
    });
    const actualL20 = calculateOffense({
      loadout: loadoutL20,
      mainSkillName: "[Test] Simple Attack",
      configuration: defaultConfiguration,
    });

    const buffModL1 = actualL1?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    );
    const buffModL20 = actualL20?.resolvedMods.find(
      (m) =>
        m.type === "DmgPct" &&
        m.modType === "cold" &&
        "cond" in m &&
        m.cond === "enemy_frostbitten",
    );

    expect(buffModL1?.value).toBeCloseTo(0.33 * 1.105);
    expect(buffModL20?.value).toBeCloseTo(0.33 * 1.2);
  });
});
