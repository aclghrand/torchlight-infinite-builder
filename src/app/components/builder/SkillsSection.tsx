"use client";

import { useCallback, useMemo } from "react";
import { ActiveSkills, PassiveSkills } from "@/src/data/skill";
import type {
  SkillSlot as SkillSlotData,
  SkillSlots,
  SupportSkills,
} from "../../lib/save-data";
import { useBuilderActions, useLoadout } from "../../stores/builderStore";
import { SkillSlot } from "../skills/SkillSlot";

type SkillSlotKey = 1 | 2 | 3 | 4;
type SupportSlotKey = 1 | 2 | 3 | 4 | 5;

const SKILL_SLOT_KEYS: SkillSlotKey[] = [1, 2, 3, 4];

const getSelectedSkillNames = (skills: SkillSlots): string[] => {
  return SKILL_SLOT_KEYS.map((key) => skills[key]?.skillName).filter(
    (name): name is string => name !== undefined,
  );
};

export const SkillsSection = () => {
  const loadout = useLoadout();
  const { updateSaveData } = useBuilderActions();

  const getSelectedActiveSkillNames = useMemo(
    (): string[] => getSelectedSkillNames(loadout.skillPage.activeSkills),
    [loadout.skillPage.activeSkills],
  );

  const getSelectedPassiveSkillNames = useMemo(
    (): string[] => getSelectedSkillNames(loadout.skillPage.passiveSkills),
    [loadout.skillPage.passiveSkills],
  );

  const handleActiveSkillChange = useCallback(
    (slotKey: SkillSlotKey, skillName: string | undefined): void => {
      updateSaveData((prev) => {
        const newSlot: SkillSlotData | undefined =
          skillName !== undefined
            ? { skillName, enabled: true, supportSkills: {} }
            : undefined;
        return {
          ...prev,
          skillPage: {
            ...prev.skillPage,
            activeSkills: {
              ...prev.skillPage.activeSkills,
              [slotKey]: newSlot,
            },
          },
        };
      });
    },
    [updateSaveData],
  );

  const handlePassiveSkillChange = useCallback(
    (slotKey: SkillSlotKey, skillName: string | undefined): void => {
      updateSaveData((prev) => {
        const newSlot: SkillSlotData | undefined =
          skillName !== undefined
            ? { skillName, enabled: true, supportSkills: {} }
            : undefined;
        return {
          ...prev,
          skillPage: {
            ...prev.skillPage,
            passiveSkills: {
              ...prev.skillPage.passiveSkills,
              [slotKey]: newSlot,
            },
          },
        };
      });
    },
    [updateSaveData],
  );

  const handleToggleActiveSkill = useCallback(
    (slotKey: SkillSlotKey): void => {
      updateSaveData((prev) => {
        const currentSlot = prev.skillPage.activeSkills[slotKey];
        if (currentSlot === undefined) return prev;
        return {
          ...prev,
          skillPage: {
            ...prev.skillPage,
            activeSkills: {
              ...prev.skillPage.activeSkills,
              [slotKey]: { ...currentSlot, enabled: !currentSlot.enabled },
            },
          },
        };
      });
    },
    [updateSaveData],
  );

  const handleTogglePassiveSkill = useCallback(
    (slotKey: SkillSlotKey): void => {
      updateSaveData((prev) => {
        const currentSlot = prev.skillPage.passiveSkills[slotKey];
        if (currentSlot === undefined) return prev;
        return {
          ...prev,
          skillPage: {
            ...prev.skillPage,
            passiveSkills: {
              ...prev.skillPage.passiveSkills,
              [slotKey]: { ...currentSlot, enabled: !currentSlot.enabled },
            },
          },
        };
      });
    },
    [updateSaveData],
  );

  const handleActiveSkillLevelChange = useCallback(
    (slotKey: SkillSlotKey, level: number): void => {
      updateSaveData((prev) => {
        const currentSlot = prev.skillPage.activeSkills[slotKey];
        if (currentSlot === undefined) return prev;
        return {
          ...prev,
          skillPage: {
            ...prev.skillPage,
            activeSkills: {
              ...prev.skillPage.activeSkills,
              [slotKey]: { ...currentSlot, level },
            },
          },
        };
      });
    },
    [updateSaveData],
  );

  const handlePassiveSkillLevelChange = useCallback(
    (slotKey: SkillSlotKey, level: number): void => {
      updateSaveData((prev) => {
        const currentSlot = prev.skillPage.passiveSkills[slotKey];
        if (currentSlot === undefined) return prev;
        return {
          ...prev,
          skillPage: {
            ...prev.skillPage,
            passiveSkills: {
              ...prev.skillPage.passiveSkills,
              [slotKey]: { ...currentSlot, level },
            },
          },
        };
      });
    },
    [updateSaveData],
  );

  const handleUpdateActiveSkillSupport = useCallback(
    (
      slotKey: SkillSlotKey,
      supportKey: SupportSlotKey,
      supportName: string | undefined,
    ): void => {
      updateSaveData((prev) => {
        const currentSlot = prev.skillPage.activeSkills[slotKey];
        if (currentSlot === undefined) return prev;
        const newSupportSkills: SupportSkills = {
          ...currentSlot.supportSkills,
          [supportKey]:
            supportName !== undefined ? { name: supportName } : undefined,
        };
        return {
          ...prev,
          skillPage: {
            ...prev.skillPage,
            activeSkills: {
              ...prev.skillPage.activeSkills,
              [slotKey]: { ...currentSlot, supportSkills: newSupportSkills },
            },
          },
        };
      });
    },
    [updateSaveData],
  );

  const handleUpdatePassiveSkillSupport = useCallback(
    (
      slotKey: SkillSlotKey,
      supportKey: SupportSlotKey,
      supportName: string | undefined,
    ): void => {
      updateSaveData((prev) => {
        const currentSlot = prev.skillPage.passiveSkills[slotKey];
        if (currentSlot === undefined) return prev;
        const newSupportSkills: SupportSkills = {
          ...currentSlot.supportSkills,
          [supportKey]:
            supportName !== undefined ? { name: supportName } : undefined,
        };
        return {
          ...prev,
          skillPage: {
            ...prev.skillPage,
            passiveSkills: {
              ...prev.skillPage.passiveSkills,
              [slotKey]: { ...currentSlot, supportSkills: newSupportSkills },
            },
          },
        };
      });
    },
    [updateSaveData],
  );

  const handleUpdateActiveSkillSupportLevel = useCallback(
    (
      slotKey: SkillSlotKey,
      supportKey: SupportSlotKey,
      level: number,
    ): void => {
      updateSaveData((prev) => {
        const currentSlot = prev.skillPage.activeSkills[slotKey];
        if (currentSlot === undefined) return prev;
        const currentSupport = currentSlot.supportSkills[supportKey];
        if (currentSupport === undefined) return prev;
        const newSupportSkills: SupportSkills = {
          ...currentSlot.supportSkills,
          [supportKey]: { ...currentSupport, level },
        };
        return {
          ...prev,
          skillPage: {
            ...prev.skillPage,
            activeSkills: {
              ...prev.skillPage.activeSkills,
              [slotKey]: { ...currentSlot, supportSkills: newSupportSkills },
            },
          },
        };
      });
    },
    [updateSaveData],
  );

  const handleUpdatePassiveSkillSupportLevel = useCallback(
    (
      slotKey: SkillSlotKey,
      supportKey: SupportSlotKey,
      level: number,
    ): void => {
      updateSaveData((prev) => {
        const currentSlot = prev.skillPage.passiveSkills[slotKey];
        if (currentSlot === undefined) return prev;
        const currentSupport = currentSlot.supportSkills[supportKey];
        if (currentSupport === undefined) return prev;
        const newSupportSkills: SupportSkills = {
          ...currentSlot.supportSkills,
          [supportKey]: { ...currentSupport, level },
        };
        return {
          ...prev,
          skillPage: {
            ...prev.skillPage,
            passiveSkills: {
              ...prev.skillPage.passiveSkills,
              [slotKey]: { ...currentSlot, supportSkills: newSupportSkills },
            },
          },
        };
      });
    },
    [updateSaveData],
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-xl font-bold text-zinc-50">Active Skills</h2>

        <div className="space-y-3">
          {SKILL_SLOT_KEYS.map((slotKey) => (
            <SkillSlot
              key={`active-${slotKey}`}
              slotLabel={`Active ${slotKey}`}
              skill={loadout.skillPage.activeSkills[slotKey]}
              availableSkills={ActiveSkills}
              excludedSkillNames={getSelectedActiveSkillNames}
              onSkillChange={(skillName) =>
                handleActiveSkillChange(slotKey, skillName)
              }
              onToggle={() => handleToggleActiveSkill(slotKey)}
              onLevelChange={(level) =>
                handleActiveSkillLevelChange(slotKey, level)
              }
              onUpdateSupport={(supportKey, supportName) =>
                handleUpdateActiveSkillSupport(slotKey, supportKey, supportName)
              }
              onUpdateSupportLevel={(supportKey, level) =>
                handleUpdateActiveSkillSupportLevel(slotKey, supportKey, level)
              }
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-bold text-zinc-50">Passive Skills</h2>

        <div className="space-y-3">
          {SKILL_SLOT_KEYS.map((slotKey) => (
            <SkillSlot
              key={`passive-${slotKey}`}
              slotLabel={`Passive ${slotKey}`}
              skill={loadout.skillPage.passiveSkills[slotKey]}
              availableSkills={PassiveSkills}
              excludedSkillNames={getSelectedPassiveSkillNames}
              onSkillChange={(skillName) =>
                handlePassiveSkillChange(slotKey, skillName)
              }
              onToggle={() => handleTogglePassiveSkill(slotKey)}
              onLevelChange={(level) =>
                handlePassiveSkillLevelChange(slotKey, level)
              }
              onUpdateSupport={(supportKey, supportName) =>
                handleUpdatePassiveSkillSupport(
                  slotKey,
                  supportKey,
                  supportName,
                )
              }
              onUpdateSupportLevel={(supportKey, level) =>
                handleUpdatePassiveSkillSupportLevel(slotKey, supportKey, level)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};
