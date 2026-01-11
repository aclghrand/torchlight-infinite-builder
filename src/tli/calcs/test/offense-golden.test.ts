import { describe, expect, it } from "vitest";
import type { SaveData } from "@/src/lib/save-data";
import type { Configuration } from "../../core";
import { loadSave } from "../../storage/load-save";
import { calculateOffense } from "../offense";
import bing2Golden from "./bing-2-golden-1.json";
import bing2Golden2 from "./bing-2-golden-2.json";
import bing2Golden3 from "./bing-2-golden-3.json";
import erika1Golden from "./erika-1-golden-1.json";
import mcTheaGolden from "./mc-thea-3-golden-1.json";
import rosaGolden from "./rosa-2-golden.json";

describe("offense golden tests", () => {
  it("rosa-2-golden: Frost Spike should calculate ~13.66 trillion DPS", () => {
    const saveData = rosaGolden as unknown as SaveData;
    const loadout = loadSave(saveData);
    const config = saveData.configurationPage as Configuration;

    const results = calculateOffense({ loadout, configuration: config });

    const frostSpike = results.skills["Frost Spike"];
    if (frostSpike === undefined) {
      throw new Error("Frost Spike skill not found in results");
    }

    const avgDps = frostSpike.attackDpsSummary?.avgDps;
    const expectedDps = 13.66e12; // ~13.66 trillion
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

    // DOT DPS: ~17.83 billion
    const dotDps = mindControl.persistentDpsSummary?.total;
    const expectedDotDps = 17.83e9;
    expect(dotDps).toBeGreaterThan(expectedDotDps * (1 - tolerance));
    expect(dotDps).toBeLessThan(expectedDotDps * (1 + tolerance));

    // DOT Duration: 2.28s
    const dotDuration = mindControl.persistentDpsSummary?.duration;
    expect(dotDuration).toBeCloseTo(2.28, 2);

    // Reap DPS: ~134.95 billion
    const reapDps = mindControl.totalReapDpsSummary?.totalReapDps;
    const expectedReapDps = 134.95e9;
    expect(reapDps).toBeGreaterThan(expectedReapDps * (1 - tolerance));
    expect(reapDps).toBeLessThan(expectedReapDps * (1 + tolerance));

    // Reap CDR Bonus: 163.25%
    const reapCdr = mindControl.totalReapDpsSummary?.reapCdrBonusPct;
    expect(reapCdr).toBeCloseTo(163.25, 0);

    // Reap Duration Bonus: 182%
    const reapDuration = mindControl.totalReapDpsSummary?.reapDurationBonusPct;
    expect(reapDuration).toBeCloseTo(182, 0);

    // Total DPS: ~152.77 billion
    const totalDps = mindControl.totalDps;
    const expectedTotalDps = 152.77e9;
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

    // Spell DPS: ~52.82 million
    const spellDps = chainLightning.spellDpsSummary?.avgDps;
    const expectedSpellDps = 52.82e6;
    expect(spellDps).toBeGreaterThan(expectedSpellDps * (1 - tolerance));
    expect(spellDps).toBeLessThan(expectedSpellDps * (1 + tolerance));

    // Spell Burst DPS: ~243.63 million
    const spellBurstDps = chainLightning.spellBurstDpsSummary?.avgDps;
    const expectedSpellBurstDps = 243.63e6;
    expect(spellBurstDps).toBeGreaterThan(
      expectedSpellBurstDps * (1 - tolerance),
    );
    expect(spellBurstDps).toBeLessThan(expectedSpellBurstDps * (1 + tolerance));

    // Ingenuity Overload DPS: ~51.11 million
    const ingenuityDps =
      chainLightning.spellBurstDpsSummary?.ingenuityOverload?.avgDps;
    const expectedIngenuityDps = 51.11e6;
    expect(ingenuityDps).toBeGreaterThan(
      expectedIngenuityDps * (1 - tolerance),
    );
    expect(ingenuityDps).toBeLessThan(expectedIngenuityDps * (1 + tolerance));

    // Total DPS: ~347.55 million
    const totalDps = chainLightning.totalDps;
    const expectedTotalDps = 347.55e6;
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

    // Spell DPS: ~681.05 million
    const spellDps = chainLightning.spellDpsSummary?.avgDps;
    const expectedSpellDps = 681.05e6;
    expect(spellDps).toBeGreaterThan(expectedSpellDps * (1 - tolerance));
    expect(spellDps).toBeLessThan(expectedSpellDps * (1 + tolerance));

    // Spell Burst DPS: ~3.52 billion
    const spellBurstDps = chainLightning.spellBurstDpsSummary?.avgDps;
    const expectedSpellBurstDps = 3.52e9;
    expect(spellBurstDps).toBeGreaterThan(
      expectedSpellBurstDps * (1 - tolerance),
    );
    expect(spellBurstDps).toBeLessThan(expectedSpellBurstDps * (1 + tolerance));

    // Ingenuity Overload DPS: ~612.33 million
    const ingenuityDps =
      chainLightning.spellBurstDpsSummary?.ingenuityOverload?.avgDps;
    const expectedIngenuityDps = 612.33e6;
    expect(ingenuityDps).toBeGreaterThan(
      expectedIngenuityDps * (1 - tolerance),
    );
    expect(ingenuityDps).toBeLessThan(expectedIngenuityDps * (1 + tolerance));

    // Total DPS: ~4.81 billion
    const totalDps = chainLightning.totalDps;
    const expectedTotalDps = 4.81e9;
    expect(totalDps).toBeGreaterThan(expectedTotalDps * (1 - tolerance));
    expect(totalDps).toBeLessThan(expectedTotalDps * (1 + tolerance));

    // Resistance checks
    const { coldRes, lightningRes, fireRes, erosionRes } = results.defenses;
    expect(coldRes).toEqual({ max: 60, potential: 60, actual: 60 });
    expect(lightningRes).toEqual({ max: 60, potential: 61, actual: 60 });
    expect(fireRes).toEqual({ max: 60, potential: 60, actual: 60 });
    expect(erosionRes).toEqual({ max: 60, potential: 63, actual: 60 });
  });

  it("bing-2-golden-3: Chain Lightning should calculate expected spell/burst DPS values", () => {
    const saveData = bing2Golden3 as unknown as SaveData;
    const loadout = loadSave(saveData);
    const config = saveData.configurationPage as Configuration;

    const results = calculateOffense({ loadout, configuration: config });

    const chainLightning = results.skills["Chain Lightning"];
    if (chainLightning === undefined) {
      throw new Error("Chain Lightning skill not found in results");
    }

    const tolerance = 0.01; // 1% tolerance

    // Spell DPS: ~25.97 billion
    const spellDps = chainLightning.spellDpsSummary?.avgDps;
    const expectedSpellDps = 25.97e9;
    expect(spellDps).toBeGreaterThan(expectedSpellDps * (1 - tolerance));
    expect(spellDps).toBeLessThan(expectedSpellDps * (1 + tolerance));

    // Spell Burst DPS: ~789.29 billion
    const spellBurstDps = chainLightning.spellBurstDpsSummary?.avgDps;
    const expectedSpellBurstDps = 789.29e9;
    expect(spellBurstDps).toBeGreaterThan(
      expectedSpellBurstDps * (1 - tolerance),
    );
    expect(spellBurstDps).toBeLessThan(expectedSpellBurstDps * (1 + tolerance));

    // Ingenuity Overload DPS: ~143.09 billion
    const ingenuityDps =
      chainLightning.spellBurstDpsSummary?.ingenuityOverload?.avgDps;
    const expectedIngenuityDps = 143.09e9;
    expect(ingenuityDps).toBeGreaterThan(
      expectedIngenuityDps * (1 - tolerance),
    );
    expect(ingenuityDps).toBeLessThan(expectedIngenuityDps * (1 + tolerance));

    // Total DPS: ~958.35 billion
    const totalDps = chainLightning.totalDps;
    const expectedTotalDps = 958.35e9;
    expect(totalDps).toBeGreaterThan(expectedTotalDps * (1 - tolerance));
    expect(totalDps).toBeLessThan(expectedTotalDps * (1 + tolerance));

    // Resistance checks (erosion-focused build with 90% max erosion res)
    const { coldRes, lightningRes, fireRes, erosionRes } = results.defenses;
    expect(coldRes).toEqual({ max: 60, potential: 9, actual: 9 });
    expect(lightningRes).toEqual({ max: 60, potential: 9, actual: 9 });
    expect(fireRes).toEqual({ max: 60, potential: 9, actual: 9 });
    expect(erosionRes).toEqual({ max: 90, potential: 275, actual: 90 });
  });

  it("erika-1-golden-1: Thunder Spike should calculate expected attack DPS values", () => {
    const saveData = erika1Golden as unknown as SaveData;
    const loadout = loadSave(saveData);
    const config = saveData.configurationPage as Configuration;

    const results = calculateOffense({ loadout, configuration: config });

    const thunderSpike = results.skills["Thunder Spike"];
    if (thunderSpike === undefined) {
      throw new Error("Thunder Spike skill not found in results");
    }

    const tolerance = 0.01; // 1% tolerance

    // Attack DPS: ~381.89 billion
    const attackDps = thunderSpike.attackDpsSummary?.avgDps;
    const expectedAttackDps = 381.89e9;
    expect(attackDps).toBeGreaterThan(expectedAttackDps * (1 - tolerance));
    expect(attackDps).toBeLessThan(expectedAttackDps * (1 + tolerance));

    // Total DPS: ~381.89 billion
    const totalDps = thunderSpike.totalDps;
    const expectedTotalDps = 381.89e9;
    expect(totalDps).toBeGreaterThan(expectedTotalDps * (1 - tolerance));
    expect(totalDps).toBeLessThan(expectedTotalDps * (1 + tolerance));

    // Resistance checks
    const { coldRes, lightningRes, fireRes, erosionRes } = results.defenses;
    expect(coldRes).toEqual({ max: 60, potential: 73, actual: 60 });
    expect(lightningRes).toEqual({ max: 60, potential: 78, actual: 60 });
    expect(fireRes).toEqual({ max: 60, potential: 69, actual: 60 });
    expect(erosionRes).toEqual({ max: 60, potential: 73, actual: 60 });
  });
});
