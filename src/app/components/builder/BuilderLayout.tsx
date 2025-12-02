"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useBuilderStore } from "../../stores/builderStore";
import { PageTabs } from "../PageTabs";
import { DebugPanel } from "../DebugPanel";
import { ExportModal } from "../modals/ExportModal";
import { ImportModal } from "../modals/ImportModal";
import { Toast } from "../Toast";
import { ActivePage } from "../../lib/types";
import {
  loadDebugModeFromStorage,
  saveDebugModeToStorage,
} from "../../lib/storage";
import { encodeBuildCode, decodeBuildCode } from "../../lib/build-code";

interface BuilderLayoutProps {
  children: ReactNode;
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

export const BuilderLayout = ({
  children,
  activePage,
  setActivePage,
}: BuilderLayoutProps) => {
  const router = useRouter();

  const currentSaveName = useBuilderStore((state) => state.currentSaveName);
  const currentSaveId = useBuilderStore((state) => state.currentSaveId);
  const hasUnsavedChanges = useBuilderStore((state) => state.hasUnsavedChanges);
  const loadout = useBuilderStore((state) => state.loadout);
  const save = useBuilderStore((state) => state.save);
  const setLoadout = useBuilderStore((state) => state.setLoadout);

  const [debugMode, setDebugMode] = useState(false);
  const [debugPanelExpanded, setDebugPanelExpanded] = useState(true);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [buildCode, setBuildCode] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [saveSuccessToastVisible, setSaveSuccessToastVisible] = useState(false);

  useEffect(() => {
    setDebugMode(loadDebugModeFromStorage());
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSave = useCallback(() => {
    const success = save();
    if (success) {
      setSaveSuccessToastVisible(true);
    }
  }, [save]);

  const handleBackToSaves = useCallback(() => {
    if (hasUnsavedChanges) {
      setToastVisible(true);
    } else {
      router.push("/");
    }
  }, [hasUnsavedChanges, router]);

  const handleDebugToggle = useCallback(() => {
    setDebugMode((prev) => {
      const newValue = !prev;
      saveDebugModeToStorage(newValue);
      return newValue;
    });
  }, []);

  const handleExport = useCallback(() => {
    const code = encodeBuildCode(loadout);
    setBuildCode(code);
    setExportModalOpen(true);
  }, [loadout]);

  const handleImport = useCallback(
    (code: string): boolean => {
      const decoded = decodeBuildCode(code);
      if (decoded) {
        setLoadout(decoded);
        return true;
      }
      return false;
    },
    [setLoadout],
  );

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
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
            {currentSaveName && (
              <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-zinc-300">
                {currentSaveName}
                {hasUnsavedChanges && (
                  <span className="ml-1 text-amber-500">*</span>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!currentSaveId || !hasUnsavedChanges}
              className="rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
            >
              Save
            </button>
            <button
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
          </div>
        </div>

        <PageTabs activePage={activePage} setActivePage={setActivePage} />

        {children}

        <div className="mt-8 flex gap-4">
          <button
            onClick={handleExport}
            className="flex-1 rounded-lg bg-green-500 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-green-600"
          >
            Export
          </button>
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex-1 rounded-lg bg-amber-500 px-6 py-3 text-lg font-semibold text-zinc-950 transition-colors hover:bg-amber-600"
          >
            Import
          </button>
        </div>

        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          buildCode={buildCode}
        />

        <ImportModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImport={handleImport}
        />

        <Toast
          message="You have unsaved changes. Save your work before leaving."
          isVisible={toastVisible}
          onDismiss={() => setToastVisible(false)}
          duration={0}
          variant="warning"
        />

        <Toast
          message="Build saved successfully!"
          isVisible={saveSuccessToastVisible}
          onDismiss={() => setSaveSuccessToastVisible(false)}
          duration={3000}
          variant="success"
        />

        {debugMode && (
          <DebugPanel
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
