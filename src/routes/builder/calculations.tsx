import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import type { ImplementedActiveSkillName } from "@/src/data/skill/types";
import {
  calculateOffense,
  type OffenseInput,
  type OffenseSpellBurstDpsSummary,
  type OffenseSpellDpsSummary,
  type PersistentDpsSummary,
  type ReapDpsSummary,
  type Resistance,
  type TotalReapDpsSummary,
} from "@/src/tli/calcs/offense";
import { ModGroup } from "../../components/calculations/ModGroup";
import { SkillSelector } from "../../components/calculations/SkillSelector";
import {
  formatStatValue,
  getStatCategoryDescription,
  getStatCategoryLabel,
  groupModsByEffect,
  STAT_CATEGORIES,
} from "../../lib/calculations-utils";
import {
  useBuilderActions,
  useCalculationsSelectedSkill,
  useConfiguration,
  useLoadout,
} from "../../stores/builderStore";

const formatRes = (res: Resistance): string => {
  if (res.potential > res.actual) {
    return `${res.actual}% (${res.potential}%)`;
  }
  return `${res.actual}%`;
};

const DMG_TYPE_COLORS: Record<string, string> = {
  physical: "text-zinc-50",
  cold: "text-cyan-400",
  lightning: "text-yellow-400",
  fire: "text-orange-400",
  erosion: "text-fuchsia-400",
};

const StatLine = ({
  label,
  value,
  highlight,
  color,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
  color?: string;
}): React.ReactNode => {
  const valueClass =
    highlight === true
      ? "text-amber-400 font-bold"
      : (color ?? "text-zinc-200");
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-400">{label}:</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
};

const PersistentDpsSummarySection = ({
  summary,
}: {
  summary: PersistentDpsSummary;
}): React.ReactNode => {
  const nonZeroDamageTypes = Object.entries(summary.base).filter(
    ([, value]) => value > 0,
  );

  return (
    <div className="rounded-lg border border-purple-500/30 bg-zinc-900 p-3">
      <div className="mb-2 text-sm font-semibold text-purple-400">
        Persistent Damage
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 md:grid-cols-3">
        <StatLine
          label="Persistent DPS"
          value={formatStatValue.dps(summary.total)}
          highlight
        />
        <StatLine
          label="Duration"
          value={formatStatValue.duration(summary.duration)}
        />
        {nonZeroDamageTypes.map(([type, value]) => (
          <StatLine
            key={type}
            label={type.charAt(0).toUpperCase() + type.slice(1)}
            value={formatStatValue.damage(value)}
            color={DMG_TYPE_COLORS[type]}
          />
        ))}
      </div>
    </div>
  );
};

