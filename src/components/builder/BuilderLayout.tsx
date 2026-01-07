import { useNavigate } from "@tanstack/react-router";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { encodeBuildCode } from "../../lib/build-code";
import {
  loadDebugModeFromStorage,
  loadDebugPanelHeightFromStorage,
  loadDebugPanelTabFromStorage,
  saveDebugModeToStorage,
  saveDebugPanelHeightToStorage,
  saveDebugPanelTabToStorage,
} from "../../lib/storage";
import {
  useBuilderActions,
  useCurrentSaveName,
  useLoadout,
  useSaveDataRaw,
} from "../../stores/builderStore";
import {
  DEBUG_PANEL_DEFAULT_HEIGHT,
  DEBUG_PANEL_HEADER_HEIGHT,
  DebugPanel,
  type DebugView,
} from "../DebugPanel";
import { ExportModal } from "../modals/ExportModal";
import { PageTabs } from "../PageTabs";
import { StatsPanel } from "./StatsPanel";

interface BuilderLayoutProps {
  children: ReactNode;
}

export const BuilderLayout = ({ children }: BuilderLayoutProps) => {
  const navigate = useNavigate();

  const currentSaveName = useCurrentSaveName();
  const saveDataForExport = useSaveDataRaw("export");
  const { setSaveData, renameCurrentSave } = useBuilderActions();

  const loadout = useLoadout();

  const [debugMode, setDebugMode] = useState(false);
  const [debugPanelExpanded, setDebugPanelExpanded] = useState(true);
  const [debugPanelHeight, setDebugPanelHeight] = useState(
    DEBUG_PANEL_DEFAULT_HEIGHT,
  );
  const [debugPanelView, setDebugPanelView] = useState<DebugView>("saveData");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [buildCode, setBuildCode] = useState("");
  const [isRenamingBuild, setIsRenamingBuild] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDebugMode(loadDebugModeFromStorage());
    setDebugPanelHeight(
      loadDebugPanelHeightFromStorage(DEBUG_PANEL_DEFAULT_HEIGHT),
    );
    setDebugPanelView(loadDebugPanelTabFromStorage() as DebugView);
  }, []);

  const handleBackToSaves = useCallback(() => {
    navigate({ to: "/" });
  }, [navigate]);

  const handleDebugToggle = useCallback(() => {
    setDebugMode((prev) => {
      const newValue = !prev;
      saveDebugModeToStorage(newValue);
      return newValue;
    });
  }, []);

  const handleDebugPanelHeightChange = useCallback((height: number) => {
    setDebugPanelHeight(height);
    saveDebugPanelHeightToStorage(height);
  }, []);

  const handleDebugPanelViewChange = useCallback((view: DebugView) => {
    setDebugPanelView(view);
    saveDebugPanelTabToStorage(view);
  }, []);

  const handleExport = useCallback(() => {
    const code = encodeBuildCode(saveDataForExport);
    setBuildCode(code);
    setExportModalOpen(true);
  }, [saveDataForExport]);

  const handleStartRename = useCallback(() => {
    setRenameValue(currentSaveName ?? "");
    setIsRenamingBuild(true);
    setTimeout(() => renameInputRef.current?.focus(), 0);
  }, [currentSaveName]);

  const handleRenameSubmit = useCallback(() => {
    const trimmed = renameValue.trim();
    if (trimmed.length > 0 && trimmed !== currentSaveName) {
      renameCurrentSave(trimmed);
    }
    setIsRenamingBuild(false);
  }, [renameValue, currentSaveName, renameCurrentSave]);

  const handleRenameCancel = useCallback(() => {
    setRenameValue(currentSaveName ?? "");
    setIsRenamingBuild(false);
  }, [currentSaveName]);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleRenameSubmit();
      } else if (e.key === "Escape") {
        handleRenameCancel();
      }
    },
    [handleRenameSubmit, handleRenameCancel],
  );

  // Calculate padding needed when debug panel is visible
  const debugPanelTotalHeight = debugMode
    ? DEBUG_PANEL_HEADER_HEIGHT + (debugPanelExpanded ? debugPanelHeight : 0)
    : 0;

  return (
    <div
      className="min-h-screen bg-zinc-950 p-6"
      style={{ paddingBottom: debugPanelTotalHeight + 24 }}
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleBackToSaves}
              className="text-zinc-400 transition-colors hover:text-zinc-200"
              title="Back to Saves"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-zinc-50">
              Torchlight of Building
            </h1>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/30">
              Pre-Alpha
            </span>
            {currentSaveName !== undefined &&
              (isRenamingBuild ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    className="rounded-full border border-amber-500 bg-zinc-800 px-3 py-1 text-sm text-zinc-50 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleRenameSubmit}
                    className="rounded px-2 py-1 text-sm font-medium text-amber-500 transition-colors hover:bg-zinc-800"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleRenameCancel}
                    className="rounded px-2 py-1 text-sm text-zinc-400 transition-colors hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStartRename}
                  className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
                  title="Click to rename"
                >
                  {currentSaveName}
                </button>
              ))}
            <div className="ml-4 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1.5">
              <span className="text-amber-400">🛠️</span>
              <span className="text-amber-200 text-sm">
                Early development — please be patient with any issues!
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDebugToggle}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                debugMode
                  ? "bg-amber-400 text-zinc-950 hover:bg-amber-500"
                  : "border border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
              title="Toggle Debug Mode"
            >
              {debugMode ? "Debug ON" : "Debug"}
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="rounded-lg bg-green-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-green-600"
              title="Export Build"
            >
              Export
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          <aside className="w-64 shrink-0">
            <StatsPanel />
          </aside>

          <main className="min-w-0 flex-1">
            <PageTabs />

            {children}
          </main>
        </div>

        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          buildCode={buildCode}
        />

        {debugMode && (
          <DebugPanel
            saveData={saveDataForExport}
            loadout={loadout}
            debugPanelExpanded={debugPanelExpanded}
            setDebugPanelExpanded={setDebugPanelExpanded}
            panelHeight={debugPanelHeight}
            setPanelHeight={handleDebugPanelHeightChange}
            view={debugPanelView}
            setView={handleDebugPanelViewChange}
            onClose={handleDebugToggle}
            onSaveDataChange={setSaveData}
          />
        )}
      </div>
    </div>
  );
};
