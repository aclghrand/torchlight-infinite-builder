# Data Models & Type Definitions

This document covers all type definitions in [src/tli/core.ts](../src/tli/core.ts) and [src/tli/mod.ts](../src/tli/mod.ts).

## Two Data Formats

The codebase uses two parallel data formats:

| Format     | Used By            | Affix Format                    | Purpose                   |
| ---------- | ------------------ | ------------------------------- | ------------------------- |
| **Raw**    | UI, localStorage   | `string[]`                      | User input, serialization |
| **Parsed** | Calculation engine | `Affix[]` (typed `Mod` objects) | Type-safe calculations    |

### Conversion Flow

```
User Input → RawLoadout → Parse → Loadout → Calculate → Results
               (UI)                 (Engine)
```

---

## Raw Data Format (UI)

Used by the frontend for state management and localStorage.

### RawLoadout

Top-level state structure:

```typescript
interface RawLoadout {
  equipmentPage: RawGearPage;
}
```

**Storage:**

- LocalStorage key: `"tli-planner-loadout"`
- Serialized as JSON

### RawGearPage

Contains up to 10 optional gear slots:

```typescript
interface RawGearPage {
  helmet?: RawGear;
  chest?: RawGear;
  neck?: RawGear;
  gloves?: RawGear;
  belt?: RawGear;
  boots?: RawGear;
  leftRing?: RawGear;
  rightRing?: RawGear;
  mainHand?: RawGear;
  offHand?: RawGear;
}
```

**Important:** Slot names (`leftRing`, `rightRing`, `mainHand`, `offHand`) don't always match gear types.

### RawGear

Individual equipment piece:

```typescript
interface RawGear {
  gearType:
    | "helmet"
    | "chest"
    | "neck"
    | "gloves"
    | "belt"
    | "boots"
    | "ring"
    | "sword"
    | "shield";
  affixes: string[]; // Human-readable strings like "+10% fire damage"
}
```

**Slot → Gear Type Mapping:**

| Slot Name   | Gear Type           |
| ----------- | ------------------- |
| `leftRing`  | `ring`              |
| `rightRing` | `ring`              |
| `mainHand`  | `sword`             |
| `offHand`   | `sword` or `shield` |
| All others  | Same as slot name   |

**Example:**

```typescript
const rawHelmet: RawGear = {
  gearType: "helmet",
  affixes: ["+10% fire damage", "+5% attack speed", "+50 strength"],
};
```

---

## Parsed Data Format (Engine)

Used by the calculation engine for type-safe computations.

### Loadout

Complete character build (parsed):

```typescript
interface Loadout {
  equipmentPage: GearPage;
  talentPage: TalentPage;
  divinityPage: DivinityPage;
  customConfiguration: Affix[];
}
```

### GearPage

Same structure as `RawGearPage`, but with parsed `Gear`:

```typescript
interface GearPage {
  helmet?: Gear;
  chest?: Gear;
  neck?: Gear;
  gloves?: Gear;
  belt?: Gear;
  boots?: Gear;
  leftRing?: Gear;
  rightRing?: Gear;
  mainHand?: Gear;
  offHand?: Gear;
}
```

### Gear

Individual equipment (parsed):

```typescript
interface Gear {
  gearType:
    | "helmet"
    | "chest"
    | "neck"
    | "gloves"
    | "belt"
    | "boots"
    | "ring"
    | "sword"
    | "shield";
  affixes: Affix[]; // Parsed modifier objects
}
```

**Example:**

```typescript
const parsedHelmet: Gear = {
  gearType: "helmet",
  affixes: [
    {
      mods: [{ type: "DmgPct", value: 0.1, modType: "fire", addn: false }],
    },
    {
      mods: [{ type: "AspdPct", value: 0.05, addn: false }],
    },
    {
      mods: [{ type: "Str", value: 50 }],
    },
  ],
};
```

### Affix

Container for mods with optional metadata:

```typescript
interface Affix {
  mods: Mod[]; // Array of typed modifiers
  maxDivinity?: number; // Optional divinity level cap
  src?: string; // Optional source identifier
}
```

**Why arrays?** Some affixes grant multiple mods. Example: "+10% fire damage and +5% cold damage"

