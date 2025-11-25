# UI Patterns & Frontend Guide

This document covers React patterns, component architecture, and UI-specific conventions for the TLI build planner.

## File Location

All UI code lives in [src/app/](../src/app/):

- `page.tsx` - Main build planner component (client-side)
- `layout.tsx` - Root layout with metadata

## React Conventions

- Use client components (`"use client"`) for interactivity
- Prefer functional components with hooks
- Use TypeScript for all props and state
- Handle SSR/hydration mismatches with `mounted` state pattern

## Data Flow

The UI works with the **Raw** data format (see [data-models.md](data-models.md)):

```typescript
RawLoadout → localStorage (JSON)
     ↓
  UI State
     ↓
RawGearPage → 10 optional gear slots
     ↓
  RawGear → gearType + affixes (strings)
```

## Component Architecture

The main page ([src/app/page.tsx](../src/app/page.tsx)) is a single component with three sections:

### 1. Gear Slot Selector

Grid of 10 buttons representing equipment slots:

```typescript
const GEAR_SLOTS: { key: GearSlot; label: string }[] = [
  { key: "helmet", label: "Helmet" },
  { key: "chest", label: "Chest" },
  // ... 8 more slots
];
```

**Features:**

- Visual feedback for selected slot (blue highlight)
- Responsive grid (2 cols mobile → 5 cols desktop)
- Click to select a slot

### 2. Affix Manager

Shows affixes for currently selected slot:

**Features:**

- Text input + Add button for new affixes (arbitrary strings)
- Enter key support for quick adding
- Delete button for each affix
- Empty state message when no affixes
- Automatically removes gear when all affixes deleted

**Key Logic:**

```typescript
const handleAddAffix = () => {
  if (!newAffix.trim()) return;

  setLoadout((prev) => {
    const currentGear = prev.equipmentPage[selectedSlot];
    const updatedGear: RawGear = currentGear
      ? { ...currentGear, affixes: [...currentGear.affixes, newAffix.trim()] }
      : { gearType: getGearType(selectedSlot), affixes: [newAffix.trim()] };

    return {
      ...prev,
      equipmentPage: {
        ...prev.equipmentPage,
        [selectedSlot]: updatedGear,
      },
    };
  });
};
```

### 3. Save/Load System

LocalStorage persistence with error handling:

```typescript
const STORAGE_KEY = "tli-planner-loadout";

const saveToStorage = (loadout: RawLoadout): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loadout));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
};

const loadFromStorage = (): RawLoadout => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return createEmptyLoadout();
    return JSON.parse(stored) as RawLoadout;
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
    return createEmptyLoadout();
  }
};
```

## Important Patterns

### Slot Name to Gear Type Mapping

Slot names don't always match gear types - use this helper:

```typescript
const getGearType = (slot: GearSlot): RawGear["gearType"] => {
  if (slot === "leftRing" || slot === "rightRing") return "ring";
  if (slot === "mainHand" || slot === "offHand") return "sword";
  return slot;
};
```

**Why?** `RawGear.gearType` uses `"ring"` and `"sword"`, but slots use `"leftRing"`, `"rightRing"`, `"mainHand"`, `"offHand"`.

### Hydration Safety

Prevent SSR/client mismatches when using localStorage:

```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
  setLoadout(loadFromStorage());
}, []);

if (!mounted) return null; // Don't render until client-side
```

**Why?** `localStorage` only exists in the browser, not during SSR.

### State Management

Use React state with functional updates for complex objects:

```typescript
// ✓ Good - functional update with immutable patterns
setLoadout((prev) => ({
  ...prev,
  equipmentPage: {
    ...prev.equipmentPage,
    [selectedSlot]: updatedGear,
  },
}));

// ✗ Avoid - direct mutation
loadout.equipmentPage[selectedSlot] = updatedGear;
setLoadout(loadout);
```

## Styling Guidelines

Using Tailwind CSS 4:

- Use responsive breakpoints: `sm:`, `md:`, `lg:`
- Support dark mode: `dark:bg-zinc-800`
- Use semantic color names: `bg-blue-600`, `text-zinc-700`
- Prefer utility classes over custom CSS
- Use transitions for hover states: `transition-colors`

**Example button:**

```typescript
<button
  className={`
    px-4 py-2 rounded-lg font-medium transition-colors
    ${
      selectedSlot === key
        ? "bg-blue-600 text-white"
        : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
    }
  `}
>
  {label}
</button>
```

## Common UI Tasks

### Adding a new input field

1. Add state: `const [newField, setNewField] = useState("")`
2. Add controlled input: `<input value={newField} onChange={(e) => setNewField(e.target.value)} />`
3. Update handler to include new field in loadout

### Adding a new gear slot

1. Add to `GEAR_SLOTS` array
2. Add to `RawGearPage` interface in [src/tli/core.ts](../src/tli/core.ts)
3. Update `getGearType` if the slot name doesn't match gear type

### Displaying parsed data

To show calculated stats (DPS, etc.), you'll need to:

1. Parse `RawLoadout` → `Loadout` (see [mod-parser.md](mod-parser.md))
2. Call calculation engine (see [calculation-engine.md](calculation-engine.md))
3. Display results in a new component section

## Performance Considerations

- Use React.memo for expensive components (not needed yet)
- Debounce localStorage saves if performance becomes an issue
- Consider moving large sections into separate components as UI grows
- Use virtual scrolling if affix lists get very long

## Next Steps for UI Development

Future enhancements could include:

- Talent tree selector
- Divinity slate manager
- Skill selector
- Real-time DPS display
- Multiple build tabs
- Import/export builds (share via URL or file)
- Visual gear preview
- Affix autocomplete/suggestions
