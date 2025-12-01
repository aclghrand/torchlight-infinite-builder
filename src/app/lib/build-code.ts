import { deflateSync, inflateSync, strToU8, strFromU8 } from "fflate";
import { RawLoadout } from "@/src/tli/core";

const BUILD_CODE_VERSION = 1;

interface VersionedLoadout {
  v: number;
  d: RawLoadout;
}

const toBase64Url = (data: Uint8Array): string => {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};

const fromBase64Url = (str: string): Uint8Array => {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export const encodeBuildCode = (loadout: RawLoadout): string => {
  const versioned: VersionedLoadout = { v: BUILD_CODE_VERSION, d: loadout };
  const json = JSON.stringify(versioned);
  const compressed = deflateSync(strToU8(json));
  return toBase64Url(compressed);
};

export const decodeBuildCode = (code: string): RawLoadout | null => {
  try {
    const compressed = fromBase64Url(code);
    const json = strFromU8(inflateSync(compressed));
    if (!json) return null;

    const parsed = JSON.parse(json) as VersionedLoadout;

    // Version check - can add migration logic later
    if (parsed.v !== BUILD_CODE_VERSION) {
      console.warn(
        `Build code version mismatch: expected ${BUILD_CODE_VERSION}, got ${parsed.v}`,
      );
    }

    if (!parsed.d || typeof parsed.d !== "object") return null;
    if (!parsed.d.equipmentPage || !parsed.d.talentPage || !parsed.d.skillPage)
      return null;

    return parsed.d;
  } catch (error) {
    console.error("Failed to decode build code:", error);
    return null;
  }
};
