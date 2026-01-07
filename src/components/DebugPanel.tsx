import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collectUnimplementedItems,
  collectUnparseableAffixes,
} from "@/src/lib/debug-utils";
import type { SaveData } from "@/src/lib/save-data";
import { getAllAffixes } from "@/src/tli/calcs/affix-collectors";
import type { Loadout } from "@/src/tli/core";

export type DebugView = "saveData" | "loadout" | "unparseable" | "affixes";

// Find all paths in the JSON tree that contain or lead to matches
const findMatchingPaths = (data: unknown, searchTerm: string): Set<string> => {
  const matches = new Set<string>();
  const searchLower = searchTerm.toLowerCase();

  const traverse = (value: unknown, path: string): boolean => {
    let hasMatch = false;

    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === "object") {
      for (const [key, val] of Object.entries(value as object)) {
        const childPath = path !== "" ? `${path}.${key}` : key;

        // Check if key matches
        if (key.toLowerCase().includes(searchLower)) {
          hasMatch = true;
          matches.add(childPath);
        }

        // Recurse into children
        if (traverse(val, childPath)) {
          hasMatch = true;
          matches.add(childPath);
        }
      }
    } else {
      // Check if primitive value matches
      const strValue = String(value).toLowerCase();
      if (strValue.includes(searchLower)) {
        hasMatch = true;
      }
    }

    if (hasMatch && path !== "") {
      matches.add(path);
      // Add all parent paths
      const parts = path.split(".");
      for (let i = 1; i < parts.length; i++) {
        matches.add(parts.slice(0, i).join("."));
      }
    }

    return hasMatch;
  };

  traverse(data, "");
  return matches;
};

// Highlight matching text within a string
const highlightMatch = (
  text: string,
  searchTerm: string,
  className: string,
): React.ReactNode => {
  if (searchTerm === "") {
    return <span className={className}>{text}</span>;
  }

  const searchLower = searchTerm.toLowerCase();
  const textLower = text.toLowerCase();
  const index = textLower.indexOf(searchLower);

  if (index === -1) {
    return <span className={className}>{text}</span>;
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + searchTerm.length);
  const after = text.slice(index + searchTerm.length);

  return (
    <span className={className}>
      {before}
      <span className="bg-amber-500 text-zinc-950 rounded-sm px-0.5">
        {match}
      </span>
      {after}
    </span>
  );
};

interface JsonNodeProps {
  data: unknown;
  keyName?: string;
  isLast?: boolean;
  depth?: number;
  defaultExpanded?: boolean;
  searchTerm?: string;
  matchingPaths?: Set<string>;
  currentPath?: string;
}