### TalentPage

Talent tree and core talents:

```typescript
interface TalentPage {
  affixes: Affix[]; // Talent tree selections
  coreTalents: Affix[]; // Core talent selections
}
```

### DivinityPage

Divinity slates (additional modifier sources):

```typescript
interface DivinityPage {
  slates: DivinitySlate[];
}

interface DivinitySlate {
  affixes: Affix[];
}
```

---

## Mod Types

Mods are a discriminated union with a `type` field. See [src/tli/mod.ts](../src/tli/mod.ts) for complete definitions.

### Damage Mods

**DmgPct** - Percentage damage modifier:

```typescript
{
  type: "DmgPct";
  value: number; // 0.1 = 10%
  modType: DmgModType;
  addn: boolean; // false = increased, true = more
}
```

**FlatGearDmg** - Flat elemental damage:

```typescript
{
  type: "FlatGearDmg";
  damageType: "physical" | "cold" | "lightning" | "fire" | "erosion";
  dmg: {
    min: number;
    max: number;
  }
}
```

**Skill-Specific:**

- `SteepStrikeDmg` - Steep Strike damage modifier
- `SweepSlashDmg` - Sweep Slash damage modifier
- `DblDmg` - Double damage chance

### Critical Strike Mods

**CritRatingPct** - Critical strike rating:

```typescript
{
  type: "CritRatingPct";
  value: number;
  modType: "global" | "attack" | "spell";
  addn: boolean;
}
```

**CritDmgPct** - Critical damage:

```typescript
{
  type: "CritDmgPct";
  value: number; // 0.5 = +50% crit damage
  addn: boolean;
}
```

### Speed Mods

- `AspdPct` - Attack speed percentage
- `CspdPct` - Cast speed percentage
- `AspdAndCspdPct` - Both attack and cast speed
- `MinionAspdAndCspdPct` - Minion attack and cast speed

```typescript
{
  type: "AspdPct";
  value: number;
  addn: boolean;
}
```

### Attribute Mods

**Flat Stats:**

- `Str` - Flat strength
- `Dex` - Flat dexterity

**Percentage Stats:**

- `StrPct` - Percentage strength
- `DexPct` - Percentage dexterity

```typescript
{
  type: "Str";
  value: number; // Flat amount (e.g., 50)
}

{
  type: "StrPct";
  value: number; // Percentage (e.g., 0.1 = 10%)
}
```

### Fervor Mods

**Fervor** - Fervor points:

```typescript
{
  type: "Fervor";
  value: number; // Flat fervor points
}
```

**FervorEff** - Fervor effectiveness:

```typescript
{
  type: "FervorEff";
  value: number; // 0.5 = +50% effectiveness
}
```

**CritDmgPerFervor** - Crit damage per fervor point:

```typescript
{
  type: "CritDmgPerFervor";
  value: number; // e.g., 0.002 = 0.2% crit dmg per point
}
```

### Gear-Specific Mods

These come from base gear stats:

- `GearBaseCritRating` - Base crit rating on gear
- `GearBaseAspd` - Base attack speed on gear
- `GearAspdPct` - Gear's attack speed percentage
- `GearBasePhysFlatDmg` - Gear's base physical damage
- `GearPhysDmgPct` - Gear's physical damage percentage

### Defense Mods

- `AttackBlockChancePct` - Block chance for attacks
- `SpellBlockChancePct` - Block chance for spells
- `MaxLifePct` - Maximum life percentage
- `MaxEnergyShieldPct` - Maximum energy shield percentage
- `ArmorPct` - Armor percentage
- `EvasionPct` - Evasion percentage
- `LifeRegainPct` - Life regeneration percentage
- `EnergyShieldRegainPct` - Energy shield regeneration percentage

### Utility Mods

- `MultistrikeChancePct` - Multistrike chance
- `AddnMainHandDmgPct` - Main hand damage bonus
- `SteepStrikeChance` - Steep Strike proc chance

### Core Talents

**CoreTalent** - Core talent selection:

```typescript
{
  type: "CoreTalent";
  talent: "Last Stand" |
    "Dirty Tricks" |
    "Centralize" |
    "Tenacity" |
    "Hidden Mastery" |
    "Formless" |
    "Tradeoff" |
    "Unmatched Valor";
}
```

