import type {
  CritDmgModType,
  CritRatingModType,
  DmgModType,
} from "./constants";
import type { DmgRange } from "./core";

export type DmgType = "physical" | "cold" | "lightning" | "fire" | "erosion";

export type Mod =
  | {
      type: "DmgPct";
      value: number;
      modType: DmgModType;
      addn: boolean;
      src?: string;
    }
  | {
      type: "FlatDmgToAtks";
      value: DmgRange;
      dmgType: DmgType;
      src?: string;
    }
  | {
      type: "FlatDmgToAtksAndSpells";
      value: DmgRange;
      dmgType: DmgType;
      src?: string;
    }
  | {
      type: "FlatDmgToSpells";
      value: DmgRange;
      dmgType: DmgType;
      src?: string;
    }
  | {
      type: "CritRatingPct";
      value: number;
      modType: CritRatingModType;
      src?: string;
    }
  | {
      type: "CritDmgPct";
      value: number;
      addn: boolean;
      modType: CritDmgModType;
      src?: string;
    }
  | {
      type: "AspdPct";
      value: number;
      addn: boolean;
      src?: string;
    }
  | {
      type: "CspdPct";
      value: number;
      addn: boolean;
      src?: string;
    }
  | {
      type: "AspdAndCspdPct";
      value: number;
      addn: boolean;
      src?: string;
    }
  | {
      type: "MinionAspdAndCspdPct";
      value: number;
      addn: boolean;
      src?: string;
    }
  | {
      type: "DblDmg";
      value: number;
      src?: string;
    }
  | {
      type: "Str";
      value: number;
      src?: string;
    }
  | {
      type: "StrPct";
      value: number;
      src?: string;
    }
  | {
      type: "Dex";
      value: number;
      src?: string;
    }
  | {
      type: "DexPct";
      value: number;
      src?: string;
    }
  | {
      type: "FervorEff";
      value: number;
      src?: string;
    }
  | {
      type: "SteepStrikeChance";
      value: number;
      src?: string;
    }
  | {
      type: "SteepStrikeDmg";
      value: number;
      addn: boolean;
      src?: string;
    }
  | {
      type: "SweepSlashDmg";
      value: number;
      addn: boolean;
      src?: string;
    }
  | {
      type: "Fervor";
      value: number;
      src?: string;
    }
  | {
      type: "CritDmgPerFervor";
      value: number;
      src?: string;
    }
  | {
      type: "AddnMainHandDmgPct";
      value: number;
      src?: string;
    }
  | {
      type: "GearAspdPct";
      value: number;
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
      src?: string;
    }
  | {
      type: "GearPhysDmgPct";
      value: number;
      src?: string;
    }
  | {
      type: "AttackBlockChancePct";
      value: number;
      src?: string;
    }
  | {
      type: "SpellBlockChancePct";
      value: number;
      src?: string;
    }
  | {
      type: "MaxLifePct";
      value: number;
      src?: string;
    }
  | {
      type: "MaxEnergyShieldPct";
      value: number;
      src?: string;
    }
  | {
      type: "ArmorPct";
      value: number;
      src?: string;
    }
  | {
      type: "EvasionPct";
      value: number;
      src?: string;
    }
  | {
      type: "LifeRegainPct";
      value: number;
      src?: string;
    }
  | {
      type: "EnergyShieldRegainPct";
      value: number;
      src?: string;
    }
  | {
      type: "MultistrikeChancePct";
      value: number;
      src?: string;
    }
  | {
      type: "ConvertDmgPct";
      from: DmgType;
      to: DmgType;
      value: number;
      src?: string;
    }
  | {
      type: "AddsDmgAs";
      from: DmgType;
      to: DmgType;
      value: number;
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
