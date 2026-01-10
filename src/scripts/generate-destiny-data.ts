import { execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as cheerio from "cheerio";
import type { Destiny } from "../data/destiny/types";
import { cleanEffectText, readCodexHtml } from "./lib/codex";

const extractDestinyData = (html: string): Destiny[] => {
  const $ = cheerio.load(html);
  const items: Destiny[] = [];

  const rows = $('#destiny tbody tr[class*="thing"]');
  console.log(`Found ${rows.length} destiny rows`);

  rows.each((_, row) => {
    const tds = $(row).find("td");

    if (tds.length !== 3) {
      console.warn(`Skipping row with ${tds.length} columns (expected 3)`);
      return;
    }

    const item: Destiny = {
      type: $(tds[0]).text().trim(),
      name: $(tds[1]).text().trim(),
      affix: cleanEffectText($(tds[2]).html() || ""),
    };

    items.push(item);
  });

  return items;
};

const generateDataFile = (items: Destiny[]): string => {
  return `import type { Destiny } from "./types";

export const Destinies: readonly Destiny[] = ${JSON.stringify(items)};
`;
};

const main = async (): Promise<void> => {
  console.log("Reading HTML file...");
  const html = await readCodexHtml();

  console.log("Extracting destiny data...");
  const items = extractDestinyData(html);
  console.log(`Extracted ${items.length} destinies`);

  const outDir = join(process.cwd(), "src", "data", "destiny");
  await mkdir(outDir, { recursive: true });

  const dataPath = join(outDir, "destinies.ts");
  await writeFile(dataPath, generateDataFile(items), "utf-8");
  console.log(`Generated destinies.ts (${items.length} items)`);

  console.log("\nCode generation complete!");
  execSync("pnpm format", { stdio: "inherit" });
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });

export { main as generateDestinyData };
