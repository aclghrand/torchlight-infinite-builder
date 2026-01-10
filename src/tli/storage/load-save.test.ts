/** biome-ignore-all lint/style/noNonNullAssertion: don't care in test */
import { expect, test } from "vitest";
import type { SaveData } from "@/src/lib/save-data";
import { getGearAffixes } from "../calcs/affix-collectors";
import { DEFAULT_CONFIGURATION, getAffixMods, getAffixText } from "../core";
import { loadSave } from "./load-save";

const createEmptySkillPage = () => ({ activeSkills: {}, passiveSkills: {} });

const createEmptyRings = () => ({
  innerRing1: {},
  innerRing2: {},
  innerRing3: {},
  innerRing4: {},
  innerRing5: {},
  innerRing6: {},
  midRing1: {},
  midRing2: {},
  midRing3: {},
});

const createMinimalSaveData = (
  overrides: Partial<SaveData> = {},
): SaveData => ({
  equipmentPage: { equippedGear: {}, inventory: [] },
  talentPage: {
    talentTrees: {},
    inventory: { prismList: [], inverseImageList: [] },
  },
  skillPage: createEmptySkillPage(),
  heroPage: {
    selectedHero: undefined,
    traits: {
      level1: undefined,
      level45: undefined,
      level60: undefined,
      level75: undefined,
    },
    memorySlots: { slot45: undefined, slot60: undefined, slot75: undefined },
    memoryInventory: [],
  },
  pactspiritPage: {
    slot1: { level: 1, rings: createEmptyRings() },
    slot2: { level: 1, rings: createEmptyRings() },
    slot3: { level: 1, rings: createEmptyRings() },
  },
  divinityPage: { placedSlates: [], inventory: [] },
  configurationPage: DEFAULT_CONFIGURATION,
  calculationsPage: { selectedSkillName: undefined },
  ...overrides,
});

test("loadSave converts gear with parseable affix", () => {
  const saveData = createMinimalSaveData({
    equipmentPage: {
      equippedGear: {
        mainHand: {
          id: "test-weapon",
          equipmentType: "One-Handed Sword",
          prefixes: ["+10% fire damage"],
        },
      },
      inventory: [],
    },
  });

  const loadout = loadSave(saveData);

  expect(loadout.gearPage.equippedGear.mainHand).toBeDefined();
  const mainHand = loadout.gearPage.equippedGear.mainHand!;
  expect(mainHand.equipmentType).toBe("One-Handed Sword");
  const affixes = getGearAffixes(mainHand);
  expect(affixes).toHaveLength(1);

  const affix = affixes[0];
  expect(getAffixText(affix)).toBe("+10% fire damage");
  expect(affix.src).toBe("Gear#mainHand");
  const mods = getAffixMods(affix);
  expect(mods).toHaveLength(1);
  expect(mods[0].type).toBe("DmgPct");
  expect(mods[0].src).toBe("Gear#mainHand");
});

test("loadSave handles affix that fails to parse", () => {
  const saveData = createMinimalSaveData({
    equipmentPage: {
      equippedGear: {
        helmet: {
          id: "test-helmet",
          equipmentType: "Helmet (STR)",
          suffixes: ["some unparseable affix text"],
        },
      },
      inventory: [],
    },
  });

  const loadout = loadSave(saveData);

  expect(loadout.gearPage.equippedGear.helmet).toBeDefined();
  const helmet = loadout.gearPage.equippedGear.helmet!;
  const affixes = getGearAffixes(helmet);
  expect(affixes).toHaveLength(1);

  const affix = affixes[0];
  expect(getAffixText(affix)).toBe("some unparseable affix text");
  expect(affix.src).toBe("Gear#helmet");
  expect(getAffixMods(affix)).toHaveLength(0);
});

