import { expect, test } from "vitest";
import { parseAffix } from "./affix_parser";

test("parse basic damage without type (global)", () => {
  const result = parseAffix("+9% damage");
  expect(result).toEqual({
    type: "DmgPct",
    value: 0.09,
    modType: "global",
    addn: false,
  });
});

test("parse fire damage", () => {
  const result = parseAffix("+18% fire damage");
  expect(result).toEqual({
    type: "DmgPct",
    value: 0.18,
    modType: "fire",
    addn: false,
  });
});

test("parse cold damage", () => {
  const result = parseAffix("+20% cold damage");
  expect(result).toEqual({
    type: "DmgPct",
    value: 0.20,
    modType: "cold",
    addn: false,
  });
});

test("parse lightning damage", () => {
  const result = parseAffix("+15% lightning damage");
  expect(result).toEqual({
    type: "DmgPct",
    value: 0.15,
    modType: "lightning",
    addn: false,
  });
});

test("parse attack damage", () => {
  const result = parseAffix("+15% attack damage");
  expect(result).toEqual({
    type: "DmgPct",
    value: 0.15,
    modType: "attack",
    addn: false,
  });
});

test("parse spell damage", () => {
  const result = parseAffix("+12% spell damage");
  expect(result).toEqual({
    type: "DmgPct",
    value: 0.12,
    modType: "spell",
    addn: false,
  });
});

test("parse additional attack damage", () => {
  const result = parseAffix("+9% additional attack damage");
  expect(result).toEqual({
    type: "DmgPct",
    value: 0.09,
    modType: "attack",
    addn: true,
  });
});

test("parse additional fire damage", () => {
  const result = parseAffix("+25% additional fire damage");
  expect(result).toEqual({
    type: "DmgPct",
    value: 0.25,
    modType: "fire",
    addn: true,
  });
});

test("parse additional global damage", () => {
  const result = parseAffix("+10% additional damage");
  expect(result).toEqual({
    type: "DmgPct",
    value: 0.10,
    modType: "global",
    addn: true,
  });
});

test("parse elemental damage", () => {
  const result = parseAffix("+30% elemental damage");
  expect(result).toEqual({
    type: "DmgPct",
    value: 0.30,
    modType: "elemental",
    addn: false,
  });
});

test("parse physical damage", () => {
  const result = parseAffix("+8% physical damage");
  expect(result).toEqual({
    type: "DmgPct",
    value: 0.08,
    modType: "physical",
    addn: false,
  });
});

test("parse melee damage", () => {
  const result = parseAffix("+22% melee damage");
  expect(result).toEqual({
    type: "DmgPct",
    value: 0.22,
    modType: "melee",
    addn: false,
  });
});

test("parse area damage", () => {
  const result = parseAffix("+14% area damage");
  expect(result).toEqual({
    type: "DmgPct",
    value: 0.14,
    modType: "area",
    addn: false,
  });
});

test("parse erosion damage", () => {
  const result = parseAffix("+11% erosion damage");
  expect(result).toEqual({
    type: "DmgPct",
    value: 0.11,
    modType: "erosion",
    addn: false,
  });
});

test("parse decimal percentage", () => {
  const result = parseAffix("+12.5% fire damage");
  expect(result).toEqual({
    type: "DmgPct",
    value: 0.125,
    modType: "fire",
    addn: false,
  });
});

test("parse with extra whitespace", () => {
  const result = parseAffix("  +9%   fire   damage  ");
  expect(result).toEqual({
    type: "DmgPct",
    value: 0.09,
    modType: "fire",
    addn: false,
  });
});

test("parse case insensitive damage type", () => {
  const result = parseAffix("+9% FIRE damage");
  expect(result).toEqual({
    type: "DmgPct",
    value: 0.09,
    modType: "fire",
    addn: false,
  });
});

test("parse case insensitive additional keyword", () => {
  const result = parseAffix("+9% ADDITIONAL attack damage");
  expect(result).toEqual({
    type: "DmgPct",
    value: 0.09,
    modType: "attack",
    addn: true,
  });
});

test("return undefined for invalid damage type", () => {
  const result = parseAffix("+10% invalid damage");
  expect(result).toBeUndefined();
});

test("return undefined for malformed input - missing damage word", () => {
  const result = parseAffix("+10% fire");
  expect(result).toBeUndefined();
});

test("return undefined for malformed input - no percentage", () => {
  const result = parseAffix("fire damage");
  expect(result).toBeUndefined();
});

test("return undefined for malformed input - completely wrong format", () => {
  const result = parseAffix("foo bar baz");
  expect(result).toBeUndefined();
});
