import { type CoreTalentName, CoreTalentNames } from "../../data/core_talent";
import type { Mod, PerStackable, ResPenType } from "../mod";
import { StatWordMapping } from "./enums";
import { spec, t } from "./template";

const coreTalentNameSet = new Set(CoreTalentNames.map((name) => name.toLowerCase()));

export const allParsers = [
  // Core talent names - matches exact talent name
  {
    parse(input: string): Mod[] | undefined {
      if (!coreTalentNameSet.has(input)) return undefined;
      const name = CoreTalentNames.find((n) => n.toLowerCase() === input) as CoreTalentName;
      return [{ type: "CoreTalent", name }];
    },
  },
  t("{aspd:dec%} gear attack speed. {dmg:dec%} additional attack damage").outputMany([
    spec("GearAspdPct", (c) => ({ value: c.aspd })),
    spec("DmgPct", (c) => ({
      value: c.dmg,
      addn: true,
      modType: "attack" as const,
    })),
  ]),

  t(
    "adds {min:int} - {max:int} {dmgType:DmgChunkType} damage to attacks and spells for every {amt:int} mana consumed recently. stacks up to {limit:int} time\\(s\\)",
  ).outputMany([
    spec("FlatDmgToAtks", (c) => {
      const per: PerStackable = {
        stackable: "mana_consumed_recently",
        amt: c.amt,
        limit: c.limit,
      };
      return {
        value: { min: c.min, max: c.max },
        dmgType: c.dmgType,
        per,
      };
    }),
    spec("FlatDmgToSpells", (c) => {
      const per: PerStackable = {
        stackable: "mana_consumed_recently",
        amt: c.amt,
        limit: c.limit,
      };
      return {
        value: { min: c.min, max: c.max },
        dmgType: c.dmgType,
        per,
      };
    }),
  ]),

  t("adds {min:int} - {max:int} {dmgType:DmgChunkType} damage to attacks and spells").outputMany([
    spec("FlatDmgToAtks", (c) => ({
      value: { min: c.min, max: c.max },
      dmgType: c.dmgType,
    })),
    spec("FlatDmgToSpells", (c) => ({
      value: { min: c.min, max: c.max },
      dmgType: c.dmgType,
    })),
  ]),

  t(
    "{value:dec%} critical strike rating and critical strike damage for every {amt:int} mana consumed recently",
  ).outputMany([
    spec("CritRatingPct", (c) => {
      const per: PerStackable = {
        stackable: "mana_consumed_recently",
        amt: c.amt,
      };
      return {
        value: c.value,
        modType: "global" as const,
        per,
      };
    }),
    spec("CritDmgPct", (c) => {
      const per: PerStackable = {
        stackable: "mana_consumed_recently",
        amt: c.amt,
      };
      return {
        value: c.value,
        modType: "global" as const,
        addn: false,
        per,
      };
    }),
  ]),

  t("{value:dec%} critical strike rating and critical strike damage").outputMany([
    spec("CritRatingPct", (c) => ({
      value: c.value,
      modType: "global" as const,
    })),
    spec("CritDmgPct", (c) => ({
      value: c.value,
      modType: "global" as const,
      addn: false,
    })),
  ]),

  t("{value:dec%} {modType:DmgModType} damage for every {amt:int} mana consumed recently, up to {limit:dec%}").output(
    "DmgPct",
    (c) => {
      const per: PerStackable = {
        stackable: "mana_consumed_recently",
        amt: c.amt,
        valueLimit: c.limit,
      };
      return {
        value: c.value,
        modType: c.modType,
        addn: false,
        per,
      };
    },
  ),

  t("{value:dec%} [additional] [{modType:DmgModType}] damage").output("DmgPct", (c) => ({
    value: c.value,
    modType: c.modType ?? "global",
    addn: c.additional !== undefined,
  })),

  t("{value:dec%} [{modType:CritRatingModType}] critical strike rating").output("CritRatingPct", (c) => ({
    value: c.value,
    modType: c.modType ?? "global",
  })),

  t("{value:dec%} [additional] [{modType:CritDmgModType}] critical strike damage").output("CritDmgPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
    modType: c.modType ?? "global",
  })),

  t("{value:dec%} [additional] minion attack and cast speed").output("MinionAspdAndCspdPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),

  t("{value:dec%} [additional] attack and cast speed").output("AspdAndCspdPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),

  t("{value:dec%} [additional] attack speed").output("AspdPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),

  t("{value:dec%} [additional] cast speed").output("CspdPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),

  t("{value:dec%} gear attack speed").output("GearAspdPct", (c) => ({
    value: c.value,
  })),

  t("{value:dec%} fervor effect").output("FervorEff", (c) => ({
    value: c.value,
  })),

  t("{value:dec%} steep strike chance").output("SteepStrikeChance", (c) => ({
    value: c.value,
  })),

  t.multi([t("{value:int} shadow quantity"), t("shadow quantity {value:int}")]).output("ShadowQuant", (c) => ({
    value: c.value,
  })),

  t("{value:dec%} [additional] shadow damage").output("ShadowDmgPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),

  t("adds {value:dec%} of {from:DmgChunkType} damage (to|as) {to:DmgChunkType} damage").output("AddsDmgAs", (c) => ({
    from: c.from,
    to: c.to,
    value: c.value,
  })),

  t("{value:dec%} elemental and erosion resistance penetration").output("ResPenPct", (c) => ({
    value: c.value,
    penType: "all" as const,
  })),

  t
    .multi([
      t("{value:dec%} {penType:ResPenType} resistance penetration"),
      t("{value:dec%} {penType:ResPenType} penetration"),
    ])
    .output("ResPenPct", (c) => ({
      value: c.value,
      penType: c.penType,
    })),

  t("{value:dec%} armor dmg mitigation penetration").output("ArmorPenPct", (c) => ({
    value: c.value,
  })),

  t("{value:dec%} chance to deal double damage").output("DoubleDmgChancePct", (c) => ({
    value: c.value,
  })),

  t("adds {min:int} - {max:int} {dmgType:DmgChunkType} damage to attacks").output("FlatDmgToAtks", (c) => ({
    value: { min: c.min, max: c.max },
    dmgType: c.dmgType,
  })),

  t("adds {min:int} - {max:int} {dmgType:DmgChunkType} damage to spells").output("FlatDmgToSpells", (c) => ({
    value: { min: c.min, max: c.max },
    dmgType: c.dmgType,
  })),

  t("{value:dec} max mana").output("MaxMana", (c) => ({
    value: c.value,
  })),

  t("{value:dec%} [additional] max mana").output("MaxManaPct", (c) => ({
    value: c.value,
    addn: c.additional !== undefined,
  })),

  t("{value:dec%} attack block chance").output("AttackBlockChancePct", (c) => ({
    value: c.value,
  })),

  t("{value:dec%} spell block chance").output("SpellBlockChancePct", (c) => ({
    value: c.value,
  })),

  t("{value:dec%} max life").output("MaxLifePct", (c) => ({
    value: c.value,
  })),

  t("{value:dec%} max energy shield").output("MaxEnergyShieldPct", (c) => ({
    value: c.value,
  })),

  t("{value:dec%} armor").output("ArmorPct", (c) => ({
    value: c.value,
  })),

  t("{value:dec%} evasion").output("EvasionPct", (c) => ({
    value: c.value,
  })),

  t("{value:dec%} energy shield regain").output("EnergyShieldRegainPct", (c) => ({
    value: c.value,
  })),

  t("{value:dec%} life regain").output("LifeRegainPct", (c) => ({
    value: c.value,
  })),

  t("{value:dec} {statType:StatWord}")
    .enum("StatWord", StatWordMapping)
    .output("Stat", (c) => ({
      value: c.value,
      statType: c.statType,
    })),

  t("{value:dec%} {statType:StatWord}")
    .enum("StatWord", StatWordMapping)
    .output("StatPct", (c) => ({
      value: c.value,
      statType: c.statType,
    })),
];
