"use client";

import type { Gear, HeroMemorySlot } from "../../lib/save-data";
import {
  loadSaveData,
  loadSavesIndex,
  saveSaveData,
  saveSavesIndex,
} from "../../lib/saves";
import { generateItemId } from "../../lib/storage";
import type { GearSlot } from "../../lib/types";
import { internalStore } from "./internal";
import type { BuilderActions } from "./types";

export const createActions = (): BuilderActions => ({
  // Core actions
  setSaveData: (saveData) => {
    internalStore.setState((state) => {
      state.saveData = saveData;
      state.hasUnsavedChanges = false;
    });
  },

  updateSaveData: (updater) => {
    internalStore.setState((state) => {
      state.saveData = updater(state.saveData);
      state.hasUnsavedChanges = true;
    });
  },

  loadFromSave: (saveId) => {
    const index = loadSavesIndex();
    const saveMeta = index.saves.find((s) => s.id === saveId);
    if (!saveMeta) return false;

    const data = loadSaveData(saveId);
    if (!data) return false;

    const updatedIndex = { ...index, currentSaveId: saveId };
    saveSavesIndex(updatedIndex);

    internalStore.setState((state) => {
      state.saveData = data;
      state.currentSaveId = saveId;
      state.currentSaveName = saveMeta.name;
      state.savesIndex = updatedIndex;
      state.hasUnsavedChanges = false;
    });
    return true;
  },

  save: () => {
    const { currentSaveId, saveData, savesIndex } = internalStore.getState();
    if (!currentSaveId) return false;

    const success = saveSaveData(currentSaveId, saveData);
    if (success) {
      const now = Date.now();
      const saveIndex = savesIndex.saves.findIndex(
        (s) => s.id === currentSaveId,
      );
      internalStore.setState((state) => {
        if (saveIndex >= 0) {
          state.savesIndex.saves[saveIndex].updatedAt = now;
        }
        state.hasUnsavedChanges = false;
      });
      saveSavesIndex(internalStore.getState().savesIndex);
    }
    return success;
  },

  resetUnsavedChanges: () => {
    internalStore.setState((state) => {
      state.hasUnsavedChanges = false;
    });
  },

  // Equipment actions
  addItemToInventory: (item) => {
    internalStore.setState((state) => {
      state.saveData.itemsList.push(item);
      state.hasUnsavedChanges = true;
    });
  },

  copyItem: (itemId) => {
    const item = internalStore
      .getState()
      .saveData.itemsList.find((i) => i.id === itemId);
    if (!item) return;
    const newItem: Gear = { ...item, id: generateItemId() };
    internalStore.setState((state) => {
      state.saveData.itemsList.push(newItem);
      state.hasUnsavedChanges = true;
    });
  },

  deleteItem: (itemId) => {
    internalStore.setState((state) => {
      state.saveData.itemsList = state.saveData.itemsList.filter(
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
        if (state.saveData.equipmentPage[slot]?.id === itemId) {
          delete state.saveData.equipmentPage[slot];
        }
      }
      state.hasUnsavedChanges = true;
    });
  },

  selectItemForSlot: (slot, itemId) => {
    internalStore.setState((state) => {
      if (!itemId) {
        delete state.saveData.equipmentPage[slot];
        state.hasUnsavedChanges = true;
        return;
      }
      const item = state.saveData.itemsList.find((i) => i.id === itemId);
      if (!item) return;
      state.saveData.equipmentPage[slot] = item;
      state.hasUnsavedChanges = true;
    });
  },

  isItemEquipped: (itemId) => {
    const { saveData } = internalStore.getState();
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
    return slots.some((slot) => saveData.equipmentPage[slot]?.id === itemId);
  },

  // Talent actions
  setTreeName: (slot, treeName) => {
    internalStore.setState((state) => {
      state.saveData.talentPage[slot] = {
        name: treeName,
        allocatedNodes: [],
        selectedCoreTalents: [],
      };
      state.hasUnsavedChanges = true;
    });
  },

  clearTree: (slot) => {
    internalStore.setState((state) => {
      delete state.saveData.talentPage[slot];
      state.hasUnsavedChanges = true;
    });
  },

  setAllocatedNodes: (slot, nodes) => {
    internalStore.setState((state) => {
      const tree = state.saveData.talentPage[slot];
      if (!tree) return;
      tree.allocatedNodes = nodes;
      state.hasUnsavedChanges = true;
    });
  },

  setCoreTalents: (slot, talents) => {
    internalStore.setState((state) => {
      const tree = state.saveData.talentPage[slot];
      if (!tree) return;
      tree.selectedCoreTalents = talents;
      state.hasUnsavedChanges = true;
    });
  },

  addPrismToInventory: (prism) => {
    internalStore.setState((state) => {
      state.saveData.prismList.push(prism);
      state.hasUnsavedChanges = true;
    });
  },

  deletePrism: (prismId) => {
    internalStore.setState((state) => {
      state.saveData.prismList = state.saveData.prismList.filter(
        (p) => p.id !== prismId,
      );
      if (state.saveData.talentPage.placedPrism?.prism.id === prismId) {
        delete state.saveData.talentPage.placedPrism;
      }
      state.hasUnsavedChanges = true;
    });
  },

  placePrism: (prism, treeSlot, position) => {
    internalStore.setState((state) => {
      state.saveData.talentPage.placedPrism = { prism, treeSlot, position };
      state.hasUnsavedChanges = true;
    });
  },

  removePlacedPrism: () => {
    internalStore.setState((state) => {
      delete state.saveData.talentPage.placedPrism;
      state.hasUnsavedChanges = true;
    });
  },

  addInverseImageToInventory: (inverseImage) => {
    internalStore.setState((state) => {
      state.saveData.inverseImageList.push(inverseImage);
      state.hasUnsavedChanges = true;
    });
  },

  deleteInverseImage: (inverseImageId) => {
    internalStore.setState((state) => {
      state.saveData.inverseImageList = state.saveData.inverseImageList.filter(
        (ii) => ii.id !== inverseImageId,
      );
      if (
        state.saveData.talentPage.placedInverseImage?.inverseImage.id ===
        inverseImageId
      ) {
        delete state.saveData.talentPage.placedInverseImage;
      }
      state.hasUnsavedChanges = true;
    });
  },

  placeInverseImage: (inverseImage, treeSlot, position) => {
    internalStore.setState((state) => {
      state.saveData.inverseImageList = state.saveData.inverseImageList.filter(
        (ii) => ii.id !== inverseImage.id,
      );
      state.saveData.talentPage.placedInverseImage = {
        inverseImage,
        treeSlot,
        position,
        reflectedAllocatedNodes: [],
      };
      state.hasUnsavedChanges = true;
    });
  },

  removePlacedInverseImage: () => {
    internalStore.setState((state) => {
      const placedInverseImage = state.saveData.talentPage.placedInverseImage;
      if (!placedInverseImage) return;
      state.saveData.inverseImageList.push(placedInverseImage.inverseImage);
      delete state.saveData.talentPage.placedInverseImage;
      state.hasUnsavedChanges = true;
    });
  },

  allocateReflectedNode: (x, y, sourceX, sourceY) => {
    internalStore.setState((state) => {
      const placedInverseImage = state.saveData.talentPage.placedInverseImage;
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
      state.hasUnsavedChanges = true;
    });
  },

  deallocateReflectedNode: (x, y) => {
    internalStore.setState((state) => {
      const placedInverseImage = state.saveData.talentPage.placedInverseImage;
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
      state.hasUnsavedChanges = true;
    });
  },

  setReflectedAllocatedNodes: (nodes) => {
    internalStore.setState((state) => {
      const placedInverseImage = state.saveData.talentPage.placedInverseImage;
      if (!placedInverseImage) return;
      placedInverseImage.reflectedAllocatedNodes = nodes;
      state.hasUnsavedChanges = true;
    });
  },

  // Hero actions
  setHero: (hero) => {
    internalStore.setState((state) => {
      state.saveData.heroPage.selectedHero = hero;
      state.hasUnsavedChanges = true;
    });
  },

  setTrait: (level, trait) => {
    internalStore.setState((state) => {
      state.saveData.heroPage.traits[level] = trait;
      state.hasUnsavedChanges = true;
    });
  },

  addHeroMemory: (memory) => {
    internalStore.setState((state) => {
      state.saveData.heroMemoryList.push(memory);
      state.hasUnsavedChanges = true;
    });
  },

  deleteHeroMemory: (memoryId) => {
    internalStore.setState((state) => {
      state.saveData.heroMemoryList = state.saveData.heroMemoryList.filter(
        (m) => m.id !== memoryId,
      );
      (["slot45", "slot60", "slot75"] as HeroMemorySlot[]).forEach((slot) => {
        if (state.saveData.heroPage.memorySlots[slot]?.id === memoryId) {
          state.saveData.heroPage.memorySlots[slot] = undefined;
        }
      });
      state.hasUnsavedChanges = true;
    });
  },

  equipHeroMemory: (slot, memory) => {
    internalStore.setState((state) => {
      state.saveData.heroPage.memorySlots[slot] = memory;
      state.hasUnsavedChanges = true;
    });
  },

  copyHeroMemory: (memoryId) => {
    const memory = internalStore
      .getState()
      .saveData.heroMemoryList.find((m) => m.id === memoryId);
    if (!memory) return;
    const newMemory = { ...memory, id: generateItemId() };
    internalStore.setState((state) => {
      state.saveData.heroMemoryList.push(newMemory);
      state.hasUnsavedChanges = true;
    });
  },

  // Pactspirit actions
  setPactspirit: (slotIndex, name) => {
    internalStore.setState((state) => {
      const slotKey =
        `slot${slotIndex}` as keyof typeof state.saveData.pactspiritPage;
      state.saveData.pactspiritPage[slotKey].pactspiritName = name;
      state.hasUnsavedChanges = true;
    });
  },

  setPactspiritLevel: (slotIndex, level) => {
    internalStore.setState((state) => {
      const slotKey =
        `slot${slotIndex}` as keyof typeof state.saveData.pactspiritPage;
      state.saveData.pactspiritPage[slotKey].level = level;
      state.hasUnsavedChanges = true;
    });
  },

  setRingDestiny: (slotIndex, ringSlot, destiny) => {
    internalStore.setState((state) => {
      const slotKey =
        `slot${slotIndex}` as keyof typeof state.saveData.pactspiritPage;
      state.saveData.pactspiritPage[slotKey].rings[ringSlot] = {
        installedDestiny: destiny,
      };
      state.hasUnsavedChanges = true;
    });
  },

  updatePactspiritSlot: (slotIndex, slot) => {
    internalStore.setState((state) => {
      const slotKey =
        `slot${slotIndex}` as keyof typeof state.saveData.pactspiritPage;
      state.saveData.pactspiritPage[slotKey] = slot;
      state.hasUnsavedChanges = true;
    });
  },

  // Divinity actions
  addSlateToInventory: (slate) => {
    internalStore.setState((state) => {
      state.saveData.divinitySlateList.push(slate);
      state.hasUnsavedChanges = true;
    });
  },

  deleteSlate: (slateId) => {
    internalStore.setState((state) => {
      state.saveData.divinitySlateList =
        state.saveData.divinitySlateList.filter((s) => s.id !== slateId);
      state.saveData.divinityPage.placedSlates =
        state.saveData.divinityPage.placedSlates.filter(
          (p) => p.slateId !== slateId,
        );
      state.hasUnsavedChanges = true;
    });
  },

  placeSlate: (slateId, position) => {
    internalStore.setState((state) => {
      const existing = state.saveData.divinityPage.placedSlates.find(
        (p) => p.slateId === slateId,
      );
      if (existing) {
        existing.position = position;
      } else {
        state.saveData.divinityPage.placedSlates.push({ slateId, position });
      }
      state.hasUnsavedChanges = true;
    });
  },

  removeSlate: (slateId) => {
    internalStore.setState((state) => {
      state.saveData.divinityPage.placedSlates =
        state.saveData.divinityPage.placedSlates.filter(
          (p) => p.slateId !== slateId,
        );
      state.hasUnsavedChanges = true;
    });
  },

  updateSlate: (slateId, updates) => {
    internalStore.setState((state) => {
      const slate = state.saveData.divinitySlateList.find(
        (s) => s.id === slateId,
      );
      if (slate) {
        Object.assign(slate, updates);
      }
      state.hasUnsavedChanges = true;
    });
  },

  // Skills actions
  setActiveSkill: (slot, skillName) => {
    internalStore.setState((state) => {
      const skill = state.saveData.skillPage.activeSkills[slot];
      if (skill !== undefined && skillName !== undefined) {
        skill.skillName = skillName;
      }
      state.hasUnsavedChanges = true;
    });
  },

  setPassiveSkill: (slot, skillName) => {
    internalStore.setState((state) => {
      const skill = state.saveData.skillPage.passiveSkills[slot];
      if (skill !== undefined && skillName !== undefined) {
        skill.skillName = skillName;
      }
      state.hasUnsavedChanges = true;
    });
  },

  setSupportSkill: (skillType, skillSlot, supportSlot, supportName) => {
    internalStore.setState((state) => {
      const skillSlots =
        skillType === "active"
          ? state.saveData.skillPage.activeSkills
          : state.saveData.skillPage.passiveSkills;
      const skill = skillSlots[skillSlot];
      if (skill === undefined) return;
      skill.supportSkills[supportSlot] =
        supportName !== undefined ? { name: supportName } : undefined;
      state.hasUnsavedChanges = true;
    });
  },

  toggleSkillEnabled: (skillType, slot) => {
    internalStore.setState((state) => {
      const skillSlots =
        skillType === "active"
          ? state.saveData.skillPage.activeSkills
          : state.saveData.skillPage.passiveSkills;
      const skill = skillSlots[slot];
      if (skill === undefined) return;
      skill.enabled = !skill.enabled;
      state.hasUnsavedChanges = true;
    });
  },
});

// Create actions singleton
export const actions = createActions();
