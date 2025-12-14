import { expect, test } from "vitest";
import { parseMod } from "./mod_parser";

test("parse basic damage without type (global)", () => {
  const result = parseMod("+9% damage");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 0.09,
      modType: "global",
      addn: false,
    },
  ]);
});

test("parse typed damage", () => {
  const result = parseMod("+18% fire damage");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 0.18,
      modType: "fire",
      addn: false,
    },
  ]);
});

test("parse additional global damage", () => {
  const result = parseMod("+9% additional damage");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 0.09,
      modType: "global",
      addn: true,
    },
  ]);
});

test("parse additional typed damage", () => {
  const result = parseMod("+9% additional attack damage");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 0.09,
      modType: "attack",
      addn: true,
    },
  ]);
});

test("parse decimal damage", () => {
  const result = parseMod("+12.5% fire damage");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 0.125,
      modType: "fire",
      addn: false,
    },
  ]);
});

test("return undefined for invalid damage type", () => {
  const result = parseMod("+10% invalid damage");
  expect(result).toBeUndefined();
});

test("parse global critical strike rating", () => {
  const result = parseMod("+10% Critical Strike Rating");
  expect(result).toEqual([
    {
      type: "CritRatingPct",
      value: 0.1,
      modType: "global",
    },
  ]);
});

test("parse typed critical strike rating", () => {
  const result = parseMod("+10% Attack Critical Strike Rating");
  expect(result).toEqual([
    {
      type: "CritRatingPct",
      value: 0.1,
      modType: "attack",
    },
  ]);
});

test("parse crit rating with decimal percentage", () => {
  const result = parseMod("+12.5% Attack Critical Strike Rating");
  expect(result).toEqual([
    {
      type: "CritRatingPct",
      value: 0.125,
      modType: "attack",
    },
  ]);
});

test("return undefined for invalid crit rating mod type", () => {
  const result = parseMod("+10% Fire Critical Strike Rating");
  expect(result).toBeUndefined();
});

test("parse global critical strike damage", () => {
  const result = parseMod("+5% Critical Strike Damage");
  expect(result).toEqual([
    {
      type: "CritDmgPct",
      value: 0.05,
      modType: "global",
      addn: false,
    },
  ]);
});

test("parse additional critical strike damage", () => {
  const result = parseMod("+10% additional Critical Strike Damage");
  expect(result).toEqual([
    {
      type: "CritDmgPct",
      value: 0.1,
      modType: "global",
      addn: true,
    },
  ]);
});

test("parse attack critical strike damage", () => {
  const result = parseMod("+15% Attack Critical Strike Damage");
  expect(result).toEqual([
    {
      type: "CritDmgPct",
      value: 0.15,
      modType: "attack",
      addn: false,
    },
  ]);
});

test("parse spell critical strike damage", () => {
  const result = parseMod("+20% Spell Critical Strike Damage");
  expect(result).toEqual([
    {
      type: "CritDmgPct",
      value: 0.2,
      modType: "spell",
      addn: false,
    },
  ]);
});

test("parse additional attack critical strike damage", () => {
  const result = parseMod("+20% additional Attack Critical Strike Damage");
  expect(result).toEqual([
    {
      type: "CritDmgPct",
      value: 0.2,
      modType: "attack",
      addn: true,
    },
  ]);
});

test("parse crit damage with decimal percentage", () => {
  const result = parseMod("+12.5% Critical Strike Damage");
  expect(result).toEqual([
    {
      type: "CritDmgPct",
      value: 0.125,
      modType: "global",
      addn: false,
    },
  ]);
});

test("return undefined for invalid crit damage mod type", () => {
  const result = parseMod("+10% Fire Critical Strike Damage");
  expect(result).toBeUndefined();
});

test("parse basic attack speed", () => {
  const result = parseMod("+6% attack speed");
  expect(result).toEqual([
    {
      type: "AspdPct",
      value: 0.06,
      addn: false,
    },
  ]);
});

test("parse additional attack speed", () => {
  const result = parseMod("+6% additional attack speed");
  expect(result).toEqual([
    {
      type: "AspdPct",
      value: 0.06,
      addn: true,
    },
  ]);
});

test("parse attack speed with decimal percentage", () => {
  const result = parseMod("+12.5% attack speed");
  expect(result).toEqual([
    {
      type: "AspdPct",
      value: 0.125,
      addn: false,
    },
  ]);
});

