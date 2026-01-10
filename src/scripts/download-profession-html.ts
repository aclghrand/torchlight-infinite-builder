import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const downloadProfessionHTML = async (): Promise<void> => {
  try {
    // Read professions from the JSON file
    const professionsPath = join(process.cwd(), "data", "professions.json");
    const professionsData = await readFile(professionsPath, "utf-8");
    const professions: string[] = JSON.parse(professionsData);

    console.log(`Found ${professions.length} professions to download\n`);

    // Download HTML for each profession tree
    for (let i = 0; i < professions.length; i++) {
      const profession = professions[i];
      console.log(
        `[${i + 1}/${professions.length}] Downloading ${profession}...`,
      );

      try {
        // Convert profession name to URL format (replace spaces with underscores)
        const professionUrlName = profession.replace(/ /g, "_");
        const url = `https://tlidb.com/en/${professionUrlName}#ProfessionTree`;

        // Fetch the HTML
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch: ${response.status} ${response.statusText}`,
          );
        }

        const html = await response.text();

        // Save to .garbage directory
        const filename = `${professionUrlName.toLowerCase()}_profession_tree.html`;
        const filepath = join(process.cwd(), ".garbage", filename);
        await writeFile(filepath, html, "utf-8");

        console.log(`  ✓ Saved to ${filename}\n`);
      } catch (error) {
        console.error(`  ✗ Failed to download ${profession}:`, error);
        console.log();
      }
    }

    console.log("✓ Finished downloading all profession tree HTML files");
  } catch (error) {
    console.error("Failed to download profession HTML files:", error);
    throw error;
  }
};

downloadProfessionHTML()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });

export { downloadProfessionHTML };
