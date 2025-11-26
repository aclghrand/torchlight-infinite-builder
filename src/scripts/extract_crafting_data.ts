import * as cheerio from "cheerio";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

interface CraftingAffix {
  equipmentSlot: string;
  equipmentType: string;
  affixType: string;
  craftingPool: string;
  tier: string;
  affix: string;
}

/**
 * Parses the affix text from a <td> element, handling:
 * - <span class="val"> tags (remove, keep inner text with en-dash → hyphen conversion)
 * - <span class="tooltip"> tags (remove, keep inner text)
 * - <br> tags (convert to newlines)
 * - En-dashes (–) to hyphens (-)
 */
const parseAffixText = (
  td: cheerio.Cheerio<any>,
  $: cheerio.CheerioAPI
): string => {
  // Clone the element to avoid modifying the original
  const clone = td.clone();

  // Process <span class="val"> tags: remove and keep text with en-dash conversion
  clone.find("span.val").each((_, elem) => {
    const text = $(elem).text().replace(/–/g, "-"); // Replace en-dash with hyphen
    const nextSibling = elem.nextSibling;
    $(elem).replaceWith(text);

    // Remove leading space from next text node if present
    if (
      nextSibling &&
      nextSibling.type === "text" &&
      nextSibling.data?.startsWith(" %")
    ) {
      nextSibling.data = nextSibling.data.slice(1);
    }
  });

  // Remove <span class="tooltip"> tags but keep their text content
  clone.find("span.tooltip").each((_, elem) => {
    const text = $(elem).text();
    $(elem).replaceWith(text);
  });

  // Get the HTML and replace <br> tags with a special marker
  let html = clone.html() || "";
  html = html.replace(/<br\s*\/?>/gi, "{REPLACEME}");

  // Load the processed HTML and extract text
  const processed = cheerio.load(html);
  let text = processed.text();

  // First, normalize all whitespace (including newlines from HTML formatting) to single spaces
  text = text.replace(/\n/g, "").trim();
  text = text.replace(/\s\s+/g, " ").trim();

  // Then replace our BR markers with actual newlines
  text = text.replace(/{REPLACEME} /g, "\n");

  return text;
};

/**
 * Extracts all crafting affix data from the HTML file
 */
const extractCraftingData = (html: string): CraftingAffix[] => {
  // The HTML has <tbody> outside of <table>, which cheerio's HTML parser strips.
  // Fix by wrapping tbody in a table tag before parsing
  const fixedHtml = html
    .replace("<tbody>", "<table><tbody>")
    .replace("</tbody>", "</tbody></table>");

  const $ = cheerio.load(fixedHtml, { xml: false });
  const affixes: CraftingAffix[] = [];

  // Select all <tr> elements with class "thing" or "thing contrast"
  const rows = $('tr[class*="thing"]');
  console.log(`Found ${rows.length} rows`);

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

/**
 * Main function to orchestrate the extraction
 */
const main = async () => {
  try {
    console.log("Reading HTML file...");
    const htmlPath = join(
      process.cwd(),
      ".garbage",
      "crafting",
      "codex_crafting.html"
    );
    const html = await readFile(htmlPath, "utf-8");

    console.log("Extracting crafting data...");
    const affixes = extractCraftingData(html);
    console.log(`Extracted ${affixes.length} affixes`);

    console.log("Creating data directory...");
    const dataDir = join(process.cwd(), "data");
    await mkdir(dataDir, { recursive: true });

    console.log("Writing JSON file...");
    const outputPath = join(dataDir, "crafting_data.json");
    await writeFile(outputPath, JSON.stringify(affixes, null, 2), "utf-8");

    console.log(
      `✓ Successfully wrote ${affixes.length} affixes to ${outputPath}`
    );
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

// Run the script
main();
