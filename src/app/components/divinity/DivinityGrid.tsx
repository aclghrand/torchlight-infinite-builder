"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DISPLAY_COL_END,
  DISPLAY_COL_START,
  DISPLAY_ROW_END,
  DISPLAY_ROW_START,
  findOutOfBoundsCells,
  findOverlappingCells,
  findSlateAtCell,
  GRID_COLS,
  GRID_MASK,
  GRID_ROWS,
} from "@/src/app/lib/divinity-grid";
import {
  getOccupiedCells,
  getTransformedCells,
} from "@/src/app/lib/divinity-shapes";
import type { DivinityPage } from "@/src/tli/core";
import { DivinityGridCell } from "./DivinityGridCell";

const CELL_SIZE = 48; // h-12 w-12 = 48px

interface DivinityGridProps {
  divinityPage: DivinityPage;
  onClickPlacedSlate: (slateId: string) => void;
  onMoveSlate: (
    slateId: string,
    position: { row: number; col: number },
  ) => void;
}

export const DivinityGrid: React.FC<DivinityGridProps> = ({
  divinityPage,
  onClickPlacedSlate,
  onMoveSlate,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [draggedSlateId, setDraggedSlateId] = useState<string | undefined>();
  const [dropTarget, setDropTarget] = useState<
    { row: number; col: number } | undefined
  >();

  const overlappingCells = findOverlappingCells(
    divinityPage.inventory,
    divinityPage.placedSlates,
  );
  const outOfBoundsCells = findOutOfBoundsCells(
    divinityPage.inventory,
    divinityPage.placedSlates,
  );
  const invalidCells = new Set([...overlappingCells, ...outOfBoundsCells]);
  const hasInvalidState = invalidCells.size > 0;

  // Build set of all cells occupied by the dragged slate at its current position
  const draggedSlateCells = new Set<string>();
  // Build set of preview cells where the slate would land
  const previewCells = new Set<string>();
  const draggedSlate = draggedSlateId
    ? divinityPage.inventory.find((s) => s.id === draggedSlateId)
    : undefined;

  if (draggedSlateId && draggedSlate) {
    const placement = divinityPage.placedSlates.find(
      (p) => p.slateId === draggedSlateId,
    );
    if (placement) {
      const cells = getOccupiedCells(draggedSlate, placement);
      for (const [r, c] of cells) {
        draggedSlateCells.add(`${r},${c}`);
      }
    }

    // Calculate preview position
    if (dropTarget) {
      const shapeCells = getTransformedCells(
        draggedSlate.shape,
        draggedSlate.rotation,
        draggedSlate.flippedH,
        draggedSlate.flippedV,
      );
      for (const [r, c] of shapeCells) {
        previewCells.add(`${r + dropTarget.row},${c + dropTarget.col}`);
      }
    }
  }

  // Check if a cell is within the valid grid bounds (for GRID_MASK lookup)
  const isInGridBounds = (row: number, col: number): boolean => {
    return row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS;
  };

  // Check if a cell is a valid placement cell (within mask)
  const isValidGridCell = (row: number, col: number): boolean => {
    if (!isInGridBounds(row, col)) return false;
    return GRID_MASK[row][col] === 1;
  };

  const getCellSlateId = (row: number, col: number): string | undefined => {
    const placed = findSlateAtCell(
      row,
      col,
      divinityPage.inventory,
      divinityPage.placedSlates,
    );
    return placed?.slateId;
  };

  const getSlateEdges = (
    row: number,
    col: number,
    slateId: string | undefined,
  ) => {
    if (!slateId) return undefined;
    return {
      top: getCellSlateId(row - 1, col) !== slateId,
      right: getCellSlateId(row, col + 1) !== slateId,
      bottom: getCellSlateId(row + 1, col) !== slateId,
      left: getCellSlateId(row, col - 1) !== slateId,
    };
  };

  const handleCellClick = (row: number, col: number) => {
    const placed = findSlateAtCell(
      row,
      col,
      divinityPage.inventory,
      divinityPage.placedSlates,
    );
    if (placed) {
      onClickPlacedSlate(placed.slateId);
    }
  };

  // Calculate grid cell from mouse position
  const getCellFromMouseEvent = useCallback(
    (e: MouseEvent): { row: number; col: number } | undefined => {
      if (!gridRef.current) return undefined;

      const rect = gridRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 8; // 8px = p-2 padding
      const y = e.clientY - rect.top - 8;

      const col = Math.floor(x / CELL_SIZE) + DISPLAY_COL_START;
      const row = Math.floor(y / CELL_SIZE) + DISPLAY_ROW_START;

      return { row, col };
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggedSlateId) return;

      const cell = getCellFromMouseEvent(e);
      if (cell) {
        setDropTarget(cell);
      }
    },
    [draggedSlateId, getCellFromMouseEvent],
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!draggedSlateId) return;

      const cell = getCellFromMouseEvent(e);
      if (cell) {
        onMoveSlate(draggedSlateId, cell);
      }

      setDraggedSlateId(undefined);
      setDropTarget(undefined);
    },
    [draggedSlateId, getCellFromMouseEvent, onMoveSlate],
  );

  // Add/remove document-level event listeners when dragging
  useEffect(() => {
    if (draggedSlateId) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggedSlateId, handleMouseMove, handleMouseUp]);

  const handleMouseDown = (slateId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggedSlateId(slateId);

    // Set initial drop target to current position
    const placement = divinityPage.placedSlates.find(
      (p) => p.slateId === slateId,
    );
    if (placement) {
      setDropTarget({
        row: placement.position.row,
        col: placement.position.col,
      });
    }
  };

  const rows = [];
  for (let row = DISPLAY_ROW_START; row < DISPLAY_ROW_END; row++) {
    const cells = [];
    for (let col = DISPLAY_COL_START; col < DISPLAY_COL_END; col++) {
      const isValid = isValidGridCell(row, col);
      const isOutOfBounds = !isInGridBounds(row, col) || !isValid;
      const cellSlateId = getCellSlateId(row, col);
      const cellSlate = cellSlateId
        ? divinityPage.inventory.find((s) => s.id === cellSlateId)
        : undefined;
      const slateEdges = getSlateEdges(row, col, cellSlateId);
      const isInvalid = invalidCells.has(`${row},${col}`);
      const isDragging = draggedSlateCells.has(`${row},${col}`);
      const isPreview = previewCells.has(`${row},${col}`);

      cells.push(
        <DivinityGridCell
          key={`${row}-${col}`}
          row={row}
          col={col}
          isOutOfBounds={isOutOfBounds}
          slate={cellSlate}
          slateEdges={slateEdges}
          isInvalid={isInvalid}
          isDragging={isDragging}
          isPreview={isPreview}
          previewSlate={isPreview ? draggedSlate : undefined}
          onClick={() => handleCellClick(row, col)}
          onMouseDown={
            cellSlateId ? (e) => handleMouseDown(cellSlateId, e) : undefined
          }
        />,
      );
    }
    rows.push(
      <div key={row} className="flex">
        {cells}
      </div>,
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={gridRef}
        className={`inline-block rounded-lg bg-zinc-900 p-2 ${draggedSlateId ? "cursor-grabbing" : ""}`}
      >
        {rows}
      </div>
      {hasInvalidState && (
        <div className="flex items-center gap-2 rounded bg-red-900/50 px-3 py-2 text-sm text-red-200">
          <span className="text-red-400">⚠</span>
          <span>
            {overlappingCells.size > 0 && outOfBoundsCells.size > 0
              ? "Slates are overlapping and out of bounds"
              : overlappingCells.size > 0
                ? "Slates are overlapping"
                : "Slate is out of bounds"}
          </span>
        </div>
      )}
    </div>
  );
};
