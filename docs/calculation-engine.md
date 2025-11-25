# Calculation Engine Guide

This document covers the damage calculation system in [src/tli/stuff.ts](../src/tli/stuff.ts).

## Overview

The calculation engine computes offensive stats (DPS, crit chance, etc.) from character builds. It uses **parsed** data (typed `Mod` objects), not raw strings.

## Main Entry Point

```typescript
calculateOffense(loadout: Loadout, skill: Skill, configuration: Configuration): OffenseSummary
```

**Parameters:**

- `loadout` - Complete character build with gear, talents, divinity (see [data-models.md](data-models.md))
- `skill` - The skill to calculate damage for
- `configuration` - Settings like fervor points

**Returns:**

- `OffenseSummary` - Object containing DPS, crit chance, attack speed, etc.

## Calculation Flow

1. **Collect Mods** - Gather all mods from loadout (`collectMods`)
2. **Calculate Base Damage** - Compute gear damage for each element (physical, cold, lightning, fire, erosion)
3. **Apply Percentage Modifiers** - Scale damage based on skill tags
4. **Calculate Crit Stats** - Compute crit chance and crit damage
5. **Calculate Attack Speed** - Determine attacks per second
6. **Compute Final DPS** - `avgDps = avgHitWithCrit * aspd`

## Key Concepts

### Increased vs More Modifiers

The system distinguishes via the `addn` boolean flag:

- **`addn: false` (increased)**: Modifiers sum together, then apply once
- **`addn: true` (more/additive)**: Each modifier multiplies separately

**Example:**

```
Base damage: 100
Mods: +50% increased, +30% increased, +20% more

Step 1: Sum increased mods
  100 × (1 + 0.5 + 0.3) = 180

Step 2: Apply more mods multiplicatively
  180 × (1 + 0.2) = 216 final damage
```

**Implementation:**

```typescript
const calculateDmgInc = (base: number, mods: Mod[]): number => {
  const increasedMods = filterMod(mods, "DmgPct").filter((m) => !m.addn);
  const totalInc = sumBy(increasedMods, (m) => m.value);
  return base * (1 + totalInc);
};

const calculateDmgAddn = (base: number, mods: Mod[]): number => {
  const moreMods = filterMod(mods, "DmgPct").filter((m) => m.addn);
  return moreMods.reduce((acc, m) => acc * (1 + m.value), base);
};
```

### Skill Tags

Skills have tags that determine which damage modifiers apply:

```typescript
interface Skill {
  name: string;
  tags: SkillTag[]; // e.g., ["Attack", "Melee", "Area"]
}

type SkillTag = "Attack" | "Spell" | "Melee" | "Ranged" | "Area" | "Projectile";
```

**How it works:**

- A `DmgPct` mod with `modType: "melee"` only applies to skills with `"Melee"` tag
- A `DmgPct` mod with `modType: "global"` applies to all skills
- A `DmgPct` mod with `modType: "fire"` applies to fire damage

### Damage Types

Five elemental damage types, each calculated separately:

```typescript
type DamageType = "physical" | "cold" | "lightning" | "fire" | "erosion";
```

**Damage Type Groupings:**

```typescript
const DMG_MOD_TYPES = [
  "global", // All damage
  "melee", // Melee attacks only
  "area", // Area of effect
  "attack", // Physical attacks
  "spell", // Spell-based abilities
  "physical", // Physical element
  "cold", // Cold element
  "lightning", // Lightning element
  "fire", // Fire element
  "erosion", // Erosion element
  "elemental", // All elemental (cold, lightning, fire, erosion)
] as const;
```

### Stat Scaling

Main stats provide damage bonuses:

```typescript
const STR_DMG_PER_POINT = 0.005; // 0.5% per point
const DEX_DMG_PER_POINT = 0.005;
const INT_DMG_PER_POINT = 0.005;
```

Example: 100 STR = 100 × 0.005 = 0.5 (50% increased damage)

## Special Systems

### Fervor

Optional mechanic providing crit rating bonus:

**Base Formula:**

```typescript
const BASE_CRIT_RATING_PER_FERVOR = 0.02; // 2% per point
```

**With Effectiveness Modifiers:**

```typescript
const fervorEffMods = filterMod(mods, "FervorEff");
const totalEff = sumBy(fervorEffMods, (m) => m.value);
const critRating = fervorPoints * 0.02 * (1 + totalEff);
```

**Example:**

- 100 fervor points
- +50% fervor effectiveness (`FervorEff` mod)
- Result: 100 × 0.02 × (1 + 0.5) = 3.0 (300% crit rating)

**Crit Damage Scaling:**

`CritDmgPerFervor` mods scale crit damage with fervor points (treated as "increased" modifiers):

