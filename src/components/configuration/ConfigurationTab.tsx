import { useRef } from "react";
import type { ConfigurationPage } from "../../lib/save-data";
import { parseMod } from "../../tli/mod_parser";

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

const CustomAffixesSection: React.FC<{
  lines: string[];
  onChange: (lines: string[]) => void;
}> = ({ lines, onChange }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const textValue = lines.join("\n");

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value === "") {
      onChange([]);
      return;
    }
    onChange(value.split("\n"));
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (overlayRef.current) {
      overlayRef.current.scrollTop = e.currentTarget.scrollTop;
      overlayRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const coloredLines = textValue.split("\n").map((line, i) => {
    if (line.trim() === "") {
      return <span key={i}>{"\n"}</span>;
    }
    const parsed = parseMod(line);
    const isValid = parsed !== undefined && parsed.length > 0;
    return (
      <span key={i} className={isValid ? "text-blue-400" : "text-red-400"}>
        {line}
        {"\n"}
      </span>
    );
  });

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-6">
      <div className="mb-3 flex items-center">
        <label className="text-zinc-50">Custom Affixes</label>
        <InfoTooltip text="Add custom affix lines (one per line) to include in damage calculations" />
      </div>
      <div className="relative h-64">
        <div
          ref={overlayRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words rounded-lg border border-transparent bg-zinc-800 p-3 font-mono text-sm"
        >
          {coloredLines}
        </div>
        <textarea
          value={textValue}
          onChange={handleChange}
          onScroll={handleScroll}
          className="absolute inset-0 h-full w-full resize-none rounded-lg border border-zinc-700 bg-transparent p-3 font-mono text-sm text-transparent caret-zinc-50 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
      </div>
    </div>
  );
};

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
            Baptism of Purity
            <InfoTooltip text="Include Rosa 2's Baptism of Purity recorded damage" />
          </label>
          <input
            type="checkbox"
            checked={config.baptismOfPurityEnabled}
            onChange={(e) =>
              onUpdate({ baptismOfPurityEnabled: e.target.checked })
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
            Has Tenacity Blessing
          </label>
          <input
            type="checkbox"
            checked={config.hasTenacityBlessing}
            onChange={(e) =>
              onUpdate({ hasTenacityBlessing: e.target.checked })
            }
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          {config.hasTenacityBlessing && (
            <>
              <label className="text-right text-zinc-50">
                Tenacity Blessing Stacks
                <InfoTooltip text="Defaults to max (base 4 + bonuses)" />
              </label>
              <NumberInput
                value={config.tenacityBlessings}
                onChange={(v) => onUpdate({ tenacityBlessings: v })}
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
            Sealed Mana %
            <InfoTooltip text="Percentage of mana currently sealed. Defaults to 0." />
          </label>
          <NumberInput
            value={config.sealedManaPct}
            onChange={(v) => onUpdate({ sealedManaPct: v })}
            min={0}
            max={100}
          />

          <label className="text-right text-zinc-50">
            Sealed Life %
            <InfoTooltip text="Percentage of life currently sealed. Defaults to 0." />
          </label>
          <NumberInput
            value={config.sealedLifePct}
            onChange={(v) => onUpdate({ sealedLifePct: v })}
            min={0}
            max={100}
          />

          <label className="text-right text-zinc-50">
            Enemy Cold Res %
            <InfoTooltip text="Enemy cold resistance. Defaults to 40%." />
          </label>
          <NumberInput
            value={config.enemyColdRes}
            onChange={(v) => onUpdate({ enemyColdRes: v })}
            min={0}
            max={100}
          />

          <label className="text-right text-zinc-50">
            Enemy Lightning Res %
            <InfoTooltip text="Enemy lightning resistance. Defaults to 40%." />
          </label>
          <NumberInput
            value={config.enemyLightningRes}
            onChange={(v) => onUpdate({ enemyLightningRes: v })}
            min={0}
            max={100}
          />

          <label className="text-right text-zinc-50">
            Enemy Fire Res %
            <InfoTooltip text="Enemy fire resistance. Defaults to 40%." />
          </label>
          <NumberInput
            value={config.enemyFireRes}
            onChange={(v) => onUpdate({ enemyFireRes: v })}
            min={0}
            max={100}
          />

          <label className="text-right text-zinc-50">
            Enemy Erosion Res %
            <InfoTooltip text="Enemy erosion resistance. Defaults to 30%." />
          </label>
          <NumberInput
            value={config.enemyErosionRes}
            onChange={(v) => onUpdate({ enemyErosionRes: v })}
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

          <label className="text-right text-zinc-50">Target Is Elite</label>
          <input
            type="checkbox"
            checked={config.targetEnemyIsElite}
            onChange={(e) => onUpdate({ targetEnemyIsElite: e.target.checked })}
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

          <label className="text-right text-zinc-50">
            Target Enemy Is In Proximity
          </label>
          <input
            type="checkbox"
            checked={config.targetEnemyIsInProximity}
            onChange={(e) =>
              onUpdate({ targetEnemyIsInProximity: e.target.checked })
            }
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">
            Target Enemy Has Frail
          </label>
          <input
            type="checkbox"
            checked={config.targetEnemyHasFrail}
            onChange={(e) =>
              onUpdate({ targetEnemyHasFrail: e.target.checked })
            }
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">
            Target Enemy Has Whimsy Signal
            <InfoTooltip text="Debuff from Bing2 hero trait" />
          </label>
          <input
            type="checkbox"
            checked={config.targetEnemyHasWhimsySignal}
            onChange={(e) =>
              onUpdate({ targetEnemyHasWhimsySignal: e.target.checked })
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

          <label className="text-right text-zinc-50">Has Crit Recently</label>
          <input
            type="checkbox"
            checked={config.hasCritRecently}
            onChange={(e) => onUpdate({ hasCritRecently: e.target.checked })}
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

          <label className="text-right text-zinc-50">Channeling</label>
          <input
            type="checkbox"
            checked={config.channeling}
            onChange={(e) => onUpdate({ channeling: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">
            Sage&apos;s Insight (Fire)
            <InfoTooltip text="Enemy affected by Sage's Insight &quot;When a Spell hit inflicts Fire Damage&quot; condition" />
          </label>
          <input
            type="checkbox"
            checked={config.sagesInsightFireActivated}
            onChange={(e) =>
              onUpdate({ sagesInsightFireActivated: e.target.checked })
            }
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">
            Sage&apos;s Insight (Cold)
            <InfoTooltip text="Enemy affected by Sage's Insight &quot;When a Spell hit inflicts Cold Damage&quot; condition" />
          </label>
          <input
            type="checkbox"
            checked={config.sagesInsightColdActivated}
            onChange={(e) =>
              onUpdate({ sagesInsightColdActivated: e.target.checked })
            }
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">
            Sage&apos;s Insight (Lightning)
            <InfoTooltip text="Enemy affected by Sage's Insight &quot;When a Spell hit inflicts Lightning Damage&quot; condition" />
          </label>
          <input
            type="checkbox"
            checked={config.sagesInsightLightningActivated}
            onChange={(e) =>
              onUpdate({ sagesInsightLightningActivated: e.target.checked })
            }
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">
            Sage&apos;s Insight (Erosion)
            <InfoTooltip text="Enemy affected by Sage's Insight &quot;When a Spell hit inflicts Erosion Damage&quot; condition" />
          </label>
          <input
            type="checkbox"
            checked={config.sagesInsightErosionActivated}
            onChange={(e) =>
              onUpdate({ sagesInsightErosionActivated: e.target.checked })
            }
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">
            Enemy Has Affliction
          </label>
          <input
            type="checkbox"
            checked={config.enemyHasAffliction}
            onChange={(e) => onUpdate({ enemyHasAffliction: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          {config.enemyHasAffliction && (
            <>
              <label className="text-right text-zinc-50">
                Affliction Points
                <InfoTooltip text="Defaults to 100" />
              </label>
              <NumberInput
                value={config.afflictionPts}
                onChange={(v) => onUpdate({ afflictionPts: v })}
                min={0}
              />
            </>
          )}

          <label className="text-right text-zinc-50">
            Enemy Has Desecration
          </label>
          <input
            type="checkbox"
            checked={config.enemyHasDesecration}
            onChange={(e) =>
              onUpdate({ enemyHasDesecration: e.target.checked })
            }
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">
            Torment Stacks
            <InfoTooltip text="Psychic tree legendary talent" />
          </label>
          <NumberInput
            value={config.tormentStacks}
            onChange={(v) => onUpdate({ tormentStacks: v ?? 0 })}
            min={0}
          />

          <label className="text-right text-zinc-50">Has Blur</label>
          <input
            type="checkbox"
            checked={config.hasBlur}
            onChange={(e) => onUpdate({ hasBlur: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">Blur Ended Recently</label>
          <input
            type="checkbox"
            checked={config.blurEndedRecently}
            onChange={(e) => onUpdate({ blurEndedRecently: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">
            Mind Control Links Used
            <InfoTooltip text="Defaults to max" />
          </label>
          <NumberInput
            value={config.numMindControlLinksUsed}
            onChange={(v) => onUpdate({ numMindControlLinksUsed: v })}
            min={0}
          />

          <label className="text-right text-zinc-50">Has Squidnova</label>
          <input
            type="checkbox"
            checked={config.hasSquidnova}
            onChange={(e) => onUpdate({ hasSquidnova: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">
            Target Enemy Is Frozen
          </label>
          <input
            type="checkbox"
            checked={config.targetEnemyIsFrozen}
            onChange={(e) =>
              onUpdate({ targetEnemyIsFrozen: e.target.checked })
            }
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">
            Target Enemy Frozen Recently
          </label>
          <input
            type="checkbox"
            checked={config.targetEnemyFrozenRecently}
            onChange={(e) =>
              onUpdate({ targetEnemyFrozenRecently: e.target.checked })
            }
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">
            Target Enemy Has Cold Infiltration
          </label>
          <input
            type="checkbox"
            checked={config.targetEnemyHasColdInfiltration}
            onChange={(e) =>
              onUpdate({ targetEnemyHasColdInfiltration: e.target.checked })
            }
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">
            Target Enemy Has Lightning Infiltration
          </label>
          <input
            type="checkbox"
            checked={config.targetEnemyHasLightningInfiltration}
            onChange={(e) =>
              onUpdate({
                targetEnemyHasLightningInfiltration: e.target.checked,
              })
            }
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">
            Target Enemy Has Fire Infiltration
          </label>
          <input
            type="checkbox"
            checked={config.targetEnemyHasFireInfiltration}
            onChange={(e) =>
              onUpdate({ targetEnemyHasFireInfiltration: e.target.checked })
            }
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
          />

          <label className="text-right text-zinc-50">
            Hit Enemy With Elemental Dmg Recently
            <InfoTooltip text="Number of times you've hit enemy with elemental damage recently. Defaults to 0." />
          </label>
          <NumberInput
            value={config.hasHitEnemyWithElementalDmgRecently}
            onChange={(v) =>
              onUpdate({ hasHitEnemyWithElementalDmgRecently: v ?? 0 })
            }
            min={0}
          />

          <label className="text-right text-zinc-50">
            Spell Skills Used Recently
            <InfoTooltip text="Number of spell skills used recently. Defaults to 0." />
          </label>
          <NumberInput
            value={config.numSpellSkillsUsedRecently}
            onChange={(v) => onUpdate({ numSpellSkillsUsedRecently: v ?? 0 })}
            min={0}
          />

          <label className="text-right text-zinc-50">
            Chain Lightning Instances on Target
            <InfoTooltip text="Number of Chain Lightning instances hitting the target. Defaults to max." />
          </label>
          <NumberInput
            value={config.chainLightningInstancesOnTarget}
            onChange={(v) => onUpdate({ chainLightningInstancesOnTarget: v })}
            min={1}
          />
        </div>
      </div>

      <CustomAffixesSection
        lines={config.customAffixLines ?? []}
        onChange={(lines) =>
          onUpdate({ customAffixLines: lines.length > 0 ? lines : undefined })
        }
      />
    </div>
  );
};
