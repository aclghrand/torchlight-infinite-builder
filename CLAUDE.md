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
├── app/              # Next.js App Router pages
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── tli/              # Core damage calculation logic
│   ├── affix.ts      # Affix classes (modifiers for gear/talents)
│   ├── constants.ts  # Type definitions for damage/crit modifiers
│   ├── stuff.ts      # Main calculation engine
│   └── stuff.test.ts # Tests for calculations
└── util/             # Currently empty
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
- `Affix`: Modifiers that affect stats (defined as classes in [affix.ts](src/tli/affix.ts))

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
- `calculateOffense(loadout, skill)` in [stuff.ts](src/tli/stuff.ts:648-676) is the public API that returns `OffenseSummary`

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

When working with the damage calculation system:
- Affixes use a discriminated union pattern with a `type` field - create them as object literals like `{ type: "DmgPct", value: 0.5, modType: "global", addn: false }`
- Use the `findAffix` and `filterAffix` helper functions to safely extract affixes by type (pass the type string, e.g., `findAffix(affixes, "DmgPct")`)
- Damage ranges use inclusive min/max: `{ min: number, max: number }`
- Follow the "increased/additive" pattern: non-additive modifiers sum first, then additive modifiers multiply
- When adding new skills, update `offensiveSkillConfs` array and add pattern matching in `calculateSkillHit`
- When adding new affix types, add them to the discriminated union in [affix.ts](src/tli/affix.ts)
