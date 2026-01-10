import { execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as cheerio from "cheerio";
import type { God, Talent, Tree, Type } from "../data/talent/types";
import { cleanEffectText, readCodexHtml } from "./lib/codex";

const extractTalentData = (html: string): Talent[] => {
  const $ = cheerio.load(html);
  const items: Talent[] = [];

  const rows = $('#talent tbody tr[class*="thing"]');
  console.log(`Found ${rows.length} talent rows`);

  rows.each((_, row) => {
    const tds = $(row).find("td");

    if (tds.length !== 5) {
      console.warn(`Skipping row with ${tds.length} columns (expected 5)`);
      return;
    }

    const item: Talent = {
      god: $(tds[0]).text().trim() as God,
      tree: $(tds[1]).text().trim() as Tree,
      type: $(tds[2]).text().trim() as Type,
      name: $(tds[3]).text().trim(),
      effect: cleanEffectText($(tds[4]).html() || ""),
    };

    items.push(item);
  });

  return items;
};

const generateDataFile = (items: Talent[]): string => {
  return `import type { Talent } from "./types";

export const Talents: readonly Talent[] = ${JSON.stringify(items)};
`;
};

const main = async (): Promise<void> => {
  console.log("Reading HTML file...");
  const html = await readCodexHtml();

  console.log("Extracting talent data...");
  const items = extractTalentData(html);
  console.log(`Extracted ${items.length} talents`);

  const outDir = join(process.cwd(), "src", "data", "talent");
  await mkdir(outDir, { recursive: true });

  const dataPath = join(outDir, "talents.ts");
  await writeFile(dataPath, generateDataFile(items), "utf-8");
  console.log(`Generated talents.ts (${items.length} items)`);

  console.log("\nCode generation complete!");
  execSync("pnpm format", { stdio: "inherit" });
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });

export { main as generateTalentData };
