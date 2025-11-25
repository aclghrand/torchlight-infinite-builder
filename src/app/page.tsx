"use client";

import { useState, useEffect } from "react";
import {
  RawLoadout,
  RawGearPage,
  RawGear,
  RawAllocatedTalentNode,
} from "@/src/tli/core";
import {
  TalentTreeData,
  TalentNodeData,
  GOD_GODDESS_TREES,
  PROFESSION_TREES,
  TreeName,
  isGodGoddessTree,
  loadTalentTree,
  canAllocateNode,
  canDeallocateNode,
  isPrerequisiteSatisfied,
} from "@/src/tli/talent_tree";

type GearSlot = keyof RawGearPage;

const GEAR_SLOTS: { key: GearSlot; label: string }[] = [
  { key: "helmet", label: "Helmet" },
  { key: "chest", label: "Chest" },
  { key: "neck", label: "Neck" },
  { key: "gloves", label: "Gloves" },
  { key: "belt", label: "Belt" },
  { key: "boots", label: "Boots" },
  { key: "leftRing", label: "Left Ring" },
  { key: "rightRing", label: "Right Ring" },
  { key: "mainHand", label: "Main Hand" },
  { key: "offHand", label: "Off Hand" },
];

const STORAGE_KEY = "tli-planner-loadout";

const createEmptyLoadout = (): RawLoadout => ({
  equipmentPage: {},
  talentPage: {
    tree1: { name: "Warrior", allocatedNodes: [] },
    tree2: { name: "Warrior", allocatedNodes: [] },
    tree3: { name: "Warrior", allocatedNodes: [] },
    tree4: { name: "Warrior", allocatedNodes: [] },
  },
});

const loadFromStorage = (): RawLoadout => {
  if (typeof window === "undefined") return createEmptyLoadout();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return createEmptyLoadout();
    return JSON.parse(stored) as RawLoadout;
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
    return createEmptyLoadout();
  }
};

const saveToStorage = (loadout: RawLoadout): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loadout));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
};

