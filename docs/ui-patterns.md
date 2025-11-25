# UI Patterns

UI in [src/app/](../src/app/): `page.tsx` (main), `layout.tsx` (root)

## React

- Client components (`"use client"`) with hooks
- Hydration safety: `mounted` state pattern + `useEffect`

## Data Flow

```typescript
RawLoadout → localStorage (JSON) → UI State → RawGearPage (10 slots) → RawGear (gearType + string affixes)
```

## Architecture

Single component ([src/app/page.tsx](../src/app/page.tsx)) with 3 sections:

1. **Gear Slot Selector** - 10 buttons, responsive grid
2. **Affix Manager** - Text input + delete, auto-removes empty gear
3. **Save/Load** - localStorage (`"tli-planner-loadout"` key), JSON serialization

## Key Patterns

**Slot → Gear Type:** `leftRing/rightRing → "ring"`, `mainHand/offHand → "sword"`, others match

**Hydration:** `mounted` state + `useEffect` to load from localStorage after mount

**State updates:** Functional updates with immutable patterns (`setLoadout(prev => ({...prev, ...}))`)

**Styling:** Tailwind CSS 4, responsive breakpoints, dark mode support
