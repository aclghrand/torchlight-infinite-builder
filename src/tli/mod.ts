import type { CoreTalentName } from "../data/core_talent";
import type {
  CritDmgModType,
  CritRatingModType,
  DmgModType,
} from "./constants";
import type { DmgRange } from "./core";

export const DmgChunkTypes = [
  "physical",
  "cold",
  "lightning",
  "fire",
  "erosion",
] as const;

export type DmgChunkType = (typeof DmgChunkTypes)[number];

export const ResPenTypes = [
  "cold",
  "lightning",
  "fire",
  "erosion",
  "elemental",
  "all",
] as const;

export type ResPenType = (typeof ResPenTypes)[number];

export type Stackable =
  | "willpower"
  | "main_stat"
  | "frostbite_rating"
  | "projectile"
  | "skill_use"
  | "skill_charges_on_use"
  | "cruelty_buff"
  | "fervor"
  | "max_mana"
  | "mana_consumed_recently"
  | "mercury_pt"
  | "unsealed_mana_whole_pct";

export type StatType = "str" | "dex" | "int";

// mod value is multiplied by number of stackable divided by amt
// e.g. per 35 frostbite with 105 frostbite means x3
export interface PerStackable {
  stackable: Stackable;
  // number of max stacks
  limit?: number; // default infinity
  // max limit of mod's value
  valueLimit?: number; // default infinite
  // how much to divide the stackable number by
  amt?: number; // default 1
}

export type Condition = "enemy_frostbitten" | "realm_of_mercury";

// Common fields automatically added to all mod types
interface ModBase {
  per?: PerStackable;
  cond?: Condition;
  src?: string;
}

// Unique fields for each mod type (excluding type, per, cond, src)
interface ModDefinitions {
  DmgPct: { value: number; modType: DmgModType; addn: boolean };
  FlatDmgToAtks: { value: DmgRange; dmgType: DmgChunkType };
  FlatDmgToSpells: { value: DmgRange; dmgType: DmgChunkType };
  CritRatingPct: { value: number; modType: CritRatingModType };
  CritDmgPct: { value: number; addn: boolean; modType: CritDmgModType };
  AspdPct: { value: number; addn: boolean };
  CspdPct: { value: number; addn: boolean };
  AspdAndCspdPct: { value: number; addn: boolean };
  MinionAspdAndCspdPct: { value: number; addn: boolean };
  DblDmg: { value: number };
  DoubleDmgChancePct: { value: number };
  Stat: { value: number; statType: StatType };
  StatPct: { value: number; statType: StatType };
  FervorEff: { value: number };
  SteepStrikeChance: { value: number };
  SteepStrikeDmg: { value: number; addn: boolean };
  SweepSlashDmg: { value: number; addn: boolean };
  Fervor: { value: number };
  AddnMainHandDmgPct: { value: number };
  GearAspdPct: { value: number };
  FlatGearDmg: {
    value: DmgRange;
    modType:
      | "physical"
      | "cold"
      | "lightning"
      | "fire"
      | "erosion"
      | "elemental";
  };
  GearPhysDmgPct: { value: number };
  AttackBlockChancePct: { value: number };
  SpellBlockChancePct: { value: number };
  MaxLifePct: { value: number };
  MaxEnergyShieldPct: { value: number };
  ArmorPct: { value: number };
  EvasionPct: { value: number };
  LifeRegainPct: { value: number };
  EnergyShieldRegainPct: { value: number };
  MultistrikeChancePct: { value: number };
  ConvertDmgPct: { from: DmgChunkType; to: DmgChunkType; value: number };
  AddsDmgAs: { from: DmgChunkType; to: DmgChunkType; value: number };
  MaxWillpowerStacks: { value: number };
  ShadowQuant: { value: number };
  ShadowDmgPct: { value: number; addn: boolean };
  Projectile: { value: number };
  MaxProjectile: { value: number; override?: boolean };
  SkillEffPct: { value: number; addn?: boolean };
  AuraEffPct: { value: number; addn?: boolean; unscalable?: boolean };
  SealedManaCompPct: { value: number; addn?: boolean };
  ResPenPct: { value: number; penType: ResPenType };
  ArmorPenPct: { value: number };
  ManaBeforeLife: { value: number };
  SpellDmgBonusAppliesToAtkDmg: object;
  MaxMana: { value: number };
  MaxManaPct: { value: number; addn: boolean };
  MercuryBaptism: { value: number };
  MaxMercuryPtsPct: { value: number };
  CoreTalent: { name: CoreTalentName };
}

// Generate the Mod union type from ModDefinitions
export type Mod = {
  [K in keyof ModDefinitions]: { type: K } & ModDefinitions[K] & ModBase;
}[keyof ModDefinitions];

export type ModOfType<T extends keyof ModDefinitions> = Extract<
  Mod,
  { type: T }
>;
