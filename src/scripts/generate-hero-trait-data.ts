import { execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as cheerio from "cheerio";
import type { BaseHeroTrait } from "../data/hero-trait/types";
import { cleanEffectText, readCodexHtml } from "./lib/codex";

const extractHeroTraitData = (html: string): BaseHeroTrait[] => {
  const $ = cheerio.load(html);
  const traits: BaseHeroTrait[] = [];

  const rows = $('#heroTrait tbody tr[class*="thing"]');
  console.log(`Found ${rows.length} hero trait rows`);

  rows.each((_, row) => {
    const tds = $(row).find("td");

    if (tds.length !== 4) {
      console.warn(`Skipping row with ${tds.length} columns (expected 4)`);
      return;
    }

    const hero = $(tds[0]).text().trim();
    const name = $(tds[1]).text().trim();
    const levelStr = $(tds[2]).text().trim();
    const effectHtml = $(tds[3]).html() || "";

    const level = parseInt(levelStr, 10);
    if (Number.isNaN(level)) {
      console.warn(`Skipping row with invalid level: ${levelStr}`);
      return;
    }

    const trait: BaseHeroTrait = {
      hero,
      name,
      level,
      affix: cleanEffectText(effectHtml),
    };

    traits.push(trait);
  });

  return traits;
};

const generateHeroTraitsFile = (traits: BaseHeroTrait[]): string => {
  return `import type { BaseHeroTrait } from "./types";

export const HeroTraits = ${JSON.stringify(traits)} as const satisfies readonly BaseHeroTrait[];
`;
};

const main = async (): Promise<void> => {
  console.log("Reading HTML file...");
  const html = await readCodexHtml();

  console.log("Extracting hero trait data...");
  const traits = extractHeroTraitData(html);
  console.log(`Extracted ${traits.length} hero traits`);

  const outDir = join(process.cwd(), "src", "data", "hero-trait");
  await mkdir(outDir, { recursive: true });

  const heroTraitsPath = join(outDir, "hero-traits.ts");
  await writeFile(heroTraitsPath, generateHeroTraitsFile(traits), "utf-8");
  console.log(`Generated hero-traits.ts (${traits.length} traits)`);

  console.log("\nCode generation complete!");
  execSync("pnpm format", { stdio: "inherit" });
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });

export { main as generateHeroTraitData };
