"use client";

import { getSlateColor } from "@/src/app/lib/divinity-utils";
import type { DivinitySlate } from "@/src/tli/core";

interface SlateEdges {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

interface DivinityGridCellProps {
  row: number;
  col: number;
  isOutOfBounds: boolean;
  slate: DivinitySlate | undefined;
  slateEdges: SlateEdges | undefined;
  isInvalid: boolean;
  isDragging: boolean;
  onClick: () => void;
  onMouseDown: ((e: React.MouseEvent) => void) | undefined;
}

// CSS for the X pattern overlay on invalid cells
const invalidOverlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage: `
    linear-gradient(45deg, transparent 40%, rgba(239, 68, 68, 0.9) 40%, rgba(239, 68, 68, 0.9) 60%, transparent 60%),
    linear-gradient(-45deg, transparent 40%, rgba(239, 68, 68, 0.9) 40%, rgba(239, 68, 68, 0.9) 60%, transparent 60%)
  `,
  backgroundSize: "100% 100%",
  pointerEvents: "none",
};

export const DivinityGridCell: React.FC<DivinityGridCellProps> = ({
  isOutOfBounds,
  slate,
  slateEdges,
  isInvalid,
  isDragging,
  onClick,
  onMouseDown,
}) => {
  // Empty out-of-bounds cell
  if (isOutOfBounds && !slate) {
    return <div className="h-12 w-12" />;
  }

  // Out-of-bounds cell WITH a slate - show the slate with error styling
  // Hide completely if being dragged
  if (isOutOfBounds && slate) {
    if (isDragging) {
      return <div className="h-12 w-12" />;
    }
    return (
      <div
        role="button"
        tabIndex={0}
        className={`relative h-12 w-12 ${getSlateColor(slate)} cursor-grab select-none`}
        style={getOutlineStyleForSlate(slateEdges)}
        onClick={onClick}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
        onMouseDown={onMouseDown}
      >
        <div style={invalidOverlayStyle} />
      </div>
    );
  }

  // Hide the cell if it's part of the dragged slate
  if (isDragging && slate) {
    return <div className="h-12 w-12 border border-zinc-700 bg-zinc-800" />;
  }

  // Valid grid cell (within mask)
  const getBackgroundClass = (): string => {
    if (slate !== undefined) {
      return getSlateColor(slate);
    }
    return "bg-zinc-800";
  };

  const getBorderClass = (): string => {
    // No base border for cells with slates - only show white edges via getOutlineStyle
    if (slate) {
      return "";
    }
    return "border border-zinc-700";
  };

  const getOutlineStyle = (): React.CSSProperties => {
    if (!slate || !slateEdges || isInvalid) return {};

    const borderColor = "rgba(255, 255, 255, 0.7)";
    const borderWidth = "3px";
    const style: React.CSSProperties = { boxSizing: "border-box" };

    if (slateEdges.top) style.borderTop = `${borderWidth} solid ${borderColor}`;
    if (slateEdges.right)
      style.borderRight = `${borderWidth} solid ${borderColor}`;
    if (slateEdges.bottom)
      style.borderBottom = `${borderWidth} solid ${borderColor}`;
    if (slateEdges.left)
      style.borderLeft = `${borderWidth} solid ${borderColor}`;

    return style;
  };

  const getCursorClass = (): string => {
    if (slate) {
      return isDragging ? "cursor-grabbing" : "cursor-grab";
    }
    return "cursor-default";
  };

  return (
    <div
      role={slate ? "button" : undefined}
      tabIndex={slate ? 0 : undefined}
      className={`relative h-12 w-12 transition-colors select-none ${getBackgroundClass()} ${getBorderClass()} ${getCursorClass()}`}
      style={getOutlineStyle()}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      onMouseDown={onMouseDown}
    >
      {isInvalid && <div style={invalidOverlayStyle} />}
    </div>
  );
};

// Helper to get outline style for out-of-bounds cells
const getOutlineStyleForSlate = (
  slateEdges: SlateEdges | undefined,
): React.CSSProperties => {
  if (!slateEdges) return {};

  const borderColor = "rgba(255, 255, 255, 0.7)";
  const borderWidth = "3px";
  const style: React.CSSProperties = { boxSizing: "border-box" };

  if (slateEdges.top) style.borderTop = `${borderWidth} solid ${borderColor}`;
  if (slateEdges.right)
    style.borderRight = `${borderWidth} solid ${borderColor}`;
  if (slateEdges.bottom)
    style.borderBottom = `${borderWidth} solid ${borderColor}`;
  if (slateEdges.left) style.borderLeft = `${borderWidth} solid ${borderColor}`;

  return style;
};
