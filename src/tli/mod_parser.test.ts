import { expect, test } from "vitest";
import { parseMod } from "./mod_parser/index";

test("parse basic damage without type (global)", () => {
  const result = parseMod("+9% damage");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 9,
      dmgModType: "global",
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
      dmgModType: "fire",
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
      dmgModType: "global",
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
      dmgModType: "attack",
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
      dmgModType: "global",
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
      dmgModType: "global",
      addn: true,
      cond: "enemy_has_ailment",
    },
  ]);
});

test("parse additional damage against cursed enemies", () => {
  const result = parseMod("+8% additional damage against Cursed enemies");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 8,
      dmgModType: "global",
      addn: true,
      cond: "enemy_is_cursed",
    },
  ]);
});

test("parse damage against cursed enemies (non-additional)", () => {
  const result = parseMod("+10% damage against Cursed enemies");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 10,
      dmgModType: "global",
      addn: false,
      cond: "enemy_is_cursed",
    },
  ]);
});

test("parse additional erosion area damage against elites", () => {
  const result = parseMod("+10% additional Erosion Area Damage against Elites");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 10,
      dmgModType: "erosion_area",
      addn: true,
      cond: "target_enemy_is_elite",
    },
  ]);
});

test("parse curse damage dealt and damage taken", () => {
  const result = parseMod(
    "+20% additional damage dealt to Cursed enemies. -20% additional damage taken from Cursed enemies",
  );
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 20,
      dmgModType: "global",
      addn: true,
      cond: "enemy_is_cursed",
    },
    {
      type: "DmgTakenPct",
      value: -20,
      cond: "enemy_is_cursed",
    },
  ]);
});

test("parse additional damage per movement speed with cap", () => {
  const result = parseMod(
    "+1% additional Damage per +10% Movement Speed, up to +10%",
  );
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 1,
      dmgModType: "global",
      addn: true,
      per: {
        stackable: "movement_speed_bonus_pct",
        amt: 10,
        valueLimit: 10,
      },
    },
  ]);
});

test("parse additional damage when having both sealed mana and life", () => {
  const result = parseMod(
    "+10% additional damage when having both Sealed Mana and Life",
  );
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 10,
      dmgModType: "global",
      addn: true,
      cond: "have_both_sealed_mana_and_life",
    },
  ]);
});

test("parse damage when focus blessing is active", () => {
  const result = parseMod("+30% damage when Focus Blessing is active");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 30,
      dmgModType: "global",
      addn: false,
      cond: "has_focus_blessing",
    },
  ]);
});

test("parse damage if you have blocked recently", () => {
  const result = parseMod("+40% damage if you have Blocked recently");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 40,
      dmgModType: "global",
      addn: false,
      cond: "has_blocked_recently",
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
      dmgModType: "global",
      addn: true,
      per: { stackable: "frostbite_rating", amt: 2 },
    },
  ]);
});

test("parse additional damage per fervor rating", () => {
  const result = parseMod("+1% additional damage per 2 Fervor Rating");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 1,
      dmgModType: "global",
      addn: true,
      per: { stackable: "fervor", amt: 2 },
    },
  ]);
});

test("parse additional damage per additional max channeled stack", () => {
  const result = parseMod(
    "+6% additional damage for every +1 additional Max Channeled Stack(s)",
  );
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 6,
      dmgModType: "global",
      addn: true,
      per: { stackable: "additional_max_channel_stack", amt: 1 },
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
      dmgModType: "attack",
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
      dmgModType: "attack",
      addn: true,
      cond: "has_elites_nearby",
    },
    {
      type: "DmgPct",
      value: 20,
      dmgModType: "ailment",
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
      dmgModType: "fire",
      addn: false,
    },
  ]);
});

test("parse damage over time", () => {
  const result = parseMod("+94% Damage Over Time");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 94,
      dmgModType: "damage_over_time",
      addn: false,
    },
  ]);
});

test("parse additional damage over time", () => {
  const result = parseMod("+50% additional Damage Over Time");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 50,
      dmgModType: "damage_over_time",
      addn: true,
    },
  ]);
});

test("parse blur additional damage over time effect", () => {
  const result = parseMod(
    "Blur gains an additional effect: +25% additional Damage Over Time",
  );
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 25,
      dmgModType: "damage_over_time",
      addn: true,
      cond: "has_blur",
    },
  ]);
});

test("parse additional damage after blur ends", () => {
  const result = parseMod("+25% additional damage for 3 s after Blur ends");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 25,
      dmgModType: "global",
      addn: true,
      cond: "blur_ended_recently",
    },
  ]);
});

test("parse additional damage applied to life", () => {
  const result = parseMod("8% additional damage applied to Life");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 8,
      dmgModType: "global",
      addn: true,
    },
  ]);
});

test("parse damage for channeled skills", () => {
  const result = parseMod("+27% damage for Channeled Skills");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 27,
      dmgModType: "channeled",
      addn: false,
    },
  ]);
});

