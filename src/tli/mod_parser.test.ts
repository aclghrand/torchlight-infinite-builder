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

test("parse adds damage as", () => {
  const result = parseMod("Adds 18% of Physical Damage to Cold Damage");
  expect(result).toEqual([
    {
      type: "AddsDmgAs",
      from: "physical",
      to: "cold",
      value: 0.18,
    },
  ]);
});

test("parse adds damage as with decimal", () => {
  const result = parseMod("Adds 12.5% of Fire Damage to Lightning Damage");
  expect(result).toEqual([
    {
      type: "AddsDmgAs",
      from: "fire",
      to: "lightning",
      value: 0.125,
    },
  ]);
});

test("parse adds damage as with 'as' keyword", () => {
  const result = parseMod("Adds 18% of Physical Damage as Lightning Damage");
  expect(result).toEqual([
    {
      type: "AddsDmgAs",
      from: "physical",
      to: "lightning",
      value: 0.18,
    },
  ]);
});

test("return undefined for invalid adds damage as types", () => {
  const result = parseMod("Adds 10% of Magic Damage to Cold Damage");
  expect(result).toBeUndefined();
});

test("parse cold penetration", () => {
  const result = parseMod("+8% Cold Penetration");
  expect(result).toEqual([
    {
      type: "ResPenPct",
      value: 0.08,
      penType: "cold",
    },
  ]);
});

test("parse lightning penetration", () => {
  const result = parseMod("+12% Lightning Penetration");
  expect(result).toEqual([
    {
      type: "ResPenPct",
      value: 0.12,
      penType: "lightning",
    },
  ]);
});

test("parse fire penetration", () => {
  const result = parseMod("+10% Fire Penetration");
  expect(result).toEqual([
    {
      type: "ResPenPct",
      value: 0.1,
      penType: "fire",
    },
  ]);
});

test("parse elemental resistance penetration", () => {
  const result = parseMod("+15% Elemental Resistance Penetration");
  expect(result).toEqual([
    {
      type: "ResPenPct",
      value: 0.15,
      penType: "elemental",
    },
  ]);
});

test("parse erosion resistance penetration", () => {
  const result = parseMod("+10% Erosion Resistance Penetration");
  expect(result).toEqual([
    {
      type: "ResPenPct",
      value: 0.1,
      penType: "erosion",
    },
  ]);
});

test("parse elemental and erosion resistance penetration", () => {
  const result = parseMod("+23% Elemental and Erosion Resistance Penetration");
  expect(result).toEqual([
    {
      type: "ResPenPct",
      value: 0.23,
      penType: "all",
    },
  ]);
});

test("parse armor dmg mitigation penetration", () => {
  const result = parseMod("+8% Armor DMG Mitigation Penetration");
  expect(result).toEqual([
    {
      type: "ArmorPenPct",
      value: 0.08,
    },
  ]);
});

test("parse armor dmg mitigation penetration with decimal", () => {
  const result = parseMod("+12.5% Armor DMG Mitigation Penetration");
  expect(result).toEqual([
    {
      type: "ArmorPenPct",
      value: 0.125,
    },
  ]);
});

test("parse gear attack speed", () => {
  const result = parseMod("+8% gear Attack Speed");
  expect(result).toEqual([
    {
      type: "GearAspdPct",
      value: 0.08,
    },
  ]);
});

test("parse gear attack speed with damage penalty", () => {
  const result = parseMod(
    "+57% Gear Attack Speed. -12% additional Attack Damage",
  );
  expect(result).toEqual([
    {
      type: "GearAspdPct",
      value: 0.57,
    },
    {
      type: "DmgPct",
      value: -0.12,
      addn: true,
      modType: "attack",
    },
  ]);
});

test("parse double damage chance", () => {
  const result = parseMod("+31% chance to deal Double Damage");
  expect(result).toEqual([
    {
      type: "DoubleDmgChancePct",
      value: 0.31,
    },
  ]);
});

test("parse flat max mana", () => {
  const result = parseMod("+166 Max Mana");
  expect(result).toEqual([
    {
      type: "MaxMana",
      value: 166,
    },
  ]);
});

