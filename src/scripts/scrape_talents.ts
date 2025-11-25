import * as cheerio from "cheerio";

const TALENT_PAGE_URL = "https://tlidb.com/en/Talent";

/**
 * Scrapes the talent page and returns a list of all profession names
 */
const scrapeTalentPage = async (): Promise<string[]> => {
  try {
    // Fetch the HTML from the talent page
    const response = await fetch(TALENT_PAGE_URL);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch: ${response.status} ${response.statusText}`,
      );
    }

    const html = await response.text();

    // Parse HTML with cheerio
    const $ = cheerio.load(html);

    // Extract all profession names from the Profession tab
    const professions: string[] = [];

    $("#Profession .row.row-cols-1 > .col").each((_, card) => {
      const professionLink = $(card).find(".flex-grow-1 a");
      const professionName = professionLink.text().trim();

      if (professionName && professionName !== "New God") {
        professions.push(professionName);
      }
    });

    return professions;
  } catch (error) {
    console.error("Error scraping talent page:", error);
    throw error;
  }
};

// Run the script if executed directly
if (require.main === module) {
  scrapeTalentPage()
    .then((professions) => {
      console.log(`Found ${professions.length} professions:\n`);
      professions.forEach((profession, index) => {
        console.log(`${index + 1}. ${profession}`);
      });
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

export { scrapeTalentPage };
