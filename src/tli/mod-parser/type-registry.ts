import type { CoreTalentName } from "../../data/core-talent";
import type {
  CritDmgModType,
  CritRatingModType,
  DmgModType,
} from "../constants";
import type {
  DmgChunkType,
  MinionDmgModType,
  ResPenType,
  ResType,
  SkillLevelType,
  StatType,
} from "../mod";

/**
 * Maps capture type specifier strings to their TypeScript types.
 * Used by template-types.ts for compile-time type inference.
 */
export interface CaptureTypeRegistry {
  // Numeric types (unsigned)
  int: number;
  dec: number;
  "int%": number;
  "dec%": number;

  // Signed numeric types (require +/- prefix in input)
  "+int": number;
  "+dec": number;
  "+int%": number;
  "+dec%": number;

  // Enum types (registered in enums.ts)
  DmgModType: DmgModType;
  CritRatingModType: CritRatingModType;
  CritDmgModType: CritDmgModType;
  DmgChunkType: DmgChunkType;
  MinionDmgModType: MinionDmgModType;
  ResPenType: ResPenType;
  ResType: ResType;
  CoreTalentName: CoreTalentName;
  SkillLevelType: SkillLevelType;

  // Special case: StatWord maps to StatType at runtime
  StatWord: StatType;
}

/**
 * Lookup the TypeScript type for a capture type specifier.
 * Falls back to `string` for unknown types.
 */
export type LookupCaptureType<T extends string> =
  T extends keyof CaptureTypeRegistry ? CaptureTypeRegistry[T] : string;
