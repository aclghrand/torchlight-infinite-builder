import * as R from "remeda";
import { match } from "ts-pattern";
import { CoreTalentMods } from "@/src/data/core_talent";
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

// Calculates (1 + inc) * addn multiplier from mods with value and addn properties
export const calculateEffMultiplier = <
  T extends { value: number; addn?: boolean },
>(
  mods: T[],
): number => {
  const incMods = mods.filter((m) => m.addn === undefined || m.addn === false);
  const addnMods = mods.filter((m) => m.addn === true);
  const inc = calculateInc(incMods.map((m) => m.value));
  const addn = calculateAddn(addnMods.map((m) => m.value));
  return (1 + inc) * addn;
};

export const collectModsFromAffixes = (affixes: Affix[]): Mod[] => {
  return affixes.flatMap((a) => a.affixLines.flatMap((l) => l.mods ?? []));
};

export const collectMods = (loadout: Loadout): Mod[] => {
  return collectModsFromAffixes(getAllAffixes(loadout));
};

export const resolveCoreTalentMods = (mods: Mod[]): Mod[] => {
  const coreTalentNamesAndSrc = R.unique(
    filterMods(mods, "CoreTalent").map((m) => ({ name: m.name, src: m.src })),
  );
  const newMods: Mod[] = coreTalentNamesAndSrc.flatMap(({ name, src }) => {
    const affix = CoreTalentMods[name];
    const coreMods = affix.affixLines.flatMap(
      (affixLine) => affixLine.mods ?? [],
    );
    const modsWithSrc = coreMods.map((m) => ({
      ...m,
      src: `${src}#CoreTalent: ${name}`,
    }));
    return modsWithSrc;
  });
  return [...mods.filter((m) => m.type !== "CoreTalent"), ...newMods];
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
    return {
      ...mod,
      value: Math.min(newModValue, mod.per.valueLimit),
    } as T;
  } else {
    return {
      ...mod,
      value: newModValue,
    } as T;
  }
};

// returns mods that don't need normalization
// excludes mods with `per` or that need replacement (like CoreTalent mods)
export const filterOutPerMods = (mods: Mod[]): Mod[] => {
  const staticMods = mods.filter((m) => {
    const hasPer = "per" in m && m.per !== undefined;
    const isCoreTalent = m.type === "CoreTalent";
    return !(hasPer || isCoreTalent);
  });
  return staticMods;
};
