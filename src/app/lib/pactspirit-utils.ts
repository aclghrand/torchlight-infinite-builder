import { Pactspirits } from "@/src/data/pactspirit/pactspirits";
import { Destinies } from "@/src/data/destiny/destinies";
import { Pactspirit, PactspiritRingDetails } from "@/src/data/pactspirit/types";
import { Destiny } from "@/src/data/destiny/types";
import { RingSlotKey } from "./types";

export const getPactspiritByName = (name: string): Pactspirit | undefined =>
  Pactspirits.find((p) => p.name === name);

export const getDestiniesForRingSlot = (ringSlot: RingSlotKey): Destiny[] => {
  const isInner = ringSlot.startsWith("innerRing");
  return Destinies.filter((d) =>
    isInner
      ? d.type === "Micro Fate"
      : ["Medium Fate", "Kismet", "Dual Kismet"].includes(d.type),
  );
};

export const getDestinyByName = (name: string): Destiny | undefined =>
  Destinies.find((d) => d.name === name);

export const hasRanges = (affix: string): boolean => /\(\d+-\d+\)/.test(affix);

export const craftDestinyAffix = (
  affix: string,
  percentage: number,
): string => {
  return affix.replace(/\((\d+)-(\d+)\)/g, (_, minStr, maxStr) => {
    const min = parseInt(minStr, 10);
    const max = parseInt(maxStr, 10);
    const value = Math.round(min + (max - min) * (percentage / 100));
    return value.toString();
  });
};

export const formatDestinyOption = (destiny: Destiny): string =>
  `${destiny.type}: ${destiny.name}`;

export const getPactspiritLevelAffix = (
  pactspirit: Pactspirit,
  level: number,
): string => {
  const affixKey = `affix${level}` as keyof Pactspirit;
  return pactspirit[affixKey] as string;
};

export const getPactspiritRing = (
  pactspirit: Pactspirit,
  ringSlot: RingSlotKey,
): PactspiritRingDetails => {
  return pactspirit[ringSlot];
};

export const isInnerRing = (ringSlot: RingSlotKey): boolean =>
  ringSlot.startsWith("innerRing");
