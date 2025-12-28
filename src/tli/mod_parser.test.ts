import { expect, test } from "vitest";
import { parseMod } from "./mod_parser/index";

test("parse basic damage without type (global)", () => {
  const result = parseMod("+9% damage");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 9,
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
      value: 18,
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
      value: 9,
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
      value: 9,
      modType: "attack",
      addn: true,
    },
  ]);
});

test("parse additional damage when mana reaches max", () => {
  const result = parseMod(
    "+40% additional damage for the next skill when Mana reaches the max",
  );
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 40,
      modType: "global",
      addn: true,
      cond: "has_full_mana",
    },
  ]);
});

test("parse additional damage against enemies with elemental ailments", () => {
  const result = parseMod(
    "+25% additional damage against enemies with Elemental Ailments",
  );
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 25,
      modType: "global",
      addn: true,
      cond: "enemy_has_ailment",
    },
  ]);
});

test("parse additional damage per frostbite rating", () => {
  const result = parseMod(
    "Deals +1% additional damage to an enemy for every 2 points of Frostbite Rating the enemy has",
  );
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 1,
      modType: "global",
      addn: true,
      per: { stackable: "frostbite_rating", amt: 2 },
    },
  ]);
});

test("parse additional attack damage to nearby enemies", () => {
  const result = parseMod(
    "Deals up to +25% additional Attack Damage to enemies in proximity, and this damage reduces as the distance from the enemy grows",
  );
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 25,
      modType: "attack",
      addn: true,
      cond: "target_enemy_is_in_proximity",
    },
  ]);
});

test("parse additional attack and ailment damage with elites nearby", () => {
  const result = parseMod(
    "+20% additional Attack Damage and Ailment Damage dealt by attacks when there are Elites within 10m nearby",
  );
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 20,
      modType: "attack",
      addn: true,
      cond: "has_elites_nearby",
    },
    {
      type: "DmgPct",
      value: 20,
      modType: "ailment",
      addn: true,
      cond: "has_elites_nearby",
    },
  ]);
});

test("parse decimal damage", () => {
  const result = parseMod("+12.5% fire damage");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 12.5,
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
      value: 10,
      modType: "global",
    },
  ]);
});

test("parse typed critical strike rating", () => {
  const result = parseMod("+10% Attack Critical Strike Rating");
  expect(result).toEqual([
    {
      type: "CritRatingPct",
      value: 10,
      modType: "attack",
    },
  ]);
});

test("parse crit rating with decimal percentage", () => {
  const result = parseMod("+12.5% Attack Critical Strike Rating");
  expect(result).toEqual([
    {
      type: "CritRatingPct",
      value: 12.5,
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
      value: 5,
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
      value: 10,
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
      value: 15,
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
      value: 20,
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
      value: 20,
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
      value: 12.5,
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
      value: 6,
      addn: false,
    },
  ]);
});

test("parse additional attack speed", () => {
  const result = parseMod("+6% additional attack speed");
  expect(result).toEqual([
    {
      type: "AspdPct",
      value: 6,
      addn: true,
    },
  ]);
});

test("parse attack speed with decimal percentage", () => {
  const result = parseMod("+12.5% attack speed");
  expect(result).toEqual([
    {
      type: "AspdPct",
      value: 12.5,
      addn: false,
    },
  ]);
});

test("parse basic cast speed", () => {
  const result = parseMod("+6% cast speed");
  expect(result).toEqual([
    {
      type: "CspdPct",
      value: 6,
      addn: false,
    },
  ]);
});

test("parse basic attack and cast speed", () => {
  const result = parseMod("+6% attack and cast speed");
  expect(result).toEqual([
    {
      type: "AspdPct",
      value: 6,
      addn: false,
    },
    {
      type: "CspdPct",
      value: 6,
      addn: false,
    },
  ]);
});

test("parse attack and cast speed when at full mana", () => {
  const result = parseMod("+20% Attack and Cast Speed when at Full Mana");
  expect(result).toEqual([
    {
      type: "AspdPct",
      value: 20,
      addn: false,
      cond: "has_full_mana",
    },
    {
      type: "CspdPct",
      value: 20,
      addn: false,
      cond: "has_full_mana",
    },
  ]);
});

