# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 application built with React 19, TypeScript, and Tailwind CSS 4. The project appears to be a damage calculator/planner for "Torchlight Infinite" (TLI), a game with complex character builds involving equipment, talents, and divinity systems.

The core functionality is a damage calculation engine in [src/tli/](src/tli/) that computes offensive stats (DPS, crit chance, etc.) based on character loadouts.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint

# Run tests
pnpm test

# Run a single test file
pnpm test src/tli/stuff.test.ts
```

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── tli/                  # Core damage calculation logic
│   ├── affix.ts          # Affix type definitions (discriminated union)
│   ├── mods.ts          # Mod type definitions (discriminated union)
│   ├── affix_parser.ts   # Parser for converting human-readable strings to Affix objects
│   ├── affix_parser.test.ts # Tests for affix parser
│   ├── constants.ts      # Const arrays and derived types for damage/crit modifiers
│   ├── stuff.ts          # Main calculation engine
│   └── stuff.test.ts     # Tests for calculations
└── util/                 # Currently empty
```

## Architecture

### TLI Damage Calculation System

The damage calculation system in [src/tli/](src/tli/) is the heart of this application:

**Core Data Model:**

- `Loadout`: Represents a complete character build with:
  - `GearPage`: Equipment slots (helmet, chest, rings, weapons, etc.)
  - `TalentPage`: Talent tree selections and core talents
  - `DivinityPage`: Divinity slates (additional modifier sources)
  - Custom configuration affixes
- `Gear`: Individual equipment pieces with affixes
- `Affix`: Modifiers that affect stats (discriminated union in [affix.ts](src/tli/affix.ts))
- `Configuration`: Settings like fervor (enabled/disabled and points)

**Calculation Flow:**

1. Collect all affixes from loadout (`collectAffixes`)
2. Calculate gear damage for each element (physical, cold, lightning, fire, erosion)
3. Apply damage percentage modifiers based on skill tags
4. Calculate crit chance, crit damage, and attack speed
5. Compute final DPS: `avgDps = avgHitWithCrit * aspd`

**Key Concepts:**

- **Increased vs Additive modifiers**: The system distinguishes between "increased" (additive) and "more" (multiplicative) modifiers via the `addn` boolean flag
  - When `addn: false` (increased): modifiers are summed together, then applied once
  - When `addn: true` (more/additive): each modifier is applied multiplicatively
  - Example: Base damage 100, with +50% increased and +30% increased and +20% more damage
    - Increased mods sum: 100 × (1 + 0.5 + 0.3) = 180
    - More mods multiply: 180 × (1 + 0.2) = 216 final damage
  - See `calculateDmgInc` and `calculateDmgAddn` in [stuff.ts](src/tli/stuff.ts:518-524)
- **Skill tags**: Skills have tags like "Attack", "Spell", "Melee" that determine which damage modifiers apply
- **Damage types**: Five elemental damage types (physical, cold, lightning, fire, erosion) each with their own modifier chains
- **Stat scaling**: Main stats (STR, DEX, INT) provide damage bonuses at 0.5% per point

**Main Entry Point:**

- `calculateOffense(loadout, skill, configuration)` in [stuff.ts](src/tli/stuff.ts:648-676) is the public API that returns `OffenseSummary`

**Special Systems:**

- **Fervor**: Optional mechanic (enabled/disabled in `Configuration`) that provides crit rating bonus
  - Base: 2% crit rating per fervor point
  - Modified by `FervorEff` affixes (effectiveness multipliers that stack additively)
  - Example: 100 points × 2% × (1 + 0.5 FervorEff) = 3.0 (300% increased crit rating)
  - `CritDmgPerFervor` affixes scale crit damage with fervor points (treated as "increased" modifiers)
  - Both mechanics only apply when fervor is enabled

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **React**: Version 19.2
- **TypeScript**: Strict mode enabled
- **Styling**: Tailwind CSS 4 (uses new @tailwindcss/postcss plugin)
- **Testing**: Vitest
- **Utilities**:
  - `remeda`: Functional programming utilities (like lodash)
  - `ts-pattern`: Pattern matching for TypeScript

## TypeScript Configuration

- Target: ES2017
- Strict mode enabled
- Path alias: `@/*` maps to project root
- Module resolution: bundler (required for Next.js 16)

## Code Conventions

### Styling

- **Use const arrow functions** instead of function declarations:

  ```typescript
  // ✓ Good
  const parseAffix = (input: string): Affix | undefined => {
    // ...
  };

  // ✗ Avoid
  function parseAffix(input: string): Affix | undefined {
    // ...
  }
  ```

- **Single source of truth for types**: Derive types from const arrays using `as const` and `(typeof ARRAY)[number]`:

  ```typescript
  // ✓ Good - only update the array to add new types
  export const DMG_MOD_TYPES = ["global", "fire", "cold", ...] as const;
  export type DmgModType = (typeof DMG_MOD_TYPES)[number];

  // ✗ Avoid - duplication requiring updates in multiple places
  export const DMG_MOD_TYPES = ["global", "fire", "cold", ...];
  export type DmgModType = "global" | "fire" | "cold" | ...;
  ```

### Domain-Specific Conventions

When working with the damage calculation system:

- **Affixes**: Use discriminated union pattern with a `type` field - create as object literals like `{ type: "DmgPct", value: 0.5, modType: "global", addn: false }`
- **Extracting affixes**: Use `findAffix(affixes, "DmgPct")` to get first match or `filterAffix(affixes, "DmgPct")` to get all matches (both provide type narrowing)
- **Damage ranges**: Inclusive min/max `{ min: number, max: number }`
- **Modifier stacking**: "increased/additive" pattern
  - Non-additive (`addn: false`) modifiers sum first, then applied once
  - Additive (`addn: true`) modifiers multiply sequentially
- **Adding skills**: Update `offensiveSkillConfs` array and add pattern matching in `calculateSkillHit`
- **Adding affix types**:
  1. Add to discriminated union in [affix.ts](src/tli/affix.ts)
  2. Handle in calculation functions in [stuff.ts](src/tli/stuff.ts)
  3. Optionally add parser in [affix_parser.ts](src/tli/affix_parser.ts)

### Affix Parser

The affix parser ([affix_parser.ts](src/tli/affix_parser.ts)) converts human-readable strings to Affix objects:

- **Main function**: `parseAffix(input: string): ParseResult`
  - Returns: `Affix | "unrecognized" | "unimplemented"`
  - Input is automatically normalized (trimmed and lowercased)

- **Pattern**: Individual parser functions for each affix type
  - Each parser returns `AffixOfType<"TypeName"> | undefined`
  - Parsers are tried in order until one matches
  - Return `undefined` if pattern doesn't match

- **Regex Pattern Examples**:
  - Percentage with optional type: `/^([+-])?(\d+(?:\.\d+)?)% (?:(\w+) )?damage$/i`
  - Percentage with "additional": `/^([+-])?(\d+(?:\.\d+)?)% (?:(additional) )?attack speed$/i`
  - Simple percentage: `/^([+-])?(\d+(?:\.\d+)?)% armor$/i`
  - Flat value: `/^([+-])?(\d+(?:\.\d+)?) strength$/i`

- **Adding new parsers**:
  1. Create parser function returning `Extract<Affix, { type: "..." }> | undefined`
  2. Add to `parsers` array in correct position (consider specificity)
  3. Add tests in [affix_parser.test.ts](src/tli/affix_parser.test.ts)
  4. Ensure affix type exists in [affix.ts](src/tli/affix.ts) discriminated union
