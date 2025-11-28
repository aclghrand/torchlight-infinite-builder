import * as cheerio from "cheerio";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { execSync } from "child_process";

interface Blend {
  type: string;
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

const extractBlendData = (html: string): Blend[] => {
  const $ = cheerio.load(html);
  const items: Blend[] = [];

  const rows = $('#blend tbody tr[class*="thing"]');
  console.log(`Found ${rows.length} blend rows`);

  rows.each((_, row) => {
    const tds = $(row).find("td");

    if (tds.length !== 2) {
      console.warn(`Skipping row with ${tds.length} columns (expected 2)`);
      return;
    }

    const item: Blend = {
      type: $(tds[0]).text().trim(),
      effect: cleanEffectText($(tds[1]).html() || ""),
    };

    items.push(item);
  });

  return items;
};

const generateTypesFile = (): string => {
  return `export interface Blend {
  type: string;
  effect: string;
}
`;
};

const generateDataFile = (items: Blend[]): string => {
  return `import type { Blend } from "./types";

export const Blends = ${JSON.stringify(items, null, 2)} as const satisfies readonly Blend[];

export type BlendEntry = (typeof Blends)[number];
`;
};

const generateIndexFile = (): string => {
  return `export * from "./types";
export * from "./blends";
`;
};

const main = async (): Promise<void> => {
  console.log("Reading HTML file...");
  const htmlPath = join(process.cwd(), ".garbage", "codex.html");
  const html = await readFile(htmlPath, "utf-8");

  console.log("Extracting blend data...");
  const items = extractBlendData(html);
  console.log(`Extracted ${items.length} blends`);

  const outDir = join(process.cwd(), "src", "data", "blend");
  await mkdir(outDir, { recursive: true });

  const typesPath = join(outDir, "types.ts");
  await writeFile(typesPath, generateTypesFile(), "utf-8");
  console.log(`Generated types.ts`);

  const dataPath = join(outDir, "blends.ts");
  await writeFile(dataPath, generateDataFile(items), "utf-8");
  console.log(`Generated blends.ts (${items.length} items)`);

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

export { main as generateBlendData };
