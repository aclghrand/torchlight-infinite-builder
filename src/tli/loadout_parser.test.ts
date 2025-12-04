import { describe, expect, it } from "vitest";
import { parse_loadout } from "./loadout_parser";
import {
  SaveData,
  SkillPage,
  HeroPage,
  PactspiritPage,
  DivinityPage,
} from "@/src/app/lib/save-data";

const createEmptyHeroPage = (): HeroPage => ({
  selectedHero: undefined,
  traits: {
    level1: undefined,
    level45: undefined,
    level60: undefined,
    level75: undefined,
  },
  memorySlots: {
    slot45: undefined,
    slot60: undefined,
    slot75: undefined,
  },
});

const createEmptySkillPage = (): SkillPage => ({
  activeSkill1: { enabled: true, supportSkills: {} },
  activeSkill2: { enabled: true, supportSkills: {} },
  activeSkill3: { enabled: true, supportSkills: {} },
  activeSkill4: { enabled: true, supportSkills: {} },
  passiveSkill1: { enabled: true, supportSkills: {} },
  passiveSkill2: { enabled: true, supportSkills: {} },
  passiveSkill3: { enabled: true, supportSkills: {} },
  passiveSkill4: { enabled: true, supportSkills: {} },
});

const createEmptyPactspiritSlot = () => ({
  pactspiritName: undefined,
  level: 1,
  rings: {
    innerRing1: {},
    innerRing2: {},
    innerRing3: {},
    innerRing4: {},
    innerRing5: {},
    innerRing6: {},
    midRing1: {},
    midRing2: {},
    midRing3: {},
  },
});

const createEmptyPactspiritPage = (): PactspiritPage => ({
  slot1: createEmptyPactspiritSlot(),
  slot2: createEmptyPactspiritSlot(),
  slot3: createEmptyPactspiritSlot(),
});

const createEmptyDivinityPage = (): DivinityPage => ({
  placedSlates: [],
});

