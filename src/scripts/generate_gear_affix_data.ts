import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

interface RawAffix {
  equipmentSlot: string;
  equipmentType: string;
  affixType: string;
  craftingPool: string;
  tier: string;
  affix: string;
}

interface ParsedAffix {
  template: string;
  valueRanges: Array<{ min: number; max: number }>;
}

interface BaseGearAffix {
  equipmentTypeKey: string;
  equipmentSlot: string;
  equipmentType: string;
  affixType: string;
  craftingPool: string;
  tier: string;
  template: string;
  valueRanges: Array<{ min: number; max: number }>;
  rawAffix: string;
}

const normalizeEquipmentType = (type: string): string => {
  return type
    .toLowerCase()
    .replace(/\s*\(([^)]+)\)\s*/g, "_$1") // "(DEX)" → "_dex"
    .replace(/\s+/g, "_") // spaces → "_"
    .replace(/-/g, "_"); // hyphens → "_"
};

const normalizeAffixType = (type: string): string => {
  return type
    .toLowerCase()
    .replace(/\s+/g, "_"); // spaces → "_"
};

const normalizeFileKey = (equipmentType: string, affixType: string): string => {
  return normalizeEquipmentType(equipmentType) + "_" + normalizeAffixType(affixType);
};

const parseAffixString = (affix: string): ParsedAffix => {
  // First, replace <> with newline for multi-effect affixes
  let template = affix.replace(/<>/g, "\n");
  const valueRanges: Array<{ min: number; max: number }> = [];
  let placeholderIndex = 0;

  // Pattern 1 & 2: Range values like `+(17-24)` or `(-6--4)` (handles negatives)
  // Important: Match the full pattern including prefix like `+`
  const rangePattern = /`([+-]?)(\((-?\d+)-(-?\d+)\))`/g;
  template = template.replace(rangePattern, (match, prefix, _rangeWithParens, min, max) => {
    valueRanges.push({ min: parseInt(min, 10), max: parseInt(max, 10) });
    return `${prefix}{${placeholderIndex++}}`;
  });

  // Pattern 3: Fixed values (embed directly)
  const fixedPattern = /`(-?\d+(?:\.\d+)?)`/g;
  template = template.replace(fixedPattern, (match, value) => value);

  // Pattern 4: Remove remaining backticks
  template = template.replace(/`/g, "");

  // Pattern 5: Remove spaces after newlines
  template = template.replace(/\n\s+/g, "\n");

  return { template, valueRanges };
};

const toPascalCase = (str: string): string => {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
};

const generateEquipmentAffixFile = (
  fileKey: string,
  affixes: BaseGearAffix[]
): string => {
  const constName = fileKey.toUpperCase() + "_AFFIXES";
  const typeName = toPascalCase(fileKey) + "Affix";

  return `import { BaseGearAffix } from "./types";

export const ${constName} = ${JSON.stringify(affixes, null, 2)} as const satisfies readonly BaseGearAffix[];

export type ${typeName} = (typeof ${constName})[number];
`;
};

const generateIndexFile = (fileKeys: string[]): string => {
  const imports = fileKeys
    .map((key) => {
      const constName = key.toUpperCase() + "_AFFIXES";
      const typeName = toPascalCase(key) + "Affix";
      return `import { ${constName}, ${typeName} } from "./${key}";`;
    })
    .join("\n");

  const typeUnion = fileKeys.map((key) => toPascalCase(key) + "Affix").join("\n  | ");

  const exports = fileKeys.map((key) => `export * from "./${key}";`).join("\n");

  return `${imports}

export type GearAffix =
  | ${typeUnion};

export * from "./types";
export * from "./craft";

${exports}
`;
};

const generateAllAffixesFile = (fileKeys: string[]): string => {
  const imports = fileKeys
    .map((key) => {
      const constName = key.toUpperCase() + "_AFFIXES";
      return `import { ${constName} } from "./${key}";`;
    })
    .join("\n");

  const arraySpread = fileKeys.map((key) => `  ...${key.toUpperCase()}_AFFIXES,`).join("\n");

  return `${imports}

export const ALL_GEAR_AFFIXES = [
${arraySpread}
] as const;
`;
};

const generateTypesFile = (
  equipmentTypeKeys: string[],
  affixTypes: string[]
): string => {
  return `import { DmgRange } from "../core";

export type ValueRange = DmgRange;

export const AFFIX_TYPES = ${JSON.stringify(affixTypes, null, 2)} as const;

export type AffixType = (typeof AFFIX_TYPES)[number];

export const EQUIPMENT_TYPE_KEYS = ${JSON.stringify(equipmentTypeKeys.sort(), null, 2)} as const;

export type EquipmentTypeKey = (typeof EQUIPMENT_TYPE_KEYS)[number];

export interface BaseGearAffix {
  equipmentTypeKey: EquipmentTypeKey;
  equipmentSlot: string;
  equipmentType: string;
  affixType: AffixType;
  craftingPool: string;
  tier: string;
  template: string;
  valueRanges: ValueRange[];
  rawAffix: string;
}
`;
};

const generateCraftFile = (): string => {
  return `import { ValueRange } from "./types";

const interpolateValue = (range: ValueRange, percentage: number): number => {
  if (percentage < 0 || percentage > 100) {
    throw new Error(\`Percentage must be 0-100, got \${percentage}\`);
  }
  const value = range.min + (range.max - range.min) * (percentage / 100);
  return Math.round(value);
};

/**
 * Crafts a single affix string by interpolating value ranges
 *
 * @param affix - The gear affix to craft
 * @param percentage - Value from 0-100 representing crafting quality
 * @returns The final affix string with interpolated values
 *
 * @example
 * craft({ template: "+{0}% Speed", valueRanges: [{ min: 17, max: 24 }] }, 0)   // "+17% Speed"
 * craft({ template: "+{0}% Speed", valueRanges: [{ min: 17, max: 24 }] }, 50)  // "+21% Speed"
 * craft({ template: "+{0}% Speed", valueRanges: [{ min: 17, max: 24 }] }, 100) // "+24% Speed"
 */
export const craft = <T extends { template: string; valueRanges: ValueRange[] }>(
  affix: T,
  percentage: number
): string => {
  let result = affix.template;

  affix.valueRanges.forEach((range, index) => {
    const value = interpolateValue(range, percentage);
    result = result.replace(\`{\${index}}\`, value.toString());
  });

  return result;
};

/**
 * Crafts an affix and returns lines as an array (splits on \\n)
 * Useful for multi-effect affixes which have newlines in their template
 *
 * @param affix - The gear affix to craft
 * @param percentage - Value from 0-100 representing crafting quality
 * @returns Array of affix lines
 *
 * @example
 * craftLines({ template: "+{0}% Armor Pen\\n+{1}% Armor Pen for Minions", valueRanges: [{ min: 5, max: 7 }, { min: 5, max: 7 }] }, 100)
 * // ["+7% Armor Pen", "+7% Armor Pen for Minions"]
 */
export const craftLines = <T extends { template: string; valueRanges: ValueRange[] }>(
  affix: T,
  percentage: number
): string[] => {
  const crafted = craft(affix, percentage);
  return crafted.split("\\n");
};
`;
};

const main = async (): Promise<void> => {
  console.log("Reading crafting_data.json...");
  const jsonPath = join(process.cwd(), "data", "crafting_data.json");
  const rawData: RawAffix[] = JSON.parse(await readFile(jsonPath, "utf-8"));

  console.log(`Processing ${rawData.length} affixes...`);

  // Group by combination of equipmentType + affixType
  const grouped = new Map<string, BaseGearAffix[]>();
  const equipmentTypeKeysSet = new Set<string>();
  const affixTypesSet = new Set<string>();

  for (const raw of rawData) {
    const equipmentTypeKey = normalizeEquipmentType(raw.equipmentType);
    const fileKey = normalizeFileKey(raw.equipmentType, raw.affixType);

    equipmentTypeKeysSet.add(equipmentTypeKey);
    affixTypesSet.add(raw.affixType);

    const { template, valueRanges } = parseAffixString(raw.affix);

    const affixEntry: BaseGearAffix = {
      equipmentTypeKey,
      equipmentSlot: raw.equipmentSlot,
      equipmentType: raw.equipmentType,
      affixType: raw.affixType,
      craftingPool: raw.craftingPool,
      tier: raw.tier,
      template,
      valueRanges,
      rawAffix: raw.affix,
    };

    if (!grouped.has(fileKey)) {
      grouped.set(fileKey, []);
    }
    grouped.get(fileKey)!.push(affixEntry);
  }

  console.log(`Grouped into ${grouped.size} files`);

  // Create output directory
  const outDir = join(process.cwd(), "src", "tli", "gear_affix_data");
  await mkdir(outDir, { recursive: true });

  // Generate individual affix files
  const fileKeys: string[] = [];

  for (const [fileKey, affixes] of grouped) {
    fileKeys.push(fileKey);
    const fileName = fileKey + ".ts";
    const filePath = join(outDir, fileName);
    const content = generateEquipmentAffixFile(fileKey, affixes);

    await writeFile(filePath, content, "utf-8");
    console.log(`✓ Generated ${fileName} (${affixes.length} affixes)`);
  }

  // Generate types.ts
  const typesPath = join(outDir, "types.ts");
  const typesContent = generateTypesFile(
    Array.from(equipmentTypeKeysSet),
    Array.from(affixTypesSet)
  );
  await writeFile(typesPath, typesContent, "utf-8");
  console.log(`✓ Generated types.ts`);

  // Generate craft.ts
  const craftPath = join(outDir, "craft.ts");
  const craftContent = generateCraftFile();
  await writeFile(craftPath, craftContent, "utf-8");
  console.log(`✓ Generated craft.ts`);

  // Generate index.ts
  const indexPath = join(outDir, "index.ts");
  const indexContent = generateIndexFile(fileKeys.sort());
  await writeFile(indexPath, indexContent, "utf-8");
  console.log(`✓ Generated index.ts`);

  // Generate all_affixes.ts
  const allAffixesPath = join(outDir, "all_affixes.ts");
  const allAffixesContent = generateAllAffixesFile(fileKeys.sort());
  await writeFile(allAffixesPath, allAffixesContent, "utf-8");
  console.log(`✓ Generated all_affixes.ts`);

  console.log("\n✓ Code generation complete!");
  console.log(`Generated ${grouped.size} affix files with ${rawData.length} total affixes`);
};

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

export { main as generateGearAffixData };