```typescript
const critDmgPerFervorMods = filterMod(mods, "CritDmgPerFervor");
const bonusCritDmg = sumBy(critDmgPerFervorMods, (m) => m.value * fervorPoints);
```

**Important:** Fervor mechanics only apply when `configuration.fervor.enabled` is true.

### Critical Strike

**Crit Rating → Crit Chance:**

```typescript
const critChance = Math.min(critRating / 100, 1.0); // Cap at 100%
```

**Average Damage with Crit:**

```typescript
const avgDmgWithCrit =
  baseDmg * (1 - critChance) + baseDmg * critDmgMult * critChance;
```

**Crit Damage Multiplier:**

```typescript
const BASE_CRIT_DMG = 1.5; // 150% base (50% extra damage)
const critDmgMods = filterMod(mods, "CritDmgPct");
const totalCritDmg = sumBy(critDmgMods, (m) => m.value);
const critDmgMult = BASE_CRIT_DMG + totalCritDmg;
```

### Attack Speed

**Base Attack Speed:**

Comes from gear (`GearBaseAspd` mod).

**Percentage Modifiers:**

```typescript
const aspdMods = filterMod(mods, "AspdPct");
const totalAspdInc = sumBy(
  aspdMods.filter((m) => !m.addn),
  (m) => m.value,
);
const baseWithInc = baseAspd * (1 + totalAspdInc);

const aspdMoreMods = aspdMods.filter((m) => m.addn);
const finalAspd = aspdMoreMods.reduce(
  (acc, m) => acc * (1 + m.value),
  baseWithInc,
);
```

## Working with Mods

### Extracting Typed Mods

Use helper functions for type narrowing:

```typescript
// Get first matching mod
const dmgMod = findMod(mods, "DmgPct");
if (dmgMod) {
  console.log(dmgMod.value); // TypeScript knows this is DmgPct
}

// Get all matching mods
const allDmgMods = filterMod(mods, "DmgPct");
for (const mod of allDmgMods) {
  console.log(mod.modType); // TypeScript knows the shape
}
```

### Creating Mods

Use discriminated union pattern:

```typescript
const dmgMod: Mod = {
  type: "DmgPct",
  value: 0.5, // 50%
  modType: "global",
  addn: false, // Increased, not more
};

const critMod: Mod = {
  type: "CritRatingPct",
  value: 0.1, // 10%
  modType: "attack",
  addn: false,
};
```

## Adding New Mod Types

1. **Define the type** in [src/tli/mod.ts](../src/tli/mod.ts):

```typescript
export type Mod =
  | { type: "DmgPct"; value: number; modType: DmgModType; addn: boolean }
  | { type: "YourNewMod"; value: number /* other fields */ };
// ... other types
```

2. **Handle in calculations** in [src/tli/stuff.ts](../src/tli/stuff.ts):

```typescript
const yourNewMods = filterMod(mods, "YourNewMod");
const totalValue = sumBy(yourNewMods, (m) => m.value);
// Apply to calculation
```

3. **Add parser** (see [mod-parser.md](mod-parser.md))

4. **Write tests** in [src/tli/stuff.test.ts](../src/tli/stuff.test.ts)

## Adding New Skills

1. **Update skill configurations:**

```typescript
const offensiveSkillConfs: SkillConf[] = [
  { name: "Steep Strike", tags: ["Attack", "Melee"] },
  { name: "Your New Skill", tags: ["Spell", "Area"] },
  // ...
];
```

2. **Add calculation logic** (if needed):

```typescript
const calculateSkillHit = (loadout: Loadout, skill: Skill): number => {
  return match(skill.name)
    .with("Steep Strike", () => /* custom calculation */)
    .with("Your New Skill", () => /* custom calculation */)
    .otherwise(() => /* default calculation */);
};
```

## Testing Calculations

Always test with known values:

```typescript
test("calculates fire damage correctly", () => {
  const loadout: Loadout = {
    equipmentPage: {
      mainHand: {
        gearType: "sword",
        affixes: [
          {
            mods: [
              { type: "DmgPct", value: 0.5, modType: "fire", addn: false },
            ],
          },
        ],
      },
    },
    // ... rest of loadout
  };

  const result = calculateOffense(loadout, fireSkill, config);
  expect(result.avgDps).toBeCloseTo(expectedValue);
});
```

## Common Calculation Tasks

### Adding a damage modifier

Find the appropriate mod type (`DmgPct`, `FlatGearDmg`, etc.) and filter/apply it in the calculation flow.

### Changing scaling formulas

Update the calculation functions in [src/tli/stuff.ts](../src/tli/stuff.ts). Follow the increased/more pattern.

### Debugging calculations

Add console.logs at each step to verify intermediate values match expected results.

### Optimizing performance

Use memoization for expensive calculations, cache frequently-used values, minimize redundant filtering.
