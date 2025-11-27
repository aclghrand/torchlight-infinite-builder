import LZString from "lz-string";
import { RawLoadout } from "@/src/tli/core";

const BUILD_CODE_VERSION = 1;

interface VersionedLoadout {
  v: number;
  d: RawLoadout;
}

export const encodeBuildCode = (loadout: RawLoadout): string => {
  const versioned: VersionedLoadout = { v: BUILD_CODE_VERSION, d: loadout };
  const json = JSON.stringify(versioned);
  return LZString.compressToEncodedURIComponent(json);
};

export const decodeBuildCode = (code: string): RawLoadout | null => {
  try {
    const json = LZString.decompressFromEncodedURIComponent(code);
    if (!json) return null;

    const parsed = JSON.parse(json) as VersionedLoadout;

    // Version check - can add migration logic later
    if (parsed.v !== BUILD_CODE_VERSION) {
      console.warn(
        `Build code version mismatch: expected ${BUILD_CODE_VERSION}, got ${parsed.v}`,
      );
    }

    // Basic validation
    if (!parsed.d || typeof parsed.d !== "object") return null;
    if (!parsed.d.equipmentPage || !parsed.d.talentPage || !parsed.d.skillPage)
      return null;

    return parsed.d;
  } catch (error) {
    console.error("Failed to decode build code:", error);
    return null;
  }
};
