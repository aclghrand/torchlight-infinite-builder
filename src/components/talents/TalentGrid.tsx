import {
  getSourceAreaPositions,
  getTargetAreaPositions,
  isInSourceArea as isInSourceAreaUtil,
} from "@/src/lib/inverse-image-utils";
import {
  type CraftedInverseImage,
  type CraftedPrism,
  getAffixText,
  type PlacedInverseImage,
  type PlacedPrism,
  type TalentNode,
} from "@/src/tli/core";
import {
  canAllocateNodeWithInverseImage,
  canAllocateReflectedNode,
  canDeallocateNodeWithInverseImage,
  canDeallocateReflectedNode,
  canRemoveInverseImage,
  canRemovePrism,
  hasInverseImageAtPosition,
  hasPrismAtPosition,
  isPrerequisiteSatisfiedWithInverseImage,
} from "@/src/tli/talent-tree";
import { TalentNodeDisplay } from "./TalentNodeDisplay";

interface TalentGridProps {
  nodes: TalentNode[];
  onAllocate: (x: number, y: number) => void;
  onDeallocate: (x: number, y: number) => void;
  treeSlot: string;
  placedPrism?: PlacedPrism;
  selectedPrism?: CraftedPrism;
  onPlacePrism?: (x: number, y: number) => void;
  onRemovePrism?: () => void;
  placedInverseImage?: PlacedInverseImage;
  selectedInverseImage?: CraftedInverseImage;
  onPlaceInverseImage?: (x: number, y: number) => void;
  onRemoveInverseImage?: () => void;
  onAllocateReflected?: (
    x: number,
    y: number,
    sourceX: number,
    sourceY: number,
  ) => void;
  onDeallocateReflected?: (x: number, y: number) => void;
}

// Grid spacing constants
const NODE_SIZE = 80;
const COL_GAP = 80;
const ROW_GAP = 40;
const COL_STRIDE = NODE_SIZE + COL_GAP; // 160px
const ROW_STRIDE = NODE_SIZE + ROW_GAP; // 120px

// Helper to calculate node center positions for SVG lines
const getNodeCenter = (x: number, y: number) => ({
  cx: x * COL_STRIDE + NODE_SIZE / 2,
  cy: y * ROW_STRIDE + NODE_SIZE / 2,
});

// Helper to format prism bonus affixes for display
const formatPrismBonusAffixes = (
  prismAffixes: TalentNode["prismAffixes"],
): { bonusText: string }[] => {
  return prismAffixes.map((affix) => ({ bonusText: getAffixText(affix) }));
};

// Helper to format inverse image bonus affixes for display
const formatInverseImageBonusAffixes = (
  node: TalentNode,
): { bonusText: string }[] => {
  if (!node.isReflected || node.inverseImageEffect === undefined) {
    return [];
  }
  const percent = Math.round(node.inverseImageEffect * 100);
  const sign = percent >= 0 ? "+" : "";
  return [{ bonusText: `${sign}${percent}% Effect` }];
};

