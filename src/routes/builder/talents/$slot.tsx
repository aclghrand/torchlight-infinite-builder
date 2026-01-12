import { Trans } from "@lingui/react/macro";
import {
  createFileRoute,
  Link,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { useCallback } from "react";
import { Prisms } from "@/src/data/prism/prisms";
import { i18n } from "@/src/lib/i18n";
import type { CraftedInverseImage, CraftedPrism } from "@/src/tli/core";
import {
  canPlaceInverseImage,
  canRemoveInverseImage,
  canRemovePrism,
  GOD_GODDESS_TREES,
  isGodGoddessTree,
  PROFESSION_TREES,
} from "@/src/tli/talent-tree";
import { CoreTalentSelector } from "../../../components/talents/CoreTalentSelector";
import { InverseImageSection } from "../../../components/talents/InverseImageSection";
import { PrismCoreTalentEffect } from "../../../components/talents/PrismCoreTalentEffect";
import { PrismSection } from "../../../components/talents/PrismSection";
import { TalentGrid } from "../../../components/talents/TalentGrid";
import {
  paramToTreeSlot,
  TALENT_SLOT_PARAMS,
  type TalentSlotParam,
  type TreeSlot,
  treeSlotToParam,
} from "../../../lib/types";
import {
  useBuilderActions,
  useConfiguration,
  useLoadout,
  useTalentTree,
} from "../../../stores/builderStore";
import { useTalentsUIStore } from "../../../stores/talentsUIStore";

export const Route = createFileRoute("/builder/talents/$slot")({
  component: TalentsSlotPage,
  beforeLoad: ({ params, search }) => {
    if (
      !TALENT_SLOT_PARAMS.includes(
        params.slot as (typeof TALENT_SLOT_PARAMS)[number],
      )
    ) {
      throw redirect({
        to: "/builder/talents/$slot",
        params: { slot: "slot_1" },
        search,
      });
    }
  },
});

function TalentsSlotPage(): React.ReactNode {
  const { slot } = Route.useParams();
  const activeTreeSlot = paramToTreeSlot(slot as TalentSlotParam);

  // Router state for search params
  const routerState = useRouterState();
  const currentSearch = routerState.location.search as { id?: string };

  // Builder store - actions and loadout
  const loadout = useLoadout();
  const {
    setTreeOrClear,
    resetTree,
    allocateNode,
    deallocateNode,
    selectCoreTalent,
    addPrismToInventory,
    updatePrism,
    copyPrism,
    deletePrism,
    placePrism,
    returnPrismToInventory,
    addInverseImageToInventory,
    updateInverseImage,
    copyInverseImage,
    deleteInverseImage,
    placeInverseImage,
    removePlacedInverseImage,
    allocateReflectedNode,
    deallocateReflectedNode,
  } = useBuilderActions();

  // Talents UI store
  const selectedPrismId = useTalentsUIStore((state) => state.selectedPrismId);
  const setSelectedPrismId = useTalentsUIStore(
    (state) => state.setSelectedPrismId,
  );
  const selectedInverseImageId = useTalentsUIStore(
    (state) => state.selectedInverseImageId,
  );
  const setSelectedInverseImageId = useTalentsUIStore(
    (state) => state.setSelectedInverseImageId,
  );

  // Get the current talent tree from loadout
  const currentTalentTree = useTalentTree(activeTreeSlot);

  // Get configuration for total available points
  const configuration = useConfiguration();

  // Derived values from loadout
  const placedPrism = loadout.talentPage.talentTrees.placedPrism;
  const placedInverseImage = loadout.talentPage.talentTrees.placedInverseImage;
  const prismList = loadout.talentPage.inventory.prismList;
  const inverseImageList = loadout.talentPage.inventory.inverseImageList;

  const handleTreeChange = useCallback(
    (treeSlot: TreeSlot, newTreeName: string) => {
      const tree = loadout.talentPage.talentTrees[treeSlot];
      if (tree?.nodes.some((n) => n.points > 0)) return;

      if (newTreeName === "") {
        setTreeOrClear(treeSlot, "");
        return;
      }

      if (treeSlot !== "tree1" && isGodGoddessTree(newTreeName)) return;
      if (treeSlot === "tree1" && !isGodGoddessTree(newTreeName)) return;

      setTreeOrClear(treeSlot, newTreeName);
    },
    [loadout.talentPage.talentTrees, setTreeOrClear],
  );

  const handleResetTree = useCallback(
    (treeSlot: TreeSlot) => {
      const tree = loadout.talentPage.talentTrees[treeSlot];
      if (!tree || !tree.nodes.some((n) => n.points > 0)) return;
      if (confirm("Reset all points in this tree? This cannot be undone.")) {
        resetTree(treeSlot);
      }
    },
    [loadout.talentPage.talentTrees, resetTree],
  );

  const handleAllocate = useCallback(
    (treeSlot: TreeSlot, x: number, y: number) => {
      // Find node max points from the current talent tree
      const nodeData = currentTalentTree?.nodes.find(
        (n) => n.x === x && n.y === y && !n.isReflected,
      );
      if (!nodeData) return;
      allocateNode(treeSlot, x, y, nodeData.maxPoints);
    },
    [currentTalentTree, allocateNode],
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

      // Only allow prisms on profession trees (slots 2-4), not god/goddess tree (slot 1)
      if (treeSlot === "tree1") return;

      const prism = prismList.find((p) => p.id === selectedPrismId);
      if (!prism) return;

      // Only allow one prism at a time
      if (placedPrism) return;

      // Cannot place prism in same tree as inverse image
      if (placedInverseImage && placedInverseImage.treeSlot === treeSlot)
        return;

      // Verify node has 0 points allocated
      const tree = loadout.talentPage.talentTrees[treeSlot];
      if (!tree) return;
      const node = tree.nodes.find((n) => n.x === x && n.y === y);
      if (node && node.points > 0) return;

      // Check if this prism replaces core talents
      const prismData = Prisms.find((p) => p.affix === prism.baseAffix);
      const replacesCoreTalent = prismData?.replacementCoreTalent !== undefined;

      // Place the prism (action removes from inventory and places)
      placePrism(prism, treeSlot, { x, y });

      // If prism replaces core talents, clear them
      if (replacesCoreTalent) {
        // Reset tree with same name but clear core talents
        const treeName = tree.name;
        setTreeOrClear(treeSlot, treeName, true);
      }

      // Clear selection after placing
      setSelectedPrismId(undefined);
    },
    [
      selectedPrismId,
      prismList,
      placedPrism,
      placedInverseImage,
      loadout.talentPage.talentTrees,
      placePrism,
      setTreeOrClear,
      setSelectedPrismId,
    ],
  );

  const handleRemovePrism = useCallback(() => {
    if (!placedPrism || !currentTalentTree) return;

    if (!canRemovePrism(placedPrism, currentTalentTree.nodes)) {
      return;
    }

    returnPrismToInventory();
  }, [placedPrism, currentTalentTree, returnPrismToInventory]);

  const handleDeleteInverseImage = useCallback(
    (inverseImageId: string) => {
      deleteInverseImage(inverseImageId);
      if (selectedInverseImageId === inverseImageId) {
        setSelectedInverseImageId(undefined);
      }
    },
    [deleteInverseImage, selectedInverseImageId, setSelectedInverseImageId],
  );

  const handlePlaceInverseImage = useCallback(
    (treeSlot: TreeSlot, x: number, y: number) => {
      if (!selectedInverseImageId || !currentTalentTree) return;

      // Only allow inverse images on profession trees (slots 2-4)
      if (treeSlot === "tree1") return;

      const inverseImage = inverseImageList.find(
        (ii) => ii.id === selectedInverseImageId,
      );
      if (!inverseImage) return;

      const result = canPlaceInverseImage(
        x,
        treeSlot as "tree2" | "tree3" | "tree4",
        currentTalentTree.nodes,
        placedPrism,
        placedInverseImage,
      );

      if (!result.canPlace) {
        return;
      }

      placeInverseImage(inverseImage, treeSlot as "tree2" | "tree3" | "tree4", {
        x,
        y,
      });

      setSelectedInverseImageId(undefined);
    },
    [
      selectedInverseImageId,
      currentTalentTree,
      inverseImageList,
      placedPrism,
      placedInverseImage,
      placeInverseImage,
      setSelectedInverseImageId,
    ],
  );

  const handleRemoveInverseImage = useCallback(() => {
    if (!currentTalentTree || !placedInverseImage) return;

    if (!canRemoveInverseImage(currentTalentTree.nodes)) {
      return;
    }

    removePlacedInverseImage();
  }, [currentTalentTree, placedInverseImage, removePlacedInverseImage]);

  const currentTreeTotalPoints = currentTalentTree
    ? currentTalentTree.nodes.reduce((sum, node) => sum + node.points, 0)
    : 0;

  // Calculate total points used across all trees
  const totalPointsUsed = (
    ["tree1", "tree2", "tree3", "tree4"] as const
  ).reduce((sum, treeSlot) => {
    const tree = loadout.talentPage.talentTrees[treeSlot];
    return sum + (tree ? tree.nodes.reduce((s, n) => s + n.points, 0) : 0);
  }, 0);
  const totalPointsAvailable = configuration.level + 13;
  const isOverAllocated = totalPointsUsed > totalPointsAvailable;

  return (
    <>
      <div>
        <div className="mb-6">
          <h2 className="mb-4 text-xl font-semibold text-zinc-50">
            <Trans>Tree Slots</Trans>
            <span className={isOverAllocated ? "text-red-500" : ""}>
              ({totalPointsUsed}/{totalPointsAvailable})
            </span>
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {(["tree1", "tree2", "tree3", "tree4"] as const).map((treeSlot) => {
              const tree = loadout.talentPage.talentTrees[treeSlot];
              const totalPoints = tree
                ? tree.nodes.reduce((sum, node) => sum + node.points, 0)
                : 0;

              return (
                <Link
                  key={treeSlot}
                  to="/builder/talents/$slot"
                  params={{ slot: treeSlotToParam(treeSlot) }}
                  search={{ id: currentSearch.id }}
                  className={`rounded-lg border px-4 py-3 font-medium transition-colors ${
                    activeTreeSlot === treeSlot
                      ? "border-amber-500 bg-amber-500 text-zinc-950"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <div className="font-semibold">
                    {treeSlot === "tree1"
                      ? i18n._("Slot 1 (God/Goddess)")
                      : `Slot ${treeSlot.slice(-1)}`}
                  </div>
                  <div className="mt-1 truncate text-sm">
                    {tree ? i18n._(tree.name.replace(/_/g, " ")) : "None"}
                  </div>
                  <div className="mt-1 text-xs">{totalPoints} points</div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-zinc-700 bg-zinc-900 p-4">
          <label
            htmlFor="tree-select"
            className="mb-2 block text-sm font-medium text-zinc-400"
          >
            <Trans>
              Select Tree for{" "}
              {activeTreeSlot === "tree1"
                ? i18n._("Slot 1")
                : i18n._("Slot") + " " + activeTreeSlot.slice(-1)}
            </Trans>
          </label>
          <div className="flex gap-2">
            <select
              id="tree-select"
              value={currentTalentTree?.name ?? ""}
              onChange={(e) => handleTreeChange(activeTreeSlot, e.target.value)}
              disabled={
                currentTalentTree?.nodes.some((n) => n.points > 0) ?? false
              }
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">None</option>
              {activeTreeSlot === "tree1" ? (
                <optgroup label="God/Goddess Trees">
                  {GOD_GODDESS_TREES.map((tree) => (
                    <option key={tree} value={tree}>
                      {i18n._(tree.replace(/_/g, " "))}
                    </option>
                  ))}
                </optgroup>
              ) : (
                <optgroup label="Profession Trees">
                  {PROFESSION_TREES.map((tree) => (
                    <option key={tree} value={tree}>
                      {i18n._(tree.replace(/_/g, " "))}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            <button
              type="button"
              onClick={() => handleResetTree(activeTreeSlot)}
              disabled={currentTreeTotalPoints === 0}
              className="rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
            >
              Reset
            </button>
          </div>
        </div>

        {currentTalentTree && (
          <CoreTalentSelector
            treeName={currentTalentTree.name}
            treeSlot={activeTreeSlot}
            selectedCoreTalents={
              currentTalentTree.selectedCoreTalentNames ?? []
            }
            onSelectCoreTalent={(slotIndex, name) =>
              selectCoreTalent(activeTreeSlot, slotIndex, name)
            }
            replacedByPrism={currentTalentTree.replacementPrismCoreTalent}
          />
        )}

        <PrismCoreTalentEffect
          placedPrism={placedPrism}
          activeTreeSlot={activeTreeSlot}
        />

        {!currentTalentTree ? (
          <div className="py-12 text-center text-zinc-500">
            Select a tree to view
          </div>
        ) : currentTalentTree ? (
          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-6">
            <h2 className="mb-4 text-xl font-semibold text-zinc-50">
              {i18n._(currentTalentTree.name.replace(/_/g, " "))} Tree
            </h2>

            <div className="mb-2 grid grid-cols-7 gap-2">
              {[0, 3, 6, 9, 12, 15, 18].map((points) => (
                <div
                  key={points}
                  className="text-center text-sm font-medium text-zinc-500"
                >
                  {points} pts
                </div>
              ))}
            </div>

            <TalentGrid
              nodes={currentTalentTree.nodes}
              onAllocate={(x, y) => handleAllocate(activeTreeSlot, x, y)}
              onDeallocate={(x, y) => deallocateNode(activeTreeSlot, x, y)}
              treeSlot={activeTreeSlot}
              placedPrism={placedPrism}
              selectedPrism={
                // Prisms can only be placed on profession trees (slots 2-4)
                activeTreeSlot !== "tree1"
                  ? prismList.find((p) => p.id === selectedPrismId)
                  : undefined
              }
              onPlacePrism={(x, y) => handlePlacePrism(activeTreeSlot, x, y)}
              onRemovePrism={handleRemovePrism}
              placedInverseImage={placedInverseImage}
              selectedInverseImage={
                // Inverse images can only be placed on profession trees (slots 2-4)
                activeTreeSlot !== "tree1"
                  ? inverseImageList.find(
                      (ii) => ii.id === selectedInverseImageId,
                    )
                  : undefined
              }
              onPlaceInverseImage={(x, y) =>
                handlePlaceInverseImage(activeTreeSlot, x, y)
              }
              onRemoveInverseImage={handleRemoveInverseImage}
              onAllocateReflected={allocateReflectedNode}
              onDeallocateReflected={deallocateReflectedNode}
            />
          </div>
        ) : (
          <div className="py-12 text-center text-zinc-500">Loading tree...</div>
        )}
      </div>

      <PrismSection
        prisms={prismList}
        onSave={(prism: CraftedPrism) => addPrismToInventory(prism)}
        onUpdate={updatePrism}
        onCopy={(prism: CraftedPrism) => copyPrism(prism.id)}
        onDelete={handleDeletePrism}
        selectedPrismId={selectedPrismId}
        onSelectPrism={setSelectedPrismId}
        hasPrismPlaced={!!placedPrism}
        isOnGodGoddessTree={activeTreeSlot === "tree1"}
      />

      <InverseImageSection
        inverseImages={inverseImageList}
        onSave={(inverseImage: CraftedInverseImage) =>
          addInverseImageToInventory(inverseImage)
        }
        onUpdate={updateInverseImage}
        onCopy={(inverseImage: CraftedInverseImage) =>
          copyInverseImage(inverseImage.id)
        }
        onDelete={handleDeleteInverseImage}
        selectedInverseImageId={selectedInverseImageId}
        onSelectInverseImage={setSelectedInverseImageId}
        hasInverseImagePlaced={!!placedInverseImage}
        hasPrismPlaced={!!placedPrism}
        isOnGodGoddessTree={activeTreeSlot === "tree1"}
        treeHasPoints={currentTreeTotalPoints > 0}
      />
    </>
  );
}
