# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Next.js 16 + React 19 + TypeScript character build planner for Torchlight Infinite.

## Commands

```bash
pnpm dev          # Development server (http://localhost:3000)
pnpm build        # Production build
pnpm test         # Run all tests
pnpm test <file>  # Run single test file
pnpm typecheck    # TypeScript type checking
pnpm lint         # Biome linting
pnpm format       # Biome formatting
```

## Architecture

- **UI Components** ([src/app/components/](src/app/components/)) - React components organized by feature (equipment, talents, skills, hero, pactspirit)
- **UI Lib** ([src/app/lib/](src/app/lib/)) - Shared types, constants, storage utilities, build-code encoding
- **Calculation Engine** ([src/tli/offense.ts](src/tli/offense.ts)) - DPS/stat calculations
- **Mod Parser** ([src/tli/mod_parser.ts](src/tli/mod_parser.ts)) - String → typed Mod conversion
- **Data Models** ([src/tli/core.ts](src/tli/core.ts), [src/tli/mod.ts](src/tli/mod.ts)) - Type definitions
- **Gear Affixes** ([src/data/gear_affix/](src/data/gear_affix/)) - Generated typed gear affixes

## Key Conventions

**Code Style:**

- Use `const` arrow functions, not `function` declarations
- Derive types from const arrays: `const X = [...] as const; type T = (typeof X)[number]`
- No backwards compatibility for localStorage schemas

**Data Flow:**

```
RawLoadout (UI, strings) → parseMod() → Loadout (typed Mods) → calculateOffense() → Results
```

## Common Tasks

**Add mod type:** Define in [mod.ts](src/tli/mod.ts) → parser in [mod_parser.ts](src/tli/mod_parser.ts) → handler in [offense.ts](src/tli/offense.ts) → test

**Add skill:** Add to `offensiveSkillConfs` in [offense.ts](src/tli/offense.ts), type auto-updates

**Update talent trees:** `pnpm exec tsx src/scripts/generate_talent_tree_data.ts`

**Regenerate gear affixes:** `pnpm exec tsx src/scripts/generate_gear_affix_data.ts`

## Code Generation Pattern

For large datasets (5k+ entries), use build-time code generation:

1. Script in `src/scripts/` reads JSON data
2. Groups/transforms data into TypeScript const arrays
3. Generates files with `satisfies readonly T[]` for type safety
4. Exports discriminated union from const array types
5. See [generate_gear_affix_data.ts](src/scripts/generate_gear_affix_data.ts) for reference

## Detailed Docs

See [.claude/docs/](.claude/docs/) for implementation details only when needed.

- prefer using undefined instead of null for typescript code
- only make code comments that explain particularly complex pieces of code or why code is written a certain way
- run `pnpm test`, `pnpm lint`, and `pnpm format` after making changes