test("parse percentage max mana", () => {
  const result = parseMod("+90% Max Mana");
  expect(result).toEqual([
    {
      type: "MaxManaPct",
      value: 0.9,
      addn: false,
    },
  ]);
});

test("parse additional percentage max mana", () => {
  const result = parseMod("+20% additional Max Mana");
  expect(result).toEqual([
    {
      type: "MaxManaPct",
      value: 0.2,
      addn: true,
    },
  ]);
});

test("parse flat fire damage to attacks", () => {
  const result = parseMod("Adds 9 - 15 Fire Damage to Attacks");
  expect(result).toEqual([
    {
      type: "FlatDmgToAtks",
      value: { min: 9, max: 15 },
      dmgType: "fire",
    },
  ]);
});

test("parse flat cold damage to attacks", () => {
  const result = parseMod("Adds 20 - 30 Cold Damage to Attacks");
  expect(result).toEqual([
    {
      type: "FlatDmgToAtks",
      value: { min: 20, max: 30 },
      dmgType: "cold",
    },
  ]);
});

test("parse flat fire damage to spells", () => {
  const result = parseMod("Adds 9 - 15 Fire Damage to Spells");
  expect(result).toEqual([
    {
      type: "FlatDmgToSpells",
      value: { min: 9, max: 15 },
      dmgType: "fire",
    },
  ]);
});

test("parse flat lightning damage to spells", () => {
  const result = parseMod("Adds 12 - 25 Lightning Damage to Spells");
  expect(result).toEqual([
    {
      type: "FlatDmgToSpells",
      value: { min: 12, max: 25 },
      dmgType: "lightning",
    },
  ]);
});

test("parse flat fire damage to attacks and spells", () => {
  const result = parseMod("Adds 9 - 15 Fire Damage to Attacks and Spells");
  expect(result).toEqual([
    {
      type: "FlatDmgToAtks",
      value: { min: 9, max: 15 },
      dmgType: "fire",
    },
    {
      type: "FlatDmgToSpells",
      value: { min: 9, max: 15 },
      dmgType: "fire",
    },
  ]);
});

test("parse flat physical damage to attacks and spells", () => {
  const result = parseMod("Adds 20 - 35 Physical Damage to Attacks and Spells");
  expect(result).toEqual([
    {
      type: "FlatDmgToAtks",
      value: { min: 20, max: 35 },
      dmgType: "physical",
    },
    {
      type: "FlatDmgToSpells",
      value: { min: 20, max: 35 },
      dmgType: "physical",
    },
  ]);
});

test("parse flat physical damage to attacks and spells per mana consumed recently", () => {
  const result = parseMod(
    "Adds 22 - 27 Physical Damage to Attacks and Spells for every 1034 Mana consumed recently. Stacks up to 200 time(s)",
  );
  expect(result).toEqual([
    {
      type: "FlatDmgToAtks",
      value: { min: 22, max: 27 },
      dmgType: "physical",
      per: { stackable: "mana_consumed_recently", amt: 1034, limit: 200 },
    },
    {
      type: "FlatDmgToSpells",
      value: { min: 22, max: 27 },
      dmgType: "physical",
      per: { stackable: "mana_consumed_recently", amt: 1034, limit: 200 },
    },
  ]);
});

test("parse spell damage per mana consumed recently with value limit", () => {
  const result = parseMod(
    "+7% Spell Damage for every 100 Mana consumed recently, up to 432%",
  );
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 0.07,
      modType: "spell",
      addn: false,
      per: { stackable: "mana_consumed_recently", amt: 100, valueLimit: 4.32 },
    },
  ]);
});

test("parse critical strike rating and damage combined", () => {
  const result = parseMod(
    "+5% Critical Strike Rating and Critical Strike Damage",
  );
  expect(result).toEqual([
    {
      type: "CritRatingPct",
      value: 0.05,
      modType: "global",
    },
    {
      type: "CritDmgPct",
      value: 0.05,
      modType: "global",
      addn: false,
    },
  ]);
});
