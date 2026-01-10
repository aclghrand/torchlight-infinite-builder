import { execSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as cheerio from "cheerio";
import type { BaseCoreTalent } from "../data/core-talent/types";
import { isTree } from "../data/talent";
import type { Affix, AffixLine } from "../tli/core";
import { parseMod } from "../tli/mod-parser";

const cleanAffixText = (html: string): string => {
  const NEWLINE_PLACEHOLDER = "\x00";

  // Replace <br> tags with placeholder
  let text = html.replace(/<br\s*\/?>/gi, NEWLINE_PLACEHOLDER);

  // Remove all HTML tags but keep content
  text = text.replace(/<[^>]+>/g, "");

  // Decode common HTML entities
  text = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Normalize whitespace (excluding placeholder)
  text = text.replace(/[ \t]+/g, " ");

  // Restore newlines
  text = text.replace(new RegExp(NEWLINE_PLACEHOLDER, "g"), "\n");

  // Clean up: trim each line and remove empty lines
  text = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return text.trim();
};

const extractCoreTalents = ($: cheerio.CheerioAPI): BaseCoreTalent[] => {
  const talents: BaseCoreTalent[] = [];

  $("div.col").each((_, col) => {
    const contentDiv = $(col).find("div.flex-grow-1.mx-2.my-1");
    if (contentDiv.length === 0) return;

    // Extract name from span.fw-bold
    const name = contentDiv.find("span.fw-bold").first().text().trim();
    if (!name) return;

    // Extract tree from the anchor tag
    const tree = contentDiv.find("a").first().text().trim();
    if (!tree) return;
    if (!isTree(tree)) return;

    // Skip "New God" talents
    if (tree === "New God") return;

    // Get affix: clone the content div, remove the header, get remaining HTML
    const contentClone = contentDiv.clone();
    contentClone.find("div.d-flex.justify-content-between").remove();
    const affixHtml = contentClone.html() || "";
    const affix = cleanAffixText(affixHtml);

    if (affix) {
      talents.push({ name, tree, affix });
    }
  });

  return talents;
};

const generateDataFile = (talents: BaseCoreTalent[]): string => {
  return `import type { BaseCoreTalent } from "./types";

export const CoreTalents = ${JSON.stringify(talents)} as const satisfies readonly BaseCoreTalent[];
`;
};

const parseAffixString = (affixText: string): Affix => {
  const lines = affixText.split("\n");
  const affixLines: AffixLine[] = lines.map((text) => ({
    text,
    mods: parseMod(text),
  }));
  return { affixLines };
};

const generateModsFile = (talents: BaseCoreTalent[]): string => {
  const entries = talents.map((t) => {
    const affix = parseAffixString(t.affix);
    return `  ${JSON.stringify(t.name)}: ${JSON.stringify(affix)}`;
  });

  return `import type { Affix } from "../../tli/core";
import type { CoreTalentName } from "./types";

export const CoreTalentMods: Record<CoreTalentName, Affix> = {
${entries.join(",\n")}
};
`;
};

const main = async (): Promise<void> => {
  const inputPath = join(
    process.cwd(),
    ".garbage",
    "tlidb",
    "talent",
    "core_talent_node.html",
  );
  const outDir = join(process.cwd(), "src", "data", "core-talent");

  console.log("Reading HTML file from:", inputPath);
  const html = await readFile(inputPath, "utf-8");
  const $ = cheerio.load(html);

  const talents = extractCoreTalents($);

  console.log(`Extracted ${talents.length} core talents`);

  await mkdir(outDir, { recursive: true });

  const dataPath = join(outDir, "core-talents.ts");
  await writeFile(dataPath, generateDataFile(talents), "utf-8");
  console.log(`Generated core-talents.ts`);

  const modsPath = join(outDir, "core-talent-mods.ts");
  await writeFile(modsPath, generateModsFile(talents), "utf-8");
  console.log(`Generated core-talent-mods.ts`);

  console.log("\nCode generation complete!");
  execSync("pnpm format", { stdio: "inherit" });
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });

export { main as generateCoreTalentData };
