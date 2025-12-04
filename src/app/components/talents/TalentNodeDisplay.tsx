import { TalentNodeData } from "@/src/tli/talent_tree";
import { CraftedPrism, CraftedInverseImage } from "@/src/app/lib/save-data";
import type { NodeBonusAffix } from "@/src/app/lib/prism-utils";
import type { InverseImageBonusAffix } from "@/src/app/lib/inverse-image-utils";
import { formatEffectModifier } from "@/src/app/lib/inverse-image-utils";
import { useTooltip } from "@/src/app/hooks/useTooltip";
import {
  Tooltip,
  TooltipTitle,
  TooltipContent,
} from "@/src/app/components/ui/Tooltip";

type BonusAffix = NodeBonusAffix | InverseImageBonusAffix;

interface TalentNodeDisplayProps {
  node: TalentNodeData;
  allocated: number;
  canAllocate: boolean;
  canDeallocate: boolean;
  onAllocate: () => void;
  onDeallocate: () => void;
  hasPrism?: boolean;
  prism?: CraftedPrism;
  isSelectingPrism?: boolean;
  onPlacePrism?: () => void;
  onRemovePrism?: () => void;
  canRemovePrism?: boolean;
  bonusAffixes?: BonusAffix[];
  hasInverseImage?: boolean;
  inverseImage?: CraftedInverseImage;
  isSelectingInverseImage?: boolean;
  onPlaceInverseImage?: () => void;
  onRemoveInverseImage?: () => void;
  canRemoveInverseImage?: boolean;
  isInSourceArea?: boolean;
  isInTargetArea?: boolean;
  reflectedNodeData?: TalentNodeData;
}

