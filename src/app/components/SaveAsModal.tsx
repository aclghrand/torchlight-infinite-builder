"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface SaveAsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName?: string;
}

export const SaveAsModal: React.FC<SaveAsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultName = "",
}) => {
  const [inputValue, setInputValue] = useState(defaultName);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleSave = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError("Please enter a name");
      return;
    }

    onSave(trimmed);
    setInputValue("");
    setError(undefined);
    onClose();
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

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultName);
      setError(undefined);
    }
  }, [isOpen, defaultName]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div
        className="relative bg-zinc-900 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-zinc-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-zinc-50">Save As</h2>

        <p className="text-sm text-zinc-400 mb-4">
          Enter a name for this build:
        </p>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(undefined);
          }}
          placeholder="My Build"
          className="w-full p-3 bg-zinc-800 text-zinc-50 rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 placeholder:text-zinc-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSave();
            }
          }}
          autoFocus
        />

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-lg font-medium transition-colors"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-50 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
