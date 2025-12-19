import type {
  DivinitySlate,
  PlacedSlate,
  Rotation,
  SlateShape,
} from "@/src/tli/core";
import { getOccupiedCells, getTransformedCells } from "./divinity-shapes";

export const GRID_MASK: number[][] = [
  [0, 0, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 0, 0],
];

export const GRID_ROWS = 6;
export const GRID_COLS = 6;

// Display area extends 1 cell beyond grid in each direction for out-of-bounds visibility
export const DISPLAY_ROW_START = -1;
export const DISPLAY_ROW_END = GRID_ROWS + 1;
export const DISPLAY_COL_START = -1;
export const DISPLAY_COL_END = GRID_COLS + 1;

export const isValidGridCell = (row: number, col: number): boolean => {
  if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) {
    return false;
  }
  return GRID_MASK[row][col] === 1;
};

export const buildOccupiedCellsSet = (
  slates: DivinitySlate[],
  placements: PlacedSlate[],
): Set<string> => {
  const occupied = new Set<string>();

  placements.forEach((placement) => {
    const slate = slates.find((s) => s.id === placement.slateId);
    if (!slate) return;

    const cells = getOccupiedCells(slate, placement);
    for (const [r, c] of cells) {
      occupied.add(`${r},${c}`);
    }
  });

  return occupied;
};

export const canPlaceSlate = (
  shape: SlateShape,
  position: { row: number; col: number },
  rotation: Rotation,
  flippedH: boolean,
  flippedV: boolean,
  occupiedCells: Set<string>,
): boolean => {
  const cells = getTransformedCells(shape, rotation, flippedH, flippedV);
  const absoluteCells = cells.map(([r, c]): [number, number] => [
    r + position.row,
    c + position.col,
  ]);

  return absoluteCells.every(([r, c]) => {
    const key = `${r},${c}`;
    return isValidGridCell(r, c) && !occupiedCells.has(key);
  });
};

export const findSlateAtCell = (
  row: number,
  col: number,
  slates: DivinitySlate[],
  placements: PlacedSlate[],
): PlacedSlate | undefined => {
  // Iterate in reverse so most recently placed slate appears on top
  for (let i = placements.length - 1; i >= 0; i--) {
    const placement = placements[i];
    const slate = slates.find((s) => s.id === placement.slateId);
    if (!slate) continue;

    const cells = getOccupiedCells(slate, placement);
    if (cells.some(([r, c]) => r === row && c === col)) {
      return placement;
    }
  }
  return undefined;
};

export const findGridCenter = (): { row: number; col: number } => {
  return { row: 2, col: 2 };
};

export const findOverlappingCells = (
  slates: DivinitySlate[],
  placements: PlacedSlate[],
): Set<string> => {
  const cellCounts = new Map<string, number>();

  placements.forEach((placement) => {
    const slate = slates.find((s) => s.id === placement.slateId);
    if (!slate) return;

    const cells = getOccupiedCells(slate, placement);
    cells.forEach(([r, c]) => {
      const key = `${r},${c}`;
      cellCounts.set(key, (cellCounts.get(key) ?? 0) + 1);
    });
  });

  const overlapping = new Set<string>();
  cellCounts.forEach((count, key) => {
    if (count > 1) {
      overlapping.add(key);
    }
  });

  return overlapping;
};

export const findOutOfBoundsCells = (
  slates: DivinitySlate[],
  placements: PlacedSlate[],
): Set<string> => {
  const outOfBounds = new Set<string>();

  placements.forEach((placement) => {
    const slate = slates.find((s) => s.id === placement.slateId);
    if (!slate) return;

    const cells = getOccupiedCells(slate, placement);
    cells.forEach(([r, c]) => {
      if (!isValidGridCell(r, c)) {
        outOfBounds.add(`${r},${c}`);
      }
    });
  });

  return outOfBounds;
};
