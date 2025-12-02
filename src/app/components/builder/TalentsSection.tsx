"use client";

import { useEffect, useCallback } from "react";
import { useBuilderStore } from "../../stores/builderStore";
import { useTalentsUIStore } from "../../stores/talentsUIStore";
import { TalentGrid } from "../talents/TalentGrid";
import { CoreTalentSelector } from "../talents/CoreTalentSelector";
import { PrismSection } from "../talents/PrismSection";
import { TreeSlot } from "../../lib/types";
import {
  TalentTreeData,
  GOD_GODDESS_TREES,
  PROFESSION_TREES,
  TreeName,
  isGodGoddessTree,
  loadTalentTree,
  canRemovePrism,
} from "@/src/tli/talent_tree";
import { AllocatedTalentNode, CraftedPrism } from "../../lib/save-data";
import { generateItemId } from "../../lib/storage";

export const TalentsSection = () => {
  // Builder store - loadout data
  const loadout = useBuilderStore((state) => state.loadout);
  const updateLoadout = useBuilderStore((state) => state.updateLoadout);
  const addPrismToInventory = useBuilderStore(
    (state) => state.addPrismToInventory,
  );
  const deletePrism = useBuilderStore((state) => state.deletePrism);

  // Talents UI store
  const treeData = useTalentsUIStore((state) => state.treeData);
  const activeTreeSlot = useTalentsUIStore((state) => state.activeTreeSlot);
  const selectedPrismId = useTalentsUIStore((state) => state.selectedPrismId);
  const setTreeData = useTalentsUIStore((state) => state.setTreeData);
  const setActiveTreeSlot = useTalentsUIStore(
    (state) => state.setActiveTreeSlot,
  );
  const setSelectedPrismId = useTalentsUIStore(
    (state) => state.setSelectedPrismId,
  );

  // Load tree data when trees change
  useEffect(() => {
    const loadTree = async (slot: TreeSlot) => {
      const tree = loadout.talentPage[slot];
      if (!tree) {
        setTreeData(slot, undefined);
        return;
      }
      const treeName = tree.name;
      try {
        const data = await loadTalentTree(treeName as TreeName);
        setTreeData(slot, data);
      } catch (error) {
        console.error(`Failed to load tree ${treeName}:`, error);
      }
    };

    loadTree("tree1");
    loadTree("tree2");
    loadTree("tree3");
    loadTree("tree4");
  }, [
    loadout.talentPage.tree1?.name,
    loadout.talentPage.tree2?.name,
    loadout.talentPage.tree3?.name,
    loadout.talentPage.tree4?.name,
    setTreeData,
  ]);

  const handleTreeChange = useCallback(
    (slot: TreeSlot, newTreeName: string) => {
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
    },
    [loadout.talentPage, updateLoadout],
  );

  const handleResetTree = useCallback(
    (slot: TreeSlot) => {
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
    },
    [loadout.talentPage, updateLoadout],
  );

  const handleAllocate = useCallback(
    (slot: TreeSlot, x: number, y: number) => {
      updateLoadout((prev) => {
        const tree = prev.talentPage[slot];
        if (!tree) return prev;
        const existing = tree.allocatedNodes.find(
          (n) => n.x === x && n.y === y,
        );
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
    },
    [treeData, updateLoadout],
  );

  const handleDeallocate = useCallback(
    (slot: TreeSlot, x: number, y: number) => {
      updateLoadout((prev) => {
        const tree = prev.talentPage[slot];
        if (!tree) return prev;
        const existing = tree.allocatedNodes.find(
          (n) => n.x === x && n.y === y,
        );
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
    },
    [updateLoadout],
  );

  const handleSelectCoreTalent = useCallback(
    (treeSlot: TreeSlot, slotIndex: number, talentName: string | undefined) => {
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
    },
    [updateLoadout],
  );

  const handleSavePrism = useCallback(
    (prism: CraftedPrism) => {
      addPrismToInventory(prism);
    },
    [addPrismToInventory],
  );

  const handleUpdatePrism = useCallback(
    (prism: CraftedPrism) => {
      updateLoadout((prev) => ({
        ...prev,
        prismList: prev.prismList.map((p) => (p.id === prism.id ? prism : p)),
      }));
    },
    [updateLoadout],
  );

  const handleCopyPrism = useCallback(
    (prism: CraftedPrism) => {
      const newPrism = { ...prism, id: generateItemId() };
      addPrismToInventory(newPrism);
    },
    [addPrismToInventory],
  );

  const handleDeletePrism = useCallback(
    (prismId: string) => {
      deletePrism(prismId);
      if (selectedPrismId === prismId) {
        setSelectedPrismId(undefined);
      }
    },
    [deletePrism, selectedPrismId, setSelectedPrismId],
  );

  const handlePlacePrism = useCallback(
    (treeSlot: TreeSlot, x: number, y: number) => {
      if (!selectedPrismId) return;

      const prism = loadout.prismList.find((p) => p.id === selectedPrismId);
      if (!prism) return;

      // Only allow rare prisms
      if (prism.rarity !== "rare") return;

      // Only allow one prism at a time
      if (loadout.talentPage.placedPrism) return;

      // Verify node has 0 points allocated
      const tree = loadout.talentPage[treeSlot];
      if (!tree) return;
      const existingAllocation = tree.allocatedNodes.find(
        (n) => n.x === x && n.y === y,
      );
      if (existingAllocation && existingAllocation.points > 0) return;

      updateLoadout((prev) => ({
        ...prev,
        // Remove prism from inventory
        prismList: prev.prismList.filter((p) => p.id !== selectedPrismId),
        // Place prism in talent page
        talentPage: {
          ...prev.talentPage,
          placedPrism: {
            prism,
            treeSlot,
            position: { x, y },
          },
        },
      }));

      // Clear selection after placing
      setSelectedPrismId(undefined);
    },
    [selectedPrismId, loadout.prismList, loadout.talentPage, updateLoadout, setSelectedPrismId],
  );

  const handleRemovePrism = useCallback(() => {
    const placedPrism = loadout.talentPage.placedPrism;
    if (!placedPrism) return;

    // Validate that prism can be removed
    const tree = loadout.talentPage[placedPrism.treeSlot];
    const prismTreeData = treeData[placedPrism.treeSlot];
    if (!tree || !prismTreeData) return;

    if (!canRemovePrism(placedPrism, tree.allocatedNodes, prismTreeData)) {
      return;
    }

    updateLoadout((prev) => ({
      ...prev,
      // Return prism to inventory
      prismList: [...prev.prismList, placedPrism.prism],
      // Clear placement
      talentPage: {
        ...prev.talentPage,
        placedPrism: undefined,
      },
    }));
  }, [loadout.talentPage, treeData, updateLoadout]);

  const currentTreeData = treeData[activeTreeSlot];
  const currentTree = loadout.talentPage[activeTreeSlot];

  return (
    <>
      <div>
        <div className="mb-6">
          <h2 className="mb-4 text-xl font-semibold text-zinc-50">Tree Slots</h2>
          <div className="grid grid-cols-4 gap-2">
            {(["tree1", "tree2", "tree3", "tree4"] as const).map((slot) => {
              const tree = loadout.talentPage[slot];
              const totalPoints = tree
                ? tree.allocatedNodes.reduce((sum, node) => sum + node.points, 0)
                : 0;

              return (
                <button
                  key={slot}
                  onClick={() => setActiveTreeSlot(slot)}
                  className={`rounded-lg border px-4 py-3 font-medium transition-colors ${
                    activeTreeSlot === slot
                      ? "border-amber-500 bg-amber-500 text-zinc-950"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <div className="font-semibold">
                    {slot === "tree1"
                      ? "Slot 1 (God/Goddess)"
                      : `Slot ${slot.slice(-1)}`}
                  </div>
                  <div className="mt-1 truncate text-sm">
                    {tree ? tree.name.replace(/_/g, " ") : "None"}
                  </div>
                  <div className="mt-1 text-xs">{totalPoints} points</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-zinc-700 bg-zinc-900 p-4">
          <label className="mb-2 block text-sm font-medium text-zinc-400">
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
                (loadout.talentPage[activeTreeSlot]?.allocatedNodes.length ??
                  0) > 0
              }
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                (loadout.talentPage[activeTreeSlot]?.allocatedNodes.length ??
                  0) === 0
              }
              className="rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
            >
              Reset
            </button>
          </div>
        </div>

        {currentTree && (
          <CoreTalentSelector
            treeName={currentTree.name}
            treeSlot={activeTreeSlot}
            pointsSpent={currentTree.allocatedNodes.reduce(
              (sum, node) => sum + node.points,
              0,
            )}
            selectedCoreTalents={currentTree.selectedCoreTalents ?? []}
            onSelectCoreTalent={(slotIndex, name) =>
              handleSelectCoreTalent(activeTreeSlot, slotIndex, name)
            }
          />
        )}

        {!currentTree ? (
          <div className="py-12 text-center text-zinc-500">
            Select a tree to view
          </div>
        ) : currentTreeData ? (
          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-6">
            <h2 className="mb-4 text-xl font-semibold text-zinc-50">
              {currentTreeData.name.replace(/_/g, " ")} Tree
            </h2>

            <div className="mb-2 grid grid-cols-7 gap-2">
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
              treeData={currentTreeData}
              allocatedNodes={currentTree.allocatedNodes}
              onAllocate={(x, y) => handleAllocate(activeTreeSlot, x, y)}
              onDeallocate={(x, y) => handleDeallocate(activeTreeSlot, x, y)}
              treeSlot={activeTreeSlot}
              placedPrism={loadout.talentPage.placedPrism}
              selectedPrism={loadout.prismList.find(
                (p) => p.id === selectedPrismId,
              )}
              onPlacePrism={(x, y) => handlePlacePrism(activeTreeSlot, x, y)}
              onRemovePrism={handleRemovePrism}
            />
          </div>
        ) : (
          <div className="py-12 text-center text-zinc-500">Loading tree...</div>
        )}
      </div>

      <PrismSection
        prisms={loadout.prismList}
        onSave={handleSavePrism}
        onUpdate={handleUpdatePrism}
        onCopy={handleCopyPrism}
        onDelete={handleDeletePrism}
        selectedPrismId={selectedPrismId}
        onSelectPrism={setSelectedPrismId}
        hasPrismPlaced={!!loadout.talentPage.placedPrism}
      />
    </>
  );
};
