import * as R from "remeda";
import type {
  SaveData,
  Gear as SaveDataGear,
  GearPage as SaveDataGearPage,
  TalentPage as SaveDataTalentPage,
  TalentTree as SaveDataTalentTree,
  PlacedPrism as SaveDataPlacedPrism,
  CraftedPrism as SaveDataCraftedPrism,
  PlacedInverseImage as SaveDataPlacedInverseImage,
} from "@/src/app/lib/save-data";
import {
  getEffectModifierForType,
  getTargetAreaPositions,
  reflectPosition,
} from "@/src/app/lib/inverse-image-utils";
import type { TalentNodeData, TreeName } from "@/src/data/talent_tree";
import type {
  Affix,
  EquippedGear,
  Gear,
  GearPage,
  Loadout,
  TalentPage,
  TalentTree,
  TalentNode,
  PlacedPrism,
  CraftedPrism,
  TalentTrees,
  TalentInventory,
} from "../core";
import type { Mod } from "../mod";
import { parseMod } from "../mod_parser";
import {
  getPrismAffixesForNode,
  scaleTalentAffix,
  treeDataByName,
  type TreeSlot,
} from "../talent-affix-utils";

type GearSlot = keyof SaveDataGearPage;

const getSrc = (gearSlot: GearSlot): string => {
  return `Gear#${gearSlot}`;
};

const convertAffix = (affixText: string, src: string | undefined): Affix => {
  const affixLines = affixText.split(/\n/);
  const mods: Mod[] = [];
  for (const affixLine of affixLines) {
    const mod = parseMod(affixLine);
    if (mod !== undefined) {
      mods.push({ ...mod, src });
    }
  }

  return {
    text: affixText,
    mods: mods.length > 0 ? mods : undefined,
    src,
  };
};

const convertAffixArray = (
  affixes: string[] | undefined,
  src: string | undefined,
): Affix[] | undefined => {
  if (!affixes || affixes.length === 0) return undefined;
  return affixes.map((text) => convertAffix(text, src));
};

const convertGear = (gear: SaveDataGear, src: string | undefined): Gear => {
  return {
    equipmentType: gear.equipmentType,
    id: gear.id,
    rarity: gear.rarity,
    legendaryName: gear.legendaryName,
    baseStats: gear.baseStats ? convertAffix(gear.baseStats, src) : undefined,
    base_affixes: convertAffixArray(gear.base_affixes, src),
    prefixes: convertAffixArray(gear.prefixes, src),
    suffixes: convertAffixArray(gear.suffixes, src),
    blend_affix: gear.blend_affix
      ? convertAffix(gear.blend_affix, src)
      : undefined,
    legendary_affixes: convertAffixArray(gear.legendary_affixes, src),
  };
};

const convertGearPage = (
  saveDataGearPage: SaveDataGearPage,
  gearInventory: SaveDataGear[],
): GearPage => {
  const slots: GearSlot[] = [
    "helmet",
    "chest",
    "neck",
    "gloves",
    "belt",
    "boots",
    "leftRing",
    "rightRing",
    "mainHand",
    "offHand",
  ];

  const equippedGear: EquippedGear = {};

  for (const slot of slots) {
    const gear = saveDataGearPage[slot];
    if (gear) {
      const src = getSrc(slot);
      equippedGear[slot] = convertGear(gear, src);
    }
  }

  return {
    equippedGear,
    inventory: gearInventory.map((gear) => {
      return convertGear(gear, undefined);
    }),
  };
};

const getTalentSrc = (treeSlot: TreeSlot): string => {
  return `Talent#${treeSlot}`;
};

const createTalentNode = (
  nodeData: TalentNodeData,
  points: number,
  treeSlot: TreeSlot,
  placedPrism: SaveDataPlacedPrism | undefined,
  src: string,
  isReflected: boolean,
  sourcePosition?: { x: number; y: number },
  inverseImageEffect?: number,
): TalentNode => {
  const affix =
    points > 0
      ? scaleTalentAffix(nodeData.rawAffix, points, src)
      : { text: nodeData.rawAffix };

  const prismAffixes =
    !isReflected && points > 0
      ? getPrismAffixesForNode(
          nodeData.position,
          nodeData.nodeType,
          points,
          placedPrism,
          treeSlot,
          src,
        )
      : [];

  const base: TalentNode = {
    x: nodeData.position.x,
    y: nodeData.position.y,
    nodeType: nodeData.nodeType,
    maxPoints: nodeData.maxPoints,
    prerequisite: nodeData.prerequisite,
    iconName: nodeData.iconName,
    points,
    isReflected,
    affix,
    prismAffixes,
  };

  if (isReflected) {
    base.sourcePosition = sourcePosition;
    base.inverseImageEffect = inverseImageEffect;
  }

  return base;
};

