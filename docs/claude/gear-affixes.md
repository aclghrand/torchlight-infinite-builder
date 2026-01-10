# Gear Affixes

Type-safe system for 5,625 gear affixes with value range interpolation.

## Structure

**Location:** `src/data/gear-affix/`

- **Generated files:** 250 equipment+affix type combinations (e.g., `boots-dex-prefix.ts`)
- **Types:** Discriminated union via `equipmentTypeKey`
- **Source:** `data/crafting_data.json`

## Key Types

```typescript
interface BaseGearAffix {
  equipmentTypeKey: EquipmentTypeKey;  // Discriminator
  template: string;                     // "+{0}% Speed"
  valueRanges: ValueRange[];            // [{ min: 17, max: 24 }]
  rawAffix: string;                     // Original with backticks
  // ... metadata fields
}

type GearAffix = BootsDexPrefixAffix | RingSuffixAffix | ... // 250 types
```

## Usage

```typescript
import { craft, craftLines } from "@/src/tli/crafting/craft";
import { ALL_GEAR_AFFIXES } from "@/src/tli/all_affixes";

craft(affix, 0); // Min roll
craft(affix, 100); // Max roll
craftLines(affix, 100); // Array of strings for multi-effect
```

## Template System

- Ranges: `` `+(17-24)` `` → `+{0}`, valueRanges: `[{min:17, max:24}]`
- Fixed: `` `20` `` → `20` (embedded)
- Multi-effect: `<>` → `\n` (newline, spaces after `\n` removed)
- Craft interpolates with `Math.round(min + (max - min) * percentage / 100)`

## Regeneration

When `data/crafting_data.json` changes:

```bash
pnpm exec tsx src/scripts/generate_gear_affix_data.ts
```

Parsing logic in script:

1. Replace `<>` with `\n`
2. Extract ranges: `/`([+-]?)(\((-?\d+)-(-?\d+)\))`/g`
3. Embed fixed values: `/`(-?\d+(?:\.\d+)?)`/g`
4. Remove backticks
5. Trim spaces after newlines: `/\n\s+/g`
