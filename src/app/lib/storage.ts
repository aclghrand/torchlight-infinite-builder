import { RawLoadout } from "@/src/tli/core";
import { STORAGE_KEY, DEBUG_MODE_STORAGE_KEY } from "./constants";
import { GearSlot } from "./types";

export const generateItemId = (): string => crypto.randomUUID();

export const loadDebugModeFromStorage = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(DEBUG_MODE_STORAGE_KEY);
    return stored === "true";
  } catch (error) {
    console.error("Failed to load debug mode from localStorage:", error);
    return false;
  }
};

export const saveDebugModeToStorage = (enabled: boolean): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEBUG_MODE_STORAGE_KEY, enabled.toString());
  } catch (error) {
    console.error("Failed to save debug mode to localStorage:", error);
  }
};

export const createEmptyLoadout = (): RawLoadout => ({
  equipmentPage: {},
  talentPage: {
    tree1: { name: "Warrior", allocatedNodes: [] },
    tree2: { name: "Warrior", allocatedNodes: [] },
    tree3: { name: "Warrior", allocatedNodes: [] },
    tree4: { name: "Warrior", allocatedNodes: [] },
  },
  skillPage: {
    skills: [],
  },
  itemsList: [],
});

export const loadFromStorage = (): RawLoadout => {
  if (typeof window === "undefined") return createEmptyLoadout();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return createEmptyLoadout();
    const parsed = JSON.parse(stored) as RawLoadout;

    // Migration: ensure itemsList exists
    if (!parsed.itemsList) {
      parsed.itemsList = [];
    }

    // Migration: ensure all items have IDs
    parsed.itemsList = parsed.itemsList.map((item) => ({
      ...item,
      id: item.id || generateItemId(),
    }));

    // Migration: ensure equipped items have IDs
    const slots: GearSlot[] = [
      "helmet", "chest", "neck", "gloves", "belt",
      "boots", "leftRing", "rightRing", "mainHand", "offHand"
    ];
    slots.forEach((slot) => {
      const gear = parsed.equipmentPage[slot];
      if (gear && !gear.id) {
        gear.id = generateItemId();
      }
    });

    return parsed;
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
    return createEmptyLoadout();
  }
};

export const saveToStorage = (loadout: RawLoadout): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loadout));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
};
