"use client";

import { useCallback, useMemo } from "react";
import { useBuilderStore } from "../../stores/builderStore";
import { SkillSlot } from "../skills/SkillSlot";
import { ActiveSkills, PassiveSkills } from "@/src/data/skill";
import { SupportSkills } from "../../lib/save-data";

type ActiveSkillSlot =
  | "activeSkill1"
  | "activeSkill2"
  | "activeSkill3"
  | "activeSkill4";
type PassiveSkillSlot =
  | "passiveSkill1"
  | "passiveSkill2"
  | "passiveSkill3"
  | "passiveSkill4";
type SkillSlotKey = ActiveSkillSlot | PassiveSkillSlot;
type SupportSkillKey = keyof SupportSkills;

const ACTIVE_SKILL_SLOTS: ActiveSkillSlot[] = [
  "activeSkill1",
  "activeSkill2",
  "activeSkill3",
  "activeSkill4",
];

const PASSIVE_SKILL_SLOTS: PassiveSkillSlot[] = [
  "passiveSkill1",
  "passiveSkill2",
  "passiveSkill3",
  "passiveSkill4",
];

export const SkillsSection = () => {
  const loadout = useBuilderStore((state) => state.loadout);
  const updateLoadout = useBuilderStore((state) => state.updateLoadout);

  const getSelectedActiveSkillNames = useMemo((): string[] => {
    return ACTIVE_SKILL_SLOTS.map(
      (slot) => loadout.skillPage[slot].skillName,
    ).filter((name): name is string => name !== undefined);
  }, [loadout.skillPage]);

  const getSelectedPassiveSkillNames = useMemo((): string[] => {
    return PASSIVE_SKILL_SLOTS.map(
      (slot) => loadout.skillPage[slot].skillName,
    ).filter((name): name is string => name !== undefined);
  }, [loadout.skillPage]);

  const handleSkillChange = useCallback(
    (slotKey: SkillSlotKey, skillName: string | undefined): void => {
      updateLoadout((prev) => ({
        ...prev,
        skillPage: {
          ...prev.skillPage,
          [slotKey]: {
            ...prev.skillPage[slotKey],
            skillName,
            supportSkills: {},
          },
        },
      }));
    },
    [updateLoadout],
  );

  const handleToggleSkill = useCallback(
    (slotKey: SkillSlotKey): void => {
      updateLoadout((prev) => ({
        ...prev,
        skillPage: {
          ...prev.skillPage,
          [slotKey]: {
            ...prev.skillPage[slotKey],
            enabled: !prev.skillPage[slotKey].enabled,
          },
        },
      }));
    },
    [updateLoadout],
  );

  const handleUpdateSkillSupport = useCallback(
    (
      slotKey: SkillSlotKey,
      supportKey: SupportSkillKey,
      supportName: string | undefined,
    ): void => {
      updateLoadout((prev) => ({
        ...prev,
        skillPage: {
          ...prev.skillPage,
          [slotKey]: {
            ...prev.skillPage[slotKey],
            supportSkills: {
              ...prev.skillPage[slotKey].supportSkills,
              [supportKey]: supportName,
            },
          },
        },
      }));
    },
    [updateLoadout],
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-xl font-bold text-zinc-50">Active Skills</h2>

        <div className="space-y-3">
          {ACTIVE_SKILL_SLOTS.map((slotKey, index) => (
            <SkillSlot
              key={slotKey}
              slotLabel={`Active ${index + 1}`}
              skill={loadout.skillPage[slotKey]}
              availableSkills={ActiveSkills}
              excludedSkillNames={getSelectedActiveSkillNames}
              onSkillChange={(skillName) => handleSkillChange(slotKey, skillName)}
              onToggle={() => handleToggleSkill(slotKey)}
              onUpdateSupport={(supportKey, supportName) =>
                handleUpdateSkillSupport(slotKey, supportKey, supportName)
              }
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-bold text-zinc-50">Passive Skills</h2>

        <div className="space-y-3">
          {PASSIVE_SKILL_SLOTS.map((slotKey, index) => (
            <SkillSlot
              key={slotKey}
              slotLabel={`Passive ${index + 1}`}
              skill={loadout.skillPage[slotKey]}
              availableSkills={PassiveSkills}
              excludedSkillNames={getSelectedPassiveSkillNames}
              onSkillChange={(skillName) => handleSkillChange(slotKey, skillName)}
              onToggle={() => handleToggleSkill(slotKey)}
              onUpdateSupport={(supportKey, supportName) =>
                handleUpdateSkillSupport(slotKey, supportKey, supportName)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};
