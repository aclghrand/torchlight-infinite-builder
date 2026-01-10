import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as cheerio from "cheerio";

const downloadTalentIcons = async (): Promise<void> => {
  try {
    // Create output directory
    const outputDir = join(process.cwd(), "public", "tli", "talents");
    await mkdir(outputDir, { recursive: true });
    console.log(`Created output directory: ${outputDir}\n`);

    // Read all HTML files from .garbage directory
    const garbageDir = join(process.cwd(), ".garbage");
    const files = await readdir(garbageDir);
    const htmlFiles = files.filter((f) => f.endsWith("_profession_tree.html"));

    console.log(`Found ${htmlFiles.length} HTML files to process\n`);

    // Extract unique icon names
    const iconNames = new Set<string>();

    for (const file of htmlFiles) {
      const filepath = join(garbageDir, file);
      const html = await readFile(filepath, "utf-8");
      const $ = cheerio.load(html);

      // Find all talent image elements
      $("image.talent").each((_, el) => {
        const href = $(el).attr("xlink:href") || $(el).attr("href") || "";
        const iconMatch = href.match(/\/Talent\/64\/(\w+)_64\.webp$/);

        if (iconMatch) {
          iconNames.add(iconMatch[1]);
        }
      });
    }

    console.log(`Found ${iconNames.size} unique talent icons\n`);

    // Download each icon
    let downloaded = 0;
    let failed = 0;

    for (const iconName of Array.from(iconNames).sort()) {
      const url = `https://cdn.tlidb.com/UI/Textures/Common/Icon/Silhouette/Talent/64/${iconName}_64.webp`;
      const outputPath = join(outputDir, `${iconName}.webp`);

      try {
        console.log(`Downloading ${iconName}...`);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch: ${response.status} ${response.statusText}`,
          );
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await writeFile(outputPath, buffer);
        downloaded++;
        console.log(`  ✓ Saved to ${iconName}.webp`);
      } catch (error) {
        failed++;
        console.error(`  ✗ Failed to download ${iconName}:`, error);
      }
    }

    console.log(`\n✓ Downloaded ${downloaded} icons`);
    if (failed > 0) {
      console.log(`✗ Failed to download ${failed} icons`);
    }
  } catch (error) {
    console.error("Failed to download talent icons:", error);
    throw error;
  }
};

downloadTalentIcons()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });

export { downloadTalentIcons };
