"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  SaveData,
  Gear,
  AllocatedTalentNode,
  SupportSkills,
  HeroMemory,
  HeroMemorySlot,
  PactspiritPage,
  DivinitySlate,
  PlacedSlate,
  CraftedPrism,
} from "../lib/save-data";
import { ActiveSkills, PassiveSkills } from "@/src/data/skill";
import {
  TalentTreeData,
  GOD_GODDESS_TREES,
  PROFESSION_TREES,
  TreeName,
  isGodGoddessTree,
  loadTalentTree,
} from "@/src/tli/talent_tree";
import { CoreTalentSelector } from "../components/talents/CoreTalentSelector";
import { EquipmentType } from "@/src/tli/gear_data_types";
import { craft } from "@/src/tli/crafting/craft";

import {
  GearSlot,
  AffixSlotState,
  TreeSlot,
  ActivePage,
  RingSlotKey,
  PactspiritSlotIndex,
} from "../lib/types";
import { GEAR_SLOTS } from "../lib/constants";
import {
  loadDebugModeFromStorage,
  saveDebugModeToStorage,
  createEmptyLoadout,
  generateItemId,
  createEmptyHeroPage,
  createEmptyPactspiritSlot,
} from "../lib/storage";
import { decodeBuildCode, encodeBuildCode } from "../lib/build-code";
import {
  getValidEquipmentTypes,
  getCompatibleItems,
  getGearTypeFromEquipmentType,
} from "../lib/equipment-utils";
import { getFilteredAffixes } from "../lib/affix-utils";
import { getBaseTraitForHero } from "../lib/hero-utils";

import { PageTabs } from "../components/PageTabs";
import { DebugPanel } from "../components/DebugPanel";
import { AffixSlotComponent } from "../components/equipment/AffixSlotComponent";
import { EquipmentSlotDropdown } from "../components/equipment/EquipmentSlotDropdown";
import { InventoryItem } from "../components/equipment/InventoryItem";
import { TalentGrid } from "../components/talents/TalentGrid";
import { SkillSlot } from "../components/skills/SkillSlot";
import { ExportModal } from "../components/ExportModal";
import { ImportModal } from "../components/ImportModal";
import { HeroTab } from "../components/hero/HeroTab";
import { PactspiritTab } from "../components/pactspirit/PactspiritTab";
import { LegendaryGearModule } from "../components/equipment/LegendaryGearModule";
import { DivinityTab } from "../components/divinity/DivinityTab";
import { PrismSection } from "../components/talents/PrismSection";
import { Toast } from "../components/Toast";
import {
  SavesIndex,
  loadSavesIndex,
  saveSavesIndex,
  loadSaveData,
  saveSaveData,
  findSaveById,
} from "../lib/saves";

