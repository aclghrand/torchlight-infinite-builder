import { execSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as cheerio from "cheerio";
import type { BaseSkill } from "../data/skill/types";

interface RawSkill {
  type: string;
  name: string;
  tags: string[];
  description: string[];
}

// Maps JSON type → file key and type names
const SKILL_TYPE_CONFIG = {
  Active: { fileKey: "active", constName: "ActiveSkills" },
  Passive: { fileKey: "passive", constName: "PassiveSkills" },
  Support: { fileKey: "support", constName: "SupportSkills" },
  "Support (Magnificent)": {
    fileKey: "support_magnificent",
    constName: "MagnificentSupportSkills",
  },
  "Support (Noble)": {
    fileKey: "support_noble",
    constName: "NobleSupportSkills",
  },
  "Activation Medium": {
    fileKey: "activation_medium",
    constName: "ActivationMediumSkills",
  },
} as const;

type SkillTypeKey = keyof typeof SKILL_TYPE_CONFIG;

const extractSkillData = (html: string): RawSkill[] => {
  const $ = cheerio.load(html);
  const skills: RawSkill[] = [];

  const rows = $('#skill tbody tr[class*="thing"]');
  console.log(`Found ${rows.length} skill rows`);

  rows.each((_, row) => {
    const tds = $(row).find("td");

    if (tds.length !== 4) {
      console.warn(`Skipping row with ${tds.length} columns (expected 4)`);
      return;
    }

    const tags: string[] = [];
    $(tds[2])
      .find("span.multiVal")
      .each((_, elem) => {
        tags.push($(elem).text().replace(/\s+/g, " ").trim());
      });

    // Extract description from Effect column, split by <hr> tags
    const effectHtml = $(tds[3]).html() ?? "";
    const description = effectHtml
      .split(/<hr\s*\/?>/i)
      .map((block) => {
        // Replace <br> tags with newlines
        const withNewlines = block.replace(/<br\s*\/?>/gi, "\n");
        // Strip remaining HTML tags and get text
        const text = cheerio.load(withNewlines).text();
        // Normalize the text:
        // - Replace mid-sentence newlines with spaces (line-wrap artifacts)
        // - Keep newlines after sentence-ending punctuation
        // - Collapse multiple spaces and trim around newlines
        return text
          .replace(/([^.!?\n])\n+/g, "$1 ") // Mid-sentence newline → space
          .replace(/ *\n */g, "\n") // Trim spaces around newlines
          .replace(/\n{2,}/g, "\n") // Collapse multiple newlines to single
          .replace(/[ \t]+/g, " ") // Collapse horizontal whitespace
          .trim();
      })
      .filter((block) => block.length > 0);

    const skill: RawSkill = {
      type: $(tds[0]).text().trim(),
      name: $(tds[1]).text().trim(),
      tags,
      description,
    };

    skills.push(skill);
  });

  return skills;
};

const generateSkillTypeFile = (
  constName: string,
  skills: BaseSkill[],
): string => {
  return `import { BaseSkill } from "./types";

export const ${constName}: readonly BaseSkill[] = ${JSON.stringify(skills, null, 2)};
`;
};

const main = async (): Promise<void> => {
  console.log("Reading HTML file...");
  const htmlPath = join(process.cwd(), ".garbage", "codex.html");
  const html = await readFile(htmlPath, "utf-8");

  console.log("Extracting skill data...");
  const rawData = extractSkillData(html);
  console.log(`Extracted ${rawData.length} skills`);

  // Group by skill type
  const grouped = new Map<SkillTypeKey, BaseSkill[]>();

  for (const raw of rawData) {
    const skillType = raw.type as SkillTypeKey;

    if (!(skillType in SKILL_TYPE_CONFIG)) {
      console.warn(`Unknown skill type: ${skillType}`);
      continue;
    }

    const skillEntry: BaseSkill = {
      type: raw.type as BaseSkill["type"],
      name: raw.name,
      tags: raw.tags as unknown as BaseSkill["tags"],
      description: raw.description,
    };

    if (!grouped.has(skillType)) {
      grouped.set(skillType, []);
    }
    grouped.get(skillType)?.push(skillEntry);
  }

  console.log(`Grouped into ${grouped.size} skill types`);

  // Create output directory
  const outDir = join(process.cwd(), "src", "data", "skill");
  await mkdir(outDir, { recursive: true });

  // Generate individual skill type files
  for (const [skillType, skills] of grouped) {
    const config = SKILL_TYPE_CONFIG[skillType];
    const fileName = `${config.fileKey}.ts`;
    const filePath = join(outDir, fileName);
    const content = generateSkillTypeFile(config.constName, skills);

    await writeFile(filePath, content, "utf-8");
    console.log(`Generated ${fileName} (${skills.length} skills)`);
  }

  console.log("\nCode generation complete!");
  console.log(
    `Generated ${grouped.size} skill type files with ${rawData.length} total skills`,
  );

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

export { main as generateSkillData };
