"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildCode: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  buildCode,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Reset copied state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal Content */}
      <div
        className="relative bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-6 max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
          Export Loadout
        </h2>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Copy this build code to save or share your build:
        </p>

        {/* Build Code Display */}
        <div className="bg-zinc-100 dark:bg-zinc-700 p-3 rounded-lg mb-4 max-h-32 overflow-auto">
          <code className="text-sm text-zinc-800 dark:text-zinc-200 break-all">
            {buildCode}
          </code>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              copied
                ? "bg-green-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {copied ? "Copied!" : "Copy Build Code"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-600 hover:bg-zinc-300 dark:hover:bg-zinc-500 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
