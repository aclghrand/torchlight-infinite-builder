# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

TanStack Start + Vite + React 19 + TypeScript character build planner for Torchlight Infinite.

## Commands

```bash
pnpm dev          # Development server (http://localhost:3000)
pnpm build        # Production build
pnpm test         # Run all tests
pnpm test <file>  # Single test file
pnpm typecheck    # TypeScript type checking
pnpm check        # Biome linting and formatting
```

## Stack

- TanStack Start, Vite, React 19, TypeScript (strict), Tailwind CSS 4, Vitest
- Utilities: `remeda` (lodash-like), `ts-pattern` (pattern matching), `fflate` (compression)

## Project Structure

```
src/routes/              # TanStack Router file-based routes
├── __root.tsx           # Root layout
├── index.tsx            # Home page (/)
├── builder.tsx          # Builder layout (/builder) - loads save, renders Outlet
└── builder/             # Nested builder routes (each section is a route)
    ├── index.tsx        # Redirect → /builder/equipment
    ├── equipment.tsx    # Equipment section
    ├── talents.tsx      # Talents layout (renders Outlet)
    ├── talents/
    │   ├── index.tsx    # Redirect → /builder/talents/slot_1
    │   └── $slot.tsx    # Dynamic slot param (slot_1, slot_2, slot_3, slot_4)
    ├── skills.tsx       # Skills section
    ├── hero.tsx         # Hero section
    ├── pactspirit.tsx   # Pactspirit section
    ├── divinity.tsx     # Divinity section
    ├── configuration.tsx # Configuration section
    └── calculations.tsx # Calculations section

src/components/          # Feature-organized React components
├── builder/             # BuilderLayout, StatsPanel
├── calculations/        # ModRow, ModGroup, StatBreakdown, SkillSelector
├── configuration/       # ConfigField, NumberInput, ConfigurationTab
├── divinity/            # DivinityTab, DivinityGrid, SlateCrafter, SlateInventory
├── equipment/           # EditGearModal, InventoryItem, AffixSlotComponent
├── hero/                # HeroTab, HeroSelector, MemoryInventory, TraitSelector
├── modals/              # ImportModal, ExportModal, DisclaimerModal, DestinySelectionModal
├── pactspirit/          # PactspiritTab, PactspiritColumn, RingSlot
├── skills/              # SkillSlot, SupportSkillSelector, SkillTooltipContent
├── talents/             # TalentGrid, PrismSection, InverseImageSection, CoreTalentSelector
├── ui/                  # Modal, Tooltip, SearchableSelect, NumberInput
├── PageTabs.tsx         # Main navigation tabs
├── SavesTab.tsx         # Save management UI
├── DebugPanel.tsx       # Debug panel component
└── Toast.tsx            # Toast notification component

src/stores/              # Zustand state management
├── builderStore/        # Main persisted store
│   ├── internal.ts      # Zustand store with persist middleware
│   ├── hooks.ts         # Public selectors (useLoadout, useBuilderState)
│   ├── selectors.ts     # Selector functions
│   ├── raw-access.ts    # Explicit raw access (useSaveDataRaw)
│   └── index.ts         # Public exports only
├── equipmentUIStore.ts  # Equipment crafting/preview state
├── talentsUIStore.ts    # Prism/inverse image crafting state
├── skillsUIStore.ts     # Skills UI state
├── heroUIStore.ts       # Hero UI state
├── divinityUIStore.ts   # Divinity UI state
└── pactspiritUIStore.ts # Pactspirit UI state

src/lib/                 # Utilities & types
├── schemas/             # Zod schemas for validation
│   ├── save-data.schema.ts
│   ├── gear.schema.ts
│   ├── skill.schema.ts
│   ├── talent.schema.ts
│   ├── hero.schema.ts
│   ├── divinity.schema.ts
│   ├── pactspirit.schema.ts
│   ├── config.schema.ts
│   ├── common.schema.ts
│   └── index.ts
├── save-data.ts         # SaveData types and factory functions
├── build-code.ts        # Build code encoding/decoding
├── types.ts             # Shared types
├── constants.ts         # App constants
├── storage.ts           # localStorage helpers
└── *-utils.ts           # Feature-specific utilities

src/hooks/               # Custom React hooks
├── useAffixSelection.ts # Affix selection logic
└── useTooltip.ts        # Tooltip positioning

src/tli/                 # Game engine (pure TypeScript, no React)
├── core.ts              # Base types (Gear, HeroMemory, etc.)
├── mod.ts               # Mod type definitions
├── constants.ts         # Engine constants
├── gear-data-types.ts   # Gear data type definitions
├── talent-tree.ts       # Talent tree utilities
├── talent-affix-utils.ts # Talent affix parsing
├── all-affixes.ts       # All affix aggregation
├── mod-parser/          # Template-based mod parsing system
│   ├── index.ts         # Public API exports
│   ├── compiler.ts      # Template → regex compiler
│   ├── template.ts      # Template parsing and matching
│   ├── templates.ts     # All mod templates
│   ├── template-types.ts # Template type definitions
│   ├── type-registry.ts # Mod type registry
│   ├── types.ts         # Core parser types
│   ├── enums.ts         # Parser enums
│   └── README.md        # Parser documentation
├── calcs/               # Calculation engine
│   ├── offense.ts       # DPS calculations
│   ├── damage-calc.ts   # Damage calculation helpers
│   ├── skill-confs.ts   # Skill configurations
│   ├── affix-collectors.ts # Affix collection utilities
│   ├── mod-utils.ts     # Mod utility functions
│   ├── util.ts          # General calc utilities
│   └── test/            # Golden tests
├── skills/              # Skill factories and mods
│   ├── types.ts         # Skill type definitions
│   ├── active-factories.ts    # Active skill mod factories
│   ├── active-mods.ts         # Active skill mod application
│   ├── passive-factories.ts   # Passive skill mod factories
│   ├── passive-mods.ts        # Passive skill mod application
│   ├── support-mod-templates.ts # Support skill mod templates
│   └── is-implemented.ts      # Skill implementation status checks
├── hero/                # Hero-related logic
│   └── hero-trait-mods.ts
├── storage/             # Save/load functionality
│   └── load-save.ts     # SaveData parsing
└── crafting/            # Gear crafting logic
    └── craft.ts

src/scripts/             # Build-time scripts (scraping, code generation)
├── lib/                 # Shared utilities (codex.ts, tlidb.ts)
├── skills/              # Skill data parsers
│   ├── active-parsers.ts
│   ├── passive-parsers.ts
│   ├── activation-medium-parser.ts
│   ├── progression-table.ts
│   ├── types.ts
│   ├── utils.ts
│   ├── index.ts
│   └── template-compiler/  # Skill template compilation
├── legendaries/         # Legendary data overrides
├── generate-*.ts        # Data generation scripts
└── fetch-*.ts           # HTML page fetchers

src/data/                # Generated TypeScript data (from scripts)
├── gear-affix/          # Gear affixes by slot/type (many files)
├── skill/               # Active, passive, support, activation medium data
├── talent-tree/         # Talent tree node data
├── talent/              # Talent affix data
├── core-talent/         # Core talent data
├── pactspirit/          # Pactspirit data
├── hero-memory/         # Hero memory data
├── hero-trait/          # Hero trait data
├── legendary/           # Legendary gear data
├── prism/               # Prism data
├── blend/               # Blend data
└── destiny/             # Destiny data
```

