import type React from "react";
import { ModNotImplementedIcon } from "@/src/components/ui/ModNotImplementedIcon";
import type { TreeSlot } from "@/src/lib/types";
import { useTalentTree } from "@/src/stores/builderStore";
import type { PlacedPrism } from "@/src/tli/core";

interface PrismCoreTalentEffectProps {
  placedPrism: PlacedPrism | undefined;
  activeTreeSlot: TreeSlot;
}

const PrismIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2L2 12L12 22L22 12L12 2Z" fill="currentColor" opacity="0.3" />
    <path
      d="M12 2L2 12L12 22L22 12L12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PrismCoreTalentEffect: React.FC<PrismCoreTalentEffectProps> = ({
  placedPrism,
  activeTreeSlot,
}) => {
  const tree = useTalentTree(activeTreeSlot);

  if (!placedPrism || placedPrism.treeSlot !== activeTreeSlot) {
    return null;
  }

  // Check for "Adds" effect (rare prisms) - from parsed loadout
  const additionalAffix = tree?.additionalCoreTalentPrismAffix;

  // Check for "Replaces" effect (legendary prisms) - from parsed loadout
  const replacedTalent = tree?.replacementPrismCoreTalent;

  // Display "Adds" effect
  if (additionalAffix !== undefined) {
    return (
      <div className="mb-4 rounded-lg border border-purple-500/50 bg-purple-500/10 p-4">
        <div className="mb-2 flex items-center gap-2">
          <PrismIcon className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-400">
            Prism Core Talent Effect
          </span>
        </div>
        <ul className="space-y-1">
          {additionalAffix.affixLines.map((line, idx) => (
            <li key={idx} className="text-sm text-blue-400 flex items-center">
              <span>{line.text}</span>
              {line.mods === undefined && <ModNotImplementedIcon />}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Display "Replaces" ethereal talent
  if (replacedTalent) {
    return (
      <div className="mb-4 rounded-lg border border-purple-500/50 bg-purple-500/10 p-4">
        <div className="mb-2 flex items-center gap-2">
          <PrismIcon className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-400">
            Prism Ethereal Talent
          </span>
        </div>
        <div className="text-sm font-medium text-amber-400">
          {replacedTalent}
        </div>
      </div>
    );
  }

  return null;
};