const convertTalentTree = (
  tree: SaveDataTalentTree,
  treeSlot: TreeSlot,
  placedPrism: SaveDataPlacedPrism | undefined,
  placedInverseImage: SaveDataPlacedInverseImage | undefined,
  src: string,
): TalentTree => {
  const treeNodes = treeDataByName[tree.name as TreeName] ?? [];
  const nodes: TalentNode[] = [];

  // Get target area positions if inverse image is placed on this tree
  const targetAreaPositions =
    placedInverseImage && placedInverseImage.treeSlot === treeSlot
      ? getTargetAreaPositions(
          placedInverseImage.position.x,
          placedInverseImage.position.y,
        )
      : [];

  const isInTargetArea = (x: number, y: number): boolean =>
    targetAreaPositions.some((pos) => pos.x === x && pos.y === y);

  // Add all normal nodes (excluding those in target area when inverse image is placed)
  for (const nodeData of treeNodes) {
    if (isInTargetArea(nodeData.position.x, nodeData.position.y)) {
      continue;
    }

    const allocation = tree.allocatedNodes.find(
      (n) => n.x === nodeData.position.x && n.y === nodeData.position.y,
    );
    const points = allocation?.points ?? 0;

    nodes.push(
      createTalentNode(nodeData, points, treeSlot, placedPrism, src, false),
    );
  }

  // Add reflected nodes if inverse image is placed on this tree
  if (placedInverseImage && placedInverseImage.treeSlot === treeSlot) {
    for (const targetPos of targetAreaPositions) {
      const sourcePos = reflectPosition(targetPos.x, targetPos.y);
      const sourceNodeData = treeNodes.find(
        (n) => n.position.x === sourcePos.x && n.position.y === sourcePos.y,
      );

      if (!sourceNodeData) {
        continue;
      }

      const reflectedAllocation =
        placedInverseImage.reflectedAllocatedNodes.find(
          (n) => n.x === targetPos.x && n.y === targetPos.y,
        );
      const points = reflectedAllocation?.points ?? 0;

      const inverseImageEffect =
        getEffectModifierForType(
          placedInverseImage.inverseImage,
          sourceNodeData.nodeType,
        ) / 100;

      nodes.push(
        createTalentNode(
          { ...sourceNodeData, position: targetPos, prerequisite: undefined },
          points,
          treeSlot,
          placedPrism,
          src,
          true,
          sourcePos,
          inverseImageEffect,
        ),
      );
    }
  }

  return {
    name: tree.name,
    nodes,
    selectedCoreTalents: tree.selectedCoreTalents
      ? tree.selectedCoreTalents.map((text) => convertAffix(text, src))
      : undefined,
  };
};

const convertCraftedPrism = (
  prism: SaveDataCraftedPrism,
  src: string,
): CraftedPrism => {
  return {
    id: prism.id,
    rarity: prism.rarity,
    baseAffix: prism.baseAffix,
    gaugeAffixes: prism.gaugeAffixes,
  };
};

const convertPlacedPrism = (
  placedPrism: SaveDataPlacedPrism,
  src: string,
): PlacedPrism => {
  return {
    prism: convertCraftedPrism(placedPrism.prism, src),
    treeSlot: placedPrism.treeSlot,
    position: placedPrism.position,
  };
};

const convertTalentPage = (
  saveDataTalentPage: SaveDataTalentPage,
  prismList: SaveDataCraftedPrism[],
  inverseImageList: SaveData["inverseImageList"],
): TalentPage => {
  const treeSlots: TreeSlot[] = ["tree1", "tree2", "tree3", "tree4"];
  const placedPrism = saveDataTalentPage.placedPrism;
  const placedInverseImage = saveDataTalentPage.placedInverseImage;

  const allocatedTalents: TalentTrees = {};

  for (const slot of treeSlots) {
    const tree = saveDataTalentPage[slot];
    if (tree) {
      const src = getTalentSrc(slot);
      allocatedTalents[slot] = convertTalentTree(
        tree,
        slot,
        placedPrism,
        placedInverseImage,
        src,
      );
    }
  }

  if (placedPrism) {
    const src = getTalentSrc(placedPrism.treeSlot);
    allocatedTalents.placedPrism = convertPlacedPrism(placedPrism, src);
  }

  if (placedInverseImage) {
    allocatedTalents.placedInverseImage = {
      inverseImage: placedInverseImage.inverseImage,
      treeSlot: placedInverseImage.treeSlot,
      position: placedInverseImage.position,
    };
  }

  const inventory: TalentInventory = {
    prismList,
    inverseImageList,
  };

  return {
    talentTrees: allocatedTalents,
    inventory,
  };
};

export const loadSave = (unloadedSaveData: SaveData): Loadout => {
  const saveData = R.clone(unloadedSaveData);
  return {
    gearPage: convertGearPage(saveData.equipmentPage, saveData.itemsList),
    talentPage: convertTalentPage(
      saveData.talentPage,
      saveData.prismList,
      saveData.inverseImageList,
    ),
    divinityPage: { slates: [] },
    skillPage: saveData.skillPage,
    customConfiguration: [],
  };
};
