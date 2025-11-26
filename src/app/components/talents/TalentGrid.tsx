import {
  TalentTreeData,
  TalentNodeData,
  canAllocateNode,
  canDeallocateNode,
  isPrerequisiteSatisfied,
} from "@/src/tli/talent_tree";
import { RawAllocatedTalentNode } from "@/src/tli/core";
import { TalentNodeDisplay } from "./TalentNodeDisplay";

interface TalentGridProps {
  treeData: TalentTreeData;
  allocatedNodes: RawAllocatedTalentNode[];
  onAllocate: (x: number, y: number) => void;
  onDeallocate: (x: number, y: number) => void;
}

// Helper to calculate node center positions for SVG lines
const getNodeCenter = (x: number, y: number) => ({
  cx: x * (80 + 8) + 40, // 80px node + 8px gap, center at 40px
  cy: y * (80 + 8) + 40,
});

export const TalentGrid: React.FC<TalentGridProps> = ({
  treeData,
  allocatedNodes,
  onAllocate,
  onDeallocate,
}) => {
  return (
    <div className="relative">
      {/* SVG for prerequisite lines */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: "100%", height: "100%", zIndex: 0 }}
      >
        {treeData.nodes
          .filter((node) => node.prerequisite)
          .map((node, idx) => {
            const from = getNodeCenter(
              node.prerequisite!.x,
              node.prerequisite!.y,
            );
            const to = getNodeCenter(node.position.x, node.position.y);

            const isSatisfied = isPrerequisiteSatisfied(
              node.prerequisite,
              allocatedNodes,
              treeData,
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
      </svg>

      {/* Node Grid */}
      <div className="relative" style={{ zIndex: 1 }}>
        {[0, 1, 2, 3, 4].map((y) => (
          <div key={y} className="grid grid-cols-7 gap-2 mb-2">
            {[0, 1, 2, 3, 4, 5, 6].map((x) => {
              const node = treeData.nodes.find(
                (n) => n.position.x === x && n.position.y === y,
              );

              if (!node) {
                return <div key={x} className="w-20 h-20" />;
              }

              const allocation = allocatedNodes.find(
                (n) => n.x === x && n.y === y,
              );
              const allocated = allocation?.points ?? 0;

              return (
                <TalentNodeDisplay
                  key={`${x}-${y}`}
                  node={node}
                  allocated={allocated}
                  canAllocate={canAllocateNode(node, allocatedNodes, treeData)}
                  canDeallocate={canDeallocateNode(
                    node,
                    allocatedNodes,
                    treeData,
                  )}
                  onAllocate={() => onAllocate(x, y)}
                  onDeallocate={() => onDeallocate(x, y)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
