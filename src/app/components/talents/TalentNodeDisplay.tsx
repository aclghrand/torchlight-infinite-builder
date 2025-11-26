import { TalentNodeData } from "@/src/tli/talent_tree";

interface TalentNodeDisplayProps {
  node: TalentNodeData;
  allocated: number;
  canAllocate: boolean;
  canDeallocate: boolean;
  onAllocate: () => void;
  onDeallocate: () => void;
}

export const TalentNodeDisplay: React.FC<TalentNodeDisplayProps> = ({
  node,
  allocated,
  canAllocate,
  canDeallocate,
  onAllocate,
  onDeallocate,
}) => {
  const isFullyAllocated = allocated >= node.maxPoints;
  const isLocked = !canAllocate && allocated === 0;

  return (
    <div
      className={`
        relative w-20 h-20 rounded-lg border-2 transition-all
        ${
          isFullyAllocated
            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
            : allocated > 0
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : isLocked
                ? "border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 opacity-50"
                : "border-zinc-400 dark:border-zinc-500 bg-white dark:bg-zinc-700 hover:border-blue-400"
        }
      `}
      title={`${
        node.nodeType === "micro"
          ? "Micro Talent"
          : node.nodeType === "medium"
            ? "Medium Talent"
            : "Legendary Talent"
      }\n${node.rawAffix}`}
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

      {/* Allocation Buttons */}
      <div className="absolute -top-2 -right-2 flex gap-1">
        <button
          onClick={onAllocate}
          disabled={!canAllocate}
          className={`
            w-5 h-5 rounded-full text-white text-xs font-bold
            ${
              canAllocate
                ? "bg-green-600 hover:bg-green-700"
                : "bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed"
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
                ? "bg-red-600 hover:bg-red-700"
                : "bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed"
            }
          `}
        >
          -
        </button>
      </div>
    </div>
  );
};
