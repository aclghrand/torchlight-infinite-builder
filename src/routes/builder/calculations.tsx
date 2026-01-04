import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import type { ImplementedActiveSkillName } from "@/src/data/skill/types";
import {
  calculateOffense,
  type OffenseInput,
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

const PersistentDpsSummarySection = ({
  summary,
}: {
  summary: PersistentDpsSummary;
}): React.ReactNode => {
  const nonZeroDamageTypes = Object.entries(summary.base).filter(
    ([, value]) => value > 0,
  );

  return (
    <div className="rounded-lg border border-purple-500/30 bg-zinc-900 p-6">
      <h3 className="mb-4 text-lg font-semibold text-purple-400">
        Persistent Damage
      </h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-zinc-800 p-4">
          <div className="text-sm text-zinc-400">Persistent DPS</div>
          <div className="text-2xl font-bold text-amber-400">
            {formatStatValue.dps(summary.total)}
          </div>
        </div>
        <div className="rounded-lg bg-zinc-800 p-4">
          <div className="text-sm text-zinc-400">Duration</div>
          <div className="text-xl font-semibold text-zinc-50">
            {formatStatValue.duration(summary.duration)}
          </div>
        </div>
        {nonZeroDamageTypes.map(([type, value]) => (
          <div key={type} className="rounded-lg bg-zinc-800 p-4">
            <div className="text-sm capitalize text-zinc-400">{type}</div>
            <div className={`text-xl font-semibold ${DMG_TYPE_COLORS[type]}`}>
              {formatStatValue.damage(value)}
            </div>
          </div>
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
    <div className="rounded-lg border border-emerald-500/30 bg-zinc-900 p-6">
      <h3 className="mb-4 text-lg font-semibold text-emerald-400">
        Reap Damage
      </h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-zinc-800 p-4">
          <div className="text-sm text-zinc-400">Total Reap DPS</div>
          <div className="text-2xl font-bold text-amber-400">
            {formatStatValue.dps(summary.totalReapDps)}
          </div>
        </div>
        <div className="rounded-lg bg-zinc-800 p-4">
          <div className="text-sm text-zinc-400">Duration Bonus</div>
          <div className="text-xl font-semibold text-zinc-50">
            {formatStatValue.pct(summary.reapDurationBonusPct)}
          </div>
        </div>
        <div className="rounded-lg bg-zinc-800 p-4">
          <div className="text-sm text-zinc-400">CDR Bonus</div>
          <div className="text-xl font-semibold text-zinc-50">
            {formatStatValue.pct(summary.reapCdrBonusPct)}
          </div>
        </div>
      </div>

      {summary.reaps.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-sm font-medium text-zinc-400">
            Per-Reap Breakdown
          </div>
          <div className="space-y-2">
            {summary.reaps.map((reap, index) => (
              <ReapRow key={index} reap={reap} index={index} />
            ))}
          </div>
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
    <div className="rounded-lg bg-zinc-800 p-3">
      <div className="mb-2 text-xs font-medium text-emerald-400">
        Reap #{index + 1}
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
        <div>
          <div className="text-xs text-zinc-500">Cooldown</div>
          <div className="font-medium text-zinc-50">
            {formatStatValue.duration(reap.rawCooldown)}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Duration</div>
          <div className="font-medium text-zinc-50">
            {formatStatValue.duration(reap.duration)}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Reaps/sec</div>
          <div className="font-medium text-zinc-50">
            {reap.reapsPerSecond.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Dmg/Reap</div>
          <div className="font-medium text-zinc-50">
            {formatStatValue.damage(reap.dmgPerReap)}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Reap DPS</div>
          <div className="font-medium text-amber-400">
            {formatStatValue.dps(reap.reapDps)}
          </div>
        </div>
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
  const offenseSummary = selectedSkill ? skills[selectedSkill] : undefined;

  const groupedMods = useMemo(() => {
    if (!offenseSummary) return undefined;
    return groupModsByEffect(offenseSummary.resolvedMods);
  }, [offenseSummary]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-xl font-bold text-zinc-50">
          Damage Calculations
        </h2>

        <SkillSelector
          loadout={loadout}
          selectedSkill={selectedSkill}
          onSkillChange={setCalculationsSelectedSkill}
        />
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-50">
          Resource Pool
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-zinc-800 p-4">
            <div className="text-sm text-zinc-400">Strength</div>
            <div className="text-xl font-semibold text-zinc-50">
              {formatStatValue.integer(resourcePool.stats.str)}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-800 p-4">
            <div className="text-sm text-zinc-400">Dexterity</div>
            <div className="text-xl font-semibold text-zinc-50">
              {formatStatValue.integer(resourcePool.stats.dex)}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-800 p-4">
            <div className="text-sm text-zinc-400">Intelligence</div>
            <div className="text-xl font-semibold text-zinc-50">
              {formatStatValue.integer(resourcePool.stats.int)}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-800 p-4">
            <div className="text-sm text-zinc-400">Max Life</div>
            <div className="text-xl font-semibold text-red-400">
              {formatStatValue.integer(resourcePool.maxLife)}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-800 p-4">
            <div className="text-sm text-zinc-400">Max Mana</div>
            <div className="text-xl font-semibold text-blue-400">
              {formatStatValue.integer(resourcePool.maxMana)}
            </div>
          </div>
          {resourcePool.mercuryPts !== undefined && (
            <div className="rounded-lg bg-zinc-800 p-4">
              <div className="text-sm text-zinc-400">Mercury Points</div>
              <div className="text-xl font-semibold text-purple-400">
                {formatStatValue.integer(resourcePool.mercuryPts)}
              </div>
            </div>
          )}
          <div className="rounded-lg bg-zinc-800 p-4">
            <div className="text-sm text-zinc-400">Focus Blessings</div>
            <div className="text-xl font-semibold text-sky-400">
              {resourcePool.focusBlessings} / {resourcePool.maxFocusBlessings}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-800 p-4">
            <div className="text-sm text-zinc-400">Agility Blessings</div>
            <div className="text-xl font-semibold text-green-400">
              {resourcePool.agilityBlessings} /{" "}
              {resourcePool.maxAgilityBlessings}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-800 p-4">
            <div className="text-sm text-zinc-400">Tenacity Blessings</div>
            <div className="text-xl font-semibold text-amber-400">
              {resourcePool.tenacityBlessings} /{" "}
              {resourcePool.maxTenacityBlessings}
            </div>
          </div>
          {resourcePool.desecration !== undefined && (
            <div className="rounded-lg bg-zinc-800 p-4">
              <div className="text-sm text-zinc-400">Desecration</div>
              <div className="text-xl font-semibold text-rose-400">
                {resourcePool.desecration}
              </div>
            </div>
          )}
          {resourcePool.additionalMaxChanneledStacks > 0 && (
            <div className="rounded-lg bg-zinc-800 p-4">
              <div className="text-sm text-zinc-400">+Max Channeled Stacks</div>
              <div className="text-xl font-semibold text-teal-400">
                {resourcePool.additionalMaxChanneledStacks}
              </div>
            </div>
          )}
          {resourcePool.hasFervor && (
            <div className="rounded-lg bg-zinc-800 p-4">
              <div className="text-sm text-zinc-400">Fervor</div>
              <div className="text-xl font-semibold text-orange-400">
                {resourcePool.fervorPts}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-50">Resistances</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-zinc-800 p-4">
            <div className="text-sm text-zinc-400">Cold</div>
            <div className="text-xl font-semibold text-cyan-400">
              {formatRes(defenses.coldRes)}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-800 p-4">
            <div className="text-sm text-zinc-400">Lightning</div>
            <div className="text-xl font-semibold text-yellow-400">
              {formatRes(defenses.lightningRes)}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-800 p-4">
            <div className="text-sm text-zinc-400">Fire</div>
            <div className="text-xl font-semibold text-orange-400">
              {formatRes(defenses.fireRes)}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-800 p-4">
            <div className="text-sm text-zinc-400">Erosion</div>
            <div className="text-xl font-semibold text-fuchsia-400">
              {formatRes(defenses.erosionRes)}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-800 p-4">
            <div className="text-sm text-zinc-400">Movement Speed</div>
            <div className="text-xl font-semibold text-green-400">
              {formatStatValue.pct(defenses.movementSpeedBonusPct)}
            </div>
          </div>
        </div>
      </div>

      {offenseSummary !== undefined &&
        (offenseSummary.attackDpsSummary !== undefined ||
          offenseSummary.persistentDpsSummary !== undefined ||
          offenseSummary.totalReapDpsSummary !== undefined) && (
          <div className="rounded-lg border border-amber-500/50 bg-zinc-900 p-6">
            <h3 className="mb-4 text-lg font-semibold text-amber-400">
              Total DPS
            </h3>
            <div className="text-4xl font-bold text-amber-400">
              {formatStatValue.dps(offenseSummary.totalDps)}
            </div>
          </div>
        )}

      {offenseSummary?.attackDpsSummary !== undefined && (
        <div className="rounded-lg border border-amber-500/30 bg-zinc-900 p-6">
          <h3 className="mb-4 text-lg font-semibold text-amber-400">
            Attack Hit Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-zinc-800 p-4">
              <div className="text-sm text-zinc-400">Average DPS</div>
              <div className="text-2xl font-bold text-amber-400">
                {formatStatValue.dps(offenseSummary.attackDpsSummary.avgDps)}
              </div>
            </div>
            <div className="rounded-lg bg-zinc-800 p-4">
              <div className="text-sm text-zinc-400">Avg Hit (no crit)</div>
              <div className="text-xl font-semibold text-zinc-50">
                {formatStatValue.damage(offenseSummary.attackDpsSummary.avgHit)}
              </div>
            </div>
            <div className="rounded-lg bg-zinc-800 p-4">
              <div className="text-sm text-zinc-400">Avg Hit (with crit)</div>
              <div className="text-xl font-semibold text-zinc-50">
                {formatStatValue.damage(
                  offenseSummary.attackDpsSummary.avgHitWithCrit,
                )}
              </div>
            </div>
            <div className="rounded-lg bg-zinc-800 p-4">
              <div className="text-sm text-zinc-400">Crit Chance</div>
              <div className="text-xl font-semibold text-zinc-50">
                {formatStatValue.percentage(
                  offenseSummary.attackDpsSummary.critChance,
                )}
              </div>
            </div>
            <div className="rounded-lg bg-zinc-800 p-4">
              <div className="text-sm text-zinc-400">Crit Multiplier</div>
              <div className="text-xl font-semibold text-zinc-50">
                {formatStatValue.multiplier(
                  offenseSummary.attackDpsSummary.critDmgMult,
                )}
              </div>
            </div>
            <div className="rounded-lg bg-zinc-800 p-4">
              <div className="text-sm text-zinc-400">Attack Speed</div>
              <div className="text-xl font-semibold text-zinc-50">
                {formatStatValue.aps(offenseSummary.attackDpsSummary.aspd)}
              </div>
            </div>
          </div>
        </div>
      )}

      {offenseSummary?.persistentDpsSummary !== undefined && (
        <PersistentDpsSummarySection
          summary={offenseSummary.persistentDpsSummary}
        />
      )}

      {offenseSummary?.totalReapDpsSummary !== undefined && (
        <ReapDpsSummarySection summary={offenseSummary.totalReapDpsSummary} />
      )}

      {(offenseSummary?.attackDpsSummary !== undefined ||
        offenseSummary?.persistentDpsSummary !== undefined ||
        offenseSummary?.totalReapDpsSummary !== undefined) &&
        groupedMods !== undefined && (
          <>
            <div>
              <h3 className="mb-4 text-lg font-semibold text-zinc-50">
                All Contributing Mods
              </h3>
              <div className="space-y-3">
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

            <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
              <h4 className="mb-2 text-sm font-medium text-zinc-400">
                Total Mods: {offenseSummary.resolvedMods.length}
              </h4>
              <p className="text-xs text-zinc-500">
                These are all mods that were considered during the damage
                calculation. Each mod shows its source to help you understand
                where your stats come from.
              </p>
            </div>
          </>
        )}

      {!selectedSkill && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-8 text-center">
          <p className="text-zinc-400">
            Select an active skill above to view damage calculations.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Only implemented skills with damage calculations will appear in the
            dropdown.
          </p>
        </div>
      )}
    </div>
  );
}
