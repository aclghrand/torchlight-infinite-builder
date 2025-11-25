# Mod Parser

Converts strings → typed Mods: `parseMod(input: string): Mod | "unrecognized" | "unimplemented"`

## Architecture

```typescript
parseMod(input) {
  const normalized = input.trim().toLowerCase();
  for (const parser of parsers) {
    const result = parser(normalized);
    if (result !== undefined) return result;
  }
  return "unrecognized";
}
```

**Parser pattern:**
```typescript
const parseXxx = (input: string): Extract<Mod, { type: "Xxx" }> | undefined => {
  const match = input.match(/^regex-pattern$/);
  if (!match) return undefined;

  return { type: "Xxx", value: parseFloat(match[1]), /* ... */ };
};
```

## Common Regex Patterns

**Percentage:**
```typescript
/^([+-])?(\d+(?:\.\d+)?)%/
```

**With optional type:**
```typescript
/^([+-])?(\d+(?:\.\d+)?)% (?:(\w+) )?damage$/
// Matches: "10% damage", "10% fire damage", "+10% global damage"
```

**With "additional" flag:**
```typescript
/^([+-])?(\d+(?:\.\d+)?)% (?:(additional) )?attack speed$/
// "additional" → addn: true, otherwise addn: false
```

**Flat value:**
```typescript
/^([+-])?(\d+(?:\.\d+)?) strength$/
```

## Sign/Value Handling

```typescript
const sign = match[1] === "-" ? -1 : 1;
const value = sign * (parseFloat(match[2]) / 100);  // For percentages
const addn = match[3] === "additional";
const modType = (match[4] || "global") as DmgModType;
```

## Adding New Parser

1. **Define mod type** in [mod.ts](../src/tli/mod.ts)
2. **Create parser function:**
   ```typescript
   const parseNewMod = (input: string): Extract<Mod, { type: "NewMod" }> | undefined => {
     const match = input.match(/^your-regex$/);
     if (!match) return undefined;
     return { type: "NewMod", value: parseFloat(match[1]) };
   };
   ```
3. **Add to parsers array** (specific before generic!)
4. **Write tests** in [mod_parser.test.ts](../src/tli/mod_parser.test.ts)
5. **Run:** `pnpm test src/tli/mod_parser.test.ts`

## Parser Ordering

**IMPORTANT:** More specific patterns must come before generic ones

```typescript
// ✓ Good
const parsers = [
  parseDmgPct,          // "10% fire damage"
  parseAspdPct,         // "10% attack speed"
  parseGenericPercent,  // "10% anything"
];

// ✗ Bad - generic matches first
const parsers = [
  parseGenericPercent,  // Matches everything, others never reached
  parseDmgPct,
  parseAspdPct,
];
```

## Testing

**ALWAYS use existing test file:** `pnpm test src/tli/mod_parser.test.ts`

**DO NOT** create ad-hoc test scripts or standalone Node scripts

**Test cases:** Basic input, +/- values, decimals, optional keywords, invalid input (should return `"unrecognized"`)
