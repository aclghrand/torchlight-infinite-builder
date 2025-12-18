import * as R from "remeda";
import { craftHeroMemoryAffix } from "@/src/app/lib/hero-utils";
import {
  getEffectModifierForType,
  getTargetAreaPositions,
  reflectPosition,
} from "@/src/app/lib/inverse-image-utils";
import type {
  SaveData,
  CraftedPrism as SaveDataCraftedPrism,
  DivinityPage as SaveDataDivinityPage,
  DivinitySlate as SaveDataDivinitySlate,
  Gear as SaveDataGear,
  GearPage as SaveDataGearPage,
  HeroMemory as SaveDataHeroMemory,
  HeroPage as SaveDataHeroPage,
  PactspiritPage as SaveDataPactspiritPage,
  PactspiritSlot as SaveDataPactspiritSlot,
  PlacedInverseImage as SaveDataPlacedInverseImage,
  PlacedPrism as SaveDataPlacedPrism,
  TalentPage as SaveDataTalentPage,
  TalentTree as SaveDataTalentTree,
} from "@/src/app/lib/save-data";
import { Pactspirits } from "@/src/data/pactspirit/pactspirits";
import type { Pactspirit } from "@/src/data/pactspirit/types";
import type { TalentNodeData, TreeName } from "@/src/data/talent_tree";
import { parseBaseStatMod } from "../base_stat_mod";
import type {
  Affix,
  AffixLine,
  BaseStats,
  CraftedPrism,
  DivinityPage,
  DivinitySlate,
  EquippedGear,
  Gear,
  GearPage,
  HeroMemory,
  HeroMemorySlots,
  HeroPage,
  HeroTraits,
  InstalledDestiny,
  Loadout,
  PactspiritPage,
  PactspiritSlot,
  PlacedPrism,
  TalentInventory,
  TalentNode,
  TalentPage,
  TalentTree,
  TalentTrees,
} from "../core";
import { parseMod } from "../mod_parser";
import {
  convertAffixTextToAffix,
  getPrismAffixesForNode,
  scaleTalentAffix,
  type TreeSlot,
  treeDataByName,
} from "../talent-affix-utils";

type GearSlot = keyof SaveDataGearPage;

const getSrc = (gearSlot: GearSlot): string => {
  return `Gear#${gearSlot}`;
};

const convertBaseStats = (
  baseStatText: string,
  src: string | undefined,
): BaseStats => {
  const lines = baseStatText.split(/\n/);
  const baseStatLines = lines.map((lineText) => {
    const mod = parseBaseStatMod(lineText);
    return {
      text: lineText,
      mod: mod ? { ...mod, src } : undefined,
    };
  });
  return {
    baseStatLines,
    src,
  };
};

const convertAffix = (affixText: string, src: string | undefined): Affix => {
  const lines = affixText.split(/\n/);
  const affixLines: AffixLine[] = lines.map((lineText) => {
    const mods = parseMod(lineText);
    return {
      text: lineText,
      mods: mods?.map((mod) => ({ ...mod, src })),
    };
  });

  return {
    affixLines,
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
    baseStats: gear.baseStats
      ? convertBaseStats(gear.baseStats, src)
      : undefined,
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
      : convertAffixTextToAffix(nodeData.rawAffix, "unallocated node");

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
    selectedCoreTalentNames: tree.selectedCoreTalents,
  };
};