test("parse basic minion attack and cast speed", () => {
  const result = parseMod("+6% minion attack and cast speed");
  expect(result).toEqual([
    {
      type: "MinionAspdAndCspdPct",
      value: 6,
      addn: false,
    },
  ]);
});

test("parse attack block chance", () => {
  const result = parseMod("+4% Attack Block Chance");
  expect(result).toEqual([
    {
      type: "AttackBlockChancePct",
      value: 4,
    },
  ]);
});

test("parse spell block chance", () => {
  const result = parseMod("+4% Spell Block Chance");
  expect(result).toEqual([
    {
      type: "SpellBlockChancePct",
      value: 4,
    },
  ]);
});

test("parse max life", () => {
  const result = parseMod("+3% Max Life");
  expect(result).toEqual([
    {
      type: "MaxLifePct",
      value: 3,
    },
  ]);
});

test("parse max energy shield", () => {
  const result = parseMod("+3% Max Energy Shield");
  expect(result).toEqual([
    {
      type: "MaxEnergyShieldPct",
      value: 3,
    },
  ]);
});

test("parse armor", () => {
  const result = parseMod("+5% Armor");
  expect(result).toEqual([
    {
      type: "ArmorPct",
      value: 5,
    },
  ]);
});

test("parse evasion", () => {
  const result = parseMod("+5% Evasion");
  expect(result).toEqual([
    {
      type: "EvasionPct",
      value: 5,
    },
  ]);
});

test("parse life regain", () => {
  const result = parseMod("1.5% Life Regain");
  expect(result).toEqual([
    {
      type: "LifeRegainPct",
      value: 1.5,
    },
  ]);
});

test("parse energy shield regain", () => {
  const result = parseMod("1.5% Energy Shield Regain");
  expect(result).toEqual([
    {
      type: "EnergyShieldRegainPct",
      value: 1.5,
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
      value: 4,
    },
  ]);
});

test("parse percentage dexterity", () => {
  const result = parseMod("+4% Dexterity");
  expect(result).toEqual([
    {
      type: "StatPct",
      statType: "dex",
      value: 4,
    },
  ]);
});

test("parse percentage intelligence", () => {
  const result = parseMod("+4% Intelligence");
  expect(result).toEqual([
    {
      type: "StatPct",
      statType: "int",
      value: 4,
    },
  ]);
});

test("parse fervor effect", () => {
  const result = parseMod("+4% Fervor effect");
  expect(result).toEqual([
    {
      type: "FervorEffPct",
      value: 4,
    },
  ]);
});

test("parse steep strike chance", () => {
  const result = parseMod("+12% Steep Strike chance");
  expect(result).toEqual([
    {
      type: "SteepStrikeChancePct",
      value: 12,
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
      type: "AddsDmgAsPct",
      from: "physical",
      to: "cold",
      value: 18,
    },
  ]);
});

test("parse adds damage as with decimal", () => {
  const result = parseMod("Adds 12.5% of Fire Damage to Lightning Damage");
  expect(result).toEqual([
    {
      type: "AddsDmgAsPct",
      from: "fire",
      to: "lightning",
      value: 12.5,
    },
  ]);
});

test("parse adds damage as with 'as' keyword", () => {
  const result = parseMod("Adds 18% of Physical Damage as Lightning Damage");
  expect(result).toEqual([
    {
      type: "AddsDmgAsPct",
      from: "physical",
      to: "lightning",
      value: 18,
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
      value: 8,
      penType: "cold",
    },
  ]);
});

test("parse lightning penetration", () => {
  const result = parseMod("+12% Lightning Penetration");
  expect(result).toEqual([
    {
      type: "ResPenPct",
      value: 12,
      penType: "lightning",
    },
  ]);
});

test("parse fire penetration", () => {
  const result = parseMod("+10% Fire Penetration");
  expect(result).toEqual([
    {
      type: "ResPenPct",
      value: 10,
      penType: "fire",
    },
  ]);
});

test("parse elemental resistance penetration", () => {
  const result = parseMod("+15% Elemental Resistance Penetration");
  expect(result).toEqual([
    {
      type: "ResPenPct",
      value: 15,
      penType: "elemental",
    },
  ]);
});

