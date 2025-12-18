"use client";

import { GOD_COLORS } from "@/src/app/lib/divinity-utils";
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
  isPreview: boolean;
  previewSlate: DivinitySlate | undefined;
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
  isPreview,
  previewSlate,
  onClick,
  onMouseDown,
}) => {
  // Empty out-of-bounds cell (no slate and no preview)
  if (isOutOfBounds && !slate && !isPreview) {
    return <div className="h-12 w-12" />;
  }

  // Out-of-bounds cell with preview (no existing slate)
  if (isOutOfBounds && !slate && isPreview && previewSlate) {
    return (
      <div
        className={`relative h-12 w-12 ${GOD_COLORS[previewSlate.god]} opacity-60`}
      >
        <div style={invalidOverlayStyle} />
      </div>
    );
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
        className={`relative h-12 w-12 ${GOD_COLORS[slate.god]} cursor-grab select-none`}
        style={getOutlineStyleForSlate(slateEdges)}
        onClick={onClick}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
        onMouseDown={onMouseDown}
      >
        <div style={invalidOverlayStyle} />
      </div>
    );
  }

  // Hide the cell completely if it's part of the dragged slate (but not if it's also a preview location)
  if (isDragging && slate && !isPreview) {
    return <div className="h-12 w-12 border border-zinc-700 bg-zinc-800" />;
  }

  // If dragging over the original location, show as preview
  if (isDragging && slate && isPreview && previewSlate) {
    return (
      <div
        className={`relative h-12 w-12 ${GOD_COLORS[previewSlate.god]} opacity-60 border-2 border-white`}
      />
    );
  }

  // Valid grid cell (within mask)
  const getBackgroundClass = (): string => {
    // Show preview of dragged slate
    if (isPreview && previewSlate && !slate) {
      return `${GOD_COLORS[previewSlate.god]} opacity-60`;
    }

    if (slate) {
      return GOD_COLORS[slate.god];
    }

    return "bg-zinc-800";
  };

  const getBorderClass = (): string => {
    if (isPreview && !slate) {
      return "border-2 border-white";
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
