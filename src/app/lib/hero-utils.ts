import { HeroTraits } from "@/src/data/hero_trait/hero_traits";
import { HeroMemories } from "@/src/data/hero_memory/hero_memories";
import type { HeroTrait } from "@/src/data/hero_trait/types";
import type {
  HeroMemoryType,
  RawHeroMemory,
  HeroMemorySlot,
} from "@/src/tli/core";

export const normalizeHeroName = (hero: string): string => {
  return hero.replace(/\n\s*/g, " ").trim();
};

export const getUniqueHeroes = (): string[] => {
  const heroSet = new Set<string>();
  HeroTraits.forEach((trait) => {
    heroSet.add(normalizeHeroName(trait.hero));
  });
  return Array.from(heroSet).sort();
};

export const getTraitsForHero = (hero: string): HeroTrait[] => {
  const normalizedHero = normalizeHeroName(hero);
  return HeroTraits.filter(
    (trait) => normalizeHeroName(trait.hero) === normalizedHero,
  );
};

export const getTraitsForHeroAtLevel = (
  hero: string,
  level: number,
): HeroTrait[] => {
  return getTraitsForHero(hero).filter((trait) => trait.level === level);
};

export const getBaseTraitForHero = (hero: string): HeroTrait | undefined => {
  const traits = getTraitsForHeroAtLevel(hero, 1);
  return traits[0];
};

export const MEMORY_SLOT_TYPE_MAP: Record<HeroMemorySlot, HeroMemoryType> = {
  slot45: "Memory of Origin",
  slot60: "Memory of Discipline",
  slot75: "Memory of Progress",
};

export const LEVEL_TO_SLOT_MAP: Record<45 | 60 | 75, HeroMemorySlot> = {
  45: "slot45",
  60: "slot60",
  75: "slot75",
};

export const getBaseStatsForMemoryType = (
  memoryType: HeroMemoryType,
): string[] => {
  return HeroMemories.filter(
    (m) => m.item === memoryType && m.type === "Base Stats",
  ).map((m) => m.affix);
};

export const getFixedAffixesForMemoryType = (
  memoryType: HeroMemoryType,
): string[] => {
  return HeroMemories.filter(
    (m) => m.item === memoryType && m.type === "Fixed Affix",
  ).map((m) => m.affix);
};

export const getRandomAffixesForMemoryType = (
  memoryType: HeroMemoryType,
): string[] => {
  return HeroMemories.filter(
    (m) => m.item === memoryType && m.type === "Random Affix",
  ).map((m) => m.affix);
};

export const craftHeroMemoryAffix = (
  effectText: string,
  quality: number,
): string => {
  // Handle both hyphen and en-dash
  const rangePattern = /\((-?\d+)[–-](-?\d+)\)/g;

  return effectText.replace(rangePattern, (_match, minStr, maxStr) => {
    const min = parseInt(minStr, 10);
    const max = parseInt(maxStr, 10);
    const value = Math.round(min + (max - min) * (quality / 100));
    return value.toString();
  });
};

export const formatCraftedMemoryAffixes = (memory: RawHeroMemory): string[] => {
  const lines: string[] = [];

  lines.push(memory.baseStat);

  memory.fixedAffixes.forEach((affix) => {
    lines.push(craftHeroMemoryAffix(affix.effect, affix.quality));
  });

  memory.randomAffixes.forEach((affix) => {
    lines.push(craftHeroMemoryAffix(affix.effect, affix.quality));
  });

  return lines;
};

export const canEquipMemoryInSlot = (
  memory: RawHeroMemory,
  slot: HeroMemorySlot,
): boolean => {
  return memory.memoryType === MEMORY_SLOT_TYPE_MAP[slot];
};

export const getCompatibleMemoriesForSlot = (
  memories: RawHeroMemory[],
  slot: HeroMemorySlot,
): RawHeroMemory[] => {
  return memories.filter((memory) => canEquipMemoryInSlot(memory, slot));
};
