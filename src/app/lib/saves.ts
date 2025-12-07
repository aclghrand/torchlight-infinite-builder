import { decodeBuildCode, encodeBuildCode } from "./build-code";
import {
  SAVE_DATA_STORAGE_KEY_PREFIX,
  SAVES_INDEX_STORAGE_KEY,
} from "./constants";
import type { SaveData } from "./save-data";
import { createEmptySaveData } from "./storage";

export interface SaveMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface SavesIndex {
  currentSaveId: string | undefined;
  saves: SaveMetadata[];
}

export const generateSaveId = (): string => crypto.randomUUID();

export const loadSavesIndex = (): SavesIndex => {
  if (typeof window === "undefined") {
    return { currentSaveId: undefined, saves: [] };
  }
  try {
    const stored = localStorage.getItem(SAVES_INDEX_STORAGE_KEY);
    if (!stored) return { currentSaveId: undefined, saves: [] };
    return JSON.parse(stored) as SavesIndex;
  } catch {
    return { currentSaveId: undefined, saves: [] };
  }
};

export const saveSavesIndex = (index: SavesIndex): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SAVES_INDEX_STORAGE_KEY, JSON.stringify(index));
  } catch (error) {
    console.error("Failed to save saves index:", error);
  }
};

export const loadSaveData = (saveId: string): SaveData | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    const buildCode = localStorage.getItem(
      SAVE_DATA_STORAGE_KEY_PREFIX + saveId,
    );
    if (!buildCode) return undefined;
    return decodeBuildCode(buildCode) ?? undefined;
  } catch {
    return undefined;
  }
};

export const saveSaveData = (saveId: string, data: SaveData): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const buildCode = encodeBuildCode(data);
    localStorage.setItem(SAVE_DATA_STORAGE_KEY_PREFIX + saveId, buildCode);
    return true;
  } catch (error) {
    console.error("Failed to save data:", error);
    return false;
  }
};

export const deleteSaveData = (saveId: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SAVE_DATA_STORAGE_KEY_PREFIX + saveId);
  } catch (error) {
    console.error("Failed to delete save data:", error);
  }
};

export const createDefaultSave = (): {
  metadata: SaveMetadata;
  data: SaveData;
} => {
  const now = Date.now();
  return {
    metadata: {
      id: generateSaveId(),
      name: "Untitled",
      createdAt: now,
      updatedAt: now,
    },
    data: createEmptySaveData(),
  };
};

export const getMostRecentSave = (
  saves: SaveMetadata[],
): SaveMetadata | undefined => {
  if (saves.length === 0) return undefined;
  return saves.reduce((most, current) =>
    current.updatedAt > most.updatedAt ? current : most,
  );
};

export const findSaveById = (
  saves: SaveMetadata[],
  id: string,
): SaveMetadata | undefined => {
  return saves.find((s) => s.id === id);
};
