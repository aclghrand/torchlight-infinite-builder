# Development Guide

## Commands

```bash
pnpm dev        # Development server (http://localhost:3000)
pnpm build      # Production build
pnpm test       # Run tests
pnpm test <file> # Single test file
```

## Stack

- Next.js 16, React 19, TypeScript (strict), Tailwind CSS 4, Vitest
- Utilities: `remeda` (lodash-like), `ts-pattern` (pattern matching)

## Code Style

- **Arrow functions:** `const fn = () => {}` not `function fn() {}`
- **Type derivation:** `const X = [...] as const; type T = (typeof X)[number]` (single source of truth)
- **No localStorage migrations:** Invalidate old saves when schema changes

## Talent Trees

Update all trees: `tsx src/scripts/save_all_profession_trees.ts`

Generates TypeScript files in [src/tli/talent_data/](../src/tli/talent_data/) from tlidb.com.

## HTML Scraping (cheerio)

Scripts in [src/scripts/](../src/scripts/). Key patterns:

1. **Fix malformed HTML:** Wrap `<tbody>` in `<table>`
2. **Value ranges:** `<span class="val">` → backticks
3. **Line breaks:** Use marker (`<<BR>>`) to distinguish `<br>` from HTML whitespace
4. **Multiple classes:** `$('tr[class*="thing"]')`

Data: `data/` for JSON, `src/tli/talent_data/` for generated TS.
