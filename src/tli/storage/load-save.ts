import * as R from "remeda";
import { CoreTalentMods } from "@/src/data/core-talent/core-talent-mods";
import { CoreTalents } from "@/src/data/core-talent/core-talents";
import {
  type CoreTalentName,
  CoreTalentNames,
} from "@/src/data/core-talent/types";
import type { HeroName, HeroTraitName } from "@/src/data/hero-trait/types";
import { Pactspirits } from "@/src/data/pactspirit/pactspirits";
import type { Pactspirit } from "@/src/data/pactspirit/types";
import { Prisms } from "@/src/data/prism/prisms";
import { SupportSkills as SupportSkillsData } from "@/src/data/skill/support";
import { MagnificentSupportSkills } from "@/src/data/skill/support-magnificent";
import { NobleSupportSkills } from "@/src/data/skill/support-noble";
import type {
  ActivationMediumSkillNmae,
  BaseSupportSkill,
  MagnificentSupportSkillName,
  NobleSupportSkillName,
  SupportSkillName,
} from "@/src/data/skill/types";
import type { TalentNodeData, TreeName } from "@/src/data/talent-tree";
import { findSlateAtCell } from "@/src/lib/divinity-grid";
import {
  getEffectModifierForType,
  getTargetAreaPositions,
  reflectPosition,
} from "@/src/lib/inverse-image-utils";
import type {
  SaveData,
  BaseSupportSkillSlot as SaveDataBaseSupportSkillSlot,
  CraftedPrism as SaveDataCraftedPrism,
  DivinityPage as SaveDataDivinityPage,
  DivinitySlate as SaveDataDivinitySlate,
  EquippedGear as SaveDataEquippedGear,
  Gear as SaveDataGear,
  GearPage as SaveDataGearPage,
  HeroMemory as SaveDataHeroMemory,
  HeroPage as SaveDataHeroPage,
  PactspiritPage as SaveDataPactspiritPage,
  PactspiritSlot as SaveDataPactspiritSlot,
  PlacedInverseImage as SaveDataPlacedInverseImage,
  PlacedPrism as SaveDataPlacedPrism,
  SkillPage as SaveDataSkillPage,
  SkillSlot as SaveDataSkillSlot,
  TalentPage as SaveDataTalentPage,
  TalentTree as SaveDataTalentTree,
} from "@/src/lib/save-data";
import type {
  ActiveSkillSlots,
  Affix,
  AffixLine,
  BaseStats,
  BaseSupportSkillSlot,
  CraftedPrism,
  DivinityPage,
  DivinitySlate,
  EquippedGear,
  Gear,
  GearPage,
  HeroMemory,
  HeroMemorySlots,
  HeroPage,
  HeroTrait,
  HeroTraits,
  InstalledDestiny,
  Loadout,
  PactspiritPage,
  PactspiritSlot,
  PassiveSkillSlots,
  PlacedPrism,
  PlacedSlate,
  SkillPage,
  SkillSlot,
  SupportAffix,
  SupportSkills,
  TalentInventory,
  TalentNode,
  TalentPage,
  TalentTree,
  TalentTrees,
} from "../core";
import { parseMod } from "../mod-parser/index";
import { parseSupportAffixes } from "../skills/support-mod-templates";
import {
  convertAffixTextToAffix,
  getPrismAffixesForNode,
  scaleTalentAffix,
  type TreeSlot,
  treeDataByName,
} from "../talent-affix-utils";

type GearSlot = keyof SaveDataEquippedGear;

const getSrc = (gearSlot: GearSlot): string => {
  return `Gear#${gearSlot}`;
};

const convertBaseStats = (
  baseStatText: string,
  src: string | undefined,
): BaseStats => {
  const lines = baseStatText.split(/\n/);
  const baseStatLines = lines.map((lineText) => {
    const mods = parseMod(lineText);
    return { text: lineText, mods: mods?.map((mod) => ({ ...mod, src })) };
  });
  return { baseStatLines, src };
};

// Set for fast core talent name lookup (case-insensitive)
const coreTalentNameSet = new Set(
  CoreTalentNames.map((name) => name.toLowerCase()),
);

