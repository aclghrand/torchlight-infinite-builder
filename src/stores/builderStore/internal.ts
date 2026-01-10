"use client";

import { create } from "zustand";
import { combine } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { getBaseTraitForHero } from "../../lib/hero-utils";
import type {
  AllocatedTalentNode,
  BaseSupportSkillSlot,
  ConfigurationPage,
  CraftedInverseImage,
  CraftedPrism,
  DivinitySlate,
  Gear,
  HeroMemory,
  HeroMemorySlot,
  PactspiritSlot,
  ReflectedAllocatedNode,
  RingSlotState,
  SaveData,
  SupportSkillSlot,
} from "../../lib/save-data";
import type { SavesIndex } from "../../lib/saves";
import {
  loadSaveData,
  loadSavesIndex,
  saveSaveData,
  saveSavesIndex,
} from "../../lib/saves";
import {
  createEmptyConfigurationPage,
  createEmptyHeroPage,
  createEmptyPactspiritSlot,
  createEmptySaveData,
  generateItemId,
} from "../../lib/storage";
import type {
  GearSlot,
  InstalledDestinyResult,
  PactspiritSlotIndex,
  RingSlotKey,
  TreeSlot,
} from "../../lib/types";
import {
  type DivinitySlate as CoreDivinitySlate,
  getAffixText,
} from "../../tli/core";

export interface InternalBuilderState {
  saveData: SaveData;
  currentSaveId: string | undefined;
  currentSaveName: string | undefined;
  savesIndex: SavesIndex;
}

const initialState: InternalBuilderState = {
  saveData: createEmptySaveData(),
  currentSaveId: undefined,
  currentSaveName: undefined,
  savesIndex: { currentSaveId: undefined, saves: [] },
};

// Convert core DivinitySlate to save-data format
const toSaveDataSlate = (slate: CoreDivinitySlate): DivinitySlate => ({
  id: slate.id,
  god: slate.god,
  shape: slate.shape,
  rotation: slate.rotation,
  flippedH: slate.flippedH,
  flippedV: slate.flippedV,
  affixes: slate.affixes.map(getAffixText),
  metaAffixes: slate.metaAffixes,
  isLegendary: slate.isLegendary,
  legendaryName: slate.legendaryName,
});

