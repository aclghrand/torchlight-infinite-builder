import { Trans } from "@lingui/react/macro";
import React from "react";
import { Tooltip, TooltipTitle } from "@/src/components/ui/Tooltip";
import type { BaseCoreTalent } from "@/src/data/core-talent";
import { CoreTalentMods } from "@/src/data/core-talent/core-talent-mods";
import type { CoreTalentName } from "@/src/data/core-talent/types";
import { useTooltip } from "@/src/hooks/useTooltip";
import {
  getAvailableGodGoddessCoreTalents,
  getAvailableProfessionCoreTalents,
  getMaxCoreTalentSlots,
  isGodGoddessTree,
  type TreeSlot,
} from "@/src/lib/core-talent-utils";
import { i18n } from "@/src/lib/i18n";
import type { Affix } from "@/src/tli/core";

interface CoreTalentSelectorProps {
  treeName: string;
  treeSlot: TreeSlot;
  selectedCoreTalents: string[];
  onSelectCoreTalent: (
    slotIndex: number,
    talentName: string | undefined,
  ) => void;
  replacedByPrism?: Affix; // Ethereal talent affix if prism replaces core talents
}

interface SlotConfig {
  index: number;
  label: string;
  available: BaseCoreTalent[];
  selected: string | undefined;
}

export const CoreTalentSelector: React.FC<CoreTalentSelectorProps> = ({
  treeName,
  treeSlot,
  selectedCoreTalents,
  onSelectCoreTalent,
  replacedByPrism,
}) => {
  const isGodTree = isGodGoddessTree(treeName);
  const maxSlots = getMaxCoreTalentSlots(treeSlot);

  const slots: SlotConfig[] = [];

  if (isGodTree) {
    const { firstSlot, secondSlot } = getAvailableGodGoddessCoreTalents(
      treeName,
      selectedCoreTalents,
    );

    slots.push({
      index: 0,
      label: i18n._("Core Talent 1"),
      available: firstSlot,
      selected: selectedCoreTalents[0],
    });

    slots.push({
      index: 1,
      label: i18n._("Core Talent 2"),
      available: secondSlot,
      selected: selectedCoreTalents[1],
    });
  } else {
    const available = getAvailableProfessionCoreTalents(
      treeName,
      selectedCoreTalents,
    );

    slots.push({
      index: 0,
      label: "Core Talent",
      available,
      selected: selectedCoreTalents[0],
    });
  }

  // If core talents are replaced by a prism, show disabled state
  if (replacedByPrism !== undefined) {
    return (
      <div className="bg-zinc-900 rounded-lg p-4 border border-purple-500/50 mb-4 opacity-60">
        <h3 className="text-lg font-semibold mb-3 text-zinc-400">
          <Trans>Core Talents</Trans>
        </h3>
        <div className="text-sm text-purple-400">
          Replaced by Prism Ethereal Talent
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700 mb-4">
      <h3 className="text-lg font-semibold mb-3 text-zinc-50">
        <Trans>Core Talents</Trans>
      </h3>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${maxSlots}, 1fr)` }}
      >
        {slots.map((slot) => (
          <CoreTalentSlot
            key={slot.index}
            label={slot.label}
            available={slot.available}
            selected={slot.selected}
            onSelect={(name) => onSelectCoreTalent(slot.index, name)}
          />
        ))}
      </div>
    </div>
  );
};

interface CoreTalentSlotProps {
  label: string;
  available: BaseCoreTalent[];
  selected: string | undefined;
  onSelect: (name: string | undefined) => void;
}

const CoreTalentSlot: React.FC<CoreTalentSlotProps> = ({
  label,
  available,
  selected,
  onSelect,
}) => {
  const { isVisible, triggerRef, triggerRect } = useTooltip();
  const [hoveredTalent, setHoveredTalent] = React.useState<
    BaseCoreTalent | undefined
  >();

  // Clear hoveredTalent when tooltip hides (after the useTooltip delay)
  React.useEffect(() => {
    if (!isVisible) {
      setHoveredTalent(undefined);
    }
  }, [isVisible]);

  return (
    <div
      className={`p-3 rounded-lg border ${
        selected !== undefined
          ? "border-amber-500 bg-amber-500/10"
          : "border-zinc-600 bg-zinc-800"
      }`}
      ref={triggerRef}
    >
      <div className="text-xs text-zinc-400 mb-2">{i18n._(label)}</div>

      <div className="space-y-1">
        {available.map((ct) => {
          const isSelected = ct.name === selected;
          return (
            <button
              key={ct.name}
              onClick={() => onSelect(isSelected ? undefined : ct.name)}
              onMouseEnter={() => setHoveredTalent(ct)}
              className={`w-full px-3 py-2 border rounded-lg text-sm text-left transition-colors ${
                isSelected
                  ? "border-amber-500 bg-amber-500/20 text-amber-400"
                  : "border-zinc-700 bg-zinc-800 text-zinc-50 hover:border-amber-500/50"
              }`}
            >
              {i18n._(ct.name)}
            </button>
          );
        })}
      </div>

      <Tooltip
        isVisible={isVisible && hoveredTalent !== undefined}
        triggerRect={triggerRect}
        variant="legendary"
      >
        {hoveredTalent !== undefined && (
          <>
            <TooltipTitle>{hoveredTalent.name}</TooltipTitle>
            <div>
              {CoreTalentMods[
                hoveredTalent.name as CoreTalentName
              ].affixLines.map((line, idx) => (
                <div
                  key={idx}
                  className={
                    idx > 0 ? "mt-1 pt-1 border-t border-zinc-800" : ""
                  }
                >
                  <div className="text-xs text-zinc-300">{line.text}</div>
                  {line.mods === undefined && (
                    <div className="text-xs text-red-500">
                      (Mod not supported in TOB yet)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Tooltip>
    </div>
  );
};
