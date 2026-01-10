import * as R from "remeda";
import { match } from "ts-pattern";
import type { Affix, Configuration, DmgRange, Loadout } from "../core";
import type { ConditionThreshold, Mod, ModT, Stackable } from "../mod";
import { getAllAffixes } from "./affix-collectors";
import { type ModWithValue, multValue } from "./util";

export const findMod = <T extends Mod["type"]>(
  mods: Mod[],
  type: T,
): ModT<T> | undefined => {
  return mods.find((a) => a.type === type) as ModT<T> | undefined;
};

export const modExists = <T extends Mod["type"]>(
  mods: Mod[],
  type: T,
): boolean => {
  return findMod(mods, type) !== undefined;
};

export const filterMods = <T extends Mod["type"]>(
  mods: Mod[],
  type: T,
): ModT<T>[] => {
  return mods.filter((a) => a.type === type) as ModT<T>[];
};

export const sumByValue = (mods: Extract<Mod, { value: number }>[]): number => {
  return R.sumBy(mods, (m) => m.value);
};

export const calculateInc = (bonuses: number[]): number => {
  return R.pipe(bonuses, R.sum()) / 100;
};

export const calculateAddn = (bonuses: number[]): number => {
  return R.pipe(
    bonuses,
    R.reduce((b1, b2) => b1 * (1 + b2 / 100), 1),
  );
};

type ModTypeWithNumericValue = Extract<Mod, { value: number }>["type"];

// Calculates (1 + inc) * addn multiplier
// Overload 1: Filter mods by type first, then calculate
export function calcEffMult<T extends ModTypeWithNumericValue>(
  mods: Mod[],
  modType: T,
): number;
// Overload 2: Calculate directly from array of {value, addn?}
export function calcEffMult<T extends { value: number; addn?: boolean }>(
  mods: T[],
): number;
// Implementation
export function calcEffMult(mods: unknown[], modType?: Mod["type"]): number {
  const filtered =
    modType !== undefined ? filterMods(mods as Mod[], modType) : mods;
  const typed = filtered as { value: number; addn?: boolean }[];
  const incMods = typed.filter((m) => m.addn === undefined || m.addn === false);
  const addnMods = typed.filter((m) => m.addn === true);
  const inc = calculateInc(incMods.map((m) => m.value));
  const addn = calculateAddn(addnMods.map((m) => m.value));
  return (1 + inc) * addn;
}

export const collectModsFromAffixes = (affixes: Affix[]): Mod[] => {
  return affixes.flatMap((a) => a.affixLines.flatMap((l) => l.mods ?? []));
};

export const collectMods = (loadout: Loadout): Mod[] => {
  return collectModsFromAffixes(getAllAffixes(loadout));
};

export const condThresholdSatisfied = (
  actualValue: number,
  condThreshold: ConditionThreshold,
): boolean => {
  const { value: condValue, comparator } = condThreshold;
  return match(comparator)
    .with("lt", () => actualValue < condValue)
    .with("lte", () => actualValue <= condValue)
    .with("eq", () => actualValue === condValue)
    .with("gt", () => actualValue > condValue)
    .with("gte", () => actualValue >= condValue)
    .exhaustive();
};

export const filterModsByCondThreshold = (
  mods: Mod[],
  config: Configuration,
): Mod[] => {
  return mods.filter((m) => {
    if (m.condThreshold === undefined) return true;
    const condThreshold = m.condThreshold;
    return match(condThreshold.target)
      .with("num_enemies_nearby", () =>
        condThresholdSatisfied(config.numEnemiesNearby, condThreshold),
      )
      .with("num_enemies_affected_by_warcry", () =>
        condThresholdSatisfied(
          config.numEnemiesAffectedByWarcry,
          condThreshold,
        ),
      )
      .with("enemy_numbed_stacks", () =>
        condThresholdSatisfied(config.enemyNumbedStacks ?? 10, condThreshold),
      )
      .exhaustive();
  });
};

export const hasValue = (mod: Mod): mod is ModWithValue => "value" in mod;

// TODO: latent bug - mods with BOTH `cond` AND `per` would be handled incorrectly:
// - filterModsByFrostbittenCond adds them un-normalized
// - normalizeStackables adds them normalized (ignoring the condition)
// Result: mod appears twice, or included when condition isn't met.
// Currently no mods have both properties, but this should be fixed if any are added.
export const normalizeStackables = (
  prenormalizedMods: Mod[],
  stackable: Stackable,
  stacks: number,
): Mod[] => {
  return prenormalizedMods
    .filter(
      (mod) =>
        "per" in mod &&
        mod.per !== undefined &&
        mod.per.stackable === stackable,
    )
    .map((mod) => normalizeStackable(mod, stackable, stacks))
    .filter((mod) => mod !== undefined);
};

export const normalizeStackable = <T extends Mod>(
  mod: T,
  stackable: Stackable,
  stacks: number,
): T | undefined => {
  if (
    !("per" in mod) ||
    mod.per === undefined ||
    mod.per.stackable !== stackable
  ) {
    return undefined;
  }

  if (!hasValue(mod)) {
    return undefined;
  }

  const div = mod.per.amt || 1;
  const stackCount = Math.min(stacks / div, mod.per.limit ?? Infinity);

  let newModValue: number | DmgRange;
  if (mod.per.multiplicative === true && typeof mod.value === "number") {
    newModValue = ((1 + mod.value / 100) ** stackCount - 1) * 100;
  } else {
    newModValue = multValue(mod.value, stackCount);
  }

  if (typeof newModValue === "number" && mod.per.valueLimit !== undefined) {
    return { ...mod, value: Math.min(newModValue, mod.per.valueLimit) } as T;
  } else {
    return { ...mod, value: newModValue } as T;
  }
};

// returns mods that don't need normalization
// excludes mods with `per`
export const filterOutPerMods = (mods: Mod[]): Mod[] => {
  return mods.filter((m) => !("per" in m && m.per !== undefined));
};

// Normalize a single stackable and push to target array
// Skips if value is undefined
export const pushNormalizedStackable = (
  targetMods: Mod[],
  prenormMods: Mod[],
  stackable: Stackable,
  value: number | undefined,
): void => {
  if (value !== undefined) {
    targetMods.push(...normalizeStackables(prenormMods, stackable, value));
  }
};