const getCoreTalentName = (text: string): CoreTalentName | undefined => {
  const normalized = text.trim().toLowerCase();
  if (coreTalentNameSet.has(normalized)) {
    return CoreTalentNames.find((n) => n.toLowerCase() === normalized) as
      | CoreTalentName
      | undefined;
  }
  return undefined;
};

const convertAffix = (
  affixTextParam: string,
  src: string | undefined,
): Affix => {
  const divinityText = " (Max Divinity Effect: 1)";
  const maxDivinity = affixTextParam.endsWith(divinityText) ? 1 : undefined;
  const affixText = affixTextParam.replace(divinityText, "");
  const lines = affixText.split(/\n/);

  // Check if the entire affix is a single core talent name
  if (lines.length === 1) {
    const coreTalentName = getCoreTalentName(lines[0]);
    if (coreTalentName !== undefined) {
      const coreTalentAffix = CoreTalentMods[coreTalentName];
      if (coreTalentAffix !== undefined) {
        return {
          specialName: coreTalentName,
          affixLines: coreTalentAffix.affixLines.map((line) => ({
            text: line.text,
            mods: line.mods?.map((mod) => ({ ...mod, src })),
          })),
          src,
          maxDivinity,
        };
      }
    }
  }

  const affixLines: AffixLine[] = lines.map((lineText) => {
    const mods = parseMod(lineText);
    return { text: lineText, mods: mods?.map((mod) => ({ ...mod, src })) };
  });

  return { affixLines, src, maxDivinity };
};

const convertAffixArray = (
  affixes: string[] | undefined,
  src: string | undefined,
): Affix[] | undefined => {
  if (!affixes || affixes.length === 0) return undefined;
  return affixes.map((text) => convertAffix(text, src));
};

const convertCoreTalent = (
  talentName: string,
  src: string,
): Affix | undefined => {
  const coreTalentAffix = CoreTalentMods[talentName as CoreTalentName];
  if (coreTalentAffix === undefined) {
    console.error(`Unknown core talent: ${talentName}`);
    return undefined;
  }

  const affixLines: AffixLine[] = coreTalentAffix.affixLines.map((line) => ({
    text: line.text,
    mods: line.mods?.map((mod) => ({ ...mod, src })),
  }));

  return { specialName: talentName, affixLines, src };
};

const convertCustomAffixLines = (lines: string[] | undefined): AffixLine[] => {
  if (lines === undefined || lines.length === 0) return [];
  return lines.map((lineText) => {
    const mods = parseMod(lineText);
    return {
      text: lineText,
      mods: mods?.map((mod) => ({ ...mod, src: "CustomAffix" })),
    };
  });
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
    sweet_dream_affix: gear.sweet_dream_affix
      ? convertAffix(gear.sweet_dream_affix, src)
      : undefined,
    tower_sequence_affix: gear.tower_sequence_affix
      ? convertAffix(gear.tower_sequence_affix, src)
      : undefined,
    legendary_affixes: convertAffixArray(gear.legendary_affixes, src),
  };
};

