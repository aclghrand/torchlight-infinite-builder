import * as cheerio from "cheerio";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { execSync } from "child_process";
import type { Talent } from "../data/talent/types";

const cleanEffectText = (html: string): string => {
  // Replace <br> tags with placeholder to preserve intentional line breaks
  const BR_PLACEHOLDER = "\x00";
  let text = html.replace(/<br\s*\/?>/gi, BR_PLACEHOLDER);
  // Remove all other HTML tags
  text = text.replace(/<[^>]+>/g, "");
  // Fix mojibake dash: UTF-8 en-dash bytes misinterpreted as Windows-1252
  text = text.replace(/\u00e2\u20ac\u201c/g, "-");
  // Decode common HTML entities
  text = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  // Normalize all whitespace (including source newlines) to single spaces
  text = text.replace(/\s+/g, " ");
  // Restore intentional line breaks from <br> tags
  text = text.replace(new RegExp(BR_PLACEHOLDER, "g"), "\n");
  // Clean up: trim each line and remove empty lines
  text = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
  return text.trim();
};

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
      god: $(tds[0]).text().trim(),
      tree: $(tds[1]).text().trim(),
      type: $(tds[2]).text().trim(),
      name: $(tds[3]).text().trim(),
      effect: cleanEffectText($(tds[4]).html() || ""),
    };

    items.push(item);
  });

  return items;
};

const generateDataFile = (items: Talent[]): string => {
  return `import type { Talent } from "./types";

export const Talents = ${JSON.stringify(items, null, 2)} as const satisfies readonly Talent[];

export type TalentEntry = (typeof Talents)[number];
`;
};

const main = async (): Promise<void> => {
  console.log("Reading HTML file...");
  const htmlPath = join(process.cwd(), ".garbage", "codex.html");
  const html = await readFile(htmlPath, "utf-8");

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

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

export { main as generateTalentData };
