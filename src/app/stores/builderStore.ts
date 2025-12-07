"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AllocatedTalentNode,
  CraftedInverseImage,
  CraftedPrism,
  DivinitySlate,
  Gear,
  HeroMemory,
  HeroMemorySlot,
  PactspiritSlot,
  PlacedSlate,
  ReflectedAllocatedNode,
  RingSlotState,
  SaveData,
  SupportSkills,
} from "../lib/save-data";
import {
  loadSaveData,
  loadSavesIndex,
  type SavesIndex,
  saveSaveData,
  saveSavesIndex,
} from "../lib/saves";
import { createEmptySaveData, generateItemId } from "../lib/storage";
import type {
  GearSlot,
  PactspiritSlotIndex,
  RingSlotKey,
  TreeSlot,
} from "../lib/types";

interface BuilderState {
  // Core data
  saveData: SaveData;
  hasUnsavedChanges: boolean;

  // Save metadata
  currentSaveId: string | undefined;
  currentSaveName: string | undefined;
  savesIndex: SavesIndex;

  // Actions - Core
  setSaveData: (saveData: SaveData) => void;
  updateSaveData: (updater: (prev: SaveData) => SaveData) => void;
  loadFromSave: (saveId: string) => boolean;
  save: () => boolean;
  resetUnsavedChanges: () => void;

  // Actions - Equipment
  addItemToInventory: (item: Gear) => void;
  copyItem: (itemId: string) => void;
  deleteItem: (itemId: string) => void;
  selectItemForSlot: (slot: GearSlot, itemId: string | undefined) => void;
  isItemEquipped: (itemId: string) => boolean;

  // Actions - Talents
  setTreeName: (slot: TreeSlot, treeName: string) => void;
  clearTree: (slot: TreeSlot) => void;
  setAllocatedNodes: (slot: TreeSlot, nodes: AllocatedTalentNode[]) => void;
  setCoreTalents: (slot: TreeSlot, talents: string[]) => void;
  addPrismToInventory: (prism: CraftedPrism) => void;
  deletePrism: (prismId: string) => void;
  placePrism: (
    prism: CraftedPrism,
    treeSlot: TreeSlot,
    position: { x: number; y: number },
  ) => void;
  removePlacedPrism: () => void;
  addInverseImageToInventory: (inverseImage: CraftedInverseImage) => void;
  deleteInverseImage: (inverseImageId: string) => void;
  placeInverseImage: (
    inverseImage: CraftedInverseImage,
    treeSlot: "tree2" | "tree3" | "tree4",
    position: { x: number; y: number },
  ) => void;
  removePlacedInverseImage: () => void;
  allocateReflectedNode: (
    x: number,
    y: number,
    sourceX: number,
    sourceY: number,
  ) => void;
  deallocateReflectedNode: (x: number, y: number) => void;
  setReflectedAllocatedNodes: (nodes: ReflectedAllocatedNode[]) => void;

  // Actions - Hero
  setHero: (hero: string | undefined) => void;
  setTrait: (
    level: "level1" | "level45" | "level60" | "level75",
    trait: string | undefined,
  ) => void;
  addHeroMemory: (memory: HeroMemory) => void;
  deleteHeroMemory: (memoryId: string) => void;
  equipHeroMemory: (
    slot: HeroMemorySlot,
    memory: HeroMemory | undefined,
  ) => void;

  // Actions - Pactspirit
  setPactspirit: (
    slotIndex: PactspiritSlotIndex,
    name: string | undefined,
  ) => void;
  setPactspiritLevel: (slotIndex: PactspiritSlotIndex, level: number) => void;
  setRingDestiny: (
    slotIndex: PactspiritSlotIndex,
    ringSlot: RingSlotKey,
    destiny: RingSlotState["installedDestiny"],
  ) => void;
  updatePactspiritSlot: (
    slotIndex: PactspiritSlotIndex,
    slot: PactspiritSlot,
  ) => void;

