import { expect, test, describe } from "vitest";
import { BOOTS_DEX_BASE_AFFIX_AFFIXES } from "./boots_dex_base_affix";
import { ALL_GEAR_AFFIXES } from "./all_affixes";
import type { BaseGearAffix } from "./gear_data_types";

describe("BaseGearAffix type system", () => {
  test("BOOTS_DEX_BASE_AFFIX_AFFIXES has correct structure", () => {
    const firstAffix = BOOTS_DEX_BASE_AFFIX_AFFIXES[0];
    expect(firstAffix).toHaveProperty("equipmentSlot");
    expect(firstAffix).toHaveProperty("equipmentType");
    expect(firstAffix).toHaveProperty("affixType");
    expect(firstAffix).toHaveProperty("craftingPool");
    expect(firstAffix).toHaveProperty("tier");
    expect(firstAffix).toHaveProperty("craftableAffix");
  });

  test("ALL_GEAR_AFFIXES contains all 5625 affixes", () => {
    expect(ALL_GEAR_AFFIXES.length).toBe(5625);
  });

  test("ALL_GEAR_AFFIXES has affixes from different equipment types", () => {
    const equipmentTypes = new Set(
      ALL_GEAR_AFFIXES.map((affix) => affix.equipmentType),
    );
    expect(equipmentTypes.size).toBeGreaterThan(30); // Should have 38 unique equipment types
  });

  test("ALL_GEAR_AFFIXES has affixes from different affix types", () => {
    const affixTypes = new Set(
      ALL_GEAR_AFFIXES.map((affix) => affix.affixType),
    );
    expect(affixTypes.size).toBe(7); // Base Affix, Prefix, Suffix, Base Stats, Sweet Dream Affix, Tower Sequence, Corrosion Base
  });

  test("type narrowing works with discriminated union", () => {
    const affix: BaseGearAffix = BOOTS_DEX_BASE_AFFIX_AFFIXES[0];

    // Type narrowing by equipmentType
    if (affix.equipmentType === "Boots (DEX)") {
      expect(affix.equipmentSlot).toBe("Boots");
    }
  });

  test("can filter affixes by equipment type", () => {
    const bootsAffixes = ALL_GEAR_AFFIXES.filter(
      (affix) => affix.equipmentSlot === "Boots",
    );
    expect(bootsAffixes.length).toBeGreaterThan(0);
  });

  test("can filter affixes by affix type", () => {
    const prefixAffixes = ALL_GEAR_AFFIXES.filter(
      (affix) => affix.affixType === "Prefix",
    );
    expect(prefixAffixes.length).toBeGreaterThan(0);
  });

  test("all affixes have valid craftableAffix strings", () => {
    for (const affix of ALL_GEAR_AFFIXES) {
      // Verify that craftableAffix is defined
      expect(affix.craftableAffix).toBeDefined();
      expect(typeof affix.craftableAffix).toBe("string");
    }
  });

  test("craftableAffix strings contain value ranges in expected format", () => {
    // Find affixes with ranges and verify format
    const affixesWithRanges = ALL_GEAR_AFFIXES.filter((affix) =>
      /\(\d+-\d+\)/.test(affix.craftableAffix),
    );
    expect(affixesWithRanges.length).toBeGreaterThan(0);

    // Verify range format (min-max)
    for (const affix of affixesWithRanges.slice(0, 100)) {
      const ranges = affix.craftableAffix.match(/\((\d+)-(\d+)\)/g);
      if (ranges) {
        for (const range of ranges) {
          const [min, max] = range
            .slice(1, -1)
            .split("-")
            .map((n) => parseInt(n, 10));
          expect(min).toBeLessThanOrEqual(max);
        }
      }
    }
  });
});