export const TalentGrid: React.FC<TalentGridProps> = ({
  nodes,
  onAllocate,
  onDeallocate,
  treeSlot,
  placedPrism,
  selectedPrism,
  onPlacePrism,
  onRemovePrism,
  placedInverseImage,
  selectedInverseImage,
  onPlaceInverseImage,
  onRemoveInverseImage,
  onAllocateReflected,
  onDeallocateReflected,
}) => {
  // Grid dimensions: 7 cols × 5 rows
  const gridWidth = 7 * NODE_SIZE + 6 * COL_GAP; // 1040px
  const gridHeight = 5 * NODE_SIZE + 4 * ROW_GAP; // 560px

  // Build a map for quick node lookup by position
  const nodeMap = new Map<string, TalentNode>();
  for (const node of nodes) {
    nodeMap.set(`${node.x},${node.y}`, node);
  }

  // Check if there are any reflected nodes with points allocated
  const hasReflectedAllocations = nodes.some(
    (n) => n.isReflected && n.points > 0,
  );

  return (
    <div className="overflow-x-auto pt-4">
      <div
        className="relative"
        style={{ width: gridWidth, height: gridHeight }}
      >
        {/* SVG for prerequisite lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: gridWidth, height: gridHeight, zIndex: 0 }}
        >
          {nodes
            .filter((node) => node.prerequisite && !node.isReflected)
            .map((node) => {
              // biome-ignore lint/style/noNonNullAssertion: filtered for prerequisite above
              const prereq = node.prerequisite!;

              // Don't draw lines from prism nodes (prerequisite is bypassed)
              if (
                hasPrismAtPosition(placedPrism, treeSlot, prereq.x, prereq.y)
              ) {
                return null;
              }

              // Don't draw lines from inverse image nodes (prerequisite is bypassed)
              if (
                hasInverseImageAtPosition(
                  placedInverseImage,
                  treeSlot,
                  prereq.x,
                  prereq.y,
                )
              ) {
                return null;
              }

              // Don't draw lines for nodes in target area (they lose prerequisites)
              // Check if this node is in target area
              if (
                placedInverseImage &&
                placedInverseImage.treeSlot === treeSlot
              ) {
                const targetPositions = getTargetAreaPositions(
                  placedInverseImage.position.x,
                  placedInverseImage.position.y,
                );
                const nodeInTarget = targetPositions.some(
                  (pos) => pos.x === node.x && pos.y === node.y,
                );
                if (nodeInTarget) {
                  return null;
                }

                // Don't draw lines if prerequisite is in target area
                const prereqInTarget = targetPositions.some(
                  (pos) => pos.x === prereq.x && pos.y === prereq.y,
                );
                if (prereqInTarget) {
                  return null;
                }
              }

              const from = getNodeCenter(prereq.x, prereq.y);
              const to = getNodeCenter(node.x, node.y);

              const isSatisfied = isPrerequisiteSatisfiedWithInverseImage(
                prereq,
                { x: node.x, y: node.y },
                nodes,
                placedPrism,
                placedInverseImage,
                treeSlot,
              );

              return (
                <line
                  key={`${prereq.x},${prereq.y}-${node.x},${node.y}`}
                  x1={from.cx}
                  y1={from.cy}
                  x2={to.cx}
                  y2={to.cy}
                  stroke={isSatisfied ? "#22c55e" : "#71717a"}
                  strokeWidth="2"
                  opacity="0.5"
                />
              );
            })}

          {/* Blue box outline for prism affected area */}
          {placedPrism &&
            placedPrism.treeSlot === treeSlot &&
            (() => {
              const { x: prismX, y: prismY } = placedPrism.position;
              // Calculate bounds of affected area (clamped to grid)
              const minX = Math.max(0, prismX - 1);
              const maxX = Math.min(6, prismX + 1);
              const minY = Math.max(0, prismY - 1);
              const maxY = Math.min(4, prismY + 1);

              const padding = 4;
              const left = minX * COL_STRIDE - padding;
              const top = minY * ROW_STRIDE - padding;
              const width =
                (maxX - minX) * COL_STRIDE + NODE_SIZE + padding * 2;
              const height =
                (maxY - minY) * ROW_STRIDE + NODE_SIZE + padding * 2;

              return (
                <rect
                  x={left}
                  y={top}
                  width={width}
                  height={height}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="8 4"
                  opacity="0.7"
                  rx="8"
                />
              );
            })()}

          {/* Inverse image source area (green dashed box) */}
          {placedInverseImage &&
            placedInverseImage.treeSlot === treeSlot &&
            (() => {
              const { x: iiX, y: iiY } = placedInverseImage.position;
              const sourcePositions = getSourceAreaPositions(iiX, iiY);
              const minX = Math.min(...sourcePositions.map((p) => p.x));
              const maxX = Math.max(...sourcePositions.map((p) => p.x));
              const minY = Math.min(...sourcePositions.map((p) => p.y));
              const maxY = Math.max(...sourcePositions.map((p) => p.y));

              const padding = 4;
              const left = minX * COL_STRIDE - padding;
              const top = minY * ROW_STRIDE - padding;
              const width =
                (maxX - minX) * COL_STRIDE + NODE_SIZE + padding * 2;
              const height =
                (maxY - minY) * ROW_STRIDE + NODE_SIZE + padding * 2;

              return (
                <rect
                  x={left}
                  y={top}
                  width={width}
                  height={height}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeDasharray="8 4"
                  opacity="0.7"
                  rx="8"
                />
              );
            })()}

          {/* Inverse image target area (cyan dashed box) */}
          {placedInverseImage &&
            placedInverseImage.treeSlot === treeSlot &&
            (() => {
              const { x: iiX, y: iiY } = placedInverseImage.position;
              const targetPositions = getTargetAreaPositions(iiX, iiY);
              const minX = Math.min(...targetPositions.map((p) => p.x));
              const maxX = Math.max(...targetPositions.map((p) => p.x));
              const minY = Math.min(...targetPositions.map((p) => p.y));
              const maxY = Math.max(...targetPositions.map((p) => p.y));

              const padding = 4;
              const left = minX * COL_STRIDE - padding;
              const top = minY * ROW_STRIDE - padding;
              const width =
                (maxX - minX) * COL_STRIDE + NODE_SIZE + padding * 2;
              const height =
                (maxY - minY) * ROW_STRIDE + NODE_SIZE + padding * 2;

              return (
                <rect
                  x={left}
                  y={top}
                  width={width}
                  height={height}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeDasharray="8 4"
                  opacity="0.7"
                  rx="8"
                />
              );
            })()}
        </svg>

        {/* Node Grid */}
        <div
          className="relative grid"
          style={{
            zIndex: 1,
            gridTemplateColumns: `repeat(7, ${NODE_SIZE}px)`,
            gridTemplateRows: `repeat(5, ${NODE_SIZE}px)`,
            columnGap: `${COL_GAP}px`,
            rowGap: `${ROW_GAP}px`,
          }}
        >
          {[0, 1, 2, 3, 4].map((y) =>
            [0, 1, 2, 3, 4, 5, 6].map((x) => {
              const node = nodeMap.get(`${x},${y}`);

              // If no node exists at this position, show empty space
              if (!node) {
                return <div key={`${x}-${y}`} className="w-20 h-20" />;
              }

              const nodeHasPrism = hasPrismAtPosition(
                placedPrism,
                treeSlot,
                x,
                y,
              );
              const nodeHasInverseImage = hasInverseImageAtPosition(
                placedInverseImage,
                treeSlot,
                x,
                y,
              );
              const nodeIsInSourceArea = isInSourceAreaUtil(
                x,
                y,
                placedInverseImage,
                treeSlot,
              );

              // Check if prism can be removed
              const prismCanBeRemoved =
                nodeHasPrism && placedPrism
                  ? canRemovePrism(placedPrism, nodes)
                  : false;

              // Check if inverse image can be removed
              const inverseImageCanBeRemoved =
                nodeHasInverseImage && placedInverseImage
                  ? canRemoveInverseImage(nodes) && !hasReflectedAllocations
                  : false;

              // Determine canAllocate and canDeallocate based on node type
              let canAllocate: boolean;
              let canDeallocate: boolean;
              let handleAllocate: () => void;
              let handleDeallocate: () => void;

              if (node.isReflected) {
                // Reflected node - use reflected allocation functions
                // biome-ignore lint/style/noNonNullAssertion: isReflected implies sourcePosition exists
                const sourcePos = node.sourcePosition!;
                canAllocate = canAllocateReflectedNode(node, nodes);
                canDeallocate = canDeallocateReflectedNode(node, nodes);
                handleAllocate = () =>
                  onAllocateReflected?.(x, y, sourcePos.x, sourcePos.y);
                handleDeallocate = () => onDeallocateReflected?.(x, y);
              } else {
                // Normal node - use standard allocation functions
                canAllocate = canAllocateNodeWithInverseImage(
                  node,
                  nodes,
                  placedPrism,
                  placedInverseImage,
                  treeSlot,
                );
                canDeallocate = canDeallocateNodeWithInverseImage(
                  node,
                  nodes,
                  placedPrism,
                  placedInverseImage,
                  treeSlot,
                );
                handleAllocate = () => onAllocate(x, y);
                handleDeallocate = () => onDeallocate(x, y);
              }

              // Get bonus affixes for display
              const bonusAffixes = node.isReflected
                ? formatInverseImageBonusAffixes(node)
                : formatPrismBonusAffixes(node.prismAffixes);

              return (
                <TalentNodeDisplay
                  key={`${x}-${y}`}
                  node={node}
                  canAllocate={canAllocate}
                  canDeallocate={canDeallocate}
                  onAllocate={handleAllocate}
                  onDeallocate={handleDeallocate}
                  hasPrism={nodeHasPrism}
                  prism={nodeHasPrism ? placedPrism?.prism : undefined}
                  isSelectingPrism={!!selectedPrism}
                  onPlacePrism={
                    onPlacePrism ? () => onPlacePrism(x, y) : undefined
                  }
                  onRemovePrism={nodeHasPrism ? onRemovePrism : undefined}
                  canRemovePrism={prismCanBeRemoved}
                  bonusAffixes={bonusAffixes}
                  hasInverseImage={nodeHasInverseImage}
                  inverseImage={
                    nodeHasInverseImage
                      ? placedInverseImage?.inverseImage
                      : undefined
                  }
                  isSelectingInverseImage={!!selectedInverseImage}
                  onPlaceInverseImage={
                    onPlaceInverseImage
                      ? () => onPlaceInverseImage(x, y)
                      : undefined
                  }
                  onRemoveInverseImage={
                    nodeHasInverseImage ? onRemoveInverseImage : undefined
                  }
                  canRemoveInverseImage={inverseImageCanBeRemoved}
                  isInSourceArea={nodeIsInSourceArea}
                />
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
};
