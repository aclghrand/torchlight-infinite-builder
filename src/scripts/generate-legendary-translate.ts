import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { program } from "commander";
import { Legendaries } from "@/src/data/legendary/legendaries";
import type { Legendary } from "@/src/data/legendary/types";
import {
  extractLegendaryGearLinks,
  fetchPage,
  processInBatches,
  toSnakeCase,
} from "./tlidb-tools";

export type Translate = "en" | "cn";

const BASE_URL = "https://tlidb.com";
const LEGENDARY_GEAR_DIR = join(process.cwd(), ".garbage", "tlidb");

const fetchLegendaryPages = async (locale: Translate): Promise<void> => {
  const outDir = join(LEGENDARY_GEAR_DIR, locale, "legendary_gear");
  await mkdir(outDir, { recursive: true });

  console.log("Fetching legendary gear list page...");
  const listHtml = await fetchPage(`${BASE_URL}/en/Legendary_Gear`);

  const gearLinks = extractLegendaryGearLinks(listHtml);
  console.log(`Found ${gearLinks.length} legendary gear links`);

  if (gearLinks.length === 0) {
    throw new Error("No legendary gear links found. Check the page structure.");
  }

  console.log(`Fetching ${gearLinks.length} pages...`);

  await processInBatches(gearLinks, async ({ href, name }) => {
    const snakeCaseName = toSnakeCase(name);
    const filename = `${snakeCaseName}.html`;
    const filepath = join(outDir, filename);

    try {
      const decodedHref = decodeURIComponent(href);
      const url = `${BASE_URL}/${locale}/${encodeURIComponent(decodedHref)}`;
      const html = await fetchPage(url);
      await writeFile(filepath, html);
      console.log(`Saved: ${filepath}`);
    } catch (error) {
      console.error(`Error fetching ${name} (${href}):`, error);
    }
  });

  console.log("Fetching complete!");
};

const generateLegendaryNames = (): string => {
  return `import { i18n } from "@lingui/core";

export const legendaryNames = [
${Legendaries.map((l: Legendary) => `  i18n._("${l.name}")`).join(",\n")},
] as const;
`;
};

const fetchTranslateName = async (
  name: string,
  locale: Translate,
): Promise<string> => {
  try {
    const html = await readFile(
      join(
        LEGENDARY_GEAR_DIR,
        locale,
        "legendary_gear",
        `${toSnakeCase(name)}.html`,
      ),
      "utf-8",
    );

    // Extract Chinese name from h1 label like <h1>冰冻目光</h1>
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      return h1Match[1].trim();
    }

    return "";
  } catch (error) {
    console.error(`Error fetching ${name}:`, error);
    return "";
  }
};

const generateTranslateNames = async (locale: Translate): Promise<string> => {
  const results: { en: string; trans: string }[] = [];

  for (const legendary of Legendaries) {
    console.log(`Fetching: ${legendary.name}`);
    const transName = await fetchTranslateName(legendary.name, locale);
    results.push({ en: legendary.name, trans: transName });
    // Rate limiting - small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Generate .po format
  let po = 'msgid ""\n';
  po += 'msgstr ""\n';
  po += '"Project-Id-Version: \\n"\n';
  po += '"Report-Msgid-Bugs-To: \\n"\n';
  po += '"POT-Creation-Date: \\n"\n';
  po += '"PO-Revision-Date: \\n"\n';
  po += '"Last-Translator: \\n"\n';
  po += '"Language: \\n"\n';
  po += '"Language-Team: \\n"\n';
  po += '"Content-Type: \\n"\n';
  po += '"Content-Transfer-Encoding: \\n"\n';
  po += '"Plural-Forms: \\n"\n\n';

  let n = 4;
  for (const r of results) {
    if (!r.trans) continue;
    po += `#. js-lingui-explicit-id\n`;
    po += `#: src/data/translate/legendary-names.ts:${n}\n`;
    po += `msgid "${r.en}"\n`;
    po += `msgstr "${r.trans}"\n\n`;
    n += 1;
  }

  return po;
};

const generateLegendaryPO = async () => {
  const outDir = join(process.cwd(), "src", "locales");
  await mkdir(outDir, { recursive: true });

  console.log("Fetching Chinese translations for Legendaries...");
  const content = await generateTranslateNames("cn");
  await writeFile(join(outDir, "zh", "legendaries.po"), content);
  console.log("Done! Generated src/locales/zh/legendaries.po");
};

const generateLegendaryTS = async () => {
  const outDir = join(process.cwd(), "src", "data", "translate");
  await mkdir(outDir, { recursive: true });

  await writeFile(join(outDir, "legendary-names.ts"), generateLegendaryNames());
};

interface Options {
  refetch: boolean;
}

const main = async (options: Options) => {
  if (options.refetch) {
    console.log("Refetching legendary pages from tlidb...\n");
    await fetchLegendaryPages("cn");
    console.log("");
  }
  await generateLegendaryTS();
  await generateLegendaryPO();
};

program
  .description("Generate legendary translate from cached HTML pages")
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
