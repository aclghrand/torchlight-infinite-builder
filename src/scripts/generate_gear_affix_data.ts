import * as cheerio from "cheerio";
import { execSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

interface CraftingAffix {
  equipmentSlot: string;
  equipmentType: string;
  affixType: string;
  craftingPool: string;
  tier: string;
  affix: string;
}

interface BaseGearAffix {
  equipmentSlot: string;
  equipmentType: string;
  affixType: string;
  craftingPool: string;
  tier: string;
  craftableAffix: string;
}

/**
 * Parses the affix text from a <td> element, handling:
 * - <span class="val"> tags (remove, keep inner text with en-dash → hyphen conversion)
 * - <span class="tooltip"> tags (remove, keep inner text)
 * - <br> tags (convert to newlines)
 * - En-dashes (–) to hyphens (-)
 */
const parseAffixText = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cheerio internal type
  td: cheerio.Cheerio<any>,
  $: cheerio.CheerioAPI,
): string => {
  const clone = td.clone();

  clone.find("span.val").each((_, elem) => {
    const text = $(elem).text().replace(/–/g, "-");
    const nextSibling = elem.nextSibling;
    $(elem).replaceWith(text);

    if (
      nextSibling &&
      nextSibling.type === "text" &&
      nextSibling.data?.startsWith(" %")
    ) {
      nextSibling.data = nextSibling.data.slice(1);
    }
  });

  clone.find("span.tooltip").each((_, elem) => {
    const text = $(elem).text();
    $(elem).replaceWith(text);
  });

  let html = clone.html() || "";
  html = html.replace(/<br\s*\/?>/gi, "{REPLACEME}");

  const processed = cheerio.load(html);
  let text = processed.text();

  text = text.replace(/\n/g, "").trim();
  text = text.replace(/\s\s+/g, " ").trim();
  text = text.replace(/{REPLACEME} /g, "\n");

  // Replace various dash characters with regular hyphens
  // The HTML source contains mojibake: â€" (U+00E2 U+20AC U+201C) which should be an em-dash
  text = text.replace(/\u00e2\u20ac\u201c/g, "-");
  text = text.replace(/\u2014/g, "-"); // em-dash
  text = text.replace(/\u2013/g, "-"); // en-dash

  return text;
};

const extractCraftingData = (html: string): CraftingAffix[] => {
  const $ = cheerio.load(html);
  const affixes: CraftingAffix[] = [];

  const rows = $('#gear tbody tr[class*="thing"]');
  console.log(`Found ${rows.length} gear affix rows`);

  rows.each((_, row) => {
    const tds = $(row).find("td");

    if (tds.length !== 6) {
      console.warn(`Skipping row with ${tds.length} columns (expected 6)`);
      return;
    }

    const affix: CraftingAffix = {
      equipmentSlot: $(tds[0]).text().trim(),
      equipmentType: $(tds[1]).text().trim(),
      affixType: $(tds[2]).text().trim(),
      craftingPool: $(tds[3]).text().trim(),
      tier: $(tds[4]).text().trim(),
      affix: parseAffixText($(tds[5]), $),
    };

    affixes.push(affix);
  });

  return affixes;
};

const normalizeEquipmentType = (type: string): string => {
  return type
    .toLowerCase()
    .replace(/\s*\(([^)]+)\)\s*/g, "_$1")
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
};

const normalizeAffixType = (type: string): string => {
  return type.toLowerCase().replace(/\s+/g, "_");
};

const normalizeFileKey = (equipmentType: string, affixType: string): string => {
  return `${normalizeEquipmentType(equipmentType)}_${normalizeAffixType(affixType)}`;
};

const generateEquipmentAffixFile = (
  fileKey: string,
  affixes: BaseGearAffix[],
): string => {
  const constName = `${fileKey.toUpperCase()}_AFFIXES`;

  return `import { BaseGearAffix } from "../../tli/gear_data_types";

export const ${constName}: readonly BaseGearAffix[] = ${JSON.stringify(affixes, null, 2)};
`;
};

const generateAllAffixesFile = (fileKeys: string[]): string => {
  const imports = fileKeys
    .map((key) => {
      const constName = `${key.toUpperCase()}_AFFIXES`;
      return `import { ${constName} } from "./${key}";`;
    })
    .join("\n");

  const arraySpread = fileKeys
    .map((key) => `  ...${key.toUpperCase()}_AFFIXES,`)
    .join("\n");

  return `${imports}

export const ALL_GEAR_AFFIXES = [
${arraySpread}
] as const;
`;
};

const main = async (): Promise<void> => {
  console.log("Reading HTML file...");
  const htmlPath = join(process.cwd(), ".garbage", "codex.html");
  const html = await readFile(htmlPath, "utf-8");

  console.log("Extracting gear affix data...");
  const rawData = extractCraftingData(html);
  console.log(`Extracted ${rawData.length} affixes`);

  // Group by combination of equipmentType + affixType
  const grouped = new Map<string, BaseGearAffix[]>();

  for (const raw of rawData) {
    const fileKey = normalizeFileKey(raw.equipmentType, raw.affixType);

    const affixEntry: BaseGearAffix = {
      equipmentSlot: raw.equipmentSlot,
      equipmentType: raw.equipmentType,
      affixType: raw.affixType,
      craftingPool: raw.craftingPool,
      tier: raw.tier,
      craftableAffix: raw.affix,
    };

    if (!grouped.has(fileKey)) {
      grouped.set(fileKey, []);
    }
    grouped.get(fileKey)?.push(affixEntry);
  }

  console.log(`Grouped into ${grouped.size} files`);

  // Create output directory
  const outDir = join(process.cwd(), "src", "data", "gear_affix");
  await mkdir(outDir, { recursive: true });

  // Generate individual affix files
  const fileKeys: string[] = [];

  for (const [fileKey, affixes] of grouped) {
    fileKeys.push(fileKey);
    const fileName = `${fileKey}.ts`;
    const filePath = join(outDir, fileName);
    const content = generateEquipmentAffixFile(fileKey, affixes);

    await writeFile(filePath, content, "utf-8");
    console.log(`Generated ${fileName} (${affixes.length} affixes)`);
  }

  // Generate all_affixes.ts
  const allAffixesPath = join(outDir, "all_affixes.ts");
  const allAffixesContent = generateAllAffixesFile(fileKeys.sort());
  await writeFile(allAffixesPath, allAffixesContent, "utf-8");
  console.log(`Generated all_affixes.ts`);

  console.log("\nCode generation complete!");
  console.log(
    `Generated ${grouped.size} affix files with ${rawData.length} total affixes`,
  );

  execSync("pnpm format", { stdio: "inherit" });
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
