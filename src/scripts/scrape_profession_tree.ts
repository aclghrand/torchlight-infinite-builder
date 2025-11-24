import * as cheerio from "cheerio";

interface TalentNode {
  nodeType: "micro" | "medium" | "legendary";
  affixLines: string[];
  position: { x: number; y: number };
  prerequisite?: { x: number; y: number };
  levelUpTime: number;
}

interface NodeData {
  cx: number;
  cy: number;
  gridX: number;
  gridY: number;
  type: "micro" | "medium" | "legendary";
  affixLines: string[];
  levelUpTime: number;
}

const TALENT_TYPE_MAP: Record<string, "micro" | "medium" | "legendary"> = {
  "1": "micro",
  "3": "medium",
  "4": "legendary",
};

/**
 * Converts pixel coordinates to grid coordinates
 */
const pixelToGrid = (cx: number, cy: number): { x: number; y: number } => {
  const gridX = Math.round((cx - 96) / 128);
  const gridY = Math.round((cy - 80) / 96);
  return { x: gridX, y: gridY };
};

/**
 * Decodes HTML entities using the browser's built-in decoder
 */
const decodeHtmlEntities = (text: string): string => {
  // Use cheerio to decode HTML entities
  const $ = cheerio.load(`<div>${text}</div>`);
  return $("div").html() || text;
};

/**
 * Parses affixes from HTML tooltip content
 */
const parseAffixes = (htmlContent: string): string[] => {
  const decoded = decodeHtmlEntities(htmlContent);
  const $ = cheerio.load(decoded);

  // Remove the talent type div and get the remaining text
  $("div.fw-bold").remove();
  const text = $.text().trim();

  if (!text) return [];

  // Split by <br /> or <br> tags in the original HTML
  const affixLines = decoded
    .replace(/<div[^>]*>.*?<\/div>/gi, "") // Remove div tags
    .split(/<br\s*\/?>/i) // Split by <br> tags
    .map((line) => cheerio.load(line).text().trim())
    .filter((line) => line.length > 0);

  return affixLines;
};

/**
 * Scrapes the profession tree page and returns all talent nodes
 */
const scrapeProfessionTree = async (
  professionName: string
): Promise<TalentNode[]> => {
  try {
    const url = `https://tlidb.com/en/${professionName}#ProfessionTree`;
    console.log(`Fetching profession tree from: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch: ${response.status} ${response.statusText}`
      );
    }

    const html = await response.text();

    // Parse HTML with cheerio in XML mode to handle SVG properly
    const $ = cheerio.load(html, { xmlMode: false });

    // Extract all talent nodes
    const nodesData: NodeData[] = [];

    $("circle.talent_bg").each((_, circle) => {
      const $circle = $(circle);
      const cx = parseFloat($circle.attr("cx") || "0");
      const cy = parseFloat($circle.attr("cy") || "0");

      // Extract talent type from class
      const classAttr = $circle.attr("class") || "";
      const typeMatch = classAttr.match(/talent_type(\d+)/);
      if (!typeMatch) return;

      const typeNum = typeMatch[1];
      const type = TALENT_TYPE_MAP[typeNum];
      if (!type) return;

      // Find corresponding image element (at cx-32, cy-32)
      const imageX = cx - 32;
      const imageY = cy - 32;
      const $image = $(`image.talent[x="${imageX}"][y="${imageY}"]`);

      if ($image.length === 0) return;

      // Extract affixes from tooltip
      const tooltipHtml = $image.attr("data-bs-title") || "";
      const affixLines = parseAffixes(tooltipHtml);

      // Find level-up time text element
      // The text is positioned slightly offset from the circle center
      const textX = cx + 22; // Observed offset
      const $levelUpText = $(`text.level_up_time[x="${textX}"]`).filter(
        (_, el) => {
          const y = parseFloat($(el).attr("y") || "0");
          return Math.abs(y - (cy + 26)) < 5; // Allow small tolerance
        }
      );

      const levelUpTime = parseInt($levelUpText.text() || "0", 10);

      const { x: gridX, y: gridY } = pixelToGrid(cx, cy);

      nodesData.push({
        cx,
        cy,
        gridX,
        gridY,
        type,
        affixLines,
        levelUpTime,
      });
    });

    // Extract connection lines to determine prerequisites
    // Lines connect from right edge of prereq (cx+32) to left edge of dependent (cx-32)
    const CIRCLE_RADIUS = 32;

    // Helper to find node by edge coordinates
    const findNodeByEdge = (
      edgeX: number,
      edgeY: number,
      isRightEdge: boolean
    ): NodeData | undefined => {
      // Convert edge coordinate to center coordinate
      const cx = isRightEdge ? edgeX - CIRCLE_RADIUS : edgeX + CIRCLE_RADIUS;

      // Y-offset varies by row, so we use a larger tolerance
      return nodesData.find((node) => {
        return Math.abs(node.cx - cx) <= 5 && Math.abs(node.cy - edgeY) <= 40;
      });
    };

    // Build final talent node objects
    const talentNodes: TalentNode[] = nodesData.map((node) => {
      // Find connection where this node's left edge is the endpoint (x1)
      const nodeLeftEdge = node.cx - CIRCLE_RADIUS;

      const connection = $("g.connections line")
        .filter((_, line) => {
          const $line = $(line);
          const x1 = parseFloat($line.attr("x1") || "0");
          const y1 = parseFloat($line.attr("y1") || "0");

          // Check if this line connects to this node's left edge
          return (
            Math.abs(x1 - nodeLeftEdge) <= 5 && Math.abs(y1 - node.cy) <= 40
          );
        })
        .first();

      let prerequisite: { x: number; y: number } | undefined;
      if (connection.length > 0) {
        const x2 = parseFloat(connection.attr("x2") || "0");
        const y2 = parseFloat(connection.attr("y2") || "0");

        // x2,y2 is the right edge of the prerequisite node
        const prereqNode = findNodeByEdge(x2, y2, true);
        if (prereqNode) {
          prerequisite = { x: prereqNode.gridX, y: prereqNode.gridY };
        }
      }

      return {
        nodeType: node.type,
        affixLines: node.affixLines,
        position: { x: node.gridX, y: node.gridY },
        ...(prerequisite && { prerequisite }),
        levelUpTime: node.levelUpTime,
      };
    });

    return talentNodes;
  } catch (error) {
    console.error("Error scraping profession tree:", error);
    throw error;
  }
};

// Run the script if executed directly
if (require.main === module) {
  (async () => {
    try {
      const professionName = process.argv[2];

      if (!professionName) {
        console.error("Usage: tsx scrape_profession_tree.ts <profession_name>");
        console.error('Example: tsx scrape_profession_tree.ts "God_of_Might"');
        process.exit(1);
      }

      const nodes = await scrapeProfessionTree(professionName);
      console.log(`\nFound ${nodes.length} talent nodes:\n`);
      console.log(JSON.stringify(nodes, null, 2));
    } catch (error) {
      console.error("Script failed:", error);
      process.exit(1);
    }
  })();
}

export { scrapeProfessionTree };
