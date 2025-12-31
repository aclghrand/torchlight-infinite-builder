import { describe, expect, test } from "vitest";
import { scaleTalentAffix } from "./talent-affix-utils";

describe("scaleTalentAffix", () => {
  test("scales basic numeric values", () => {
    const result = scaleTalentAffix("+8% Movement Speed", 2, "test");
    expect(result.affixLines[0].text).toBe("+16% Movement Speed");
  });

  test("scales decimal values preserving precision", () => {
    const result = scaleTalentAffix(
      "Reaps 0.09 s of Damage Over Time",
      3,
      "test",
    );
    expect(result.affixLines[0].text).toBe("Reaps 0.27 s of Damage Over Time");
  });

  test("does NOT scale cooldown values with 's cooldown' pattern", () => {
    const result = scaleTalentAffix(
      "Reaps 0.09 s of Damage Over Time when dealing Damage Over Time. The effect has a 6 s cooldown against the same target",
      3,
      "test",
    );
    // 0.09 should be scaled to 0.27, but 6 should remain 6
    expect(result.affixLines[0].text).toBe(
      "Reaps 0.27 s of Damage Over Time when dealing Damage Over Time. The effect has a 6 s cooldown against the same target",
    );
  });

  test("does NOT scale cooldown values with 'Cooldown:' pattern", () => {
    const result = scaleTalentAffix(
      "Gains additional Fervor Rating equal to 25% of the current Fervor Rating on hit. Cooldown: 0.3 s",
      2,
      "test",
    );
    // 25 should be scaled to 50, but 0.3 should remain 0.3
    expect(result.affixLines[0].text).toBe(
      "Gains additional Fervor Rating equal to 50% of the current Fervor Rating on hit. Cooldown: 0.3 s",
    );
  });

  test("scales Cooldown Recovery Speed values (these SHOULD scale)", () => {
    const result = scaleTalentAffix("+8% Cooldown Recovery Speed", 2, "test");
    // Cooldown Recovery Speed values should be scaled
    expect(result.affixLines[0].text).toBe("+16% Cooldown Recovery Speed");
  });

  test("uses minimum of 1 for scaling when points is 0", () => {
    const result = scaleTalentAffix("+8% Movement Speed", 0, "test");
    expect(result.affixLines[0].text).toBe("+8% Movement Speed");
  });
});