test("parse basic cast speed", () => {
  const result = parseMod("+6% cast speed");
  expect(result).toEqual([
    {
      type: "CspdPct",
      value: 0.06,
      addn: false,
    },
  ]);
});

test("parse basic attack and cast speed", () => {
  const result = parseMod("+6% attack and cast speed");
  expect(result).toEqual([
    {
      type: "AspdAndCspdPct",
      value: 0.06,
      addn: false,
    },
  ]);
});

test("parse basic minion attack and cast speed", () => {
  const result = parseMod("+6% minion attack and cast speed");
  expect(result).toEqual([
    {
      type: "MinionAspdAndCspdPct",
      value: 0.06,
      addn: false,
    },
  ]);
});

test("parse attack block chance", () => {
  const result = parseMod("+4% Attack Block Chance");
  expect(result).toEqual([
    {
      type: "AttackBlockChancePct",
      value: 0.04,
    },
  ]);
});

test("parse spell block chance", () => {
  const result = parseMod("+4% Spell Block Chance");
  expect(result).toEqual([
    {
      type: "SpellBlockChancePct",
      value: 0.04,
    },
  ]);
});

test("parse max life", () => {
  const result = parseMod("+3% Max Life");
  expect(result).toEqual([
    {
      type: "MaxLifePct",
      value: 0.03,
    },
  ]);
});

test("parse max energy shield", () => {
  const result = parseMod("+3% Max Energy Shield");
  expect(result).toEqual([
    {
      type: "MaxEnergyShieldPct",
      value: 0.03,
    },
  ]);
});

test("parse armor", () => {
  const result = parseMod("+5% Armor");
  expect(result).toEqual([
    {
      type: "ArmorPct",
      value: 0.05,
    },
  ]);
});

test("parse evasion", () => {
  const result = parseMod("+5% Evasion");
  expect(result).toEqual([
    {
      type: "EvasionPct",
      value: 0.05,
    },
  ]);
});

test("parse life regain", () => {
  const result = parseMod("1.5% Life Regain");
  expect(result).toEqual([
    {
      type: "LifeRegainPct",
      value: 0.015,
    },
  ]);
});

test("parse energy shield regain", () => {
  const result = parseMod("1.5% Energy Shield Regain");
  expect(result).toEqual([
    {
      type: "EnergyShieldRegainPct",
      value: 0.015,
    },
  ]);
});

// test("parse multistrike chance", () => {
//   const result = parseMod("+32% chance to Multistrike");
//   expect(result).toEqual([{
//     type: "MultistrikeChancePct",
//     value: 0.32,
//   }]);
// });

test("parse flat strength", () => {
  const result = parseMod("+6 Strength");
  expect(result).toEqual([
    {
      type: "Stat",
      statType: "str",
      value: 6,
    },
  ]);
});

test("parse flat dexterity", () => {
  const result = parseMod("+6 Dexterity");
  expect(result).toEqual([
    {
      type: "Stat",
      statType: "dex",
      value: 6,
    },
  ]);
});

test("parse flat intelligence", () => {
  const result = parseMod("+6 Intelligence");
  expect(result).toEqual([
    {
      type: "Stat",
      statType: "int",
      value: 6,
    },
  ]);
});

test("parse percentage strength", () => {
  const result = parseMod("+4% Strength");
  expect(result).toEqual([
    {
      type: "StatPct",
      statType: "str",
      value: 0.04,
    },
  ]);
});

test("parse percentage dexterity", () => {
  const result = parseMod("+4% Dexterity");
  expect(result).toEqual([
    {
      type: "StatPct",
      statType: "dex",
      value: 0.04,
    },
  ]);
});

test("parse percentage intelligence", () => {
  const result = parseMod("+4% Intelligence");
  expect(result).toEqual([
    {
      type: "StatPct",
      statType: "int",
      value: 0.04,
    },
  ]);
});

test("parse fervor effect", () => {
  const result = parseMod("+4% Fervor effect");
  expect(result).toEqual([
    {
      type: "FervorEff",
      value: 0.04,
    },
  ]);
});

test("parse steep strike chance", () => {
  const result = parseMod("+12% Steep Strike chance");
  expect(result).toEqual([
    {
      type: "SteepStrikeChance",
      value: 0.12,
    },
  ]);
});

test("parse shadow quantity", () => {
  const result = parseMod("+2 Shadow Quantity");
  expect(result).toEqual([
    {
      type: "ShadowQuant",
      value: 2,
    },
  ]);
});