describe("parse_loadout", () => {
  it("should parse a simple loadout with single-line affixes", () => {
    const rawLoadout: SaveData = {
      equipmentPage: {
        helmet: {
          id: "test-helmet-1",
          gearType: "helmet",
          affixes: ["+10% fire damage", "+5% attack speed"],
        },
      },
      talentPage: {
        tree1: { name: "Warrior", allocatedNodes: [] },
        tree2: { name: "Warrior", allocatedNodes: [] },
        tree3: { name: "Warrior", allocatedNodes: [] },
        tree4: { name: "Warrior", allocatedNodes: [] },
      },
      skillPage: createEmptySkillPage(),
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      divinityPage: createEmptyDivinityPage(),
      itemsList: [],
      heroMemoryList: [],
      divinitySlateList: [],
      prismList: [],
      inverseImageList: [],
    };

    const result = parse_loadout(rawLoadout);

    expect(result.equipmentPage.helmet).toBeDefined();
    expect(result.equipmentPage.helmet?.affixes).toHaveLength(2);

    // Check first affix
    expect(result.equipmentPage.helmet?.affixes[0].raw).toBe(
      "+10% fire damage",
    );
    expect(result.equipmentPage.helmet?.affixes[0].mods).toHaveLength(1);
    expect(result.equipmentPage.helmet?.affixes[0].mods[0]).toEqual({
      type: "DmgPct",
      value: 0.1,
      modType: "fire",
      addn: false,
    });

    // Check second affix
    expect(result.equipmentPage.helmet?.affixes[1].raw).toBe(
      "+5% attack speed",
    );
    expect(result.equipmentPage.helmet?.affixes[1].mods).toHaveLength(1);
    expect(result.equipmentPage.helmet?.affixes[1].mods[0]).toEqual({
      type: "AspdPct",
      value: 0.05,
      addn: false,
    });
  });

  it("should parse affixes with multiple mods separated by newlines", () => {
    const rawLoadout: SaveData = {
      equipmentPage: {
        chest: {
          id: "test-chest-1",
          gearType: "chest",
          affixes: [
            "+10% fire damage\n+5% attack speed\n+15% critical strike rating",
          ],
        },
      },
      talentPage: {
        tree1: { name: "Warrior", allocatedNodes: [] },
        tree2: { name: "Warrior", allocatedNodes: [] },
        tree3: { name: "Warrior", allocatedNodes: [] },
        tree4: { name: "Warrior", allocatedNodes: [] },
      },
      skillPage: createEmptySkillPage(),
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      divinityPage: createEmptyDivinityPage(),
      itemsList: [],
      heroMemoryList: [],
      divinitySlateList: [],
      prismList: [],
      inverseImageList: [],
    };

    const result = parse_loadout(rawLoadout);

    expect(result.equipmentPage.chest).toBeDefined();
    expect(result.equipmentPage.chest?.affixes).toHaveLength(1);
    expect(result.equipmentPage.chest?.affixes[0].raw).toBe(
      "+10% fire damage\n+5% attack speed\n+15% critical strike rating",
    );
    expect(result.equipmentPage.chest?.affixes[0].mods).toHaveLength(3);

    // Check all three mods
    expect(result.equipmentPage.chest?.affixes[0].mods[0]).toEqual({
      type: "DmgPct",
      value: 0.1,
      modType: "fire",
      addn: false,
    });
    expect(result.equipmentPage.chest?.affixes[0].mods[1]).toEqual({
      type: "AspdPct",
      value: 0.05,
      addn: false,
    });
    expect(result.equipmentPage.chest?.affixes[0].mods[2]).toEqual({
      type: "CritRatingPct",
      value: 0.15,
      modType: "global",
    });
  });

  it("should handle unrecognized mods by excluding them from mods array", () => {
    const rawLoadout: SaveData = {
      equipmentPage: {
        gloves: {
          id: "test-gloves-1",
          gearType: "gloves",
          affixes: [
            "+10% fire damage\nsome unrecognized mod\n+5% attack speed",
          ],
        },
      },
      talentPage: {
        tree1: { name: "Warrior", allocatedNodes: [] },
        tree2: { name: "Warrior", allocatedNodes: [] },
        tree3: { name: "Warrior", allocatedNodes: [] },
        tree4: { name: "Warrior", allocatedNodes: [] },
      },
      skillPage: createEmptySkillPage(),
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      divinityPage: createEmptyDivinityPage(),
      itemsList: [],
      heroMemoryList: [],
      divinitySlateList: [],
      prismList: [],
      inverseImageList: [],
    };

    const result = parse_loadout(rawLoadout);

    expect(result.equipmentPage.gloves).toBeDefined();
    expect(result.equipmentPage.gloves?.affixes).toHaveLength(1);
    expect(result.equipmentPage.gloves?.affixes[0].raw).toBe(
      "+10% fire damage\nsome unrecognized mod\n+5% attack speed",
    );
    // Only 2 mods should be parsed (unrecognized one filtered out)
    expect(result.equipmentPage.gloves?.affixes[0].mods).toHaveLength(2);

    // Check that the two successfully parsed mods are correct
    expect(result.equipmentPage.gloves?.affixes[0].mods[0]).toEqual({
      type: "DmgPct",
      value: 0.1,
      modType: "fire",
      addn: false,
    });
    expect(result.equipmentPage.gloves?.affixes[0].mods[1]).toEqual({
      type: "AspdPct",
      value: 0.05,
      addn: false,
    });
  });

  it("should handle empty affixes array", () => {
    const rawLoadout: SaveData = {
      equipmentPage: {
        boots: {
          id: "test-boots-1",
          gearType: "boots",
          affixes: [],
        },
      },
      talentPage: {
        tree1: { name: "Warrior", allocatedNodes: [] },
        tree2: { name: "Warrior", allocatedNodes: [] },
        tree3: { name: "Warrior", allocatedNodes: [] },
        tree4: { name: "Warrior", allocatedNodes: [] },
      },
      skillPage: createEmptySkillPage(),
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      divinityPage: createEmptyDivinityPage(),
      itemsList: [],
      heroMemoryList: [],
      divinitySlateList: [],
      prismList: [],
      inverseImageList: [],
    };

    const result = parse_loadout(rawLoadout);

    expect(result.equipmentPage.boots).toBeDefined();
    expect(result.equipmentPage.boots?.affixes).toHaveLength(0);
  });

  it("should handle multiple gear pieces", () => {
    const rawLoadout: SaveData = {
      equipmentPage: {
        helmet: {
          id: "test-helmet-2",
          gearType: "helmet",
          affixes: ["+10% fire damage"],
        },
        chest: {
          id: "test-chest-2",
          gearType: "chest",
          affixes: ["+5% attack speed"],
        },
        gloves: {
          id: "test-gloves-2",
          gearType: "gloves",
          affixes: ["+15% critical strike rating"],
        },
      },
      talentPage: {
        tree1: { name: "Warrior", allocatedNodes: [] },
        tree2: { name: "Warrior", allocatedNodes: [] },
        tree3: { name: "Warrior", allocatedNodes: [] },
        tree4: { name: "Warrior", allocatedNodes: [] },
      },
      skillPage: createEmptySkillPage(),
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      divinityPage: createEmptyDivinityPage(),
      itemsList: [],
      heroMemoryList: [],
      divinitySlateList: [],
      prismList: [],
      inverseImageList: [],
    };

    const result = parse_loadout(rawLoadout);

    expect(result.equipmentPage.helmet).toBeDefined();
    expect(result.equipmentPage.chest).toBeDefined();
    expect(result.equipmentPage.gloves).toBeDefined();
    expect(result.equipmentPage.helmet?.affixes[0].raw).toBe(
      "+10% fire damage",
    );
    expect(result.equipmentPage.chest?.affixes[0].raw).toBe("+5% attack speed");
    expect(result.equipmentPage.gloves?.affixes[0].raw).toBe(
      "+15% critical strike rating",
    );
  });

  it("should initialize empty talentPage, divinityPage, and customConfiguration", () => {
    const rawLoadout: SaveData = {
      equipmentPage: {},
      talentPage: {
        tree1: { name: "Warrior", allocatedNodes: [] },
        tree2: { name: "Warrior", allocatedNodes: [] },
        tree3: { name: "Warrior", allocatedNodes: [] },
        tree4: { name: "Warrior", allocatedNodes: [] },
      },
      skillPage: createEmptySkillPage(),
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      divinityPage: createEmptyDivinityPage(),
      itemsList: [],
      heroMemoryList: [],
      divinitySlateList: [],
      prismList: [],
      inverseImageList: [],
    };

    const result = parse_loadout(rawLoadout);

    expect(result.talentPage).toEqual({ affixes: [] });
    expect(result.divinityPage).toEqual({ slates: [] });
    expect(result.customConfiguration).toEqual([]);
  });

  it("should handle affixes with empty lines", () => {
    const rawLoadout: SaveData = {
      equipmentPage: {
        belt: {
          id: "test-belt-1",
          gearType: "belt",
          affixes: ["+10% fire damage\n\n+5% attack speed\n"],
        },
      },
      talentPage: {
        tree1: { name: "Warrior", allocatedNodes: [] },
        tree2: { name: "Warrior", allocatedNodes: [] },
        tree3: { name: "Warrior", allocatedNodes: [] },
        tree4: { name: "Warrior", allocatedNodes: [] },
      },
      skillPage: createEmptySkillPage(),
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      divinityPage: createEmptyDivinityPage(),
      itemsList: [],
      heroMemoryList: [],
      divinitySlateList: [],
      prismList: [],
      inverseImageList: [],
    };

    const result = parse_loadout(rawLoadout);

    expect(result.equipmentPage.belt).toBeDefined();
    expect(result.equipmentPage.belt?.affixes[0].mods).toHaveLength(2);
    expect(result.equipmentPage.belt?.affixes[0].raw).toBe(
      "+10% fire damage\n\n+5% attack speed\n",
    );
  });
});