test("parse additional damage for channeled skills at max stacks", () => {
  const result = parseMod(
    "At max channeled stacks, +4% additional damage for Channeled Skills for 4 s",
  );
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 4,
      dmgModType: "channeled",
      addn: true,
      cond: "at_max_channeled_stacks",
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

test("parse flat spell critical strike rating", () => {
  const result = parseMod("+110 Spell Critical Strike Rating");
  expect(result).toEqual([
    {
      type: "FlatCritRating",
      value: 110,
      modType: "spell",
    },
  ]);
});

test("parse flat attack critical strike rating", () => {
  const result = parseMod("+200 Attack Critical Strike Rating");
  expect(result).toEqual([
    {
      type: "FlatCritRating",
      value: 200,
      modType: "attack",
    },
  ]);
});

test("parse flat global critical strike rating", () => {
  const result = parseMod("+100 Critical Strike Rating");
  expect(result).toEqual([
    {
      type: "FlatCritRating",
      value: 100,
      modType: "global",
    },
  ]);
});

test("parse gear base critical strike rating", () => {
  const result = parseMod("100 Critical Strike Rating");
  expect(result).toEqual([
    {
      type: "GearBaseCritRating",
      value: 100,
    },
  ]);
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

test("parse physical skill critical strike damage", () => {
  const result = parseMod("+26% Physical Skill Critical Strike Damage");
  expect(result).toEqual([
    {
      type: "CritDmgPct",
      value: 26,
      modType: "physical_skill",
      addn: false,
    },
  ]);
});

test("parse cold skill critical strike damage", () => {
  const result = parseMod("+26% Cold Skill Critical Strike Damage");
  expect(result).toEqual([
    {
      type: "CritDmgPct",
      value: 26,
      modType: "cold_skill",
      addn: false,
    },
  ]);
});

test("parse lightning skill critical strike damage", () => {
  const result = parseMod("+26% Lightning Skill Critical Strike Damage");
  expect(result).toEqual([
    {
      type: "CritDmgPct",
      value: 26,
      modType: "lightning_skill",
      addn: false,
    },
  ]);
});

test("parse fire skill critical strike damage", () => {
  const result = parseMod("+26% Fire Skill Critical Strike Damage");
  expect(result).toEqual([
    {
      type: "CritDmgPct",
      value: 26,
      modType: "fire_skill",
      addn: false,
    },
  ]);
});

test("parse erosion skill critical strike damage", () => {
  const result = parseMod("+26% Erosion Skill Critical Strike Damage");
  expect(result).toEqual([
    {
      type: "CritDmgPct",
      value: 26,
      modType: "erosion_skill",
      addn: false,
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

test("parse spell critical strike damage per stack of focus blessing owned", () => {
  const result = parseMod(
    "+5% Spell Critical Strike Damage per stack of Focus Blessing owned",
  );
  expect(result).toEqual([
    {
      type: "CritDmgPct",
      value: 5,
      modType: "spell",
      addn: false,
      per: { stackable: "focus_blessing" },
    },
  ]);
});

test("parse critical strike damage per spell skill used recently with stack limit", () => {
  const result = parseMod(
    "For each Spell Skill used recently, +4% Critical Strike Damage, stacking up to 12 time(s)",
  );
  expect(result).toEqual([
    {
      type: "CritDmgPct",
      value: 4,
      modType: "global",
      addn: false,
      per: { stackable: "num_spell_skills_used_recently", limit: 12 },
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

test("parse additional attack speed when only 1 enemy nearby", () => {
  const result = parseMod(
    "+20% additional Attack Speed when only 1 enemies are Nearby",
  );
  expect(result).toEqual([
    {
      type: "AspdPct",
      value: 20,
      addn: true,
      condThreshold: {
        target: "num_enemies_nearby",
        comparator: "eq",
        value: 1,
      },
    },
  ]);
});

test("parse additional attack speed if you have dealt a critical strike recently", () => {
  const result = parseMod(
    "+6% additional Attack Speed if you have dealt a Critical Strike recently",
  );
  expect(result).toEqual([
    {
      type: "AspdPct",
      value: 6,
      addn: true,
      cond: "has_crit_recently",
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

test("parse additional cast speed if you have dealt a critical strike recently", () => {
  const result = parseMod(
    "+6% additional Cast Speed if you have dealt a Critical Strike recently",
  );
  expect(result).toEqual([
    {
      type: "CspdPct",
      value: 6,
      addn: true,
      cond: "has_crit_recently",
    },
  ]);
});

test("parse basic minion attack and cast speed", () => {
  const result = parseMod("+6% minion attack and cast speed");
  expect(result).toEqual([
    {
      type: "MinionAspdPct",
      value: 6,
      addn: false,
    },
    {
      type: "MinionCspdPct",
      value: 6,
      addn: false,
    },
  ]);
});

test("parse minion attack speed", () => {
  const result = parseMod("+10% Minion Attack Speed");
  expect(result).toEqual([
    {
      type: "MinionAspdPct",
      value: 10,
      addn: false,
    },
  ]);
});

test("parse minion cast speed", () => {
  const result = parseMod("+34% Minion Cast Speed");
  expect(result).toEqual([
    {
      type: "MinionCspdPct",
      value: 34,
      addn: false,
    },
  ]);
});

test("parse projectile critical strike rating", () => {
  const result = parseMod("+30% Projectile Critical Strike Rating");
  expect(result).toEqual([
    {
      type: "CritRatingPct",
      value: 30,
      modType: "projectile",
    },
  ]);
});

test("parse minion lightning damage", () => {
  const result = parseMod("+18% Minion Lightning Damage");
  expect(result).toEqual([
    {
      type: "MinionDmgPct",
      value: 18,
      addn: false,
      minionDmgModType: "lightning",
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
      addn: false,
    },
  ]);
});

test("parse flat max life", () => {
  const result = parseMod("+151 Max Life");
  expect(result).toEqual([
    {
      type: "MaxLife",
      value: 151,
    },
  ]);
});

test("parse max energy shield", () => {
  const result = parseMod("+3% Max Energy Shield");
  expect(result).toEqual([
    {
      type: "MaxEnergyShieldPct",
      value: 3,
      addn: false,
    },
  ]);
});

test("parse flat signed max energy shield", () => {
  const result = parseMod("+1 Max Energy Shield");
  expect(result).toEqual([
    {
      type: "MaxEnergyShield",
      value: 1,
    },
  ]);
});

test("parse armor", () => {
  const result = parseMod("+5% Armor");
  expect(result).toEqual([
    {
      type: "ArmorPct",
      value: 5,
      addn: false,
    },
  ]);
});

test("parse evasion", () => {
  const result = parseMod("+5% Evasion");
  expect(result).toEqual([
    {
      type: "EvasionPct",
      value: 5,
      addn: false,
    },
  ]);
});

test("parse defense", () => {
  const result = parseMod("+40% Defense");
  expect(result).toEqual([
    {
      type: "DefensePct",
      value: 40,
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
      statModType: "str",
      value: 6,
    },
  ]);
});

test("parse flat dexterity", () => {
  const result = parseMod("+6 Dexterity");
  expect(result).toEqual([
    {
      type: "Stat",
      statModType: "dex",
      value: 6,
    },
  ]);
});

test("parse flat intelligence", () => {
  const result = parseMod("+6 Intelligence");
  expect(result).toEqual([
    {
      type: "Stat",
      statModType: "int",
      value: 6,
    },
  ]);
});

test("parse intelligence per level", () => {
  const result = parseMod("+3 Intelligence per 4 level(s)");
  expect(result).toEqual([
    {
      type: "Stat",
      statModType: "int",
      value: 3,
      per: { stackable: "level", amt: 4 },
    },
  ]);
});

test("parse dexterity per level", () => {
  const result = parseMod("+2 Dexterity per 5 level(s)");
  expect(result).toEqual([
    {
      type: "Stat",
      statModType: "dex",
      value: 2,
      per: { stackable: "level", amt: 5 },
    },
  ]);
});

test("parse strength per level", () => {
  const result = parseMod("+1 Strength per 2 level(s)");
  expect(result).toEqual([
    {
      type: "Stat",
      statModType: "str",
      value: 1,
      per: { stackable: "level", amt: 2 },
    },
  ]);
});

test("parse flat all stats", () => {
  const result = parseMod("+20 all stats");
  expect(result).toEqual([
    {
      type: "Stat",
      statModType: "all",
      value: 20,
    },
  ]);
});

test("parse percentage strength", () => {
  const result = parseMod("+4% Strength");
  expect(result).toEqual([
    {
      type: "StatPct",
      statModType: "str",
      value: 4,
    },
  ]);
});

test("parse percentage dexterity", () => {
  const result = parseMod("+4% Dexterity");
  expect(result).toEqual([
    {
      type: "StatPct",
      statModType: "dex",
      value: 4,
    },
  ]);
});

test("parse percentage intelligence", () => {
  const result = parseMod("+4% Intelligence");
  expect(result).toEqual([
    {
      type: "StatPct",
      statModType: "int",
      value: 4,
    },
  ]);
});

test("parse percentage all stats", () => {
  const result = parseMod("+10% all stats");
  expect(result).toEqual([
    {
      type: "StatPct",
      statModType: "all",
      value: 10,
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

test("parse unsigned cold penetration", () => {
  const result = parseMod("4.5% Cold Penetration");
  expect(result).toEqual([
    {
      type: "ResPenPct",
      value: 4.5,
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

test("parse damage penetrates elemental resistance", () => {
  const result = parseMod("Damage Penetrates 2% Elemental Resistance");
  expect(result).toEqual([
    {
      type: "ResPenPct",
      value: 2,
      penType: "elemental",
    },
  ]);
});

test("parse elemental resistance penetration with stackable (when hitting)", () => {
  const result = parseMod(
    "+1% Elemental Resistance Penetration when hitting an enemy with Elemental Damage, stacking up to 4 times",
  );
  expect(result).toEqual([
    {
      type: "ResPenPct",
      value: 1,
      penType: "elemental",
      per: {
        stackable: "has_hit_enemy_with_elemental_dmg_recently",
        amt: 1,
        limit: 4,
      },
    },
  ]);
});

test("parse elemental resistance penetration with stackable (every time)", () => {
  const result = parseMod(
    "1.5% Elemental Resistance Penetration every time you hit an enemy with Elemental Damage recently. Stacks up to 4 times",
  );
  expect(result).toEqual([
    {
      type: "ResPenPct",
      value: 1.5,
      penType: "elemental",
      per: {
        stackable: "has_hit_enemy_with_elemental_dmg_recently",
        amt: 1,
        limit: 4,
      },
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
      dmgModType: "attack",
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

test("parse mana per intelligence", () => {
  const result = parseMod("+1 Mana per 6 Intelligence");
  expect(result).toEqual([
    {
      type: "MaxMana",
      value: 1,
      per: { stackable: "int", amt: 6 },
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
      dmgModType: "spell",
      addn: false,
      per: { stackable: "mana_consumed_recently", amt: 100, valueLimit: 432 },
    },
  ]);
});

test("parse additional spell damage per max spell burst stack", () => {
  const result = parseMod(
    "For every stack of Max Spell Burst, +6% additional Spell Damage, up to +24% additional Spell Damage",
  );
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 6,
      dmgModType: "spell",
      addn: true,
      per: { stackable: "max_spell_burst", valueLimit: 24 },
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

test("parse max repentance stacks", () => {
  const result = parseMod("+3 Max Repentance Stacks");
  expect(result).toEqual([
    {
      type: "MaxRepentance",
      value: 3,
    },
  ]);
});

test("parse max spell burst", () => {
  const result = parseMod("+1 Max Spell Burst");
  expect(result).toEqual([
    {
      type: "MaxSpellBurst",
      value: 1,
    },
  ]);
});

test("parse max spell burst with movement speed condition", () => {
  const result = parseMod(
    "+1 Max Spell Burst when Movement Speed is not higher than 200% of base",
  );
  expect(result).toEqual([
    {
      type: "MaxSpellBurst",
      value: 1,
    },
  ]);
});

test("parse spell burst charge speed with additional", () => {
  const result = parseMod("-20% additional Spell Burst Charge Speed");
  expect(result).toEqual([
    {
      type: "SpellBurstChargeSpeedPct",
      value: -20,
      addn: true,
    },
  ]);
});

test("parse spell burst charge speed without additional", () => {
  const result = parseMod("-20% Spell Burst Charge Speed");
  expect(result).toEqual([
    {
      type: "SpellBurstChargeSpeedPct",
      value: -20,
      addn: false,
    },
  ]);
});

test("parse play safe cast speed to spell burst", () => {
  const result = parseMod(
    "100% of the bonuses and additional bonuses to Cast Speed is also applied to Spell Burst Charge Speed",
  );
  expect(result).toEqual([
    {
      type: "PlaySafe",
      value: 100,
    },
  ]);
});

test("parse max spell burst when having squidnova", () => {
  const result = parseMod("+1 to Max Spell Burst when having Squidnova");
  expect(result).toEqual([
    {
      type: "MaxSpellBurst",
      value: 1,
      cond: "has_squidnova",
    },
  ]);
});

test("parse generates squidnova", () => {
  const result = parseMod(
    "Activating Spell Burst with at least 6 stack(s) of Max Spell Burst grants 1 stack of Squidnova",
  );
  expect(result).toEqual([
    {
      type: "GeneratesSquidnova",
    },
  ]);
});

test("parse squidnova effect", () => {
  const result = parseMod("+50% Squidnova Effect");
  expect(result).toEqual([
    {
      type: "SquidnovaEffPct",
      value: 50,
    },
  ]);
});

test("parse additional spell damage when having squidnova", () => {
  const result = parseMod("+8% additional Spell Damage when having Squidnova");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 8,
      dmgModType: "spell",
      addn: true,
      cond: "has_squidnova",
    },
  ]);
});

test("parse additional elemental damage dealt by spell skills", () => {
  const result = parseMod(
    "+14% additional Elemental Damage dealt by Spell Skills",
  );
  expect(result).toEqual([
    {
      type: "ElementalSpellDmgPct",
      value: 14,
      addn: true,
    },
  ]);
});

test("parse elemental damage dealt by spell skills (non-additional)", () => {
  const result = parseMod("+20% Elemental Damage dealt by Spell Skills");
  expect(result).toEqual([
    {
      type: "ElementalSpellDmgPct",
      value: 20,
      addn: false,
    },
  ]);
});

test("parse max channeled stacks", () => {
  const result = parseMod("Max Channeled Stacks +1");
  expect(result).toEqual([
    {
      type: "MaxChannel",
      value: 1,
    },
  ]);
});

test("parse max channeled stacks when equipped in left ring slot", () => {
  const result = parseMod(
    "+4 Max Channeled Stacks when equipped in the left Ring slot",
  );
  expect(result).toEqual([
    {
      type: "MaxChannel",
      value: 4,
      cond: "equipped_in_left_ring_slot",
    },
  ]);
});

test("parse additional attack damage dealt to nearby enemies", () => {
  const result = parseMod(
    "+10% additional Attack Damage dealt to Nearby enemies",
  );
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 10,
      dmgModType: "attack",
      addn: true,
      cond: "target_enemy_is_nearby",
    },
  ]);
});

test("parse has hasten", () => {
  const result = parseMod("Has Hasten");
  expect(result).toEqual([
    {
      type: "HasHasten",
    },
  ]);
});

test("parse have fervor", () => {
  const result = parseMod("Have Fervor");
  expect(result).toEqual([
    {
      type: "HaveFervor",
    },
  ]);
});

test("parse fixed fervor rating", () => {
  const result = parseMod("Has 67 point(s) of fixed Fervor Rating");
  expect(result).toEqual([
    {
      type: "FixedFervorPts",
      value: 67,
    },
  ]);
});

test("parse generates torment", () => {
  const result = parseMod(
    "Gains a stack of Torment when dealing damage to enemies with max Affliction",
  );
  expect(result).toEqual([
    {
      type: "GeneratesTorment",
    },
  ]);
});

test("parse movement speed", () => {
  const result = parseMod("+38% Movement Speed");
  expect(result).toEqual([
    {
      type: "MovementSpeedPct",
      value: 38,
      addn: false,
    },
  ]);
});

test("parse additional movement speed", () => {
  const result = parseMod("+15% additional Movement Speed");
  expect(result).toEqual([
    {
      type: "MovementSpeedPct",
      value: 15,
      addn: true,
    },
  ]);
});

test("parse movement speed per max spell burst stack", () => {
  const result = parseMod(
    "+5% Movement Speed per stack of Max Spell Burst, up to +28%",
  );
  expect(result).toEqual([
    {
      type: "MovementSpeedPct",
      value: 5,
      addn: false,
      per: { stackable: "max_spell_burst", valueLimit: 28 },
    },
  ]);
});

test("parse support skill level", () => {
  const result = parseMod("+7 Support Skill Level");
  expect(result).toEqual([
    {
      type: "SkillLevel",
      value: 7,
      skillLevelType: "support",
    },
  ]);
});

test("parse main skill level", () => {
  const result = parseMod("+5 Main Skill Level");
  expect(result).toEqual([
    {
      type: "SkillLevel",
      value: 5,
      skillLevelType: "main",
    },
  ]);
});

test("parse active skill level", () => {
  const result = parseMod("+2 Active Skill Level");
  expect(result).toEqual([
    {
      type: "SkillLevel",
      value: 2,
      skillLevelType: "active",
    },
  ]);
});

test("parse persistent skill level", () => {
  const result = parseMod("+1 Persistent Skill Level");
  expect(result).toEqual([
    {
      type: "SkillLevel",
      value: 1,
      skillLevelType: "persistent",
    },
  ]);
});

test("parse erosion skill level", () => {
  const result = parseMod("+2 Erosion Skill Level");
  expect(result).toEqual([
    {
      type: "SkillLevel",
      value: 2,
      skillLevelType: "erosion",
    },
  ]);
});

test("parse spell skill level", () => {
  const result = parseMod("+1 Spell Skill Level");
  expect(result).toEqual([
    {
      type: "SkillLevel",
      value: 1,
      skillLevelType: "spell",
    },
  ]);
});

test("parse lightning skill level", () => {
  const result = parseMod("+2 Lightning Skill Level");
  expect(result).toEqual([
    {
      type: "SkillLevel",
      value: 2,
      skillLevelType: "lightning",
    },
  ]);
});

test("parse all skills level", () => {
  const result = parseMod("+1 all skills' level");
  expect(result).toEqual([
    {
      type: "SkillLevel",
      value: 1,
      skillLevelType: "all",
    },
  ]);
});

test("parse main skill level per sealed life at full mana", () => {
  const result = parseMod(
    "For every 11% Life Sealed when at Full Mana, Main Skill's level +1",
  );
  expect(result).toEqual([
    {
      type: "SkillLevel",
      value: 1,
      skillLevelType: "main",
      per: { stackable: "sealed_life_pct", amt: 11 },
      cond: "has_full_mana",
    },
  ]);
});

test("parse hero trait level", () => {
  const result = parseMod("+2 to Hero Trait Level");
  expect(result).toEqual([
    {
      type: "HeroTraitLevel",
      value: 2,
    },
  ]);
});

test("parse cold resistance", () => {
  const result = parseMod("+24% Cold Resistance");
  expect(result).toEqual([
    {
      type: "ResistancePct",
      value: 24,
      resType: "cold",
    },
  ]);
});

test("parse elemental resistance", () => {
  const result = parseMod("+10% Elemental Resistance");
  expect(result).toEqual([
    {
      type: "ResistancePct",
      value: 10,
      resType: "elemental",
    },
  ]);
});

test("parse elemental and erosion resistance", () => {
  const result = parseMod("+10% Elemental and Erosion Resistance");
  expect(result).toEqual([
    {
      type: "ResistancePct",
      value: 10,
      resType: "elemental",
    },
    {
      type: "ResistancePct",
      value: 10,
      resType: "erosion",
    },
  ]);
});

test("parse max elemental resistance", () => {
  const result = parseMod("+10% Max Elemental Resistance");
  expect(result).toEqual([
    {
      type: "MaxResistancePct",
      value: 10,
      resType: "elemental",
    },
  ]);
});

test("parse max elemental and erosion resistance", () => {
  const result = parseMod("+15% Max Elemental and Erosion Resistance");
  expect(result).toEqual([
    {
      type: "MaxResistancePct",
      value: 15,
      resType: "elemental",
    },
    {
      type: "MaxResistancePct",
      value: 15,
      resType: "erosion",
    },
  ]);
});

test("parse max fire resistance", () => {
  const result = parseMod("+3% Max Fire Resistance");
  expect(result).toEqual([
    {
      type: "MaxResistancePct",
      value: 3,
      resType: "fire",
    },
  ]);
});

test("parse erosion resistance per stack of repentance", () => {
  const result = parseMod("+3% Erosion Resistance per stack of Repentance");
  expect(result).toEqual([
    {
      type: "ResistancePct",
      value: 3,
      resType: "erosion",
      per: { stackable: "repentance" },
    },
  ]);
});

test("parse reap", () => {
  const result = parseMod(
    "Reaps 0.17 s of Damage Over Time when dealing Damage Over Time. The effect has a 1 s cooldown against the same target",
  );
  expect(result).toEqual([
    {
      type: "Reap",
      duration: 0.17,
      cooldown: 1,
    },
  ]);
});

test("parse reaping duration", () => {
  const result = parseMod("+56% Reaping Duration");
  expect(result).toEqual([
    {
      type: "ReapDurationPct",
      value: 56,
    },
  ]);
});

test("parse reaping cooldown recovery speed", () => {
  const result = parseMod("+24% Reaping Cooldown Recovery Speed");
  expect(result).toEqual([
    {
      type: "ReapCdrPct",
      value: 24,
      addn: false,
    },
  ]);
});

test("parse affliction inflicted per second", () => {
  const result = parseMod("+18 Affliction inflicted per second");
  expect(result).toEqual([
    {
      type: "AfflictionInflictedPerSec",
      value: 18,
    },
  ]);
});

test("parse affliction effect", () => {
  const result = parseMod("+18% Affliction Effect");
  expect(result).toEqual([
    {
      type: "AfflictionEffectPct",
      value: 18,
      addn: false,
    },
  ]);
});

test("parse curse effect", () => {
  const result = parseMod("+4% Curse Effect");
  expect(result).toEqual([
    {
      type: "CurseEffPct",
      value: 4,
      addn: false,
    },
  ]);
});

test("parse additional curse effect", () => {
  const result = parseMod("+4% additional Curse Effect");
  expect(result).toEqual([
    {
      type: "CurseEffPct",
      value: 4,
      addn: true,
    },
  ]);
});

test("parse sage's insight fire", () => {
  const result = parseMod(
    "When a Spell hit inflicts Fire Damage, -15% Cold, Lightning, and Erosion Resistance for the target for 3 s",
  );
  expect(result).toEqual([
    {
      type: "EnemyRes",
      value: -15,
      resType: "cold",
      cond: "sages_insight_fire",
    },
    {
      type: "EnemyRes",
      value: -15,
      resType: "lightning",
      cond: "sages_insight_fire",
    },
    {
      type: "EnemyRes",
      value: -15,
      resType: "erosion",
      cond: "sages_insight_fire",
    },
  ]);
});

test("parse sage's insight cold", () => {
  const result = parseMod(
    "When a Spell hit inflicts Cold Damage, -15% Fire, Lightning, and Erosion Resistance for the target for 3 s",
  );
  expect(result).toEqual([
    {
      type: "EnemyRes",
      value: -15,
      resType: "fire",
      cond: "sages_insight_cold",
    },
    {
      type: "EnemyRes",
      value: -15,
      resType: "lightning",
      cond: "sages_insight_cold",
    },
    {
      type: "EnemyRes",
      value: -15,
      resType: "erosion",
      cond: "sages_insight_cold",
    },
  ]);
});

test("parse sage's insight lightning", () => {
  const result = parseMod(
    "When a Spell hit inflicts Lightning Damage, -15% Fire, Cold, and Erosion Resistance for the target for 3 s",
  );
  expect(result).toEqual([
    {
      type: "EnemyRes",
      value: -15,
      resType: "fire",
      cond: "sages_insight_lightning",
    },
    {
      type: "EnemyRes",
      value: -15,
      resType: "cold",
      cond: "sages_insight_lightning",
    },
    {
      type: "EnemyRes",
      value: -15,
      resType: "erosion",
      cond: "sages_insight_lightning",
    },
  ]);
});

test("parse sage's insight erosion", () => {
  const result = parseMod(
    "When a Spell hit inflicts Erosion Damage, -15% Fire, Cold, and Lightning Resistance for the target for 3 s",
  );
  expect(result).toEqual([
    {
      type: "EnemyRes",
      value: -15,
      resType: "fire",
      cond: "sages_insight_erosion",
    },
    {
      type: "EnemyRes",
      value: -15,
      resType: "cold",
      cond: "sages_insight_erosion",
    },
    {
      type: "EnemyRes",
      value: -15,
      resType: "lightning",
      cond: "sages_insight_erosion",
    },
  ]);
});

test("parse all resistance reduction when enemy has max affliction", () => {
  const result = parseMod(
    "-8% All Resistance when the enemy has max Affliction",
  );
  expect(result).toEqual([
    {
      type: "EnemyRes",
      value: -8,
      resType: "fire",
      cond: "enemy_at_max_affliction",
    },
    {
      type: "EnemyRes",
      value: -8,
      resType: "cold",
      cond: "enemy_at_max_affliction",
    },
    {
      type: "EnemyRes",
      value: -8,
      resType: "lightning",
      cond: "enemy_at_max_affliction",
    },
    {
      type: "EnemyRes",
      value: -8,
      resType: "erosion",
      cond: "enemy_at_max_affliction",
    },
  ]);
});

test("parse skill area", () => {
  const result = parseMod("+15% Skill Area");
  expect(result).toEqual([
    {
      type: "SkillAreaPct",
      value: 15,
      skillAreaModType: "global",
      addn: false,
    },
  ]);
});

test("parse curse skill area", () => {
  const result = parseMod("+8% Curse Skill Area");
  expect(result).toEqual([
    {
      type: "SkillAreaPct",
      value: 8,
      skillAreaModType: "curse",
      addn: false,
    },
  ]);
});

test("parse additional skill area", () => {
  const result = parseMod("+10% additional Skill Area");
  expect(result).toEqual([
    {
      type: "SkillAreaPct",
      value: 10,
      skillAreaModType: "global",
      addn: true,
    },
  ]);
});

test("parse additional curse skill area", () => {
  const result = parseMod("+5% additional Curse Skill Area");
  expect(result).toEqual([
    {
      type: "SkillAreaPct",
      value: 5,
      skillAreaModType: "curse",
      addn: true,
    },
  ]);
});

test("parse skill effect duration", () => {
  const result = parseMod("+2% Skill Effect Duration");
  expect(result).toEqual([
    {
      type: "SkillEffDurationPct",
      value: 2,
    },
  ]);
});

test("parse unsigned sealed mana compensation", () => {
  const result = parseMod("4.5% Sealed Mana Compensation");
  expect(result).toEqual([
    {
      type: "SealedManaCompPct",
      value: 4.5,
      addn: false,
    },
  ]);
});

test("parse signed sealed mana compensation", () => {
  const result = parseMod("+9% Sealed Mana Compensation");
  expect(result).toEqual([
    {
      type: "SealedManaCompPct",
      value: 9,
      addn: false,
    },
  ]);
});

test("parse chance to gain blur when reaping", () => {
  const result = parseMod("+5% chance to gain Blur when Reaping");
  expect(result).toEqual([
    {
      type: "GeneratesBlur",
      value: 5,
    },
  ]);
});

test("parse gains focus blessing when reaping", () => {
  const result = parseMod("Gains 1 stack(s) of Focus Blessing when Reaping");
  expect(result).toEqual([{ type: "GeneratesFocusBlessing" }]);
});

test("parse gains repentance when gaining any blessing", () => {
  const result = parseMod(
    "Gains 1 stack of Repentance when gaining any Blessing",
  );
  expect(result).toEqual([
    {
      type: "GeneratesRepentance",
      value: 1,
    },
  ]);
});

test("parse gear energy shield", () => {
  const result = parseMod("+140 gear Energy Shield");
  expect(result).toEqual([
    {
      type: "GearEnergyShield",
      value: 140,
    },
  ]);
});

test("parse curse duration", () => {
  const result = parseMod("+100% Curse Duration");
  expect(result).toEqual([
    {
      type: "CurseDurationPct",
      value: 100,
    },
  ]);
});

test("parse gear evasion", () => {
  const result = parseMod("+1920 gear Evasion");
  expect(result).toEqual([
    {
      type: "GearEvasion",
      value: 1920,
    },
  ]);
});

test("parse armor and evasion", () => {
  const result = parseMod("+685 Armor and Evasion");
  expect(result).toEqual([
    { type: "Armor", value: 685 },
    { type: "Evasion", value: 685 },
  ]);
});

test("parse additional damage taken by enemies frozen by you recently", () => {
  const result = parseMod(
    "+10% additional damage taken by enemies Frozen by you recently",
  );
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 10,
      dmgModType: "global",
      addn: true,
      isEnemyDebuff: true,
      cond: "target_enemy_frozen_recently",
    },
  ]);
});

test("parse inflicts cold infiltration", () => {
  const result = parseMod(
    "Inflicts Cold Infiltration when dealing damage to Frozen enemies",
  );
  expect(result).toEqual([
    {
      type: "InflictsInfiltration",
      infiltrationType: "cold",
    },
  ]);
});

test("parse chance to inflict frostbite", () => {
  const result = parseMod("+18% chance to inflict Frostbite");
  expect(result).toEqual([
    {
      type: "InflictFrostbitePct",
      value: 18,
    },
  ]);
});

test("parse freeze duration", () => {
  const result = parseMod("+36% Freeze Duration");
  expect(result).toEqual([
    {
      type: "FreezeDurationPct",
      value: 36,
    },
  ]);
});

test("parse gear armor", () => {
  const result = parseMod("+274 Gear Armor");
  expect(result).toEqual([
    {
      type: "GearArmor",
      value: 274,
    },
  ]);
});

test("parse energy shield charge speed", () => {
  const result = parseMod("+4% Energy Shield Charge Speed");
  expect(result).toEqual([
    {
      type: "EnergyShieldChargeSpeedPct",
      value: 4,
    },
  ]);
});

test("parse unsigned movement speed", () => {
  const result = parseMod("7.5% Movement Speed");
  expect(result).toEqual([
    {
      type: "MovementSpeedPct",
      value: 7.5,
      addn: false,
    },
  ]);
});

test("parse elemental resistance per stats", () => {
  const result = parseMod("+1% Elemental Resistance per 40 stats");
  expect(result).toEqual([
    {
      type: "ResistancePct",
      value: 1,
      resType: "elemental",
      per: { stackable: "stat", amt: 40 },
    },
  ]);
});

test("parse damage per highest stat", () => {
  const result = parseMod("+1% damage per 20 of the highest stat");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 1,
      dmgModType: "global",
      addn: false,
      per: { stackable: "highest_stat", amt: 20 },
    },
  ]);
});

test("parse generates spell aggression on defeat", () => {
  const result = parseMod("25% chance to gain Spell Aggression on defeat");
  expect(result).toEqual([
    {
      type: "GeneratesSpellAggression",
    },
  ]);
});

test("parse skill cost", () => {
  const result = parseMod("-4 Skill Cost");
  expect(result).toEqual([
    {
      type: "SkillCost",
      value: -4,
    },
  ]);
});

test("parse focus blessing duration", () => {
  const result = parseMod("+30% Focus Blessing Duration");
  expect(result).toEqual([
    {
      type: "FocusBlessingDurationPct",
      value: 30,
    },
  ]);
});

test("parse minion critical strike damage", () => {
  const result = parseMod("+15% Minion Critical Strike Damage");
  expect(result).toEqual([
    {
      type: "MinionCritDmgPct",
      value: 15,
      addn: false,
    },
  ]);
});

test("parse minion cold penetration", () => {
  const result = parseMod("4.5% Cold Penetration for Minions");
  expect(result).toEqual([
    {
      type: "MinionResPenPct",
      value: 4.5,
      penType: "cold",
    },
  ]);
});

test("parse inflicts frail on spell hit", () => {
  const result = parseMod("Inflicts Frail on Spell hit");
  expect(result).toEqual([
    {
      type: "InflictFrail",
    },
  ]);
});

test("parse lucky damage with spell burst consumption", () => {
  const result = parseMod(
    "Damage becomes Lucky and at least 4 stack(s) of Spell Burst Charge is consumed when Spell Burst is activated",
  );
  expect(result).toEqual([
    {
      type: "LuckyDmg",
    },
  ]);
});

test("parse additional cold damage per stack of focus blessing", () => {
  const result = parseMod(
    "+13% additional Cold Damage for every stack of Focus Blessing",
  );
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 13,
      dmgModType: "cold",
      addn: true,
      per: { stackable: "focus_blessing" },
    },
  ]);
});

test("parse additional spell damage per stack of focus blessing owned", () => {
  const result = parseMod(
    "+3% additional Spell Damage per stack of Focus Blessing owned",
  );
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 3,
      dmgModType: "spell",
      addn: true,
      per: { stackable: "focus_blessing" },
    },
  ]);
});

test("parse blessing duration (all types)", () => {
  const result = parseMod("+30% Blessing Duration");
  expect(result).toEqual([
    {
      type: "FocusBlessingDurationPct",
      value: 30,
    },
    {
      type: "AgilityBlessingDurationPct",
      value: 30,
    },
    {
      type: "TenacityBlessingDurationPct",
      value: 30,
    },
  ]);
});

test("parse spell damage when having focus blessing", () => {
  const result = parseMod("+30% Spell Damage when having Focus Blessing");
  expect(result).toEqual([
    {
      type: "DmgPct",
      value: 30,
      dmgModType: "spell",
      addn: false,
      cond: "has_focus_blessing",
    },
  ]);
});

test("parse generates focus blessing when activating spell burst", () => {
  const result = parseMod(
    "Gains 1 stack(s) of Focus Blessing when activating Spell Burst",
  );
  expect(result).toEqual([{ type: "GeneratesFocusBlessing" }]);
});

test("parse cast speed when focus blessing is active", () => {
  const result = parseMod("+12% Cast Speed when Focus Blessing is active");
  expect(result).toEqual([
    {
      type: "CspdPct",
      value: 12,
      addn: false,
      cond: "has_focus_blessing",
    },
  ]);
});

test("parse additional hit damage for skills cast by spell burst", () => {
  const result = parseMod(
    "+36% additional Hit Damage for skills cast by Spell Burst",
  );
  expect(result).toEqual([
    {
      type: "SpellBurstAdditionalDmgPct",
      value: 36,
    },
  ]);
});
