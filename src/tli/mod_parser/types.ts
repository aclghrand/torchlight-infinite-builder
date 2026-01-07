import type { Mod, ModT } from "../mod";

// Runtime captures type (used internally by parser)
export interface RuntimeCaptures {
  [key: string]: string | number | boolean | undefined;
}

// Map of mod type names to their definitions (derived from Mod union)
export type ModTypeMap = {
  [M in Mod as M["type"]]: M;
};

// A compiled template ready to parse
export interface CompiledTemplate {
  regex: RegExp;
  captureNames: string[];
  extractors: Map<string, (match: string) => string | number>;
}

// Output specification for a single mod
export interface SingleOutput<TModType extends keyof ModTypeMap> {
  type: TModType;
  mod: (captures: RuntimeCaptures) => Omit<ModT<TModType>, "type">;
}

// Output specification for multi-mod templates (loosely typed return)
export interface MultiOutput<TCaptures extends object = RuntimeCaptures> {
  type: keyof ModTypeMap;
  mod: (captures: TCaptures) => Record<string, unknown>;
}

// A parser that can parse input and return mods
export interface ModParser {
  parse(input: string): Mod[] | undefined;
}

// Builder for fluent API - generic over captures type
export interface TemplateBuilder<
  TCaptures extends object = Record<string, unknown>,
> {
  // Define custom enum mapping for this template
  enum<TName extends string>(
    name: TName,
    mapping: Record<string, string>,
  ): TemplateBuilder<TCaptures>;

  // Custom capture extractor - adds/overrides the capture type
  capture<TName extends string, TValue>(
    name: TName,
    extractor: (match: RegExpMatchArray) => TValue,
  ): TemplateBuilder<TCaptures & { [K in TName]: TValue }>;

  // Output single mod - mapper receives typed captures
  output<TModType extends keyof ModTypeMap>(
    modType: TModType,
    mapper?: (captures: TCaptures) => Omit<ModT<TModType>, "type">,
  ): ModParser;

  // Output multiple mods from same template
  outputMany(specs: MultiOutput<TCaptures>[]): ModParser;
}

// Multi-pattern builder (for alternate syntaxes)
export interface MultiTemplateBuilder<
  TCaptures extends object = Record<string, unknown>,
> {
  output<TModType extends keyof ModTypeMap>(
    modType: TModType,
    mapper?: (captures: TCaptures) => Omit<ModT<TModType>, "type">,
  ): ModParser;
}