const convertGearPage = (saveDataGearPage: SaveDataGearPage): GearPage => {
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
    const gear = saveDataGearPage.equippedGear[slot];
    if (gear) {
      const src = getSrc(slot);
      equippedGear[slot] = convertGear(gear, src);
    }
  }

  return {
    equippedGear,
    inventory: saveDataGearPage.inventory.map((gear) => {
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

  // Look up prism data to get the new structured fields
  const prismData =
    placedPrism && placedPrism.treeSlot === treeSlot
      ? Prisms.find((p) => p.affix === placedPrism.prism.baseAffix)
      : undefined;

  const additionalCoreTalentPrismAffix =
    prismData?.addedCoreTalentAffix !== undefined
      ? convertAffix(prismData.addedCoreTalentAffix, src)
      : undefined;

  const replacementPrismCoreTalent =
    prismData?.replacementCoreTalent !== undefined
      ? {
          specialName: prismData.replacementCoreTalent.name,
          affixLines: prismData.replacementCoreTalent.affix
            .split("\n")
            .map((text) => ({
              text,
              mods: parseMod(text)?.map((mod) => ({ ...mod, src })),
            })),
        }
      : undefined;

  return {
    name: tree.name,
    nodes,
    selectedCoreTalents: tree.selectedCoreTalents
      ? tree.selectedCoreTalents
          .map((name) => convertCoreTalent(name, src))
          .filter((affix): affix is Affix => affix !== undefined)
      : undefined,
    selectedCoreTalentNames: tree.selectedCoreTalents,
    additionalCoreTalentPrismAffix,
    replacementPrismCoreTalent,
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
): TalentPage => {
  const treeSlots: TreeSlot[] = ["tree1", "tree2", "tree3", "tree4"];
  const placedPrism = saveDataTalentPage.talentTrees.placedPrism;
  const placedInverseImage = saveDataTalentPage.talentTrees.placedInverseImage;

  const allocatedTalents: TalentTrees = {};

  for (const slot of treeSlots) {
    const tree = saveDataTalentPage.talentTrees[slot];
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
    prismList: saveDataTalentPage.inventory.prismList,
    inverseImageList: saveDataTalentPage.inventory.inverseImageList,
  };

  return { talentTrees: allocatedTalents, inventory };
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

  // Fixed affixes (already final text)
  for (const affixText of memory.fixedAffixes) {
    affixes.push(convertAffix(affixText, src));
  }

  // Random affixes (already final text)
  for (const affixText of memory.randomAffixes) {
    affixes.push(convertAffix(affixText, src));
  }

  return { id: memory.id, memoryType: memory.memoryType, affixes };
};

const convertHeroTrait = (
  saveDataTrait: { name: string } | undefined,
): HeroTrait | undefined => {
  if (!saveDataTrait) return undefined;
  return { name: saveDataTrait.name as HeroTraitName };
};

const convertHeroPage = (
  saveDataHeroPage: SaveDataHeroPage,
  heroMemoryList: SaveDataHeroMemory[],
): HeroPage => {
  const traits: HeroTraits = {
    level1: convertHeroTrait(saveDataHeroPage.traits.level1),
    level45: convertHeroTrait(saveDataHeroPage.traits.level45),
    level45b: convertHeroTrait(saveDataHeroPage.traits.level45b),
    level60: convertHeroTrait(saveDataHeroPage.traits.level60),
    level60b: convertHeroTrait(saveDataHeroPage.traits.level60b),
    level75: convertHeroTrait(saveDataHeroPage.traits.level75),
    level75b: convertHeroTrait(saveDataHeroPage.traits.level75b),
  };

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
    selectedHero: saveDataHeroPage.selectedHero as HeroName | undefined,
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

  const mainAffixKey = `affix${saveDataSlot.level}` as keyof Pactspirit;
  const mainAffixText = pactspirit[mainAffixKey] as string;
  const mainAffix = convertAffix(
    mainAffixText,
    `Pactspirit#slot${slotIndex}#mainAffix`,
  );

  return {
    pactspiritName: saveDataSlot.pactspiritName,
    level: saveDataSlot.level,
    mainAffix,
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

const getDivinitySrc = (legendaryName: string | undefined): string => {
  return `Divinity#${legendaryName ?? "rare"}`;
};

// Check if an affix line matches any Core talent (by name or any line of effect)
const isCoreTalentLine = (affixLineText: string): boolean => {
  const normalizedText = affixLineText.trim().toLowerCase();
  return CoreTalents.some((ct) => {
    // Check if it matches the name
    if (ct.name.toLowerCase() === normalizedText) return true;
    // Check if any line from the Core talent affix matches
    const affixLines = ct.affix
      .split(/\n/)
      .map((line) => line.trim().toLowerCase());
    return affixLines.some((line) => line === normalizedText);
  });
};

type CopyDirection = "up" | "down" | "left" | "right";

// Parse the copy direction from a meta affix text
const parseCopyDirection = (
  metaAffixText: string,
): CopyDirection | "all" | undefined => {
  const lowerText = metaAffixText.toLowerCase();
  if (lowerText.includes("all adjacent")) return "all";
  if (lowerText.includes("above")) return "up";
  if (lowerText.includes("below")) return "down";
  if (lowerText.includes("on the left")) return "left";
  if (lowerText.includes("on the right")) return "right";
  return undefined;
};

// Get adjacent slates for a given position on the grid
const getAdjacentSlates = (
  position: { row: number; col: number },
  inventory: DivinitySlate[],
  placements: PlacedSlate[],
): Map<CopyDirection, DivinitySlate> => {
  const directions: {
    dir: CopyDirection;
    offset: { row: number; col: number };
  }[] = [
    { dir: "up", offset: { row: -1, col: 0 } },
    { dir: "down", offset: { row: 1, col: 0 } },
    { dir: "left", offset: { row: 0, col: -1 } },
    { dir: "right", offset: { row: 0, col: 1 } },
  ];

  const result = new Map<CopyDirection, DivinitySlate>();

  for (const { dir, offset } of directions) {
    const adjacentRow = position.row + offset.row;
    const adjacentCol = position.col + offset.col;

    const placement = findSlateAtCell(
      adjacentRow,
      adjacentCol,
      inventory,
      placements,
    );
    if (placement !== undefined) {
      const slate = inventory.find((s) => s.id === placement.slateId);
      if (slate !== undefined) {
        result.set(dir, slate);
      }
    }
  }

  return result;
};

// Get the last non-Core affix from a slate (as an Affix object)
const getLastCopyableAffix = (
  slate: DivinitySlate,
  src: string,
): Affix | undefined => {
  // Don't copy from other copy slates (they have metaAffixes)
  if (slate.metaAffixes.length > 0) return undefined;

  // Work backwards through affixes to find the last non-Core one
  for (let i = slate.affixes.length - 1; i >= 0; i--) {
    const affix = slate.affixes[i];
    // Check if any line in this affix is a Core talent
    const isCore = affix.affixLines.some((line) => isCoreTalentLine(line.text));
    if (!isCore) {
      // Return a copy with updated source
      return {
        affixLines: affix.affixLines.map((line) => ({
          text: line.text,
          mods: line.mods?.map((mod) => ({ ...mod, src })),
        })),
        src,
      };
    }
  }
  return undefined;
};

// Get copied affixes for a placed copy slate based on its meta affixes
const getCopiedAffixesForSlate = (
  slate: DivinitySlate,
  placement: PlacedSlate,
  inventory: DivinitySlate[],
  placements: PlacedSlate[],
): Affix[] => {
  // Only process slates with metaAffixes (copy slates)
  if (slate.metaAffixes.length === 0) return [];

  const src = getDivinitySrc(slate.legendaryName);
  const direction = parseCopyDirection(slate.metaAffixes[0]);
  if (direction === undefined) return [];

  const adjacentSlates = getAdjacentSlates(
    placement.position,
    inventory,
    placements,
  );
  const copiedAffixes: Affix[] = [];

  if (direction === "all") {
    // Copy from all adjacent slates in order: up, left, down, right
    // Track copied slate IDs to avoid copying from the same slate twice
    // (a multi-cell slate could be adjacent from multiple directions)
    const copiedSlateIds = new Set<string>();
    const orderOfDirections: CopyDirection[] = ["up", "left", "down", "right"];
    for (const dir of orderOfDirections) {
      const adjacentSlate = adjacentSlates.get(dir);
      if (
        adjacentSlate !== undefined &&
        !copiedSlateIds.has(adjacentSlate.id)
      ) {
        const copiedAffix = getLastCopyableAffix(adjacentSlate, src);
        if (copiedAffix !== undefined) {
          copiedAffixes.push(copiedAffix);
          copiedSlateIds.add(adjacentSlate.id);
        }
      }
    }
  } else {
    // Copy from single direction
    const adjacentSlate = adjacentSlates.get(direction);
    if (adjacentSlate !== undefined) {
      const copiedAffix = getLastCopyableAffix(adjacentSlate, src);
      if (copiedAffix !== undefined) {
        copiedAffixes.push(copiedAffix);
      }
    }
  }

  return copiedAffixes;
};

const convertDivinitySlate = (slate: SaveDataDivinitySlate): DivinitySlate => {
  const src = getDivinitySrc(slate.legendaryName);
  return {
    id: slate.id,
    god: slate.god,
    shape: slate.shape,
    rotation: slate.rotation,
    flippedH: slate.flippedH,
    flippedV: slate.flippedV,
    affixes: slate.affixes.map((text) => convertAffix(text, src)),
    metaAffixes: slate.metaAffixes ?? [],
    isLegendary: slate.isLegendary,
    legendaryName: slate.legendaryName,
  };
};

const convertDivinityPage = (
  saveDataDivinityPage: SaveDataDivinityPage,
): DivinityPage => {
  // First convert all slates to inventory
  const inventory = saveDataDivinityPage.inventory.map(convertDivinitySlate);
  const placements = saveDataDivinityPage.placedSlates;

  // For each placed slate with metaAffixes, populate copied affixes from adjacent slates
  for (const placement of placements) {
    const slateIndex = inventory.findIndex((s) => s.id === placement.slateId);
    if (slateIndex === -1) continue;

    const slate = inventory[slateIndex];
    if (slate.metaAffixes.length > 0) {
      const copiedAffixes = getCopiedAffixesForSlate(
        slate,
        placement,
        inventory,
        placements,
      );
      // Update the slate with copied affixes
      inventory[slateIndex] = {
        ...slate,
        affixes: [...slate.affixes, ...copiedAffixes],
      };
    }
  }

  return { placedSlates: placements, inventory };
};

// Rank damage bonus values for magnificent/noble supports: [0, 5, 10, 15, 20] for ranks 1-5
const RANK_DAMAGE_VALUES = [0, 5, 10, 15, 20] as const;

/**
 * Build affix texts for a magnificent/noble support skill slot.
 * Combines: craftedAffix + fixed affixes + rank damage bonus.
 *
 * Description structure:
 * - 2 parts: [overview, tier-scaled] → no fixed affixes
 * - 3 parts: [overview, fixed, tier-scaled] → fixed affixes at index 1
 */
const buildSpecialSupportAffixTexts = (
  descriptions: string[],
  craftedAffix: string,
  rank: 1 | 2 | 3 | 4 | 5,
): string[] => {
  // Fixed affixes only exist when there are 3 description parts (at index 1)
  const fixedAffixes =
    descriptions.length >= 3 && descriptions[1] !== undefined
      ? descriptions[1].split("\n")
      : [];

  // Calculate rank damage bonus
  const rankDmg = RANK_DAMAGE_VALUES[rank - 1];
  const rankDmgAffix =
    rankDmg > 0
      ? `+${rankDmg}% additional damage for the supported skill`
      : undefined;

  // Combine all affixes: craftedAffix, fixed affixes, rank damage
  return [
    ...(craftedAffix !== "" ? [craftedAffix] : []),
    ...fixedAffixes,
    ...(rankDmgAffix !== undefined ? [rankDmgAffix] : []),
  ];
};

/**
 * Build support affixes for a regular support skill.
 * Exported for use in tests and other contexts that need to create support skill slots.
 */
export const buildSupportSkillAffixes = (
  skillName: string,
  level: number,
): SupportAffix[] => {
  const skill: BaseSupportSkill | undefined = SupportSkillsData.find(
    (s) => s.name === skillName,
  );
  if (skill === undefined) return [];

  // Build affix texts from fixedAffixes and instantiated templates
  const affixTexts: string[] = [];

  // Add fixed affixes
  if (skill.fixedAffixes !== undefined) {
    affixTexts.push(...skill.fixedAffixes);
  }

  // Instantiate templates with level value
  if (skill.templates !== undefined) {
    for (const tmpl of skill.templates) {
      const clampedLevel = Math.min(Math.max(level, 1), 40);
      const value = tmpl.levelValues[clampedLevel - 1];
      const text = tmpl.template.replace("{value}", String(value));
      affixTexts.push(text);
    }
  }

  // Parse all affixes
  const parsedMods = parseSupportAffixes(affixTexts);

  return affixTexts.map((text, i) => ({ text, mods: parsedMods[i] }));
};

const convertSupportSkillSlot = (
  slot: SaveDataBaseSupportSkillSlot,
): BaseSupportSkillSlot => {
  switch (slot.skillType) {
    case "support": {
      const level = slot.level ?? 20;
      const affixes = buildSupportSkillAffixes(slot.name, level);

      return {
        skillType: "support",
        name: slot.name as SupportSkillName,
        level: slot.level,
        affixes,
      };
    }
    case "magnificent_support": {
      const skill = MagnificentSupportSkills.find((s) => s.name === slot.name);
      const affixTexts = buildSpecialSupportAffixTexts(
        skill?.description ?? [],
        slot.craftedAffix,
        slot.rank,
      );
      const parsedMods = parseSupportAffixes(affixTexts);
      return {
        skillType: "magnificent_support",
        name: slot.name as MagnificentSupportSkillName,
        tier: slot.tier,
        rank: slot.rank,
        affixes: affixTexts.map((text, i) => ({ text, mods: parsedMods[i] })),
      };
    }
    case "noble_support": {
      const skill = NobleSupportSkills.find((s) => s.name === slot.name);
      const affixTexts = buildSpecialSupportAffixTexts(
        skill?.description ?? [],
        slot.craftedAffix,
        slot.rank,
      );
      const parsedMods = parseSupportAffixes(affixTexts);
      return {
        skillType: "noble_support",
        name: slot.name as NobleSupportSkillName,
        tier: slot.tier,
        rank: slot.rank,
        affixes: affixTexts.map((text, i) => ({ text, mods: parsedMods[i] })),
      };
    }
    case "activation_medium": {
      const affixTexts = slot.affixes ?? [];
      const parsedMods = parseSupportAffixes(affixTexts);
      return {
        skillType: "activation_medium",
        name: slot.name as ActivationMediumSkillNmae,
        tier: slot.tier ?? 3,
        affixes: affixTexts.map((text, i) => ({ text, mods: parsedMods?.[i] })),
      };
    }
  }
};

const convertSupportSkills = (
  supports: SaveDataSkillSlot["supportSkills"],
): SupportSkills => {
  const result: SupportSkills = {};
  for (const key of [1, 2, 3, 4, 5] as const) {
    const slot = supports[key];
    if (slot !== undefined) {
      result[key] = convertSupportSkillSlot(slot);
    }
  }
  return result;
};

const convertSkillSlot = (slot: SaveDataSkillSlot): SkillSlot => ({
  skillName: slot.skillName,
  enabled: slot.enabled,
  level: slot.level,
  supportSkills: convertSupportSkills(slot.supportSkills),
});

const convertSkillPage = (saveDataSkillPage: SaveDataSkillPage): SkillPage => {
  const activeSkills: ActiveSkillSlots = {};
  for (const key of [1, 2, 3, 4, 5] as const) {
    const slot = saveDataSkillPage.activeSkills[key];
    if (slot !== undefined) {
      activeSkills[key] = convertSkillSlot(slot);
    }
  }

  const passiveSkills: PassiveSkillSlots = {};
  for (const key of [1, 2, 3, 4] as const) {
    const slot = saveDataSkillPage.passiveSkills[key];
    if (slot !== undefined) {
      passiveSkills[key] = convertSkillSlot(slot);
    }
  }

  return { activeSkills, passiveSkills };
};

export const loadSave = (unloadedSaveData: SaveData): Loadout => {
  const saveData = R.clone(unloadedSaveData);
  return {
    gearPage: convertGearPage(saveData.equipmentPage),
    talentPage: convertTalentPage(saveData.talentPage),
    divinityPage: convertDivinityPage(saveData.divinityPage),
    skillPage: convertSkillPage(saveData.skillPage),
    heroPage: convertHeroPage(
      saveData.heroPage,
      saveData.heroPage.memoryInventory,
    ),
    pactspiritPage: convertPactspiritPage(saveData.pactspiritPage),
    customAffixLines: convertCustomAffixLines(
      saveData.configurationPage?.customAffixLines,
    ),
  };
};
