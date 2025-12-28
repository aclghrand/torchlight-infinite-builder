import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { encodeBuildCode } from "../../lib/build-code";
import {
  loadDebugModeFromStorage,
  saveDebugModeToStorage,
} from "../../lib/storage";
import {
  useCurrentSaveName,
  useLoadout,
  useSaveDataRaw,
} from "../../stores/builderStore";
import { DebugPanel } from "../DebugPanel";
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

  const loadout = useLoadout();

  const [debugMode, setDebugMode] = useState(false);
  const [debugPanelExpanded, setDebugPanelExpanded] = useState(true);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [buildCode, setBuildCode] = useState("");

  useEffect(() => {
    setDebugMode(loadDebugModeFromStorage());
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

  const handleExport = useCallback(() => {
    const code = encodeBuildCode(saveDataForExport);
    setBuildCode(code);
    setExportModalOpen(true);
  }, [saveDataForExport]);

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
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
              TLI Character Build Planner
            </h1>
            {currentSaveName !== undefined && (
              <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-zinc-300">
                {currentSaveName}
              </span>
            )}
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
            onClose={handleDebugToggle}
          />
        )}
      </div>
    </div>
  );
};