export const internalStore = create(
  immer(
    combine(initialState, (set, get) => ({
      // Core actions
      setSaveData: (saveData: SaveData) => {
        set((state) => {
          state.saveData = saveData;
        });
      },

      loadFromSave: (saveId: string) => {
        const index = loadSavesIndex();
        const saveMeta = index.saves.find((s) => s.id === saveId);
        if (!saveMeta) return false;

        const data = loadSaveData(saveId);
        if (!data) return false;

        const updatedIndex = { ...index, currentSaveId: saveId };
        saveSavesIndex(updatedIndex);

        set((state) => {
          state.saveData = data;
          state.currentSaveId = saveId;
          state.currentSaveName = saveMeta.name;
          state.savesIndex = updatedIndex;
        });
        return true;
      },

      save: () => {
        const { currentSaveId, saveData, savesIndex } = get();
        if (!currentSaveId) return false;

        const success = saveSaveData(currentSaveId, saveData);
        if (success) {
          const now = Date.now();
          const saveIndex = savesIndex.saves.findIndex(
            (s) => s.id === currentSaveId,
          );
          set((state) => {
            if (saveIndex >= 0) {
              state.savesIndex.saves[saveIndex].updatedAt = now;
            }
          });
          saveSavesIndex(get().savesIndex);
        }
        return success;
      },

      renameCurrentSave: (newName: string): boolean => {
        const { currentSaveId, savesIndex } = get();
        if (currentSaveId === undefined) return false;

        const updatedSaves = savesIndex.saves.map((s) =>
          s.id === currentSaveId ? { ...s, name: newName } : s,
        );
        const updatedIndex = { ...savesIndex, saves: updatedSaves };
        saveSavesIndex(updatedIndex);

        set((state) => {
          state.currentSaveName = newName;
          state.savesIndex = updatedIndex;
        });
        return true;
      },

      // Equipment actions
      addItemToInventory: (item: Gear) => {
        set((state) => {
          state.saveData.equipmentPage.inventory.push(item);
        });
      },

      copyItem: (itemId: string) => {
        const item = get().saveData.equipmentPage.inventory.find(
          (i) => i.id === itemId,
        );
        if (!item) return;
        const newItem: Gear = { ...item, id: generateItemId() };
        set((state) => {
          state.saveData.equipmentPage.inventory.push(newItem);
        });
      },

      deleteItem: (itemId: string) => {
        set((state) => {
          state.saveData.equipmentPage.inventory =
            state.saveData.equipmentPage.inventory.filter(
              (item) => item.id !== itemId,
            );
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
          for (const slot of slots) {
            if (
              state.saveData.equipmentPage.equippedGear[slot]?.id === itemId
            ) {
              delete state.saveData.equipmentPage.equippedGear[slot];
            }
          }
        });
      },

      updateItem: (itemId: string, updatedItem: Gear) => {
        set((state) => {
          const itemIndex = state.saveData.equipmentPage.inventory.findIndex(
            (i) => i.id === itemId,
          );
          if (itemIndex === -1) return;

          state.saveData.equipmentPage.inventory[itemIndex] = updatedItem;

          // Also update equipped slots if this item is equipped
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
          for (const slot of slots) {
            if (
              state.saveData.equipmentPage.equippedGear[slot]?.id === itemId
            ) {
              state.saveData.equipmentPage.equippedGear[slot] = updatedItem;
            }
          }
        });
      },

      selectItemForSlot: (slot: GearSlot, itemId: string | undefined) => {
        set((state) => {
          if (!itemId) {
            delete state.saveData.equipmentPage.equippedGear[slot];
            return;
          }
          const item = state.saveData.equipmentPage.inventory.find(
            (i) => i.id === itemId,
          );
          if (!item) return;
          state.saveData.equipmentPage.equippedGear[slot] = item;
        });
      },

      isItemEquipped: (itemId: string) => {
        const { saveData } = get();
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
        return slots.some(
          (slot) => saveData.equipmentPage.equippedGear[slot]?.id === itemId,
        );
      },

      // Talent actions
      setTreeName: (slot: TreeSlot, treeName: string) => {
        set((state) => {
          state.saveData.talentPage.talentTrees[slot] = {
            name: treeName,
            allocatedNodes: [],
            selectedCoreTalents: [],
          };
        });
      },

      clearTree: (slot: TreeSlot) => {
        set((state) => {
          delete state.saveData.talentPage.talentTrees[slot];
        });
      },

      setAllocatedNodes: (slot: TreeSlot, nodes: AllocatedTalentNode[]) => {
        set((state) => {
          const tree = state.saveData.talentPage.talentTrees[slot];
          if (!tree) return;
          tree.allocatedNodes = nodes;
        });
      },

      setCoreTalents: (slot: TreeSlot, talents: string[]) => {
        set((state) => {
          const tree = state.saveData.talentPage.talentTrees[slot];
          if (!tree) return;
          tree.selectedCoreTalents = talents;
        });
      },

      addPrismToInventory: (prism: CraftedPrism) => {
        set((state) => {
          state.saveData.talentPage.inventory.prismList.push(prism);
        });
      },

      deletePrism: (prismId: string) => {
        set((state) => {
          state.saveData.talentPage.inventory.prismList =
            state.saveData.talentPage.inventory.prismList.filter(
              (p) => p.id !== prismId,
            );
          if (
            state.saveData.talentPage.talentTrees.placedPrism?.prism.id ===
            prismId
          ) {
            delete state.saveData.talentPage.talentTrees.placedPrism;
          }
        });
      },

      placePrism: (
        prism: CraftedPrism,
        treeSlot: TreeSlot,
        position: { x: number; y: number },
      ) => {
        set((state) => {
          state.saveData.talentPage.talentTrees.placedPrism = {
            prism,
            treeSlot,
            position,
          };
        });
      },

      removePlacedPrism: () => {
        set((state) => {
          delete state.saveData.talentPage.talentTrees.placedPrism;
        });
      },

      addInverseImageToInventory: (inverseImage: CraftedInverseImage) => {
        set((state) => {
          state.saveData.talentPage.inventory.inverseImageList.push(
            inverseImage,
          );
        });
      },

      deleteInverseImage: (inverseImageId: string) => {
        set((state) => {
          state.saveData.talentPage.inventory.inverseImageList =
            state.saveData.talentPage.inventory.inverseImageList.filter(
              (ii) => ii.id !== inverseImageId,
            );
          if (
            state.saveData.talentPage.talentTrees.placedInverseImage
              ?.inverseImage.id === inverseImageId
          ) {
            delete state.saveData.talentPage.talentTrees.placedInverseImage;
          }
        });
      },

      placeInverseImage: (
        inverseImage: CraftedInverseImage,
        treeSlot: "tree2" | "tree3" | "tree4",
        position: { x: number; y: number },
      ) => {
        set((state) => {
          state.saveData.talentPage.inventory.inverseImageList =
            state.saveData.talentPage.inventory.inverseImageList.filter(
              (ii) => ii.id !== inverseImage.id,
            );
          state.saveData.talentPage.talentTrees.placedInverseImage = {
            inverseImage,
            treeSlot,
            position,
            reflectedAllocatedNodes: [],
          };
        });
      },

      removePlacedInverseImage: () => {
        set((state) => {
          const placedInverseImage =
            state.saveData.talentPage.talentTrees.placedInverseImage;
          if (!placedInverseImage) return;
          // Only add back to inventory if not already there (avoid duplicates)
          const alreadyInInventory =
            state.saveData.talentPage.inventory.inverseImageList.some(
              (ii) => ii.id === placedInverseImage.inverseImage.id,
            );
          if (!alreadyInInventory) {
            state.saveData.talentPage.inventory.inverseImageList.push(
              placedInverseImage.inverseImage,
            );
          }
          delete state.saveData.talentPage.talentTrees.placedInverseImage;
        });
      },

      allocateReflectedNode: (
        x: number,
        y: number,
        sourceX: number,
        sourceY: number,
      ) => {
        set((state) => {
          const placedInverseImage =
            state.saveData.talentPage.talentTrees.placedInverseImage;
          if (!placedInverseImage) return;

          const existingNode = placedInverseImage.reflectedAllocatedNodes.find(
            (n) => n.x === x && n.y === y,
          );

          if (existingNode) {
            existingNode.points += 1;
          } else {
            placedInverseImage.reflectedAllocatedNodes.push({
              x,
              y,
              sourceX,
              sourceY,
              points: 1,
            });
          }
        });
      },

      deallocateReflectedNode: (x: number, y: number) => {
        set((state) => {
          const placedInverseImage =
            state.saveData.talentPage.talentTrees.placedInverseImage;
          if (!placedInverseImage) return;

          const existing = placedInverseImage.reflectedAllocatedNodes.find(
            (n) => n.x === x && n.y === y,
          );
          if (!existing) return;

          if (existing.points > 1) {
            existing.points -= 1;
          } else {
            placedInverseImage.reflectedAllocatedNodes =
              placedInverseImage.reflectedAllocatedNodes.filter(
                (n) => !(n.x === x && n.y === y),
              );
          }
        });
      },

      setReflectedAllocatedNodes: (nodes: ReflectedAllocatedNode[]) => {
        set((state) => {
          const placedInverseImage =
            state.saveData.talentPage.talentTrees.placedInverseImage;
          if (!placedInverseImage) return;
          placedInverseImage.reflectedAllocatedNodes = nodes;
        });
      },

      // Hero actions
      setHero: (hero: string | undefined) => {
        set((state) => {
          state.saveData.heroPage.selectedHero = hero;
        });
      },

      setTrait: (
        level:
          | "level1"
          | "level45"
          | "level45b"
          | "level60"
          | "level60b"
          | "level75"
          | "level75b",
        traitName: string | undefined,
      ) => {
        set((state) => {
          state.saveData.heroPage.traits[level] = traitName
            ? { name: traitName }
            : undefined;
        });
      },

      addHeroMemory: (memory: HeroMemory) => {
        set((state) => {
          state.saveData.heroPage.memoryInventory.push(memory);
        });
      },

      deleteHeroMemory: (memoryId: string) => {
        set((state) => {
          state.saveData.heroPage.memoryInventory =
            state.saveData.heroPage.memoryInventory.filter(
              (m) => m.id !== memoryId,
            );
          (["slot45", "slot60", "slot75"] as HeroMemorySlot[]).forEach(
            (slot) => {
              if (state.saveData.heroPage.memorySlots[slot]?.id === memoryId) {
                state.saveData.heroPage.memorySlots[slot] = undefined;
              }
            },
          );
        });
      },

      equipHeroMemory: (
        slot: HeroMemorySlot,
        memory: HeroMemory | undefined,
      ) => {
        set((state) => {
          state.saveData.heroPage.memorySlots[slot] = memory;
        });
      },

      copyHeroMemory: (memoryId: string) => {
        const memory = get().saveData.heroPage.memoryInventory.find(
          (m) => m.id === memoryId,
        );
        if (!memory) return;
        const newMemory = { ...memory, id: generateItemId() };
        set((state) => {
          state.saveData.heroPage.memoryInventory.push(newMemory);
        });
      },

      // Pactspirit actions
      setPactspirit: (
        slotIndex: PactspiritSlotIndex,
        name: string | undefined,
      ) => {
        set((state) => {
          const slotKey =
            `slot${slotIndex}` as keyof typeof state.saveData.pactspiritPage;
          state.saveData.pactspiritPage[slotKey].pactspiritName = name;
        });
      },

      setPactspiritLevel: (slotIndex: PactspiritSlotIndex, level: number) => {
        set((state) => {
          const slotKey =
            `slot${slotIndex}` as keyof typeof state.saveData.pactspiritPage;
          state.saveData.pactspiritPage[slotKey].level = level;
        });
      },

      setRingDestiny: (
        slotIndex: PactspiritSlotIndex,
        ringSlot: RingSlotKey,
        destiny: RingSlotState["installedDestiny"],
      ) => {
        set((state) => {
          const slotKey =
            `slot${slotIndex}` as keyof typeof state.saveData.pactspiritPage;
          state.saveData.pactspiritPage[slotKey].rings[ringSlot] = {
            installedDestiny: destiny,
          };
        });
      },

      updatePactspiritSlot: (
        slotIndex: PactspiritSlotIndex,
        slot: PactspiritSlot,
      ) => {
        set((state) => {
          const slotKey =
            `slot${slotIndex}` as keyof typeof state.saveData.pactspiritPage;
          state.saveData.pactspiritPage[slotKey] = slot;
        });
      },

      // Divinity actions
      addSlateToInventory: (slate: CoreDivinitySlate) => {
        const saveDataSlate = toSaveDataSlate(slate);
        set((state) => {
          state.saveData.divinityPage.inventory.push(saveDataSlate);
        });
      },

      deleteSlate: (slateId: string) => {
        set((state) => {
          state.saveData.divinityPage.inventory =
            state.saveData.divinityPage.inventory.filter(
              (s) => s.id !== slateId,
            );
          state.saveData.divinityPage.placedSlates =
            state.saveData.divinityPage.placedSlates.filter(
              (p) => p.slateId !== slateId,
            );
        });
      },

      placeSlate: (slateId: string, position: { row: number; col: number }) => {
        set((state) => {
          const existing = state.saveData.divinityPage.placedSlates.find(
            (p) => p.slateId === slateId,
          );
          if (existing) {
            existing.position = position;
          } else {
            state.saveData.divinityPage.placedSlates.push({
              slateId,
              position,
            });
          }
        });
      },

      removeSlate: (slateId: string) => {
        set((state) => {
          state.saveData.divinityPage.placedSlates =
            state.saveData.divinityPage.placedSlates.filter(
              (p) => p.slateId !== slateId,
            );
        });
      },

      updateSlate: (slateId: string, updates: Partial<DivinitySlate>) => {
        set((state) => {
          const slate = state.saveData.divinityPage.inventory.find(
            (s) => s.id === slateId,
          );
          if (slate) {
            Object.assign(slate, updates);
          }
        });
      },

      // Skills actions
      setActiveSkill: (
        slot: 1 | 2 | 3 | 4 | 5,
        skillName: string | undefined,
      ) => {
        set((state) => {
          const existing = state.saveData.skillPage.activeSkills[slot];
          if (skillName === undefined) {
            // Clear skill name but keep slot structure
            if (existing !== undefined) {
              existing.skillName = undefined;
            }
          } else if (existing !== undefined) {
            // Update skill name, preserve supportSkills
            existing.skillName = skillName;
          } else {
            // Create new slot
            state.saveData.skillPage.activeSkills[slot] = {
              skillName,
              enabled: true,
              supportSkills: {},
            };
          }
        });
      },

      setPassiveSkill: (slot: 1 | 2 | 3 | 4, skillName: string | undefined) => {
        set((state) => {
          const existing = state.saveData.skillPage.passiveSkills[slot];
          if (skillName === undefined) {
            // Clear skill name but keep slot structure
            if (existing !== undefined) {
              existing.skillName = undefined;
            }
          } else if (existing !== undefined) {
            // Update skill name, preserve supportSkills
            existing.skillName = skillName;
          } else {
            // Create new slot
            state.saveData.skillPage.passiveSkills[slot] = {
              skillName,
              enabled: true,
              supportSkills: {},
            };
          }
        });
      },

      setSupportSkill: (
        skillType: "active" | "passive",
        skillSlot: 1 | 2 | 3 | 4 | 5,
        supportSlot: 1 | 2 | 3 | 4 | 5,
        supportSkill: BaseSupportSkillSlot | undefined,
      ) => {
        set((state) => {
          const skillSlots =
            skillType === "active"
              ? state.saveData.skillPage.activeSkills
              : (state.saveData.skillPage
                  .passiveSkills as typeof state.saveData.skillPage.activeSkills);
          const skill = skillSlots[skillSlot];
          if (skill === undefined) return;
          skill.supportSkills[supportSlot] = supportSkill;
        });
      },

      toggleSkillEnabled: (
        skillType: "active" | "passive",
        slot: 1 | 2 | 3 | 4 | 5,
      ) => {
        set((state) => {
          const skillSlots =
            skillType === "active"
              ? state.saveData.skillPage.activeSkills
              : (state.saveData.skillPage
                  .passiveSkills as typeof state.saveData.skillPage.activeSkills);
          const skill = skillSlots[slot];
          if (skill === undefined) return;
          skill.enabled = !skill.enabled;
        });
      },

      setSkillLevel: (
        skillType: "active" | "passive",
        slot: 1 | 2 | 3 | 4 | 5,
        level: number,
      ) => {
        set((state) => {
          const skillSlots =
            skillType === "active"
              ? state.saveData.skillPage.activeSkills
              : (state.saveData.skillPage
                  .passiveSkills as typeof state.saveData.skillPage.activeSkills);
          const skill = skillSlots[slot];
          if (skill === undefined) return;
          skill.level = level;
        });
      },

      setSupportSkillLevel: (
        skillType: "active" | "passive",
        skillSlot: 1 | 2 | 3 | 4 | 5,
        supportSlot: 1 | 2 | 3 | 4 | 5,
        level: number,
      ) => {
        set((state) => {
          const skillSlots =
            skillType === "active"
              ? state.saveData.skillPage.activeSkills
              : (state.saveData.skillPage
                  .passiveSkills as typeof state.saveData.skillPage.activeSkills);
          const skill = skillSlots[skillSlot];
          if (skill === undefined) return;
          const support = skill.supportSkills[supportSlot];
          // Only regular support skills have level property (not magnificent with tier/rank/value)
          if (support === undefined || "tier" in support) return;
          (support as SupportSkillSlot).level = level;
        });
      },

      // Divinity actions (additional)
      copySlate: (slateId: string) => {
        const slate = get().saveData.divinityPage.inventory.find(
          (s) => s.id === slateId,
        );
        if (!slate) return;
        const newSlate = { ...slate, id: generateItemId() };
        set((state) => {
          state.saveData.divinityPage.inventory.push(newSlate);
        });
      },

      // Hero actions (additional)
      resetHeroPage: (hero?: string) => {
        set((state) => {
          if (hero === undefined) {
            state.saveData.heroPage = {
              ...createEmptyHeroPage(),
              memoryInventory: state.saveData.heroPage.memoryInventory,
            };
          } else {
            const baseTrait = getBaseTraitForHero(hero);
            state.saveData.heroPage = {
              selectedHero: hero,
              traits: {
                level1: baseTrait ? { name: baseTrait.name } : undefined,
                level45: undefined,
                level45b: undefined,
                level60: undefined,
                level60b: undefined,
                level75: undefined,
                level75b: undefined,
              },
              memorySlots: {
                slot45: undefined,
                slot60: undefined,
                slot75: undefined,
              },
              memoryInventory: state.saveData.heroPage.memoryInventory,
            };
          }
        });
      },

      equipHeroMemoryById: (
        slot: HeroMemorySlot,
        memoryId: string | undefined,
      ) => {
        set((state) => {
          const memory = memoryId
            ? state.saveData.heroPage.memoryInventory.find(
                (m) => m.id === memoryId,
              )
            : undefined;
          state.saveData.heroPage.memorySlots[slot] = memory;
        });
      },

      // Configuration actions
      updateConfiguration: (updates: Partial<ConfigurationPage>) => {
        set((state) => {
          state.saveData.configurationPage = {
            ...(state.saveData.configurationPage ??
              createEmptyConfigurationPage()),
            ...updates,
          };
        });
      },

      // Pactspirit actions (additional)
      resetPactspiritSlot: (
        slotIndex: PactspiritSlotIndex,
        pactspiritName: string | undefined,
      ) => {
        set((state) => {
          const slotKey =
            `slot${slotIndex}` as keyof typeof state.saveData.pactspiritPage;
          state.saveData.pactspiritPage[slotKey] = {
            ...createEmptyPactspiritSlot(),
            pactspiritName,
          };
        });
      },

      clearRingDestiny: (
        slotIndex: PactspiritSlotIndex,
        ringSlot: RingSlotKey,
      ) => {
        set((state) => {
          const slotKey =
            `slot${slotIndex}` as keyof typeof state.saveData.pactspiritPage;
          state.saveData.pactspiritPage[slotKey].rings[ringSlot] = {};
        });
      },

      installDestiny: (
        slotIndex: PactspiritSlotIndex,
        ringSlot: RingSlotKey,
        destiny: InstalledDestinyResult,
      ) => {
        set((state) => {
          const slotKey =
            `slot${slotIndex}` as keyof typeof state.saveData.pactspiritPage;
          state.saveData.pactspiritPage[slotKey].rings[ringSlot] = {
            installedDestiny: destiny,
          };
        });
      },

      // Talent actions (additional)
      allocateNode: (
        treeSlot: TreeSlot,
        x: number,
        y: number,
        maxPoints: number,
      ) => {
        set((state) => {
          const tree = state.saveData.talentPage.talentTrees[treeSlot];
          if (!tree) return;
          const existing = tree.allocatedNodes.find(
            (n) => n.x === x && n.y === y,
          );

          if (existing) {
            if (existing.points >= maxPoints) return;
            existing.points += 1;
          } else {
            tree.allocatedNodes.push({ x, y, points: 1 });
          }
        });
      },

      deallocateNode: (treeSlot: TreeSlot, x: number, y: number) => {
        set((state) => {
          const tree = state.saveData.talentPage.talentTrees[treeSlot];
          if (!tree) return;
          const existing = tree.allocatedNodes.find(
            (n) => n.x === x && n.y === y,
          );
          if (!existing) return;

          if (existing.points > 1) {
            existing.points -= 1;
          } else {
            tree.allocatedNodes = tree.allocatedNodes.filter(
              (n) => !(n.x === x && n.y === y),
            );
          }
        });
      },

      selectCoreTalent: (
        treeSlot: TreeSlot,
        slotIndex: number,
        talentName: string | undefined,
      ) => {
        set((state) => {
          const tree = state.saveData.talentPage.talentTrees[treeSlot];
          if (!tree) return;

          const newSelected = [...(tree.selectedCoreTalents ?? [])];
          if (talentName) {
            newSelected[slotIndex] = talentName;
          } else {
            newSelected.splice(slotIndex, 1);
          }
          tree.selectedCoreTalents = newSelected.filter(Boolean);
        });
      },

      updatePrism: (prism: CraftedPrism) => {
        set((state) => {
          state.saveData.talentPage.inventory.prismList =
            state.saveData.talentPage.inventory.prismList.map((p) =>
              p.id === prism.id ? prism : p,
            );
        });
      },

      copyPrism: (prismId: string) => {
        const prism = get().saveData.talentPage.inventory.prismList.find(
          (p) => p.id === prismId,
        );
        if (!prism) return;
        const newPrism = { ...prism, id: generateItemId() };
        set((state) => {
          state.saveData.talentPage.inventory.prismList.push(newPrism);
        });
      },

      returnPrismToInventory: () => {
        set((state) => {
          const placed = state.saveData.talentPage.talentTrees.placedPrism;
          if (!placed) return;
          // Only add back to inventory if not already there (avoid duplicates)
          const alreadyInInventory =
            state.saveData.talentPage.inventory.prismList.some(
              (p) => p.id === placed.prism.id,
            );
          if (!alreadyInInventory) {
            state.saveData.talentPage.inventory.prismList.push(placed.prism);
          }
          delete state.saveData.talentPage.talentTrees.placedPrism;
        });
      },

      updateInverseImage: (inverseImage: CraftedInverseImage) => {
        set((state) => {
          state.saveData.talentPage.inventory.inverseImageList =
            state.saveData.talentPage.inventory.inverseImageList.map((ii) =>
              ii.id === inverseImage.id ? inverseImage : ii,
            );
        });
      },

      copyInverseImage: (inverseImageId: string) => {
        const inverseImage =
          get().saveData.talentPage.inventory.inverseImageList.find(
            (ii) => ii.id === inverseImageId,
          );
        if (!inverseImage) return;
        const newInverseImage = { ...inverseImage, id: generateItemId() };
        set((state) => {
          state.saveData.talentPage.inventory.inverseImageList.push(
            newInverseImage,
          );
        });
      },

      setTreeOrClear: (
        treeSlot: TreeSlot,
        treeName: string,
        clearCoreTalents?: boolean,
      ) => {
        set((state) => {
          if (treeName === "") {
            delete state.saveData.talentPage.talentTrees[treeSlot];
          } else {
            state.saveData.talentPage.talentTrees[treeSlot] = {
              name: treeName,
              allocatedNodes: [],
              selectedCoreTalents: clearCoreTalents
                ? []
                : (state.saveData.talentPage.talentTrees[treeSlot]
                    ?.selectedCoreTalents ?? []),
            };
          }
        });
      },

      resetTree: (treeSlot: TreeSlot) => {
        set((state) => {
          const tree = state.saveData.talentPage.talentTrees[treeSlot];
          if (!tree) return;
          tree.allocatedNodes = [];

          // Also clear reflected nodes if inverse image is placed on this tree
          const placedInverseImage =
            state.saveData.talentPage.talentTrees.placedInverseImage;
          if (placedInverseImage?.treeSlot === treeSlot) {
            placedInverseImage.reflectedAllocatedNodes = [];
          }
        });
      },

      // Calculations actions
      setCalculationsSelectedSkill: (skillName: string | undefined) => {
        set((state) => {
          if (!state.saveData.calculationsPage) {
            state.saveData.calculationsPage = { selectedSkillName: skillName };
          } else {
            state.saveData.calculationsPage.selectedSkillName = skillName;
          }
        });
      },
    })),
  ),
);

// Auto-save subscription: save when saveData changes (debounced)
let saveTimeout: ReturnType<typeof setTimeout> | undefined;
const debouncedSave = (): void => {
  if (saveTimeout !== undefined) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const { currentSaveId, save } = internalStore.getState();
    if (currentSaveId !== undefined) {
      save();
    }
  }, 500);
};

let prevSaveData = internalStore.getState().saveData;
internalStore.subscribe((state) => {
  if (state.saveData !== prevSaveData) {
    prevSaveData = state.saveData;
    debouncedSave();
  }
});
