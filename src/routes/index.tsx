import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ImportModal } from "../components/modals/ImportModal";
import { decodeBuildCode } from "../lib/build-code";
import {
  deleteSaveData,
  generateSaveId,
  loadSaveData,
  loadSavesIndex,
  type SaveMetadata,
  type SavesIndex,
  saveSaveData,
  saveSavesIndex,
} from "../lib/saves";
import { createEmptySaveData } from "../lib/storage";

export const Route = createFileRoute("/")({
  component: SavesPage,
});

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
  onOpen: () => void;
  onRename: (newName: string) => void;
  onCopy: () => void;
  onDelete: () => void;
}

const SaveCard: React.FC<SaveCardProps> = ({
  save,
  onOpen,
  onRename,
  onCopy,
  onDelete,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(save.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRenameSubmit = (): void => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== save.name) {
      onRename(trimmed);
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = (): void => {
    setRenameValue(save.name);
    setIsRenaming(false);
  };

  return (
    <div
      className="bg-zinc-900 rounded-lg p-4 border border-zinc-700 hover:border-zinc-500 transition-colors cursor-pointer"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="flex-1 px-2 py-1 bg-zinc-800 text-zinc-50 rounded border border-zinc-600 focus:outline-none focus:border-amber-500 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit();
                  if (e.key === "Escape") handleRenameCancel();
                }}
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
            <h3 className="text-lg font-medium text-zinc-50 truncate">
              {save.name}
            </h3>
          )}

          <div className="mt-1 text-sm text-zinc-500">
            <span>Created: {formatDate(save.createdAt)}</span>
            <span className="mx-2">•</span>
            <span>Updated: {formatDate(save.updatedAt)}</span>
          </div>
        </div>
      </div>

      {showDeleteConfirm ? (
        <div
          className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
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
        <div
          className="mt-4 flex flex-wrap gap-2"
          onClick={(e) => e.stopPropagation()}
        >
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

function SavesPage(): React.ReactNode {
  const navigate = useNavigate();
  const [savesIndex, setSavesIndex] = useState<SavesIndex>({
    currentSaveId: undefined,
    saves: [],
  });
  const [mounted, setMounted] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const index = loadSavesIndex();
    setSavesIndex(index);
  }, []);

  const handleOpenSave = (saveId: string): void => {
    navigate({ to: "/builder", search: { id: saveId } });
  };

  const handleCreateNew = (): void => {
    const now = Date.now();
    const newSaveId = generateSaveId();
    const newMetadata: SaveMetadata = {
      id: newSaveId,
      name: "Untitled",
      createdAt: now,
      updatedAt: now,
    };

    const success = saveSaveData(newSaveId, createEmptySaveData());
    if (success) {
      const newIndex: SavesIndex = {
        currentSaveId: newSaveId,
        saves: [...savesIndex.saves, newMetadata],
      };
      saveSavesIndex(newIndex);
      setSavesIndex(newIndex);
      navigate({ to: "/builder", search: { id: newSaveId } });
    }
  };

  const handleRenameSave = (saveId: string, newName: string): void => {
    const updatedSaves = savesIndex.saves.map((s) =>
      s.id === saveId ? { ...s, name: newName } : s,
    );
    const newIndex = { ...savesIndex, saves: updatedSaves };
    saveSavesIndex(newIndex);
    setSavesIndex(newIndex);
  };

  const handleCopySave = (saveId: string): void => {
    const original = savesIndex.saves.find((s) => s.id === saveId);
    if (original === undefined) return;

    const data = loadSaveData(saveId);
    if (data === undefined) return;

    const now = Date.now();
    const newSaveId = generateSaveId();
    const newMetadata: SaveMetadata = {
      id: newSaveId,
      name: `${original.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };

    const success = saveSaveData(newSaveId, data);
    if (success) {
      const newIndex = {
        ...savesIndex,
        saves: [...savesIndex.saves, newMetadata],
      };
      saveSavesIndex(newIndex);
      setSavesIndex(newIndex);
    }
  };

  const handleDeleteSave = (saveId: string): void => {
    deleteSaveData(saveId);
    const remainingSaves = savesIndex.saves.filter((s) => s.id !== saveId);
    const newIndex = {
      ...savesIndex,
      currentSaveId:
        savesIndex.currentSaveId === saveId
          ? undefined
          : savesIndex.currentSaveId,
      saves: remainingSaves,
    };
    saveSavesIndex(newIndex);
    setSavesIndex(newIndex);
  };

  const handleImportBuild = (code: string): boolean => {
    const decoded = decodeBuildCode(code);
    if (decoded === null) {
      return false;
    }

    const now = Date.now();
    const newSaveId = generateSaveId();
    const newMetadata: SaveMetadata = {
      id: newSaveId,
      name: "Imported Build",
      createdAt: now,
      updatedAt: now,
    };

    const success = saveSaveData(newSaveId, decoded);
    if (success) {
      const newIndex: SavesIndex = {
        currentSaveId: newSaveId,
        saves: [...savesIndex.saves, newMetadata],
      };
      saveSavesIndex(newIndex);
      setSavesIndex(newIndex);
      navigate({ to: "/builder", search: { id: newSaveId } });
    }
    return success;
  };

  if (!mounted) {
    return null;
  }

  const sortedSaves = [...savesIndex.saves].sort(
    (a, b) => b.updatedAt - a.updatedAt,
  );

  return (
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full px-6">
        <div className="flex items-center gap-3 py-6">
          <h1 className="text-3xl font-bold text-zinc-50">
            Torchlight Of Building
          </h1>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/30">
            Pre-Alpha
          </span>
        </div>

        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-amber-400 text-lg">🛠️</span>
            <div>
              <p className="text-amber-200 font-medium">Early Development</p>
              <p className="text-zinc-400 text-sm mt-1">
                Please be patient and bear with me on any issues you encounter
                with this app, as it's still in early phases of development.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-zinc-50">
            Your Builds ({savesIndex.saves.length})
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setImportModalOpen(true)}
              className="px-4 py-2 bg-zinc-700 text-zinc-50 rounded-lg font-medium hover:bg-zinc-600 transition-colors"
            >
              Import Build
            </button>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-amber-500 text-zinc-950 rounded-lg font-medium hover:bg-amber-600 transition-colors"
            >
              Create New
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pb-6 pr-2">
          {savesIndex.saves.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900 rounded-lg border border-zinc-700">
              <div className="text-zinc-400 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto mb-4 opacity-50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-lg">No builds yet</p>
                <p className="text-sm text-zinc-500 mt-1">
                  Create your first character build to get started
                </p>
              </div>
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-amber-500 text-zinc-950 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
              >
                Create New Build
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {sortedSaves.map((save) => (
                <SaveCard
                  key={save.id}
                  save={save}
                  onOpen={() => handleOpenSave(save.id)}
                  onRename={(newName) => handleRenameSave(save.id, newName)}
                  onCopy={() => handleCopySave(save.id)}
                  onDelete={() => handleDeleteSave(save.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportBuild}
      />
    </div>
  );
}
