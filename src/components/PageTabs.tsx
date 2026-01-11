import { i18n } from "@lingui/core";
import { Link, useRouterState } from "@tanstack/react-router";

const TABS = [
  { path: "/builder/equipment", label: "Equipment" },
  { path: "/builder/talents", label: "Talents" },
  { path: "/builder/skills", label: "Skills" },
  { path: "/builder/hero", label: "Hero" },
  { path: "/builder/pactspirit", label: "Pactspirit" },
  { path: "/builder/divinity", label: "Divinity" },
  { path: "/builder/configuration", label: "Configuration" },
  { path: "/builder/calculations", label: "Calculations" },
] as const;

export const PageTabs: React.FC = () => {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const currentSearch = routerState.location.search as { id?: string };

  return (
    <div className="mb-8 flex gap-4 border-b border-zinc-800">
      {TABS.map((tab) => {
        const isActive = currentPath.startsWith(tab.path);
        return (
          <Link
            key={tab.path}
            to={tab.path}
            search={{ id: currentSearch.id }}
            className={`px-6 py-3 font-medium transition-colors ${
              isActive
                ? "border-b-2 border-amber-500 text-amber-500"
                : "text-zinc-400 hover:text-zinc-50"
            }`}
          >
            {i18n._(tab.label)}
          </Link>
        );
      })}
    </div>
  );
};
