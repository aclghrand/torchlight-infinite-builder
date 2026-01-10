import type { HeroTraits } from "./hero-traits";

export interface BaseHeroTrait {
  hero: string;
  name: string;
  level: number;
  affix: string;
}

export type HeroTrait = (typeof HeroTraits)[number];
export type HeroTraitName = (typeof HeroTraits)[number]["name"];
export type HeroName = (typeof HeroTraits)[number]["hero"];

export const bing2: HeroName = "Escapist Bing: Creative Genius (#2)";
