import type {
  DivinitySlate,
  PlacedSlate,
  Rotation,
  SlateShape,
} from "@/src/tli/core";

export const SHAPE_CELLS: Record<SlateShape, [number, number][]> = {
  O: [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ],
  L: [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
  ],
  Z: [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
  ],
  // Legendary slate shapes
  Single: [[0, 0]],
  // "A Corner of Divinity" - L shape:
  // OO
  // O
  CornerL: [
    [0, 0],
    [0, 1],
    [1, 0],
  ],
  // "Fallen Starlight" - vertical 2x1:
  // O
  // O
  Vertical2: [
    [0, 0],
    [1, 0],
  ],
  // "Pedigree of Gods" - custom 7-cell:
  // OO
  // OOO
  //  OO
  Pedigree: [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 1],
    [2, 2],
  ],
};

export const SHAPE_BOUNDS: Record<SlateShape, { rows: number; cols: number }> =
  {
    O: { rows: 2, cols: 2 },
    L: { rows: 3, cols: 2 },
    Z: { rows: 2, cols: 3 },
    // Legendary slate shapes
    Single: { rows: 1, cols: 1 },
    CornerL: { rows: 2, cols: 2 },
    Vertical2: { rows: 2, cols: 1 },
    Pedigree: { rows: 3, cols: 3 },
  };

const normalizeCoordinates = (
  cells: [number, number][],
): [number, number][] => {
  const minRow = Math.min(...cells.map(([r]) => r));
  const minCol = Math.min(...cells.map(([, c]) => c));
  return cells.map(([r, c]) => [r - minRow, c - minCol]);
};

const rotateCells90 = (
  cells: [number, number][],
  bounds: { rows: number; cols: number },
): { cells: [number, number][]; bounds: { rows: number; cols: number } } => {
  const rotated = cells.map(([r, c]): [number, number] => [
    c,
    bounds.rows - 1 - r,
  ]);
  return {
    cells: normalizeCoordinates(rotated),
    bounds: { rows: bounds.cols, cols: bounds.rows },
  };
};

export const applyRotation = (
  shape: SlateShape,
  rotation: Rotation,
): { cells: [number, number][]; bounds: { rows: number; cols: number } } => {
  let cells = [...SHAPE_CELLS[shape]];
  let bounds = { ...SHAPE_BOUNDS[shape] };

  const rotations = rotation / 90;
  for (let i = 0; i < rotations; i++) {
    const result = rotateCells90(cells, bounds);
    cells = result.cells;
    bounds = result.bounds;
  }

  return { cells, bounds };
};

const flipHorizontal = (
  cells: [number, number][],
  bounds: { rows: number; cols: number },
): [number, number][] => {
  const flipped = cells.map(([r, c]): [number, number] => [
    r,
    bounds.cols - 1 - c,
  ]);
  return normalizeCoordinates(flipped);
};

const flipVertical = (
  cells: [number, number][],
  bounds: { rows: number; cols: number },
): [number, number][] => {
  const flipped = cells.map(([r, c]): [number, number] => [
    bounds.rows - 1 - r,
    c,
  ]);
  return normalizeCoordinates(flipped);
};

export const getTransformedCells = (
  shape: SlateShape,
  rotation: Rotation,
  flippedH: boolean,
  flippedV: boolean,
): [number, number][] => {
  const { cells: rotatedCells, bounds } = applyRotation(shape, rotation);
  let cells = rotatedCells;

  if (flippedH) {
    cells = flipHorizontal(cells, bounds);
  }
  if (flippedV) {
    cells = flipVertical(cells, bounds);
  }

  return cells;
};

export const getOccupiedCells = (
  slate: DivinitySlate,
  placed: PlacedSlate,
): [number, number][] => {
  const cells = getTransformedCells(
    slate.shape,
    slate.rotation,
    slate.flippedH,
    slate.flippedV,
  );

  return cells.map(([r, c]) => [
    r + placed.position.row,
    c + placed.position.col,
  ]);
};

export const getTransformedBounds = (
  shape: SlateShape,
  rotation: Rotation,
): { rows: number; cols: number } => {
  const { bounds } = applyRotation(shape, rotation);
  return bounds;
};
