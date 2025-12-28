import { match, P } from "ts-pattern";
import type { DmgRange } from "../core";
import type { Mod } from "../mod";

const multDR = (dr: DmgRange, multiplier: number): DmgRange => ({
  min: dr.min * multiplier,
  max: dr.max * multiplier,
});

export const multValue = <T extends number | DmgRange>(
  value: T,
  multiplier: number,
  ...multipliers: number[]
): T => {
  const mult = multiplier * multipliers.reduce((a, b) => a * b, 1);
  if (typeof value === "number") {
    return (value * mult) as T;
  } else {
    return multDR(value, mult) as T;
  }
};

export type ModWithValue = Extract<Mod, { value: number | DmgRange }>;

export const multModValue = <T extends ModWithValue>(
  mod: T,
  multiplier: number,
): T => {
  const newValue = match(mod.value)
    .with(P.number, (x) => x * multiplier)
    .otherwise((x) => multDR(x, multiplier));
  return { ...mod, value: newValue };
};
