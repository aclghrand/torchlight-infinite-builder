import { useEffect, useState } from "react";
import { SearchableSelect } from "@/src/components/ui/SearchableSelect";
import type {
  ActivationMediumAffixDef,
  ActivationMediumSkillNmae,
  BaseActivationMediumSkill,
} from "@/src/data/skill/types";
import {
  craftAffix,
  getAffixesForTier,
  getExclusiveGroups,
  hasValueRange,
} from "@/src/lib/activation-medium-utils";
import type { ActivationMediumSkillSlot as SaveDataActivationMediumSkillSlot } from "@/src/lib/save-data";
import type { ActivationMediumSkillSlot } from "@/src/tli/core";
import {
  Modal,
  ModalActions,
  ModalButton,
  ModalDescription,
} from "../ui/Modal";

interface ActivationMediumEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill: BaseActivationMediumSkill;
  currentSlot: ActivationMediumSkillSlot; // Loadout type for reading
  onConfirm: (slot: SaveDataActivationMediumSkillSlot) => void; // SaveData type for writing
}

const TIER_OPTIONS = [
  { value: 0 as const, label: "Tier 0 (Best)" },
  { value: 1 as const, label: "Tier 1" },
  { value: 2 as const, label: "Tier 2" },
  { value: 3 as const, label: "Tier 3 (Worst)" },
];

interface AffixState {
  percentage: number;
  selected: boolean;
}