test("loadSave sets correct src for different gear slots", () => {
  const saveData = createMinimalSaveData({
    equipmentPage: {
      equippedGear: {
        helmet: {
          id: "h",
          equipmentType: "Helmet (STR)",
          suffixes: ["+5% armor"],
        },
        leftRing: {
          id: "lr",
          equipmentType: "Ring",
          prefixes: ["+5% max life"],
        },
        offHand: {
          id: "oh",
          equipmentType: "Shield (STR)",
          suffixes: ["+4% attack block chance"],
        },
      },
      inventory: [],
    },
  });

  const loadout = loadSave(saveData);
  const equippedGear = loadout.gearPage.equippedGear;

  expect(getGearAffixes(equippedGear.helmet!)[0].src).toBe("Gear#helmet");
  expect(getGearAffixes(equippedGear.leftRing!)[0].src).toBe("Gear#leftRing");
  expect(getGearAffixes(equippedGear.offHand!)[0].src).toBe("Gear#offHand");
});

test("loadSave handles empty gear page", () => {
  const saveData = createMinimalSaveData({
    equipmentPage: { equippedGear: {}, inventory: [] },
  });

  const loadout = loadSave(saveData);

  expect(loadout.gearPage.equippedGear).toEqual({});
  expect(loadout.gearPage.inventory).toEqual([]);
});

test("loadSave converts gear in inventory", () => {
  const saveData = createMinimalSaveData({
    equipmentPage: {
      equippedGear: {},
      inventory: [
        {
          id: "inv-sword",
          equipmentType: "One-Handed Sword",
          prefixes: ["+20% cold damage"],
        },
        {
          id: "inv-helmet",
          equipmentType: "Helmet (STR)",
          prefixes: ["unparseable text"],
          suffixes: ["+15% lightning damage"],
        },
      ],
    },
  });

  const loadout = loadSave(saveData);

  expect(loadout.gearPage.inventory).toHaveLength(2);

  const sword = loadout.gearPage.inventory[0];
  expect(sword.equipmentType).toBe("One-Handed Sword");
  const swordAffixes = getGearAffixes(sword);
  expect(swordAffixes).toHaveLength(1);
  expect(getAffixText(swordAffixes[0])).toBe("+20% cold damage");
  expect(swordAffixes[0].src).toBeUndefined();
  const swordMods = getAffixMods(swordAffixes[0]);
  expect(swordMods).toHaveLength(1);
  expect(swordMods[0].type).toBe("DmgPct");
  expect(swordMods[0].src).toBeUndefined();

  const helmet = loadout.gearPage.inventory[1];
  expect(helmet.equipmentType).toBe("Helmet (STR)");
  const helmetAffixes = getGearAffixes(helmet);
  expect(helmetAffixes).toHaveLength(2);
  expect(getAffixMods(helmetAffixes[0])).toHaveLength(0);
  expect(getAffixMods(helmetAffixes[1])).toHaveLength(1);
});

test("loadSave preserves UI fields (id, rarity, legendaryName)", () => {
  const saveData = createMinimalSaveData({
    equipmentPage: {
      equippedGear: {
        helmet: {
          id: "legendary-helm-123",
          equipmentType: "Helmet (STR)",
          rarity: "legendary",
          legendaryName: "Crown of the Eternal",
          legendary_affixes: ["+50% fire damage"],
        },
      },
      inventory: [
        {
          id: "inv-item-456",
          equipmentType: "Ring",
          rarity: "rare",
          prefixes: ["+5% max life"],
        },
      ],
    },
  });

  const loadout = loadSave(saveData);

  // Check equipped gear preserves UI fields
  const helmet = loadout.gearPage.equippedGear.helmet!;
  expect(helmet.id).toBe("legendary-helm-123");
  expect(helmet.rarity).toBe("legendary");
  expect(helmet.legendaryName).toBe("Crown of the Eternal");

  // Check inventory preserves UI fields
  const ring = loadout.gearPage.inventory[0];
  expect(ring.id).toBe("inv-item-456");
  expect(ring.rarity).toBe("rare");
  expect(ring.legendaryName).toBeUndefined();
});
