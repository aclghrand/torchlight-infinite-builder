import { enumRegistry } from "./enums";
import type { CompiledTemplate } from "./types";

// Get the regex pattern for a capture type
const getCapturePattern = (type: string): string => {
  // Check for percentage suffix
  const isPercent = type.endsWith("%");
  const baseType = isPercent ? type.slice(0, -1) : type;

  // Check for signed prefix (+int, +dec)
  const isSigned = baseType.startsWith("+");
  const numericType = isSigned ? baseType.slice(1) : baseType;

  let pattern: string;
  switch (numericType) {
    case "int":
      pattern = isSigned ? "([+-]\\d+)" : "(\\d+)";
      break;
    case "dec":
      pattern = isSigned ? "([+-]\\d+(?:\\.\\d+)?)" : "(\\d+(?:\\.\\d+)?)";
      break;
    default:
      // Enum type - use word pattern
      pattern = "(\\w+)";
      break;
  }

  // For percentage types, include the % in the pattern (but outside capture group)
  return isPercent ? `${pattern}%` : pattern;
};

// Get the extractor function for a capture type
const getExtractor = (
  type: string,
  enumMappings: Map<string, Record<string, string>>,
): ((s: string) => string | number) => {
  // Check for percentage suffix
  const isPercent = type.endsWith("%");
  const baseType = isPercent ? type.slice(0, -1) : type;

  // Strip signed prefix if present (+int, +dec)
  const numericType = baseType.startsWith("+") ? baseType.slice(1) : baseType;

  switch (numericType) {
    case "int":
      return (s) => parseInt(s, 10);
    case "dec":
      return (s) => parseFloat(s);
    default: {
      // Check if there's a custom enum mapping
      const mapping = enumMappings.get(baseType);
      if (mapping) {
        return (s) => {
          const lower = s.toLowerCase();
          return mapping[lower] ?? lower;
        };
      }
      // Default: lowercase the value
      return (s) => s.toLowerCase();
    }
  }
};

// Compile a template string into a regex and extractors
export const compileTemplate = (
  template: string,
  enumMappings: Map<string, Record<string, string>>,
): CompiledTemplate => {
  const captureNames: string[] = [];
  const extractors = new Map<string, (match: string) => string | number>();

  // Process the template piece by piece
  let regexStr = "";
  let pos = 0;
  let pendingSpace = false; // Track if we have a pending space before optionals

  while (pos < template.length) {
    // Check for escape sequence: \( or \) or \\
    if (template[pos] === "\\" && pos + 1 < template.length) {
      if (pendingSpace) {
        regexStr += "\\s+";
        pendingSpace = false;
      }
      // Escape the next character literally
      regexStr += escapeRegexChar(template[pos + 1]);
      pos += 2;
      continue;
    }

    // Check for capture: {name:type}
    if (template[pos] === "{") {
      const endBrace = template.indexOf("}", pos);
      if (endBrace !== -1) {
        const captureContent = template.slice(pos + 1, endBrace);
        const colonIdx = captureContent.indexOf(":");
        if (colonIdx !== -1) {
          const name = captureContent.slice(0, colonIdx);
          const type = captureContent.slice(colonIdx + 1);

          // Flush pending space before non-optional elements
          if (pendingSpace) {
            regexStr += "\\s+";
            pendingSpace = false;
          }

          captureNames.push(name);
          extractors.set(name, getExtractor(type, enumMappings));
          regexStr += getCapturePattern(type);

          pos = endBrace + 1;
          continue;
        }
      }
    }

    // Check for optional: [content]
    if (template[pos] === "[") {
      const endBracket = findMatchingBracket(template, pos);
      if (endBracket !== -1) {
        const content = template.slice(pos + 1, endBracket);

        // Check if content is just a literal word (like "additional")
        const literalMatch = content.match(/^(\w+)$/);
        if (literalMatch) {
          // For literal words, add as a capture group so we can detect presence
          const word = literalMatch[1];
          captureNames.push(word);
          extractors.set(word, (s) => s.toLowerCase());

          if (pendingSpace) {
            regexStr += `(?:\\s+(${word}))?`;
            pendingSpace = false;
          } else {
            regexStr += `(?:(${word}))?`;
          }
        } else {
          // Recursively compile the optional content, including the pending space
          const innerCompiled = compileInner(
            content,
            enumMappings,
            captureNames,
            extractors,
          );
          if (pendingSpace) {
            regexStr += `(?:\\s+${innerCompiled})?`;
            pendingSpace = false;
          } else {
            regexStr += `(?:${innerCompiled})?`;
          }
        }

        pos = endBracket + 1;
        continue;
      }
    }

    // Check for alternation: (a|b|c)
    if (template[pos] === "(") {
      const endParen = findMatchingParen(template, pos);
      if (endParen !== -1) {
        // Flush pending space
        if (pendingSpace) {
          regexStr += "\\s+";
          pendingSpace = false;
        }

        const content = template.slice(pos + 1, endParen);
        // Use capturing group for alternation so we can extract the matched value
        // The capture name is based on position
        const altCaptureName = `_alt${captureNames.length}`;
        captureNames.push(altCaptureName);
        extractors.set(altCaptureName, (s) => s.toLowerCase());
        regexStr += `(${escapeRegexLiteral(content)})`;
        pos = endParen + 1;
        continue;
      }
    }

    // Check for whitespace - mark as pending
    if (/\s/.test(template[pos])) {
      // Skip all consecutive whitespace
      while (pos < template.length && /\s/.test(template[pos])) {
        pos++;
      }
      pendingSpace = true;
      continue;
    }

    // Regular character - flush pending space and escape if needed
    if (pendingSpace) {
      regexStr += "\\s+";
      pendingSpace = false;
    }
    regexStr += escapeRegexChar(template[pos]);
    pos++;
  }

  return { regex: new RegExp(`^${regexStr}$`, "i"), captureNames, extractors };
};