---

## Modifier Categories

### DmgModType

Damage modifiers can target specific types:

```typescript
type DmgModType =
  | "global" // All damage
  | "melee" // Melee attacks
  | "area" // Area of effect
  | "attack" // Physical attacks
  | "spell" // Spell-based
  | "physical" // Physical element
  | "cold" // Cold element
  | "lightning" // Lightning element
  | "fire" // Fire element
  | "erosion" // Erosion element
  | "elemental"; // All elemental (cold, lightning, fire, erosion)
```

**From const array:**

```typescript
export const DMG_MOD_TYPES = ["global", "melee", ...] as const;
export type DmgModType = (typeof DMG_MOD_TYPES)[number];
```

### CritRatingModType

Critical strike modifiers:

```typescript
type CritRatingModType =
  | "global" // All critical strikes
  | "attack" // Attack-based crits
  | "spell"; // Spell-based crits
```

---

## Configuration

Settings for calculations:

```typescript
interface Configuration {
  fervor: {
    enabled: boolean;
    points: number;
  };
}
```

**Fervor mechanics only apply when `enabled: true`.**

---

## Helper Types

### DmgRange

Inclusive min/max for damage ranges:

```typescript
interface DmgRange {
  min: number;
  max: number;
}
```

**Example:** `{ min: 10, max: 20 }` means 10-20 damage (both inclusive).

---

## Type Guards & Helpers

When working with mods, use type-safe helpers:

```typescript
// Find first matching mod (returns Mod | undefined)
const dmgMod = findMod(mods, "DmgPct");

// Filter all matching mods (returns Mod[])
const allDmgMods = filterMod(mods, "DmgPct");
```

Both provide automatic type narrowing.

---

## Common Patterns

### Creating an Empty Loadout

```typescript
const createEmptyLoadout = (): RawLoadout => ({
  equipmentPage: {},
});
```

### Adding Gear

```typescript
const addGear = (
  loadout: RawLoadout,
  slot: GearSlot,
  gear: RawGear,
): RawLoadout => ({
  ...loadout,
  equipmentPage: {
    ...loadout.equipmentPage,
    [slot]: gear,
  },
});
```

### Parsing Affixes

Convert string affixes to typed mods (see [mod-parser.md](mod-parser.md)):

```typescript
import { parseMod } from "@/src/tli/mod_parser";

const affixStrings = ["+10% fire damage", "+5% attack speed"];
const affixes: Affix[] = affixStrings.map((str) => {
  const mod = parseMod(str);
  if (typeof mod === "string") {
    // Handle parse error
    return { mods: [] };
  }
  return { mods: [mod] };
});
```

### Converting RawLoadout to Loadout

```typescript
const convertToLoadout = (raw: RawLoadout): Loadout => {
  const gearPage: GearPage = {};

  for (const [slot, rawGear] of Object.entries(raw.equipmentPage)) {
    if (rawGear) {
      gearPage[slot as keyof GearPage] = {
        gearType: rawGear.gearType,
        affixes: rawGear.affixes.map((str) => {
          const mod = parseMod(str);
          return typeof mod === "string" ? { mods: [] } : { mods: [mod] };
        }),
      };
    }
  }

  return {
    equipmentPage: gearPage,
    talentPage: { affixes: [], coreTalents: [] },
    divinityPage: { slates: [] },
    customConfiguration: [],
  };
};
```

---

## Adding New Types

### Adding a Gear Slot

1. Add to `RawGearPage` and `GearPage` interfaces
2. Update `GEAR_SLOTS` array in UI
3. Update `getGearType` mapping if needed

### Adding a Mod Type

1. Add to discriminated union in [src/tli/mod.ts](../src/tli/mod.ts)
2. Add parser in [src/tli/mod_parser.ts](../src/tli/mod_parser.ts)
3. Handle in calculations in [src/tli/stuff.ts](../src/tli/stuff.ts)

### Adding a Modifier Category

1. Add const array (e.g., `MY_MOD_TYPES`)
2. Derive type: `type MyModType = (typeof MY_MOD_TYPES)[number]`
3. Use in mod definitions
