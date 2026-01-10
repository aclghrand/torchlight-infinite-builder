import type { Mod } from "../mod";
import { allParsers } from "./templates";
import type { ModParser } from "./types";

export { spec, t } from "./template";

const multi = (parsers: ModParser[]): ModParser => ({
  parse(input: string): Mod[] | undefined {
    for (const parser of parsers) {
      const result = parser.parse(input);
      if (result !== undefined) {
        return result;
      }
    }
    return undefined;
  },
});

const combinedParser = multi(allParsers);

/**
 * Parses an affix line string and returns extracted mods.
 *
 * Return value semantics:
 * - `undefined`: No parser matched the input (parse failure)
 * - `[]`: Successfully parsed, but no mods to extract (intentional no-op)
 * - `[...mods]`: Successfully parsed with one or more extracted mods
 */
export const parseMod = (input: string): Mod[] | undefined => {
  const normalized = input.trim().toLowerCase();
  return combinedParser.parse(normalized);
};
