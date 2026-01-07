import { describe, expect, it } from "vitest";
import type { SaveData } from "@/src/lib/save-data";
import type { Configuration } from "../../core";
import { loadSave } from "../../storage/load-save";
import { calculateOffense } from "../offense";
import bing2Golden from "./bing-2-golden-1.json";
import bing2Golden2 from "./bing-2-golden-2.json";
import mcTheaGolden from "./mc-thea-3-golden-1.json";
import rosaGolden from "./rosa-2-golden.json";

describe("offense golden tests", () => {
  it("rosa-2-golden: Frost Spike should calculate ~16.04 trillion DPS", () => {
    const saveData = rosaGolden as unknown as SaveData;
    const loadout = loadSave(saveData);
    const config = saveData.configurationPage as Configuration;

    const results = calculateOffense({ loadout, configuration: config });

    const frostSpike = results.skills["Frost Spike"];
    if (frostSpike === undefined) {
      throw new Error("Frost Spike skill not found in results");
    }

    const avgDps = frostSpike.attackDpsSummary?.avgDps;
    // With projectile damage from frostbite: trunc(100/35) = 2 projectiles × 8% = 16% additional damage
    const expectedDps = 16.04e12; // ~16.04 trillion (with 40% enemy res default)
    const tolerance = 0.01; // 1% tolerance

    expect(avgDps).toBeGreaterThan(expectedDps * (1 - tolerance));
    expect(avgDps).toBeLessThan(expectedDps * (1 + tolerance));

    // Resistance checks
    const { defenses } = results;
    expect(defenses.coldRes).toEqual({ max: 60, potential: 58, actual: 58 });
    expect(defenses.lightningRes).toEqual({
      max: 60,
      potential: 55,
      actual: 55,
    });
    expect(defenses.fireRes).toEqual({ max: 60, potential: 57, actual: 57 });
    expect(defenses.erosionRes).toEqual({ max: 63, potential: 61, actual: 61 });
  });

  it("mc-thea-3-golden-1: Mind Control should calculate expected DOT/Reap values", () => {
    const saveData = mcTheaGolden as unknown as SaveData;
    const loadout = loadSave(saveData);
    const config = saveData.configurationPage as Configuration;

    const results = calculateOffense({ loadout, configuration: config });

    const mindControl = results.skills["Mind Control"];
    if (mindControl === undefined) {
      throw new Error("Mind Control skill not found in results");
    }

    const tolerance = 0.01; // 1% tolerance

    // DOT DPS: ~26.31 billion (persistent damage ignores armor, with 30% enemy erosion res default)
    const dotDps = mindControl.persistentDpsSummary?.total;
    const expectedDotDps = 26.31e9;
    expect(dotDps).toBeGreaterThan(expectedDotDps * (1 - tolerance));
    expect(dotDps).toBeLessThan(expectedDotDps * (1 + tolerance));

    // DOT Duration: 2.28s
    const dotDuration = mindControl.persistentDpsSummary?.duration;
    expect(dotDuration).toBeCloseTo(2.28, 2);

    // Reap DPS: ~277.79 billion (scales with DOT, with 30% enemy erosion res default)
    const reapDps = mindControl.totalReapDpsSummary?.totalReapDps;
    const expectedReapDps = 277.79e9;
    expect(reapDps).toBeGreaterThan(expectedReapDps * (1 - tolerance));
    expect(reapDps).toBeLessThan(expectedReapDps * (1 + tolerance));

    // Reap CDR Bonus: 236% (136% increased)
    const reapCdr = mindControl.totalReapDpsSummary?.reapCdrBonusPct;
    expect(reapCdr).toBeCloseTo(236, 0);

    // Reap Duration Bonus: 182% (82% increased)
    const reapDuration = mindControl.totalReapDpsSummary?.reapDurationBonusPct;
    expect(reapDuration).toBeCloseTo(182, 0);

    // Total DPS: ~304.13 billion (DOT + Reap, with 30% enemy erosion res default)
    const totalDps = mindControl.totalDps;
    const expectedTotalDps = 304.13e9;
    expect(totalDps).toBeGreaterThan(expectedTotalDps * (1 - tolerance));
    expect(totalDps).toBeLessThan(expectedTotalDps * (1 + tolerance));
  });

  it("bing-2-golden-1: Chain Lightning should calculate expected spell/burst DPS values", () => {
    const saveData = bing2Golden as unknown as SaveData;
    const loadout = loadSave(saveData);
    const config = saveData.configurationPage as Configuration;

    const results = calculateOffense({ loadout, configuration: config });

    const chainLightning = results.skills["Chain Lightning"];
    if (chainLightning === undefined) {
      throw new Error("Chain Lightning skill not found in results");
    }

    const tolerance = 0.01; // 1% tolerance

    // Spell DPS: ~72.64 million
    const spellDps = chainLightning.spellDpsSummary?.avgDps;
    const expectedSpellDps = 72.64e6;
    expect(spellDps).toBeGreaterThan(expectedSpellDps * (1 - tolerance));
    expect(spellDps).toBeLessThan(expectedSpellDps * (1 + tolerance));

    // Spell Burst DPS: ~336.23 million
    const spellBurstDps = chainLightning.spellBurstDpsSummary?.avgDps;
    const expectedSpellBurstDps = 336.23e6;
    expect(spellBurstDps).toBeGreaterThan(
      expectedSpellBurstDps * (1 - tolerance),
    );
    expect(spellBurstDps).toBeLessThan(expectedSpellBurstDps * (1 + tolerance));

    // Ingenuity Overload DPS: ~70.53 million
    const ingenuityDps =
      chainLightning.spellBurstDpsSummary?.ingenuityOverload?.avgDps;
    const expectedIngenuityDps = 70.53e6;
    expect(ingenuityDps).toBeGreaterThan(
      expectedIngenuityDps * (1 - tolerance),
    );
    expect(ingenuityDps).toBeLessThan(expectedIngenuityDps * (1 + tolerance));

    // Total DPS: ~479.41 million
    const totalDps = chainLightning.totalDps;
    const expectedTotalDps = 479.41e6;
    expect(totalDps).toBeGreaterThan(expectedTotalDps * (1 - tolerance));
    expect(totalDps).toBeLessThan(expectedTotalDps * (1 + tolerance));

    // Resistance checks
    const { coldRes, lightningRes, fireRes, erosionRes } = results.defenses;
    expect(coldRes).toEqual({ max: 60, potential: 58, actual: 58 });
    expect(lightningRes).toEqual({ max: 60, potential: 56, actual: 56 });
    expect(fireRes).toEqual({ max: 60, potential: 40, actual: 40 });
    expect(erosionRes).toEqual({ max: 60, potential: 9, actual: 9 });
  });

  it("bing-2-golden-2: Chain Lightning should calculate expected spell/burst DPS values", () => {
    const saveData = bing2Golden2 as unknown as SaveData;
    const loadout = loadSave(saveData);
    const config = saveData.configurationPage as Configuration;

    const results = calculateOffense({ loadout, configuration: config });

    const chainLightning = results.skills["Chain Lightning"];
    if (chainLightning === undefined) {
      throw new Error("Chain Lightning skill not found in results");
    }

    const tolerance = 0.01; // 1% tolerance

    // Spell DPS: ~624.17 million
    const spellDps = chainLightning.spellDpsSummary?.avgDps;
    const expectedSpellDps = 624.17e6;
    expect(spellDps).toBeGreaterThan(expectedSpellDps * (1 - tolerance));
    expect(spellDps).toBeLessThan(expectedSpellDps * (1 + tolerance));

    // Spell Burst DPS: ~4.59 billion
    const spellBurstDps = chainLightning.spellBurstDpsSummary?.avgDps;
    const expectedSpellBurstDps = 4.59e9;
    expect(spellBurstDps).toBeGreaterThan(
      expectedSpellBurstDps * (1 - tolerance),
    );
    expect(spellBurstDps).toBeLessThan(expectedSpellBurstDps * (1 + tolerance));

    // Ingenuity Overload DPS: ~886.64 million
    const ingenuityDps =
      chainLightning.spellBurstDpsSummary?.ingenuityOverload?.avgDps;
    const expectedIngenuityDps = 886.64e6;
    expect(ingenuityDps).toBeGreaterThan(
      expectedIngenuityDps * (1 - tolerance),
    );
    expect(ingenuityDps).toBeLessThan(expectedIngenuityDps * (1 + tolerance));

    // Total DPS: ~6.10 billion
    const totalDps = chainLightning.totalDps;
    const expectedTotalDps = 6.1e9;
    expect(totalDps).toBeGreaterThan(expectedTotalDps * (1 - tolerance));
    expect(totalDps).toBeLessThan(expectedTotalDps * (1 + tolerance));

    // Resistance checks
    const { coldRes, lightningRes, fireRes, erosionRes } = results.defenses;
    expect(coldRes).toEqual({ max: 60, potential: 60, actual: 60 });
    expect(lightningRes).toEqual({ max: 60, potential: 61, actual: 60 });
    expect(fireRes).toEqual({ max: 60, potential: 60, actual: 60 });
    expect(erosionRes).toEqual({ max: 60, potential: 63, actual: 60 });
  });
});
