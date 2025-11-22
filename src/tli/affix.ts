import { DmgModType, CritRatingModType, CritDmgModType } from "./constants";
import { DmgRange } from "./stuff";

export type Affix =
  | {
      type: "DmgPct";
      value: number;
      modType: DmgModType;
      addn: boolean;
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
      type: "GearBaseCritRating";
      value: number;
      src?: string;
    }
  | {
      type: "GearBaseAspd";
      value: number;
      src?: string;
    }
  | {
      type: "GearAspdPct";
      value: number;
      src?: string;
    }
  | {
      type: "GearBasePhysFlatDmg";
      value: number;
      src?: string;
    }
  | {
      type: "FlatGearDmg";
      value: DmgRange;
      modType: "physical" | "cold" | "lightning" | "fire" | "erosion";
      src?: string;
    }
  | {
      type: "GearPhysDmgPct";
      value: number;
      src?: string;
    }
  | {
      type: "GearPlusEleMinusPhysDmg";
      value: DmgRange;
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
