# Data Models

Two parallel formats: **Raw** (UI, strings) and **Parsed** (engine, typed Mods)

```
RawLoadout (UI) → parseMod() → Loadout (engine) → calculateOffense() → OffenseSummary
```

## Raw Format (UI)

```typescript
RawLoadout {
  equipmentPage: RawGearPage    // 10 optional slots
  talentPage: RawTalentPage      // Talent allocations
  skillPage: RawSkillPage        // Skill selections
}

RawGear {
  gearType: "helmet" | "chest" | "neck" | "gloves" | "belt" | "boots" | "ring" | "sword" | "shield"
  affixes: string[]              // Human-readable strings
}

RawTalentTree {
  name: string
  allocatedNodes: { x, y, points }[]
}

RawSkill {
  skill: Skill                   // Derived from offensiveSkillConfs
  enabled: boolean
}
```

**Storage:** localStorage key `"tli-planner-loadout"`, no backwards compatibility required

## Parsed Format (Engine)

```typescript
Loadout {
  equipmentPage: GearPage        // Same slots, parsed Gear
  talentPage: TalentPage         // Parsed affixes
  divinityPage: DivinityPage     // Divinity slates
  customConfiguration: Affix[]
}

Gear {
  gearType: (same as RawGear)
  affixes: Affix[]               // Typed modifier objects
}

Affix {
  mods: Mod[]                    // Array of typed mods
  maxDivinity?: number
  src?: string
}
```

## Mod Types

Discriminated union with `type` field. See [src/tli/mod.ts](../src/tli/mod.ts).

**Key types:**
- `DmgPct` - Damage % (value, modType, addn)
- `FlatGearDmg` - Flat damage (damageType, dmg: {min, max})
- `CritRatingPct`, `CritDmgPct` - Crit stats
- `AspdPct`, `CspdPct` - Speed
- `Str`, `Dex`, `StrPct`, `DexPct` - Stats
- `Fervor`, `FervorEff`, `CritDmgPerFervor` - Fervor system
- `CoreTalent` - Core talent selection

**Modifier flags:**
- `addn: false` = increased (sum then multiply)
- `addn: true` = more/additive (multiply separately)

**Modifier categories:**
- `DmgModType`: global, melee, area, attack, spell, physical, cold, lightning, fire, erosion, elemental
- `CritRatingModType`: global, attack, spell

## Talent Trees

```typescript
TalentTreeData {
  name: TreeName
  nodes: TalentNodeData[]
}

TalentNodeData {
  nodeType: "micro" | "medium" | "legendary"
  rawAffix: string
  position: { x, y }
  prerequisite?: { x, y }
  maxPoints: number
  iconName: string
}
```

**TreeName:** 26 trees (professions + god/goddess), derived from const arrays in [talent_tree_types.ts](../src/tli/talent_tree_types.ts)

**Loading:** `import { loadTalentTree } from "@/src/tli/talent_tree"` (synchronous, bundled)

**Validation:** [src/tli/talent_tree.ts](../src/tli/talent_tree.ts) - column gating (3 points per column), prerequisite checks

## Skills

**Skill type:** Derived from `offensiveSkillConfs` array in [offense.ts](../src/tli/offense.ts)

**Adding new skill:** Add to `offensiveSkillConfs`, type auto-updates via `(typeof offensiveSkillConfs)[number]["skill"]`

## Type Helpers

```typescript
// Find first matching mod
const mod = findMod(mods, "DmgPct");

// Filter all matching mods
const allMods = filterMod(mods, "DmgPct");
```

Both provide automatic type narrowing.
