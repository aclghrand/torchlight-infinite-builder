import * as cheerio from "cheerio";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { execSync } from "child_process";

interface HeroTrait {
  hero: string;
  name: string;
  level: number;
  effect: string;
}

const cleanEffectText = (html: string): string => {
  let text = html.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");
  text = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  text = text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n");
  text = text
    .split("\n")
    .filter((line) => line.length > 0)
    .join("\n");
  return text.trim();
};

const extractHeroTraitData = (html: string): HeroTrait[] => {
  const $ = cheerio.load(html);
  const traits: HeroTrait[] = [];

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
    if (isNaN(level)) {
      console.warn(`Skipping row with invalid level: ${levelStr}`);
      return;
    }

    const trait: HeroTrait = {
      hero,
      name,
      level,
      effect: cleanEffectText(effectHtml),
    };

    traits.push(trait);
  });

  return traits;
};

const generateTypesFile = (): string => {
  return `export interface HeroTrait {
  hero: string;
  name: string;
  level: number;
  effect: string;
}
`;
};

const generateHeroTraitsFile = (traits: HeroTrait[]): string => {
  return `import type { HeroTrait } from "./types";

export const HeroTraits = ${JSON.stringify(traits, null, 2)} as const satisfies readonly HeroTrait[];

export type HeroTraitEntry = (typeof HeroTraits)[number];
`;
};

const generateIndexFile = (): string => {
  return `export * from "./types";
export * from "./hero_traits";
`;
};

const main = async (): Promise<void> => {
  console.log("Reading HTML file...");
  const htmlPath = join(process.cwd(), ".garbage", "codex.html");
  const html = await readFile(htmlPath, "utf-8");

  console.log("Extracting hero trait data...");
  const traits = extractHeroTraitData(html);
  console.log(`Extracted ${traits.length} hero traits`);

  const outDir = join(process.cwd(), "src", "data", "hero_trait");
  await mkdir(outDir, { recursive: true });

  const typesPath = join(outDir, "types.ts");
  await writeFile(typesPath, generateTypesFile(), "utf-8");
  console.log(`Generated types.ts`);

  const heroTraitsPath = join(outDir, "hero_traits.ts");
  await writeFile(heroTraitsPath, generateHeroTraitsFile(traits), "utf-8");
  console.log(`Generated hero_traits.ts (${traits.length} traits)`);

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

export { main as generateHeroTraitData };
