"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  SaveData,
  Gear,
  HeroMemory,
  DivinitySlate,
  CraftedPrism,
  CraftedInverseImage,
  AllocatedTalentNode,
  ReflectedAllocatedNode,
  PlacedSlate,
  HeroMemorySlot,
  PactspiritSlot,
  RingSlotState,
} from "../lib/save-data";
import { createEmptyLoadout, generateItemId } from "../lib/storage";
import {
  loadSaveData,
  saveSaveData,
  loadSavesIndex,
  saveSavesIndex,
  SavesIndex,
} from "../lib/saves";
import {
  GearSlot,
  TreeSlot,
  RingSlotKey,
  PactspiritSlotIndex,
} from "../lib/types";

interface BuilderState {
  // Core data
  loadout: SaveData;
  hasUnsavedChanges: boolean;

  // Save metadata
  currentSaveId: string | undefined;
  currentSaveName: string | undefined;
  savesIndex: SavesIndex;

  // Actions - Core
  setLoadout: (loadout: SaveData) => void;
  updateLoadout: (updater: (prev: SaveData) => SaveData) => void;
  loadFromSave: (saveId: string) => boolean;
  save: () => boolean;
  resetUnsavedChanges: () => void;

  // Actions - Equipment
  addItemToInventory: (item: Gear) => void;
  copyItem: (item: Gear) => void;
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
      loadout: createEmptyLoadout(),
      hasUnsavedChanges: false,
      currentSaveId: undefined,
      currentSaveName: undefined,
      savesIndex: { currentSaveId: undefined, saves: [] },

      // Core actions
      setLoadout: (loadout) => set({ loadout, hasUnsavedChanges: false }),

      updateLoadout: (updater) =>
        set((state) => ({
          loadout: updater(state.loadout),
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
          loadout: data,
          currentSaveId: saveId,
          currentSaveName: saveMeta.name,
          savesIndex: updatedIndex,
          hasUnsavedChanges: false,
        });
        return true;
      },

