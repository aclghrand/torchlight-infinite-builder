import { execSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as cheerio from "cheerio";
import type {
  Legendary,
  LegendaryAffix,
  LegendaryAffixChoice,
} from "../data/legendary/types";
import type { EquipmentSlot, EquipmentType } from "../tli/gear-data-types";
import { LegendaryDataOverrides } from "./legendaries/legendary-data-overrides";
import { readCodexHtml } from "./lib/codex";

const cleanHtmlText = (
  // biome-ignore lint/suspicious/noExplicitAny: cheerio internal type
  elem: cheerio.Cheerio<any>,
  $: cheerio.CheerioAPI,
): string => {
  // Get HTML content and replace <br> with newlines
  let html = $(elem).html() ?? "";
  html = html.replace(/<br\s*\/?>/gi, "\n");

  // Load into cheerio to get text content (strips remaining HTML)
  let text = cheerio.load(html).text();

  // Replace en-dash with regular hyphen
  text = text.replace(/\u2013/g, "-");

  // Normalize whitespace per line, filter empty lines
  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");
};

interface AffixChoiceCard {
  descriptor: string;
  isCorroded: boolean;
  choices: string[];
}

/**
 * Extracts affix choice cards from the HTML.
 * These are cards with headers like "<Random stat affix>" or "<Random stat affix>Corroded"
 */
const extractAffixChoiceCards = (
  $: cheerio.CheerioAPI,
): Map<string, AffixChoiceCard> => {
  const choiceCards = new Map<string, AffixChoiceCard>();

  // Find h5.card-header elements with the golden color style
  $('h5.card-header[style*="color: #ffc130"]').each((_, header) => {
    const $header = $(header);
    const headerText = $header.text().trim();

    // Check if the header text starts and ends with angle brackets (possibly with "Corroded" suffix)
    const corrodedSuffix = "Corroded";
    const isCorroded = headerText.endsWith(corrodedSuffix);

    // Extract the descriptor without angle brackets and optional Corroded suffix
    let descriptor = headerText;
    if (isCorroded) {
      descriptor = descriptor.slice(0, -corrodedSuffix.length);
    }

    // Check if it has angle brackets
    if (!descriptor.startsWith("<") || !descriptor.endsWith(">")) {
      return;
    }

    // Remove angle brackets to get the descriptor
    descriptor = descriptor.slice(1, -1);

    // Get the choices from the card body
    const $card = $header.closest(".card");
    const choices: string[] = [];

    $card.find(".card-body li").each((_, li) => {
      const choice = cleanHtmlText($(li), $);
      if (choice) {
        choices.push(choice);
      }
    });

    // Create a unique key that includes corroded status
    const key = isCorroded ? `${descriptor}:corroded` : `${descriptor}:normal`;

    choiceCards.set(key, { descriptor, isCorroded, choices });
  });

  return choiceCards;
};

interface CodexLegendaryInfo {
  equipmentSlot: EquipmentSlot;
  equipmentType: EquipmentType;
}

/** Legendary data extracted from tlidb (without equipment slot/type) */
interface TlidbLegendary {
  name: string;
  baseItem: string;
  baseStat: string;
  normalAffixes: LegendaryAffix[];
  corruptionAffixes: LegendaryAffix[];
}

/**
 * Extracts legendary equipment info (slot and type) from codex.html's legendary table.
 * Returns a map keyed by legendary name.
 */
const extractCodexLegendaryData = (
  html: string,
): Map<string, CodexLegendaryInfo> => {
  const $ = cheerio.load(html);
  const legendaryMap = new Map<string, CodexLegendaryInfo>();

  const rows = $('#legendary tbody tr[class*="thing"]');
  console.log(`Found ${rows.length} legendary rows in codex.html`);

  rows.each((_, row) => {
    const tds = $(row).find("td");

    if (tds.length < 3) {
      console.warn(
        `Skipping codex row with ${tds.length} columns (expected at least 3)`,
      );
      return;
    }

    const equipmentSlot = $(tds[0]).text().trim() as EquipmentSlot;
    const equipmentType = $(tds[1]).text().trim() as EquipmentType;
    const name = $(tds[2]).text().trim();

    if (name) {
      legendaryMap.set(name, { equipmentSlot, equipmentType });
    }
  });

  return legendaryMap;
};

/**
 * Converts an affix text to a LegendaryAffix (string or LegendaryAffixChoice).
 * If the text is enclosed in angle brackets, it looks up the corresponding choice card.
 */
const parseAffix = (
  affixText: string,
  choiceCards: Map<string, AffixChoiceCard>,
  isCorroded: boolean,
): LegendaryAffix => {
  // Check if affix is enclosed in angle brackets like <Random stat affix>
  if (affixText.startsWith("<") && affixText.endsWith(">")) {
    const descriptor = affixText.slice(1, -1);
    const key = isCorroded ? `${descriptor}:corroded` : `${descriptor}:normal`;
    const choiceCard = choiceCards.get(key);

    if (choiceCard !== undefined) {
      const result: LegendaryAffixChoice = {
        choiceDescriptor: descriptor,
        choices: choiceCard.choices,
      };
      return result;
    }

    // If no choice card found, still return a LegendaryAffixChoice with empty choices
    const result: LegendaryAffixChoice = {
      choiceDescriptor: descriptor,
      choices: [],
    };
    return result;
  }

  return affixText;
};

const extractLegendary = (
  $: cheerio.CheerioAPI,
  filename: string,
  choiceCards: Map<string, AffixChoiceCard>,
): TlidbLegendary | undefined => {
  // Find the SS10Season card (not the previousItem one)
  // biome-ignore lint/suspicious/noExplicitAny: cheerio internal type
  let mainCard: cheerio.Cheerio<any> | undefined;

  $(".card.ui_item").each((_, card) => {
    const $card = $(card);
    // Skip if it's a previousItem (SS9 card)
    if ($card.hasClass("previousItem")) return;
    // Check if it has item_ver with SS10Season
    const itemVer = $card.find(".item_ver").text().trim();
    if (itemVer === "SS10Season") {
      mainCard = $card;
      return false; // break loop
    }
  });

  if (!mainCard) {
    console.log(`  Skipping ${filename}: No SS10Season card found`);
    return undefined;
  }

  // Extract name
  const name = mainCard.find("h5.card-title.item_rarity").text().trim();

  // Extract baseStat - includes attrs2 plus any sibling div.text-center before the hr
  const attrs2 = mainCard.find('div[data-block="attrs2"]');
  let baseStat = cleanHtmlText(attrs2, $);

  // Look for additional base stat divs that come after attrs2 but before the hr
  // These are div.text-center elements without data-block attribute
  let nextElem = attrs2.next();
  while (nextElem.length > 0) {
    const tagName = nextElem.prop("tagName")?.toLowerCase();
    // Stop at hr or any non-div element
    if (tagName === "hr" || tagName !== "div") {
      break;
    }
    // Only include div.text-center without data-block attribute
    if (
      nextElem.hasClass("text-center") &&
      nextElem.attr("data-block") === undefined
    ) {
      const extraStat = cleanHtmlText(nextElem, $);
      if (extraStat) {
        baseStat = baseStat ? `${baseStat}\n${extraStat}` : extraStat;
      }
    }
    nextElem = nextElem.next();
  }

  // Extract normal affixes (div.t1)
  const normalAffixes: LegendaryAffix[] = [];
  mainCard.find("div.t1").each((_, el) => {
    const affixText = cleanHtmlText($(el), $);
    if (affixText) {
      normalAffixes.push(parseAffix(affixText, choiceCards, false));
    }
  });

  // Find the Corroded card
  // biome-ignore lint/suspicious/noExplicitAny: cheerio internal type
  let corrodedCard: cheerio.Cheerio<any> | undefined;
  $(".card.ui_item").each((_, card) => {
    const $card = $(card);
    const header = $card.find(".card-header").text().trim();
    if (header === "Corroded") {
      corrodedCard = $card;
      return false; // break loop
    }
  });

  // Extract corruption affixes (div.t0)
  const corruptionAffixes: LegendaryAffix[] = [];
  if (corrodedCard !== undefined) {
    corrodedCard.find("div.t0").each((_, el) => {
      const affixText = cleanHtmlText($(el), $);
      if (affixText) {
        corruptionAffixes.push(parseAffix(affixText, choiceCards, true));
      }
    });
  }

  // Find the Info card and extract baseItem
  let baseItem = "";
  $(".card.ui_item").each((_, card) => {
    const $card = $(card);
    const header = $card.find(".card-header").text().trim();
    if (header === "Info") {
      // Find the Base: line and get the <a> text
      $card.find(".card-body li").each((_, li) => {
        const $li = $(li);
        const text = $li.text();
        if (text.startsWith("Base:")) {
          baseItem = $li.find("a").text().trim();
          return false; // break inner loop
        }
      });
      return false; // break outer loop
    }
  });

  // Skip items without a base item (like Divinity Slates)
  if (!baseItem) {
    console.log(`  Skipping ${filename}: No baseItem found`);
    return undefined;
  }

  return { baseItem, baseStat, name, normalAffixes, corruptionAffixes };
};

const applyOverrides = (legendaries: Legendary[]): Legendary[] => {
  // Create a map for efficient lookup
  const legendaryMap = new Map(legendaries.map((l) => [l.name, l]));

  // Apply overrides
  for (const [name, override] of Object.entries(LegendaryDataOverrides)) {
    if (override === undefined) {
      // Remove legendary if it exists
      if (legendaryMap.delete(name)) {
        console.log(`  Override: Removed "${name}"`);
      }
    } else {
      // Validate that key matches the name property
      if (override.name !== name) {
        throw new Error(
          `Override key "${name}" does not match legendary name "${override.name}"`,
        );
      }
      // Upsert legendary
      const action = legendaryMap.has(name) ? "Replaced" : "Added";
      legendaryMap.set(name, override);
      console.log(`  Override: ${action} "${name}"`);
    }
  }

  return Array.from(legendaryMap.values());
};

const generateDataFile = (items: Legendary[]): string => {
  return `import type { Legendary } from "./types";

export const Legendaries: readonly Legendary[] = ${JSON.stringify(items)};
`;
};

const main = async (): Promise<void> => {
  const inputDir = join(process.cwd(), ".garbage", "tlidb", "legendary_gear");
  const outDir = join(process.cwd(), "src", "data", "legendary");

  // Step 1: Read codex.html and extract equipment slot/type mapping
  console.log("Reading codex.html for equipment info...");
  const codexHtml = await readCodexHtml();
  const codexLegendaryMap = extractCodexLegendaryData(codexHtml);

  // Step 2: Read tlidb legendary files
  console.log("Reading HTML files from:", inputDir);
  const files = await readdir(inputDir);
  const htmlFiles = files.filter((f) => f.endsWith(".html"));
  console.log(`Found ${htmlFiles.length} HTML files`);

  const legendaries: Legendary[] = [];
  let skippedCount = 0;

  for (const filename of htmlFiles) {
    const filepath = join(inputDir, filename);
    const html = await readFile(filepath, "utf-8");
    const $ = cheerio.load(html);

    // Extract choice cards first
    const choiceCards = extractAffixChoiceCards($);

    const tlidbData = extractLegendary($, filename, choiceCards);
    if (tlidbData === undefined) {
      continue;
    }

    // Step 3: Merge with codex data
    const codexInfo = codexLegendaryMap.get(tlidbData.name);
    if (!codexInfo) {
      console.warn(`No codex data found for: ${tlidbData.name} - skipping`);
      skippedCount++;
      continue;
    }

    legendaries.push({
      ...tlidbData,
      equipmentSlot: codexInfo.equipmentSlot,
      equipmentType: codexInfo.equipmentType,
    });
  }

  console.log(
    `Extracted ${legendaries.length} legendaries (skipped ${skippedCount} without codex data)`,
  );

  // Apply manual overrides
  console.log("Applying overrides...");
  const finalLegendaries = applyOverrides(legendaries);

  // Sort by name for consistent output
  finalLegendaries.sort((a, b) => a.name.localeCompare(b.name));

  console.log(`Final count: ${finalLegendaries.length} legendaries`);

  await mkdir(outDir, { recursive: true });

  const dataPath = join(outDir, "legendaries.ts");
  await writeFile(dataPath, generateDataFile(finalLegendaries), "utf-8");
  console.log(`Generated legendaries.ts`);

  console.log("\nCode generation complete!");
  execSync("pnpm format", { stdio: "inherit" });
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });

export { main as generateLegendaryData };