const convertCraftedPrism = (
  prism: SaveDataCraftedPrism,
  _src: string,
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

const getHeroSrc = (type: "trait" | "memory", slot: string): string => {
  return `Hero#${type}#${slot}`;
};

const convertHeroMemory = (
  memory: SaveDataHeroMemory,
  slot: string,
): HeroMemory => {
  const src = getHeroSrc("memory", slot);
  const affixes: Affix[] = [];

  // Base stat
  affixes.push(convertAffix(memory.baseStat, src));

  // Fixed affixes
  for (const affix of memory.fixedAffixes) {
    const resolvedText = craftHeroMemoryAffix(affix.effect, affix.quality);
    affixes.push(convertAffix(resolvedText, src));
  }

  // Random affixes
  for (const affix of memory.randomAffixes) {
    const resolvedText = craftHeroMemoryAffix(affix.effect, affix.quality);
    affixes.push(convertAffix(resolvedText, src));
  }

  return {
    id: memory.id,
    memoryType: memory.memoryType,
    affixes,
  };
};

const convertHeroPage = (
  saveDataHeroPage: SaveDataHeroPage,
  heroMemoryList: SaveDataHeroMemory[],
): HeroPage => {
  const traits: HeroTraits = {};

  if (saveDataHeroPage.traits.level1) {
    traits.level1 = convertAffix(
      saveDataHeroPage.traits.level1,
      getHeroSrc("trait", "level1"),
    );
  }
  if (saveDataHeroPage.traits.level45) {
    traits.level45 = convertAffix(
      saveDataHeroPage.traits.level45,
      getHeroSrc("trait", "level45"),
    );
  }
  if (saveDataHeroPage.traits.level60) {
    traits.level60 = convertAffix(
      saveDataHeroPage.traits.level60,
      getHeroSrc("trait", "level60"),
    );
  }
  if (saveDataHeroPage.traits.level75) {
    traits.level75 = convertAffix(
      saveDataHeroPage.traits.level75,
      getHeroSrc("trait", "level75"),
    );
  }

  const memorySlots: HeroMemorySlots = {};

  if (saveDataHeroPage.memorySlots.slot45) {
    memorySlots.slot45 = convertHeroMemory(
      saveDataHeroPage.memorySlots.slot45,
      "slot45",
    );
  }
  if (saveDataHeroPage.memorySlots.slot60) {
    memorySlots.slot60 = convertHeroMemory(
      saveDataHeroPage.memorySlots.slot60,
      "slot60",
    );
  }
  if (saveDataHeroPage.memorySlots.slot75) {
    memorySlots.slot75 = convertHeroMemory(
      saveDataHeroPage.memorySlots.slot75,
      "slot75",
    );
  }

  return {
    selectedHero: saveDataHeroPage.selectedHero,
    traits,
    memorySlots,
    memoryInventory: heroMemoryList.map((memory, idx) =>
      convertHeroMemory(memory, `inventory-${idx}`),
    ),
  };
};

const RING_SLOT_KEYS = [
  "innerRing1",
  "innerRing2",
  "innerRing3",
  "innerRing4",
  "innerRing5",
  "innerRing6",
  "midRing1",
  "midRing2",
  "midRing3",
] as const;

const getPactspiritByName = (name: string): Pactspirit | undefined =>
  Pactspirits.find((p) => p.name === name);

const convertPactspiritSlot = (
  saveDataSlot: SaveDataPactspiritSlot,
  slotIndex: number,
): PactspiritSlot | undefined => {
  if (saveDataSlot.pactspiritName === undefined) {
    return undefined;
  }

  const pactspirit = getPactspiritByName(saveDataSlot.pactspiritName);
  if (pactspirit === undefined) {
    return undefined;
  }

  const rings = {} as PactspiritSlot["rings"];

  for (const ringKey of RING_SLOT_KEYS) {
    const saveDataRing = saveDataSlot.rings[ringKey];
    const src = `Pactspirit#slot${slotIndex}#${ringKey}`;
    let installedDestiny: InstalledDestiny | undefined;

    if (saveDataRing.installedDestiny) {
      installedDestiny = {
        destinyName: saveDataRing.installedDestiny.destinyName,
        destinyType: saveDataRing.installedDestiny.destinyType,
        affix: convertAffix(saveDataRing.installedDestiny.resolvedAffix, src),
      };
    }

    const originalRingName = pactspirit[ringKey].name;
    const originalAffix = convertAffix(pactspirit[ringKey].affix, src);
    rings[ringKey] = { installedDestiny, originalRingName, originalAffix };
  }

  return {
    pactspiritName: saveDataSlot.pactspiritName,
    level: saveDataSlot.level,
    rings,
  };
};

const convertPactspiritPage = (
  saveDataPactspiritPage: SaveDataPactspiritPage,
): PactspiritPage => ({
  slot1: convertPactspiritSlot(saveDataPactspiritPage.slot1, 1),
  slot2: convertPactspiritSlot(saveDataPactspiritPage.slot2, 2),
  slot3: convertPactspiritSlot(saveDataPactspiritPage.slot3, 3),
});

const getDivinitySrc = (slateId: string): string => {
  return `Divinity#${slateId}`;
};

const convertDivinitySlate = (slate: SaveDataDivinitySlate): DivinitySlate => {
  const src = getDivinitySrc(slate.id);
  return {
    id: slate.id,
    god: slate.god,
    shape: slate.shape,
    rotation: slate.rotation,
    flippedH: slate.flippedH,
    flippedV: slate.flippedV,
    affixes: slate.affixes.map((text) => convertAffix(text, src)),
    affixTypes: slate.affixTypes,
  };
};

const convertDivinityPage = (
  saveDataDivinityPage: SaveDataDivinityPage,
  divinitySlateList: SaveDataDivinitySlate[],
): DivinityPage => {
  return {
    placedSlates: saveDataDivinityPage.placedSlates,
    inventory: divinitySlateList.map(convertDivinitySlate),
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
    divinityPage: convertDivinityPage(
      saveData.divinityPage,
      saveData.divinitySlateList,
    ),
    skillPage: saveData.skillPage,
    heroPage: convertHeroPage(saveData.heroPage, saveData.heroMemoryList),
    pactspiritPage: convertPactspiritPage(saveData.pactspiritPage),
    customConfiguration: [],
  };
};
