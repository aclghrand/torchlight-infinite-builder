import type { ConfigurationPage } from "../../lib/save-data";

interface ConfigurationTabProps {
  config: ConfigurationPage;
  onUpdate: (updates: Partial<ConfigurationPage>) => void;
}

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
  <span className="group relative ml-1 cursor-help text-zinc-500 hover:text-zinc-400">
    ⓘ
    <span className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100">
      {text}
    </span>
  </span>
);

export const ConfigurationTab: React.FC<ConfigurationTabProps> = ({
  config,
  onUpdate,
}) => {
  const handleOptionalNumberChange =
    (field: "fervorPoints" | "enemyFrostbittenPoints") =>
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const value = e.target.value;
      if (value === "") {
        onUpdate({ [field]: undefined });
        return;
      }
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        const clamped = Math.max(0, Math.min(100, parsed));
        onUpdate({ [field]: clamped });
      }
    };

  const handleNumberChange =
    (field: "crueltyBuffStacks") =>
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const parsed = Number(e.target.value);
      if (!Number.isNaN(parsed)) {
        const clamped = Math.max(0, Math.min(100, parsed));
        onUpdate({ [field]: clamped });
      }
    };

  const handleEnemyResChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const value = e.target.value;
    if (value === "") {
      onUpdate({ enemyRes: undefined });
      return;
    }
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.max(0, Math.min(100, parsed));
      onUpdate({ enemyRes: clamped / 100 });
    }
  };

  const handleEnemyArmorChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const value = e.target.value;
    if (value === "") {
      onUpdate({ enemyArmor: undefined });
      return;
    }
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      onUpdate({ enemyArmor: Math.max(0, parsed) });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-50">Configuration</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Configure combat conditions and buff stacks for damage calculations.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-6">
        <div className="grid w-fit grid-cols-[auto_auto] items-center gap-x-3 gap-y-2">
          <label className="text-right text-zinc-50">Fervor</label>
          <input
            type="checkbox"
            checked={config.fervorEnabled}
            onChange={(e) => onUpdate({ fervorEnabled: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          {config.fervorEnabled && (
            <>
              <label className="text-right text-zinc-50">
                Fervor Rating
                <InfoTooltip text="Defaults to max" />
              </label>
              <input
                type="number"
                value={config.fervorPoints ?? ""}
                onChange={handleOptionalNumberChange("fervorPoints")}
                min={0}
                max={100}
                placeholder="max"
                className="w-14 rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-center text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </>
          )}

          <label className="text-right text-zinc-50">Enemy Frostbitten</label>
          <input
            type="checkbox"
            checked={config.enemyFrostbittenEnabled}
            onChange={(e) =>
              onUpdate({ enemyFrostbittenEnabled: e.target.checked })
            }
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          {config.enemyFrostbittenEnabled && (
            <>
              <label className="text-right text-zinc-50">
                Frostbite Rating
                <InfoTooltip text="Defaults to max" />
              </label>
              <input
                type="number"
                value={config.enemyFrostbittenPoints ?? ""}
                onChange={handleOptionalNumberChange("enemyFrostbittenPoints")}
                min={0}
                max={100}
                placeholder="max"
                className="w-14 rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-center text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </>
          )}

          <label className="text-right text-zinc-50">Cruelty Buff Stacks</label>
          <input
            type="number"
            value={config.crueltyBuffStacks}
            onChange={handleNumberChange("crueltyBuffStacks")}
            min={0}
            max={100}
            className="w-14 rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-center text-sm text-zinc-50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />

          <label className="text-right text-zinc-50">
            Enemy Resistance %
            <InfoTooltip text="Enemy elemental resistance. Defaults to 50%." />
          </label>
          <input
            type="number"
            value={
              config.enemyRes !== undefined
                ? Math.round(config.enemyRes * 100)
                : ""
            }
            onChange={handleEnemyResChange}
            min={0}
            max={100}
            placeholder="50"
            className="w-14 rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-center text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />

          <label className="text-right text-zinc-50">
            Enemy Armor
            <InfoTooltip text="Enemy armor value. Defaults to 27273 (50% physical damage mitigation)." />
          </label>
          <input
            type="number"
            value={config.enemyArmor ?? ""}
            onChange={handleEnemyArmorChange}
            min={0}
            placeholder="27273"
            className="w-20 rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-center text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
      </div>
    </div>
  );
};
