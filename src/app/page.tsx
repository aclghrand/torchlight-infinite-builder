"use client";

import { useState, useEffect, useMemo } from "react";
import { RawLoadout, RawGear, RawAllocatedTalentNode } from "@/src/tli/core";
import { Skill, AVAILABLE_SKILLS } from "@/src/tli/offense";
import {
  TalentTreeData,
  GOD_GODDESS_TREES,
  PROFESSION_TREES,
  TreeName,
  isGodGoddessTree,
  loadTalentTree,
} from "@/src/tli/talent_tree";
import { EquipmentType } from "@/src/tli/gear_data_types";
import { craft } from "@/src/tli/crafting/craft";

// Lib imports
import { GearSlot, AffixSlotState, TreeSlot, ActivePage } from "./lib/types";
import { GEAR_SLOTS } from "./lib/constants";
import {
  loadDebugModeFromStorage,
  saveDebugModeToStorage,
  createEmptyLoadout,
  generateItemId,
} from "./lib/storage";
import { decodeBuildCode, encodeBuildCode } from "./lib/build-code";
import {
  getValidEquipmentTypes,
  getCompatibleItems,
  getGearTypeFromEquipmentType,
} from "./lib/equipment-utils";
import { getFilteredAffixes } from "./lib/affix-utils";

// Component imports
import { PageTabs } from "./components/PageTabs";
import { DebugPanel } from "./components/DebugPanel";
import { AffixSlotComponent } from "./components/equipment/AffixSlotComponent";
import { EquipmentSlotDropdown } from "./components/equipment/EquipmentSlotDropdown";
import { InventoryItem } from "./components/equipment/InventoryItem";
import { TalentGrid } from "./components/talents/TalentGrid";
import { SkillEntry } from "./components/skills/SkillEntry";
import { ExportModal } from "./components/ExportModal";
import { ImportModal } from "./components/ImportModal";