describe("talent tree parsing", () => {
  it("should parse a single talent node with 1 point", () => {
    const rawLoadout: SaveData = {
      equipmentPage: {},
      talentPage: {
        tree1: {
          name: "The_Brave",
          allocatedNodes: [{ x: 0, y: 0, points: 1 }],
        },
        tree2: { name: "Warrior", allocatedNodes: [] },
        tree3: { name: "Warrior", allocatedNodes: [] },
        tree4: { name: "Warrior", allocatedNodes: [] },
      },
      skillPage: createEmptySkillPage(),
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      divinityPage: createEmptyDivinityPage(),
      itemsList: [],
      heroMemoryList: [],
      divinitySlateList: [],
      prismList: [],
      inverseImageList: [],
    };

    const result = parse_loadout(rawLoadout);

    expect(result.talentPage.affixes).toHaveLength(1);
    expect(result.talentPage.affixes[0].raw).toBe("+9% Attack Damage");
    expect(result.talentPage.affixes[0].mods).toHaveLength(1);
    expect(result.talentPage.affixes[0].mods[0]).toEqual({
      type: "DmgPct",
      value: 0.09,
      modType: "attack",
      addn: false,
    });
    expect(result.talentPage.affixes[0].src).toBe("The_Brave (0,0) x1");
  });

  it("should multiply mod values by allocated points", () => {
    const rawLoadout: SaveData = {
      equipmentPage: {},
      talentPage: {
        tree1: {
          name: "The_Brave",
          allocatedNodes: [{ x: 0, y: 0, points: 3 }],
        },
        tree2: { name: "Warrior", allocatedNodes: [] },
        tree3: { name: "Warrior", allocatedNodes: [] },
        tree4: { name: "Warrior", allocatedNodes: [] },
      },
      skillPage: createEmptySkillPage(),
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      divinityPage: createEmptyDivinityPage(),
      itemsList: [],
      heroMemoryList: [],
      divinitySlateList: [],
      prismList: [],
      inverseImageList: [],
    };

    const result = parse_loadout(rawLoadout);

    expect(result.talentPage.affixes).toHaveLength(1);
    expect(result.talentPage.affixes[0].mods[0]).toEqual({
      type: "DmgPct",
      value: 0.27, // 0.09 * 3
      modType: "attack",
      addn: false,
    });
    expect(result.talentPage.affixes[0].src).toBe("The_Brave (0,0) x3");
  });

  it("should parse multi-line affixes in talent nodes", () => {
    const rawLoadout: SaveData = {
      equipmentPage: {},
      talentPage: {
        tree1: {
          name: "The_Brave",
          allocatedNodes: [{ x: 3, y: 0, points: 2 }],
        },
        tree2: { name: "Warrior", allocatedNodes: [] },
        tree3: { name: "Warrior", allocatedNodes: [] },
        tree4: { name: "Warrior", allocatedNodes: [] },
      },
      skillPage: createEmptySkillPage(),
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      divinityPage: createEmptyDivinityPage(),
      itemsList: [],
      heroMemoryList: [],
      divinitySlateList: [],
      prismList: [],
      inverseImageList: [],
    };

    const result = parse_loadout(rawLoadout);

    expect(result.talentPage.affixes).toHaveLength(1);
    expect(result.talentPage.affixes[0].raw).toBe(
      "+20% Attack Critical Strike Rating\n+5% Critical Strike Damage",
    );
    // Note: "+5% Critical Strike Damage" is currently not recognized by the parser
    // So only the first line is parsed (as per our unrecognized mods policy)
    expect(result.talentPage.affixes[0].mods).toHaveLength(1);

    // First mod: +20% Attack Critical Strike Rating * 2 points
    expect(result.talentPage.affixes[0].mods[0]).toEqual({
      type: "CritRatingPct",
      value: 0.4, // 0.20 * 2
      modType: "attack",
    });
  });

  it("should parse multiple talent nodes from multiple trees", () => {
    const rawLoadout: SaveData = {
      equipmentPage: {},
      talentPage: {
        tree1: {
          name: "The_Brave",
          allocatedNodes: [
            { x: 0, y: 0, points: 1 },
            { x: 2, y: 0, points: 2 },
          ],
        },
        tree2: {
          name: "Warrior",
          allocatedNodes: [{ x: 0, y: 0, points: 3 }],
        },
        tree3: { name: "Warrior", allocatedNodes: [] },
        tree4: { name: "Warrior", allocatedNodes: [] },
      },
      skillPage: createEmptySkillPage(),
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      divinityPage: createEmptyDivinityPage(),
      itemsList: [],
      heroMemoryList: [],
      divinitySlateList: [],
      prismList: [],
      inverseImageList: [],
    };

    const result = parse_loadout(rawLoadout);

    // Should have 3 affixes total (2 from tree1, 1 from tree2)
    expect(result.talentPage.affixes).toHaveLength(3);

    // Check that affixes are from the correct trees
    expect(result.talentPage.affixes[0].src).toContain("The_Brave");
    expect(result.talentPage.affixes[1].src).toContain("The_Brave");
    expect(result.talentPage.affixes[2].src).toContain("Warrior");
  });

  it("should throw error for unknown tree name", () => {
    const rawLoadout: SaveData = {
      equipmentPage: {},
      talentPage: {
        tree1: {
          name: "NonexistentTree",
          allocatedNodes: [{ x: 0, y: 0, points: 1 }],
        },
        tree2: { name: "Warrior", allocatedNodes: [] },
        tree3: { name: "Warrior", allocatedNodes: [] },
        tree4: { name: "Warrior", allocatedNodes: [] },
      },
      skillPage: createEmptySkillPage(),
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      divinityPage: createEmptyDivinityPage(),
      itemsList: [],
      heroMemoryList: [],
      divinitySlateList: [],
      prismList: [],
      inverseImageList: [],
    };

    expect(() => parse_loadout(rawLoadout)).toThrow(
      "Unknown talent tree name: NonexistentTree",
    );
  });

  it("should throw error for invalid node coordinates", () => {
    const rawLoadout: SaveData = {
      equipmentPage: {},
      talentPage: {
        tree1: {
          name: "The_Brave",
          allocatedNodes: [{ x: 999, y: 999, points: 1 }],
        },
        tree2: { name: "Warrior", allocatedNodes: [] },
        tree3: { name: "Warrior", allocatedNodes: [] },
        tree4: { name: "Warrior", allocatedNodes: [] },
      },
      skillPage: createEmptySkillPage(),
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      divinityPage: createEmptyDivinityPage(),
      itemsList: [],
      heroMemoryList: [],
      divinitySlateList: [],
      prismList: [],
      inverseImageList: [],
    };

    expect(() => parse_loadout(rawLoadout)).toThrow(
      "Node not found at (999, 999) in tree The_Brave",
    );
  });

  it("should handle unrecognized mods in talent nodes", () => {
    // This test uses a node that may have some unrecognized mods
    // The parser should keep the raw string but filter out unparseable mods
    const rawLoadout: SaveData = {
      equipmentPage: {},
      talentPage: {
        tree1: {
          name: "The_Brave",
          allocatedNodes: [{ x: 0, y: 0, points: 1 }],
        },
        tree2: { name: "Warrior", allocatedNodes: [] },
        tree3: { name: "Warrior", allocatedNodes: [] },
        tree4: { name: "Warrior", allocatedNodes: [] },
      },
      skillPage: createEmptySkillPage(),
      heroPage: createEmptyHeroPage(),
      pactspiritPage: createEmptyPactspiritPage(),
      divinityPage: createEmptyDivinityPage(),
      itemsList: [],
      heroMemoryList: [],
      divinitySlateList: [],
      prismList: [],
      inverseImageList: [],
    };

    const result = parse_loadout(rawLoadout);

    // Should still parse successfully
    expect(result.talentPage.affixes).toHaveLength(1);
    // Raw should be preserved
    expect(result.talentPage.affixes[0].raw).toBeDefined();
  });
});
