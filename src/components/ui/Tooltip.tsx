import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TooltipVariant = "default" | "legendary" | "prism";

interface TooltipProps {
  isVisible: boolean;
  triggerRect: DOMRect | undefined;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg";
  variant?: TooltipVariant;
}

const widthClasses = { sm: "w-72", md: "w-80", lg: "w-96" } as const;

const variantClasses = {
  default: "border-zinc-700",
  legendary: "border-amber-500/50",
  prism: "border-purple-500/50",
} as const;

const GAP = 8;
const VIEWPORT_PADDING = 8;

type Placement = "right" | "bottom" | "left" | "top";

const calculateSmartPosition = (
  triggerRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
): { x: number; y: number } => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calculate available space on each side
  const spaceRight = viewportWidth - triggerRect.right - GAP - VIEWPORT_PADDING;
  const spaceLeft = triggerRect.left - GAP - VIEWPORT_PADDING;
  const spaceBottom =
    viewportHeight - triggerRect.bottom - GAP - VIEWPORT_PADDING;
  const spaceTop = triggerRect.top - GAP - VIEWPORT_PADDING;

  // Determine best placement based on available space
  const placements: { placement: Placement; fits: boolean; space: number }[] = [
    { placement: "right", fits: spaceRight >= tooltipWidth, space: spaceRight },
    {
      placement: "bottom",
      fits: spaceBottom >= tooltipHeight,
      space: spaceBottom,
    },
    { placement: "left", fits: spaceLeft >= tooltipWidth, space: spaceLeft },
    { placement: "top", fits: spaceTop >= tooltipHeight, space: spaceTop },
  ];

  // Prefer placements that fit, sorted by available space
  const bestPlacement =
    placements.find((p) => p.fits) ??
    placements.sort((a, b) => b.space - a.space)[0];

  let x: number;
  let y: number;

  switch (bestPlacement.placement) {
    case "right":
      x = triggerRect.right + GAP;
      y = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
      break;
    case "left":
      x = triggerRect.left - tooltipWidth - GAP;
      y = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
      break;
    case "bottom":
      x = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
      y = triggerRect.bottom + GAP;
      break;
    case "top":
      x = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
      y = triggerRect.top - tooltipHeight - GAP;
      break;
  }

  // Clamp to viewport bounds
  x = Math.max(
    VIEWPORT_PADDING,
    Math.min(x, viewportWidth - tooltipWidth - VIEWPORT_PADDING),
  );
  y = Math.max(
    VIEWPORT_PADDING,
    Math.min(y, viewportHeight - tooltipHeight - VIEWPORT_PADDING),
  );

  return { x, y };
};

export const Tooltip = ({
  isVisible,
  triggerRect,
  children,
  width = "md",
  variant = "default",
}: TooltipProps) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (!isVisible || triggerRect === undefined) return;

    if (tooltipRef.current !== null) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const newPosition = calculateSmartPosition(
        triggerRect,
        rect.width,
        rect.height,
      );
      setPosition(newPosition);
    }
  }, [isVisible, triggerRect]);

  if (
    !isVisible ||
    triggerRect === undefined ||
    typeof document === "undefined"
  )
    return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className={`fixed z-50 pointer-events-none ${widthClasses[width]}`}
      style={{ left: position.x, top: position.y }}
    >
      <div
        className={`bg-zinc-950 text-zinc-50 p-3 rounded-lg shadow-xl border ${variantClasses[variant]}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};

interface TooltipTitleProps {
  children: React.ReactNode;
}

export const TooltipTitle = ({ children }: TooltipTitleProps) => (
  <div className="font-semibold text-sm mb-2 text-amber-400">{children}</div>
);

interface TooltipContentProps {
  children: React.ReactNode;
}

export const TooltipContent = ({ children }: TooltipContentProps) => (
  <div className="text-xs text-zinc-400 whitespace-pre-line">{children}</div>
);