  // Actions - Divinity
  addSlateToInventory: (slate: DivinitySlate) => void;
  deleteSlate: (slateId: string) => void;
  placeSlate: (slateId: string, position: { row: number; col: number }) => void;
  removeSlate: (slateId: string) => void;
  updateSlate: (slateId: string, updates: Partial<DivinitySlate>) => void;

  // Actions - Skills
  setActiveSkill: (slot: 1 | 2 | 3 | 4, skillName: string | undefined) => void;
  setPassiveSkill: (slot: 1 | 2 | 3 | 4, skillName: string | undefined) => void;
  setSupportSkill: (
    skillType: "active" | "passive",
    skillSlot: 1 | 2 | 3 | 4,
    supportSlot: 1 | 2 | 3 | 4 | 5,
    supportName: string | undefined,
  ) => void;
  toggleSkillEnabled: (
    skillType: "active" | "passive",
    slot: 1 | 2 | 3 | 4,
  ) => void;
}

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set, get) => ({
      // Initial state
      saveData: createEmptySaveData(),
      hasUnsavedChanges: false,
      currentSaveId: undefined,
      currentSaveName: undefined,
      savesIndex: { currentSaveId: undefined, saves: [] },

      // Core actions
      setSaveData: (saveData) => set({ saveData, hasUnsavedChanges: false }),

      updateSaveData: (updater) =>
        set((state) => ({
          saveData: updater(state.saveData),
          hasUnsavedChanges: true,
        })),

      loadFromSave: (saveId) => {
        const index = loadSavesIndex();
        const saveMeta = index.saves.find((s) => s.id === saveId);
        if (!saveMeta) return false;

        const data = loadSaveData(saveId);
        if (!data) return false;

        const updatedIndex = { ...index, currentSaveId: saveId };
        saveSavesIndex(updatedIndex);

        set({
          saveData: data,
          currentSaveId: saveId,
          currentSaveName: saveMeta.name,
          savesIndex: updatedIndex,
          hasUnsavedChanges: false,
        });
        return true;
      },

      save: () => {
        const { currentSaveId, saveData, savesIndex } = get();
        if (!currentSaveId) return false;

        const success = saveSaveData(currentSaveId, saveData);
        if (success) {
          const now = Date.now();
          const updatedSaves = savesIndex.saves.map((s) =>
            s.id === currentSaveId ? { ...s, updatedAt: now } : s,
          );
          const newIndex = { ...savesIndex, saves: updatedSaves };
          saveSavesIndex(newIndex);
          set({ savesIndex: newIndex, hasUnsavedChanges: false });
        }
        return success;
      },

      resetUnsavedChanges: () => set({ hasUnsavedChanges: false }),

      // Equipment actions
      addItemToInventory: (item) =>
        set((state) => ({
          saveData: {
            ...state.saveData,
            itemsList: [...state.saveData.itemsList, item],
          },
          hasUnsavedChanges: true,
        })),

      copyItem: (itemId) => {
        const item = get().saveData.itemsList.find((i) => i.id === itemId);
        if (!item) return;
        const newItem: Gear = { ...item, id: generateItemId() };
        set((state) => ({
          saveData: {
            ...state.saveData,
            itemsList: [...state.saveData.itemsList, newItem],
          },
          hasUnsavedChanges: true,
        }));
      },

      deleteItem: (itemId) =>
        set((state) => {
          const newItemsList = state.saveData.itemsList.filter(
            (item) => item.id !== itemId,
          );
          const newEquipmentPage = { ...state.saveData.equipmentPage };
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
            saveData: {
              ...state.saveData,
              itemsList: newItemsList,
              equipmentPage: newEquipmentPage,
            },
            hasUnsavedChanges: true,
          };
        }),

      selectItemForSlot: (slot, itemId) =>
        set((state) => {
          if (!itemId) {
            const newEquipmentPage = { ...state.saveData.equipmentPage };
            delete newEquipmentPage[slot];
            return {
              saveData: { ...state.saveData, equipmentPage: newEquipmentPage },
              hasUnsavedChanges: true,
            };
          }
          const item = state.saveData.itemsList.find((i) => i.id === itemId);
          if (!item) return state;
          return {
            saveData: {
              ...state.saveData,
              equipmentPage: { ...state.saveData.equipmentPage, [slot]: item },
            },
            hasUnsavedChanges: true,
          };
        }),

      isItemEquipped: (itemId) => {
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
          (slot) => saveData.equipmentPage[slot]?.id === itemId,
        );
      },

      // Talent actions
      setTreeName: (slot, treeName) =>
        set((state) => ({
          saveData: {
            ...state.saveData,
            talentPage: {
              ...state.saveData.talentPage,
              [slot]: {
                name: treeName,
                allocatedNodes: [],
                selectedCoreTalents: [],
              },
            },
          },
          hasUnsavedChanges: true,
        })),

      clearTree: (slot) =>
        set((state) => {
          const newTalentPage = { ...state.saveData.talentPage };
          delete newTalentPage[slot];
          return {
            saveData: { ...state.saveData, talentPage: newTalentPage },
            hasUnsavedChanges: true,
          };
        }),

      setAllocatedNodes: (slot, nodes) =>
        set((state) => {
          const tree = state.saveData.talentPage[slot];
          if (!tree) return state;
          return {
            saveData: {
              ...state.saveData,
              talentPage: {
                ...state.saveData.talentPage,
                [slot]: { ...tree, allocatedNodes: nodes },
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      setCoreTalents: (slot, talents) =>
        set((state) => {
          const tree = state.saveData.talentPage[slot];
          if (!tree) return state;
          return {
            saveData: {
              ...state.saveData,
              talentPage: {
                ...state.saveData.talentPage,
                [slot]: { ...tree, selectedCoreTalents: talents },
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      addPrismToInventory: (prism) =>
        set((state) => ({
          saveData: {
            ...state.saveData,
            prismList: [...state.saveData.prismList, prism],
          },
          hasUnsavedChanges: true,
        })),

      deletePrism: (prismId) =>
        set((state) => {
          const newPrismList = state.saveData.prismList.filter(
            (p) => p.id !== prismId,
          );
          const placedPrism = state.saveData.talentPage.placedPrism;
          const newTalentPage = { ...state.saveData.talentPage };
          if (placedPrism?.prism.id === prismId) {
            delete newTalentPage.placedPrism;
          }
          return {
            saveData: {
              ...state.saveData,
              prismList: newPrismList,
              talentPage: newTalentPage,
            },
            hasUnsavedChanges: true,
          };
        }),

      placePrism: (prism, treeSlot, position) =>
        set((state) => ({
          saveData: {
            ...state.saveData,
            talentPage: {
              ...state.saveData.talentPage,
              placedPrism: { prism, treeSlot, position },
            },
          },
          hasUnsavedChanges: true,
        })),

      removePlacedPrism: () =>
        set((state) => {
          const newTalentPage = { ...state.saveData.talentPage };
          delete newTalentPage.placedPrism;
          return {
            saveData: { ...state.saveData, talentPage: newTalentPage },
            hasUnsavedChanges: true,
          };
        }),

      addInverseImageToInventory: (inverseImage) =>
        set((state) => ({
          saveData: {
            ...state.saveData,
            inverseImageList: [
              ...state.saveData.inverseImageList,
              inverseImage,
            ],
          },
          hasUnsavedChanges: true,
        })),

      deleteInverseImage: (inverseImageId) =>
        set((state) => {
          const newInverseImageList = state.saveData.inverseImageList.filter(
            (ii) => ii.id !== inverseImageId,
          );
          const placedInverseImage =
            state.saveData.talentPage.placedInverseImage;
          const newTalentPage = { ...state.saveData.talentPage };
          if (placedInverseImage?.inverseImage.id === inverseImageId) {
            delete newTalentPage.placedInverseImage;
          }
          return {
            saveData: {
              ...state.saveData,
              inverseImageList: newInverseImageList,
              talentPage: newTalentPage,
            },
            hasUnsavedChanges: true,
          };
        }),

      placeInverseImage: (inverseImage, treeSlot, position) =>
        set((state) => ({
          saveData: {
            ...state.saveData,
            inverseImageList: state.saveData.inverseImageList.filter(
              (ii) => ii.id !== inverseImage.id,
            ),
            talentPage: {
              ...state.saveData.talentPage,
              placedInverseImage: {
                inverseImage,
                treeSlot,
                position,
                reflectedAllocatedNodes: [],
              },
            },
          },
          hasUnsavedChanges: true,
        })),

      removePlacedInverseImage: () =>
        set((state) => {
          const placedInverseImage =
            state.saveData.talentPage.placedInverseImage;
          if (!placedInverseImage) return state;

          const newTalentPage = { ...state.saveData.talentPage };
          delete newTalentPage.placedInverseImage;

          return {
            saveData: {
              ...state.saveData,
              inverseImageList: [
                ...state.saveData.inverseImageList,
                placedInverseImage.inverseImage,
              ],
              talentPage: newTalentPage,
            },
            hasUnsavedChanges: true,
          };
        }),

      allocateReflectedNode: (x, y, sourceX, sourceY) =>
        set((state) => {
          const placedInverseImage =
            state.saveData.talentPage.placedInverseImage;
          if (!placedInverseImage) return state;

          const existingIdx =
            placedInverseImage.reflectedAllocatedNodes.findIndex(
              (n) => n.x === x && n.y === y,
            );

          let updatedNodes: ReflectedAllocatedNode[];
          if (existingIdx >= 0) {
            updatedNodes = placedInverseImage.reflectedAllocatedNodes.map(
              (n, idx) =>
                idx === existingIdx ? { ...n, points: n.points + 1 } : n,
            );
          } else {
            updatedNodes = [
              ...placedInverseImage.reflectedAllocatedNodes,
              { x, y, sourceX, sourceY, points: 1 },
            ];
          }

          return {
            saveData: {
              ...state.saveData,
              talentPage: {
                ...state.saveData.talentPage,
                placedInverseImage: {
                  ...placedInverseImage,
                  reflectedAllocatedNodes: updatedNodes,
                },
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      deallocateReflectedNode: (x, y) =>
        set((state) => {
          const placedInverseImage =
            state.saveData.talentPage.placedInverseImage;
          if (!placedInverseImage) return state;

          const existing = placedInverseImage.reflectedAllocatedNodes.find(
            (n) => n.x === x && n.y === y,
          );
          if (!existing) return state;

          let updatedNodes: ReflectedAllocatedNode[];
          if (existing.points > 1) {
            updatedNodes = placedInverseImage.reflectedAllocatedNodes.map(
              (n) =>
                n.x === x && n.y === y ? { ...n, points: n.points - 1 } : n,
            );
          } else {
            updatedNodes = placedInverseImage.reflectedAllocatedNodes.filter(
              (n) => !(n.x === x && n.y === y),
            );
          }

          return {
            saveData: {
              ...state.saveData,
              talentPage: {
                ...state.saveData.talentPage,
                placedInverseImage: {
                  ...placedInverseImage,
                  reflectedAllocatedNodes: updatedNodes,
                },
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      setReflectedAllocatedNodes: (nodes) =>
        set((state) => {
          const placedInverseImage =
            state.saveData.talentPage.placedInverseImage;
          if (!placedInverseImage) return state;

          return {
            saveData: {
              ...state.saveData,
              talentPage: {
                ...state.saveData.talentPage,
                placedInverseImage: {
                  ...placedInverseImage,
                  reflectedAllocatedNodes: nodes,
                },
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      // Hero actions
      setHero: (hero) =>
        set((state) => ({
          saveData: {
            ...state.saveData,
            heroPage: { ...state.saveData.heroPage, selectedHero: hero },
          },
          hasUnsavedChanges: true,
        })),

      setTrait: (level, trait) =>
        set((state) => ({
          saveData: {
            ...state.saveData,
            heroPage: {
              ...state.saveData.heroPage,
              traits: { ...state.saveData.heroPage.traits, [level]: trait },
            },
          },
          hasUnsavedChanges: true,
        })),

      addHeroMemory: (memory) =>
        set((state) => ({
          saveData: {
            ...state.saveData,
            heroMemoryList: [...state.saveData.heroMemoryList, memory],
          },
          hasUnsavedChanges: true,
        })),

      deleteHeroMemory: (memoryId) =>
        set((state) => {
          const newMemoryList = state.saveData.heroMemoryList.filter(
            (m) => m.id !== memoryId,
          );
          const newMemorySlots = { ...state.saveData.heroPage.memorySlots };
          (["slot45", "slot60", "slot75"] as HeroMemorySlot[]).forEach(
            (slot) => {
              if (newMemorySlots[slot]?.id === memoryId) {
                newMemorySlots[slot] = undefined;
              }
            },
          );
          return {
            saveData: {
              ...state.saveData,
              heroMemoryList: newMemoryList,
              heroPage: {
                ...state.saveData.heroPage,
                memorySlots: newMemorySlots,
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      equipHeroMemory: (slot, memory) =>
        set((state) => ({
          saveData: {
            ...state.saveData,
            heroPage: {
              ...state.saveData.heroPage,
              memorySlots: {
                ...state.saveData.heroPage.memorySlots,
                [slot]: memory,
              },
            },
          },
          hasUnsavedChanges: true,
        })),

      // Pactspirit actions
      setPactspirit: (slotIndex, name) =>
        set((state) => {
          const slotKey =
            `slot${slotIndex}` as keyof typeof state.saveData.pactspiritPage;
          return {
            saveData: {
              ...state.saveData,
              pactspiritPage: {
                ...state.saveData.pactspiritPage,
                [slotKey]: {
                  ...state.saveData.pactspiritPage[slotKey],
                  pactspiritName: name,
                },
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      setPactspiritLevel: (slotIndex, level) =>
        set((state) => {
          const slotKey =
            `slot${slotIndex}` as keyof typeof state.saveData.pactspiritPage;
          return {
            saveData: {
              ...state.saveData,
              pactspiritPage: {
                ...state.saveData.pactspiritPage,
                [slotKey]: {
                  ...state.saveData.pactspiritPage[slotKey],
                  level,
                },
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      setRingDestiny: (slotIndex, ringSlot, destiny) =>
        set((state) => {
          const slotKey =
            `slot${slotIndex}` as keyof typeof state.saveData.pactspiritPage;
          const slot = state.saveData.pactspiritPage[slotKey];
          return {
            saveData: {
              ...state.saveData,
              pactspiritPage: {
                ...state.saveData.pactspiritPage,
                [slotKey]: {
                  ...slot,
                  rings: {
                    ...slot.rings,
                    [ringSlot]: { installedDestiny: destiny },
                  },
                },
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      updatePactspiritSlot: (slotIndex, slot) =>
        set((state) => {
          const slotKey =
            `slot${slotIndex}` as keyof typeof state.saveData.pactspiritPage;
          return {
            saveData: {
              ...state.saveData,
              pactspiritPage: {
                ...state.saveData.pactspiritPage,
                [slotKey]: slot,
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      // Divinity actions
      addSlateToInventory: (slate) =>
        set((state) => ({
          saveData: {
            ...state.saveData,
            divinitySlateList: [...state.saveData.divinitySlateList, slate],
          },
          hasUnsavedChanges: true,
        })),

      deleteSlate: (slateId) =>
        set((state) => {
          const newSlateList = state.saveData.divinitySlateList.filter(
            (s) => s.id !== slateId,
          );
          const newPlacedSlates =
            state.saveData.divinityPage.placedSlates.filter(
              (p) => p.slateId !== slateId,
            );
          return {
            saveData: {
              ...state.saveData,
              divinitySlateList: newSlateList,
              divinityPage: {
                ...state.saveData.divinityPage,
                placedSlates: newPlacedSlates,
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      placeSlate: (slateId, position) =>
        set((state) => {
          const existingIndex =
            state.saveData.divinityPage.placedSlates.findIndex(
              (p) => p.slateId === slateId,
            );
          let newPlacedSlates: PlacedSlate[];
          if (existingIndex >= 0) {
            newPlacedSlates = state.saveData.divinityPage.placedSlates.map(
              (p, i) => (i === existingIndex ? { slateId, position } : p),
            );
          } else {
            newPlacedSlates = [
              ...state.saveData.divinityPage.placedSlates,
              { slateId, position },
            ];
          }
          return {
            saveData: {
              ...state.saveData,
              divinityPage: {
                ...state.saveData.divinityPage,
                placedSlates: newPlacedSlates,
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      removeSlate: (slateId) =>
        set((state) => ({
          saveData: {
            ...state.saveData,
            divinityPage: {
              ...state.saveData.divinityPage,
              placedSlates: state.saveData.divinityPage.placedSlates.filter(
                (p) => p.slateId !== slateId,
              ),
            },
          },
          hasUnsavedChanges: true,
        })),

      updateSlate: (slateId, updates) =>
        set((state) => ({
          saveData: {
            ...state.saveData,
            divinitySlateList: state.saveData.divinitySlateList.map((s) =>
              s.id === slateId ? { ...s, ...updates } : s,
            ),
          },
          hasUnsavedChanges: true,
        })),

      // Skills actions
      setActiveSkill: (slot, skillName) =>
        set((state) => {
          const skillKey =
            `activeSkill${slot}` as keyof typeof state.saveData.skillPage;
          return {
            saveData: {
              ...state.saveData,
              skillPage: {
                ...state.saveData.skillPage,
                [skillKey]: {
                  ...state.saveData.skillPage[skillKey],
                  skillName,
                },
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      setPassiveSkill: (slot, skillName) =>
        set((state) => {
          const skillKey =
            `passiveSkill${slot}` as keyof typeof state.saveData.skillPage;
          return {
            saveData: {
              ...state.saveData,
              skillPage: {
                ...state.saveData.skillPage,
                [skillKey]: {
                  ...state.saveData.skillPage[skillKey],
                  skillName,
                },
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      setSupportSkill: (skillType, skillSlot, supportSlot, supportName) =>
        set((state) => {
          const skillKey =
            `${skillType}Skill${skillSlot}` as keyof typeof state.saveData.skillPage;
          const supportKey =
            `supportSkill${supportSlot}` as keyof SupportSkills;
          const skill = state.saveData.skillPage[skillKey];
          if (!skill) return state;
          return {
            saveData: {
              ...state.saveData,
              skillPage: {
                ...state.saveData.skillPage,
                [skillKey]: {
                  ...skill,
                  supportSkills: {
                    ...skill.supportSkills,
                    [supportKey]: supportName,
                  },
                },
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      toggleSkillEnabled: (skillType, slot) =>
        set((state) => {
          const skillKey =
            `${skillType}Skill${slot}` as keyof typeof state.saveData.skillPage;
          const skill = state.saveData.skillPage[skillKey];
          if (!skill) return state;
          return {
            saveData: {
              ...state.saveData,
              skillPage: {
                ...state.saveData.skillPage,
                [skillKey]: { ...skill, enabled: !skill.enabled },
              },
            },
            hasUnsavedChanges: true,
          };
        }),
    }),
    {
      name: "torchlight-builder-storage",
      partialize: (state) => ({
        saveData: state.saveData,
        currentSaveId: state.currentSaveId,
      }),
    },
  ),
);