HTML sources from TLIDB are also cached in a gitignore'd directory: `.garbage`

## Code Style

- **Arrow functions:** `const fn = () => {}` not `function fn() {}`
- **Type derivation:** `const X = [...] as const; type T = (typeof X)[number]`
- **Use undefined:** Prefer `undefined` over `null`
- **No localStorage migrations:** Invalidate old saves when schema changes
- **Path alias:** `@/src/...` maps to project root
- Functions must have return types
- Do not rely on implicit truthiness of values for conditionals. Always make sure conditionals are using booleans instead. For example, do not do something like `if (foo) { ... }` to check if foo is defined. Instead, do `if (foo !== undefined) { ... }`
- Percentages are represented as percentage points, e.g. 25% is equivalent to 25
- Only add comments that explain complex logic or non-obvious decisions
- ALWAYS: Run `pnpm test`, `pnpm typecheck`, and `pnpm check` before finalizing changes
- NEVER throw exceptions in any code that is used by the frontend. Instead, find a reasonable default, and console.error the issue.
  - This ESPECIALLY includes any calculations like damage calculations, or loading save data into loadout, as the app cannot function without these
- For scripts in src/scripts, fail early instead of trying to infer intent

## Data Flow

```
Raw UI strings (SaveData)
    ↓ loadSave() / parseMod()  (src/tli/storage/, src/tli/mod-parser/)
Typed Loadout (engine types)
    ↓ calculateOffense()       (src/tli/calcs/offense.ts)
Results (DPS, stats)
```

Two formats coexist:

- **App layer**: Raw strings in SaveData (e.g., `"+10% fire damage"`)
- **Engine layer**: Parsed `Mod` objects in `/src/tli/`

## State Management (Zustand)

**Two-tier architecture:**

1. **Main Builder Store** (`stores/builderStore/`) - Persisted game build data
   - `internal.ts` - Zustand store with persist middleware
   - `hooks.ts` - Public selectors (`useLoadout`, `useBuilderState`)
   - `selectors.ts` - Selector functions for derived state
   - `raw-access.ts` - Explicit raw access (`useSaveDataRaw("debug" | "export")`)
   - `index.ts` - Public exports only (internal store not exported)

