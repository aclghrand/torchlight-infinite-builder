import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://tlidb.com/en";
const LEGENDARY_GEAR_LIST_URL = `${BASE_URL}/Legendary_Gear`;
const OUTPUT_DIR = ".garbage/tlidb";
const LEGENDARY_GEAR_DIR = `${OUTPUT_DIR}/legendary_gear`;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    .replace(/['']/g, "") // Remove apostrophes
    .replace(/[^a-z0-9]+/g, "_") // Replace non-alphanumeric with underscores
    .replace(/^_+|_+$/g, ""); // Trim leading/trailing underscores
};

const extractLegendaryGearLinks = (
  html: string,
): { href: string; name: string }[] => {
  // Find the LegendaryGear div
  const legendaryGearMatch = html.match(
    /<div[^>]*id="LegendaryGear"[^>]*>([\s\S]*?)(?=<div[^>]*id="|$)/i,
  );
  if (!legendaryGearMatch) {
    // Try class-based match
    const classMatch = html.match(
      /<div[^>]*class="[^"]*LegendaryGear[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="|$)/i,
    );
    if (!classMatch) {
      console.log("Could not find LegendaryGear div, searching entire page");
    }
  }

  // Extract links with data-hover attribute (legendary gear pattern)
  // Pattern: <a data-hover="?s=ItemGold%2F..." href="Name">Display Name</a>
  const linkRegex =
    /<a[^>]*data-hover="[^"]*ItemGold[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  const links: { href: string; name: string }[] = [];

  let match: RegExpExecArray | null = linkRegex.exec(html);
  while (match !== null) {
    const href = match[1];
    const name = match[2];

    // Filter out external links and anchors
    if (
      href &&
      !href.startsWith("http") &&
      !href.startsWith("#") &&
      !href.startsWith("/")
    ) {
      links.push({ href, name });
    }
    match = linkRegex.exec(html);
  }

  // Deduplicate by href
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
};

const main = async () => {
  // Create directories
  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(LEGENDARY_GEAR_DIR, { recursive: true });

  // Fetch main legendary gear list page
  const listPagePath = path.join(OUTPUT_DIR, "legendary_gear.html");
  let listHtml: string;

  if (existsSync(listPagePath)) {
    console.log("Using cached legendary gear list page");
    listHtml = await readFile(listPagePath, "utf-8");
  } else {
    listHtml = await fetchPage(LEGENDARY_GEAR_LIST_URL);
    await writeFile(listPagePath, listHtml);
    console.log(`Saved: ${listPagePath}`);
  }

  // Extract legendary gear links
  const gearLinks = extractLegendaryGearLinks(listHtml);
  console.log(`Found ${gearLinks.length} legendary gear links`);

  if (gearLinks.length === 0) {
    console.log("No links found. Check the page structure.");
    // Save a sample of the HTML for debugging
    console.log("Sample of HTML:");
    console.log(listHtml.substring(0, 2000));
    return;
  }

  // Fetch each legendary gear page
  for (const { href, name } of gearLinks) {
    const snakeCaseName = toSnakeCase(name);
    const filename = `${snakeCaseName}.html`;
    const filepath = path.join(LEGENDARY_GEAR_DIR, filename);

    if (existsSync(filepath)) {
      console.log(`Skipping (already exists): ${filename}`);
      continue;
    }

    try {
      // Decode first to handle already-encoded characters
      const decodedHref = decodeURIComponent(href);
      const url = `${BASE_URL}/${encodeURIComponent(decodedHref)}`;
      const html = await fetchPage(url);
      await writeFile(filepath, html);
      console.log(`Saved: ${filepath}`);

      // Be polite to the server
      await delay(200);
    } catch (error) {
      console.error(`Error fetching ${name} (${href}):`, error);
    }
  }

  console.log("Done!");
};

main().catch(console.error);
