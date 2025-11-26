# Gear Affix Data

Type-safe gear affix system for Torchlight Infinite with 5,625 affixes across 38 equipment types.

## Quick Start

```typescript
import {
  GearAffix,
  BOOTS_DEX_PREFIX_AFFIXES,
  craft,
  craftLines,
} from "@/tli/gear_affix_data";
import { ALL_GEAR_AFFIXES } from "@/tli/gear_affix_data/all_affixes";

// Get affixes for a specific equipment type
const bootsAffixes = BOOTS_DEX_PREFIX_AFFIXES;
console.log(bootsAffixes.length); // 46 affixes

// Craft an affix at specific quality (0-100%)
const affix = bootsAffixes[0];
console.log(craft(affix, 0)); // Min roll
console.log(craft(affix, 50)); // Mid roll (rounded)
console.log(craft(affix, 100)); // Max roll

// Multi-effect affixes (with newlines)
const multiEffect = ALL_GEAR_AFFIXES.find((a) => a.template.includes("\n"));
if (multiEffect) {
  console.log(craft(multiEffect, 100)); // Single string with \n
  console.log(craftLines(multiEffect, 100)); // Array of strings
}
```

## Architecture

### File Structure

- **types.ts** - Base types, interfaces, and const arrays
- **craft.ts** - `craft()` and `craftLines()` functions
- **all_affixes.ts** - Combined `ALL_GEAR_AFFIXES` array (5,625 entries)
- **index.ts** - Main exports and `GearAffix` discriminated union
- **{equipment}\_{affix_type}.ts** - 250 individual affix files

### Type System

```typescript
type GearAffix =
  | BootsDexBaseAffixAffix
  | BootsDexPrefixAffix
  | BootsDexSuffixAffix
  | ... // 250 total types

interface BaseGearAffix {
  equipmentTypeKey: EquipmentTypeKey;
  equipmentSlot: string;
  equipmentType: string;
  affixType: AffixType;
  craftingPool: string;
  tier: string;
  template: string;              // e.g., "+{0}% Cooldown Recovery Speed"
  valueRanges: ValueRange[];     // e.g., [{ min: 17, max: 24 }]
  rawAffix: string;              // Original with backticks
}
```

## Examples

### Filtering Affixes

```typescript
// By equipment slot
const allBootsAffixes = ALL_GEAR_AFFIXES.filter(
  (a) => a.equipmentSlot === "Boots"
);

// By affix type
const prefixes = ALL_GEAR_AFFIXES.filter((a) => a.affixType === "Prefix");

// By equipment type key
const ringAffixes = ALL_GEAR_AFFIXES.filter(
  (a) => a.equipmentTypeKey === "ring"
);

// Search by template content
const cooldownAffixes = ALL_GEAR_AFFIXES.filter((a) =>
  a.template.toLowerCase().includes("cooldown")
);
```

### Crafting at Different Qualities

```typescript
const affix = {
  template: "+{0}% Movement Speed",
  valueRanges: [{ min: 20, max: 25 }],
};

craft(affix, 0); // "+20% Movement Speed"
craft(affix, 50); // "+23% Movement Speed" (rounded)
craft(affix, 100); // "+25% Movement Speed"
```

### Multi-Effect Affixes

Multi-effect affixes (originally separated by `<>`) have `\n` in their template:

```typescript
const multiEffect = {
  template: "+{0}% Armor Pen\n +{1}% Armor Pen for Minions",
  valueRanges: [
    { min: 5, max: 7 },
    { min: 5, max: 7 },
  ],
};

// As single string
craft(multiEffect, 100);
// "+7% Armor Pen\n +7% Armor Pen for Minions"

// As array of lines
craftLines(multiEffect, 100);
// ["+7% Armor Pen", " +7% Armor Pen for Minions"]
```

## Data Source

Generated from `data/crafting_data.json` using:

```bash
pnpm exec tsx src/scripts/generate_gear_affix_data.ts
```

`data/crafting_data.json` itself is generated from the page source of torchcodex.com using:

```bash
pnpm exec tsx src/scripts/extract_crafting_data.ts
```

## Type Safety

```typescript
// Type narrowing works
const affix: GearAffix = BOOTS_DEX_PREFIX_AFFIXES[0];

if (affix.equipmentTypeKey === "boots_dex") {
  // TypeScript knows affix is from boots_dex
  console.log(affix.equipmentType); // "Boots (DEX)"
}

// Autocomplete works
affix.template; // IDE suggests all fields
```

## Testing

```bash
# Run all tests
pnpm test src/tli/gear_affix_data/

# Run specific test file
pnpm test src/tli/gear_affix_data/craft.test.ts
```