// Compile inner content (for optionals) without wrapping in ^...$
const compileInner = (
  template: string,
  enumMappings: Map<string, Record<string, string>>,
  captureNames: string[],
  extractors: Map<string, (match: string) => string | number>,
): string => {
  let regexStr = "";
  let pos = 0;

  while (pos < template.length) {
    // Check for capture: {name:type}
    if (template[pos] === "{") {
      const endBrace = template.indexOf("}", pos);
      if (endBrace !== -1) {
        const captureContent = template.slice(pos + 1, endBrace);
        const colonIdx = captureContent.indexOf(":");
        if (colonIdx !== -1) {
          const name = captureContent.slice(0, colonIdx);
          const type = captureContent.slice(colonIdx + 1);

          captureNames.push(name);
          extractors.set(name, getExtractor(type, enumMappings));
          regexStr += getCapturePattern(type);

          pos = endBrace + 1;
          continue;
        }
      }
    }

    // Check for alternation: (a|b|c)
    if (template[pos] === "(") {
      const endParen = findMatchingParen(template, pos);
      if (endParen !== -1) {
        const content = template.slice(pos + 1, endParen);
        regexStr += `(?:${escapeRegexLiteral(content)})`;
        pos = endParen + 1;
        continue;
      }
    }

    // Check for whitespace - convert to \s+
    if (/\s/.test(template[pos])) {
      while (pos < template.length && /\s/.test(template[pos])) {
        pos++;
      }
      regexStr += "\\s+";
      continue;
    }

    // Regular character - escape if needed
    regexStr += escapeRegexChar(template[pos]);
    pos++;
  }

  return regexStr;
};

// Find matching ] bracket
const findMatchingBracket = (str: string, start: number): number => {
  let depth = 1;
  let i = start + 1;
  while (i < str.length && depth > 0) {
    if (str[i] === "[") depth++;
    else if (str[i] === "]") depth--;
    i++;
  }
  return depth === 0 ? i - 1 : -1;
};

// Find matching ) parenthesis
const findMatchingParen = (str: string, start: number): number => {
  let depth = 1;
  let i = start + 1;
  while (i < str.length && depth > 0) {
    if (str[i] === "(") depth++;
    else if (str[i] === ")") depth--;
    i++;
  }
  return depth === 0 ? i - 1 : -1;
};

// Escape a single character for regex
const escapeRegexChar = (char: string): string => {
  // biome-ignore lint/suspicious/noTemplateCurlyInString: listing regex special chars, not template
  if (".*+?^${}()|[]\\".includes(char)) {
    return `\\${char}`;
  }
  return char;
};

// Escape literal text but preserve | for alternation
const escapeRegexLiteral = (str: string): string => {
  return str.replace(/[.*+?^${}()[\]\\]/g, "\\$&");
};

// Validate a captured value against an enum
export const validateEnum = (enumName: string, value: string): boolean => {
  const values = enumRegistry.get(enumName);
  if (!values) return true; // No validation if enum not registered
  return values.has(value.toLowerCase());
};
