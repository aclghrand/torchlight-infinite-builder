import { useMemo, useState } from "react";
import type { SaveData } from "@/src/lib/save-data";
import type { Loadout } from "@/src/tli/core";

type DebugView = "saveData" | "loadout";

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

interface DebugPanelProps {
  saveData: SaveData;
  loadout: Loadout;
  debugPanelExpanded: boolean;
  setDebugPanelExpanded: (expanded: boolean) => void;
  onClose: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  saveData,
  loadout,
  debugPanelExpanded,
  setDebugPanelExpanded,
  onClose,
}) => {
  const [view, setView] = useState<DebugView>("saveData");
  const [searchTerm, setSearchTerm] = useState("");

  const currentData = view === "saveData" ? saveData : loadout;
  const title =
    view === "saveData" ? "Debug: SaveData (Raw)" : "Debug: Loadout (Parsed)";

  const matchingPaths = useMemo(() => {
    if (searchTerm === "") return undefined;
    return findMatchingPaths(currentData, searchTerm);
  }, [currentData, searchTerm]);

  const matchCount = matchingPaths?.size ?? 0;

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
      {/* Panel Header */}
      <div className="bg-zinc-950 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-zinc-50">{title}</h3>
          <span className="text-xs text-zinc-500">
            {JSON.stringify(currentData).length} bytes
          </span>
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
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              setView(view === "saveData" ? "loadout" : "saveData")
            }
            className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-50 text-sm rounded transition-colors"
            title="Toggle between SaveData and Loadout views"
          >
            {view === "saveData" ? "View Parsed" : "View Raw"}
          </button>
          <button
            type="button"
            onClick={copyDebugJson}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-sm rounded transition-colors"
            title="Copy JSON to clipboard"
          >
            Copy JSON
          </button>
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
        <div className="p-4 overflow-auto" style={{ maxHeight: "400px" }}>
          <div className="text-xs font-mono">
            <JsonNode
              key={searchTerm}
              data={currentData}
              defaultExpanded={true}
              searchTerm={searchTerm}
              matchingPaths={matchingPaths}
            />
          </div>
        </div>
      )}
    </div>
  );
};
