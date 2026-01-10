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
} from "@/src/lib/divinity-grid";
import {
  getOccupiedCells,
  getTransformedCells,
} from "@/src/lib/divinity-shapes";
import { getSlateColor } from "@/src/lib/divinity-utils";
import {
  type DivinityPage,
  ROTATIONS,
  type Rotation,
  SLATE_SHAPES,
  type SlateShape,
} from "@/src/tli/core";
import { DivinityGridCell } from "./DivinityGridCell";
import { SlateEditToolbar } from "./SlateEditToolbar";

const CELL_SIZE = 48; // h-12 w-12 = 48px

interface DivinityGridProps {
  divinityPage: DivinityPage;
  onMoveSlate: (
    slateId: string,
    position: { row: number; col: number },
  ) => void;
  onUnplaceSlate: (slateId: string) => void;
  onUpdateSlateRotation: (slateId: string, rotation: Rotation) => void;
  onUpdateSlateFlip: (
    slateId: string,
    flippedH: boolean,
    flippedV: boolean,
  ) => void;
  onUpdateSlateShape: (slateId: string, shape: SlateShape) => void;
}

export const DivinityGrid: React.FC<DivinityGridProps> = ({
  divinityPage,
  onMoveSlate,
  onUnplaceSlate,
  onUpdateSlateRotation,
  onUpdateSlateFlip,
  onUpdateSlateShape,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [draggedSlateId, setDraggedSlateId] = useState<string | undefined>();
  const [selectedSlateId, setSelectedSlateId] = useState<string | undefined>();
  const [toolbarPosition, setToolbarPosition] = useState<
    { x: number; y: number } | undefined
  >();
  const [dropTarget, setDropTarget] = useState<
    { row: number; col: number } | undefined
  >();
  // Pixel offset from cursor to block's top-left (set on mousedown)
  const [dragOffset, setDragOffset] = useState<
    { x: number; y: number } | undefined
  >();
  // Current cursor position in pixels relative to grid (for free-form movement)
  const [dragPosition, setDragPosition] = useState<
    { x: number; y: number } | undefined
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
    // Exclude dragged slate so underlying overlapping slates remain visible
    const placements = draggedSlateId
      ? divinityPage.placedSlates.filter((p) => p.slateId !== draggedSlateId)
      : divinityPage.placedSlates;
    const placed = findSlateAtCell(
      row,
      col,
      divinityPage.inventory,
      placements,
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
    if (placed && gridRef.current) {
      const slate = divinityPage.inventory.find((s) => s.id === placed.slateId);
      const placement = divinityPage.placedSlates.find(
        (p) => p.slateId === placed.slateId,
      );
      if (slate && placement) {
        const cells = getOccupiedCells(slate, placement);
        const minRow = Math.min(...cells.map(([r]) => r));
        const minCol = Math.min(...cells.map(([, c]) => c));
        const maxCol = Math.max(...cells.map(([, c]) => c));

        const gridRect = gridRef.current.getBoundingClientRect();
        const topY =
          gridRect.top + 8 + (minRow - DISPLAY_ROW_START) * CELL_SIZE;
        const centerX =
          gridRect.left +
          8 +
          ((minCol + maxCol + 1) / 2 - DISPLAY_COL_START) * CELL_SIZE;

        setSelectedSlateId(placed.slateId);
        setToolbarPosition({ x: centerX, y: topY });
      }
    } else {
      setSelectedSlateId(undefined);
      setToolbarPosition(undefined);
    }
  };

  const handleCloseToolbar = () => {
    setSelectedSlateId(undefined);
    setToolbarPosition(undefined);
  };

  const selectedSlate = selectedSlateId
    ? divinityPage.inventory.find((s) => s.id === selectedSlateId)
    : undefined;

  const handleRotateLeft = () => {
    if (!selectedSlate || !selectedSlateId) return;
    const currentIndex = ROTATIONS.indexOf(selectedSlate.rotation);
    const nextIndex = (currentIndex + 3) % ROTATIONS.length;
    onUpdateSlateRotation(selectedSlateId, ROTATIONS[nextIndex]);
  };

  const handleRotateRight = () => {
    if (!selectedSlate || !selectedSlateId) return;
    const currentIndex = ROTATIONS.indexOf(selectedSlate.rotation);
    const nextIndex = (currentIndex + 1) % ROTATIONS.length;
    onUpdateSlateRotation(selectedSlateId, ROTATIONS[nextIndex]);
  };

  const handleFlipH = () => {
    if (!selectedSlate || !selectedSlateId) return;
    onUpdateSlateFlip(
      selectedSlateId,
      !selectedSlate.flippedH,
      selectedSlate.flippedV,
    );
  };

  const handleFlipV = () => {
    if (!selectedSlate || !selectedSlateId) return;
    onUpdateSlateFlip(
      selectedSlateId,
      selectedSlate.flippedH,
      !selectedSlate.flippedV,
    );
  };

  const handleChangeShape = (): void => {
    if (!selectedSlate || !selectedSlateId) return;
    const currentIndex = SLATE_SHAPES.indexOf(selectedSlate.shape);
    const nextIndex = (currentIndex + 1) % SLATE_SHAPES.length;
    onUpdateSlateShape(selectedSlateId, SLATE_SHAPES[nextIndex]);
  };

  const handleRemove = (): void => {
    if (!selectedSlateId) return;
    onUnplaceSlate(selectedSlateId);
    handleCloseToolbar();
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggedSlateId || !gridRef.current || !dragOffset) return;

      const rect = gridRef.current.getBoundingClientRect();
      const cursorX = e.clientX - rect.left - 8;
      const cursorY = e.clientY - rect.top - 8;

      // Update pixel position for free-form movement
      setDragPosition({ x: cursorX, y: cursorY });

      // Calculate which grid cell the cursor is hovering over
      const hoverCol = Math.floor(cursorX / CELL_SIZE) + DISPLAY_COL_START;
      const hoverRow = Math.floor(cursorY / CELL_SIZE) + DISPLAY_ROW_START;

      // Calculate which cell within the slate was originally clicked
      const cellOffsetCol = Math.floor(dragOffset.x / CELL_SIZE);
      const cellOffsetRow = Math.floor(dragOffset.y / CELL_SIZE);

      // Drop target is the hovered cell minus the cell offset
      const col = hoverCol - cellOffsetCol;
      const row = hoverRow - cellOffsetRow;
      setDropTarget({ row, col });
    },
    [draggedSlateId, dragOffset],
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!draggedSlateId || !gridRef.current || !dragOffset) return;

      // Calculate final drop position using cell-based snapping
      const rect = gridRef.current.getBoundingClientRect();
      const cursorX = e.clientX - rect.left - 8;
      const cursorY = e.clientY - rect.top - 8;

      // Calculate which grid cell the cursor is over
      const hoverCol = Math.floor(cursorX / CELL_SIZE) + DISPLAY_COL_START;
      const hoverRow = Math.floor(cursorY / CELL_SIZE) + DISPLAY_ROW_START;

      // Calculate which cell within the slate was originally clicked
      const cellOffsetCol = Math.floor(dragOffset.x / CELL_SIZE);
      const cellOffsetRow = Math.floor(dragOffset.y / CELL_SIZE);

      // Final position is the hovered cell minus the cell offset
      const col = hoverCol - cellOffsetCol;
      const row = hoverRow - cellOffsetRow;

      onMoveSlate(draggedSlateId, { row, col });

      // Update toolbar position if we were dragging the selected slate
      if (draggedSlateId === selectedSlateId && selectedSlate) {
        const cells = getTransformedCells(
          selectedSlate.shape,
          selectedSlate.rotation,
          selectedSlate.flippedH,
          selectedSlate.flippedV,
        );
        const minRowOffset = Math.min(...cells.map(([r]) => r));
        const minColOffset = Math.min(...cells.map(([, c]) => c));
        const maxColOffset = Math.max(...cells.map(([, c]) => c));

        const minRow = row + minRowOffset;
        const minCol = col + minColOffset;
        const maxCol = col + maxColOffset;

        const topY = rect.top + 8 + (minRow - DISPLAY_ROW_START) * CELL_SIZE;
        const centerX =
          rect.left +
          8 +
          ((minCol + maxCol + 1) / 2 - DISPLAY_COL_START) * CELL_SIZE;

        setToolbarPosition({ x: centerX, y: topY });
      }

      setDraggedSlateId(undefined);
      setDropTarget(undefined);
      setDragOffset(undefined);
      setDragPosition(undefined);
    },
    [draggedSlateId, dragOffset, onMoveSlate, selectedSlateId, selectedSlate],
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
    if (!gridRef.current) return;

    setDraggedSlateId(slateId);

    const placement = divinityPage.placedSlates.find(
      (p) => p.slateId === slateId,
    );
    if (placement) {
      // Set initial drop target to current position
      setDropTarget({
        row: placement.position.row,
        col: placement.position.col,
      });

      // Calculate cursor position relative to grid (excluding padding)
      const rect = gridRef.current.getBoundingClientRect();
      const cursorX = e.clientX - rect.left - 8; // 8px = p-2 padding
      const cursorY = e.clientY - rect.top - 8;

      // Calculate block's top-left pixel position
      const blockX = (placement.position.col - DISPLAY_COL_START) * CELL_SIZE;
      const blockY = (placement.position.row - DISPLAY_ROW_START) * CELL_SIZE;

      // Store offset from cursor to block's top-left
      setDragOffset({ x: cursorX - blockX, y: cursorY - blockY });

      // Set initial drag position
      setDragPosition({ x: cursorX, y: cursorY });
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
      // Only mark as dragging if no other slate should be shown at this position
      const isDragging =
        draggedSlateCells.has(`${row},${col}`) && cellSlateId === undefined;

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

  // Helper to render a slate shape as a single floating block
  const renderSlateBlock = (
    slate: NonNullable<typeof draggedSlate>,
    left: number,
    top: number,
    opacity: string,
    zIndex: number,
    showInvalidOverlay: boolean,
  ) => {
    const shapeCells = getTransformedCells(
      slate.shape,
      slate.rotation,
      slate.flippedH,
      slate.flippedV,
    );

    // Find bounding box for the shape
    const minRow = Math.min(...shapeCells.map(([r]) => r));
    const maxRow = Math.max(...shapeCells.map(([r]) => r));
    const minCol = Math.min(...shapeCells.map(([, c]) => c));
    const maxCol = Math.max(...shapeCells.map(([, c]) => c));
    const shapeRows = maxRow - minRow + 1;
    const shapeCols = maxCol - minCol + 1;

    // Calculate edges for each cell
    const cellSet = new Set(shapeCells.map(([r, c]) => `${r},${c}`));
    const getCellEdges = (r: number, c: number) => ({
      top: !cellSet.has(`${r - 1},${c}`),
      right: !cellSet.has(`${r},${c + 1}`),
      bottom: !cellSet.has(`${r + 1},${c}`),
      left: !cellSet.has(`${r},${c - 1}`),
    });

    return (
      <div
        className="pointer-events-none absolute"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          width: `${shapeCols * CELL_SIZE}px`,
          height: `${shapeRows * CELL_SIZE}px`,
          zIndex,
        }}
      >
        {shapeCells.map(([r, c]) => {
          const edges = getCellEdges(r, c);
          const borderColor = "rgba(255, 255, 255, 0.7)";
          const borderWidth = "3px";
          const borderStyle: React.CSSProperties = { boxSizing: "border-box" };
          if (edges.top)
            borderStyle.borderTop = `${borderWidth} solid ${borderColor}`;
          if (edges.right)
            borderStyle.borderRight = `${borderWidth} solid ${borderColor}`;
          if (edges.bottom)
            borderStyle.borderBottom = `${borderWidth} solid ${borderColor}`;
          if (edges.left)
            borderStyle.borderLeft = `${borderWidth} solid ${borderColor}`;

          return (
            <div
              key={`${r}-${c}`}
              className={`absolute ${getSlateColor(slate)} ${opacity}`}
              style={{
                ...borderStyle,
                left: `${(c - minCol) * CELL_SIZE}px`,
                top: `${(r - minRow) * CELL_SIZE}px`,
                width: `${CELL_SIZE}px`,
                height: `${CELL_SIZE}px`,
              }}
            >
              {showInvalidOverlay && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `
                      linear-gradient(45deg, transparent 40%, rgba(239, 68, 68, 0.9) 40%, rgba(239, 68, 68, 0.9) 60%, transparent 60%),
                      linear-gradient(-45deg, transparent 40%, rgba(239, 68, 68, 0.9) 40%, rgba(239, 68, 68, 0.9) 60%, transparent 60%)
                    `,
                    backgroundSize: "100% 100%",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render drop preview at snapped grid position
  const renderDropPreview = () => {
    if (!draggedSlate || !dropTarget) return null;

    // Check if any preview cells are invalid
    const hasInvalidPreview = [...previewCells].some(
      (cell) =>
        invalidCells.has(cell) ||
        outOfBoundsCells.has(cell) ||
        // Check if overlapping with other slates (not the dragged one)
        [...overlappingCells].some((oc) => previewCells.has(oc)),
    );

    const left = (dropTarget.col - DISPLAY_COL_START) * CELL_SIZE + 8; // +8 for padding
    const top = (dropTarget.row - DISPLAY_ROW_START) * CELL_SIZE + 8;

    return renderSlateBlock(
      draggedSlate,
      left,
      top,
      "opacity-60",
      40,
      hasInvalidPreview,
    );
  };

  // Render floating dragged slate as a single unit (follows cursor freely)
  const renderFloatingSlate = () => {
    if (!draggedSlate || !dragPosition || !dragOffset) return null;

    // Position at cursor minus offset (block's top-left follows cursor with preserved offset)
    const left = dragPosition.x - dragOffset.x + 8; // +8 for padding
    const top = dragPosition.y - dragOffset.y + 8;

    return renderSlateBlock(draggedSlate, left, top, "opacity-80", 50, false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={gridRef}
        className={`relative inline-block rounded-lg bg-zinc-900 p-2 ${draggedSlateId ? "cursor-grabbing" : ""}`}
      >
        {rows}
        {renderDropPreview()}
        {renderFloatingSlate()}
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
      {selectedSlate &&
        toolbarPosition &&
        gridRef.current &&
        (() => {
          const isSelectedSlateDragging = draggedSlateId === selectedSlateId;
          let currentToolbarPosition = toolbarPosition;

          if (isSelectedSlateDragging && dropTarget) {
            const cells = getTransformedCells(
              selectedSlate.shape,
              selectedSlate.rotation,
              selectedSlate.flippedH,
              selectedSlate.flippedV,
            );
            const minRowOffset = Math.min(...cells.map(([r]) => r));
            const minColOffset = Math.min(...cells.map(([, c]) => c));
            const maxColOffset = Math.max(...cells.map(([, c]) => c));

            const minRow = dropTarget.row + minRowOffset;
            const minCol = dropTarget.col + minColOffset;
            const maxCol = dropTarget.col + maxColOffset;

            const gridRect = gridRef.current.getBoundingClientRect();
            const topY =
              gridRect.top + 8 + (minRow - DISPLAY_ROW_START) * CELL_SIZE;
            const centerX =
              gridRect.left +
              8 +
              ((minCol + maxCol + 1) / 2 - DISPLAY_COL_START) * CELL_SIZE;

            currentToolbarPosition = { x: centerX, y: topY };
          }

          return (
            <SlateEditToolbar
              slate={selectedSlate}
              position={currentToolbarPosition}
              onRotateLeft={handleRotateLeft}
              onRotateRight={handleRotateRight}
              onFlipH={handleFlipH}
              onFlipV={handleFlipV}
              onChangeShape={handleChangeShape}
              onRemove={handleRemove}
              onClose={handleCloseToolbar}
            />
          );
        })()}
    </div>
  );
};
