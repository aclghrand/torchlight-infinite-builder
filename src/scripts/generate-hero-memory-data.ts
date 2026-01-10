import { execSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as cheerio from "cheerio";
import { program } from "commander";
import type { HeroMemory } from "../data/hero-memory/types";

// ============================================================================
// Fetching
// ============================================================================

const HERO_MEMORIES_URL = "https://tlidb.com/en/Hero_Memories";
const HERO_MEMORIES_DIR = join(
  process.cwd(),
  ".garbage",
  "tlidb",
  "hero_memories",
);

const HERO_MEMORIES_FILES = [
  "hero_memories_base_stats.html",
  "hero_memories_fixed_affix.html",
  "hero_memories_random_affix.html",
] as const;

const fetchPage = async (url: string): Promise<string> => {
  console.log(`Fetching: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
};

const fetchHeroMemoriesPages = async (): Promise<void> => {
  await mkdir(HERO_MEMORIES_DIR, { recursive: true });

  const html = await fetchPage(HERO_MEMORIES_URL);

  for (const filename of HERO_MEMORIES_FILES) {
    const filepath = join(HERO_MEMORIES_DIR, filename);
    await writeFile(filepath, html);
    console.log(`Saved: ${filepath}`);
  }

  console.log("Fetching complete!");
};

// ============================================================================
// Parsing
// ============================================================================

const TLIDB_HTML_PATH = join(
  HERO_MEMORIES_DIR,
  "hero_memories_random_affix.html",
);

const cleanAffixText = (html: string): string => {
  let text = html;

  // Remove data-bs-title attributes (they contain tooltip HTML that breaks parsing)
  text = text.replace(/\s*data-bs-title="[^"]*"/g, "");

  // Convert <br> tags to newlines before removing other HTML tags
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // Remove <span class="text-mod"> tags but keep content
  text = text.replace(/<span[^>]*class="text-mod"[^>]*>([^<]*)<\/span>/g, "$1");

  // Remove <e> hyperlink tags but keep content
  text = text.replace(/<e[^>]*>([^<]*)<\/e>/g, "$1");

  // Remove <i> info icon elements entirely
  text = text.replace(/<i[^>]*><\/i>/g, "");
  text = text.replace(/<i[^>]*\/>/g, "");

  // Remove any remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Convert HTML en-dash entity to hyphen
  text = text.replace(/&ndash;/g, "-");

  // Decode common HTML entities
  text = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Normalize horizontal whitespace (preserve newlines)
  text = text.replace(/[^\S\n]+/g, " ");

  // Trim whitespace from each line and normalize multiple newlines
  text = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return text.trim();
};

const extractTypeFromHeader = (headerText: string): string | undefined => {
  // Header format: "Base Stats /15" or "Fixed Affix /219" or "Random Affix /..."
  if (headerText.includes("Base Stats")) {
    return "Base Stats";
  }
  if (headerText.includes("Fixed Affix")) {
    return "Fixed Affix";
  }
  if (headerText.includes("Random Affix")) {
    return "Random Affix";
  }
  return undefined;
};

const extractHeroMemoryData = (html: string): HeroMemory[] => {
  const $ = cheerio.load(html);
  const items: HeroMemory[] = [];

  // Find all card elements that contain tables
  $(".card").each((_, card) => {
    const $card = $(card);
    const headerText = $card.find(".card-header").first().text().trim();
    const memoryType = extractTypeFromHeader(headerText);

    if (memoryType === undefined) {
      return; // Skip cards without recognized type
    }

    // Find 5-column tables within this card (Tier, Modifier, Level, Weight, Source)
    $card.find("table.DataTable").each((_, table) => {
      const $table = $(table);
      const headers = $table.find("thead th");
      if (headers.length !== 5) {
        return;
      }
      const firstHeader = $(headers[0]).text().trim();
      if (firstHeader !== "Tier") {
        return;
      }

      $table.find("tbody tr").each((_, row) => {
        const tds = $(row).find("td");
        if (tds.length !== 5) {
          return;
        }

        const tier = parseInt($(tds[0]).text().trim(), 10);
        const affixHtml = $(tds[1]).html() || "";
        const affix = cleanAffixText(affixHtml);
        const item = $(tds[4]).find("a").text().trim();

        if (affix.length > 0 && item.length > 0) {
          items.push({ type: memoryType, item, affix, tier });
        }
      });
    });
  });

  return items;
};

const generateDataFile = (items: HeroMemory[]): string => {
  return `import type { HeroMemory } from "./types";

export const HeroMemories: readonly HeroMemory[] = ${JSON.stringify(items)};
`;
};

interface Options {
  refetch: boolean;
}

const main = async (options: Options): Promise<void> => {
  if (options.refetch) {
    console.log("Refetching hero memories pages from tlidb...\n");
    await fetchHeroMemoriesPages();
    console.log("");
  }

  console.log("Reading tlidb HTML file...");
  const html = await readFile(TLIDB_HTML_PATH, "utf-8");

  console.log("Extracting hero memory data...");
  const items = extractHeroMemoryData(html);
  console.log(`Extracted ${items.length} hero memories`);

  // Log breakdown by type
  const byType = items.reduce(
    (acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count}`);
  }

  const outDir = join(process.cwd(), "src", "data", "hero-memory");
  await mkdir(outDir, { recursive: true });

  const dataPath = join(outDir, "hero-memories.ts");
  await writeFile(dataPath, generateDataFile(items), "utf-8");
  console.log(`Generated hero-memories.ts (${items.length} items)`);

  console.log("\nCode generation complete!");
  execSync("pnpm format", { stdio: "inherit" });
};

program
  .description("Generate hero memory data from cached HTML pages")
  .option("--refetch", "Refetch HTML pages from tlidb before generating")
  .action((options: Options) => {
    main(options)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
      });
  })
  .parse();
