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

export const ResTypes = [
  "cold",
  "lightning",
  "fire",
  "erosion",
  "elemental",
] as const;

export type ResType = (typeof ResTypes)[number];

export const InfiltrationTypes = ["cold", "lightning", "fire"] as const;

export type InfiltrationType = (typeof InfiltrationTypes)[number];

export const MinionDmgModTypes = [
  "physical",
  "cold",
  "lightning",
  "fire",
  "erosion",
] as const;

export type MinionDmgModType = (typeof MinionDmgModTypes)[number];

export const SkillAreaModTypes = ["global", "curse"];

export type SkillAreaModType = (typeof SkillAreaModTypes)[number];

export const AspdModTypes = ["melee"] as const;

export type AspdModType = (typeof AspdModTypes)[number];

export const DoubleDmgModTypes = ["attack"] as const;

export type DoubleDmgModType = (typeof DoubleDmgModTypes)[number];

export const SkillLevelTypes = [
  "main",
  "support",
  "active",
  "attack",
  "persistent",
  "erosion",
  "spell",
  "lightning",
  "all",
] as const;

export type SkillLevelType = (typeof SkillLevelTypes)[number];

export const HeroTraitLevelTypes = ["origin", "discipline", "progress"];

export type HeroTraitLevelType = (typeof HeroTraitLevelTypes)[number];

export type Stackable =
  | "willpower"
  | "main_stat"
  | "stat"
  | "highest_stat"
  | "str"
  | "dex"
  | "int"
  | "frostbite_rating"
  | "projectile"
  | "jump"
  | "skill_use"
  | "skill_charges_on_use"
  | "cruelty_buff"
  | "fervor"
  | "movement_speed_bonus_pct"
  | "max_mana"
  | "mana_consumed_recently"
  | "mercury_pt"
  | "unsealed_mana_pct"
  | "unsealed_life_pct"
  | "sealed_mana_pct"
  | "sealed_life_pct"
  | "focus_blessing"
  | "agility_blessing"
  | "tenacity_blessing"
  | "desecration"
  | "torment"
  | "num_enemies_affected_by_warcry"
  | "level"
  | "max_spell_burst"
  | "spell_burst_charge_speed_bonus_pct"
  | "has_hit_enemy_with_elemental_dmg_recently"
  | "num_spell_skills_used_recently"
  | "num_unique_weapon_types_equipped"
  // max channel stacks beyond initial skill channel stacks
  | "additional_max_channel_stack"
  | "channel_stack"
  // skill-specific
  | "mind_control_link"
  | "unused_mind_control_link"
  | "arcane_circle_stack"
  // pactspirit-specific
  | "repentance";

export type StatType = "str" | "dex" | "int";

export type StatModType = "str" | "dex" | "int" | "all";

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
  // whether or not each stack causes the multiplier to compound
  // this only applies to percentage-based mods, like DmgPct
  // i.e. newvalue=(1+value)^(count)-1 instead of newvalue=value*count
  // example: if mod value is 10%, and there's 2 stacks, the final mod value should be 21%
  multiplicative?: boolean; // default false
}

export type Condition =
  | "holding_shield"
  | "is_dual_wielding"
  | "has_one_handed_weapon"
  | "enemy_frostbitten"
  | "realm_of_mercury"
  | "has_focus_blessing"
  | "has_agility_blessing"
  | "has_tenacity_blessing"
  | "enemy_has_desecration"
  | "has_full_mana"
  | "enemy_paralyzed"
  | "target_enemy_is_elite"
  | "target_enemy_is_nearby"
  | "target_enemy_is_in_proximity"
  | "has_blocked_recently"
  | "has_elites_nearby"
  | "enemy_has_ailment"
  | "has_hasten"
  | "has_crit_recently"
  | "has_blur"
  | "blur_ended_recently"
  | "channeling"
  | "sages_insight_fire"
  | "sages_insight_cold"
  | "sages_insight_lightning"
  | "sages_insight_erosion"
  | "at_max_channeled_stacks"
  | "enemy_at_max_affliction"
  | "enemy_is_cursed"
  | "have_both_sealed_mana_and_life"
  | "equipped_in_left_ring_slot"
  | "equipped_in_right_ring_slot"
  | "enemy_has_desecration_and_cc"
  | "enemy_has_cold_infiltration"
  | "enemy_has_lightning_infiltration"
  | "enemy_has_fire_infiltration"
  | "target_enemy_frozen_recently"
  | "enemy_numbed"
  | "has_used_mobility_skill_recently"
  | "has_moved_recently"
  | "has_cast_curse_recently"
  // pactspirits
  | "has_portrait_of_a_fallen_saintess_pactspirit"
  | "has_squidnova";

export type ConditionThresholdTarget =
  | "enemy_numbed_stacks"
  | "num_enemies_nearby"
  | "num_enemies_affected_by_warcry";

export type Comparator = "lt" | "lte" | "eq" | "gt" | "gte";

