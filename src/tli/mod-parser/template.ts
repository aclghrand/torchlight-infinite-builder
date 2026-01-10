import type { Mod, ModT } from "../mod";
import { compileTemplate, validateEnum } from "./compiler";
import type { ParseTemplate } from "./template-types";
import type {
  CompiledTemplate,
  ModParser,
  ModTypeMap,
  MultiOutput,
  MultiTemplateBuilder,
  RuntimeCaptures,
  TemplateBuilder,
} from "./types";

/**
 * Type-safe spec builder for outputMany.
 * Ensures the mod function returns the correct shape for the given mod type.
 */
export const spec = <
  TModType extends keyof ModTypeMap,
  TCaptures extends object = RuntimeCaptures,
>(
  type: TModType,
  mod: (captures: TCaptures) => Omit<ModT<TModType>, "type">,
): MultiOutput<TCaptures> => ({
  type,
  mod: mod as MultiOutput<TCaptures>["mod"],
});

interface BuilderConfig {
  template: string;
  enumMappings: Map<string, Record<string, string>>;
  customExtractors: Map<
    string,
    (match: RegExpMatchArray) => string | number | boolean
  >;
}

// Create a parser from a compiled template
const createParser = <TModType extends keyof ModTypeMap>(
  compiled: CompiledTemplate,
  modType: TModType,
  mapper:
    | ((captures: RuntimeCaptures) => Omit<ModT<TModType>, "type">)
    | undefined,
  config: BuilderConfig,
): ModParser => ({
  parse(input: string): Mod[] | undefined {
    const match = input.match(compiled.regex);
    if (!match) return undefined;

    // Extract captures
    const captures: RuntimeCaptures = {};
    for (let i = 0; i < compiled.captureNames.length; i++) {
      const name = compiled.captureNames[i];
      const value = match[i + 1];

      if (value !== undefined) {
        // Check custom extractors first
        const customExtractor = config.customExtractors.get(name);
        if (customExtractor) {
          captures[name] = customExtractor(match);
        } else {
          const extractor = compiled.extractors.get(name);
          if (extractor) {
            // Get the capture type for validation
            const captureType = getCaptureType(config.template, name);
            const baseType = captureType?.endsWith("%")
              ? captureType.slice(0, -1)
              : captureType;

            // Validate enum values BEFORE extraction (use raw lowercase value)
            if (baseType && baseType !== "int" && baseType !== "dec") {
              // For custom enum mappings, validate against mapping keys
              const customMapping = config.enumMappings.get(baseType);
              if (customMapping) {
                const lower = value.toLowerCase();
                if (!(lower in customMapping)) {
                  return undefined; // Invalid enum value
                }
              } else if (!validateEnum(baseType, value)) {
                return undefined; // Invalid enum value
              }
            }

            captures[name] = extractor(value);
          }
        }
      }
    }

    // Call any custom extractors that weren't already processed
    // (e.g., for alternation patterns that need the full match)
    for (const [name, extractor] of config.customExtractors) {
      if (captures[name] === undefined) {
        captures[name] = extractor(match);
      }
    }

    // Create the mod
    const mod = mapper
      ? { type: modType, ...mapper(captures) }
      : { type: modType, ...captures };

    return [mod as Mod];
  },
});

// Create a multi-mod parser
const createMultiModParser = (
  compiled: CompiledTemplate,
  specs: MultiOutput<RuntimeCaptures>[],
  config: BuilderConfig,
): ModParser => ({
  parse(input: string): Mod[] | undefined {
    const match = input.match(compiled.regex);
    if (!match) return undefined;

    // Extract captures
    const captures: RuntimeCaptures = {};
    for (let i = 0; i < compiled.captureNames.length; i++) {
      const name = compiled.captureNames[i];
      const value = match[i + 1];

      if (value !== undefined) {
        const customExtractor = config.customExtractors.get(name);
        if (customExtractor) {
          captures[name] = customExtractor(match);
        } else {
          const extractor = compiled.extractors.get(name);
          if (extractor) {
            // Get the capture type for validation
            const captureType = getCaptureType(config.template, name);
            const baseType = captureType?.endsWith("%")
              ? captureType.slice(0, -1)
              : captureType;

            // Validate enum values BEFORE extraction (use raw lowercase value)
            if (baseType && baseType !== "int" && baseType !== "dec") {
              const customMapping = config.enumMappings.get(baseType);
              if (customMapping) {
                const lower = value.toLowerCase();
                if (!(lower in customMapping)) {
                  return undefined;
                }
              } else if (!validateEnum(baseType, value)) {
                return undefined;
              }
            }

            captures[name] = extractor(value);
          }
        }
      }
    }

    // Create all mods
    return specs.map((spec) => ({
      type: spec.type,
      ...spec.mod(captures),
    })) as Mod[];
  },
});

// Get the capture type from a template string
const getCaptureType = (template: string, name: string): string | undefined => {
  const regex = new RegExp(`\\{${name}:(\\w+)\\}`);
  const match = template.match(regex);
  return match?.[1];
};

// Create a template builder - internal implementation uses any for flexibility
// Public API types are enforced through TemplateBuilder interface
// biome-ignore lint/suspicious/noExplicitAny: required for generic type accumulation
const createBuilder = (config: BuilderConfig): TemplateBuilder<any> => ({
  enum(name, mapping) {
    const newMappings = new Map(config.enumMappings);
    newMappings.set(name, mapping);
    return createBuilder({ ...config, enumMappings: newMappings });
  },

  capture(name, extractor) {
    const newExtractors = new Map(config.customExtractors);
    newExtractors.set(name, extractor as never);
    return createBuilder({ ...config, customExtractors: newExtractors });
  },

  output(modType, mapper) {
    const compiled = compileTemplate(config.template, config.enumMappings);
    return createParser(compiled, modType, mapper as never, config);
  },

  outputMany(specs) {
    const compiled = compileTemplate(config.template, config.enumMappings);
    return createMultiModParser(compiled, specs as never, config);
  },
});

/** Template builder factory with type-safe capture inference. */
export const t = <T extends string>(
  template: T,
): TemplateBuilder<ParseTemplate<T>> =>
  createBuilder({
    template,
    enumMappings: new Map(),
    customExtractors: new Map(),
  }) as TemplateBuilder<ParseTemplate<T>>;

// Multi-pattern support
t.multi = <TCaptures extends object = Record<string, unknown>>(
  parsers: (TemplateBuilder<TCaptures> | ModParser)[],
): MultiTemplateBuilder<TCaptures> => ({
  output(modType, mapper) {
    // Convert builders to parsers if needed
    const resolvedParsers: ModParser[] = parsers.map((p) => {
      if ("parse" in p) return p;
      // Builder without output yet - create with the provided output
      return (p as TemplateBuilder<TCaptures>).output(modType, mapper);
    });

    return {
      parse(input: string): Mod[] | undefined {
        for (const parser of resolvedParsers) {
          const result = parser.parse(input);
          if (result !== undefined) {
            return result;
          }
        }
        return undefined;
      },
    };
  },
});
