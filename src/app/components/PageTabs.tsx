import { ActivePage } from "../lib/types";

interface PageTabsProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

export const PageTabs: React.FC<PageTabsProps> = ({
  activePage,
  setActivePage,
}) => {
  return (
    <div className="mb-8 flex gap-4 border-b border-zinc-300 dark:border-zinc-700">
      <button
        onClick={() => setActivePage("equipment")}
        className={`px-6 py-3 font-medium transition-colors ${
          activePage === "equipment"
            ? "border-b-2 border-blue-600 text-blue-600"
            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        }`}
      >
        Equipment
      </button>
      <button
        onClick={() => setActivePage("talents")}
        className={`px-6 py-3 font-medium transition-colors ${
          activePage === "talents"
            ? "border-b-2 border-blue-600 text-blue-600"
            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        }`}
      >
        Talents
      </button>
      <button
        onClick={() => setActivePage("skills")}
        className={`px-6 py-3 font-medium transition-colors ${
          activePage === "skills"
            ? "border-b-2 border-blue-600 text-blue-600"
            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        }`}
      >
        Skills
      </button>
    </div>
  );
};
