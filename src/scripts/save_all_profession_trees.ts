import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { scrapeProfessionTree } from "./scrape_profession_tree";

const saveAllProfessionTrees = async (): Promise<void> => {
  try {
    // Read professions from the JSON file
    const professionsPath = join(process.cwd(), "data", "professions.json");
    const professionsData = await readFile(professionsPath, "utf-8");
    const professions: string[] = JSON.parse(professionsData);

    console.log(`Found ${professions.length} professions to scrape\n`);

    // Scrape each profession tree
    for (let i = 0; i < professions.length; i++) {
      const profession = professions[i];
      console.log(`[${i + 1}/${professions.length}] Scraping ${profession}...`);

      try {
        // Convert profession name to URL format (replace spaces with underscores)
        const professionUrlName = profession.replace(/ /g, "_");
        const nodes = await scrapeProfessionTree(professionUrlName);

        // Save to file
        const filename = `${professionUrlName.toLowerCase()}_tree.json`;
        const filepath = join(process.cwd(), "data", filename);
        await writeFile(filepath, JSON.stringify(nodes, null, 2), "utf-8");

        console.log(`  ✓ Saved ${nodes.length} nodes to ${filename}\n`);
      } catch (error) {
        console.error(`  ✗ Failed to scrape ${profession}:`, error);
        console.log();
      }
    }

    console.log("✓ Finished scraping all profession trees");
  } catch (error) {
    console.error("Failed to save profession trees:", error);
    throw error;
  }
};

if (require.main === module) {
  saveAllProfessionTrees()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

export { saveAllProfessionTrees };
