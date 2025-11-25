# Mod Parser Implementation Guide

This document covers the mod parser in [src/tli/mod_parser.ts](../src/tli/mod_parser.ts) and how to add new parsers.

## Overview

The mod parser converts human-readable strings to typed `Mod` objects:

```typescript
parseMod(input: string): ParseResult

type ParseResult = Mod | "unrecognized" | "unimplemented";
```

**Examples:**

- Input: `"+10% fire damage"` → Output: `{ type: "DmgPct", value: 0.1, modType: "fire", addn: false }`
- Input: `"+5% additional attack speed"` → Output: `{ type: "AspdPct", value: 0.05, addn: true }`
- Input: `"gibberish"` → Output: `"unrecognized"`

## Parser Architecture

### Main Function

```typescript
export const parseMod = (input: string): ParseResult => {
  const normalized = input.trim().toLowerCase();

  for (const parser of parsers) {
    const result = parser(normalized);
    if (result !== undefined) return result;
  }

  return "unrecognized";
};
```

**Key points:**

- Input is normalized (trimmed and lowercased)
- Parsers are tried in order
- First match wins
- Returns `"unrecognized"` if no parser matches

### Parser Pattern

Each parser is a function that:

- Takes normalized input string
- Returns typed `Mod | undefined`
- Returns `undefined` if pattern doesn't match

**Type signature:**

```typescript
type ModParser = (input: string) => Mod | undefined;
```

## Writing Parsers

### Basic Pattern

```typescript
const parseYourMod = (
  input: string,
): Extract<Mod, { type: "YourMod" }> | undefined => {
  const match = input.match(/^your-regex-pattern$/);
  if (!match) return undefined;

  // Extract values from match groups
  const value = parseFloat(match[1]);

  return {
    type: "YourMod",
    value,
    // ... other fields
  };
};
```

### Regex Pattern Guidelines

**Percentage with optional prefix:**

```typescript
/^([+-])?(\d+(?:\.\d+)?)%/;
```

- `([+-])?` - Optional +/- sign (group 1)
- `(\d+(?:\.\d+)?)` - Number with optional decimal (group 2)
- `%` - Literal percent

**Percentage with optional type:**

```typescript
/^([+-])?(\d+(?:\.\d+)?)% (?:(\w+) )?damage$/;
```

- `(?:(\w+) )?` - Optional word (group 3), non-capturing outer group
- Matches: `"10% damage"`, `"10% fire damage"`, `"+10% global damage"`

**Percentage with "additional" flag:**

```typescript
/^([+-])?(\d+(?:\.\d+)?)% (?:(additional) )?attack speed$/;
```

- `(?:(additional) )?` - Optional "additional" keyword (group 3)
- Sets `addn: true` if present

**Flat value:**

```typescript
/^([+-])?(\d+(?:\.\d+)?) strength$/;
```

- No percent sign
- Just a number followed by the stat name

### Example Parsers

**Damage Percentage:**

```typescript
const parseDmgPct = (
  input: string,
): Extract<Mod, { type: "DmgPct" }> | undefined => {
  const match = input.match(
    /^([+-])?(\d+(?:\.\d+)?)% (?:(additional) )?(?:(\w+) )?damage$/,
  );
  if (!match) return undefined;

  const sign = match[1] === "-" ? -1 : 1;
  const value = sign * (parseFloat(match[2]) / 100);
  const addn = match[3] === "additional";
  const modType = (match[4] || "global") as DmgModType;

  return {
    type: "DmgPct",
    value,
    modType,
    addn,
  };
};
```

**Attack Speed:**

```typescript
const parseAspdPct = (
  input: string,
): Extract<Mod, { type: "AspdPct" }> | undefined => {
  const match = input.match(
    /^([+-])?(\d+(?:\.\d+)?)% (?:(additional) )?attack speed$/,
  );
  if (!match) return undefined;

  const sign = match[1] === "-" ? -1 : 1;
  const value = sign * (parseFloat(match[2]) / 100);
  const addn = match[3] === "additional";

  return {
    type: "AspdPct",
    value,
    addn,
  };
};
```

**Flat Strength:**

```typescript
const parseStr = (input: string): Extract<Mod, { type: "Str" }> | undefined => {
  const match = input.match(/^([+-])?(\d+(?:\.\d+)?) strength$/);
  if (!match) return undefined;

  const sign = match[1] === "-" ? -1 : 1;
  const value = sign * parseFloat(match[2]);

  return {
    type: "Str",
    value,
  };
};
```

**Critical Strike Rating:**

```typescript
const parseCritRatingPct = (
  input: string,
): Extract<Mod, { type: "CritRatingPct" }> | undefined => {
  const match = input.match(
    /^([+-])?(\d+(?:\.\d+)?)% (?:(additional) )?(?:(attack|spell|global) )?critical strike rating$/,
  );
  if (!match) return undefined;

  const sign = match[1] === "-" ? -1 : 1;
  const value = sign * (parseFloat(match[2]) / 100);
  const addn = match[3] === "additional";
  const modType = (match[4] || "global") as CritRatingModType;

  return {
    type: "CritRatingPct",
    value,
    modType,
    addn,
  };
};
```

## Adding New Parsers

### Step 1: Define Mod Type

Ensure the mod type exists in [src/tli/mod.ts](../src/tli/mod.ts):

