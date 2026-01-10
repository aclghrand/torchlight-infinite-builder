import { DEFAULT_CONFIGURATION } from "@/src/tli/core";
import {
  DEBUG_MODE_STORAGE_KEY,
  DEBUG_PANEL_HEIGHT_STORAGE_KEY,
  DEBUG_PANEL_TAB_STORAGE_KEY,
} from "./constants";
import type {
  CalculationsPage,
  ConfigurationPage,
  DivinityPage,
  HeroPage,
  PactspiritPage,
  PactspiritSlot,
  RingSlotState,
  SaveData,
  SkillPage,
} from "./save-data";

export const createEmptyHeroPage = (): HeroPage => ({
  selectedHero: undefined,
  traits: {
    level1: undefined,
    level45: undefined,
    level45b: undefined,
    level60: undefined,
    level60b: undefined,
    level75: undefined,
    level75b: undefined,
  },
  memorySlots: { slot45: undefined, slot60: undefined, slot75: undefined },
  memoryInventory: [],
});

const createEmptyRingSlotState = (): RingSlotState => ({});

export const createEmptyPactspiritSlot = (): PactspiritSlot => ({
  pactspiritName: undefined,
  level: 1,
  rings: {
    innerRing1: createEmptyRingSlotState(),
    innerRing2: createEmptyRingSlotState(),
    innerRing3: createEmptyRingSlotState(),
    innerRing4: createEmptyRingSlotState(),
    innerRing5: createEmptyRingSlotState(),
    innerRing6: createEmptyRingSlotState(),
    midRing1: createEmptyRingSlotState(),
    midRing2: createEmptyRingSlotState(),
    midRing3: createEmptyRingSlotState(),
  },
});

export const createEmptyPactspiritPage = (): PactspiritPage => ({
  slot1: createEmptyPactspiritSlot(),
  slot2: createEmptyPactspiritSlot(),
  slot3: createEmptyPactspiritSlot(),
});

export const createEmptyDivinityPage = (): DivinityPage => ({
  placedSlates: [],
  inventory: [],
});

export const createEmptyCalculationsPage = (): CalculationsPage => ({
  selectedSkillName: undefined,
});

export const createEmptyConfigurationPage = (): ConfigurationPage =>
  DEFAULT_CONFIGURATION;

export const createEmptySkillPage = (): SkillPage => ({
  activeSkills: {},
  passiveSkills: {},
});

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

export const loadDebugPanelHeightFromStorage = (
  defaultHeight: number,
): number => {
  if (typeof window === "undefined") return defaultHeight;
  try {
    const stored = localStorage.getItem(DEBUG_PANEL_HEIGHT_STORAGE_KEY);
    if (stored === null) return defaultHeight;
    const parsed = Number.parseInt(stored, 10);
    return Number.isNaN(parsed) ? defaultHeight : parsed;
  } catch (error) {
    console.error(
      "Failed to load debug panel height from localStorage:",
      error,
    );
    return defaultHeight;
  }
};

export const saveDebugPanelHeightToStorage = (height: number): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEBUG_PANEL_HEIGHT_STORAGE_KEY, height.toString());
  } catch (error) {
    console.error("Failed to save debug panel height to localStorage:", error);
  }
};

const VALID_DEBUG_TABS = ["saveData", "loadout", "unparseable", "affixes"];

export const loadDebugPanelTabFromStorage = (): string => {
  if (typeof window === "undefined") return "saveData";
  try {
    const stored = localStorage.getItem(DEBUG_PANEL_TAB_STORAGE_KEY);
    if (stored === null || !VALID_DEBUG_TABS.includes(stored))
      return "saveData";
    return stored;
  } catch (error) {
    console.error("Failed to load debug panel tab from localStorage:", error);
    return "saveData";
  }
};

export const saveDebugPanelTabToStorage = (tab: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEBUG_PANEL_TAB_STORAGE_KEY, tab);
  } catch (error) {
    console.error("Failed to save debug panel tab to localStorage:", error);
  }
};

export const createEmptySaveData = (): SaveData => ({
  equipmentPage: { equippedGear: {}, inventory: [] },
  talentPage: {
    talentTrees: {},
    inventory: { prismList: [], inverseImageList: [] },
  },
  skillPage: createEmptySkillPage(),
  heroPage: createEmptyHeroPage(),
  pactspiritPage: createEmptyPactspiritPage(),
  divinityPage: createEmptyDivinityPage(),
  configurationPage: createEmptyConfigurationPage(),
  calculationsPage: createEmptyCalculationsPage(),
});