test("parse erosion resistance penetration", () => {
  const result = parseMod("+10% Erosion Resistance Penetration");
  expect(result).toEqual([
    {
      type: "ResPenPct",
      value: 10,
      penType: "erosion",
    },
  ]);
});

test("parse elemental and erosion resistance penetration", () => {
  const result = parseMod("+23% Elemental and Erosion Resistance Penetration");
  expect(result).toEqual([
    {
      type: "ResPenPct",
      value: 23,
      penType: "all",
    },
  ]);
});

test("parse armor dmg mitigation penetration", () => {
  const result = parseMod("+8% Armor DMG Mitigation Penetration");
  expect(result).toEqual([
    {
      type: "ArmorPenPct",
      value: 8,
    },
  ]);
});

test("parse armor dmg mitigation penetration with decimal", () => {
  const result = parseMod("+12.5% Armor DMG Mitigation Penetration");
  expect(result).toEqual([
    {
      type: "ArmorPenPct",
      value: 12.5,
    },
  ]);
});

test("parse gear attack speed", () => {
  const result = parseMod("+8% gear Attack Speed");
  expect(result).toEqual([
    {
      type: "GearAspdPct",
      value: 8,
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
      value: 57,
    },
    {
      type: "DmgPct",
      value: -12,
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
      value: 31,
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
      value: 90,
      addn: false,
    },
  ]);
});

test("parse additional percentage max mana", () => {
  const result = parseMod("+20% additional Max Mana");
  expect(result).toEqual([
    {
      type: "MaxManaPct",
      value: 20,
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
      value: 7,
      modType: "spell",
      addn: false,
      per: { stackable: "mana_consumed_recently", amt: 100, valueLimit: 432 },
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
      value: 5,
      modType: "global",
    },
    {
      type: "CritDmgPct",
      value: 5,
      modType: "global",
      addn: false,
    },
  ]);
});

test("parse critical strike rating and damage per mana consumed recently", () => {
  const result = parseMod(
    "+5% Critical Strike Rating and Critical Strike Damage for every 720 Mana consumed recently",
  );
  expect(result).toEqual([
    {
      type: "CritRatingPct",
      value: 5,
      modType: "global",
      per: { stackable: "mana_consumed_recently", amt: 720 },
    },
    {
      type: "CritDmgPct",
      value: 5,
      modType: "global",
      addn: false,
      per: { stackable: "mana_consumed_recently", amt: 720 },
    },
  ]);
});

test("parse core talent - single word name", () => {
  const result = parseMod("Elimination");
  expect(result).toEqual([
    {
      type: "CoreTalent",
      name: "Elimination",
    },
  ]);
});

test("parse core talent - multi-word name", () => {
  const result = parseMod("Three Birds with One Stone");
  expect(result).toEqual([
    {
      type: "CoreTalent",
      name: "Three Birds with One Stone",
    },
  ]);
});

test("parse core talent - name with apostrophe", () => {
  const result = parseMod("Third time's a charm");
  expect(result).toEqual([
    {
      type: "CoreTalent",
      name: "Third time's a charm",
    },
  ]);
});

test("parse core talent - case insensitive", () => {
  const result = parseMod("elimination");
  expect(result).toEqual([
    {
      type: "CoreTalent",
      name: "Elimination",
    },
  ]);
});

test("return undefined for non-existent core talent name", () => {
  const result = parseMod("Not A Real Talent");
  expect(result).toBeUndefined();
});

test("parse max focus blessing stacks", () => {
  const result = parseMod("Max Focus Blessing Stacks +1");
  expect(result).toEqual([
    {
      type: "MaxFocusBlessing",
      value: 1,
    },
  ]);
});

test("parse max focus blessing stacks with higher value", () => {
  const result = parseMod("Max Focus Blessing Stacks +3");
  expect(result).toEqual([
    {
      type: "MaxFocusBlessing",
      value: 3,
    },
  ]);
});

test("parse max agility blessing stacks", () => {
  const result = parseMod("Max Agility Blessing Stacks +1");
  expect(result).toEqual([
    {
      type: "MaxAgilityBlessing",
      value: 1,
    },
  ]);
});

test("parse max agility blessing stacks with higher value", () => {
  const result = parseMod("Max Agility Blessing Stacks +3");
  expect(result).toEqual([
    {
      type: "MaxAgilityBlessing",
      value: 3,
    },
  ]);
});
