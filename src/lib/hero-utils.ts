import { HeroMemories } from "@/src/data/hero-memory/hero-memories";
import { HeroTraits } from "@/src/data/hero-trait/hero-traits";
import type { BaseHeroTrait } from "@/src/data/hero-trait/types";
import type { HeroMemory as LoadoutHeroMemory } from "@/src/tli/core";
import type { HeroMemory, HeroMemorySlot, HeroMemoryType } from "./save-data";

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

export const getTraitsForHero = (hero: string): BaseHeroTrait[] => {
  const normalizedHero = normalizeHeroName(hero);
  return HeroTraits.filter(
    (trait) => normalizeHeroName(trait.hero) === normalizedHero,
  );
};

export const getTraitsForHeroAtLevel = (
  hero: string,
  level: number,
): BaseHeroTrait[] => {
  return getTraitsForHero(hero).filter((trait) => trait.level === level);
};

export const getBaseTraitForHero = (
  hero: string,
): BaseHeroTrait | undefined => {
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

export const formatCraftedMemoryAffixes = (memory: HeroMemory): string[] => {
  return [memory.baseStat, ...memory.fixedAffixes, ...memory.randomAffixes];
};

export const canEquipMemoryInSlot = (
  memory: HeroMemory,
  slot: HeroMemorySlot,
): boolean => {
  return memory.memoryType === MEMORY_SLOT_TYPE_MAP[slot];
};

export const getCompatibleMemoriesForSlot = (
  memories: HeroMemory[],
  slot: HeroMemorySlot,
): HeroMemory[] => {
  return memories.filter((memory) => canEquipMemoryInSlot(memory, slot));
};

export const getCompatibleLoadoutMemoriesForSlot = (
  memories: LoadoutHeroMemory[],
  slot: HeroMemorySlot,
): LoadoutHeroMemory[] => {
  const requiredType = MEMORY_SLOT_TYPE_MAP[slot];
  return memories.filter((memory) => memory.memoryType === requiredType);
};

// Bing2 (Creative Genius) has dual traits at each level threshold
export const BING2_HERO = "Escapist Bing: Creative Genius (#2)";

export const BING2_TRAIT_CONFIG = {
  level45: {
    a: ["Inspiration Overflow"],
    b: ["Super Sonic Protocol", "Over-Shield Module"],
  },
  level60: {
    a: ["Mind Domain", "Trouble Maker"],
    b: [
      "Law of Ingenuity",
      "Ingenious Chaos Principle",
      "Auto-Ingenuity Program",
    ],
  },
  level75: {
    a: ["Brainstorm", "Flash of Brilliance"],
    b: [
      "Multi-Coupling Equation",
      "Hyper-Resonance Hypothesis",
      "Contingency Inspiration Delivery",
    ],
  },
} as const;

type Bing2TraitLevel = keyof typeof BING2_TRAIT_CONFIG;

export const isBing2Hero = (hero: string): boolean =>
  normalizeHeroName(hero) === normalizeHeroName(BING2_HERO);

export const getBing2TraitsForLevelAndGroup = (
  hero: string,
  level: 45 | 60 | 75,
  group: "a" | "b",
): BaseHeroTrait[] => {
  if (!isBing2Hero(hero)) {
    return group === "a" ? getTraitsForHeroAtLevel(hero, level) : [];
  }

  const levelKey = `level${level}` as Bing2TraitLevel;
  const config = BING2_TRAIT_CONFIG[levelKey];
  const traitNames: readonly string[] = config[group];

  return getTraitsForHero(hero).filter(
    (trait) => trait.level === level && traitNames.includes(trait.name),
  );
};
