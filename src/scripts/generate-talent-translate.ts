import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { program } from "commander";
import { Talents } from "@/src/data/talent/talents";
import { fetchPage, processInBatches, toSnakeCase } from "./tlidb-tools";

export type Translate = "en" | "cn";

const BASE_URL = "https://tlidb.com";
const TLIDB_DIR = join(process.cwd(), ".garbage", "tlidb");
// Read name and tree of Talents

const getTalentSet = (): Set<string> => {
  const TalentSet = new Set<string>();
  for (const talent of Talents) {
    TalentSet.add(talent.tree);
    TalentSet.add(talent.name);
  }
  return TalentSet;
};

const fetchTalentPages = async (locale: Translate): Promise<void> => {
  const outDir = join(TLIDB_DIR, locale, "talent");
  await mkdir(outDir, { recursive: true });

  const talentSet = getTalentSet();
  console.log(`Found ${talentSet.size} talents`);

  if (talentSet.size === 0) {
    throw new Error("No legendary gear links found. Check the page structure.");
  }

  console.log(`Fetching ${talentSet.size} pages...`);

  let numoferror = 0;
  await processInBatches([...talentSet], async (name: string) => {
    const snakeCaseName = toSnakeCase(name);
    const filename = `${snakeCaseName}.html`;
    const filepath = join(outDir, filename);

    try {
      const url = `${BASE_URL}/${locale}/${name.replace(/ /g, "_")}`;
      const html = await fetchPage(url);
      await writeFile(filepath, html);
      console.log(`Saved: ${filepath}`);
    } catch (error) {
      numoferror += 1;
      console.error(`Error fetching ${name}:`, error);
    }
  });

  console.log("Fetching complete!, total errors:", numoferror);
};

const generateTranslateNames = async (
  locale: Translate,
): Promise<{ en: string; trans: string }[]> => {
  console.log("Fetching Chinese translations for Talents...");
  const outDir = join(TLIDB_DIR, locale, "talent");
  const talentSet = getTalentSet();
  const results: { en: string; trans: string }[] = [];
  for (const name of talentSet) {
    if (name.length === 0) {
      continue;
    }
    const snakeCaseName = toSnakeCase(name);
    const filename = `${snakeCaseName}.html`;
    const filepath = join(outDir, filename);

    const html = await readFile(filepath, "utf-8");

    // Extract Chinese name from h1 label like  <div class="card-header">机械之神 /34 </div>
    const cardHeaderMatch = html.match(
      /<div class="card-header">([^<]+)<\/div>/i,
    );

    if (cardHeaderMatch) {
      const transName = cardHeaderMatch[1].trim().split("/")[0].trim();
      results.push({ en: name, trans: transName });
    } else {
      console.log(`No translation found for Talent: ${name}`);
      results.push({ en: name, trans: "" });
    }
  }
  return results;
};

const generateTalentPO = async (): Promise<void> => {
  const Translations = await generateTranslateNames("cn");
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
  for (const r of Translations) {
    po += `#. js-lingui-explicit-id\n`;
    po += `#: src/data/translate/talents.ts:${n}\n`;
    po += `msgid "${r.en}"\n`;
    po += `msgstr "${r.trans}"\n\n`;
    n += 1;
  }

  const outDir = join(process.cwd(), "src", "locales");
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, "zh", "talents.po"), po);
  console.log("Done! Generated src/locales/zh/talents.po");
};

const generateTalentTS = async () => {
  const talentSet = getTalentSet();
  const text = `import { i18n } from "@lingui/core";

export const talentNames = [
${[...talentSet].map((name: string) => `  i18n._("${name}")`).join(",\n")},
] as const;
`;

  const outDir = join(process.cwd(), "src", "data", "translate");
  await mkdir(outDir, { recursive: true });

  await writeFile(join(outDir, "talents.ts"), text);
};

interface Options {
  refetch: boolean;
}

const main = async (options: Options) => {
  if (options.refetch) {
    console.log("Refetching legendary pages from tlidb...\n");
    await fetchTalentPages("cn");
    console.log("");
  }
  await generateTalentPO();
  await generateTalentTS();
};

program
  .description("Generate talent translate from cached HTML pages")
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