export default function Home() {
  const [loadout, setLoadout] = useState<RawLoadout>(createEmptyLoadout);
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

  useEffect(() => {
    setMounted(true);
    setDebugMode(loadDebugModeFromStorage());
  }, []);

  // Load talent trees when names change
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

  // Inventory handlers
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

    const newItem: RawGear = {
      id: generateItemId(),
      gearType: getGearTypeFromEquipmentType(selectedEquipmentType),
      affixes,
      equipmentType: selectedEquipmentType,
    };

    setLoadout((prev) => ({
      ...prev,
      itemsList: [...prev.itemsList, newItem],
    }));

    // Reset crafting UI
    setSelectedEquipmentType(null);
    setAffixSelections(
      Array(6)
        .fill(null)
        .map(() => ({ affixIndex: null, percentage: 50 })),
    );
  };

  const handleCopyItem = (item: RawGear) => {
    const newItem: RawGear = { ...item, id: generateItemId() };
    setLoadout((prev) => ({
      ...prev,
      itemsList: [...prev.itemsList, newItem],
    }));
  };

  const handleDeleteItem = (itemId: string) => {
    setLoadout((prev) => {
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
    setLoadout((prev) => {
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
      return true;
    }
    return false;
  };

  const handleReset = () => {
    if (
      confirm(
        "Reset loadout? This will clear all equipment, talents, skills, and inventory items.",
      )
    ) {
      setLoadout(createEmptyLoadout());
    }
  };

  // Talent page handlers
  const handleTreeChange = (slot: TreeSlot, newTreeName: string) => {
    const currentTree = loadout.talentPage[slot];
    if (currentTree && currentTree.allocatedNodes.length > 0) return;

    // Allow clearing the tree
    if (newTreeName === "") {
      setLoadout((prev) => {
        const newTalentPage = { ...prev.talentPage };
        delete newTalentPage[slot];
        return { ...prev, talentPage: newTalentPage };
      });
      return;
    }

    if (slot !== "tree1" && isGodGoddessTree(newTreeName)) return;

    setLoadout((prev) => ({
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
      setLoadout((prev) => ({
        ...prev,
        talentPage: {
          ...prev.talentPage,
          [slot]: { ...prev.talentPage[slot]!, allocatedNodes: [] },
        },
      }));
    }
  };

  const handleAllocate = (slot: TreeSlot, x: number, y: number) => {
    setLoadout((prev) => {
      const tree = prev.talentPage[slot];
      if (!tree) return prev;
      const existing = tree.allocatedNodes.find((n) => n.x === x && n.y === y);
      const nodeData = treeData[slot]?.nodes.find(
        (n) => n.position.x === x && n.position.y === y,
      );
      if (!nodeData) return prev;

      let updatedNodes: RawAllocatedTalentNode[];

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
    setLoadout((prev) => {
      const tree = prev.talentPage[slot];
      if (!tree) return prev;
      const existing = tree.allocatedNodes.find((n) => n.x === x && n.y === y);
      if (!existing) return prev;

      let updatedNodes: RawAllocatedTalentNode[];

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

  // Skill page handlers
  const handleAddSkill = (skill: Skill): void => {
    setLoadout((prev) => {
      const currentSkills = prev.skillPage.skills;
      if (currentSkills.some((s) => s.skill === skill)) return prev;
      if (currentSkills.length >= 4) return prev;
      return {
        ...prev,
        skillPage: { skills: [...currentSkills, { skill, enabled: true }] },
      };
    });
  };

  const handleRemoveSkill = (index: number): void => {
    setLoadout((prev) => ({
      ...prev,
      skillPage: {
        skills: prev.skillPage.skills.filter((_, i) => i !== index),
      },
    }));
  };

  const handleToggleSkill = (index: number): void => {
    setLoadout((prev) => ({
      ...prev,
      skillPage: {
        skills: prev.skillPage.skills.map((s, i) =>
          i === index ? { ...s, enabled: !s.enabled } : s,
        ),
      },
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            TLI Character Build Planner
          </h1>

          <button
            onClick={handleDebugToggle}
            className={`
              px-3 py-1 rounded-lg text-sm font-medium transition-colors
              ${
                debugMode
                  ? "bg-yellow-600 text-white hover:bg-yellow-700"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
              }
            `}
            title="Toggle Debug Mode"
          >
            {debugMode ? "🐛 Debug ON" : "🐛 Debug"}
          </button>
        </div>

        <PageTabs activePage={activePage} setActivePage={setActivePage} />

        {/* Equipment Page */}
        {activePage === "equipment" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Equipment Slots */}
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-200">
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

            {/* Right Column: Crafting + Inventory */}
            <div className="space-y-6">
              {/* Crafting UI */}
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow">
                <h2 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-200">
                  Craft New Item
                </h2>

                {/* Equipment Type Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-zinc-800 dark:text-zinc-200">
                    Equipment Type
                  </label>
                  <select
                    value={selectedEquipmentType || ""}
                    onChange={handleEquipmentTypeChange}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    {/* Prefix Section */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-zinc-800 dark:text-zinc-200">
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

                    {/* Suffix Section */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-zinc-800 dark:text-zinc-200">
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

                    {/* Save to Inventory Button */}
                    <button
                      onClick={handleSaveToInventory}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Save to Inventory
                    </button>
                  </>
                ) : (
                  <p className="text-zinc-500 dark:text-zinc-400 italic text-center py-8">
                    Select an equipment type to begin crafting
                  </p>
                )}
              </div>

              {/* Inventory */}
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow">
                <h2 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-200">
                  Inventory ({loadout.itemsList.length} items)
                </h2>
                {loadout.itemsList.length === 0 ? (
                  <p className="text-zinc-500 dark:text-zinc-400 italic text-center py-4">
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
            </div>
          </div>
        )}

        {/* Talents Page */}
        {activePage === "talents" && (
          <div>
            {/* Tree Slot Selector */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-200">
                Tree Slots
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {(["tree1", "tree2", "tree3", "tree4"] as const).map((slot) => {
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
                        px-4 py-3 rounded-lg font-medium transition-colors
                        ${
                          activeTreeSlot === slot
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
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
                      <div className="text-xs mt-1">{totalPoints} points</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tree Selection Dropdown with Reset Button */}
            <div className="mb-6 bg-white dark:bg-zinc-800 rounded-lg p-4 shadow">
              <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
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
                  className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">None</option>
                  {activeTreeSlot === "tree1" && (
                    <optgroup label="God/Goddess Trees">
                      {GOD_GODDESS_TREES.map((tree) => (
                        <option key={tree} value={tree}>
                          {tree.replace(/_/g, " ")}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Profession Trees">
                    {PROFESSION_TREES.map((tree) => (
                      <option key={tree} value={tree}>
                        {tree.replace(/_/g, " ")}
                      </option>
                    ))}
                  </optgroup>
                </select>

                <button
                  onClick={() => handleResetTree(activeTreeSlot)}
                  disabled={
                    (loadout.talentPage[activeTreeSlot]?.allocatedNodes
                      .length ?? 0) === 0
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-zinc-400 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Talent Grid */}
            {!loadout.talentPage[activeTreeSlot] ? (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                Select a tree to view
              </div>
            ) : treeData[activeTreeSlot] ? (
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow">
                <h2 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-200">
                  {treeData[activeTreeSlot]!.name.replace(/_/g, " ")} Tree
                </h2>

                {/* Column Headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {[0, 3, 6, 9, 12, 15, 18].map((points, idx) => (
                    <div
                      key={idx}
                      className="text-center text-sm font-medium text-zinc-600 dark:text-zinc-400"
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
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                Loading tree...
              </div>
            )}
          </div>
        )}

        {/* Skills Page */}
        {activePage === "skills" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4 text-zinc-800 dark:text-zinc-200">
              Skill Selection
            </h2>

            {/* Skill List */}
            <div className="space-y-3">
              {loadout.skillPage.skills.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400">
                  No skills selected. Add a skill below.
                </p>
              ) : (
                loadout.skillPage.skills.map((skillEntry, index) => (
                  <SkillEntry
                    key={index}
                    skill={skillEntry.skill}
                    enabled={skillEntry.enabled}
                    onToggle={() => handleToggleSkill(index)}
                    onRemove={() => handleRemoveSkill(index)}
                  />
                ))
              )}
            </div>

            {/* Add Skill Section */}
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-3 text-zinc-800 dark:text-zinc-200">
                Add Skill
              </h3>

              {loadout.skillPage.skills.length >= 4 ? (
                <p className="text-yellow-600 dark:text-yellow-500">
                  Maximum of 4 skills reached
                </p>
              ) : (
                <div className="flex gap-2">
                  <select
                    className="flex-1 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddSkill(e.target.value as Skill);
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select a skill...
                    </option>
                    {AVAILABLE_SKILLS.filter(
                      (skill) =>
                        !loadout.skillPage.skills.some(
                          (s) => s.skill === skill,
                        ),
                    ).map((skill) => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={handleExport}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors"
          >
            Export
          </button>
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
          >
            Import
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold text-lg hover:bg-red-700 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Export Modal */}
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          buildCode={buildCode}
        />

        {/* Import Modal */}
        <ImportModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImport={handleImport}
        />

        {/* Debug Panel */}
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
