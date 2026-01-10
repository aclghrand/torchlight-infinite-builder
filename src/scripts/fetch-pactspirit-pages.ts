import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://tlidb.com/en";
const PACTSPIRIT_LIST_URL = `${BASE_URL}/Pactspirit`;
const OUTPUT_DIR = ".garbage/tlidb";
const PACTSPIRITS_DIR = `${OUTPUT_DIR}/pactspirits`;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchPage = async (url: string): Promise<string> => {
  console.log(`Fetching: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
};

const extractNonDropPactspiritLinks = (html: string): string[] => {
  // Each pactspirit is in a <div class="col"> block
  // We need to find each block and check if it contains "Increases Drop Quantity"
  const colBlockRegex =
    /<div class="col"><div class="d-flex[^>]*>[\s\S]*?<\/div><\/div><\/div>/g;
  const hrefRegex = /href="([^"]+)"/;
  const links: string[] = [];

  const blocks = html.match(colBlockRegex) || [];

  for (const block of blocks) {
    // Skip drop pactspirits
    if (block.includes("Increases Drop Quantity")) {
      const hrefMatch = block.match(hrefRegex);
      if (hrefMatch) {
        console.log(
          `Filtering out (drop pactspirit): ${decodeURIComponent(hrefMatch[1])}`,
        );
      }
      continue;
    }

    const hrefMatch = block.match(hrefRegex);
    if (hrefMatch) {
      const href = hrefMatch[1];
      // Filter for pactspirit-like links
      if (
        href &&
        !href.startsWith("http") &&
        !href.startsWith("#") &&
        !href.startsWith("/") &&
        !href.includes(".") &&
        !href.includes("?")
      ) {
        links.push(href);
      }
    }
  }

  // Deduplicate
  return [...new Set(links)];
};

const main = async () => {
  // Create directories
  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(PACTSPIRITS_DIR, { recursive: true });

  // Fetch main pactspirit list page
  const listPagePath = path.join(OUTPUT_DIR, "pactspirit.html");
  let listHtml: string;

  if (existsSync(listPagePath)) {
    console.log("Using cached pactspirit list page");
    listHtml = await readFile(listPagePath, "utf-8");
  } else {
    listHtml = await fetchPage(PACTSPIRIT_LIST_URL);
    await writeFile(listPagePath, listHtml);
    console.log(`Saved: ${listPagePath}`);
  }

  // Extract non-drop pactspirit links (filtering happens here)
  const pactspiritLinks = extractNonDropPactspiritLinks(listHtml);
  console.log(`Found ${pactspiritLinks.length} non-drop pactspirit links`);

  // Fetch each pactspirit page
  for (const link of pactspiritLinks) {
    // Decode first to handle already-encoded characters (e.g., %27 for apostrophe)
    const decodedLink = decodeURIComponent(link);
    const filename = `${decodedLink}.html`;
    const filepath = path.join(PACTSPIRITS_DIR, filename);

    if (existsSync(filepath)) {
      console.log(`Skipping (already exists): ${filename}`);
      continue;
    }

    try {
      const url = `${BASE_URL}/${encodeURIComponent(decodedLink)}`;
      const html = await fetchPage(url);
      await writeFile(filepath, html);
      console.log(`Saved: ${filepath}`);

      // Be polite to the server
      await delay(200);
    } catch (error) {
      console.error(`Error fetching ${link}:`, error);
    }
  }

  console.log("Done!");
};

main().catch(console.error);
