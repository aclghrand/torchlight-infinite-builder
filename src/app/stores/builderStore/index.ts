// Public exports - NO direct saveData access possible
export { useBuilderActions } from "./hooks";
export { useSaveDataRaw } from "./raw-access";
export {
  useBuilderState,
  useCurrentSaveId,
  useCurrentSaveName,
  useHasUnsavedChanges,
  useLoadout,
  useSavesIndex,
  useTalentTree,
} from "./selectors";
export type {
  // Re-exported types for action parameters
  AllocatedTalentNode,
  BuilderActions,
  BuilderReadableState,
  CraftedInverseImage,
  CraftedPrism,
  DivinitySlate,
  Gear,
  GearSlot,
  HeroMemory,
  HeroMemorySlot,
  PactspiritSlot,
  PactspiritSlotIndex,
  ReflectedAllocatedNode,
  RingSlotKey,
  RingSlotState,
  SaveData,
  SaveDataUpdater,
  SavesIndex,
  SkillSlot,
  SkillSlots,
  SupportSkill,
  SupportSkills,
  TreeSlot,
} from "./types";

// DO NOT export:
// - internalStore (the actual zustand store)
// - anything from internal.ts
