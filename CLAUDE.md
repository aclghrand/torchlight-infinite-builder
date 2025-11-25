# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 application built with React 19, TypeScript, and Tailwind CSS 4. It's a character build planner for "Torchlight Infinite" (TLI), a game with complex character builds involving equipment, talents, and divinity systems.

The application has two main components:

1. **Frontend UI** ([src/app/](src/app/)) - Interactive build planner interface
2. **Calculation Engine** ([src/tli/](src/tli/)) - Damage calculator that computes DPS and other offensive stats

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

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **React**: Version 19.2 (client components with hooks)
- **TypeScript**: Strict mode enabled
- **Styling**: Tailwind CSS 4 (uses @tailwindcss/postcss plugin)
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

### General Style

- **Use const arrow functions** instead of function declarations:

  ```typescript
  // ✓ Good
  const parseMod = (input: string): Mod | undefined => {
    // ...
  };

  // ✗ Avoid
  function parseMod(input: string): Mod | undefined {
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

## Detailed Documentation

For specific topics, see:

- **[docs/ui-patterns.md](docs/ui-patterns.md)** - Frontend UI patterns, React conventions, and component architecture
- **[docs/data-models.md](docs/data-models.md)** - Type definitions, data structures, and the distinction between Raw vs Parsed data
- **[docs/calculation-engine.md](docs/calculation-engine.md)** - Damage calculation system, formulas, and mod application
- **[docs/mod-parser.md](docs/mod-parser.md)** - Parser implementation, regex patterns, and adding new mod types

## Quick Reference

### Working on the UI (src/app/)

→ Read [docs/ui-patterns.md](docs/ui-patterns.md) and [docs/data-models.md](docs/data-models.md)

### Working on calculations (src/tli/stuff.ts)

→ Read [docs/calculation-engine.md](docs/calculation-engine.md) and [docs/data-models.md](docs/data-models.md)

### Working on parsers (src/tli/mod_parser.ts)

→ Read [docs/mod-parser.md](docs/mod-parser.md) and [docs/data-models.md](docs/data-models.md)

### Adding new mod types

→ Read [docs/mod-parser.md](docs/mod-parser.md) and [docs/calculation-engine.md](docs/calculation-engine.md)