const JsonNode: React.FC<JsonNodeProps> = ({
  data,
  keyName,
  isLast = true,
  depth = 0,
  defaultExpanded = true,
  searchTerm = "",
  matchingPaths,
  currentPath = "",
}) => {
  const isSearchActive = searchTerm !== "" && matchingPaths !== undefined;
  const shouldAutoExpand = isSearchActive && matchingPaths?.has(currentPath);
  const [expanded, setExpanded] = useState(defaultExpanded || shouldAutoExpand);

  // When search becomes active and this path matches, expand
  // Using a key pattern instead of useEffect for simplicity

  const isObject = data !== null && typeof data === "object";
  const isArray = Array.isArray(data);
  const isEmpty = isObject && Object.keys(data as object).length === 0;

  const renderValue = (value: unknown): React.ReactNode => {
    if (value === null) {
      return <span className="text-zinc-500">null</span>;
    }
    if (value === undefined) {
      return <span className="text-zinc-500">undefined</span>;
    }
    if (typeof value === "string") {
      return (
        <>
          <span className="text-green-400">"</span>
          {highlightMatch(value, searchTerm, "text-green-400")}
          <span className="text-green-400">"</span>
        </>
      );
    }
    if (typeof value === "number") {
      return highlightMatch(String(value), searchTerm, "text-amber-400");
    }
    if (typeof value === "boolean") {
      return <span className="text-purple-400">{value.toString()}</span>;
    }
    return null;
  };

  const renderKey = (key: string): React.ReactNode => {
    return (
      <>
        <span className="text-blue-300">"</span>
        {highlightMatch(key, searchTerm, "text-blue-300")}
        <span className="text-blue-300">"</span>
      </>
    );
  };

  const comma = isLast ? "" : ",";

  if (!isObject) {
    return (
      <div className="leading-5">
        {keyName !== undefined && renderKey(keyName)}
        {keyName !== undefined && <span className="text-zinc-400">: </span>}
        {renderValue(data)}
        <span className="text-zinc-400">{comma}</span>
      </div>
    );
  }

  const entries = Object.entries(data as object);
  const openBracket = isArray ? "[" : "{";
  const closeBracket = isArray ? "]" : "}";
  const itemCount = entries.length;
  const preview = isArray ? `${itemCount} items` : `${itemCount} keys`;

  if (isEmpty) {
    return (
      <div className="leading-5">
        {keyName !== undefined && renderKey(keyName)}
        {keyName !== undefined && <span className="text-zinc-400">: </span>}
        <span className="text-zinc-400">
          {openBracket}
          {closeBracket}
        </span>
        <span className="text-zinc-400">{comma}</span>
      </div>
    );
  }

  // Filter entries when search is active
  const filteredEntries = isSearchActive
    ? entries.filter(([key]) => {
        const childPath = currentPath !== "" ? `${currentPath}.${key}` : key;
        return matchingPaths?.has(childPath);
      })
    : entries;

  // If search is active and no matching entries, don't render this node
  if (isSearchActive && filteredEntries.length === 0) {
    return null;
  }

  // Auto-expand when search matches this path
  const effectiveExpanded =
    isSearchActive && shouldAutoExpand ? true : expanded;

  return (
    <div className="leading-5">
      <span
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => e.key === "Enter" && setExpanded(!expanded)}
        className="cursor-pointer select-none hover:bg-zinc-800 rounded inline-flex items-center"
        role="button"
        tabIndex={0}
      >
        <span className="text-zinc-500 w-4 inline-block text-center">
          {effectiveExpanded ? "▼" : "▶"}
        </span>
        {keyName !== undefined && renderKey(keyName)}
        {keyName !== undefined && <span className="text-zinc-400">: </span>}
        <span className="text-zinc-400">{openBracket}</span>
        {!effectiveExpanded && (
          <>
            <span className="text-zinc-500 text-xs mx-1">{preview}</span>
            <span className="text-zinc-400">{closeBracket}</span>
            <span className="text-zinc-400">{comma}</span>
          </>
        )}
      </span>
      {effectiveExpanded && (
        <>
          <div className="ml-4 border-l border-zinc-700 pl-2">
            {filteredEntries.map(([key, value], index) => {
              const childPath =
                currentPath !== "" ? `${currentPath}.${key}` : key;
              return (
                <JsonNode
                  key={key}
                  keyName={isArray ? undefined : key}
                  data={value}
                  isLast={index === filteredEntries.length - 1}
                  depth={depth + 1}
                  defaultExpanded={depth < 1}
                  searchTerm={searchTerm}
                  matchingPaths={matchingPaths}
                  currentPath={childPath}
                />
              );
            })}
          </div>
          <div>
            <span className="text-zinc-400">
              {closeBracket}
              {comma}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export const DEBUG_PANEL_MIN_HEIGHT = 100;
export const DEBUG_PANEL_MAX_HEIGHT = 800;
export const DEBUG_PANEL_DEFAULT_HEIGHT = 400;
export const DEBUG_PANEL_HEADER_HEIGHT = 52; // Header + resize handle

interface DebugPanelProps {
  saveData: SaveData;
  loadout: Loadout;
  debugPanelExpanded: boolean;
  setDebugPanelExpanded: (expanded: boolean) => void;
  panelHeight: number;
  setPanelHeight: (height: number) => void;
  view: DebugView;
  setView: (view: DebugView) => void;
  onClose: () => void;
  onSaveDataChange: (newSaveData: SaveData) => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  saveData,
  loadout,
  debugPanelExpanded,
  setDebugPanelExpanded,
  panelHeight,
  setPanelHeight,
  view,
  setView,
  onClose,
  onSaveDataChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");
  const [parseError, setParseError] = useState<string | undefined>(undefined);
  const isResizing = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handleEnterEditMode = (): void => {
    setEditText(JSON.stringify(saveData, null, 2));
    setParseError(undefined);
    setEditMode(true);
  };

  const handleCancelEdit = (): void => {
    setEditMode(false);
    setEditText("");
    setParseError(undefined);
  };

  const handleEditTextChange = (text: string): void => {
    setEditText(text);
    try {
      JSON.parse(text);
      setParseError(undefined);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  const handleApplyChanges = (): void => {
    try {
      const parsed = JSON.parse(editText) as SaveData;
      onSaveDataChange(parsed);
      setEditMode(false);
      setEditText("");
      setParseError(undefined);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isResizing.current = true;
      startY.current = e.clientY;
      startHeight.current = panelHeight;
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
    },
    [panelHeight],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent): void => {
      if (!isResizing.current) return;
      const delta = startY.current - e.clientY;
      const newHeight = Math.min(
        DEBUG_PANEL_MAX_HEIGHT,
        Math.max(DEBUG_PANEL_MIN_HEIGHT, startHeight.current + delta),
      );
      setPanelHeight(newHeight);
    };

    const handleMouseUp = (): void => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setPanelHeight]);

  const currentData = view === "saveData" ? saveData : loadout;
  const loadoutAffixes = useMemo(() => getAllAffixes(loadout), [loadout]);
  const unparseableAffixes = useMemo(
    () => collectUnparseableAffixes(loadoutAffixes),
    [loadoutAffixes],
  );
  const unimplementedItems = useMemo(
    () => collectUnimplementedItems(loadout),
    [loadout],
  );
  const totalIssues = unparseableAffixes.length + unimplementedItems.length;

  const loadoutAffixLines = useMemo(() => {
    return loadoutAffixes.flatMap((affix) =>
      affix.affixLines.map((line) => ({
        text: line.text,
        src: affix.src ?? "Unknown",
        hasMods: line.mods !== undefined && line.mods.length > 0,
      })),
    );
  }, [loadoutAffixes]);

  const getTitle = (): string => {
    if (editMode) return "Debug: SaveData (Edit Mode)";
    if (view === "saveData") return "Debug: SaveData (Raw)";
    if (view === "loadout") return "Debug: Loadout (Parsed)";
    if (view === "unparseable") return `Debug: Unimplemented (${totalIssues})`;
    return `Debug: Affixes (${loadoutAffixLines.length})`;
  };
  const title = getTitle();

  const tabs: { key: DebugView; label: string }[] = [
    { key: "saveData", label: "Raw" },
    { key: "loadout", label: "Parsed" },
    { key: "unparseable", label: `Issues (${totalIssues})` },
    { key: "affixes", label: `Affixes (${loadoutAffixLines.length})` },
  ];

  const matchingPaths = useMemo(() => {
    if (searchTerm === "") return undefined;
    return findMatchingPaths(currentData, searchTerm);
  }, [currentData, searchTerm]);

  const matchCount = matchingPaths?.size ?? 0;

  const filteredAffixLines = useMemo(() => {
    if (searchTerm === "") return loadoutAffixLines;
    const searchLower = searchTerm.toLowerCase();
    return loadoutAffixLines.filter(
      (line) =>
        line.text.toLowerCase().includes(searchLower) ||
        line.src.toLowerCase().includes(searchLower),
    );
  }, [loadoutAffixLines, searchTerm]);

  const copyDebugJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(currentData, null, 2));
      alert(
        `${view === "saveData" ? "SaveData" : "Loadout"} JSON copied to clipboard!`,
      );
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t-2 border-amber-500 shadow-2xl z-50">
      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="h-1 cursor-ns-resize hover:bg-amber-500/50 transition-colors"
      />
      {/* Panel Header */}
      <div className="bg-zinc-950 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-zinc-50">{title}</h3>
          <span className="text-xs text-zinc-500">
            {editMode
              ? `${editText.length} chars`
              : `${JSON.stringify(currentData).length} bytes`}
          </span>
          {!editMode && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="px-2 py-1 w-40 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              {searchTerm !== "" && (
                <span className="text-xs text-zinc-400">
                  {matchCount} {matchCount === 1 ? "match" : "matches"}
                </span>
              )}
            </div>
          )}
          {editMode && parseError !== undefined && (
            <span className="text-xs text-red-400">
              Parse error: {parseError}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-50 text-sm rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyChanges}
                disabled={parseError !== undefined}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm rounded transition-colors"
              >
                Apply Changes
              </button>
            </>
          ) : (
            <>
              <div className="flex rounded overflow-hidden border border-zinc-700">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setView(tab.key)}
                    className={`px-3 py-1 text-sm transition-colors ${
                      view === tab.key
                        ? "bg-amber-500 text-zinc-950"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {view === "saveData" && (
                <button
                  type="button"
                  onClick={handleEnterEditMode}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                  title="Edit SaveData JSON"
                >
                  Edit
                </button>
              )}
              <button
                type="button"
                onClick={copyDebugJson}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-sm rounded transition-colors"
                title="Copy JSON to clipboard"
              >
                Copy JSON
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setDebugPanelExpanded(!debugPanelExpanded)}
            className="px-3 py-1 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-50 text-sm rounded transition-colors"
          >
            {debugPanelExpanded ? "Minimize" : "Expand"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
            title="Close debug panel"
          >
            Close
          </button>
        </div>
      </div>

      {/* Panel Content */}
      {debugPanelExpanded && (
        <div className="p-4 overflow-auto" style={{ height: panelHeight }}>
          {editMode ? (
            <textarea
              value={editText}
              onChange={(e) => handleEditTextChange(e.target.value)}
              className="w-full h-full bg-zinc-800 text-zinc-50 font-mono text-xs p-2 border border-zinc-700 rounded resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
              spellCheck={false}
            />
          ) : view === "unparseable" ? (
            <div className="space-y-4">
              {/* Unimplemented Skills/Traits Section */}
              {unimplementedItems.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
                    Unimplemented Skills & Traits ({unimplementedItems.length})
                  </h4>
                  <div className="space-y-1">
                    {unimplementedItems.map((item, idx) => (
                      <div
                        key={`${item.type}-${item.name}-${idx}`}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="shrink-0 px-2 py-0.5 bg-orange-900/50 text-orange-300 rounded text-xs font-medium">
                          {item.type}
                        </span>
                        <span className="text-orange-400">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unparseable Affixes Section */}
              {unparseableAffixes.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
                    Unparseable Affixes ({unparseableAffixes.length})
                  </h4>
                  <div className="space-y-1">
                    {unparseableAffixes.map((affix, idx) => (
                      <div
                        key={`${affix.src}-${idx}`}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="shrink-0 px-2 py-0.5 bg-zinc-700 text-zinc-300 rounded text-xs font-medium">
                          {affix.src}
                        </span>
                        <span className="font-mono text-red-400">
                          {affix.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {totalIssues === 0 && (
                <div className="text-zinc-400 text-sm">
                  No unimplemented items or unparseable affixes
                </div>
              )}
            </div>
          ) : view === "affixes" ? (
            <div className="space-y-1">
              {searchTerm !== "" && (
                <div className="text-xs text-zinc-400 mb-2">
                  Showing {filteredAffixLines.length} of{" "}
                  {loadoutAffixLines.length} affix lines
                </div>
              )}
              {filteredAffixLines.map((line, idx) => (
                <div
                  key={`${line.src}-${line.text}-${idx}`}
                  className="flex items-start gap-2 text-sm"
                >
                  <span className="shrink-0 px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded text-xs font-medium">
                    {line.src}
                  </span>
                  <span
                    className={`font-mono ${line.hasMods ? "text-zinc-50" : "text-red-400"}`}
                  >
                    {line.text}
                  </span>
                </div>
              ))}
              {filteredAffixLines.length === 0 && (
                <div className="text-zinc-400 text-sm">
                  No affix lines match your search
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs font-mono">
              <JsonNode
                key={searchTerm}
                data={currentData}
                defaultExpanded={true}
                searchTerm={searchTerm}
                matchingPaths={matchingPaths}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