```typescript
export type Mod =
  | { type: "DmgPct"; value: number; modType: DmgModType; addn: boolean }
  | { type: "YourNewMod"; value: number /* other fields */ };
// ...
```

### Step 2: Create Parser Function

```typescript
const parseYourNewMod = (
  input: string,
): Extract<Mod, { type: "YourNewMod" }> | undefined => {
  const match = input.match(/^your-regex$/);
  if (!match) return undefined;

  return {
    type: "YourNewMod",
    value: parseFloat(match[1]),
    // ... other fields
  };
};
```

### Step 3: Add to Parsers Array

Add your parser to the `parsers` array in order of specificity:

```typescript
const parsers: ModParser[] = [
  parseDmgPct,
  parseAspdPct,
  parseYourNewMod, // Add here
  parseStr,
  // ... other parsers
];
```

**Important:** More specific patterns should come before generic ones.

### Step 4: Write Tests

Add tests in [src/tli/mod_parser.test.ts](../src/tli/mod_parser.test.ts):

```typescript
describe("parseYourNewMod", () => {
  it("parses basic pattern", () => {
    const result = parseMod("your input string");
    expect(result).toEqual({
      type: "YourNewMod",
      value: expectedValue,
      // ...
    });
  });

  it("handles negative values", () => {
    const result = parseMod("-10 your input string");
    expect(result).toMatchObject({ value: -expectedValue });
  });

  it("returns unrecognized for invalid input", () => {
    const result = parseMod("invalid input");
    expect(result).toBe("unrecognized");
  });
});
```

## Parser Ordering

Order matters! More specific patterns must come before generic ones:

```typescript
// ✓ Good - specific before generic
const parsers = [
  parseDmgPct, // "10% fire damage"
  parseAspdPct, // "10% attack speed"
  parseGenericPercent, // "10% anything"
];

// ✗ Bad - generic parser will match first
const parsers = [
  parseGenericPercent, // Matches everything!
  parseDmgPct, // Never reached
  parseAspdPct, // Never reached
];
```

## Handling Edge Cases

### Sign Handling

Support both explicit and implicit positive:

```typescript
const sign = match[1] === "-" ? -1 : 1;
```

Examples:

- `"+10% damage"` → `value: 0.1`
- `"-10% damage"` → `value: -0.1`
- `"10% damage"` → `value: 0.1` (implicit +)

### Percentage Conversion

Convert percentages to decimal:

```typescript
const value = parseFloat(match[2]) / 100;
```

Examples:

- `"10%"` → `0.1`
- `"50%"` → `0.5`
- `"0.5%"` → `0.005`

### Optional Keywords

Use non-capturing groups with optional capture:

```typescript
/^(?:(additional) )?/; // Captures "additional" if present
```

Examples:

- `"10% attack speed"` → `addn: false`
- `"10% additional attack speed"` → `addn: true`

### Default Values

Provide defaults for optional groups:

```typescript
const modType = (match[3] || "global") as DmgModType;
```

Examples:

- `"10% damage"` → `modType: "global"`
- `"10% fire damage"` → `modType: "fire"`

## Testing Parsers

### Unit Tests

Test each parser with:

- Basic valid input
- Positive/negative values
- Decimal values
- Optional keywords present/absent
- Invalid input (should return `"unrecognized"`)

### Integration Tests

Test complete parsing flow:

```typescript
test("parses complex affix strings", () => {
  const inputs = [
    "+10% fire damage",
    "+5% additional attack speed",
    "+50 strength",
    "-10% global damage",
  ];

  const results = inputs.map(parseMod);
  expect(results).toMatchSnapshot();
});
```

## Common Parser Patterns

### Damage Modifiers

```typescript
/^([+-])?(\d+(?:\.\d+)?)% (?:(additional) )?(?:(physical|cold|lightning|fire|erosion|elemental|global|melee|area|attack|spell) )?damage$/;
```

### Speed Modifiers

```typescript
/^([+-])?(\d+(?:\.\d+)?)% (?:(additional) )?(attack|cast) speed$/;
```

### Stat Modifiers

```typescript
/^([+-])?(\d+(?:\.\d+)?)% (strength|dexterity|intelligence)$/
/^([+-])?(\d+(?:\.\d+)?) (strength|dexterity|intelligence)$/
```

### Critical Strike

```typescript
/^([+-])?(\d+(?:\.\d+)?)% (?:(additional) )?(?:(attack|spell|global) )?critical strike (rating|damage)$/;
```

## Debugging Parsers

### Check Regex Matches

```typescript
const match = input.match(/your-pattern/);
console.log(match); // See all capture groups
```

### Test Normalization

```typescript
const normalized = input.trim().toLowerCase();
console.log(normalized); // Verify normalization
```

### Verify Parser Order

Add logging to see which parser matches:

```typescript
for (const parser of parsers) {
  console.log("Trying parser:", parser.name);
  const result = parser(normalized);
  if (result !== undefined) {
    console.log("Matched:", result);
    return result;
  }
}
```

## Performance Considerations

- Parsers run sequentially until first match
- Put most common patterns first for faster parsing
- Avoid overly complex regex (keep it readable)
- Cache parsed results if parsing same strings repeatedly

## Future Improvements

Possible enhancements:

- **Caching**: Memoize parse results for repeated strings
- **Batch parsing**: Optimize for parsing many strings at once
- **Parser composition**: Combine smaller parsers for complex patterns