export const TalentNodeDisplay: React.FC<TalentNodeDisplayProps> = ({
  node,
  allocated,
  canAllocate,
  canDeallocate,
  onAllocate,
  onDeallocate,
  hasPrism = false,
  prism,
  isSelectingPrism = false,
  onPlacePrism,
  onRemovePrism,
  canRemovePrism = false,
  bonusAffixes = [],
  hasInverseImage = false,
  inverseImage,
  isSelectingInverseImage = false,
  onPlaceInverseImage,
  onRemoveInverseImage,
  canRemoveInverseImage = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for future visual styling
  isInSourceArea = false,
  isInTargetArea = false,
  reflectedNodeData,
}) => {
  const { isHovered, mousePos, handlers } = useTooltip();

  const isFullyAllocated = allocated >= node.maxPoints;
  const isLocked = !canAllocate && allocated === 0;
  const isLegendary = node.nodeType === "legendary";
  const canPlacePrism =
    isSelectingPrism && allocated === 0 && !hasPrism && !hasInverseImage;
  const canPlaceInverseImage =
    isSelectingInverseImage &&
    allocated === 0 &&
    !hasInverseImage &&
    !hasPrism &&
    node.position.x !== 3; // Not in center column

  const talentTypeName =
    node.nodeType === "micro"
      ? "Micro Talent"
      : node.nodeType === "medium"
        ? "Medium Talent"
        : "Legendary Talent";

  const handleClick = () => {
    if (canPlacePrism && onPlacePrism) {
      onPlacePrism();
    } else if (canPlaceInverseImage && onPlaceInverseImage) {
      onPlaceInverseImage();
    }
  };

  // Prism node rendering
  if (hasPrism && prism) {
    return (
      <div
        className="relative w-20 h-20 rounded-lg border-2 transition-all border-purple-500 bg-purple-500/15 cursor-default"
        {...handlers}
      >
        {/* Prism Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-10 h-10 text-purple-400"
            >
              <path
                d="M12 2L2 12L12 22L22 12L12 2Z"
                fill="currentColor"
                opacity="0.3"
              />
              <path
                d="M12 2L2 12L12 22L22 12L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M12 2V22" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 12H22" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Prism Label */}
        <div className="absolute bottom-0 left-0 right-0 bg-purple-900/70 text-purple-200 text-xs text-center py-0.5 rounded-b-md">
          Prism
        </div>

        {/* Remove Button (shown on hover) */}
        {isHovered && onRemovePrism && (
          <div className="absolute -top-2 -right-2 flex gap-1">
            <button
              onClick={canRemovePrism ? onRemovePrism : undefined}
              disabled={!canRemovePrism}
              className={`w-5 h-5 rounded-full text-white text-xs font-bold ${
                canRemovePrism
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              }`}
              title={
                canRemovePrism
                  ? "Remove prism"
                  : "Cannot remove: dependent nodes have points allocated"
              }
            >
              ×
            </button>
          </div>
        )}

        <Tooltip isVisible={isHovered} mousePos={mousePos} variant="prism">
          <TooltipTitle>
            <span className="text-purple-400">
              {prism.rarity === "legendary" ? "Legendary" : "Rare"} Prism
            </span>
          </TooltipTitle>
          <TooltipContent>{prism.baseAffix}</TooltipContent>
          {prism.gaugeAffixes.length > 0 && (
            <div className="mt-2 pt-2 border-t border-zinc-700">
              <div className="text-xs text-zinc-500 mb-1">Gauge Affixes:</div>
              {prism.gaugeAffixes.map((affix, idx) => (
                <div key={idx} className="text-xs text-zinc-400">
                  {affix}
                </div>
              ))}
            </div>
          )}
        </Tooltip>
      </div>
    );
  }

  // Inverse image node rendering
  if (hasInverseImage && inverseImage) {
    return (
      <div
        className="relative w-20 h-20 rounded-lg border-2 transition-all border-cyan-500 bg-cyan-500/15 cursor-default"
        {...handlers}
      >
        {/* Inverse Image Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-10 h-10 text-cyan-400"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
                fill="currentColor"
                opacity="0.3"
              />
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M12 3V21" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M6 8L10 12L6 16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18 8L14 12L18 16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Inverse Image Label */}
        <div className="absolute bottom-0 left-0 right-0 bg-cyan-900/70 text-cyan-200 text-xs text-center py-0.5 rounded-b-md">
          Inverse
        </div>

        {/* Remove Button (shown on hover) */}
        {isHovered && onRemoveInverseImage && (
          <div className="absolute -top-2 -right-2 flex gap-1">
            <button
              onClick={canRemoveInverseImage ? onRemoveInverseImage : undefined}
              disabled={!canRemoveInverseImage}
              className={`w-5 h-5 rounded-full text-white text-xs font-bold ${
                canRemoveInverseImage
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              }`}
              title={
                canRemoveInverseImage
                  ? "Remove inverse image"
                  : "Cannot remove: tree must have 0 allocated points"
              }
            >
              ×
            </button>
          </div>
        )}

        <Tooltip isVisible={isHovered} mousePos={mousePos} variant="default">
          <TooltipTitle>
            <span className="text-cyan-400">Inverse Image</span>
          </TooltipTitle>
          <TooltipContent>
            Reflects all Talents within the range to the mirrored area. All
            Talents within the reflected area have no prerequisites.
          </TooltipContent>
          <div className="mt-2 pt-2 border-t border-zinc-700">
            <div className="text-xs text-zinc-500 mb-1">Effect Modifiers:</div>
            <div className="text-xs text-blue-400">
              {formatEffectModifier(inverseImage.microTalentEffect)} all
              reflected Micro Talent Effects
            </div>
            <div className="text-xs text-blue-400">
              {formatEffectModifier(inverseImage.mediumTalentEffect)} all
              reflected Medium Talent Effects
            </div>
            <div className="text-xs text-blue-400">
              {formatEffectModifier(inverseImage.legendaryTalentEffect)} all
              reflected Legendary Medium Talent Effects
            </div>
          </div>
        </Tooltip>
      </div>
    );
  }

  // Reflected node rendering (in target area with reflected node data)
  if (isInTargetArea && reflectedNodeData) {
    const reflectedTypeName =
      reflectedNodeData.nodeType === "micro"
        ? "Micro Talent"
        : reflectedNodeData.nodeType === "medium"
          ? "Medium Talent"
          : "Legendary Talent";

    const reflectedIsFullyAllocated = allocated >= reflectedNodeData.maxPoints;

    return (
      <div
        className={`relative w-20 h-20 rounded-lg border-2 transition-all ${
          reflectedIsFullyAllocated
            ? "border-cyan-500 bg-cyan-500/20"
            : allocated > 0
              ? "border-cyan-400 bg-cyan-500/15"
              : "border-cyan-600 bg-cyan-500/10"
        }`}
        {...handlers}
      >
        {/* Reflected Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- dynamic game assets */}
          <img
            src={`/tli/talents/${reflectedNodeData.iconName}.webp`}
            alt={reflectedNodeData.iconName}
            className="w-12 h-12 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        {/* Points Display */}
        <div className="absolute bottom-0 left-0 right-0 bg-cyan-900/70 text-cyan-200 text-xs text-center py-0.5 rounded-b-md">
          {allocated}/{reflectedNodeData.maxPoints}
        </div>

        {/* Allocation Buttons */}
        <div className="absolute -top-2 -right-2 flex gap-1">
          <button
            onClick={onAllocate}
            disabled={!canAllocate}
            className={`
              w-5 h-5 rounded-full text-white text-xs font-bold
              ${
                canAllocate
                  ? "bg-cyan-500 hover:bg-cyan-400"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              }
            `}
          >
            +
          </button>
          <button
            onClick={onDeallocate}
            disabled={!canDeallocate}
            className={`
              w-5 h-5 rounded-full text-white text-xs font-bold
              ${
                canDeallocate
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              }
            `}
          >
            -
          </button>
        </div>

        <Tooltip isVisible={isHovered} mousePos={mousePos} variant="default">
          <TooltipTitle>
            <span className="text-cyan-400">{reflectedTypeName} (Reflected)</span>
          </TooltipTitle>
          <TooltipContent>{reflectedNodeData.rawAffix}</TooltipContent>
          {bonusAffixes.length > 0 && (
            <div className="mt-2 pt-2 border-t border-blue-500/30">
              {bonusAffixes.map((bonus, idx) => (
                <div
                  key={idx}
                  className="text-xs text-blue-400 whitespace-pre-line"
                >
                  {bonus.bonusText}
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 pt-2 border-t border-zinc-700 text-xs text-cyan-400">
            No prerequisites (reflected from source area)
          </div>
        </Tooltip>
      </div>
    );
  }

  // Normal talent node rendering
  return (
    <div
      className={`
        relative w-20 h-20 rounded-lg border-2 transition-all
        ${
          canPlacePrism
            ? "border-purple-500 bg-purple-500/20 cursor-pointer hover:bg-purple-500/30"
            : canPlaceInverseImage
              ? "border-cyan-500 bg-cyan-500/20 cursor-pointer hover:bg-cyan-500/30"
              : isFullyAllocated
                ? "border-green-500 bg-green-500/15"
                : allocated > 0
                  ? "border-amber-500 bg-amber-500/10"
                  : isLocked
                    ? "border-zinc-800 bg-zinc-800 opacity-50"
                    : "border-zinc-700 bg-zinc-800 hover:border-amber-500"
        }
      `}
      onClick={handleClick}
      {...handlers}
    >
      {/* Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic game assets */}
        <img
          src={`/tli/talents/${node.iconName}.webp`}
          alt={node.iconName}
          className="w-12 h-12 object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>

      {/* Points Display */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs text-center py-0.5 rounded-b-md">
        {allocated}/{node.maxPoints}
      </div>

      {/* Allocation Buttons (hidden when selecting prism or inverse image on empty node) */}
      {!canPlacePrism && !canPlaceInverseImage && (
        <div className="absolute -top-2 -right-2 flex gap-1">
          <button
            onClick={onAllocate}
            disabled={!canAllocate}
            className={`
              w-5 h-5 rounded-full text-white text-xs font-bold
              ${
                canAllocate
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              }
            `}
          >
            +
          </button>
          <button
            onClick={onDeallocate}
            disabled={!canDeallocate}
            className={`
              w-5 h-5 rounded-full text-white text-xs font-bold
              ${
                canDeallocate
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              }
            `}
          >
            -
          </button>
        </div>
      )}

      {/* Place Prism indicator when selecting */}
      {canPlacePrism && (
        <div className="absolute -top-2 -right-2">
          <div className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center animate-pulse">
            +
          </div>
        </div>
      )}

      {/* Place Inverse Image indicator when selecting */}
      {canPlaceInverseImage && (
        <div className="absolute -top-2 -right-2">
          <div className="w-5 h-5 rounded-full bg-cyan-500 text-white text-xs font-bold flex items-center justify-center animate-pulse">
            +
          </div>
        </div>
      )}

      <Tooltip
        isVisible={isHovered}
        mousePos={mousePos}
        variant={isLegendary ? "legendary" : "default"}
      >
        <TooltipTitle>{talentTypeName}</TooltipTitle>
        <TooltipContent>{node.rawAffix}</TooltipContent>
        {bonusAffixes.length > 0 && (
          <div className="mt-2 pt-2 border-t border-blue-500/30">
            {bonusAffixes.map((bonus, idx) => (
              <div
                key={idx}
                className="text-xs text-blue-400 whitespace-pre-line"
              >
                {bonus.bonusText}
              </div>
            ))}
          </div>
        )}
        {canPlacePrism && (
          <div className="mt-2 pt-2 border-t border-zinc-700 text-xs text-purple-400">
            Click to place prism here
          </div>
        )}
        {canPlaceInverseImage && (
          <div className="mt-2 pt-2 border-t border-zinc-700 text-xs text-cyan-400">
            Click to place inverse image here
          </div>
        )}
      </Tooltip>
    </div>
  );
};
