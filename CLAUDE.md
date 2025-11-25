# CLAUDE.md

Next.js 16 + React 19 + TypeScript character build planner for Torchlight Infinite.

## Architecture

- **UI** ([src/app/](src/app/)) - React components, localStorage state
- **Calculation Engine** ([src/tli/offense.ts](src/tli/offense.ts)) - DPS/stat calculations
- **Mod Parser** ([src/tli/mod_parser.ts](src/tli/mod_parser.ts)) - String → typed Mod conversion
- **Data Models** ([src/tli/core.ts](src/tli/core.ts), [src/tli/mod.ts](src/tli/mod.ts)) - Type definitions

## Key Conventions

**Code Style:**
- Use `const` arrow functions, not `function` declarations
- Derive types from const arrays: `const X = [...] as const; type T = (typeof X)[number]`
- No backwards compatibility for localStorage schemas

**Data Flow:**
```
RawLoadout (UI, strings) → parseMod() → Loadout (typed Mods) → calculateOffense() → Results
```

**Testing:** Use existing test files, run with `pnpm test <file>`

## Common Tasks

**Add mod type:** Define in [mod.ts](src/tli/mod.ts) → parser in [mod_parser.ts](src/tli/mod_parser.ts) → handler in [offense.ts](src/tli/offense.ts) → test

**Add skill:** Add to `offensiveSkillConfs` in [offense.ts](src/tli/offense.ts), type auto-updates

**Update talent trees:** `tsx src/scripts/save_all_profession_trees.ts`

## Detailed Docs

See [docs/](docs/) for implementation details only when needed.
