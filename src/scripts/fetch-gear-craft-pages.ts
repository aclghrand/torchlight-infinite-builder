import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://tlidb.com/en";
const CRAFT_PAGE_URL = `${BASE_URL}/Craft`;
const OUTPUT_DIR = ".garbage/tlidb/gear";

// Equipment types to scrape, organized by category
const EQUIPMENT_TYPES = {
  helmet: ["STR_Helmet", "DEX_Helmet", "INT_Helmet"],
  chest_armor: ["STR_Chest_Armor", "DEX_Chest_Armor", "INT_Chest_Armor"],
  gloves: ["STR_Gloves", "DEX_Gloves", "INT_Gloves"],
  boots: ["STR_Boots", "DEX_Boots", "INT_Boots"],
  one_handed: [
    "Claw",
    "Dagger",
    "One-Handed_Sword",
    "One-Handed_Hammer",
    "One-Handed_Axe",
    "Wand",
    "Rod",
    "Scepter",
    "Cane",
    "Pistol",
  ],
  two_handed: [
    "Two-Handed_Sword",
    "Two-Handed_Hammer",
    "Two-Handed_Axe",
    "Tin_Staff",
    "Cudgel",
    "Bow",
    "Crossbow",
    "Musket",
    "Fire_Cannon",
  ],
  shield: ["STR_Shield", "DEX_Shield", "INT_Shield"],
  trinket: ["Necklace", "Ring", "Belt", "Spirit_Ring"],
} as const;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const fetchPage = async (url: string): Promise<string> => {
  console.log(`Fetching: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
};

const toSnakeCase = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const main = async (): Promise<void> => {
  // Create output directory
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Fetch and cache the main Craft page
  const craftPagePath = path.join(OUTPUT_DIR, "craft.html");
  let craftHtml: string;

  if (existsSync(craftPagePath)) {
    console.log("Using cached Craft page");
    craftHtml = await readFile(craftPagePath, "utf-8");
  } else {
    craftHtml = await fetchPage(CRAFT_PAGE_URL);
    await writeFile(craftPagePath, craftHtml);
    console.log(`Saved: ${craftPagePath}`);
    await delay(200);
  }

  // Flatten all equipment types
  const allEquipmentTypes = Object.values(EQUIPMENT_TYPES).flat();
  console.log(`Found ${allEquipmentTypes.length} equipment types to fetch`);

  // Fetch each equipment type page
  for (const equipmentType of allEquipmentTypes) {
    const snakeCaseName = toSnakeCase(equipmentType);
    const filename = `${snakeCaseName}.html`;
    const filepath = path.join(OUTPUT_DIR, filename);

    if (existsSync(filepath)) {
      console.log(`Skipping (already exists): ${filename}`);
      continue;
    }

    try {
      const url = `${BASE_URL}/${encodeURIComponent(equipmentType)}`;
      const html = await fetchPage(url);
      await writeFile(filepath, html);
      console.log(`Saved: ${filepath}`);

      // Be polite to the server
      await delay(200);
    } catch (error) {
      console.error(`Error fetching ${equipmentType}:`, error);
    }
  }

  console.log("Done!");
};

main().catch(console.error);
