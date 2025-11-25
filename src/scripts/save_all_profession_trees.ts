import { writeFile } from "fs/promises";
import { join } from "path";
import { scrapeProfessionTree } from "./scrape_profession_tree";
import { PROFESSION_TREES, GOD_GODDESS_TREES } from "../tli/talent_tree_types";

const formatTreeAsTypeScript = (
  treeName: string,
  treeData: { name: string; nodes: any[] },
): string => {
  const constName = treeName.toUpperCase();
  return `import { TalentTreeData } from "../core";

export const ${constName}: TalentTreeData = ${JSON.stringify(treeData, null, 2)} as const;
`;
};

const saveAllProfessionTrees = async (): Promise<void> => {
  try {
    // Combine all tree names
    const allTrees = [...PROFESSION_TREES, ...GOD_GODDESS_TREES];

    console.log(`Found ${allTrees.length} professions to scrape\n`);

    const savedTrees: string[] = [];

    // Scrape each profession tree
    for (let i = 0; i < allTrees.length; i++) {
      const treeName = allTrees[i];
      console.log(`[${i + 1}/${allTrees.length}] Scraping ${treeName}...`);

      try {
        const talentTree = await scrapeProfessionTree(treeName);

        // Save to TypeScript file
        const filename = `${treeName.toLowerCase()}.ts`;
        const filepath = join(
          process.cwd(),
          "src",
          "tli",
          "talent_data",
          filename,
        );
        const tsContent = formatTreeAsTypeScript(treeName, talentTree);
        await writeFile(filepath, tsContent, "utf-8");

        savedTrees.push(treeName);
        console.log(
          `  ✓ Saved ${talentTree.nodes.length} nodes to ${filename}\n`,
        );
      } catch (error) {
        console.error(`  ✗ Failed to scrape ${treeName}:`, error);
        console.log();
      }
    }

    console.log("✓ Finished scraping all profession trees");
    console.log(
      `\nSuccessfully saved ${savedTrees.length}/${allTrees.length} trees`,
    );
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
