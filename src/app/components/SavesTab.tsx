"use client";

import { useState } from "react";
import { SaveMetadata } from "../lib/saves";

interface SavesTabProps {
  saves: SaveMetadata[];
  currentSaveId: string | undefined;
  onLoad: (saveId: string) => void;
  onRename: (saveId: string, newName: string) => void;
  onCopy: (saveId: string) => void;
  onDelete: (saveId: string) => void;
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

interface SaveCardProps {
  save: SaveMetadata;
  isCurrent: boolean;
  onLoad: () => void;
  onRename: (newName: string) => void;
  onCopy: () => void;
  onDelete: () => void;
}

const SaveCard: React.FC<SaveCardProps> = ({
  save,
  isCurrent,
  onLoad,
  onRename,
  onCopy,
  onDelete,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(save.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== save.name) {
      onRename(trimmed);
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setRenameValue(save.name);
    setIsRenaming(false);
  };

  return (
    <div
      className={`bg-zinc-900 rounded-lg p-4 border ${
        isCurrent ? "border-amber-500" : "border-zinc-700"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="flex-1 px-2 py-1 bg-zinc-800 text-zinc-50 rounded border border-zinc-600 focus:outline-none focus:border-amber-500 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit();
                  if (e.key === "Escape") handleRenameCancel();
                }}
                autoFocus
              />
              <button
                onClick={handleRenameSubmit}
                className="px-2 py-1 bg-amber-500 text-zinc-950 rounded text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleRenameCancel}
                className="px-2 py-1 bg-zinc-700 text-zinc-50 rounded text-sm hover:bg-zinc-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-zinc-50 truncate">
                {save.name}
              </h3>
              {isCurrent && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-xs rounded-full">
                  Current
                </span>
              )}
            </div>
          )}

          <div className="mt-1 text-sm text-zinc-500">
            <span>Created: {formatDate(save.createdAt)}</span>
            <span className="mx-2">•</span>
            <span>Updated: {formatDate(save.updatedAt)}</span>
          </div>
        </div>
      </div>

      {showDeleteConfirm ? (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-zinc-300 mb-3">
            Are you sure you want to delete &quot;{save.name}&quot;?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onDelete();
                setShowDeleteConfirm(false);
              }}
              className="px-3 py-1.5 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 bg-zinc-700 text-zinc-50 rounded text-sm hover:bg-zinc-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {!isCurrent && (
            <button
              onClick={onLoad}
              className="px-3 py-1.5 bg-amber-500 text-zinc-950 rounded text-sm font-medium hover:bg-amber-600 transition-colors"
            >
              Load
            </button>
          )}
          <button
            onClick={() => {
              setRenameValue(save.name);
              setIsRenaming(true);
            }}
            className="px-3 py-1.5 bg-zinc-700 text-zinc-50 rounded text-sm hover:bg-zinc-600 transition-colors"
          >
            Rename
          </button>
          <button
            onClick={onCopy}
            className="px-3 py-1.5 bg-zinc-700 text-zinc-50 rounded text-sm hover:bg-zinc-600 transition-colors"
          >
            Copy
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-1.5 bg-zinc-700 text-red-400 rounded text-sm hover:bg-zinc-600 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export const SavesTab: React.FC<SavesTabProps> = ({
  saves,
  currentSaveId,
  onLoad,
  onRename,
  onCopy,
  onDelete,
}) => {
  const sortedSaves = [...saves].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-50">
          Your Saves ({saves.length})
        </h2>
      </div>

      {saves.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <p>
            No saves yet. Use &quot;Save As&quot; to create your first save.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedSaves.map((save) => (
            <SaveCard
              key={save.id}
              save={save}
              isCurrent={save.id === currentSaveId}
              onLoad={() => onLoad(save.id)}
              onRename={(newName) => onRename(save.id, newName)}
              onCopy={() => onCopy(save.id)}
              onDelete={() => onDelete(save.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
