import type { ConfigurationPage } from "../../lib/save-data";

interface ConfigurationTabProps {
  config: ConfigurationPage;
  onUpdate: (updates: Partial<ConfigurationPage>) => void;
}

interface NumberInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
}

const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min,
  max,
}) => {
  const increment = () => {
    const currentValue = value ?? 0;
    const newValue = currentValue + 1;
    onChange(max !== undefined ? Math.min(newValue, max) : newValue);
  };

  const decrement = () => {
    const currentValue = value ?? 0;
    const newValue = currentValue - 1;
    onChange(min !== undefined ? Math.max(newValue, min) : newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.target.value;
    if (str === "") {
      onChange(undefined);
      return;
    }
    const parsed = Number(str);
    if (!Number.isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <div className="flex items-center">
      <input
        type="number"
        value={value ?? ""}
        onChange={handleInputChange}
        min={min}
        max={max}
        className="w-24 rounded-l border border-r-0 border-zinc-700 bg-zinc-800 px-2 py-0.5 text-center text-sm text-zinc-50 [appearance:textfield] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <div className="flex flex-col">
        <button
          type="button"
          onClick={increment}
          className="flex h-[13px] w-5 items-center justify-center rounded-tr border border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
        >
          <svg className="h-2 w-2" viewBox="0 0 8 8" fill="currentColor">
            <path d="M4 2L7 5H1L4 2Z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={decrement}
          className="flex h-[13px] w-5 items-center justify-center rounded-br border border-t-0 border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
        >
          <svg className="h-2 w-2" viewBox="0 0 8 8" fill="currentColor">
            <path d="M4 6L1 3H7L4 6Z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

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
          <label className="text-right text-zinc-50">Level</label>
          <NumberInput
            value={config.level}
            onChange={(v) => v !== undefined && onUpdate({ level: v })}
            min={1}
            max={100}
          />

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
              <NumberInput
                value={config.fervorPoints}
                onChange={(v) => onUpdate({ fervorPoints: v })}
                min={0}
                max={100}
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
              <NumberInput
                value={config.enemyFrostbittenPoints}
                onChange={(v) => onUpdate({ enemyFrostbittenPoints: v })}
                min={0}
                max={100}
              />
            </>
          )}

          <label className="text-right text-zinc-50">Cruelty Buff Stacks</label>
          <NumberInput
            value={config.crueltyBuffStacks}
            onChange={(v) => onUpdate({ crueltyBuffStacks: v })}
            min={0}
            max={100}
          />

          <label className="text-right text-zinc-50">Realm of Mercury</label>
          <input
            type="checkbox"
            checked={config.realmOfMercuryEnabled}
            onChange={(e) =>
              onUpdate({ realmOfMercuryEnabled: e.target.checked })
            }
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">
            Shadow Hits
            <InfoTooltip text="Defaults to max" />
          </label>
          <NumberInput
            value={config.numShadowHits}
            onChange={(v) => onUpdate({ numShadowHits: v })}
            min={0}
            max={100}
          />

          <label className="text-right text-zinc-50">Has Focus Blessing</label>
          <input
            type="checkbox"
            checked={config.hasFocusBlessing}
            onChange={(e) => onUpdate({ hasFocusBlessing: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          {config.hasFocusBlessing && (
            <>
              <label className="text-right text-zinc-50">
                Focus Blessing Stacks
                <InfoTooltip text="Defaults to max (base 4 + bonuses)" />
              </label>
              <NumberInput
                value={config.focusBlessings}
                onChange={(v) => onUpdate({ focusBlessings: v })}
                min={0}
                max={100}
              />
            </>
          )}

          <label className="text-right text-zinc-50">
            Has Agility Blessing
          </label>
          <input
            type="checkbox"
            checked={config.hasAgilityBlessing}
            onChange={(e) => onUpdate({ hasAgilityBlessing: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          {config.hasAgilityBlessing && (
            <>
              <label className="text-right text-zinc-50">
                Agility Blessing Stacks
                <InfoTooltip text="Defaults to max (base 4 + bonuses)" />
              </label>
              <NumberInput
                value={config.agilityBlessings}
                onChange={(v) => onUpdate({ agilityBlessings: v })}
                min={0}
                max={100}
              />
            </>
          )}

          <label className="text-right text-zinc-50">
            Mana Consumed Recently
            <InfoTooltip text="Total mana consumed in the last 4 seconds. Defaults to 0." />
          </label>
          <NumberInput
            value={config.manaConsumedRecently}
            onChange={(v) => onUpdate({ manaConsumedRecently: v })}
            min={0}
          />

          <label className="text-right text-zinc-50">
            Unsealed Mana %
            <InfoTooltip text="Percentage of mana currently unsealed. Defaults to 0." />
          </label>
          <NumberInput
            value={config.unsealedManaPct}
            onChange={(v) => onUpdate({ unsealedManaPct: v })}
            min={0}
            max={100}
          />

          <label className="text-right text-zinc-50">
            Enemy Resistance %
            <InfoTooltip text="Enemy elemental resistance. Defaults to 50%." />
          </label>
          <NumberInput
            value={
              config.enemyRes !== undefined
                ? Math.round(config.enemyRes * 100)
                : undefined
            }
            onChange={(v) =>
              onUpdate({ enemyRes: v !== undefined ? v / 100 : undefined })
            }
            min={0}
            max={100}
          />

          <label className="text-right text-zinc-50">
            Enemy Armor
            <InfoTooltip text="Enemy armor value. Defaults to 27273 (50% physical damage mitigation)." />
          </label>
          <NumberInput
            value={config.enemyArmor}
            onChange={(v) => onUpdate({ enemyArmor: v })}
            min={0}
          />

          <label className="text-right text-zinc-50">Enemy Paralyzed</label>
          <input
            type="checkbox"
            checked={config.enemyParalyzed}
            onChange={(e) => onUpdate({ enemyParalyzed: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">Has Full Mana</label>
          <input
            type="checkbox"
            checked={config.hasFullMana}
            onChange={(e) => onUpdate({ hasFullMana: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">
            Target Enemy Is Nearby
          </label>
          <input
            type="checkbox"
            checked={config.targetEnemyIsNearby}
            onChange={(e) =>
              onUpdate({ targetEnemyIsNearby: e.target.checked })
            }
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">Enemies Nearby</label>
          <NumberInput
            value={config.numEnemiesNearby}
            onChange={(v) =>
              v !== undefined && onUpdate({ numEnemiesNearby: v })
            }
            min={0}
          />

          <label className="text-right text-zinc-50">
            Enemies Affected by Warcry
          </label>
          <NumberInput
            value={config.numEnemiesAffectedByWarcry}
            onChange={(v) =>
              v !== undefined && onUpdate({ numEnemiesAffectedByWarcry: v })
            }
            min={0}
          />

          <label className="text-right text-zinc-50">
            Has Blocked Recently
          </label>
          <input
            type="checkbox"
            checked={config.hasBlockedRecently}
            onChange={(e) => onUpdate({ hasBlockedRecently: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">Has Elites Nearby</label>
          <input
            type="checkbox"
            checked={config.hasElitesNearby}
            onChange={(e) => onUpdate({ hasElitesNearby: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">Enemy Has Ailment</label>
          <input
            type="checkbox"
            checked={config.enemyHasAilment}
            onChange={(e) => onUpdate({ enemyHasAilment: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />
        </div>
      </div>
    </div>
  );
};
