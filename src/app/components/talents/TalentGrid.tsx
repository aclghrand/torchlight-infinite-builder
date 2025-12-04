import {
  TalentTreeData,
  hasPrismAtPosition,
  canRemovePrism,
  canAllocateNodeWithInverseImage,
  canDeallocateNodeWithInverseImage,
  isPrerequisiteSatisfiedWithInverseImage,
  hasInverseImageAtPosition,
  canRemoveInverseImage,
} from "@/src/tli/talent_tree";
import {
  AllocatedTalentNode,
  PlacedPrism,
  CraftedPrism,
  PlacedInverseImage,
  CraftedInverseImage,
} from "@/src/app/lib/save-data";
import { getNodeBonusAffixes } from "@/src/app/lib/prism-utils";
import {
  isInSourceArea,
  isInTargetArea,
  getSourceAreaPositions,
  getTargetAreaPositions,
  getReflectedNodeData,
  getReflectedNodeBonusAffixes,
  reflectPosition,
} from "@/src/app/lib/inverse-image-utils";
import { TalentNodeDisplay } from "./TalentNodeDisplay";

interface TalentGridProps {
  treeData: TalentTreeData;
  allocatedNodes: AllocatedTalentNode[];
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

// Helper to calculate node center positions for SVG lines
const getNodeCenter = (x: number, y: number) => ({
  cx: x * (80 + 80) + 40, // 80px node + 80px gap, center at 40px
  cy: y * (80 + 80) + 40,
});

export const TalentGrid: React.FC<TalentGridProps> = ({
  treeData,
  allocatedNodes,
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
  // Grid dimensions: 7 cols × 5 rows, 80px nodes, 80px gaps
  const gridWidth = 7 * 80 + 6 * 80; // 1040px
  const gridHeight = 5 * 80 + 4 * 80; // 720px

  return (
    <div className="overflow-x-auto">
      <div
        className="relative"
        style={{ width: gridWidth, height: gridHeight }}
      >
        {/* SVG for prerequisite lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: gridWidth, height: gridHeight, zIndex: 0 }}
        >
          {treeData.nodes
            .filter((node) => node.prerequisite)
            .map((node, idx) => {
              // Don't draw lines from prism nodes (prerequisite is bypassed)
              if (
                hasPrismAtPosition(
                  placedPrism,
                  treeSlot,
                  node.prerequisite!.x,
                  node.prerequisite!.y,
                )
              ) {
                return null;
              }

              // Don't draw lines for nodes in target area (they lose prerequisites)
              if (
                isInTargetArea(
                  node.position.x,
                  node.position.y,
                  placedInverseImage,
                  treeSlot,
                )
              ) {
                return null;
              }

              // Don't draw lines for nodes whose prerequisite is in target area
              if (
                isInTargetArea(
                  node.prerequisite!.x,
                  node.prerequisite!.y,
                  placedInverseImage,
                  treeSlot,
                )
              ) {
                return null;
              }

              const from = getNodeCenter(
                node.prerequisite!.x,
                node.prerequisite!.y,
              );
              const to = getNodeCenter(node.position.x, node.position.y);

              const isSatisfied = isPrerequisiteSatisfiedWithInverseImage(
                node.prerequisite,
                node.position,
                allocatedNodes,
                treeData,
                placedPrism,
                placedInverseImage,
                treeSlot,
              );

              return (
                <line
                  key={idx}
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

              // Calculate pixel positions (160px stride = 80px node + 80px gap)
              const padding = 4;
              const left = minX * 160 - padding;
              const top = minY * 160 - padding;
              const width = (maxX - minX) * 160 + 80 + padding * 2;
              const height = (maxY - minY) * 160 + 80 + padding * 2;

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
              const left = minX * 160 - padding;
              const top = minY * 160 - padding;
              const width = (maxX - minX) * 160 + 80 + padding * 2;
              const height = (maxY - minY) * 160 + 80 + padding * 2;

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
              const left = minX * 160 - padding;
              const top = minY * 160 - padding;
              const width = (maxX - minX) * 160 + 80 + padding * 2;
              const height = (maxY - minY) * 160 + 80 + padding * 2;

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
            gridTemplateColumns: "repeat(7, 80px)",
            gridTemplateRows: "repeat(5, 80px)",
            gap: "80px",
          }}
        >
          {[0, 1, 2, 3, 4].map((y) =>
            [0, 1, 2, 3, 4, 5, 6].map((x) => {
              // Check target area FIRST - reflected nodes take priority over original nodes
              const nodeIsInTargetArea = isInTargetArea(
                x,
                y,
                placedInverseImage,
                treeSlot,
              );

              // If this position is in target area (and has an inverse image placed),
              // render a reflected node instead of the original node
              if (nodeIsInTargetArea && placedInverseImage) {
                const reflectedNodeData = getReflectedNodeData(
                  x,
                  y,
                  treeData.nodes,
                  placedInverseImage,
                  treeSlot,
                );

                // If no reflected node data (source position doesn't have a node), show empty
                if (!reflectedNodeData) {
                  return <div key={`${x}-${y}`} className="w-20 h-20" />;
                }

                // Get the source position for this reflected node
                const sourcePos = reflectPosition(x, y);

                // Get reflected node allocation
                const reflectedAllocation =
                  placedInverseImage.reflectedAllocatedNodes.find(
                    (n) => n.x === x && n.y === y,
                  );
                const reflectedAllocated = reflectedAllocation?.points ?? 0;

                // Check if can allocate/deallocate reflected node
                const canAllocateReflected =
                  reflectedAllocated < reflectedNodeData.maxPoints;
                const canDeallocateReflected = reflectedAllocated > 0;

                // Get bonus affixes for reflected node
                const inverseImageBonusAffixes = getReflectedNodeBonusAffixes(
                  { x, y },
                  reflectedNodeData.nodeType,
                  placedInverseImage,
                  treeSlot,
                );

                return (
                  <TalentNodeDisplay
                    key={`${x}-${y}`}
                    node={reflectedNodeData}
                    allocated={reflectedAllocated}
                    canAllocate={canAllocateReflected}
                    canDeallocate={canDeallocateReflected}
                    onAllocate={() =>
                      onAllocateReflected?.(x, y, sourcePos.x, sourcePos.y)
                    }
                    onDeallocate={() => onDeallocateReflected?.(x, y)}
                    hasPrism={false}
                    isSelectingPrism={false}
                    bonusAffixes={inverseImageBonusAffixes}
                    hasInverseImage={false}
                    isSelectingInverseImage={false}
                    isInSourceArea={false}
                    isInTargetArea={true}
                    reflectedNodeData={reflectedNodeData}
                  />
                );
              }

              // Normal node rendering (not in target area)
              const node = treeData.nodes.find(
                (n) => n.position.x === x && n.position.y === y,
              );

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
              const nodeIsInSourceArea = isInSourceArea(
                x,
                y,
                placedInverseImage,
                treeSlot,
              );

              const allocation = allocatedNodes.find(
                (n) => n.x === x && n.y === y,
              );
              const allocated = allocation?.points ?? 0;

              // Check if prism can be removed (only relevant if this node has the prism)
              const prismCanBeRemoved =
                nodeHasPrism && placedPrism
                  ? canRemovePrism(placedPrism, allocatedNodes, treeData)
                  : false;

              // Check if inverse image can be removed (needs 0 points in tree AND 0 reflected points)
              const inverseImageCanBeRemoved =
                nodeHasInverseImage && placedInverseImage
                  ? canRemoveInverseImage(allocatedNodes) &&
                    placedInverseImage.reflectedAllocatedNodes.length === 0
                  : false;

              // Combine prism bonus affixes
              const prismBonusAffixes = getNodeBonusAffixes(
                node.position,
                node.nodeType,
                placedPrism,
                treeSlot,
                allocated,
              );

              return (
                <TalentNodeDisplay
                  key={`${x}-${y}`}
                  node={node}
                  allocated={allocated}
                  canAllocate={canAllocateNodeWithInverseImage(
                    node,
                    allocatedNodes,
                    treeData,
                    placedPrism,
                    placedInverseImage,
                    treeSlot,
                  )}
                  canDeallocate={canDeallocateNodeWithInverseImage(
                    node,
                    allocatedNodes,
                    treeData,
                    placedPrism,
                    placedInverseImage,
                    treeSlot,
                  )}
                  onAllocate={() => onAllocate(x, y)}
                  onDeallocate={() => onDeallocate(x, y)}
                  hasPrism={nodeHasPrism}
                  prism={nodeHasPrism ? placedPrism?.prism : undefined}
                  isSelectingPrism={!!selectedPrism}
                  onPlacePrism={
                    onPlacePrism ? () => onPlacePrism(x, y) : undefined
                  }
                  onRemovePrism={nodeHasPrism ? onRemovePrism : undefined}
                  canRemovePrism={prismCanBeRemoved}
                  bonusAffixes={prismBonusAffixes}
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
                  isInTargetArea={false}
                />
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
};
