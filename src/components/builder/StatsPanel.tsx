import { useMemo } from "react";
import type { ImplementedActiveSkillName } from "@/src/data/skill/types";
import {
  calculateOffense,
  type OffenseInput,
  type PersistentDpsSummary,
  type Resistance,
  type TotalReapDpsSummary,
} from "@/src/tli/calcs/offense";
import { formatStatValue } from "../../lib/calculations-utils";
import {
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

const PersistentDpsSection = ({
  summary,
}: {
  summary: PersistentDpsSummary;
}): React.ReactNode => {
  return (
    <div className="mt-4 space-y-3">
      <div className="text-xs font-medium text-zinc-400">Persistent Damage</div>

      <div className="rounded bg-zinc-800 p-3">
        <div className="text-xs text-zinc-400">Persistent DPS</div>
        <div className="text-xl font-bold text-amber-400">
          {formatStatValue.dps(summary.total)}
        </div>
      </div>

      <div className="rounded bg-zinc-800 p-3">
        <div className="text-xs text-zinc-400">Duration</div>
        <div className="text-lg font-semibold text-zinc-50">
          {formatStatValue.duration(summary.duration)}
        </div>
      </div>
    </div>
  );
};

const ReapDpsSection = ({
  summary,
}: {
  summary: TotalReapDpsSummary;
}): React.ReactNode => {
  return (
    <div className="mt-4 space-y-3">
      <div className="text-xs font-medium text-zinc-400">Reap Damage</div>

      <div className="rounded bg-zinc-800 p-3">
        <div className="text-xs text-zinc-400">Total Reap DPS</div>
        <div className="text-xl font-bold text-amber-400">
          {formatStatValue.dps(summary.totalReapDps)}
        </div>
      </div>

      <div className="rounded bg-zinc-800 p-3">
        <div className="text-xs text-zinc-400">Duration Bonus</div>
        <div className="text-lg font-semibold text-zinc-50">
          {formatStatValue.percentage(summary.reapDurationBonus)}
        </div>
      </div>

      <div className="rounded bg-zinc-800 p-3">
        <div className="text-xs text-zinc-400">CDR Bonus</div>
        <div className="text-lg font-semibold text-zinc-50">
          {formatStatValue.percentage(summary.reapCdrBonus)}
        </div>
      </div>
    </div>
  );
};

export const StatsPanel = (): React.ReactNode => {
  const loadout = useLoadout();
  const configuration = useConfiguration();
  const savedSkillName = useCalculationsSelectedSkill();
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

  return (
    <div className="sticky top-6 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 p-4">
      <h3 className="mb-4 text-lg font-semibold text-zinc-50">Stats Summary</h3>

      <div className="mb-4 space-y-2">
        <div className="text-xs font-medium text-zinc-400">Resource Pool</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded bg-zinc-800 p-2 text-center">
            <div className="text-xs text-zinc-500">STR</div>
            <div className="font-medium text-zinc-50">
              {formatStatValue.integer(resourcePool.stats.str)}
            </div>
          </div>
          <div className="rounded bg-zinc-800 p-2 text-center">
            <div className="text-xs text-zinc-500">DEX</div>
            <div className="font-medium text-zinc-50">
              {formatStatValue.integer(resourcePool.stats.dex)}
            </div>
          </div>
          <div className="rounded bg-zinc-800 p-2 text-center">
            <div className="text-xs text-zinc-500">INT</div>
            <div className="font-medium text-zinc-50">
              {formatStatValue.integer(resourcePool.stats.int)}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded bg-zinc-800 p-2">
            <div className="text-xs text-zinc-500">Max Life</div>
            <div className="font-medium text-red-400">
              {formatStatValue.integer(resourcePool.maxLife)}
            </div>
          </div>
          <div className="rounded bg-zinc-800 p-2">
            <div className="text-xs text-zinc-500">Max Mana</div>
            <div className="font-medium text-blue-400">
              {formatStatValue.integer(resourcePool.maxMana)}
            </div>
          </div>
          {resourcePool.mercuryPts !== undefined && (
            <div className="rounded bg-zinc-800 p-2">
              <div className="text-xs text-zinc-500">Mercury</div>
              <div className="font-medium text-purple-400">
                {formatStatValue.integer(resourcePool.mercuryPts)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <div className="text-xs font-medium text-zinc-400">Resistances</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded bg-zinc-800 p-2">
            <div className="text-xs text-zinc-500">Cold</div>
            <div className="font-medium text-cyan-400">
              {formatRes(defenses.coldRes)}
            </div>
          </div>
          <div className="rounded bg-zinc-800 p-2">
            <div className="text-xs text-zinc-500">Lightning</div>
            <div className="font-medium text-yellow-400">
              {formatRes(defenses.lightningRes)}
            </div>
          </div>
          <div className="rounded bg-zinc-800 p-2">
            <div className="text-xs text-zinc-500">Fire</div>
            <div className="font-medium text-orange-400">
              {formatRes(defenses.fireRes)}
            </div>
          </div>
          <div className="rounded bg-zinc-800 p-2">
            <div className="text-xs text-zinc-500">Erosion</div>
            <div className="font-medium text-fuchsia-400">
              {formatRes(defenses.erosionRes)}
            </div>
          </div>
        </div>
        <div className="rounded bg-zinc-800 p-2">
          <div className="text-xs text-zinc-500">Movement Speed</div>
          <div className="font-medium text-green-400">
            {defenses.movementSpeedBonusPct}%
          </div>
        </div>
      </div>

      {offenseSummary?.attackDpsSummary !== undefined ||
      offenseSummary?.persistentDpsSummary !== undefined ||
      offenseSummary?.totalReapDpsSummary !== undefined ? (
        <>
          <div className="mb-4 rounded bg-zinc-800 px-3 py-2">
            <div className="text-xs text-zinc-400">Selected Skill</div>
            <div className="font-medium text-zinc-50">{selectedSkill}</div>
          </div>

          <div className="mb-4 rounded border border-amber-500/30 bg-zinc-800 p-3">
            <div className="text-xs text-zinc-400">Total DPS</div>
            <div className="text-2xl font-bold text-amber-400">
              {formatStatValue.dps(offenseSummary.totalDps)}
            </div>
          </div>

          {offenseSummary.attackDpsSummary !== undefined && (
            <div className="space-y-3">
              <div className="rounded bg-zinc-800 p-3">
                <div className="text-xs text-zinc-400">Average DPS</div>
                <div className="text-xl font-bold text-amber-400">
                  {formatStatValue.dps(offenseSummary.attackDpsSummary.avgDps)}
                </div>
              </div>

              <div className="rounded bg-zinc-800 p-3">
                <div className="text-xs text-zinc-400">Avg Hit (no crit)</div>
                <div className="text-lg font-semibold text-zinc-50">
                  {formatStatValue.damage(
                    offenseSummary.attackDpsSummary.avgHit,
                  )}
                </div>
              </div>

              <div className="rounded bg-zinc-800 p-3">
                <div className="text-xs text-zinc-400">Avg Hit (with crit)</div>
                <div className="text-lg font-semibold text-zinc-50">
                  {formatStatValue.damage(
                    offenseSummary.attackDpsSummary.avgHitWithCrit,
                  )}
                </div>
              </div>

              <div className="rounded bg-zinc-800 p-3">
                <div className="text-xs text-zinc-400">Crit Chance</div>
                <div className="text-lg font-semibold text-zinc-50">
                  {formatStatValue.percentage(
                    offenseSummary.attackDpsSummary.critChance,
                  )}
                </div>
              </div>

              <div className="rounded bg-zinc-800 p-3">
                <div className="text-xs text-zinc-400">Crit Multiplier</div>
                <div className="text-lg font-semibold text-zinc-50">
                  {formatStatValue.multiplier(
                    offenseSummary.attackDpsSummary.critDmgMult,
                  )}
                </div>
              </div>

              <div className="rounded bg-zinc-800 p-3">
                <div className="text-xs text-zinc-400">Attack Speed</div>
                <div className="text-lg font-semibold text-zinc-50">
                  {formatStatValue.aps(offenseSummary.attackDpsSummary.aspd)}
                </div>
              </div>
            </div>
          )}

          {offenseSummary.persistentDpsSummary !== undefined && (
            <PersistentDpsSection
              summary={offenseSummary.persistentDpsSummary}
            />
          )}

          {offenseSummary.totalReapDpsSummary !== undefined && (
            <ReapDpsSection summary={offenseSummary.totalReapDpsSummary} />
          )}
        </>
      ) : (
        <div className="text-center">
          <p className="text-sm text-zinc-400">
            Select an active skill in the Calculations tab to view stats.
          </p>
        </div>
      )}
    </div>
  );
};
