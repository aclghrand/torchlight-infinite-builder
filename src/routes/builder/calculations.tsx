import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import type { ImplementedActiveSkillName } from "@/src/data/skill/types";
import { calculateOffense, type OffenseInput } from "@/src/tli/calcs/offense";
import { ModGroup } from "../../components/calculations/ModGroup";
import { SkillSelector } from "../../components/calculations/SkillSelector";
import { StatBreakdown } from "../../components/calculations/StatBreakdown";
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

  const { skills, resourcePool } = offenseResults;
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
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
            <div className="text-sm text-zinc-400">Max Mana</div>
            <div className="text-xl font-semibold text-blue-400">
              {formatStatValue.integer(resourcePool.maxMana)}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-800 p-4">
            <div className="text-sm text-zinc-400">Mercury Points</div>
            <div className="text-xl font-semibold text-purple-400">
              {formatStatValue.integer(resourcePool.mercuryPts)}
            </div>
          </div>
        </div>
      </div>

      {offenseSummary && groupedMods && (
        <>
          <div className="rounded-lg border border-amber-500/30 bg-zinc-900 p-6">
            <h3 className="mb-4 text-lg font-semibold text-amber-400">
              Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-zinc-800 p-4">
                <div className="text-sm text-zinc-400">Average DPS</div>
                <div className="text-2xl font-bold text-amber-400">
                  {formatStatValue.dps(offenseSummary.avgDps)}
                </div>
              </div>
              <div className="rounded-lg bg-zinc-800 p-4">
                <div className="text-sm text-zinc-400">Avg Hit (no crit)</div>
                <div className="text-xl font-semibold text-zinc-50">
                  {formatStatValue.damage(offenseSummary.avgHit)}
                </div>
              </div>
              <div className="rounded-lg bg-zinc-800 p-4">
                <div className="text-sm text-zinc-400">Avg Hit (with crit)</div>
                <div className="text-xl font-semibold text-zinc-50">
                  {formatStatValue.damage(offenseSummary.avgHitWithCrit)}
                </div>
              </div>
              <div className="rounded-lg bg-zinc-800 p-4">
                <div className="text-sm text-zinc-400">Crit Chance</div>
                <div className="text-xl font-semibold text-zinc-50">
                  {formatStatValue.percentage(offenseSummary.critChance)}
                </div>
              </div>
              <div className="rounded-lg bg-zinc-800 p-4">
                <div className="text-sm text-zinc-400">Crit Multiplier</div>
                <div className="text-xl font-semibold text-zinc-50">
                  {formatStatValue.multiplier(offenseSummary.critDmgMult)}
                </div>
              </div>
              <div className="rounded-lg bg-zinc-800 p-4">
                <div className="text-sm text-zinc-400">Attack Speed</div>
                <div className="text-xl font-semibold text-zinc-50">
                  {formatStatValue.aps(offenseSummary.aspd)}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-zinc-50">
              Stat Breakdowns
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <StatBreakdown
                title="Critical Chance"
                finalValue={formatStatValue.percentage(
                  offenseSummary.critChance,
                )}
                mods={groupedMods.critRating}
                description="Base 5% + crit rating mods"
                groupTitle="Critical Rating Mods"
                groupDescription="Affects crit chance"
                defaultExpanded
              />
              <StatBreakdown
                title="Critical Damage"
                finalValue={formatStatValue.multiplier(
                  offenseSummary.critDmgMult,
                )}
                mods={groupedMods.critDmg}
                description="Base 150% + crit damage mods"
                groupTitle="Critical Damage Mods"
                groupDescription="Affects crit multiplier"
                defaultExpanded
              />
              <StatBreakdown
                title="Attack Speed"
                finalValue={formatStatValue.aps(offenseSummary.aspd)}
                mods={groupedMods.aspd}
                description="Base from weapon + attack speed mods"
                groupTitle="Attack Speed Mods"
                groupDescription="Affects APS"
                defaultExpanded
              />
              <StatBreakdown
                title="Damage"
                finalValue={formatStatValue.damage(offenseSummary.avgHit)}
                mods={groupedMods.damage}
                description="Weapon + flat + % damage mods"
                groupTitle="Damage Mods"
                groupDescription="Affects hit damage"
                defaultExpanded
              />
            </div>
          </div>

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
