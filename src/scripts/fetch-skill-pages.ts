import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://tlidb.com/en";
const OUTPUT_DIR = ".garbage/tlidb/skill";

const SKILL_TYPES = [
  {
    name: "Active",
    listPath: "Active_Skill",
    outputDir: "active",
    tabId: "ActiveSkillTag",
    expectedCount: 148,
  },
  {
    name: "Support",
    listPath: "Support_Skill",
    outputDir: "support",
    tabId: "SupportSkillTag",
    expectedCount: 121,
  },
  {
    name: "Passive",
    listPath: "Passive_Skill",
    outputDir: "passive",
    tabId: "PassiveSkillTag",
    expectedCount: 53,
  },
  {
    name: "Activation Medium",
    listPath: "Activation_Medium_Skill",
    outputDir: "activation_medium",
    tabId: "ActivationMediumSkillTag",
    expectedCount: 27,
  },
  {
    name: "Noble Support",
    listPath: "Noble_Support_Skill",
    outputDir: "noble_support",
    tabId: "ExclusiveSupportSkillTag",
    expectedCount: 137,
  },
  {
    name: "Magnificent Support",
    listPath: "Magnificent_Support_Skill",
    outputDir: "magnificent_support",
    tabId: "ExclusiveSupportSkillTag",
    expectedCount: 130,
  },
] as const;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchPage = async (url: string): Promise<string> => {
  console.log(`Fetching: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
};

const extractSkillLinks = (html: string, tabId: string): string[] => {
  // Find the skill tag div and extract only from within it
  // Pattern: <div id="[tabId]" class="tab-pane ...">...</div>
  // The next tab-pane div marks the end
  const tabStartRegex = new RegExp(`<div\\s+id="${tabId}"[^>]*>`);
  const tabMatch = html.match(tabStartRegex);
  if (!tabMatch || tabMatch.index === undefined) {
    console.warn(`Could not find tab with id="${tabId}"`);
    return [];
  }

  // Find where the tab content ends (next tab-pane or end of tab-content)
  const startIdx = tabMatch.index;
  const afterStart = html.slice(startIdx);
  const nextTabMatch = afterStart.match(
    /<div\s+id="[^"]+"\s+class="tab-pane[^"]*"[^>]*>/,
  );
  const endIdx = nextTabMatch?.index
    ? startIdx + nextTabMatch.index
    : html.length;

  const tabContent = html.slice(startIdx, endIdx);

  // Extract skill links from within <div class="col"> elements
  // Each skill is in: <div class="col"><div class="d-flex...">...<a href="Skill_Name">...
  const colRegex = /<div class="col"[^>]*>[\s\S]*?<\/div><\/div><\/div>/g;
  const hrefRegex = /<a[^>]+href="([^"]+)"[^>]*>/;
  const links: string[] = [];

  for (const colMatch of tabContent.matchAll(colRegex)) {
    const colHtml = colMatch[0];
    const hrefMatch = colHtml.match(hrefRegex);
    if (hrefMatch) {
      const href = hrefMatch[1];
      if (
        href &&
        !href.startsWith("http") &&
        !href.startsWith("#") &&
        !href.startsWith("/")
      ) {
        links.push(href);
      }
    }
  }

  // Deduplicate
  return [...new Set(links)];
};

const fetchSkillType = async (skillType: (typeof SKILL_TYPES)[number]) => {
  const skillDir = path.join(OUTPUT_DIR, skillType.outputDir);
  await mkdir(skillDir, { recursive: true });

  // Fetch or use cached list page
  const listPagePath = path.join(OUTPUT_DIR, `${skillType.outputDir}.html`);
  let listHtml: string;

  if (existsSync(listPagePath)) {
    console.log(`Using cached ${skillType.name} list page`);
    listHtml = await readFile(listPagePath, "utf-8");
  } else {
    const listUrl = `${BASE_URL}/${skillType.listPath}`;
    listHtml = await fetchPage(listUrl);
    await writeFile(listPagePath, listHtml);
    console.log(`Saved: ${listPagePath}`);
  }

  // Extract skill links from the specific skill tag tab
  const skillLinks = extractSkillLinks(listHtml, skillType.tabId);
  console.log(
    `Found ${skillLinks.length} ${skillType.name} skills (expected: ${skillType.expectedCount})`,
  );

  if (skillLinks.length !== skillType.expectedCount) {
    console.warn(
      `⚠️  Count mismatch for ${skillType.name}: found ${skillLinks.length}, expected ${skillType.expectedCount}`,
    );
  }

  // Fetch each skill page
  for (const link of skillLinks) {
    const decodedLink = decodeURIComponent(link);
    const filename = `${decodedLink}.html`;
    const filepath = path.join(skillDir, filename);

    if (existsSync(filepath)) {
      console.log(`Skipping (already exists): ${filename}`);
      continue;
    }

    try {
      const url = `${BASE_URL}/${encodeURIComponent(decodedLink)}`;
      const html = await fetchPage(url);
      await writeFile(filepath, html);
      console.log(`Saved: ${filepath}`);

      await delay(200);
    } catch (error) {
      console.error(`Error fetching ${link}:`, error);
    }
  }

  return skillLinks.length;
};

const main = async () => {
  await mkdir(OUTPUT_DIR, { recursive: true });

  let totalSkills = 0;
  const expectedTotal = SKILL_TYPES.reduce(
    (sum, type) => sum + type.expectedCount,
    0,
  );

  for (const skillType of SKILL_TYPES) {
    console.log(`\n--- Processing ${skillType.name} Skills ---`);
    const count = await fetchSkillType(skillType);
    totalSkills += count;
  }

  console.log(`\n=== Summary ===`);
  console.log(
    `Total skills fetched: ${totalSkills} (expected: ${expectedTotal})`,
  );

  if (totalSkills !== expectedTotal) {
    console.warn(`⚠️  Total count mismatch!`);
  } else {
    console.log(`✓ All skill counts match!`);
  }

  console.log("Done!");
};

main().catch(console.error);
