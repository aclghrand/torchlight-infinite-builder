import { execSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as cheerio from "cheerio";
import type {
  Pactspirit,
  PactspiritRingDetails,
} from "../data/pactspirit/types";

const RARITIES = ["Magic", "Rare", "Legendary"] as const;

const cleanEffectText = (html: string): string => {
  // Use cheerio to properly extract text content from HTML
  // This handles tooltips with > characters in attribute values correctly
  const $ = cheerio.load(`<root>${html}</root>`, { xml: false });

  // Replace br tags with newline markers before text extraction
  $("root br").replaceWith("\n");

  // Extract text from each modifier div separately, then join with newlines
  const modifiers = $("root div.modifier");
  let text: string;

  if (modifiers.length > 0) {
    // Multiple modifier divs - extract each and join with newlines
    const lines: string[] = [];
    modifiers.each((_, el) => {
      // Use [ \t]+ to normalize only spaces/tabs, preserving newlines from <br> tags
      const modText = $(el)
        .text()
        .replace(/[ \t]+/g, " ")
        .trim();
      if (modText.length > 0) {
        lines.push(modText);
      }
    });
    text = lines.join("\n");
  } else {
    // No modifier divs - extract from root directly
    text = $("root").text();
    // Normalize whitespace to single spaces
    text = text.replace(/[ \t]+/g, " ");
  }

  // Clean up: trim each line and remove empty lines
  text = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return text.trim();
};

const cleanAffixText = (html: string): string => {
  // Use cheerio to properly extract text content from HTML
  // This handles tooltips with > characters in attribute values correctly
  const $ = cheerio.load(`<root>${html}</root>`, { xml: false });

  // Replace br tags with newlines before text extraction
  $("root br").replaceWith("\n");

  // Get text content (cheerio properly extracts only text, ignoring tooltip attributes)
  let text = $("root").text();

  // Normalize only spaces/tabs, preserving newlines from <br> tags
  text = text.replace(/[ \t]+/g, " ");

  // Clean up: trim each line and remove empty lines
  text = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return text.trim();
};

const emptyRingDetails = (): PactspiritRingDetails => ({ name: "", affix: "" });

const extractPactspirit = (
  $: cheerio.CheerioAPI,
  filename: string,
): Pactspirit => {
  // Name from filename: Red_Umbrella.html -> "Red Umbrella"
  const name = filename.replace(/\.html$/, "").replace(/_/g, " ");

  // Type and Rarity from spans
  const spans = $("span.btn.btn-sm.btn-secondary.mb-1");
  let type = "";
  let rarity = "";

  spans.each((_, span) => {
    const text = $(span).text().trim();
    if (RARITIES.includes(text as (typeof RARITIES)[number])) {
      rarity = text;
    } else if (!type) {
      type = text;
    }
  });

  // Ring effects from flex-grow-1 ms-2 divs
  const innerRings: PactspiritRingDetails[] = [];
  const midRings: PactspiritRingDetails[] = [];

  $("div.flex-grow-1.ms-2").each((_, ringDiv) => {
    const divs = $(ringDiv).children("div");
    if (divs.length >= 3) {
      const ringName = $(divs[0]).text().trim();
      const affixHtml = $(divs[1]).html() || "";
      const affix = cleanAffixText(affixHtml);
      const ringType = $(divs[2]).text().trim();

      if (ringType === "Inner ring effect") {
        innerRings.push({ name: ringName, affix });
      } else if (ringType === "Mid ring effect") {
        midRings.push({ name: ringName, affix });
      }
    }
  });

  // Effects from Upgrade Reward table
  const effects: Record<string, string> = {};
  const tableRows = $("table.table tbody tr");

  tableRows.each((_, row) => {
    const tds = $(row).find("td");
    if (tds.length >= 2) {
      const level = $(tds[0]).text().trim();
      const effectHtml = $(tds[1]).html() || "";
      effects[`effect${level}`] = cleanEffectText(effectHtml);
    }
  });

  return {
    type,
    rarity,
    name,
    innerRing1: innerRings[0] || emptyRingDetails(),
    innerRing2: innerRings[1] || emptyRingDetails(),
    innerRing3: innerRings[2] || emptyRingDetails(),
    innerRing4: innerRings[3] || emptyRingDetails(),
    innerRing5: innerRings[4] || emptyRingDetails(),
    innerRing6: innerRings[5] || emptyRingDetails(),
    midRing1: midRings[0] || emptyRingDetails(),
    midRing2: midRings[1] || emptyRingDetails(),
    midRing3: midRings[2] || emptyRingDetails(),
    affix1: effects.effect1 || "",
    affix2: effects.effect2 || "",
    affix3: effects.effect3 || "",
    affix4: effects.effect4 || "",
    affix5: effects.effect5 || "",
    affix6: effects.effect6 || "",
  };
};

const generateDataFile = (items: Pactspirit[]): string => {
  return `import type { Pactspirit } from "./types";

export const Pactspirits = ${JSON.stringify(items)} as const satisfies readonly Pactspirit[];
`;
};

const main = async (): Promise<void> => {
  const inputDir = join(process.cwd(), ".garbage", "tlidb", "pactspirits");
  const outDir = join(process.cwd(), "src", "data", "pactspirit");

  console.log("Reading HTML files from:", inputDir);
  const files = await readdir(inputDir);
  const htmlFiles = files.filter((f) => f.endsWith(".html"));
  console.log(`Found ${htmlFiles.length} HTML files`);

  const pactspirits: Pactspirit[] = [];

  for (const filename of htmlFiles) {
    const filepath = join(inputDir, filename);
    const html = await readFile(filepath, "utf-8");
    const $ = cheerio.load(html);

    const pactspirit = extractPactspirit($, filename);
    pactspirits.push(pactspirit);
  }

  // Sort by name for consistent output
  pactspirits.sort((a, b) => a.name.localeCompare(b.name));

  console.log(`Extracted ${pactspirits.length} pactspirits`);

  await mkdir(outDir, { recursive: true });

  const dataPath = join(outDir, "pactspirits.ts");
  await writeFile(dataPath, generateDataFile(pactspirits), "utf-8");
  console.log(`Generated pactspirits.ts`);

  console.log("\nCode generation complete!");
  execSync("pnpm format", { stdio: "inherit" });
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });

export { main as generatePactspiritData };
