import { describe, expect, test } from "vitest";
import { parseSupportAffixes } from "./support-mod-templates";

describe("parseSupportAffixes", () => {
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
      [
        {
          mod: {
            type: "ChainLightningWebOfLightning",
          },
        },
      ],
    ]);
  });

  test("parse ChainLightningMerge", () => {
    const result = parseSupportAffixes([
      "Multiple Chain Lightnings released by the supported skill can target the same enemy, but will prioritize different enemies. The Shotgun Effect falloff coefficient of the supported skill is 80%",
    ]);
    expect(result).toEqual([
      [
        {
          mod: {
            type: "ChainLightningMerge",
            shotgunFalloffCoefficient: 80,
          },
        },
      ],
    ]);
  });
});
