import { execSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as cheerio from "cheerio";
import type {
  AffixType,
  CraftingPool,
  EquipmentSlot,
  EquipmentType,
} from "../tli/gear-data-types";

interface BaseGearAffix {
  equipmentSlot: EquipmentSlot;
  equipmentType: EquipmentType;
  affixType: AffixType;
  craftingPool: CraftingPool;
  tier: string;
  craftableAffix: string;
}

// Mapping from filename to equipment type and slot
const EQUIPMENT_MAP: Record<
  string,
  { type: EquipmentType; slot: EquipmentSlot }
> = {
  // One-Handed Weapons
  "scepter.html": { type: "Scepter", slot: "One-Handed" },
  "wand.html": { type: "Wand", slot: "One-Handed" },
  "cane.html": { type: "Cane", slot: "One-Handed" },
  "rod.html": { type: "Rod", slot: "One-Handed" },
  "cudgel.html": { type: "Cudgel", slot: "One-Handed" },
  "dagger.html": { type: "Dagger", slot: "One-Handed" },
  "claw.html": { type: "Claw", slot: "One-Handed" },
  "one_handed_axe.html": { type: "One-Handed Axe", slot: "One-Handed" },
  "one_handed_sword.html": { type: "One-Handed Sword", slot: "One-Handed" },
  "one_handed_hammer.html": { type: "One-Handed Hammer", slot: "One-Handed" },
  "pistol.html": { type: "Pistol", slot: "One-Handed" },

  // Two-Handed Weapons
  "tin_staff.html": { type: "Tin Staff", slot: "Two-Handed" },
  "bow.html": { type: "Bow", slot: "Two-Handed" },
  "crossbow.html": { type: "Crossbow", slot: "Two-Handed" },
  "musket.html": { type: "Musket", slot: "Two-Handed" },
  "fire_cannon.html": { type: "Fire Cannon", slot: "Two-Handed" },
  "two_handed_axe.html": { type: "Two-Handed Axe", slot: "Two-Handed" },
  "two_handed_sword.html": { type: "Two-Handed Sword", slot: "Two-Handed" },
  "two_handed_hammer.html": { type: "Two-Handed Hammer", slot: "Two-Handed" },

  // Armor - STR
  "str_chest_armor.html": { type: "Chest Armor (STR)", slot: "Chest Armor" },
  "str_boots.html": { type: "Boots (STR)", slot: "Boots" },
  "str_gloves.html": { type: "Gloves (STR)", slot: "Gloves" },
  "str_helmet.html": { type: "Helmet (STR)", slot: "Helmet" },

  // Armor - DEX
  "dex_chest_armor.html": { type: "Chest Armor (DEX)", slot: "Chest Armor" },
  "dex_boots.html": { type: "Boots (DEX)", slot: "Boots" },
  "dex_gloves.html": { type: "Gloves (DEX)", slot: "Gloves" },
  "dex_helmet.html": { type: "Helmet (DEX)", slot: "Helmet" },

  // Armor - INT
  "int_chest_armor.html": { type: "Chest Armor (INT)", slot: "Chest Armor" },
  "int_boots.html": { type: "Boots (INT)", slot: "Boots" },
  "int_gloves.html": { type: "Gloves (INT)", slot: "Gloves" },
  "int_helmet.html": { type: "Helmet (INT)", slot: "Helmet" },

  // Shields
  "str_shield.html": { type: "Shield (STR)", slot: "Shield" },
  "dex_shield.html": { type: "Shield (DEX)", slot: "Shield" },
  "int_shield.html": { type: "Shield (INT)", slot: "Shield" },

  // Accessories
  "belt.html": { type: "Belt", slot: "Trinket" },
  "necklace.html": { type: "Necklace", slot: "Trinket" },
  "ring.html": { type: "Ring", slot: "Trinket" },
  "spirit_ring.html": { type: "Spirit Ring", slot: "Trinket" },
};

// Get section ID prefix from filename (e.g., "scepter.html" -> "Scepter", "str_chest_armor.html" -> "STRChestArmor")
// Note: Some equipment like "one_handed_axe" has section IDs like "#One-HandedAxeBaseAffix" (with hyphen)
const getSectionPrefix = (filename: string): string => {
  const name = filename.replace(".html", "");

  // Special handling for "one_handed" and "two_handed" - they have hyphens in section IDs
  if (name.startsWith("one_handed_") || name.startsWith("two_handed_")) {
    const parts = name.split("_");
    // e.g., ["one", "handed", "axe"] -> "One-HandedAxe"
    const prefix = parts[0].charAt(0).toUpperCase() + parts[0].slice(1); // "One" or "Two"
    const handed = parts[1].charAt(0).toUpperCase() + parts[1].slice(1); // "Handed"
    const weapon = parts
      .slice(2)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(""); // "Axe", "Sword", "Hammer"
    return `${prefix}-${handed}${weapon}`;
  }

  // Convert snake_case to PascalCase, uppercase stat prefixes
  return name
    .split("_")
    .map((part) => {
      if (["str", "dex", "int"].includes(part)) {
        return part.toUpperCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
};

/**
 * Parses modifier text from an element, handling:
 * - <span class="text-mod"> tags (remove, keep inner text with ndash → hyphen)
 * - <e> hyperlink tags (remove, keep inner text)
 * - <br> tags (convert to newlines)
 * - Various dash characters to regular hyphens
 */
const parseModifierText = (
  // biome-ignore lint/suspicious/noExplicitAny: cheerio internal type
  el: cheerio.Cheerio<any>,
  $: cheerio.CheerioAPI,
): string => {
  const clone = el.clone();

  // Replace <e> hyperlink elements with their text
  clone.find("e").each((_, elem) => {
    $(elem).replaceWith($(elem).text());
  });

  // Remove tooltip icons
  clone.find("i.fa-solid").remove();

  // Replace <br> with placeholder
  let html = clone.html() || "";
  html = html.replace(/<br\s*\/?>/gi, "{NEWLINE}");

  // Parse and extract text
  const processed = cheerio.load(html);
  let text = processed.text();

  // Clean up whitespace
  text = text.replace(/\s+/g, " ").trim();
  text = text.replace(/{NEWLINE}\s*/g, "\n");

  // Normalize dashes
  text = text.replace(/\u2013/g, "-"); // en-dash
  text = text.replace(/\u2014/g, "-"); // em-dash
  text = text.replace(/&ndash;/g, "-");

  return text;
};

/**
 * Extract tier from tooltip like: data-bs-title="Tier: 1, Level: 86, Weight: 100"
 */
const extractTierFromTooltip = (
  // biome-ignore lint/suspicious/noExplicitAny: cheerio internal type
  row: cheerio.Cheerio<any>,
): string => {
  const tooltip = row.find('[data-bs-title*="Tier:"]').attr("data-bs-title");
  if (!tooltip) return "";

  const match = tooltip.match(/Tier:\s*(\d+)/);
  return match ? match[1] : "";
};

/**
 * Parse sequences from #Affix section
 * Filters rows where Type column contains "Sequence"
 */
const parseSequences = (
  $: cheerio.CheerioAPI,
  equipmentType: EquipmentType,
  slot: EquipmentSlot,
): BaseGearAffix[] => {
  const affixes: BaseGearAffix[] = [];
  const table = $("#Affix table.DataTable");
  if (!table.length) return affixes;

  table.find("tbody tr").each((_, row) => {
    const $row = $(row);
    const tds = $row.find("td");
    if (tds.length < 3) return;

    const typeText = $(tds[2]).text().trim();
    if (!typeText.includes("Sequence")) return;

    const modifier = parseModifierText($(tds[0]), $);
    const tier = extractTierFromTooltip($row);

    affixes.push({
      equipmentSlot: slot,
      equipmentType,
      affixType: "Tower Sequence",
      craftingPool: "",
      tier,
      craftableAffix: modifier,
    });
  });

  return affixes;
};

/**
 * Parse base stats from #Item section
 * Extracts from item cards
 */
const parseBaseStats = (
  $: cheerio.CheerioAPI,
  equipmentType: EquipmentType,
  slot: EquipmentSlot,
): BaseGearAffix[] => {
  const affixes: BaseGearAffix[] = [];
  const section = $("#Item");
  if (!section.length) return affixes;

  // Find all item cards
  section.find(".col").each((_, col) => {
    const $col = $(col);

    // Extract base stats - look for divs after the "Require lv X" div
    const statsLines: string[] = [];

    // The structure is: flex container -> flex-grow-1 div -> multiple divs with stats
    const statsContainer = $col.find(".flex-grow-1");
    if (!statsContainer.length) return;

    statsContainer.children("div").each((_, div) => {
      const $div = $(div);
      const text = $div.text().trim();

      // Skip require level and empty divs
      if (text.startsWith("Require") || !text) return;

      // Check if this is a stats div (contains text-mod spans or stat values)
      if ($div.find(".text-mod").length > 0 || /^\+?\d/.test(text)) {
        const statText = parseModifierText($div, $);
        if (statText) {
          statsLines.push(statText);
        }
      }
    });

    if (statsLines.length > 0) {
      affixes.push({
        equipmentSlot: slot,
        equipmentType,
        affixType: "Base Stats",
        craftingPool: "",
        tier: "",
        craftableAffix: statsLines.join("\n"),
      });
    }
  });

  return affixes;
};

/**
 * Parse affixes from a simple table (BaseAffix, CorrosionBase, SweetDreamAffix)
 * Table structure: Tier, Modifier, Level, Weight
 */
const parseSimpleAffixTable = (
  $: cheerio.CheerioAPI,
  sectionId: string,
  equipmentType: EquipmentType,
  slot: EquipmentSlot,
  affixType: AffixType,
): BaseGearAffix[] => {
  const affixes: BaseGearAffix[] = [];
  const section = $(sectionId);
  if (!section.length) return affixes;

  const table = section.find("table");
  if (!table.length) return affixes;

  table.find("tbody tr").each((_, row) => {
    const $row = $(row);
    const tds = $row.find("td");
    if (tds.length < 2) return;

    const tier = $(tds[0]).text().trim();
    const modifier = parseModifierText($(tds[1]), $);

    affixes.push({
      equipmentSlot: slot,
      equipmentType,
      affixType,
      craftingPool: "",
      tier,
      craftableAffix: modifier,
    });
  });

  return affixes;
};

/**
 * Map Library column to CraftingPool
 */
const mapLibraryToPool = (library: string): CraftingPool => {
  const lower = library.toLowerCase();
  if (lower.includes("ultimate")) return "Ultimate";
  if (lower.includes("advanced")) return "Advanced";
  if (lower.includes("intermediate")) return "Intermediate";
  if (lower.includes("basic")) return "Basic";
  return "";
};

/**
 * Parse craft affixes from #XXXCraft section
 * Extracts T0 through T4 affixes
 * Table structure: Tier, Modifier, Lv, Weight, Library
 * Two tables: Pre-fix and Suffix (identified by caption)
 */
const parseCraftAffixes = (
  $: cheerio.CheerioAPI,
  sectionId: string,
  equipmentType: EquipmentType,
  slot: EquipmentSlot,
): BaseGearAffix[] => {
  const affixes: BaseGearAffix[] = [];
  const section = $(sectionId);
  if (!section.length) return affixes;

  // Find both tables (Pre-fix and Suffix)
  section.find("table").each((_, table) => {
    const $table = $(table);
    const caption = $table.find("caption").text().trim();

    let affixType: AffixType;
    if (caption.toLowerCase().includes("pre-fix")) {
      affixType = "Prefix";
    } else if (caption.toLowerCase().includes("suffix")) {
      affixType = "Suffix";
    } else {
      return; // Skip unknown tables
    }

    // Filter for T0 through T4
    $table
      .find(
        'tbody tr[data-tier="0"], tbody tr[data-tier="1"], tbody tr[data-tier="2"], tbody tr[data-tier="3"], tbody tr[data-tier="4"]',
      )
      .each((_, row) => {
        const $row = $(row);
        const tds = $row.find("td");
        if (tds.length < 5) return;

        const tier = $(tds[0]).text().trim();
        const modifier = parseModifierText($(tds[1]), $);
        const library = $(tds[4]).text().trim();

        affixes.push({
          equipmentSlot: slot,
          equipmentType,
          affixType,
          craftingPool: mapLibraryToPool(library),
          tier,
          craftableAffix: modifier,
        });
      });
  });

  return affixes;
};

const normalizeEquipmentType = (type: string): string => {
  return type
    .toLowerCase()
    .replace(/\s*\(([^)]+)\)\s*/g, "-$1")
    .replace(/\s+/g, "-");
};

const normalizeAffixType = (type: string): string => {
  return type.toLowerCase().replace(/\s+/g, "-");
};

const normalizeFileKey = (equipmentType: string, affixType: string): string => {
  return `${normalizeEquipmentType(equipmentType)}-${normalizeAffixType(affixType)}`;
};

const fileKeyToConstName = (fileKey: string): string => {
  return `${fileKey.replace(/-/g, "_").toUpperCase()}_AFFIXES`;
};

const generateEquipmentAffixFile = (
  fileKey: string,
  affixes: BaseGearAffix[],
): string => {
  const constName = fileKeyToConstName(fileKey);

  return `import type { BaseGearAffix } from "../../tli/gear-data-types";

export const ${constName}: readonly BaseGearAffix[] = ${JSON.stringify(affixes)};
`;
};

const generateAllAffixesFile = (fileKeys: string[]): string => {
  const imports = fileKeys
    .map((key) => {
      const constName = fileKeyToConstName(key);
      return `import { ${constName} } from "./${key}";`;
    })
    .join("\n");

  const arraySpread = fileKeys
    .map((key) => `  ...${fileKeyToConstName(key)},`)
    .join("\n");

  return `${imports}

export const ALL_GEAR_AFFIXES = [
${arraySpread}
] as const;
`;
};

const main = async (): Promise<void> => {
  const gearDir = join(process.cwd(), ".garbage", "tlidb", "gear");
  const outDir = join(process.cwd(), "src", "data", "gear-affix");

  console.log("Reading gear files from tlidb...");
  const files = await readdir(gearDir);
  const htmlFiles = files.filter(
    (f) => f.endsWith(".html") && f !== "craft.html",
  );

  console.log(`Found ${htmlFiles.length} gear files`);

  const allAffixes: BaseGearAffix[] = [];

  for (const file of htmlFiles) {
    const equipmentInfo = EQUIPMENT_MAP[file];
    if (!equipmentInfo) {
      console.warn(`Unknown equipment file: ${file}, skipping`);
      continue;
    }

    const { type, slot } = equipmentInfo;
    const filePath = join(gearDir, file);
    const html = await readFile(filePath, "utf-8");
    const $ = cheerio.load(html);

    const sectionPrefix = getSectionPrefix(file);

    console.log(`Processing ${file} -> ${type} (${sectionPrefix})`);

    // Parse all sections
    const sequences = parseSequences($, type, slot);
    const baseStats = parseBaseStats($, type, slot);
    const baseAffixes = parseSimpleAffixTable(
      $,
      `#${sectionPrefix}BaseAffix`,
      type,
      slot,
      "Base Affix",
    );
    const corrosionBase = parseSimpleAffixTable(
      $,
      `#${sectionPrefix}CorrosionBase`,
      type,
      slot,
      "Corrosion Base",
    );
    const sweetDreamAffixes = parseSimpleAffixTable(
      $,
      `#${sectionPrefix}SweetDreamAffix`,
      type,
      slot,
      "Sweet Dream Affix",
    );
    const craftAffixes = parseCraftAffixes(
      $,
      `#${sectionPrefix}Craft`,
      type,
      slot,
    );

    allAffixes.push(
      ...sequences,
      ...baseStats,
      ...baseAffixes,
      ...corrosionBase,
      ...sweetDreamAffixes,
      ...craftAffixes,
    );

    console.log(
      `  Sequences: ${sequences.length}, BaseStats: ${baseStats.length}, BaseAffix: ${baseAffixes.length}, Corrosion: ${corrosionBase.length}, SweetDream: ${sweetDreamAffixes.length}, Craft: ${craftAffixes.length}`,
    );
  }

  console.log(`\nTotal affixes extracted: ${allAffixes.length}`);

  // Group by combination of equipmentType + affixType
  const grouped = new Map<string, BaseGearAffix[]>();

  for (const affix of allAffixes) {
    const fileKey = normalizeFileKey(affix.equipmentType, affix.affixType);

    if (!grouped.has(fileKey)) {
      grouped.set(fileKey, []);
    }
    grouped.get(fileKey)?.push(affix);
  }

  console.log(`Grouped into ${grouped.size} files`);

  // Create output directory
  await mkdir(outDir, { recursive: true });

  // Generate individual affix files
  const fileKeys: string[] = [];

  for (const [fileKey, affixes] of grouped) {
    fileKeys.push(fileKey);
    const fileName = `${fileKey}.ts`;
    const filePath = join(outDir, fileName);
    const content = generateEquipmentAffixFile(fileKey, affixes);

    await writeFile(filePath, content, "utf-8");
    console.log(`Generated ${fileName} (${affixes.length} affixes)`);
  }

  // Generate all-affixes.ts
  const allAffixesPath = join(outDir, "all-affixes.ts");
  const allAffixesContent = generateAllAffixesFile(fileKeys.sort());
  await writeFile(allAffixesPath, allAffixesContent, "utf-8");
  console.log(`Generated all-affixes.ts`);

  console.log("\nCode generation complete!");
  console.log(
    `Generated ${grouped.size} affix files with ${allAffixes.length} total affixes`,
  );

  execSync("pnpm format", { stdio: "inherit" });
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });

export { main as generateGearAffixData };
