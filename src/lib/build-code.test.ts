import { describe, expect, it, vi } from "vitest";
import { decodeBuildCode, encodeBuildCode } from "./build-code";
import type { SaveData } from "./save-data";
import {
  createEmptyCalculationsPage,
  createEmptyConfigurationPage,
  createEmptyDivinityPage,
  createEmptyHeroPage,
  createEmptyPactspiritPage,
  createEmptySaveData,
  createEmptySkillPage,
} from "./storage";

describe("build-code", () => {
  it("should encode and decode an empty loadout", () => {
    const loadout = createEmptySaveData();
    const code = encodeBuildCode(loadout);
    const decoded = decodeBuildCode(code);

    expect(decoded).toEqual(loadout);
  });

  it("should encode and decode a loadout with equipment", () => {
    const loadout: SaveData = {
      equipmentPage: {
        equippedGear: {
          helmet: {
            id: "test-helmet-1",
            equipmentType: "Helmet (STR)",
            prefixes: ["+10% fire damage"],
            suffixes: ["+5% attack speed"],
          },
          mainHand: {
            id: "test-sword-1",
            equipmentType: "One-Handed Sword",
            prefixes: ["+100 physical damage"],
          },
        },
        inventory: [],
      },
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
    };

    const code = encodeBuildCode(loadout);
    const decoded = decodeBuildCode(code);

    expect(decoded).toEqual(loadout);
  });

  it("should encode and decode a loadout with talents", () => {
    const loadout: SaveData = {
      equipmentPage: { equippedGear: {}, inventory: [] },
      talentPage: {
        talentTrees: {
          tree1: {
            name: "Goddess_of_Might",
            allocatedNodes: [
              { x: 0, y: 0, points: 3 },
              { x: 1, y: 0, points: 2 },
            ],
          },
          tree2: {
            name: "God_of_War",
            allocatedNodes: [{ x: 2, y: 1, points: 5 }],
          },
        },
        inventory: { prismList: [], inverseImageList: [] },
      },
      skillPage: createEmptySkillPage(),
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      divinityPage: createEmptyDivinityPage(),
      configurationPage: createEmptyConfigurationPage(),
      calculationsPage: createEmptyCalculationsPage(),
    };

    const code = encodeBuildCode(loadout);
    const decoded = decodeBuildCode(code);

    expect(decoded).toEqual(loadout);
  });

  it("should encode and decode a loadout with skills", () => {
    const skillPage = createEmptySkillPage();
    skillPage.activeSkills[1] = {
      skillName: "Berserking Blade",
      enabled: true,
      supportSkills: { 1: { skillType: "support", name: "Added Fire Damage" } },
    };
    skillPage.activeSkills[2] = {
      skillName: "Blazing Dance",
      enabled: false,
      supportSkills: {},
    };
    skillPage.passiveSkills[1] = {
      skillName: "Charged Flames",
      enabled: true,
      supportSkills: {},
    };

    const loadout: SaveData = {
      equipmentPage: { equippedGear: {}, inventory: [] },
      talentPage: {
        talentTrees: {},
        inventory: { prismList: [], inverseImageList: [] },
      },
      skillPage,
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      divinityPage: createEmptyDivinityPage(),
      configurationPage: createEmptyConfigurationPage(),
      calculationsPage: createEmptyCalculationsPage(),
    };

    const code = encodeBuildCode(loadout);
    const decoded = decodeBuildCode(code);

    expect(decoded).toEqual(loadout);
  });

  it("should encode and decode a full loadout", () => {
    const skillPage = createEmptySkillPage();
    skillPage.activeSkills[1] = {
      skillName: "Berserking Blade",
      enabled: true,
      supportSkills: {},
    };

    const loadout: SaveData = {
      equipmentPage: {
        equippedGear: {
          helmet: {
            id: "test-1",
            equipmentType: "Helmet (STR)",
            prefixes: ["+10% fire damage"],
            suffixes: ["+5% attack speed"],
          },
          chest: {
            id: "test-2",
            equipmentType: "Chest Armor (STR)",
            prefixes: ["+100 health"],
          },
        },
        inventory: [
          { id: "inv-1", equipmentType: "Ring", suffixes: ["+10% crit"] },
        ],
      },
      talentPage: {
        talentTrees: {
          tree1: {
            name: "Goddess_of_Might",
            allocatedNodes: [
              { x: 0, y: 0, points: 3 },
              { x: 1, y: 0, points: 2 },
            ],
          },
        },
        inventory: { prismList: [], inverseImageList: [] },
      },
      skillPage,
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      divinityPage: createEmptyDivinityPage(),
      configurationPage: createEmptyConfigurationPage(),
      calculationsPage: createEmptyCalculationsPage(),
    };

    const code = encodeBuildCode(loadout);
    const decoded = decodeBuildCode(code);

    expect(decoded).toEqual(loadout);
  });

  it("should return null for invalid build codes", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(decodeBuildCode("invalid")).toBeNull();
    expect(decodeBuildCode("")).toBeNull();
    expect(decodeBuildCode("abc123xyz")).toBeNull();
    consoleSpy.mockRestore();
  });

  it("should return null for malformed JSON", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(decodeBuildCode("not-valid-lz-string")).toBeNull();
    consoleSpy.mockRestore();
  });

  it("should produce URL-safe codes", () => {
    const loadout = createEmptySaveData();
    const code = encodeBuildCode(loadout);

    // fflate + base64url produces URL-safe output
    // It should not contain characters that need URL encoding
    expect(encodeURIComponent(code)).toBe(code);
  });
});
