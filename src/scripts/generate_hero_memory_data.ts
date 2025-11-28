import * as cheerio from "cheerio";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { execSync } from "child_process";

interface HeroMemory {
  type: string;
  item: string;
  effect: string;
}

const cleanEffectText = (html: string): string => {
  // Replace <br> tags with spaces (not newlines) for single-line output
  let text = html.replace(/<br\s*\/?>/gi, " ");
  // Remove all other HTML tags
  text = text.replace(/<[^>]+>/g, "");
  // Fix mojibake dash: UTF-8 en-dash bytes misinterpreted as Windows-1252
  // &acirc;&euro;&ldquo; decodes to â (U+00E2) + € (U+20AC) + " (U+201C)
  text = text.replace(/\u00e2\u20ac\u201c/g, "-");
  // Decode common HTML entities
  text = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  // Normalize all whitespace (including newlines) to single spaces
  text = text.replace(/\s+/g, " ");
  return text.trim();
};

const extractHeroMemoryData = (html: string): HeroMemory[] => {
  const $ = cheerio.load(html);
  const items: HeroMemory[] = [];

  const rows = $('#heroMemory tbody tr[class*="thing"]');
  console.log(`Found ${rows.length} hero memory rows`);

  rows.each((_, row) => {
    const tds = $(row).find("td");

    if (tds.length !== 3) {
      console.warn(`Skipping row with ${tds.length} columns (expected 3)`);
      return;
    }

    const item: HeroMemory = {
      type: $(tds[0]).text().trim(),
      item: $(tds[1]).text().trim(),
      effect: cleanEffectText($(tds[2]).html() || ""),
    };

    items.push(item);
  });

  return items;
};

const generateTypesFile = (): string => {
  return `export interface HeroMemory {
  type: string;
  item: string;
  effect: string;
}
`;
};

const generateDataFile = (items: HeroMemory[]): string => {
  return `import type { HeroMemory } from "./types";

export const HeroMemories = ${JSON.stringify(items, null, 2)} as const satisfies readonly HeroMemory[];

export type HeroMemoryEntry = (typeof HeroMemories)[number];
`;
};

const generateIndexFile = (): string => {
  return `export * from "./types";
export * from "./hero_memories";
`;
};

const main = async (): Promise<void> => {
  console.log("Reading HTML file...");
  const htmlPath = join(process.cwd(), ".garbage", "codex.html");
  const html = await readFile(htmlPath, "utf-8");

  console.log("Extracting hero memory data...");
  const items = extractHeroMemoryData(html);
  console.log(`Extracted ${items.length} hero memories`);

  const outDir = join(process.cwd(), "src", "data", "hero_memory");
  await mkdir(outDir, { recursive: true });

  const typesPath = join(outDir, "types.ts");
  await writeFile(typesPath, generateTypesFile(), "utf-8");
  console.log(`Generated types.ts`);

  const dataPath = join(outDir, "hero_memories.ts");
  await writeFile(dataPath, generateDataFile(items), "utf-8");
  console.log(`Generated hero_memories.ts (${items.length} items)`);

  const indexPath = join(outDir, "index.ts");
  await writeFile(indexPath, generateIndexFile(), "utf-8");
  console.log(`Generated index.ts`);

  console.log("\nCode generation complete!");
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

export { main as generateHeroMemoryData };