// e.g. "greater than 1 nearby enemy" would be {target: "num_enemies_nearby", comparator: "gt", value: 1}
//   and would be satisfied if configuration's `numEnemiesNearby` > 1
export interface ConditionThreshold {
  target: ConditionThresholdTarget;
  comparator: Comparator;
  value: number;
}

// Common fields automatically added to all mod types
interface ModBase {
  per?: PerStackable;
  cond?: Condition;
  condThreshold?: ConditionThreshold;
  src?: string;
}

// Unique fields for each mod type (excluding type, per, cond, src)
interface ModDefinitions {
  DmgPct: {
    value: number;
    dmgModType: DmgModType;
    addn: boolean;
    isEnemyDebuff?: boolean;
  };
  AddnMaxDmgPct: { value: number; addn: true; dmgType?: DmgChunkType };
  AddnMinDmgPct: { value: number; addn: true; dmgType?: DmgChunkType };
  ElementalSpellDmgPct: { value: number; addn: boolean };
  FlatDmgToAtks: { value: DmgRange; dmgType: DmgChunkType };
  FlatDmgToSpells: { value: DmgRange; dmgType: DmgChunkType };
  FlatCritRating: { value: number; modType: CritRatingModType };
  CritRatingPct: { value: number; modType: CritRatingModType };
  CritDmgPct: {
    value: number;
    addn: boolean;
    modType: CritDmgModType;
    isEnemyDebuff?: boolean;
  };
  AspdPct: { value: number; addn: boolean; aspdModType?: AspdModType };
  CspdPct: { value: number; addn: boolean };
  // minions
  MinionDmgPct: {
    value: number;
    addn?: boolean;
    minionDmgModType?: MinionDmgModType;
  };
  AddnMaxMinionDmgPct: { value: number };
  MinionAspdPct: { value: number; addn: boolean };
  MinionCspdPct: { value: number; addn: boolean };
  MinionCritRatingPct: { value: number; addn?: boolean };
  MinionCritDmgPct: { value: number; addn?: boolean };
  MinionResPenPct: { value: number; penType: ResPenType };
  MinionArmorPenPct: { value: number };
  // end minions
  ProjectileSpeedPct: { value: number; addn?: boolean };
  ProjectileSizePct: { value: number };
  DoubleDmgChancePct: { value: number; doubleDmgModType?: DoubleDmgModType };
  Stat: { value: number; statModType: StatModType };
  StatPct: { value: number; statModType: StatModType };
  HaveFervor: object;
  FixedFervorPts: { value: number };
  FervorEffPct: { value: number };
  FrailEffPct: { value: number };
  SteepStrikeChancePct: { value: number };
  SteepStrikeDmg: { value: number; addn: boolean };
  SweepSlashDmg: { value: number; addn: boolean };
  AddnMainHandDmgPct: { value: number };
  GearAspdPct: { value: number };
  GearCritRatingPct: { value: number };
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
  // defenses
  AttackBlockChancePct: { value: number };
  SpellBlockChancePct: { value: number };
  BlockRatioPct: { value: number };
  GearEnergyShield: { value: number };
  GearEnergyShieldPct: { value: number };
  MaxEnergyShieldPct: { value: number; addn: boolean };
  MaxEnergyShield: { value: number };
  GearArmor: { value: number };
  GearArmorPct: { value: number };
  Armor: { value: number };
  ArmorPct: { value: number; addn: boolean };
  GearEvasion: { value: number };
  GearEvasionPct: { value: number };
  Evasion: { value: number };
  EvasionPct: { value: number; addn: boolean };
  DefensePct: { value: number };
  ResistancePct: { value: number; resType: ResType };
  MaxResistancePct: { value: number; resType: ResType };
  LifeRegainPct: { value: number };
  EnergyShieldRegainPct: { value: number };
  EnergyShieldChargeSpeedPct: { value: number };
  RestoreLifePct: { value: number; interval: number };
  DmgTakenPct: { value: number; addn?: boolean };
  // end defenses
  Reap: { duration: number; cooldown: number };
  ReapDurationPct: { value: number };
  ReapCdrPct: { value: number; addn?: boolean };
  MultistrikeChancePct: { value: number };
  MultistrikeIncDmgPct: { value: number };
  ConvertDmgPct: { from: DmgChunkType; to: DmgChunkType; value: number };
  AddsDmgAsPct: { from: DmgChunkType; to: DmgChunkType; value: number };
  MaxWillpowerStacks: { value: number };
  ShadowQuant: { value: number };
  ShadowDmgPct: { value: number; addn: boolean };
  LuckyDmg: object;
  Jump: { value: number };
  BaseProjectileQuant: { value: number };
  Projectile: { value: number };
  MaxProjectile: { value: number; override?: boolean };
  MaxSpellBurst: { value: number };
  SpellBurstChargeSpeedPct: { value: number; addn?: boolean };
  SpellBurstAdditionalDmgPct: { value: number; addn: true };
  PlaySafe: { value: number };
  SkillAreaPct: {
    value: number;
    skillAreaModType: SkillAreaModType;
    addn?: boolean;
  };
  SkillEffDurationPct: { value: number };
  SkillEffPct: { value: number; addn?: boolean };
  AuraEffPct: { value: number; addn?: boolean; unscalable?: boolean };
  FocusBuffEffPct: { value: number; addn?: boolean };
  SpiritMagusOriginEffPct: { value: number; addn?: boolean };
  CurseEffPct: { value: number; addn?: boolean };
  CurseDurationPct: { value: number };
  SealedManaCompPct: { value: number; addn?: boolean };
  ResPenPct: { value: number; penType: ResPenType };
  ArmorPenPct: { value: number };
  ManaBeforeLifePct: { value: number };
  HasHasten: object;
  MovementSpeedPct: { value: number; addn?: boolean };
  MobilitySkillCdrPct: { value: number; addn?: boolean };
  SpellDmgBonusAppliesToAtkDmg: object;
  MaxLife: { value: number };
  MaxLifePct: { value: number; addn: boolean };
  MaxMana: { value: number };
  MaxManaPct: { value: number; addn: boolean };
  ManaRegenPerSecPct: { value: number };
  MercuryBaptismDmgPct: { value: number };
  MaxMercuryPtsPct: { value: number };
  MaxFocusBlessing: { value: number };
  MaxAgilityBlessing: { value: number };
  MaxTenacityBlessing: { value: number };
  FocusBlessingDurationPct: { value: number };
  AgilityBlessingDurationPct: { value: number };
  TenacityBlessingDurationPct: { value: number };
  GeneratesFocusBlessing: object;
  GeneratesAgilityBlessing: object;
  GeneratesTenacityBlessing: object;
  GeneratesFortitude: object;
  MaxChannel: { value: number };
  GeneratesBarrier: object;
  GeneratesTorment: object;
  GeneratesBlur: { value: number };
  MaxRepentance: { value: number };
  GeneratesRepentance: { value: number };
  SkillLevel: { value: number; skillLevelType: SkillLevelType };
  HeroTraitLevel: { value: number; heroTraitLevelType?: HeroTraitLevelType };
  GearBasePhysDmg: { value: number };
  GearBaseCritRating: { value: number };
  GearBaseAttackSpeed: { value: number };
  SkillCost: { value: number };
  SkillCostPct: { value: number; addn?: boolean };
  GeneratesAttackAggression: object;
  AttackAggressionEffPct: { value: number };
  GeneratesSpellAggression: object;
  SpellAggressionEffPct: { value: number };
  // infiltrations
  InflictsInfiltration: { infiltrationType: InfiltrationType };
  InfiltrationEffPct: {
    value: number;
    infiltrationType: InfiltrationType;
    addn?: boolean;
  };
  // ailments
  InflictWiltPct: { value: number; isEnemyDebuff?: boolean };
  BaseWiltFlatDmg: { value: number };
  InflictFrostbitePct: { value: number; isEnemyDebugg?: boolean };
  InflictParalysisPct: { value: number };
  FreezeDurationPct: { value: number };
  InflictFrail: object;
  InflictNumbed: object;
  NumbedEffPct: { value: number };
  NumbedChancePct: { value: number };
  InflictTrauma: object;
  TraumaDmgPct: { value: number };
  // non-ailment debuffs
  InflictsMark: object;
  MarkEffPct: { value: number };
  // skill-specific
  MindControlMaxLink: { value: number };
  InitialMaxChannel: { value: number };
  AfflictionInflictedPerSec: { value: number };
  AfflictionEffectPct: { value: number; addn?: boolean };
  CannotInflictWilt: object;
  IgniteDurationPct: { value: number; addn?: boolean };
  ChainLightningWebOfLightning: object;
  ChainLightningMerge: { shotgunFalloffCoefficient: number };
  // enemy mods
  EnemyRes: { value: number; resType: ResType };
  // core talent specific
  ReapPurificationPct: { value: number };
  SpellRipple: { chancePct: number; pctOfHitDmg: number };
  JoinedForceDisableOffhand: object;
  JoinedForceAddOffhandToMainhandPct: { value: number };
  Conductive: { value: number };
  TradeoffDexGteStrAspdPct: { value: number };
  TradeoffStrGteDexDmgPct: { value: number };
  // hero-specific mods
  Blasphemer: object;
  // bing2
  WhimsyEssenceRecoverySpeedPct: { value: number };
  WhimsySignalEffPct: { value: number };
  RestoreWhimsyEssenceOnSpellBurst: { value: number };
  // pactspirit stuff
  SquidnovaEffPct: { value: number };
  GeneratesSquidnova: object;
  // legendary gear
  DisableMainStatDmg: object;
}

// Generate the Mod union type from ModDefinitions
export type Mod = {
  [K in keyof ModDefinitions]: { type: K } & ModDefinitions[K] & ModBase;
}[keyof ModDefinitions];

export type ModT<T extends keyof ModDefinitions> = Extract<Mod, { type: T }>;
