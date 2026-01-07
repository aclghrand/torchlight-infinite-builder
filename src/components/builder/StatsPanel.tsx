import { useMemo } from "react";
import type { ImplementedActiveSkillName } from "@/src/data/skill/types";
import {
  calculateOffense,
  type OffenseInput,
  type OffenseSpellBurstDpsSummary,
  type OffenseSpellDpsSummary,
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

const PersistentDpsSection = ({
  summary,
}: {
  summary: PersistentDpsSummary;
}): React.ReactNode => {
  return (
    <>
      <StatLine
        label="Persistent DPS"
        value={formatStatValue.dps(summary.total)}
        highlight
      />
      <StatLine
        label="Duration"
        value={formatStatValue.duration(summary.duration)}
      />
    </>
  );
};

const ReapDpsSection = ({
  summary,
}: {
  summary: TotalReapDpsSummary;
}): React.ReactNode => {
  return (
    <>
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
    </>
  );
};

const SpellDpsSection = ({
  summary,
}: {
  summary: OffenseSpellDpsSummary;
}): React.ReactNode => {
  return (
    <>
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
    </>
  );
};

const SpellBurstDpsSection = ({
  summary,
}: {
  summary: OffenseSpellBurstDpsSummary;
}): React.ReactNode => {
  return (
    <>
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
            value={formatStatValue.duration(summary.ingenuityOverload.interval)}
            color="text-teal-400"
          />
        </>
      )}
    </>
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
  const offenseSummary =
    selectedSkill !== undefined ? skills[selectedSkill] : undefined;

  const hasDamageStats =
    offenseSummary?.attackDpsSummary !== undefined ||
    offenseSummary?.spellDpsSummary !== undefined ||
    offenseSummary?.spellBurstDpsSummary !== undefined ||
    offenseSummary?.persistentDpsSummary !== undefined ||
    offenseSummary?.totalReapDpsSummary !== undefined;

  return (
    <div className="sticky top-6 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 p-4">
      <h3 className="mb-3 text-lg font-semibold text-zinc-50">Stats Summary</h3>

      <div className="space-y-0.5">
        {hasDamageStats && offenseSummary !== undefined ? (
          <>
            <StatLine label="Skill" value={selectedSkill ?? ""} />
            <StatLine
              label="Total DPS"
              value={formatStatValue.dps(offenseSummary.totalDps)}
              highlight
            />

            {offenseSummary.attackDpsSummary !== undefined && (
              <>
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
              </>
            )}

            {offenseSummary.spellDpsSummary !== undefined && (
              <SpellDpsSection summary={offenseSummary.spellDpsSummary} />
            )}

            {offenseSummary.spellBurstDpsSummary !== undefined && (
              <>
                <div className="h-2" />
                <SpellBurstDpsSection
                  summary={offenseSummary.spellBurstDpsSummary}
                />
              </>
            )}

            {offenseSummary.persistentDpsSummary !== undefined && (
              <>
                <div className="h-2" />
                <PersistentDpsSection
                  summary={offenseSummary.persistentDpsSummary}
                />
              </>
            )}

            {offenseSummary.totalReapDpsSummary !== undefined && (
              <>
                <div className="h-2" />
                <ReapDpsSection summary={offenseSummary.totalReapDpsSummary} />
              </>
            )}

            <div className="h-2" />
            <StatLine
              label="Movement Speed"
              value={formatStatValue.pct(offenseSummary.movementSpeedBonusPct)}
              color="text-green-400"
            />

            <div className="h-2" />
          </>
        ) : (
          <p className="mb-3 text-sm text-zinc-400">
            Select an active skill in the Calculations tab to view damage stats.
          </p>
        )}

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

        <div className="h-2" />

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

        <div className="h-2" />

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
      </div>
    </div>
  );
};
