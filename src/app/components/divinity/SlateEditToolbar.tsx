"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { DivinitySlate } from "@/src/tli/core";
import { SlatePreview } from "./SlatePreview";

interface SlateEditToolbarProps {
  slate: DivinitySlate;
  position: { x: number; y: number };
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onChangeShape: () => void;
  onRemove: () => void;
  onClose: () => void;
}

const VIEWPORT_PADDING = 8;

export const SlateEditToolbar: React.FC<SlateEditToolbarProps> = ({
  slate,
  position,
  onRotateLeft,
  onRotateRight,
  onFlipH,
  onFlipV,
  onChangeShape,
  onRemove,
  onClose,
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const toolbarWidth = 200;
  const toolbarHeight = 80;

  const x = Math.max(
    VIEWPORT_PADDING,
    Math.min(
      position.x - toolbarWidth / 2,
      viewportWidth - toolbarWidth - VIEWPORT_PADDING,
    ),
  );
  const y = Math.max(
    VIEWPORT_PADDING,
    Math.min(
      position.y - toolbarHeight - 8,
      viewportHeight - toolbarHeight - VIEWPORT_PADDING,
    ),
  );

  return createPortal(
    <div ref={toolbarRef} className="fixed z-50" style={{ left: x, top: y }}>
      <div className="bg-zinc-900 border border-zinc-600 rounded-lg shadow-xl p-2">
        <div className="flex items-center gap-2 mb-2">
          <SlatePreview
            shape={slate.shape}
            god={slate.god}
            rotation={slate.rotation}
            flippedH={slate.flippedH}
            flippedV={slate.flippedV}
            size="small"
          />
          <span className="text-xs text-zinc-400">Edit Slate</span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onRotateLeft}
            className="rounded bg-zinc-700 px-2 py-1.5 text-sm text-zinc-200 hover:bg-zinc-600"
            title="Rotate Left"
          >
            ↺
          </button>
          <button
            type="button"
            onClick={onRotateRight}
            className="rounded bg-zinc-700 px-2 py-1.5 text-sm text-zinc-200 hover:bg-zinc-600"
            title="Rotate Right"
          >
            ↻
          </button>
          <button
            type="button"
            onClick={onFlipH}
            className="rounded bg-zinc-700 px-2 py-1.5 text-sm text-zinc-200 hover:bg-zinc-600"
            title="Flip Horizontal"
          >
            ↔
          </button>
          <button
            type="button"
            onClick={onFlipV}
            className="rounded bg-zinc-700 px-2 py-1.5 text-sm text-zinc-200 hover:bg-zinc-600"
            title="Flip Vertical"
          >
            ↕
          </button>
          <button
            type="button"
            onClick={onChangeShape}
            className="rounded bg-zinc-700 px-2 py-1.5 text-xs text-zinc-200 hover:bg-zinc-600"
            title="Change Shape"
          >
            {slate.shape}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded bg-red-700 px-2 py-1.5 text-sm text-zinc-200 hover:bg-red-600"
            title="Remove from Grid"
          >
            ✕
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
