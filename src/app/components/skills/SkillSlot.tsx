"use client";

import { useMemo, useState } from "react";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/src/app/components/ui/SearchableSelect";
import type { SkillSlot as SkillSlotType } from "@/src/app/lib/save-data";
import type { BaseActiveSkill, BaseSkill } from "@/src/data/skill/types";
import { SupportSkillSelector } from "./SupportSkillSelector";

type SupportSlotKey = 1 | 2 | 3 | 4 | 5;

const SUPPORT_SLOT_KEYS: SupportSlotKey[] = [1, 2, 3, 4, 5];

interface SkillSlotProps {
  slotLabel: string;
  skill: SkillSlotType | undefined;
  availableSkills: readonly (BaseActiveSkill | BaseSkill)[];
  excludedSkillNames: string[];
  onSkillChange: (skillName: string | undefined) => void;
  onToggle: () => void;
  onUpdateSupport: (
    supportKey: SupportSlotKey,
    supportName: string | undefined,
  ) => void;
}

export const SkillSlot: React.FC<SkillSlotProps> = ({
  slotLabel,
  skill,
  availableSkills,
  excludedSkillNames,
  onSkillChange,
  onToggle,
  onUpdateSupport,
}) => {
  const [expanded, setExpanded] = useState(false);

  const mainSkill = useMemo(
    () => availableSkills.find((s) => s.name === skill?.skillName),
    [availableSkills, skill?.skillName],
  );

  const selectedSupports = skill
    ? SUPPORT_SLOT_KEYS.map((key) => skill.supportSkills[key]?.name).filter(
        (name): name is string => name !== undefined,
      )
    : [];

  const supportCount = selectedSupports.length;
  const hasSkill = skill?.skillName !== undefined;

  // Filter available skills to exclude already-selected ones (but keep current selection)
  const filteredSkills = availableSkills.filter(
    (s) => s.name === skill?.skillName || !excludedSkillNames.includes(s.name),
  );

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-700">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={skill?.enabled ?? false}
            onChange={onToggle}
            disabled={!hasSkill}
            className="w-5 h-5 disabled:opacity-50 accent-amber-500"
          />
          <span className="text-xs text-zinc-500 w-16">{slotLabel}</span>
          <SearchableSelect
            value={skill?.skillName}
            onChange={onSkillChange}
            options={filteredSkills.map(
              (s): SearchableSelectOption<string> => ({
                value: s.name,
                label: s.name,
              }),
            )}
            placeholder="<Empty slot>"
            size="sm"
            className="flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          {hasSkill && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-3 py-1 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-amber-500 rounded text-sm text-zinc-400"
            >
              {expanded ? "Hide" : "Supports"} ({supportCount}/5)
            </button>
          )}
        </div>
      </div>

      {expanded && hasSkill && skill !== undefined && (
        <div className="px-4 pb-4 border-t border-zinc-800 pt-3">
          <div className="space-y-2">
            {SUPPORT_SLOT_KEYS.map((supportKey) => (
              <div
                key={`support-${supportKey}`}
                className="flex items-center gap-2"
              >
                <span className="text-xs text-zinc-500 w-6">{supportKey}.</span>
                <SupportSkillSelector
                  mainSkill={mainSkill}
                  selectedSkill={skill.supportSkills[supportKey]?.name}
                  excludedSkills={selectedSupports.filter(
                    (s) => s !== skill.supportSkills[supportKey]?.name,
                  )}
                  onChange={(supportName) =>
                    onUpdateSupport(supportKey, supportName)
                  }
                  slotIndex={supportKey}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
