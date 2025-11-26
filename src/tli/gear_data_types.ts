export const EQUIPMENT_SLOTS = [
  "Boots",
  "Chest Armor",
  "Gloves",
  "Helmet",
  "One-Handed",
  "Shield",
  "Trinket",
  "Two-Handed",
] as const;

export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number];

export const EQUIPMENT_TYPES = [
  "Belt",
  "Boots (DEX)",
  "Boots (INT)",
  "Boots (STR)",
  "Bow",
  "Cane",
  "Chest Armor (DEX)",
  "Chest Armor (INT)",
  "Chest Armor (STR)",
  "Claw",
  "Crossbow",
  "Cudgel",
  "Dagger",
  "Fire Cannon",
  "Gloves (DEX)",
  "Gloves (INT)",
  "Gloves (STR)",
  "Helmet (DEX)",
  "Helmet (INT)",
  "Helmet (STR)",
  "Musket",
  "Necklace",
  "One-Handed Axe",
  "One-Handed Hammer",
  "One-Handed Sword",
  "Pistol",
  "Ring",
  "Rod",
  "Scepter",
  "Shield (DEX)",
  "Shield (INT)",
  "Shield (STR)",
  "Spirit Ring",
  "Tin Staff",
  "Two-Handed Axe",
  "Two-Handed Hammer",
  "Two-Handed Sword",
  "Wand",
] as const;

export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

export const AFFIX_TYPES = [
  "Base Affix",
  "Base Stats",
  "Corrosion Base",
  "Prefix",
  "Suffix",
  "Sweet Dream Affix",
  "Tower Sequence",
] as const;

export type AffixType = (typeof AFFIX_TYPES)[number];

export const CRAFTING_POOLS = [
  "",
  "Advanced",
  "Basic",
  "Intermediate",
  "Ultimate",
] as const;

export type CraftingPool = (typeof CRAFTING_POOLS)[number];

export interface BaseGearAffix {
  equipmentSlot: EquipmentSlot;
  equipmentType: EquipmentType;
  affixType: AffixType;
  craftingPool: CraftingPool;
  tier: string;
  craftableAffix: string;
}
