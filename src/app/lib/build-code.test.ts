import { describe, expect, it } from "vitest";
import { encodeBuildCode, decodeBuildCode } from "./build-code";
import { RawLoadout, RawSkillPage, RawHeroPage } from "@/src/tli/core";
import {
  createEmptyLoadout,
  createEmptyHeroPage,
  createEmptyPactspiritPage,
} from "./storage";

const createEmptySkillPage = (): RawSkillPage => ({
  activeSkill1: { enabled: true, supportSkills: {} },
  activeSkill2: { enabled: true, supportSkills: {} },
  activeSkill3: { enabled: true, supportSkills: {} },
  activeSkill4: { enabled: true, supportSkills: {} },
  passiveSkill1: { enabled: true, supportSkills: {} },
  passiveSkill2: { enabled: true, supportSkills: {} },
  passiveSkill3: { enabled: true, supportSkills: {} },
  passiveSkill4: { enabled: true, supportSkills: {} },
});

describe("build-code", () => {
  it("should encode and decode an empty loadout", () => {
    const loadout = createEmptyLoadout();
    const code = encodeBuildCode(loadout);
    const decoded = decodeBuildCode(code);

    expect(decoded).toEqual(loadout);
  });

  it("should encode and decode a loadout with equipment", () => {
    const loadout: RawLoadout = {
      equipmentPage: {
        helmet: {
          id: "test-helmet-1",
          gearType: "helmet",
          affixes: ["+10% fire damage", "+5% attack speed"],
          equipmentType: "Helmet (STR)",
        },
        mainHand: {
          id: "test-sword-1",
          gearType: "sword",
          affixes: ["+100 physical damage"],
        },
      },
      talentPage: {},
      skillPage: createEmptySkillPage(),
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      itemsList: [],
      heroMemoryList: [],
    };

    const code = encodeBuildCode(loadout);
    const decoded = decodeBuildCode(code);

    expect(decoded).toEqual(loadout);
  });

  it("should encode and decode a loadout with talents", () => {
    const loadout: RawLoadout = {
      equipmentPage: {},
      talentPage: {
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
      skillPage: createEmptySkillPage(),
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      itemsList: [],
      heroMemoryList: [],
    };

    const code = encodeBuildCode(loadout);
    const decoded = decodeBuildCode(code);

    expect(decoded).toEqual(loadout);
  });

  it("should encode and decode a loadout with skills", () => {
    const skillPage = createEmptySkillPage();
    skillPage.activeSkill1 = {
      skillName: "Berserking Blade",
      enabled: true,
      supportSkills: {
        supportSkill1: "Added Fire Damage",
      },
    };
    skillPage.activeSkill2 = {
      skillName: "Blazing Dance",
      enabled: false,
      supportSkills: {},
    };
    skillPage.passiveSkill1 = {
      skillName: "Charged Flames",
      enabled: true,
      supportSkills: {},
    };

    const loadout: RawLoadout = {
      equipmentPage: {},
      talentPage: {},
      skillPage,
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      itemsList: [],
      heroMemoryList: [],
    };

    const code = encodeBuildCode(loadout);
    const decoded = decodeBuildCode(code);

    expect(decoded).toEqual(loadout);
  });

  it("should encode and decode a full loadout", () => {
    const skillPage = createEmptySkillPage();
    skillPage.activeSkill1 = {
      skillName: "Berserking Blade",
      enabled: true,
      supportSkills: {},
    };

    const loadout: RawLoadout = {
      equipmentPage: {
        helmet: {
          id: "test-1",
          gearType: "helmet",
          affixes: ["+10% fire damage", "+5% attack speed"],
          equipmentType: "Helmet (STR)",
        },
        chest: {
          id: "test-2",
          gearType: "chest",
          affixes: ["+100 health"],
        },
      },
      talentPage: {
        tree1: {
          name: "Goddess_of_Might",
          allocatedNodes: [
            { x: 0, y: 0, points: 3 },
            { x: 1, y: 0, points: 2 },
          ],
        },
      },
      skillPage,
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      itemsList: [
        {
          id: "inv-1",
          gearType: "ring",
          affixes: ["+10% crit"],
        },
      ],
      heroMemoryList: [],
    };

    const code = encodeBuildCode(loadout);
    const decoded = decodeBuildCode(code);

    expect(decoded).toEqual(loadout);
  });

  it("should return null for invalid build codes", () => {
    expect(decodeBuildCode("invalid")).toBeNull();
    expect(decodeBuildCode("")).toBeNull();
    expect(decodeBuildCode("abc123xyz")).toBeNull();
  });

  it("should return null for malformed JSON", () => {
    // This would decompress but not be valid JSON
    expect(decodeBuildCode("not-valid-lz-string")).toBeNull();
  });

  it("should produce URL-safe codes", () => {
    const loadout = createEmptyLoadout();
    const code = encodeBuildCode(loadout);

    // lz-string's compressToEncodedURIComponent produces URL-safe output
    // It should not contain characters that need URL encoding
    expect(encodeURIComponent(code)).toBe(code);
  });

  it("should produce reasonably sized codes", () => {
    const loadout = createEmptyLoadout();
    const code = encodeBuildCode(loadout);

    // Empty loadout should be fairly small (increased for 8 skill slots with support)
    expect(code.length).toBeLessThan(700);
  });
});
