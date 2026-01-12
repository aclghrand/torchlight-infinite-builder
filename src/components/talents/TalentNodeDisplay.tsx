import { i18n } from "@lingui/core";
import {
  Tooltip,
  TooltipContent,
  TooltipTitle,
} from "@/src/components/ui/Tooltip";
import { useTooltip } from "@/src/hooks/useTooltip";
import { formatEffectModifier } from "@/src/lib/inverse-image-utils";
import type {
  CraftedInverseImage,
  CraftedPrism,
  TalentNode,
} from "@/src/tli/core";

interface BonusAffix {
  bonusText: string;
}

interface TalentNodeDisplayProps {
  node: TalentNode;
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
}

export const TalentNodeDisplay: React.FC<TalentNodeDisplayProps> = ({
  node,
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
  // biome-ignore lint/correctness/noUnusedFunctionParameters: reserved for future visual styling
  isInSourceArea = false,
}) => {
  const { isVisible, triggerRef, triggerRect } = useTooltip();

  const allocated = node.points;
  const isFullyAllocated = allocated >= node.maxPoints;
  const isLocked = !canAllocate && allocated === 0;
  const isLegendary = node.nodeType === "legendary";
  const isReflected = node.isReflected;
  const canPlacePrism =
    isSelectingPrism && allocated === 0 && !hasPrism && !hasInverseImage;
  const canPlaceInverseImage =
    isSelectingInverseImage &&
    allocated === 0 &&
    !hasInverseImage &&
    !hasPrism &&
    node.x !== 3; // Not in center column

  const talentTypeName =
    node.nodeType === "micro"
      ? i18n._("Micro Talent")
      : node.nodeType === "medium"
        ? i18n._("Medium Talent")
        : i18n._("Legendary Talent");

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
        ref={triggerRef}
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
        {isVisible && onRemovePrism && (
          <div className="absolute -top-2 -right-2 flex gap-1">
            <button
              type="button"
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

        <Tooltip
          isVisible={isVisible}
          triggerRect={triggerRect}
          variant="prism"
        >
          <TooltipTitle>
            <span className="text-purple-400">
              {prism.rarity === "legendary" ? "Legendary" : "Rare"} Prism
            </span>
          </TooltipTitle>
          <TooltipContent>{prism.baseAffix}</TooltipContent>
          {prism.gaugeAffixes.length > 0 && (
            <div className="mt-2 pt-2 border-t border-zinc-700">
              <div className="text-xs text-zinc-500 mb-1">Gauge Affixes:</div>
              {prism.gaugeAffixes.map((affix, index) => (
                <div key={index} className="text-xs text-zinc-400">
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
        ref={triggerRef}
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
        {isVisible && onRemoveInverseImage && (
          <div className="absolute -top-2 -right-2 flex gap-1">
            <button
              type="button"
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

        <Tooltip
          isVisible={isVisible}
          triggerRect={triggerRect}
          variant="default"
        >
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

  // Reflected node rendering (in target area)
  if (isReflected) {
    return (
      <div
        className={`relative w-20 h-20 rounded-lg border-2 transition-all ${
          isFullyAllocated
            ? "border-cyan-500 bg-cyan-500/20"
            : allocated > 0
              ? "border-cyan-400 bg-cyan-500/15"
              : "border-cyan-600 bg-cyan-500/10"
        }`}
        ref={triggerRef}
      >
        {/* Reflected Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
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
        <div className="absolute bottom-0 left-0 right-0 bg-cyan-900/70 text-cyan-200 text-xs text-center py-0.5 rounded-b-md">
          {allocated}/{node.maxPoints}
        </div>

        {/* Add Button - Top Left */}
        <button
          type="button"
          onClick={onAllocate}
          disabled={!canAllocate}
          className={`
            absolute -top-2 -left-2 w-7 h-7 rounded-full text-white text-sm font-bold
            ${
              canAllocate
                ? "bg-cyan-500 hover:bg-cyan-400"
                : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
            }
          `}
        >
          +
        </button>
        {/* Remove Button - Top Right */}
        <button
          type="button"
          onClick={onDeallocate}
          disabled={!canDeallocate}
          className={`
            absolute -top-2 -right-2 w-7 h-7 rounded-full text-white text-sm font-bold
            ${
              canDeallocate
                ? "bg-red-500 hover:bg-red-600"
                : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
            }
          `}
        >
          -
        </button>

        <Tooltip
          isVisible={isVisible}
          triggerRect={triggerRect}
          variant="default"
        >
          <TooltipTitle>
            <span className="text-cyan-400">{talentTypeName} (Reflected)</span>
          </TooltipTitle>
          <TooltipContent>
            {node.affix.affixLines.map((line, idx) => (
              <div
                key={idx}
                className={idx > 0 ? "mt-1 pt-1 border-t border-zinc-800" : ""}
              >
                <div>{line.text}</div>
                {!line.mods && (
                  <div className="text-xs text-red-500">
                    (Mod not supported in TOB yet)
                  </div>
                )}
              </div>
            ))}
          </TooltipContent>
          {bonusAffixes.length > 0 && (
            <div className="mt-2 pt-2 border-t border-blue-500/30">
              {bonusAffixes.map((bonus, index) => (
                <div
                  key={index}
                  className="text-xs text-blue-400 whitespace-pre-line"
                >
                  {bonus.bonusText}
                </div>
              ))}
            </div>
          )}
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
      ref={triggerRef}
    >
      {/* Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
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
        <>
          {/* Add Button - Top Left */}
          <button
            type="button"
            onClick={onAllocate}
            disabled={!canAllocate}
            className={`
              absolute -top-2 -left-2 w-7 h-7 rounded-full text-white text-sm font-bold
              ${
                canAllocate
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              }
            `}
          >
            +
          </button>
          {/* Remove Button - Top Right */}
          <button
            type="button"
            onClick={onDeallocate}
            disabled={!canDeallocate}
            className={`
              absolute -top-2 -right-2 w-7 h-7 rounded-full text-white text-sm font-bold
              ${
                canDeallocate
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              }
            `}
          >
            -
          </button>
        </>
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
        isVisible={isVisible}
        triggerRect={triggerRect}
        variant={isLegendary ? "legendary" : "default"}
      >
        <TooltipTitle>{talentTypeName}</TooltipTitle>
        <TooltipContent>
          {node.affix.affixLines.map((line, idx) => (
            <div
              key={idx}
              className={idx > 0 ? "mt-1 pt-1 border-t border-zinc-800" : ""}
            >
              <div>{line.text}</div>
              {!line.mods && (
                <div className="text-xs text-red-500">
                  (Mod not supported in TOB yet)
                </div>
              )}
            </div>
          ))}
        </TooltipContent>
        {bonusAffixes.length > 0 && (
          <div className="mt-2 pt-2 border-t border-blue-500/30">
            {bonusAffixes.map((bonus, index) => (
              <div
                key={index}
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