export default function Home() {
  const [loadout, setLoadout] = useState<RawLoadout>(createEmptyLoadout);
  const [selectedSlot, setSelectedSlot] = useState<GearSlot>("helmet");
  const [newAffix, setNewAffix] = useState("");
  const [mounted, setMounted] = useState(false);
  const [activePage, setActivePage] = useState<"equipment" | "talents">(
    "equipment",
  );
  const [activeTreeSlot, setActiveTreeSlot] = useState<
    "tree1" | "tree2" | "tree3" | "tree4"
  >("tree1");
  const [treeData, setTreeData] = useState<
    Record<string, TalentTreeData | null>
  >({
    tree1: null,
    tree2: null,
    tree3: null,
    tree4: null,
  });

  useEffect(() => {
    setMounted(true);
    setLoadout(loadFromStorage());
  }, []);

  // Load talent trees when names change
  useEffect(() => {
    if (activePage !== "talents") return;

    const loadTree = async (slot: "tree1" | "tree2" | "tree3" | "tree4") => {
      const treeName = loadout.talentPage[slot].name;
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
    loadout.talentPage.tree1.name,
    loadout.talentPage.tree2.name,
    loadout.talentPage.tree3.name,
    loadout.talentPage.tree4.name,
  ]);

  const selectedGear = loadout.equipmentPage[selectedSlot];

  const getGearType = (slot: GearSlot): RawGear["gearType"] => {
    if (slot === "leftRing" || slot === "rightRing") return "ring";
    if (slot === "mainHand" || slot === "offHand") return "sword";
    return slot;
  };

  const handleAddAffix = () => {
    if (!newAffix.trim()) return;

    setLoadout((prev) => {
      const currentGear = prev.equipmentPage[selectedSlot];
      const updatedGear: RawGear = currentGear
        ? { ...currentGear, affixes: [...currentGear.affixes, newAffix.trim()] }
        : { gearType: getGearType(selectedSlot), affixes: [newAffix.trim()] };

      return {
        ...prev,
        equipmentPage: {
          ...prev.equipmentPage,
          [selectedSlot]: updatedGear,
        },
      };
    });

    setNewAffix("");
  };

  const handleDeleteAffix = (index: number) => {
    setLoadout((prev) => {
      const currentGear = prev.equipmentPage[selectedSlot];
      if (!currentGear) return prev;

      const updatedAffixes = currentGear.affixes.filter((_, i) => i !== index);

      if (updatedAffixes.length === 0) {
        const { [selectedSlot]: _, ...restEquipment } = prev.equipmentPage;
        return {
          ...prev,
          equipmentPage: restEquipment,
        };
      }

      return {
        ...prev,
        equipmentPage: {
          ...prev.equipmentPage,
          [selectedSlot]: { ...currentGear, affixes: updatedAffixes },
        },
      };
    });
  };

  const handleSave = () => {
    saveToStorage(loadout);
    alert("Loadout saved!");
  };

  // Talent page handlers
  const handleTreeChange = (
    slot: "tree1" | "tree2" | "tree3" | "tree4",
    newTreeName: string,
  ) => {
    // Prevent changing tree if points are allocated
    if (loadout.talentPage[slot].allocatedNodes.length > 0) {
      return;
    }

    // Validate god/goddess trees only in slot 1
    if (slot !== "tree1" && isGodGoddessTree(newTreeName)) {
      return;
    }

    setLoadout((prev) => ({
      ...prev,
      talentPage: {
        ...prev.talentPage,
        [slot]: {
          name: newTreeName,
          allocatedNodes: [],
        },
      },
    }));
  };

  const handleResetTree = (slot: "tree1" | "tree2" | "tree3" | "tree4") => {
    if (loadout.talentPage[slot].allocatedNodes.length === 0) return;

    if (confirm("Reset all points in this tree? This cannot be undone.")) {
      setLoadout((prev) => ({
        ...prev,
        talentPage: {
          ...prev.talentPage,
          [slot]: {
            ...prev.talentPage[slot],
            allocatedNodes: [],
          },
        },
      }));
    }
  };

  const handleAllocate = (
    slot: "tree1" | "tree2" | "tree3" | "tree4",
    x: number,
    y: number,
  ) => {
    setLoadout((prev) => {
      const tree = prev.talentPage[slot];
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

  const handleDeallocate = (
    slot: "tree1" | "tree2" | "tree3" | "tree4",
    x: number,
    y: number,
  ) => {
    setLoadout((prev) => {
      const tree = prev.talentPage[slot];
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

  // Helper component for talent nodes
  const TalentNodeDisplay = ({
    node,
    allocated,
    canAllocate,
    canDeallocate,
    onAllocate,
    onDeallocate,
  }: {
    node: TalentNodeData;
    allocated: number;
    canAllocate: boolean;
    canDeallocate: boolean;
    onAllocate: () => void;
    onDeallocate: () => void;
  }) => {
    const isFullyAllocated = allocated >= node.maxPoints;
    const isLocked = !canAllocate && allocated === 0;

    return (
      <div
        className={`
          relative w-20 h-20 rounded-lg border-2 transition-all
          ${
            isFullyAllocated
              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
              : allocated > 0
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : isLocked
                  ? "border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 opacity-50"
                  : "border-zinc-400 dark:border-zinc-500 bg-white dark:bg-zinc-700 hover:border-blue-400"
          }
        `}
        title={`${
          node.nodeType === "micro"
            ? "Micro Talent"
            : node.nodeType === "medium"
              ? "Medium Talent"
              : "Legendary Talent"
        }\n${node.rawAffix}`}
      >
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={`/tli/talents/${node.iconName}.webp`}
            alt={node.iconName}
            className="w-12 h-12 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        {/* Points Display */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs text-center py-0.5 rounded-b-md">
          {allocated}/{node.maxPoints}
        </div>

        {/* Allocation Buttons */}
        <div className="absolute -top-2 -right-2 flex gap-1">
          <button
            onClick={onAllocate}
            disabled={!canAllocate}
            className={`
              w-5 h-5 rounded-full text-white text-xs font-bold
              ${
                canAllocate
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed"
              }
            `}
          >
            +
          </button>
          <button
            onClick={onDeallocate}
            disabled={!canDeallocate}
            className={`
              w-5 h-5 rounded-full text-white text-xs font-bold
              ${
                canDeallocate
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed"
              }
            `}
          >
            -
          </button>
        </div>
      </div>
    );
  };

  // Helper to calculate node center positions for SVG lines
  const getNodeCenter = (x: number, y: number) => ({
    cx: x * (80 + 8) + 40, // 80px node + 8px gap, center at 40px
    cy: y * (80 + 8) + 40,
  });

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-zinc-900 dark:text-zinc-50">
          TLI Character Build Planner
        </h1>

        {/* Page Tabs */}
        <div className="mb-8 flex gap-4 border-b border-zinc-300 dark:border-zinc-700">
          <button
            onClick={() => setActivePage("equipment")}
            className={`px-6 py-3 font-medium transition-colors ${
              activePage === "equipment"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Equipment
          </button>
          <button
            onClick={() => setActivePage("talents")}
            className={`px-6 py-3 font-medium transition-colors ${
              activePage === "talents"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Talents
          </button>
        </div>

        {/* Equipment Page */}
        {activePage === "equipment" && (
          <>
            {/* Gear Slot Selector */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-200">
                Equipment Slots
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {GEAR_SLOTS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedSlot(key)}
                    className={`
                      px-4 py-2 rounded-lg font-medium transition-colors
                      ${
                        selectedSlot === key
                          ? "bg-blue-600 text-white"
                          : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Affix Manager */}
            <div className="mb-8 bg-white dark:bg-zinc-800 rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-200">
                Affixes for{" "}
                {GEAR_SLOTS.find((s) => s.key === selectedSlot)?.label}
              </h2>

              {/* Affix List */}
              <div className="mb-4">
                {!selectedGear || selectedGear.affixes.length === 0 ? (
                  <p className="text-zinc-500 dark:text-zinc-400 italic">
                    No affixes yet. Add one below!
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {selectedGear.affixes.map((affix, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-700 px-4 py-2 rounded"
                      >
                        <span className="text-zinc-800 dark:text-zinc-200">
                          {affix}
                        </span>
                        <button
                          onClick={() => handleDeleteAffix(index)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Add Affix Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAffix}
                  onChange={(e) => setNewAffix(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddAffix();
                  }}
                  placeholder="e.g., +10% fire damage"
                  className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddAffix}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </>
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
                  const totalPoints = loadout.talentPage[
                    slot
                  ].allocatedNodes.reduce((sum, node) => sum + node.points, 0);

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
                        {loadout.talentPage[slot].name.replace(/_/g, " ")}
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
                  value={loadout.talentPage[activeTreeSlot].name}
                  onChange={(e) =>
                    handleTreeChange(activeTreeSlot, e.target.value)
                  }
                  disabled={
                    loadout.talentPage[activeTreeSlot].allocatedNodes.length > 0
                  }
                  className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
                    loadout.talentPage[activeTreeSlot].allocatedNodes.length ===
                    0
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-zinc-400 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Talent Grid */}
            {treeData[activeTreeSlot] ? (
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

                {/* Grid Container with SVG */}
                <div className="relative">
                  {/* SVG for prerequisite lines */}
                  <svg
                    className="absolute inset-0 pointer-events-none"
                    style={{ width: "100%", height: "100%", zIndex: 0 }}
                  >
                    {treeData[activeTreeSlot]!.nodes.filter(
                      (node) => node.prerequisite,
                    ).map((node, idx) => {
                      const from = getNodeCenter(
                        node.prerequisite!.x,
                        node.prerequisite!.y,
                      );
                      const to = getNodeCenter(
                        node.position.x,
                        node.position.y,
                      );

                      const isSatisfied = isPrerequisiteSatisfied(
                        node.prerequisite,
                        loadout.talentPage[activeTreeSlot].allocatedNodes,
                        treeData[activeTreeSlot]!,
                      );

                      return (
                        <line
                          key={idx}
                          x1={from.cx}
                          y1={from.cy}
                          x2={to.cx}
                          y2={to.cy}
                          stroke={isSatisfied ? "#22c55e" : "#71717a"}
                          strokeWidth="2"
                          opacity="0.5"
                        />
                      );
                    })}
                  </svg>

                  {/* Node Grid */}
                  <div className="relative" style={{ zIndex: 1 }}>
                    {[0, 1, 2, 3, 4].map((y) => (
                      <div key={y} className="grid grid-cols-7 gap-2 mb-2">
                        {[0, 1, 2, 3, 4, 5, 6].map((x) => {
                          const node = treeData[activeTreeSlot]!.nodes.find(
                            (n) => n.position.x === x && n.position.y === y,
                          );

                          if (!node) {
                            return <div key={x} className="w-20 h-20" />;
                          }

                          const allocation = loadout.talentPage[
                            activeTreeSlot
                          ].allocatedNodes.find((n) => n.x === x && n.y === y);
                          const allocated = allocation?.points ?? 0;

                          return (
                            <TalentNodeDisplay
                              key={`${x}-${y}`}
                              node={node}
                              allocated={allocated}
                              canAllocate={canAllocateNode(
                                node,
                                loadout.talentPage[activeTreeSlot]
                                  .allocatedNodes,
                                treeData[activeTreeSlot]!,
                              )}
                              canDeallocate={canDeallocateNode(
                                node,
                                loadout.talentPage[activeTreeSlot]
                                  .allocatedNodes,
                                treeData[activeTreeSlot]!,
                              )}
                              onAllocate={() =>
                                handleAllocate(activeTreeSlot, x, y)
                              }
                              onDeallocate={() =>
                                handleDeallocate(activeTreeSlot, x, y)
                              }
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                Loading tree...
              </div>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8">
          <button
            onClick={handleSave}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors"
          >
            Save to LocalStorage
          </button>
        </div>
      </div>
    </div>
  );
}
