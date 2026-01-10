import { describe, expect, test } from "vitest";
import { parseSupportAffixes } from "./support-mod-templates";

describe("parseSupportAffixes", () => {
  test("parse auto-used supported skills additional damage (signed)", () => {
    const result = parseSupportAffixes([
      "Auto-used supported skills +10% additional damage",
    ]);
    expect(result).toEqual([
      [
        {
          mod: { type: "DmgPct", value: 10, dmgModType: "global", addn: true },
        },
      ],
    ]);
  });

  test("parse Overload damage per focus blessing stack", () => {
    const result = parseSupportAffixes([
      "4% additional damage for the supported skill for every stack of Focus Blessing, stacking up to 8 times",
    ]);
    expect(result).toEqual([
      [
        {
          mod: {
            type: "DmgPct",
            value: 4,
            dmgModType: "global",
            addn: true,
            per: { stackable: "focus_blessing", limit: 8 },
          },
        },
      ],
    ]);
  });

  test("parse ChainLightningWebOfLightning", () => {
    const result = parseSupportAffixes([
      "For every 1 Jump, the supported skill releases 1 additional Chain Lightning (does not target the same enemy). Each Chain Lightning can only Jump 1 time(s)",
    ]);
    expect(result).toEqual([
      [{ mod: { type: "ChainLightningWebOfLightning" } }],
    ]);
  });

  test("parse ChainLightningMerge", () => {
    const result = parseSupportAffixes([
      "Multiple Chain Lightnings released by the supported skill can target the same enemy, but will prioritize different enemies. The Shotgun Effect falloff coefficient of the supported skill is 80%",
    ]);
    expect(result).toEqual([
      [{ mod: { type: "ChainLightningMerge", shotgunFalloffCoefficient: 80 } }],
    ]);
  });

  test("parse crit buff informational text returns no mods", () => {
    const result = parseSupportAffixes([
      "The supported skill gains a buff on Critical Strike. The buff lasts 2 s.",
    ]);
    expect(result).toEqual([[]]);
  });

  test("parse auto-cast while standing still returns no mods", () => {
    const result = parseSupportAffixes([
      "Automatically and continuously cast the supported skill at the nearest enemy within 25m while standing still",
    ]);
    expect(result).toEqual([[]]);
  });

  test("parse multistrike trigger returns no mods", () => {
    const result = parseSupportAffixes([
      "Triggers the supported skill upon reaching the max Multistrike Count. Interval: 0.1s",
    ]);
    expect(result).toEqual([[]]);
  });
});
