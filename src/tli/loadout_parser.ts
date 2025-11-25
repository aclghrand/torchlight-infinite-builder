import {
  Affix,
  Gear,
  GearPage,
  Loadout,
  RawGear,
  RawLoadout,
  RawTalentPage,
  RawTalentTree,
  TalentPage,
} from "./core";
import { Mod } from "./mod";
import { parseMod } from "./mod_parser";
import { readFileSync } from "fs";
import { join } from "path";

// Map of tree names to their JSON filenames
// See data/ directory
const TREE_NAME_TO_FILE: Record<string, string> = {
  Alchemist: "alchemist_tree.json",
  Arcanist: "arcanist_tree.json",
  Artisan: "artisan_tree.json",
  Assassin: "assassin_tree.json",
  Bladerunner: "bladerunner_tree.json",
  Druid: "druid_tree.json",
  Elementalist: "elementalist_tree.json",
  God_of_Machines: "god_of_machines_tree.json",
  God_of_Might: "god_of_might_tree.json",
  God_of_War: "god_of_war_tree.json",
  Goddess_of_Deception: "goddess_of_deception_tree.json",
  Goddess_of_Hunting: "goddess_of_hunting_tree.json",
  Goddess_of_Knowledge: "goddess_of_knowledge_tree.json",
  Lich: "lich_tree.json",
  Machinist: "machinist_tree.json",
  Magister: "magister_tree.json",
  Marksman: "marksman_tree.json",
  Onslaughter: "onslaughter_tree.json",
  Prophet: "prophet_tree.json",
  Psychic: "psychic_tree.json",
  Ranger: "ranger_tree.json",
  Ronin: "ronin_tree.json",
  Sentinel: "sentinel_tree.json",
  Shadowdancer: "shadowdancer_tree.json",
  Shadowmaster: "shadowmaster_tree.json",
  Steel_Vanguard: "steel_vanguard_tree.json",
  The_Brave: "the_brave_tree.json",
  Warlock: "warlock_tree.json",
  Warlord: "warlord_tree.json",
  Warrior: "warrior_tree.json",
};

interface TalentTreeNode {
  nodeType: "micro" | "medium" | "legendary";
  rawAffix: string;
  position: {
    x: number;
    y: number;
  };
  prerequisite?: {
    x: number;
    y: number;
  };
  maxPoints: number;
}

interface TalentTreeData {
  name: string;
  nodes: TalentTreeNode[];
}

const parseAffixString = (affixString: string): Affix => {
  const lines = affixString.split("\n").map((line) => line.trim());

  const mods = lines
    .filter((line) => line.length > 0) // Skip empty lines
    .map((line) => parseMod(line))
    .filter((result) => typeof result !== "string"); // Filter out parse failures

  return {
    mods,
    raw: affixString,
  };
};

const parseGear = (rawGear: RawGear): Gear => {
  return {
    gearType: rawGear.gearType,
    affixes: rawGear.affixes.map(parseAffixString),
  };
};

const parseTalentTree = (rawTree: RawTalentTree): Affix[] => {
  // Check if tree name exists in our lookup map
  const treeFileName = TREE_NAME_TO_FILE[rawTree.name];
  if (!treeFileName) {
    throw new Error(`Unknown talent tree name: ${rawTree.name}`);
  }

  // Load the tree data from JSON file
  const treeFilePath = join(process.cwd(), "data", treeFileName);
  const treeData: TalentTreeData = JSON.parse(
    readFileSync(treeFilePath, "utf-8"),
  );

  const affixes: Affix[] = [];

  // Parse each allocated node
  for (const allocatedNode of rawTree.allocatedNodes) {
    // Find the node at the specified coordinates
    const node = treeData.nodes.find(
      (n) =>
        n.position.x === allocatedNode.x && n.position.y === allocatedNode.y,
    );

    if (!node) {
      throw new Error(
        `Node not found at (${allocatedNode.x}, ${allocatedNode.y}) in tree ${rawTree.name}`,
      );
    }

    const baseAffix = parseAffixString(node.rawAffix);

    const scaledMods: Mod[] = baseAffix.mods.map((mod) => {
      // Only mods with easily scalable values can possibly be allocated multiple points
      if ("value" in mod && typeof mod.value === "number") {
        return {
          ...mod,
          value: mod.value * allocatedNode.points,
        } as Mod;
      } else {
        return mod;
      }
    });

    // Create the final affix with metadata
    const affix: Affix = {
      mods: scaledMods,
      raw: baseAffix.raw,
      src: `${rawTree.name} (${allocatedNode.x},${allocatedNode.y}) x${allocatedNode.points}`,
    };

    affixes.push(affix);
  }

  return affixes;
};

const parseTalentPage = (rawTalentPage: RawTalentPage): TalentPage => {
  const allAffixes = [
    ...parseTalentTree(rawTalentPage.tree1),
    ...parseTalentTree(rawTalentPage.tree2),
    ...parseTalentTree(rawTalentPage.tree3),
    ...parseTalentTree(rawTalentPage.tree4),
  ];

  return {
    affixes: allAffixes,
  };
};

export const parse_loadout = (rawLoadout: RawLoadout): Loadout => {
  const gearPage: GearPage = {};

  // Parse each gear slot in the equipment page
  for (const [slot, rawGear] of Object.entries(rawLoadout.equipmentPage)) {
    if (rawGear) {
      gearPage[slot as keyof GearPage] = parseGear(rawGear);
    }
  }

  return {
    equipmentPage: gearPage,
    talentPage: parseTalentPage(rawLoadout.talentPage),
    divinityPage: { slates: [] },
    customConfiguration: [],
  };
};
