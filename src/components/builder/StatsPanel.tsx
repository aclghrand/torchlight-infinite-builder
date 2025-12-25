import { useMemo } from "react";
import type { ImplementedActiveSkillName } from "@/src/data/skill/types";
import { calculateOffense, type OffenseInput } from "@/src/tli/calcs/offense";
import { formatStatValue } from "../../lib/calculations-utils";
import {
  useCalculationsSelectedSkill,
  useConfiguration,
  useLoadout,
} from "../../stores/builderStore";

export const StatsPanel = () => {
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

  const { skills, resourcePool } = offenseResults;
  const offenseSummary = selectedSkill ? skills[selectedSkill] : undefined;

  return (
    <div className="sticky top-6 rounded-lg border border-zinc-700 bg-zinc-900 p-4">
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
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded bg-zinc-800 p-2">
            <div className="text-xs text-zinc-500">Max Mana</div>
            <div className="font-medium text-blue-400">
              {formatStatValue.integer(resourcePool.maxMana)}
            </div>
          </div>
          <div className="rounded bg-zinc-800 p-2">
            <div className="text-xs text-zinc-500">Mercury</div>
            <div className="font-medium text-purple-400">
              {formatStatValue.integer(resourcePool.mercuryPts)}
            </div>
          </div>
        </div>
      </div>

      {offenseSummary ? (
        <>
          <div className="mb-4 rounded bg-zinc-800 px-3 py-2">
            <div className="text-xs text-zinc-400">Selected Skill</div>
            <div className="font-medium text-zinc-50">{selectedSkill}</div>
          </div>

          <div className="space-y-3">
            <div className="rounded bg-zinc-800 p-3">
              <div className="text-xs text-zinc-400">Average DPS</div>
              <div className="text-xl font-bold text-amber-400">
                {formatStatValue.dps(offenseSummary.avgDps)}
              </div>
            </div>

            <div className="rounded bg-zinc-800 p-3">
              <div className="text-xs text-zinc-400">Avg Hit (no crit)</div>
              <div className="text-lg font-semibold text-zinc-50">
                {formatStatValue.damage(offenseSummary.avgHit)}
              </div>
            </div>

            <div className="rounded bg-zinc-800 p-3">
              <div className="text-xs text-zinc-400">Avg Hit (with crit)</div>
              <div className="text-lg font-semibold text-zinc-50">
                {formatStatValue.damage(offenseSummary.avgHitWithCrit)}
              </div>
            </div>

            <div className="rounded bg-zinc-800 p-3">
              <div className="text-xs text-zinc-400">Crit Chance</div>
              <div className="text-lg font-semibold text-zinc-50">
                {formatStatValue.percentage(offenseSummary.critChance)}
              </div>
            </div>

            <div className="rounded bg-zinc-800 p-3">
              <div className="text-xs text-zinc-400">Crit Multiplier</div>
              <div className="text-lg font-semibold text-zinc-50">
                {formatStatValue.multiplier(offenseSummary.critDmgMult)}
              </div>
            </div>

            <div className="rounded bg-zinc-800 p-3">
              <div className="text-xs text-zinc-400">Attack Speed</div>
              <div className="text-lg font-semibold text-zinc-50">
                {formatStatValue.aps(offenseSummary.aspd)}
              </div>
            </div>
          </div>
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
