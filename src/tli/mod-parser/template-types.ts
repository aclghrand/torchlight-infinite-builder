import type { LookupCaptureType } from "./type-registry";

// ============= Optional Content Parsing =============

/**
 * Parse content inside brackets to determine capture type.
 * - `{name:type}` -> `{ name?: Type }`
 * - `keyword` -> `{ keyword?: true }`
 */
type ParseOptionalContent<S extends string> =
  // Check for capture inside: {name:type}
  S extends `{${infer Name}:${infer Type}}`
    ? { [K in Name]?: LookupCaptureType<Type> }
    : // Literal flag word: [additional]
      S extends ""
      ? NonNullable<unknown>
      : { [K in S]?: true };

// ============= Required Captures Extraction =============

/**
 * Extract all required captures from template.
 * Required captures are `{name:type}` NOT inside brackets.
 *
 * Strategy: Process left-to-right, skipping optional `[...]` sections first,
 * then extracting `{name:type}` patterns.
 */
type ExtractRequiredCaptures<
  T extends string,
  Acc extends object = NonNullable<unknown>,
> = T extends `${
  infer _Before // First, skip any optional section [...] and continue after it
}[${infer _Content}]${infer Rest}`
  ? ExtractRequiredCaptures<`${_Before}${Rest}`, Acc>
  : // Now extract {name:type} patterns from what remains
    T extends `${infer _Before}{${infer Name}:${infer Type}}${infer Rest}`
    ? ExtractRequiredCaptures<
        Rest,
        Acc & { [K in Name]: LookupCaptureType<Type> }
      >
    : // No more patterns - return accumulated type
      Acc;

// ============= Optional Captures Extraction =============

/**
 * Extract all optional captures from template.
 * Finds all `[content]` patterns and parses their content.
 */
type ExtractOptionalCaptures<
  T extends string,
  Acc extends object = NonNullable<unknown>,
> = T extends `${
  infer _Before // Find [...] pattern
}[${infer Content}]${infer Rest}`
  ? ExtractOptionalCaptures<Rest, Acc & ParseOptionalContent<Content>>
  : // No more patterns
    Acc;

// ============= Combined Template Parser =============

/**
 * Parse a template string and extract the captures type.
 * Combines required captures with optional captures.
 *
 * Examples:
 * - `{value:dec%}` -> `{ value: number }`
 * - `{value:dec%} [{modType:DmgModType}]` -> `{ value: number; modType?: DmgModType }`
 * - `{value:dec%} [additional]` -> `{ value: number; additional?: true }`
 */
export type ParseTemplate<T extends string> = ExtractRequiredCaptures<T> &
  ExtractOptionalCaptures<T>;
