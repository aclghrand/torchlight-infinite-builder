import { SkillTag } from "../data/skill";
import type {
  CritDmgModType,
  CritRatingModType,
  DmgModType,
} from "./constants";
import type { DmgRange } from "./core";

export type DmgChunkType =
  | "physical"
  | "cold"
  | "lightning"
  | "fire"
  | "erosion";

export type Stackable =
  | "willpower"
  | "main_stat"
  | "frostbite_rating"
  | "projectile"
  | "skill_use"
  | "skill_charges_on_use"
  | "cruelty_buff";

export type StatType = "str" | "dex" | "int";

// mod value is multiplied by number of stackable divided by amt
// e.g. per 35 frostbite with 105 frostbite means x3
export interface PerStackable {
  stackable: Stackable;
  // number of max stacks
  limit?: number; // default infinity
  // how much to divide the stackable number by
  amt?: number; // default 1
}

export type Condition = "enemy_frostbitten";

export type Target = "own_skill_only";

export type Mod =
  | {
      type: "DmgPct";
      value: number;
      modType: DmgModType;
      addn: boolean;
      per?: PerStackable;
      cond?: Condition;
      src?: string;
    }
  | {
      type: "FlatDmgToAtks";
      value: DmgRange;
      dmgType: DmgChunkType;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "FlatDmgToAtksAndSpells";
      value: DmgRange;
      dmgType: DmgChunkType;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "FlatDmgToSpells";
      value: DmgRange;
      dmgType: DmgChunkType;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "CritRatingPct";
      value: number;
      modType: CritRatingModType;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "CritDmgPct";
      value: number;
      addn: boolean;
      modType: CritDmgModType;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "AspdPct";
      value: number;
      addn: boolean;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "CspdPct";
      value: number;
      addn: boolean;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "AspdAndCspdPct";
      value: number;
      addn: boolean;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "MinionAspdAndCspdPct";
      value: number;
      addn: boolean;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "DblDmg";
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "Stat";
      value: number;
      statType: StatType;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "StatPct";
      value: number;
      statType: StatType;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "FervorEff";
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "SteepStrikeChance";
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "SteepStrikeDmg";
      value: number;
      addn: boolean;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "SweepSlashDmg";
      value: number;
      addn: boolean;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "Fervor";
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "CritDmgPerFervor";
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "AddnMainHandDmgPct";
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "GearAspdPct";
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "FlatGearDmg";
      value: DmgRange;
      modType:
        | "physical"
        | "cold"
        | "lightning"
        | "fire"
        | "erosion"
        | "elemental";
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "GearPhysDmgPct";
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "AttackBlockChancePct";
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "SpellBlockChancePct";
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "MaxLifePct";
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "MaxEnergyShieldPct";
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "ArmorPct";
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "EvasionPct";
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "LifeRegainPct";
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "EnergyShieldRegainPct";
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "MultistrikeChancePct";
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "ConvertDmgPct";
      from: DmgChunkType;
      to: DmgChunkType;
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "AddsDmgAs";
      from: DmgChunkType;
      to: DmgChunkType;
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "MaxWillpowerStacks";
      value: number;
      src?: string;
    }
  | {
      type: "ShadowQuant";
      value: number;
      src?: string;
    }
  | {
      type: "Projectile";
      value: number;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "MaxProjectile";
      value: number;
      src?: string;
      override?: boolean;
    }
  | {
      type: "SkillEffPct";
      value: number;
      addn?: boolean;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "AuraEffPct";
      value: number;
      addn?: boolean;
      per?: PerStackable;
      src?: string;
      target?: Target;
      unscalable?: boolean;
    }
  | {
      type: "SealedManaCompPct";
      value: number;
      addn?: boolean;
      per?: PerStackable;
      src?: string;
    }
  | {
      type: "CoreTalent";
      name:
        | "Last Stand"
        | "Dirty Tricks"
        | "Centralize"
        | "Tenacity"
        | "Hidden Mastery"
        | "Formless"
        | "Tradeoff"
        | "Unmatched Valor";
      src?: string;
    };

export type ModOfType<T> = Extract<Mod, { type: T }>;

// Compile-time check: all Mod variants must have src?: string
type _AssertAllModsHaveSrc = Mod["src"];