2. **Feature UI Stores** (`*UIStore.ts`) - Ephemeral crafting/preview state
   - Not persisted, reset on type changes
   - Examples: `equipmentUIStore`, `divinityUIStore`, `talentsUIStore`, `heroUIStore`, `skillsUIStore`, `pactspiritUIStore`
   - Note: `talentsUIStore` only holds prism/inverse image crafting state (tree slot is in URL)

**Key patterns:**

```typescript
// Get actions via hook (stable reference, won't cause re-renders)
const actions = useBuilderActions();

// Use functional updaters for immutability
actions.updateSaveData((current) => ({
  ...current,
  itemsList: [...current.itemsList, newItem],
}));

// Access via hooks, not direct store access
const loadout = useLoadout(); // Parsed data (memoized)
const currentSaveId = useCurrentSaveId();
```

## SaveData Structure

```typescript
SaveData {
  equipmentPage: GearPage           // 10 gear slots
  talentPage: TalentPage            // 4 talent trees + prisms + inverse images
  skillPage: SkillPage              // 4 active + 4 passive + support skills
  heroPage: HeroPage                // Hero + traits + hero memories
  pactspiritPage: PactspiritPage    // 3 pactspirit slots with rings
  divinityPage: DivinityPage        // Placed divinity slates

  // Inventories (global)
  itemsList: Gear[]
  heroMemoryList: HeroMemory[]
  divinitySlateList: DivinitySlate[]
  prismList: CraftedPrism[]
  inverseImageList: CraftedInverseImage[]
}
```

**Factory functions:**

```typescript
createEmptySaveData(); // Blank SaveData
createEmptyHeroPage(); // Blank HeroPage
createEmptyPactspiritSlot(); // Blank PactspiritSlot
generateItemId(); // crypto.randomUUID()
```

## Key Files by Task

| Task                   | Key Files                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| Add mod type           | `src/tli/mod.ts` → `mod-parser/templates.ts` → `calcs/offense.ts` → test                                      |
| Add skill              | `src/tli/calcs/skill-confs.ts` (skill configurations)                                                         |
| Add skill mods         | `src/tli/skills/` (active, passive, or support mods/factories) - use `/implementing-game-skill-parsers` skill |
| Add support skill mods | `src/tli/skills/support-mod-templates.ts` - uses template-based parsing                                       |
| Add utility helper     | Create `src/lib/{feature}-utils.ts`                                                                           |
| Update talent trees    | `pnpm exec tsx src/scripts/generate-talent-tree-data.ts`                                                      |
| Regenerate affixes     | `pnpm exec tsx src/scripts/generate-gear-affix-data.ts`                                                       |
| Regenerate skills      | `pnpm exec tsx src/scripts/generate-skill-data.ts`                                                            |

## Code Generation Pattern

For large datasets (5k+ entries), use build-time code generation:

1. Script in `src/scripts/` reads JSON data
2. Groups/transforms data into TypeScript const arrays
3. Generates files with `satisfies readonly T[]` for type safety
4. Exports discriminated union from const array types
5. See [generate-gear-affix-data.ts](src/scripts/generate-gear-affix-data.ts) for reference

## Testing Patterns

Tests colocated with source: `*.test.ts`

```typescript
describe("feature", () => {
  it("should do something", () => {
    const result = doSomething();
    expect(result).toEqual(expected);
  });

  it("should handle errors", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(errorCase()).toBeNull();
    consoleSpy.mockRestore();
  });
});
```

## UI Development

For UI work, read [docs/claude/ui-development.md](docs/claude/ui-development.md).

## Claude Skills

Guided workflows for common tasks (invoke with `/skill-name`):

| Skill                              | Use For                                                 |
| ---------------------------------- | ------------------------------------------------------- |
| `/adding-mod-parsers`              | Adding new mod parsers (template → Mod objects)         |
| `/adding-support-mod-parsers`      | Adding new support mod parsers (template → Mod objects) |
| `/implementing-game-skill-parsers` | Adding active/passive skill data parsers                |

## Gotchas

- **Store exports are restricted** - `builderStore/index.ts` only exports hooks and selectors, not the internal store. This prevents accidental mutations.

- **Build codes are shareable** - Compressed JSON (fflate) + base64url encoding. Version field allows future migrations.

- **No backwards compatibility** - Changing SaveData schema invalidates old builds. Users lose old saves.

- **Two data formats** - Raw strings in app layer, parsed Mods in engine layer. `loadSave()` in `src/tli/storage/load-save.ts` bridges them.