      save: () => {
        const { currentSaveId, loadout, savesIndex } = get();
        if (!currentSaveId) return false;

        const success = saveSaveData(currentSaveId, loadout);
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
          loadout: {
            ...state.loadout,
            itemsList: [...state.loadout.itemsList, item],
          },
          hasUnsavedChanges: true,
        })),

      copyItem: (item) => {
        const newItem: Gear = { ...item, id: generateItemId() };
        set((state) => ({
          loadout: {
            ...state.loadout,
            itemsList: [...state.loadout.itemsList, newItem],
          },
          hasUnsavedChanges: true,
        }));
      },

      deleteItem: (itemId) =>
        set((state) => {
          const newItemsList = state.loadout.itemsList.filter(
            (item) => item.id !== itemId,
          );
          const newEquipmentPage = { ...state.loadout.equipmentPage };
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
            loadout: {
              ...state.loadout,
              itemsList: newItemsList,
              equipmentPage: newEquipmentPage,
            },
            hasUnsavedChanges: true,
          };
        }),

      selectItemForSlot: (slot, itemId) =>
        set((state) => {
          if (!itemId) {
            const newEquipmentPage = { ...state.loadout.equipmentPage };
            delete newEquipmentPage[slot];
            return {
              loadout: { ...state.loadout, equipmentPage: newEquipmentPage },
              hasUnsavedChanges: true,
            };
          }
          const item = state.loadout.itemsList.find((i) => i.id === itemId);
          if (!item) return state;
          return {
            loadout: {
              ...state.loadout,
              equipmentPage: { ...state.loadout.equipmentPage, [slot]: item },
            },
            hasUnsavedChanges: true,
          };
        }),

      isItemEquipped: (itemId) => {
        const { loadout } = get();
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
      },

      // Talent actions
      setTreeName: (slot, treeName) =>
        set((state) => ({
          loadout: {
            ...state.loadout,
            talentPage: {
              ...state.loadout.talentPage,
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
          const newTalentPage = { ...state.loadout.talentPage };
          delete newTalentPage[slot];
          return {
            loadout: { ...state.loadout, talentPage: newTalentPage },
            hasUnsavedChanges: true,
          };
        }),

      setAllocatedNodes: (slot, nodes) =>
        set((state) => {
          const tree = state.loadout.talentPage[slot];
          if (!tree) return state;
          return {
            loadout: {
              ...state.loadout,
              talentPage: {
                ...state.loadout.talentPage,
                [slot]: { ...tree, allocatedNodes: nodes },
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      setCoreTalents: (slot, talents) =>
        set((state) => {
          const tree = state.loadout.talentPage[slot];
          if (!tree) return state;
          return {
            loadout: {
              ...state.loadout,
              talentPage: {
                ...state.loadout.talentPage,
                [slot]: { ...tree, selectedCoreTalents: talents },
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      addPrismToInventory: (prism) =>
        set((state) => ({
          loadout: {
            ...state.loadout,
            prismList: [...state.loadout.prismList, prism],
          },
          hasUnsavedChanges: true,
        })),

      deletePrism: (prismId) =>
        set((state) => {
          const newPrismList = state.loadout.prismList.filter(
            (p) => p.id !== prismId,
          );
          const placedPrism = state.loadout.talentPage.placedPrism;
          const newTalentPage = { ...state.loadout.talentPage };
          if (placedPrism?.prism.id === prismId) {
            delete newTalentPage.placedPrism;
          }
          return {
            loadout: {
              ...state.loadout,
              prismList: newPrismList,
              talentPage: newTalentPage,
            },
            hasUnsavedChanges: true,
          };
        }),

      placePrism: (prism, treeSlot, position) =>
        set((state) => ({
          loadout: {
            ...state.loadout,
            talentPage: {
              ...state.loadout.talentPage,
              placedPrism: { prism, treeSlot, position },
            },
          },
          hasUnsavedChanges: true,
        })),

      removePlacedPrism: () =>
        set((state) => {
          const newTalentPage = { ...state.loadout.talentPage };
          delete newTalentPage.placedPrism;
          return {
            loadout: { ...state.loadout, talentPage: newTalentPage },
            hasUnsavedChanges: true,
          };
        }),

      addInverseImageToInventory: (inverseImage) =>
        set((state) => ({
          loadout: {
            ...state.loadout,
            inverseImageList: [...state.loadout.inverseImageList, inverseImage],
          },
          hasUnsavedChanges: true,
        })),

      deleteInverseImage: (inverseImageId) =>
        set((state) => {
          const newInverseImageList = state.loadout.inverseImageList.filter(
            (ii) => ii.id !== inverseImageId,
          );
          const placedInverseImage = state.loadout.talentPage.placedInverseImage;
          const newTalentPage = { ...state.loadout.talentPage };
          if (placedInverseImage?.inverseImage.id === inverseImageId) {
            delete newTalentPage.placedInverseImage;
          }
          return {
            loadout: {
              ...state.loadout,
              inverseImageList: newInverseImageList,
              talentPage: newTalentPage,
            },
            hasUnsavedChanges: true,
          };
        }),

      placeInverseImage: (inverseImage, treeSlot, position) =>
        set((state) => ({
          loadout: {
            ...state.loadout,
            inverseImageList: state.loadout.inverseImageList.filter(
              (ii) => ii.id !== inverseImage.id,
            ),
            talentPage: {
              ...state.loadout.talentPage,
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
          const placedInverseImage = state.loadout.talentPage.placedInverseImage;
          if (!placedInverseImage) return state;

          const newTalentPage = { ...state.loadout.talentPage };
          delete newTalentPage.placedInverseImage;

          return {
            loadout: {
              ...state.loadout,
              inverseImageList: [
                ...state.loadout.inverseImageList,
                placedInverseImage.inverseImage,
              ],
              talentPage: newTalentPage,
            },
            hasUnsavedChanges: true,
          };
        }),

      allocateReflectedNode: (x, y, sourceX, sourceY) =>
        set((state) => {
          const placedInverseImage = state.loadout.talentPage.placedInverseImage;
          if (!placedInverseImage) return state;

          const existingIdx = placedInverseImage.reflectedAllocatedNodes.findIndex(
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
            loadout: {
              ...state.loadout,
              talentPage: {
                ...state.loadout.talentPage,
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
          const placedInverseImage = state.loadout.talentPage.placedInverseImage;
          if (!placedInverseImage) return state;

          const existing = placedInverseImage.reflectedAllocatedNodes.find(
            (n) => n.x === x && n.y === y,
          );
          if (!existing) return state;

          let updatedNodes: ReflectedAllocatedNode[];
          if (existing.points > 1) {
            updatedNodes = placedInverseImage.reflectedAllocatedNodes.map((n) =>
              n.x === x && n.y === y ? { ...n, points: n.points - 1 } : n,
            );
          } else {
            updatedNodes = placedInverseImage.reflectedAllocatedNodes.filter(
              (n) => !(n.x === x && n.y === y),
            );
          }

          return {
            loadout: {
              ...state.loadout,
              talentPage: {
                ...state.loadout.talentPage,
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
          const placedInverseImage = state.loadout.talentPage.placedInverseImage;
          if (!placedInverseImage) return state;

          return {
            loadout: {
              ...state.loadout,
              talentPage: {
                ...state.loadout.talentPage,
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
          loadout: {
            ...state.loadout,
            heroPage: { ...state.loadout.heroPage, selectedHero: hero },
          },
          hasUnsavedChanges: true,
        })),

      setTrait: (level, trait) =>
        set((state) => ({
          loadout: {
            ...state.loadout,
            heroPage: {
              ...state.loadout.heroPage,
              traits: { ...state.loadout.heroPage.traits, [level]: trait },
            },
          },
          hasUnsavedChanges: true,
        })),

      addHeroMemory: (memory) =>
        set((state) => ({
          loadout: {
            ...state.loadout,
            heroMemoryList: [...state.loadout.heroMemoryList, memory],
          },
          hasUnsavedChanges: true,
        })),

      deleteHeroMemory: (memoryId) =>
        set((state) => {
          const newMemoryList = state.loadout.heroMemoryList.filter(
            (m) => m.id !== memoryId,
          );
          const newMemorySlots = { ...state.loadout.heroPage.memorySlots };
          (["slot45", "slot60", "slot75"] as HeroMemorySlot[]).forEach(
            (slot) => {
              if (newMemorySlots[slot]?.id === memoryId) {
                newMemorySlots[slot] = undefined;
              }
            },
          );
          return {
            loadout: {
              ...state.loadout,
              heroMemoryList: newMemoryList,
              heroPage: {
                ...state.loadout.heroPage,
                memorySlots: newMemorySlots,
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      equipHeroMemory: (slot, memory) =>
        set((state) => ({
          loadout: {
            ...state.loadout,
            heroPage: {
              ...state.loadout.heroPage,
              memorySlots: {
                ...state.loadout.heroPage.memorySlots,
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
            `slot${slotIndex}` as keyof typeof state.loadout.pactspiritPage;
          return {
            loadout: {
              ...state.loadout,
              pactspiritPage: {
                ...state.loadout.pactspiritPage,
                [slotKey]: {
                  ...state.loadout.pactspiritPage[slotKey],
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
            `slot${slotIndex}` as keyof typeof state.loadout.pactspiritPage;
          return {
            loadout: {
              ...state.loadout,
              pactspiritPage: {
                ...state.loadout.pactspiritPage,
                [slotKey]: {
                  ...state.loadout.pactspiritPage[slotKey],
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
            `slot${slotIndex}` as keyof typeof state.loadout.pactspiritPage;
          const slot = state.loadout.pactspiritPage[slotKey];
          return {
            loadout: {
              ...state.loadout,
              pactspiritPage: {
                ...state.loadout.pactspiritPage,
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
            `slot${slotIndex}` as keyof typeof state.loadout.pactspiritPage;
          return {
            loadout: {
              ...state.loadout,
              pactspiritPage: {
                ...state.loadout.pactspiritPage,
                [slotKey]: slot,
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      // Divinity actions
      addSlateToInventory: (slate) =>
        set((state) => ({
          loadout: {
            ...state.loadout,
            divinitySlateList: [...state.loadout.divinitySlateList, slate],
          },
          hasUnsavedChanges: true,
        })),

      deleteSlate: (slateId) =>
        set((state) => {
          const newSlateList = state.loadout.divinitySlateList.filter(
            (s) => s.id !== slateId,
          );
          const newPlacedSlates =
            state.loadout.divinityPage.placedSlates.filter(
              (p) => p.slateId !== slateId,
            );
          return {
            loadout: {
              ...state.loadout,
              divinitySlateList: newSlateList,
              divinityPage: {
                ...state.loadout.divinityPage,
                placedSlates: newPlacedSlates,
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      placeSlate: (slateId, position) =>
        set((state) => {
          const existingIndex =
            state.loadout.divinityPage.placedSlates.findIndex(
              (p) => p.slateId === slateId,
            );
          let newPlacedSlates: PlacedSlate[];
          if (existingIndex >= 0) {
            newPlacedSlates = state.loadout.divinityPage.placedSlates.map(
              (p, i) => (i === existingIndex ? { slateId, position } : p),
            );
          } else {
            newPlacedSlates = [
              ...state.loadout.divinityPage.placedSlates,
              { slateId, position },
            ];
          }
          return {
            loadout: {
              ...state.loadout,
              divinityPage: {
                ...state.loadout.divinityPage,
                placedSlates: newPlacedSlates,
              },
            },
            hasUnsavedChanges: true,
          };
        }),

      removeSlate: (slateId) =>
        set((state) => ({
          loadout: {
            ...state.loadout,
            divinityPage: {
              ...state.loadout.divinityPage,
              placedSlates: state.loadout.divinityPage.placedSlates.filter(
                (p) => p.slateId !== slateId,
              ),
            },
          },
          hasUnsavedChanges: true,
        })),

      updateSlate: (slateId, updates) =>
        set((state) => ({
          loadout: {
            ...state.loadout,
            divinitySlateList: state.loadout.divinitySlateList.map((s) =>
              s.id === slateId ? { ...s, ...updates } : s,
            ),
          },
          hasUnsavedChanges: true,
        })),

      // Skills actions
      setActiveSkill: (slot, skillName) =>
        set((state) => {
          const skillKey =
            `activeSkill${slot}` as keyof typeof state.loadout.skillPage;
          return {
            loadout: {
              ...state.loadout,
              skillPage: {
                ...state.loadout.skillPage,
                [skillKey]: {
                  ...state.loadout.skillPage[skillKey],
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
            `passiveSkill${slot}` as keyof typeof state.loadout.skillPage;
          return {
            loadout: {
              ...state.loadout,
              skillPage: {
                ...state.loadout.skillPage,
                [skillKey]: {
                  ...state.loadout.skillPage[skillKey],
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
            `${skillType}Skill${skillSlot}` as keyof typeof state.loadout.skillPage;
          const supportKey =
            `supportSkill${supportSlot}` as keyof (typeof state.loadout.skillPage)[typeof skillKey]["supportSkills"];
          const skill = state.loadout.skillPage[skillKey];
          return {
            loadout: {
              ...state.loadout,
              skillPage: {
                ...state.loadout.skillPage,
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
            `${skillType}Skill${slot}` as keyof typeof state.loadout.skillPage;
          const skill = state.loadout.skillPage[skillKey];
          return {
            loadout: {
              ...state.loadout,
              skillPage: {
                ...state.loadout.skillPage,
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
        loadout: state.loadout,
        currentSaveId: state.currentSaveId,
      }),
    },
  ),
);
