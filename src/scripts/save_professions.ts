import { scrapeTalentPage } from "./scrape_talents";
import { writeFile } from "fs/promises";
import { join } from "path";

const saveProfessions = async (): Promise<void> => {
  try {
    const professions = await scrapeTalentPage();
    const dataPath = join(process.cwd(), "data", "professions.json");

    await writeFile(dataPath, JSON.stringify(professions, null, 2), "utf-8");

    console.log(
      `✓ Saved ${professions.length} professions to data/professions.json`,
    );
  } catch (error) {
    console.error("Failed to save professions:", error);
    throw error;
  }
};

if (require.main === module) {
  saveProfessions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

export { saveProfessions };
