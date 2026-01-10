import { applyRotation, getTransformedCells } from "@/src/lib/divinity-shapes";
import { GOD_COLORS, LEGENDARY_SLATE_COLOR } from "@/src/lib/divinity-utils";
import type { DivinityGod, Rotation, SlateShape } from "@/src/tli/core";

interface SlatePreviewProps {
  shape: SlateShape;
  god?: DivinityGod;
  rotation?: Rotation;
  flippedH?: boolean;
  flippedV?: boolean;
  size?: "small" | "medium" | "large";
  isLegendary?: boolean;
}

export const SlatePreview: React.FC<SlatePreviewProps> = ({
  shape,
  god,
  rotation = 0,
  flippedH = false,
  flippedV = false,
  size = "medium",
  isLegendary = false,
}) => {
  const cells = getTransformedCells(shape, rotation, flippedH, flippedV);
  const { bounds } = applyRotation(shape, rotation);

  const cellSize = size === "small" ? 8 : size === "medium" ? 12 : 16;
  const gap = 1;

  const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));

  const getCellColor = (): string => {
    if (isLegendary) {
      return LEGENDARY_SLATE_COLOR;
    }
    if (god !== undefined) {
      return GOD_COLORS[god];
    }
    return "bg-zinc-600";
  };

  const cellColor = getCellColor();

  const gridRows = [];
  for (let row = 0; row < bounds.rows; row++) {
    const rowCells = [];
    for (let col = 0; col < bounds.cols; col++) {
      const isFilled = cellSet.has(`${row},${col}`);
      rowCells.push(
        <div
          key={`${row}-${col}`}
          className={`${isFilled ? cellColor : "bg-transparent"}`}
          style={{ width: cellSize, height: cellSize, borderRadius: 2 }}
        />,
      );
    }
    gridRows.push(
      <div key={row} className="flex" style={{ gap }}>
        {rowCells}
      </div>,
    );
  }

  return (
    <div className="flex flex-col" style={{ gap }}>
      {gridRows}
    </div>
  );
};
