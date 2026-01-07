import { execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as cheerio from "cheerio";
import type { Prism } from "../data/prism/types";
import { cleanEffectText, readCodexHtml } from "./lib/codex";

const extractPrismData = (html: string): Prism[] => {
  const $ = cheerio.load(html);
  const items: Prism[] = [];

  const rows = $('#etherealPrism tbody tr[class*="thing"]');
  console.log(`Found ${rows.length} prism rows`);

  rows.each((_, row) => {
    const tds = $(row).find("td");

    if (tds.length !== 3) {
      console.warn(`Skipping row with ${tds.length} columns (expected 3)`);
      return;
    }

    const affixTd = $(tds[2]);
    const item: Prism = {
      type: $(tds[0]).text().trim(),
      rarity: $(tds[1]).text().trim(),
      affix: cleanEffectText(affixTd.html() || ""),
    };

    // Extract replacement core talent if present
    const tooltipSpan = affixTd.find("span.tooltip");
    if (
      tooltipSpan.length > 0 &&
      item.affix.includes("Replaces the Core Talent")
    ) {
      const name = tooltipSpan.text().trim();
      const rawAffix = tooltipSpan.attr("data-title") || "";
      if (name !== "" && rawAffix !== "") {
        item.replacementCoreTalent = {
          name,
          affix: cleanEffectText(rawAffix),
        };
      }
    }

    // Extract added core talent affix if present
    const addedPrefix = "Adds an additional effect to the Core Talent";
    if (item.affix.startsWith(addedPrefix)) {
      const delimiter = "Advanced Talent Panel:\n";
      const delimiterIndex = item.affix.indexOf(delimiter);
      if (delimiterIndex !== -1) {
        item.addedCoreTalentAffix = item.affix.slice(
          delimiterIndex + delimiter.length,
        );
      }
    }

    items.push(item);
  });

  return items;
};

const generateDataFile = (items: Prism[]): string => {
  return `import type { Prism } from "./types";

export const Prisms: readonly Prism[] = ${JSON.stringify(items)};
`;
};

const main = async (): Promise<void> => {
  console.log("Reading HTML file...");
  const html = await readCodexHtml();

  console.log("Extracting prism data...");
  const items = extractPrismData(html);
  console.log(`Extracted ${items.length} prisms`);

  const outDir = join(process.cwd(), "src", "data", "prism");
  await mkdir(outDir, { recursive: true });

  const dataPath = join(outDir, "prisms.ts");
  await writeFile(dataPath, generateDataFile(items), "utf-8");
  console.log(`Generated prisms.ts (${items.length} items)`);

  console.log("\nCode generation complete!");
  execSync("pnpm format", { stdio: "inherit" });
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });

export { main as generatePrismData };
