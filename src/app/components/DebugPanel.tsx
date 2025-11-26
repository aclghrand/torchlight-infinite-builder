import { RawLoadout } from "@/src/tli/core";

interface DebugPanelProps {
  loadout: RawLoadout;
  debugPanelExpanded: boolean;
  setDebugPanelExpanded: (expanded: boolean) => void;
  onClose: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  loadout,
  debugPanelExpanded,
  setDebugPanelExpanded,
  onClose,
}) => {
  const copyDebugJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(loadout, null, 2));
      alert("Loadout JSON copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-800 border-t-2 border-blue-500 shadow-2xl z-50">
      {/* Panel Header */}
      <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Debug: RawLoadout
          </h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {JSON.stringify(loadout).length} bytes
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyDebugJson}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            title="Copy JSON to clipboard"
          >
            Copy JSON
          </button>
          <button
            onClick={() => setDebugPanelExpanded(!debugPanelExpanded)}
            className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 text-sm rounded transition-colors"
          >
            {debugPanelExpanded ? "▼ Minimize" : "▲ Expand"}
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
            title="Close debug panel"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Panel Content */}
      {debugPanelExpanded && (
        <div className="p-4 overflow-auto" style={{ maxHeight: "400px" }}>
          <pre className="text-xs font-mono text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap break-words">
            {JSON.stringify(loadout, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