export default function BuilderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const saveId = searchParams.get("id");

  const [loadout, setLoadout] = useState<SaveData>(createEmptyLoadout);
  const [mounted, setMounted] = useState(false);
  const [activePage, setActivePage] = useState<ActivePage>("equipment");
  const [activeTreeSlot, setActiveTreeSlot] = useState<TreeSlot>("tree1");
  const [treeData, setTreeData] = useState<
    Record<string, TalentTreeData | null>
  >({
    tree1: null,
    tree2: null,
    tree3: null,
    tree4: null,
  });
  const [selectedEquipmentType, setSelectedEquipmentType] =
    useState<EquipmentType | null>(null);
  const [affixSelections, setAffixSelections] = useState<AffixSlotState[]>(
    Array(6)
      .fill(null)
      .map(() => ({ affixIndex: null, percentage: 50 })),
  );
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [debugPanelExpanded, setDebugPanelExpanded] = useState<boolean>(true);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [buildCode, setBuildCode] = useState("");

  const [savesIndex, setSavesIndex] = useState<SavesIndex>({
    currentSaveId: undefined,
    saves: [],
  });
  const [currentSaveName, setCurrentSaveName] = useState<string | undefined>(
    undefined,
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [saveSuccessToastVisible, setSaveSuccessToastVisible] = useState(false);

  // beforeunload handler to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    setMounted(true);
    setDebugMode(loadDebugModeFromStorage());

    const index = loadSavesIndex();
    setSavesIndex(index);

    if (!saveId) {
      router.replace("/");
      return;
    }

    const save = findSaveById(index.saves, saveId);
    if (!save) {
      router.replace("/");
      return;
    }

    const data = loadSaveData(saveId);
    if (data) {
      setLoadout(data);
      setCurrentSaveName(save.name);
      const updatedIndex = { ...index, currentSaveId: saveId };
      saveSavesIndex(updatedIndex);
      setSavesIndex(updatedIndex);
    } else {
      router.replace("/");
    }

    setHasUnsavedChanges(false);
  }, [saveId, router]);

  useEffect(() => {
    if (activePage !== "talents") return;

    const loadTree = async (slot: TreeSlot) => {
      const tree = loadout.talentPage[slot];
      if (!tree) {
        setTreeData((prev) => ({ ...prev, [slot]: null }));
        return;
      }
      const treeName = tree.name;
      try {
        const data = await loadTalentTree(treeName as TreeName);
        setTreeData((prev) => ({ ...prev, [slot]: data }));
      } catch (error) {
        console.error(`Failed to load tree ${treeName}:`, error);
      }
    };

    loadTree("tree1");
    loadTree("tree2");
    loadTree("tree3");
    loadTree("tree4");
  }, [
    activePage,
    loadout.talentPage.tree1?.name,
    loadout.talentPage.tree2?.name,
    loadout.talentPage.tree3?.name,
    loadout.talentPage.tree4?.name,
  ]);

  const prefixAffixes = useMemo(
    () =>
      selectedEquipmentType
        ? getFilteredAffixes(selectedEquipmentType, "Prefix")
        : [],
    [selectedEquipmentType],
  );

  const suffixAffixes = useMemo(
    () =>
      selectedEquipmentType
        ? getFilteredAffixes(selectedEquipmentType, "Suffix")
        : [],
    [selectedEquipmentType],
  );

  const updateLoadout = (
    updater: SaveData | ((prev: SaveData) => SaveData),
  ) => {
    setLoadout(updater);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (!saveId) return;

    const success = saveSaveData(saveId, loadout);
    if (success) {
      const now = Date.now();
      const updatedSaves = savesIndex.saves.map((s) =>
        s.id === saveId ? { ...s, updatedAt: now } : s,
      );
      const newIndex = { ...savesIndex, saves: updatedSaves };
      saveSavesIndex(newIndex);
      setSavesIndex(newIndex);
      setHasUnsavedChanges(false);
      setSaveSuccessToastVisible(true);
    }
  };

  const handleBackToSaves = useCallback(() => {
    if (hasUnsavedChanges) {
      setToastVisible(true);
    } else {
      router.push("/");
    }
  }, [hasUnsavedChanges, router]);

  const handleSaveToInventory = () => {
    if (!selectedEquipmentType) return;

    const affixes: string[] = [];
    affixSelections.forEach((selection, idx) => {
      if (selection.affixIndex === null) return;
      const affixType = idx < 3 ? "Prefix" : "Suffix";
      const filteredAffixes =
        affixType === "Prefix" ? prefixAffixes : suffixAffixes;
      const selectedAffix = filteredAffixes[selection.affixIndex];
      affixes.push(craft(selectedAffix, selection.percentage));
    });

    const newItem: Gear = {
      id: generateItemId(),
      gearType: getGearTypeFromEquipmentType(selectedEquipmentType),
      affixes,
      equipmentType: selectedEquipmentType,
    };

    updateLoadout((prev) => ({
      ...prev,
      itemsList: [...prev.itemsList, newItem],
    }));

    setSelectedEquipmentType(null);
    setAffixSelections(
      Array(6)
        .fill(null)
        .map(() => ({ affixIndex: null, percentage: 50 })),
    );
  };

  const handleAddItemToInventory = (item: Gear) => {
    updateLoadout((prev) => ({
      ...prev,
      itemsList: [...prev.itemsList, item],
    }));
  };

  const handleCopyItem = (item: Gear) => {
    const newItem: Gear = { ...item, id: generateItemId() };
    updateLoadout((prev) => ({
      ...prev,
      itemsList: [...prev.itemsList, newItem],
    }));
  };

  const handleDeleteItem = (itemId: string) => {
    updateLoadout((prev) => {
      const newItemsList = prev.itemsList.filter((item) => item.id !== itemId);
      const newEquipmentPage = { ...prev.equipmentPage };
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
      slots.forEach((slot) => {
        if (newEquipmentPage[slot]?.id === itemId) {
          delete newEquipmentPage[slot];
        }
      });
      return {
        ...prev,
        itemsList: newItemsList,
        equipmentPage: newEquipmentPage,
      };
    });
  };

  const handleSelectItemForSlot = (slot: GearSlot, itemId: string | null) => {
    updateLoadout((prev) => {
      if (!itemId) {
        const newEquipmentPage = { ...prev.equipmentPage };
        delete newEquipmentPage[slot];
        return { ...prev, equipmentPage: newEquipmentPage };
      }
      const item = prev.itemsList.find((i) => i.id === itemId);
      if (!item) return prev;
      return {
        ...prev,
        equipmentPage: { ...prev.equipmentPage, [slot]: item },
      };
    });
  };

  const isItemEquipped = (itemId: string): boolean => {
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
    return slots.some((slot) => loadout.equipmentPage[slot]?.id === itemId);
  };

  const handleEquipmentTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newType = e.target.value as EquipmentType;
    setSelectedEquipmentType(newType);
    setAffixSelections(
      Array(6)
        .fill(null)
        .map(() => ({ affixIndex: null, percentage: 50 })),
    );
  };

  const handleAffixSelect = (slotIndex: number, value: string) => {
    const affixIndex = value === "" ? null : parseInt(value);
    setAffixSelections((prev) => {
      const updated = [...prev];
      updated[slotIndex] = {
        affixIndex,
        percentage: affixIndex === null ? 50 : updated[slotIndex].percentage,
      };
      return updated;
    });
  };

  const handleSliderChange = (slotIndex: number, value: string) => {
    const percentage = parseInt(value);
    setAffixSelections((prev) => {
      const updated = [...prev];
      updated[slotIndex] = { ...updated[slotIndex], percentage };
      return updated;
    });
  };

  const handleClearAffix = (slotIndex: number) => {
    setAffixSelections((prev) => {
      const updated = [...prev];
      updated[slotIndex] = { affixIndex: null, percentage: 50 };
      return updated;
    });
  };

  const handleExport = () => {
    const code = encodeBuildCode(loadout);
    setBuildCode(code);
    setExportModalOpen(true);
  };

  const handleImport = (code: string): boolean => {
    const decoded = decodeBuildCode(code);
    if (decoded) {
      setLoadout(decoded);
      setHasUnsavedChanges(true);
      return true;
    }
    return false;
  };

  const handleTreeChange = (slot: TreeSlot, newTreeName: string) => {
    const currentTree = loadout.talentPage[slot];
    if (currentTree && currentTree.allocatedNodes.length > 0) return;

    if (newTreeName === "") {
      updateLoadout((prev) => {
        const newTalentPage = { ...prev.talentPage };
        delete newTalentPage[slot];
        return { ...prev, talentPage: newTalentPage };
      });
      return;
    }

    if (slot !== "tree1" && isGodGoddessTree(newTreeName)) return;
    if (slot === "tree1" && !isGodGoddessTree(newTreeName)) return;

    updateLoadout((prev) => ({
      ...prev,
      talentPage: {
        ...prev.talentPage,
        [slot]: { name: newTreeName, allocatedNodes: [] },
      },
    }));
  };

  const handleResetTree = (slot: TreeSlot) => {
    const currentTree = loadout.talentPage[slot];
    if (!currentTree || currentTree.allocatedNodes.length === 0) return;
    if (confirm("Reset all points in this tree? This cannot be undone.")) {
      updateLoadout((prev) => ({
        ...prev,
        talentPage: {
          ...prev.talentPage,
          [slot]: { ...prev.talentPage[slot]!, allocatedNodes: [] },
        },
      }));
    }
  };

  const handleAllocate = (slot: TreeSlot, x: number, y: number) => {
    updateLoadout((prev) => {
      const tree = prev.talentPage[slot];
      if (!tree) return prev;
      const existing = tree.allocatedNodes.find((n) => n.x === x && n.y === y);
      const nodeData = treeData[slot]?.nodes.find(
        (n) => n.position.x === x && n.position.y === y,
      );
      if (!nodeData) return prev;

      let updatedNodes: AllocatedTalentNode[];

      if (existing) {
        if (existing.points >= nodeData.maxPoints) return prev;
        updatedNodes = tree.allocatedNodes.map((n) =>
          n.x === x && n.y === y ? { ...n, points: n.points + 1 } : n,
        );
      } else {
        updatedNodes = [...tree.allocatedNodes, { x, y, points: 1 }];
      }

      return {
        ...prev,
        talentPage: {
          ...prev.talentPage,
          [slot]: { ...tree, allocatedNodes: updatedNodes },
        },
      };
    });
  };

  const handleDeallocate = (slot: TreeSlot, x: number, y: number) => {
    updateLoadout((prev) => {
      const tree = prev.talentPage[slot];
      if (!tree) return prev;
      const existing = tree.allocatedNodes.find((n) => n.x === x && n.y === y);
      if (!existing) return prev;

      let updatedNodes: AllocatedTalentNode[];

      if (existing.points > 1) {
        updatedNodes = tree.allocatedNodes.map((n) =>
          n.x === x && n.y === y ? { ...n, points: n.points - 1 } : n,
        );
      } else {
        updatedNodes = tree.allocatedNodes.filter(
          (n) => !(n.x === x && n.y === y),
        );
      }

      return {
        ...prev,
        talentPage: {
          ...prev.talentPage,
          [slot]: { ...tree, allocatedNodes: updatedNodes },
        },
      };
    });
  };

  const handleSelectCoreTalent = (
    treeSlot: TreeSlot,
    slotIndex: number,
    talentName: string | undefined,
  ) => {
    updateLoadout((prev) => {
      const tree = prev.talentPage[treeSlot];
      if (!tree) return prev;

      const newSelected = [...(tree.selectedCoreTalents ?? [])];
      if (talentName) {
        newSelected[slotIndex] = talentName;
      } else {
        newSelected.splice(slotIndex, 1);
      }

      return {
        ...prev,
        talentPage: {
          ...prev.talentPage,
          [treeSlot]: {
            ...tree,
            selectedCoreTalents: newSelected.filter(Boolean),
          },
        },
      };
    });
  };

  type ActiveSkillSlot =
    | "activeSkill1"
    | "activeSkill2"
    | "activeSkill3"
    | "activeSkill4";
  type PassiveSkillSlot =
    | "passiveSkill1"
    | "passiveSkill2"
    | "passiveSkill3"
    | "passiveSkill4";
  type SkillSlotKey = ActiveSkillSlot | PassiveSkillSlot;
  type SupportSkillKey = keyof SupportSkills;

  const ACTIVE_SKILL_SLOTS: ActiveSkillSlot[] = [
    "activeSkill1",
    "activeSkill2",
    "activeSkill3",
    "activeSkill4",
  ];

  const PASSIVE_SKILL_SLOTS: PassiveSkillSlot[] = [
    "passiveSkill1",
    "passiveSkill2",
    "passiveSkill3",
    "passiveSkill4",
  ];

  const getSelectedActiveSkillNames = (): string[] => {
    return ACTIVE_SKILL_SLOTS.map(
      (slot) => loadout.skillPage[slot].skillName,
    ).filter((name): name is string => name !== undefined);
  };

  const getSelectedPassiveSkillNames = (): string[] => {
    return PASSIVE_SKILL_SLOTS.map(
      (slot) => loadout.skillPage[slot].skillName,
    ).filter((name): name is string => name !== undefined);
  };

  const handleSkillChange = (
    slotKey: SkillSlotKey,
    skillName: string | undefined,
  ): void => {
    updateLoadout((prev) => ({
      ...prev,
      skillPage: {
        ...prev.skillPage,
        [slotKey]: {
          ...prev.skillPage[slotKey],
          skillName,
          supportSkills: {},
        },
      },
    }));
  };

  const handleToggleSkill = (slotKey: SkillSlotKey): void => {
    updateLoadout((prev) => ({
      ...prev,
      skillPage: {
        ...prev.skillPage,
        [slotKey]: {
          ...prev.skillPage[slotKey],
          enabled: !prev.skillPage[slotKey].enabled,
        },
      },
    }));
  };

  const handleUpdateSkillSupport = (
    slotKey: SkillSlotKey,
    supportKey: SupportSkillKey,
    supportName: string | undefined,
  ): void => {
    updateLoadout((prev) => ({
      ...prev,
      skillPage: {
        ...prev.skillPage,
        [slotKey]: {
          ...prev.skillPage[slotKey],
          supportSkills: {
            ...prev.skillPage[slotKey].supportSkills,
            [supportKey]: supportName,
          },
        },
      },
    }));
  };

  const handleHeroChange = (hero: string | undefined) => {
    updateLoadout((prev) => {
      if (!hero) {
        return {
          ...prev,
          heroPage: createEmptyHeroPage(),
        };
      }

      const baseTrait = getBaseTraitForHero(hero);

      return {
        ...prev,
        heroPage: {
          selectedHero: hero,
          traits: {
            level1: baseTrait?.name,
            level45: undefined,
            level60: undefined,
            level75: undefined,
          },
          memorySlots: {
            slot45: undefined,
            slot60: undefined,
            slot75: undefined,
          },
        },
      };
    });
  };

  const handleHeroTraitSelect = (
    level: 45 | 60 | 75,
    traitName: string | undefined,
  ) => {
    const traitKey = `level${level}` as "level45" | "level60" | "level75";
    updateLoadout((prev) => ({
      ...prev,
      heroPage: {
        ...prev.heroPage,
        traits: {
          ...prev.heroPage.traits,
          [traitKey]: traitName,
        },
      },
    }));
  };

  const handleHeroMemoryEquip = (
    slot: HeroMemorySlot,
    memoryId: string | undefined,
  ) => {
    updateLoadout((prev) => {
      const memory = memoryId
        ? prev.heroMemoryList.find((m) => m.id === memoryId)
        : undefined;

      return {
        ...prev,
        heroPage: {
          ...prev.heroPage,
          memorySlots: {
            ...prev.heroPage.memorySlots,
            [slot]: memory,
          },
        },
      };
    });
  };

  const handleHeroMemorySave = (memory: HeroMemory) => {
    updateLoadout((prev) => ({
      ...prev,
      heroMemoryList: [...prev.heroMemoryList, memory],
    }));
  };

  const handleHeroMemoryCopy = (memory: HeroMemory) => {
    const newMemory: HeroMemory = { ...memory, id: generateItemId() };
    updateLoadout((prev) => ({
      ...prev,
      heroMemoryList: [...prev.heroMemoryList, newMemory],
    }));
  };

  const handleHeroMemoryDelete = (memoryId: string) => {
    updateLoadout((prev) => {
      const newMemoryList = prev.heroMemoryList.filter(
        (m) => m.id !== memoryId,
      );
      const newMemorySlots = { ...prev.heroPage.memorySlots };
      if (newMemorySlots.slot45?.id === memoryId) {
        newMemorySlots.slot45 = undefined;
      }
      if (newMemorySlots.slot60?.id === memoryId) {
        newMemorySlots.slot60 = undefined;
      }
      if (newMemorySlots.slot75?.id === memoryId) {
        newMemorySlots.slot75 = undefined;
      }

      return {
        ...prev,
        heroMemoryList: newMemoryList,
        heroPage: {
          ...prev.heroPage,
          memorySlots: newMemorySlots,
        },
      };
    });
  };

  const handlePactspiritSelect = (
    slotIndex: PactspiritSlotIndex,
    pactspiritName: string | undefined,
  ) => {
    const slotKey = `slot${slotIndex}` as keyof PactspiritPage;
    updateLoadout((prev) => ({
      ...prev,
      pactspiritPage: {
        ...prev.pactspiritPage,
        [slotKey]: {
          ...createEmptyPactspiritSlot(),
          pactspiritName,
        },
      },
    }));
  };

  const handlePactspiritLevelChange = (
    slotIndex: PactspiritSlotIndex,
    level: number,
  ) => {
    const slotKey = `slot${slotIndex}` as keyof PactspiritPage;
    updateLoadout((prev) => ({
      ...prev,
      pactspiritPage: {
        ...prev.pactspiritPage,
        [slotKey]: {
          ...prev.pactspiritPage[slotKey],
          level,
        },
      },
    }));
  };

  const handleInstallDestiny = (
    slotIndex: PactspiritSlotIndex,
    ringSlot: RingSlotKey,
    destiny: {
      destinyName: string;
      destinyType: string;
      resolvedAffix: string;
    },
  ) => {
    const slotKey = `slot${slotIndex}` as keyof PactspiritPage;
    updateLoadout((prev) => ({
      ...prev,
      pactspiritPage: {
        ...prev.pactspiritPage,
        [slotKey]: {
          ...prev.pactspiritPage[slotKey],
          rings: {
            ...prev.pactspiritPage[slotKey].rings,
            [ringSlot]: {
              installedDestiny: destiny,
            },
          },
        },
      },
    }));
  };

  const handleRevertRing = (
    slotIndex: PactspiritSlotIndex,
    ringSlot: RingSlotKey,
  ) => {
    const slotKey = `slot${slotIndex}` as keyof PactspiritPage;
    updateLoadout((prev) => ({
      ...prev,
      pactspiritPage: {
        ...prev.pactspiritPage,
        [slotKey]: {
          ...prev.pactspiritPage[slotKey],
          rings: {
            ...prev.pactspiritPage[slotKey].rings,
            [ringSlot]: {},
          },
        },
      },
    }));
  };

  const handleSaveDivinitySlate = (slate: DivinitySlate) => {
    updateLoadout((prev) => ({
      ...prev,
      divinitySlateList: [...prev.divinitySlateList, slate],
    }));
  };

  const handleUpdateDivinitySlate = (slate: DivinitySlate) => {
    updateLoadout((prev) => ({
      ...prev,
      divinitySlateList: prev.divinitySlateList.map((s) =>
        s.id === slate.id ? slate : s,
      ),
    }));
  };

  const handleCopyDivinitySlate = (slate: DivinitySlate) => {
    const newSlate = { ...slate, id: generateItemId() };
    updateLoadout((prev) => ({
      ...prev,
      divinitySlateList: [...prev.divinitySlateList, newSlate],
    }));
  };

  const handleDeleteDivinitySlate = (slateId: string) => {
    updateLoadout((prev) => ({
      ...prev,
      divinitySlateList: prev.divinitySlateList.filter((s) => s.id !== slateId),
      divinityPage: {
        ...prev.divinityPage,
        placedSlates: prev.divinityPage.placedSlates.filter(
          (p) => p.slateId !== slateId,
        ),
      },
    }));
  };

  const handlePlaceDivinitySlate = (placement: PlacedSlate) => {
    updateLoadout((prev) => ({
      ...prev,
      divinityPage: {
        ...prev.divinityPage,
        placedSlates: [...prev.divinityPage.placedSlates, placement],
      },
    }));
  };

  const handleRemovePlacedDivinitySlate = (slateId: string) => {
    updateLoadout((prev) => ({
      ...prev,
      divinityPage: {
        ...prev.divinityPage,
        placedSlates: prev.divinityPage.placedSlates.filter(
          (p) => p.slateId !== slateId,
        ),
      },
    }));
  };

  const handleMoveDivinitySlate = (
    slateId: string,
    position: { row: number; col: number },
  ) => {
    updateLoadout((prev) => ({
      ...prev,
      divinityPage: {
        ...prev.divinityPage,
        placedSlates: prev.divinityPage.placedSlates.map((p) =>
          p.slateId === slateId ? { ...p, position } : p,
        ),
      },
    }));
  };

  const handleSavePrism = (prism: CraftedPrism) => {
    updateLoadout((prev) => ({
      ...prev,
      prismList: [...prev.prismList, prism],
    }));
  };

  const handleUpdatePrism = (prism: CraftedPrism) => {
    updateLoadout((prev) => ({
      ...prev,
      prismList: prev.prismList.map((p) => (p.id === prism.id ? prism : p)),
    }));
  };

  const handleCopyPrism = (prism: CraftedPrism) => {
    const newPrism = { ...prism, id: generateItemId() };
    updateLoadout((prev) => ({
      ...prev,
      prismList: [...prev.prismList, newPrism],
    }));
  };

  const handleDeletePrism = (prismId: string) => {
    updateLoadout((prev) => ({
      ...prev,
      prismList: prev.prismList.filter((p) => p.id !== prismId),
    }));
  };

  const handleDebugToggle = () => {
    setDebugMode((prev) => {
      const newValue = !prev;
      saveDebugModeToStorage(newValue);
      return newValue;
    });
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToSaves}
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Back to Saves"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-zinc-50">
              TLI Character Build Planner
            </h1>
            {currentSaveName && (
              <span className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-sm text-zinc-300">
                {currentSaveName}
                {hasUnsavedChanges && (
                  <span className="text-amber-500 ml-1">*</span>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!saveId || !hasUnsavedChanges}
              className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed"
            >
              Save
            </button>
            <button
              onClick={handleDebugToggle}
              className={`
                px-3 py-1 rounded-lg text-sm font-medium transition-colors
                ${
                  debugMode
                    ? "bg-amber-400 text-zinc-950 hover:bg-amber-500"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
                }
              `}
              title="Toggle Debug Mode"
            >
              {debugMode ? "Debug ON" : "Debug"}
            </button>
          </div>
        </div>

        <PageTabs activePage={activePage} setActivePage={setActivePage} />

        {activePage === "equipment" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-700">
              <h2 className="text-xl font-semibold mb-4 text-zinc-50">
                Equipment Slots
              </h2>
              <div className="space-y-1">
                {GEAR_SLOTS.map(({ key, label }) => (
                  <EquipmentSlotDropdown
                    key={key}
                    slot={key}
                    label={label}
                    selectedItemId={loadout.equipmentPage[key]?.id || null}
                    compatibleItems={getCompatibleItems(loadout.itemsList, key)}
                    onSelectItem={handleSelectItemForSlot}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-700">
                <h2 className="text-xl font-semibold mb-4 text-zinc-50">
                  Craft New Item
                </h2>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-zinc-50">
                    Equipment Type
                  </label>
                  <select
                    value={selectedEquipmentType || ""}
                    onChange={handleEquipmentTypeChange}
                    className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-zinc-50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  >
                    <option value="">Select equipment type...</option>
                    {getValidEquipmentTypes("mainHand")
                      .concat(getValidEquipmentTypes("helmet"))
                      .concat(getValidEquipmentTypes("chest"))
                      .concat(getValidEquipmentTypes("gloves"))
                      .concat(getValidEquipmentTypes("boots"))
                      .concat(getValidEquipmentTypes("belt"))
                      .concat(getValidEquipmentTypes("neck"))
                      .concat(getValidEquipmentTypes("leftRing"))
                      .concat(getValidEquipmentTypes("offHand"))
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .sort()
                      .map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                  </select>
                </div>

                {selectedEquipmentType ? (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-zinc-50">
                        Prefixes (3 max)
                      </h3>
                      <div className="space-y-4">
                        {[0, 1, 2].map((slotIndex) => (
                          <AffixSlotComponent
                            key={slotIndex}
                            slotIndex={slotIndex}
                            affixType="Prefix"
                            affixes={prefixAffixes}
                            selection={affixSelections[slotIndex]}
                            onAffixSelect={handleAffixSelect}
                            onSliderChange={handleSliderChange}
                            onClear={handleClearAffix}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-zinc-50">
                        Suffixes (3 max)
                      </h3>
                      <div className="space-y-4">
                        {[3, 4, 5].map((slotIndex) => (
                          <AffixSlotComponent
                            key={slotIndex}
                            slotIndex={slotIndex}
                            affixType="Suffix"
                            affixes={suffixAffixes}
                            selection={affixSelections[slotIndex]}
                            onAffixSelect={handleAffixSelect}
                            onSliderChange={handleSliderChange}
                            onClear={handleClearAffix}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleSaveToInventory}
                      className="w-full px-4 py-3 bg-amber-500 text-zinc-950 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
                    >
                      Save to Inventory
                    </button>
                  </>
                ) : (
                  <p className="text-zinc-500 italic text-center py-8">
                    Select an equipment type to begin crafting
                  </p>
                )}
              </div>

              <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-700">
                <h2 className="text-xl font-semibold mb-4 text-zinc-50">
                  Inventory ({loadout.itemsList.length} items)
                </h2>
                {loadout.itemsList.length === 0 ? (
                  <p className="text-zinc-500 italic text-center py-4">
                    No items in inventory. Craft items above to add them here.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {loadout.itemsList.map((item) => (
                      <InventoryItem
                        key={item.id}
                        item={item}
                        isEquipped={isItemEquipped(item.id)}
                        onCopy={handleCopyItem}
                        onDelete={handleDeleteItem}
                      />
                    ))}
                  </div>
                )}
              </div>

              <LegendaryGearModule
                onSaveToInventory={handleAddItemToInventory}
              />
            </div>
          </div>
        )}

        {activePage === "talents" && (
          <>
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 text-zinc-50">
                  Tree Slots
                </h2>
                <div className="grid grid-cols-4 gap-2">
                  {(["tree1", "tree2", "tree3", "tree4"] as const).map(
                    (slot) => {
                      const tree = loadout.talentPage[slot];
                      const totalPoints = tree
                        ? tree.allocatedNodes.reduce(
                            (sum, node) => sum + node.points,
                            0,
                          )
                        : 0;

                      return (
                        <button
                          key={slot}
                          onClick={() => setActiveTreeSlot(slot)}
                          className={`
                        px-4 py-3 rounded-lg font-medium transition-colors border
                        ${
                          activeTreeSlot === slot
                            ? "bg-amber-500 text-zinc-950 border-amber-500"
                            : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:bg-zinc-800"
                        }
                      `}
                        >
                          <div className="font-semibold">
                            {slot === "tree1"
                              ? "Slot 1 (God/Goddess)"
                              : `Slot ${slot.slice(-1)}`}
                          </div>
                          <div className="text-sm mt-1 truncate">
                            {tree ? tree.name.replace(/_/g, " ") : "None"}
                          </div>
                          <div className="text-xs mt-1">
                            {totalPoints} points
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="mb-6 bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                <label className="block text-sm font-medium mb-2 text-zinc-400">
                  Select Tree for{" "}
                  {activeTreeSlot === "tree1"
                    ? "Slot 1"
                    : `Slot ${activeTreeSlot.slice(-1)}`}
                </label>
                <div className="flex gap-2">
                  <select
                    value={loadout.talentPage[activeTreeSlot]?.name ?? ""}
                    onChange={(e) =>
                      handleTreeChange(activeTreeSlot, e.target.value)
                    }
                    disabled={
                      (loadout.talentPage[activeTreeSlot]?.allocatedNodes
                        .length ?? 0) > 0
                    }
                    className="flex-1 px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">None</option>
                    {activeTreeSlot === "tree1" ? (
                      <optgroup label="God/Goddess Trees">
                        {GOD_GODDESS_TREES.map((tree) => (
                          <option key={tree} value={tree}>
                            {tree.replace(/_/g, " ")}
                          </option>
                        ))}
                      </optgroup>
                    ) : (
                      <optgroup label="Profession Trees">
                        {PROFESSION_TREES.map((tree) => (
                          <option key={tree} value={tree}>
                            {tree.replace(/_/g, " ")}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>

                  <button
                    onClick={() => handleResetTree(activeTreeSlot)}
                    disabled={
                      (loadout.talentPage[activeTreeSlot]?.allocatedNodes
                        .length ?? 0) === 0
                    }
                    className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {loadout.talentPage[activeTreeSlot] && (
                <CoreTalentSelector
                  treeName={loadout.talentPage[activeTreeSlot]!.name}
                  treeSlot={activeTreeSlot}
                  pointsSpent={loadout.talentPage[
                    activeTreeSlot
                  ]!.allocatedNodes.reduce((sum, node) => sum + node.points, 0)}
                  selectedCoreTalents={
                    loadout.talentPage[activeTreeSlot]!.selectedCoreTalents ??
                    []
                  }
                  onSelectCoreTalent={(slotIndex, name) =>
                    handleSelectCoreTalent(activeTreeSlot, slotIndex, name)
                  }
                />
              )}

              {!loadout.talentPage[activeTreeSlot] ? (
                <div className="text-center py-12 text-zinc-500">
                  Select a tree to view
                </div>
              ) : treeData[activeTreeSlot] ? (
                <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-700">
                  <h2 className="text-xl font-semibold mb-4 text-zinc-50">
                    {treeData[activeTreeSlot]!.name.replace(/_/g, " ")} Tree
                  </h2>

                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {[0, 3, 6, 9, 12, 15, 18].map((points, idx) => (
                      <div
                        key={idx}
                        className="text-center text-sm font-medium text-zinc-500"
                      >
                        {points} pts
                      </div>
                    ))}
                  </div>

                  <TalentGrid
                    treeData={treeData[activeTreeSlot]!}
                    allocatedNodes={
                      loadout.talentPage[activeTreeSlot]!.allocatedNodes
                    }
                    onAllocate={(x, y) => handleAllocate(activeTreeSlot, x, y)}
                    onDeallocate={(x, y) =>
                      handleDeallocate(activeTreeSlot, x, y)
                    }
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-500">
                  Loading tree...
                </div>
              )}
            </div>

            <PrismSection
              prisms={loadout.prismList}
              onSave={handleSavePrism}
              onUpdate={handleUpdatePrism}
              onCopy={handleCopyPrism}
              onDelete={handleDeletePrism}
            />
          </>
        )}

        {activePage === "skills" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-4 text-zinc-50">
                Active Skills
              </h2>

              <div className="space-y-3">
                {ACTIVE_SKILL_SLOTS.map((slotKey, index) => (
                  <SkillSlot
                    key={slotKey}
                    slotLabel={`Active ${index + 1}`}
                    skill={loadout.skillPage[slotKey]}
                    availableSkills={ActiveSkills}
                    excludedSkillNames={getSelectedActiveSkillNames()}
                    onSkillChange={(skillName) =>
                      handleSkillChange(slotKey, skillName)
                    }
                    onToggle={() => handleToggleSkill(slotKey)}
                    onUpdateSupport={(supportKey, supportName) =>
                      handleUpdateSkillSupport(slotKey, supportKey, supportName)
                    }
                  />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 text-zinc-50">
                Passive Skills
              </h2>

              <div className="space-y-3">
                {PASSIVE_SKILL_SLOTS.map((slotKey, index) => (
                  <SkillSlot
                    key={slotKey}
                    slotLabel={`Passive ${index + 1}`}
                    skill={loadout.skillPage[slotKey]}
                    availableSkills={PassiveSkills}
                    excludedSkillNames={getSelectedPassiveSkillNames()}
                    onSkillChange={(skillName) =>
                      handleSkillChange(slotKey, skillName)
                    }
                    onToggle={() => handleToggleSkill(slotKey)}
                    onUpdateSupport={(supportKey, supportName) =>
                      handleUpdateSkillSupport(slotKey, supportKey, supportName)
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activePage === "hero" && (
          <HeroTab
            heroPage={loadout.heroPage}
            heroMemoryList={loadout.heroMemoryList}
            onHeroChange={handleHeroChange}
            onTraitSelect={handleHeroTraitSelect}
            onMemoryEquip={handleHeroMemoryEquip}
            onMemorySave={handleHeroMemorySave}
            onMemoryCopy={handleHeroMemoryCopy}
            onMemoryDelete={handleHeroMemoryDelete}
          />
        )}

        {activePage === "pactspirit" && (
          <PactspiritTab
            pactspiritPage={loadout.pactspiritPage}
            onPactspiritSelect={handlePactspiritSelect}
            onLevelChange={handlePactspiritLevelChange}
            onInstallDestiny={handleInstallDestiny}
            onRevertRing={handleRevertRing}
          />
        )}

        {activePage === "divinity" && (
          <DivinityTab
            divinityPage={loadout.divinityPage}
            divinitySlateList={loadout.divinitySlateList}
            onSaveSlate={handleSaveDivinitySlate}
            onUpdateSlate={handleUpdateDivinitySlate}
            onCopySlate={handleCopyDivinitySlate}
            onDeleteSlate={handleDeleteDivinitySlate}
            onPlaceSlate={handlePlaceDivinitySlate}
            onRemovePlacedSlate={handleRemovePlacedDivinitySlate}
            onMoveSlate={handleMoveDivinitySlate}
          />
        )}

        <div className="mt-8 flex gap-4">
          <button
            onClick={handleExport}
            className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold text-lg hover:bg-green-600 transition-colors"
          >
            Export
          </button>
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex-1 px-6 py-3 bg-amber-500 text-zinc-950 rounded-lg font-semibold text-lg hover:bg-amber-600 transition-colors"
          >
            Import
          </button>
        </div>

        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          buildCode={buildCode}
        />

        <ImportModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImport={handleImport}
        />

        <Toast
          message="You have unsaved changes. Save your work before leaving."
          isVisible={toastVisible}
          onDismiss={() => setToastVisible(false)}
          duration={0}
          variant="warning"
        />

        <Toast
          message="Build saved successfully!"
          isVisible={saveSuccessToastVisible}
          onDismiss={() => setSaveSuccessToastVisible(false)}
          duration={3000}
          variant="success"
        />

        {debugMode && (
          <DebugPanel
            loadout={loadout}
            debugPanelExpanded={debugPanelExpanded}
            setDebugPanelExpanded={setDebugPanelExpanded}
            onClose={handleDebugToggle}
          />
        )}
      </div>
    </div>
  );
}