const ReapDpsSummarySection = ({
  summary,
}: {
  summary: TotalReapDpsSummary;
}): React.ReactNode => {
  return (
    <div className="rounded-lg border border-emerald-500/30 bg-zinc-900 p-3">
      <div className="mb-2 text-sm font-semibold text-emerald-400">
        Reap Damage
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 md:grid-cols-3">
        <StatLine
          label="Total Reap DPS"
          value={formatStatValue.dps(summary.totalReapDps)}
          highlight
        />
        <StatLine
          label="Duration Bonus"
          value={formatStatValue.pct(summary.reapDurationBonusPct)}
        />
        <StatLine
          label="CDR Bonus"
          value={formatStatValue.pct(summary.reapCdrBonusPct)}
        />
      </div>

      {summary.reaps.length > 0 && (
        <div className="mt-2 space-y-1">
          {summary.reaps.map((reap, index) => (
            <ReapRow key={index} reap={reap} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

const ReapRow = ({
  reap,
  index,
}: {
  reap: ReapDpsSummary;
  index: number;
}): React.ReactNode => {
  return (
    <div className="rounded bg-zinc-800 px-2 py-1">
      <div className="grid grid-cols-5 gap-x-4 text-sm">
        <div className="flex justify-between">
          <span className="text-emerald-400">#{index + 1}</span>
          <span className="text-zinc-400">CD:</span>
          <span className="text-zinc-200">
            {formatStatValue.duration(reap.rawCooldown)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Dur:</span>
          <span className="text-zinc-200">
            {formatStatValue.duration(reap.duration)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Rate:</span>
          <span className="text-zinc-200">
            {reap.reapsPerSecond.toFixed(2)}/s
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Dmg:</span>
          <span className="text-zinc-200">
            {formatStatValue.damage(reap.dmgPerReap)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">DPS:</span>
          <span className="font-medium text-amber-400">
            {formatStatValue.dps(reap.reapDps)}
          </span>
        </div>
      </div>
    </div>
  );
};

const SpellHitSummarySection = ({
  summary,
}: {
  summary: OffenseSpellDpsSummary;
}): React.ReactNode => {
  return (
    <div className="rounded-lg border border-blue-500/30 bg-zinc-900 p-3">
      <div className="mb-2 text-sm font-semibold text-blue-400">Spell Hit</div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 md:grid-cols-3">
        <StatLine
          label="Spell DPS"
          value={formatStatValue.dps(summary.avgDps)}
          highlight
        />
        <StatLine
          label="Avg Hit (crit)"
          value={formatStatValue.damage(summary.avgHitWithCrit)}
        />
        <StatLine
          label="Crit Chance"
          value={formatStatValue.percentage(summary.critChance)}
        />
        <StatLine
          label="Crit Multiplier"
          value={formatStatValue.multiplier(summary.critDmgMult)}
        />
        <StatLine
          label="Casts/sec"
          value={formatStatValue.aps(summary.castsPerSec)}
        />
      </div>
    </div>
  );
};

const SpellBurstSummarySection = ({
  summary,
}: {
  summary: OffenseSpellBurstDpsSummary;
}): React.ReactNode => {
  return (
    <div className="rounded-lg border border-cyan-500/30 bg-zinc-900 p-3">
      <div className="mb-2 text-sm font-semibold text-cyan-400">
        Spell Burst
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 md:grid-cols-3">
        <StatLine
          label="Burst DPS"
          value={formatStatValue.dps(summary.avgDps)}
          highlight
        />
        <StatLine label="Bursts/sec" value={summary.burstsPerSec.toFixed(2)} />
        <StatLine
          label="Max Spell Burst"
          value={formatStatValue.integer(summary.maxSpellBurst)}
        />
        {summary.ingenuityOverload !== undefined && (
          <>
            <StatLine
              label="Overload DPS"
              value={formatStatValue.dps(summary.ingenuityOverload.avgDps)}
              color="text-teal-400"
            />
            <StatLine
              label="Overload Interval"
              value={formatStatValue.duration(
                summary.ingenuityOverload.interval,
              )}
              color="text-teal-400"
            />
          </>
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/builder/calculations")({
  component: CalculationsPage,
});

function CalculationsPage(): React.ReactNode {
  const loadout = useLoadout();
  const configuration = useConfiguration();
  const savedSkillName = useCalculationsSelectedSkill();
  const { setCalculationsSelectedSkill } = useBuilderActions();

  const selectedSkill = savedSkillName as
    | ImplementedActiveSkillName
    | undefined;

  const offenseResults = useMemo(() => {
    const input: OffenseInput = {
      loadout,
      configuration,
    };
    return calculateOffense(input);
  }, [loadout, configuration]);

  const { skills, resourcePool, defenses } = offenseResults;
  const offenseSummary =
    selectedSkill !== undefined ? skills[selectedSkill] : undefined;

  const groupedMods = useMemo(() => {
    if (offenseSummary === undefined) return undefined;
    return groupModsByEffect(offenseSummary.resolvedMods);
  }, [offenseSummary]);

  const hasDamageStats =
    offenseSummary?.attackDpsSummary !== undefined ||
    offenseSummary?.spellDpsSummary !== undefined ||
    offenseSummary?.spellBurstDpsSummary !== undefined ||
    offenseSummary?.persistentDpsSummary !== undefined ||
    offenseSummary?.totalReapDpsSummary !== undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-zinc-50">Damage Calculations</h2>
        <SkillSelector
          loadout={loadout}
          selectedSkill={selectedSkill}
          onSkillChange={setCalculationsSelectedSkill}
        />
      </div>

      {hasDamageStats && offenseSummary !== undefined && (
        <>
          <div className="rounded-lg border border-amber-500/50 bg-zinc-900 p-3">
            <div className="flex items-baseline gap-4">
              <span className="text-sm font-semibold text-amber-400">
                Total DPS:
              </span>
              <span className="text-2xl font-bold text-amber-400">
                {formatStatValue.dps(offenseSummary.totalDps)}
              </span>
            </div>
          </div>

          {offenseSummary.attackDpsSummary !== undefined && (
            <div className="rounded-lg border border-amber-500/30 bg-zinc-900 p-3">
              <div className="mb-2 text-sm font-semibold text-amber-400">
                Attack Hit
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 md:grid-cols-3">
                <StatLine
                  label="Average DPS"
                  value={formatStatValue.dps(
                    offenseSummary.attackDpsSummary.avgDps,
                  )}
                  highlight
                />
                <StatLine
                  label="Avg Hit"
                  value={formatStatValue.damage(
                    offenseSummary.attackDpsSummary.avgHit,
                  )}
                />
                <StatLine
                  label="Avg Hit (crit)"
                  value={formatStatValue.damage(
                    offenseSummary.attackDpsSummary.avgHitWithCrit,
                  )}
                />
                <StatLine
                  label="Crit Chance"
                  value={formatStatValue.percentage(
                    offenseSummary.attackDpsSummary.critChance,
                  )}
                />
                <StatLine
                  label="Crit Multiplier"
                  value={formatStatValue.multiplier(
                    offenseSummary.attackDpsSummary.critDmgMult,
                  )}
                />
                <StatLine
                  label="Attack Speed"
                  value={formatStatValue.aps(
                    offenseSummary.attackDpsSummary.aspd,
                  )}
                />
              </div>
            </div>
          )}

          {offenseSummary.spellDpsSummary !== undefined && (
            <SpellHitSummarySection summary={offenseSummary.spellDpsSummary} />
          )}

          {offenseSummary.spellBurstDpsSummary !== undefined && (
            <SpellBurstSummarySection
              summary={offenseSummary.spellBurstDpsSummary}
            />
          )}

          {offenseSummary.persistentDpsSummary !== undefined && (
            <PersistentDpsSummarySection
              summary={offenseSummary.persistentDpsSummary}
            />
          )}

          {offenseSummary.totalReapDpsSummary !== undefined && (
            <ReapDpsSummarySection
              summary={offenseSummary.totalReapDpsSummary}
            />
          )}
        </>
      )}

      {selectedSkill === undefined && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-center">
          <p className="text-sm text-zinc-400">
            Select an active skill above to view damage calculations.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3">
          <div className="mb-2 text-sm font-semibold text-zinc-300">
            Resource Pool
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
            <StatLine
              label="STR"
              value={formatStatValue.integer(resourcePool.stats.str)}
            />
            <StatLine
              label="DEX"
              value={formatStatValue.integer(resourcePool.stats.dex)}
            />
            <StatLine
              label="INT"
              value={formatStatValue.integer(resourcePool.stats.int)}
            />
            <StatLine
              label="Max Life"
              value={formatStatValue.integer(resourcePool.maxLife)}
              color="text-red-400"
            />
            <StatLine
              label="Max Mana"
              value={formatStatValue.integer(resourcePool.maxMana)}
              color="text-blue-400"
            />
            {resourcePool.mercuryPts !== undefined && (
              <StatLine
                label="Mercury"
                value={formatStatValue.integer(resourcePool.mercuryPts)}
                color="text-purple-400"
              />
            )}
            <StatLine
              label="Focus Blessings"
              value={`${resourcePool.focusBlessings}/${resourcePool.maxFocusBlessings}`}
              color="text-sky-400"
            />
            <StatLine
              label="Agility Blessings"
              value={`${resourcePool.agilityBlessings}/${resourcePool.maxAgilityBlessings}`}
              color="text-green-400"
            />
            <StatLine
              label="Tenacity Blessings"
              value={`${resourcePool.tenacityBlessings}/${resourcePool.maxTenacityBlessings}`}
              color="text-amber-400"
            />
            {resourcePool.desecration !== undefined && (
              <StatLine
                label="Desecration"
                value={resourcePool.desecration}
                color="text-rose-400"
              />
            )}
            {resourcePool.additionalMaxChanneledStacks > 0 && (
              <StatLine
                label="+Max Channeled"
                value={resourcePool.additionalMaxChanneledStacks}
                color="text-teal-400"
              />
            )}
            {resourcePool.hasFervor && (
              <StatLine
                label="Fervor"
                value={resourcePool.fervorPts}
                color="text-orange-400"
              />
            )}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3">
          <div className="mb-2 text-sm font-semibold text-zinc-300">
            Resistances & Movement
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
            <StatLine
              label="Cold Res"
              value={formatRes(defenses.coldRes)}
              color="text-cyan-400"
            />
            <StatLine
              label="Lightning Res"
              value={formatRes(defenses.lightningRes)}
              color="text-yellow-400"
            />
            <StatLine
              label="Fire Res"
              value={formatRes(defenses.fireRes)}
              color="text-orange-400"
            />
            <StatLine
              label="Erosion Res"
              value={formatRes(defenses.erosionRes)}
              color="text-fuchsia-400"
            />
            {offenseSummary !== undefined && (
              <StatLine
                label="Movement Speed"
                value={formatStatValue.pct(
                  offenseSummary.movementSpeedBonusPct,
                )}
                color="text-green-400"
              />
            )}
          </div>
        </div>
      </div>

      {hasDamageStats &&
        offenseSummary !== undefined &&
        groupedMods !== undefined && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-300">
                Contributing Mods
              </span>
              <span className="text-xs text-zinc-500">
                ({offenseSummary.resolvedMods.length} total)
              </span>
            </div>
            <div className="space-y-2">
              {STAT_CATEGORIES.map((category) => {
                const mods = groupedMods[category];
                if (mods.length === 0) return null;
                return (
                  <ModGroup
                    key={category}
                    title={getStatCategoryLabel(category)}
                    description={getStatCategoryDescription(category)}
                    mods={mods}
                    defaultExpanded={false}
                  />
                );
              })}
            </div>
          </div>
        )}
    </div>
  );
}