export const ActivationMediumEditModal = ({
  isOpen,
  onClose,
  skill,
  currentSlot,
  onConfirm,
}: ActivationMediumEditModalProps): React.ReactNode => {
  const [tier, setTier] = useState<0 | 1 | 2 | 3>(currentSlot.tier);
  const [affixStates, setAffixStates] = useState<Map<number, AffixState>>(
    new Map(),
  );

  const tierAffixes = getAffixesForTier(skill, tier);
  const exclusiveGroups = getExclusiveGroups(tierAffixes);

  // Initialize affix states when modal opens or tier changes
  useEffect(() => {
    if (isOpen) {
      const newStates = new Map<number, AffixState>();
      const usedGroups = new Set<string>();

      tierAffixes.forEach((affix, index) => {
        const exclusiveGroup = affix.exclusiveGroup;
        const isInExclusiveGroup = exclusiveGroup !== undefined;
        const isFirstInGroup =
          isInExclusiveGroup && !usedGroups.has(exclusiveGroup);

        if (isInExclusiveGroup) {
          usedGroups.add(exclusiveGroup);
        }

        newStates.set(index, {
          percentage: 0, // Start at worst quality
          selected: !isInExclusiveGroup || isFirstInGroup,
        });
      });

      setAffixStates(newStates);
    }
  }, [isOpen, tierAffixes]);

  // When tier changes, reset percentage to 0 (minimum value for new tier)
  const handleTierChange = (newTier: 0 | 1 | 2 | 3): void => {
    setTier(newTier);
  };

  const handlePercentageChange = (
    affixIndex: number,
    percentage: number,
  ): void => {
    setAffixStates((prev) => {
      const newMap = new Map(prev);
      const state = newMap.get(affixIndex);
      if (state !== undefined) {
        newMap.set(affixIndex, { ...state, percentage });
      }
      return newMap;
    });
  };

  const handleExclusiveSelection = (
    affixIndex: number,
    groupName: string,
  ): void => {
    const groupIndices = exclusiveGroups.get(groupName) ?? [];
    setAffixStates((prev) => {
      const newMap = new Map(prev);
      for (const idx of groupIndices) {
        const state = newMap.get(idx);
        if (state !== undefined) {
          newMap.set(idx, { ...state, selected: idx === affixIndex });
        }
      }
      return newMap;
    });
  };

  const handleConfirm = (): void => {
    const affixes: string[] = [];

    tierAffixes.forEach((affixDef, index) => {
      const state = affixStates.get(index);
      if (state === undefined || !state.selected) return;

      const interpolated = craftAffix(affixDef.affix, state.percentage);
      affixes.push(interpolated);
    });

    onConfirm({
      skillType: "activation_medium",
      name: currentSlot.name as ActivationMediumSkillNmae,
      tier,
      affixes,
    });
    onClose();
  };

  // Get a label for an exclusive affix option
  const getExclusiveLabel = (
    affixText: string,
    fallbackIndex: number,
  ): string => {
    const text = affixText.toLowerCase();
    if (text.includes("cooldown recovery speed")) return "Cooldown Recovery";
    if (text.includes("duration")) return "Duration";
    return `Option ${fallbackIndex + 1}`;
  };

  const renderNonExclusiveAffix = (
    affixDef: ActivationMediumAffixDef,
    index: number,
  ): React.ReactNode => {
    const state = affixStates.get(index);
    if (state === undefined) return null;

    const hasRange = hasValueRange(affixDef.affix);
    const previewText = craftAffix(affixDef.affix, state.percentage);

    return (
      <div key={index} className="mb-4 last:mb-0">
        {/* Quality slider (only if affix has range) */}
        {hasRange && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-zinc-400">Quality</label>
              <span className="text-sm font-medium text-zinc-50">
                {state.percentage}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={state.percentage}
              onChange={(e) =>
                handlePercentageChange(index, parseInt(e.target.value, 10))
              }
              className="w-full"
            />
          </div>
        )}

        {/* Preview text */}
        <div className="mt-2 text-sm text-amber-400">{previewText}</div>
      </div>
    );
  };

  const renderExclusiveGroup = (
    groupName: string,
    affixes: Array<{ affix: ActivationMediumAffixDef; index: number }>,
  ): React.ReactNode => {
    // Find currently selected affix in this group
    const selectedEntry = affixes.find(({ index }) => {
      const state = affixStates.get(index);
      return state?.selected === true;
    });
    const selectedIndex = selectedEntry?.index;
    const selectedAffix = selectedEntry?.affix;
    const selectedState =
      selectedIndex !== undefined ? affixStates.get(selectedIndex) : undefined;

    const options = affixes.map(({ affix, index }, i) => ({
      value: index,
      label: getExclusiveLabel(affix.affix, i),
    }));

    const hasRange =
      selectedAffix !== undefined && hasValueRange(selectedAffix.affix);
    const previewText =
      selectedAffix !== undefined && selectedState !== undefined
        ? craftAffix(selectedAffix.affix, selectedState.percentage)
        : "";

    return (
      <div key={groupName} className="mb-4">
        <SearchableSelect
          value={selectedIndex}
          onChange={(val) =>
            val !== undefined && handleExclusiveSelection(val, groupName)
          }
          options={options}
          placeholder="Select option"
          size="sm"
        />

        {/* Quality slider for selected option */}
        {selectedIndex !== undefined &&
          selectedState !== undefined &&
          hasRange && (
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm text-zinc-400">Quality</label>
                <span className="text-sm font-medium text-zinc-50">
                  {selectedState.percentage}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedState.percentage}
                onChange={(e) =>
                  handlePercentageChange(
                    selectedIndex,
                    parseInt(e.target.value, 10),
                  )
                }
                className="w-full"
              />
            </div>
          )}

        {/* Preview text */}
        {selectedIndex !== undefined && (
          <div className="mt-2 text-sm text-amber-400">{previewText}</div>
        )}
      </div>
    );
  };

  // Group affixes: first show exclusive groups, then non-exclusive
  const nonExclusiveAffixes = tierAffixes
    .map((affix, index) => ({ affix, index }))
    .filter(({ affix }) => affix.exclusiveGroup === undefined);

  const exclusiveAffixesByGroup: Array<{
    groupName: string;
    affixes: Array<{ affix: ActivationMediumAffixDef; index: number }>;
  }> = [];
  exclusiveGroups.forEach((indices, groupName) => {
    exclusiveAffixesByGroup.push({
      groupName,
      affixes: indices.map((idx) => ({ affix: tierAffixes[idx], index: idx })),
    });
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Activation Medium"
      maxWidth="md"
    >
      <ModalDescription>{skill.name}</ModalDescription>

      <div className="space-y-4">
        {/* Tier selector */}
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Tier</label>
          <SearchableSelect
            value={tier}
            onChange={(val) => val !== undefined && handleTierChange(val)}
            options={TIER_OPTIONS}
            placeholder="Select tier"
          />
        </div>

        {/* Affix controls */}
        {tierAffixes.length > 0 && (
          <div className="border-t border-zinc-800 pt-4">
            <label className="block text-sm text-zinc-400 mb-3">Affixes</label>

            {/* Exclusive groups first */}
            {exclusiveAffixesByGroup.length > 0 && (
              <div className="mb-4">
                {exclusiveAffixesByGroup.map(({ groupName, affixes }) =>
                  renderExclusiveGroup(groupName, affixes),
                )}
              </div>
            )}

            {/* Non-exclusive affixes */}
            {nonExclusiveAffixes.length > 0 && (
              <div
                className={
                  exclusiveAffixesByGroup.length > 0
                    ? "border-t border-zinc-800 pt-4"
                    : ""
                }
              >
                {nonExclusiveAffixes.map(({ affix, index }) =>
                  renderNonExclusiveAffix(affix, index),
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4">
        <ModalActions>
          <ModalButton onClick={handleConfirm} fullWidth>
            Confirm
          </ModalButton>
          <ModalButton onClick={onClose} variant="secondary">
            Cancel
          </ModalButton>
        </ModalActions>
      </div>
    </Modal>
  );
};
