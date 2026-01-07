import type { SupportMod } from "../core";
import type { Mod } from "../mod";
import { spec, t } from "../mod_parser";

const GLOBAL = "global" as const;

/**
 * Willpower parser - handles full text blob for Willpower skill
 * Extracts:
 * - MaxWillpowerStacks from "Stacks up to N time(s)"
 * - DmgPct with per: { stackable: "willpower" } from the damage line
 */
const parseWillpowerBlob = (input: string): Mod[] | undefined => {
  const normalized = input.toLowerCase();

  // Check if this is a Willpower description
  if (!normalized.includes("for every stack of buffs while standing still")) {
    return undefined;
  }

  const mods: Mod[] = [];

  // Extract max stacks: "Stacks up to N time(s)"
  const stacksMatch = normalized.match(/stacks up to (\d+) time\(s\)/);
  if (stacksMatch !== null) {
    mods.push({
      type: "MaxWillpowerStacks",
      value: parseInt(stacksMatch[1], 10),
    });
  }

  // Extract damage per stack: "+X% additional damage for the supported skill for every stack of buffs while standing still"
  const dmgMatch = normalized.match(
    /\+?([\d.]+)%?\s*additional damage for the supported skill for every stack of buffs while standing still/,
  );
  if (dmgMatch !== null) {
    mods.push({
      type: "DmgPct",
      value: parseFloat(dmgMatch[1]),
      dmgModType: GLOBAL,
      addn: true,
      per: { stackable: "willpower" as const },
    });
  }

  return mods.length > 0 ? mods : undefined;
};

const allSupportParsers = [
  t("auto-used supported skills {value:int%} additional damage").output(
    "DmgPct",
    (c) => ({
      value: c.value,
      dmgModType: GLOBAL,
      addn: true,
    }),
  ),
  t("manually used supported skills {value:int%} additional damage").output(
    "DmgPct",
    (c) => ({
      value: c.value,
      dmgModType: GLOBAL,
      addn: true,
    }),
  ),
  t(
    "{value:int%} additional damage for minions summoned by the supported skill",
  ).output("MinionDmgPct", (c) => ({
    value: c.value,
    addn: true,
  })),
  // Signed version (e.g., "+19.8% additional damage for the supported skill")
  t("{value:+dec%} additional damage for the supported skill").output(
    "DmgPct",
    (c) => ({
      value: c.value,
      dmgModType: GLOBAL,
      addn: true,
    }),
  ),
  // Unsigned version (e.g., "0.8% additional damage for the supported skill")
  t("{value:dec%} additional damage for the supported skill").output(
    "DmgPct",
    (c) => ({
      value: c.value,
      dmgModType: GLOBAL,
      addn: true,
    }),
  ),
  t("{value:+dec%} additional melee damage for the supported skill").output(
    "DmgPct",
    (c) => ({
      value: c.value,
      dmgModType: "melee" as const,
      addn: true,
    }),
  ),
  t(
    "{value:dec%} additional {dmgType:DmgModType} damage for the supported skill",
  ).output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: c.dmgType,
    addn: true,
  })),
  t("{value:+dec%} additional ailment damage for the supported skill").output(
    "DmgPct",
    (c) => ({
      value: c.value,
      dmgModType: "ailment" as const,
      addn: true,
    }),
  ),
  t(
    "{value:dec%} [additional] damage over time for the supported skill",
  ).output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: "damage_over_time" as const,
    addn: c.additional !== undefined,
  })),
  t(
    "the supported skill deals more damage to enemies with more life, up to {value:+int%} additional erosion damage",
  ).output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: "erosion" as const,
    addn: true,
  })),
  t(
    "the supported skill deals {value:dec%} additional damage to cursed enemies",
  ).output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: true,
    cond: "enemy_is_cursed" as const,
  })),
  t(
    "{value:+dec%} additional damage for the supported skill when it lands a critical strike",
  ).output("CritDmgPct", (c) => ({
    value: c.value,
    addn: true,
    modType: GLOBAL,
  })),
  t("{value:+dec%} attack speed for the supported skill").output(
    "AspdPct",
    (c) => ({
      value: c.value,
      addn: false,
    }),
  ),
  t("{value:+dec%} cast speed for the supported skill").output(
    "CspdPct",
    (c) => ({
      value: c.value,
      addn: false,
    }),
  ),
  t(
    "{value:+dec%} additional hit damage for skills cast by spell burst when spell burst is activated by the supported skill",
  ).output("SpellBurstAdditionalDmgPct", (c) => ({
    value: c.value,
  })),
  t(
    "{value:+dec%} additional attack and cast speed for the supported skill",
  ).outputMany([
    spec("AspdPct", (c) => ({ value: c.value, addn: true })),
    spec("CspdPct", (c) => ({ value: c.value, addn: true })),
  ]),
  t("{value:+dec%} critical strike rating for the supported skill").output(
    "CritRatingPct",
    (c) => ({
      value: c.value,
      modType: GLOBAL,
    }),
  ),
  t("{value:+dec%} skill area for the supported skill").output(
    "SkillAreaPct",
    (c) => ({
      value: c.value,
      skillAreaModType: GLOBAL,
    }),
  ),
  t("{value:dec%} aura effect for the supported skill").output(
    "AuraEffPct",
    (c) => ({
      value: c.value,
    }),
  ),
  t("{value:dec%} buff effect for the supported skill").output(
    "FocusBuffEffPct",
    (c) => ({
      value: c.value,
    }),
  ),
  t("{value:+dec%} duration for the supported skill").output(
    "SkillEffDurationPct",
    (c) => ({
      value: c.value,
    }),
  ),
  t(
    "the supported skill {value:dec%} effect every time it is cast, up to {_:int} time\\(s\\)",
  ).output("SkillEffPct", (c) => ({
    value: c.value,
    per: { stackable: "skill_use" as const },
  })),
  t(
    "{value:dec%} effect for the status provided by the skill per charge when you use the supported skill",
  ).output("SkillEffPct", (c) => ({
    value: c.value,
    per: { stackable: "skill_charges_on_use" as const },
  })),
  t("{value:+int} shadow quantity for the supported skill").output(
    "ShadowQuant",
    (c) => ({
      value: c.value,
    }),
  ),
  t("{value:+int} jumps for the supported skill").output("Jump", (c) => ({
    value: c.value,
  })),
  t("stacks up to {value:int} time(s)").output("MaxWillpowerStacks", (c) => ({
    value: c.value,
  })),
  t(
    "when the supported skill deals damage over time, it inflicts {value:int} affliction on the enemy. effect cooldown: {_:int} s",
  ).output("AfflictionInflictedPerSec", (c) => ({
    value: c.value,
  })),
  t("it inflicts {value:int} affliction on the enemy").output(
    "AfflictionInflictedPerSec",
    (c) => ({
      value: c.value,
    }),
  ),
  t(
    "affliction grants an additional {value:dec%} effect to the supported skill",
  ).output("AfflictionEffectPct", (c) => ({
    value: c.value,
    addn: true,
    cond: "enemy_at_max_affliction" as const,
  })),
  t("{value:int%} chance to paralyze it").output(
    "InflictParalysisPct",
    (c) => ({
      value: c.value,
      cond: "enemy_is_cursed" as const,
    }),
  ),
  t(
    "when the supported skill deals damage to a cursed target, there is a {value:+dec%} chance to paralyze it",
  ).output("InflictParalysisPct", (c) => ({
    value: c.value,
    cond: "enemy_is_cursed" as const,
  })),
  t("the supported skill cannot inflict wilt").output("CannotInflictWilt"),
  t(
    "every {_:int} time\\(s\\) the supported skill is used, gains a barrier if there's no barrier. interval: {_:int} s",
  ).output("GeneratesBarrier"),
  t("gains a barrier if there's no barrier").output("GeneratesBarrier"),
  t("{value:int%} projectile size for the supported skill").output(
    "ProjectileSizePct",
    (c) => ({
      value: c.value,
    }),
  ),
  t("{value:int%} additional ignite duration for the supported skill").output(
    "IgniteDurationPct",
    (c) => ({
      value: c.value,
    }),
  ),
  t("{value:int%} additional duration for the supported skill").output(
    "SkillEffDurationPct",
    (c) => ({
      value: c.value,
    }),
  ),
  t(
    "+{value:dec%} additional damage for this skill for every link less than maximum links",
  ).output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: true,
    per: { stackable: "unused_mind_control_link" as const },
  })),
  t(
    "converts {value:int%} of the supported skill's {from:DmgChunkType} damage to {to:DmgChunkType} damage",
  ).output("ConvertDmgPct", (c) => ({
    value: c.value,
    from: c.from,
    to: c.to,
  })),
  t(
    "{value:dec%} additional damage for the supported skill for every stack of focus blessing, stacking up to {limit:int} times",
  ).output("DmgPct", (c) => ({
    value: c.value,
    dmgModType: GLOBAL,
    addn: true,
    per: { stackable: "focus_blessing" as const, limit: c.limit },
  })),
  t(
    "for every 1 jump, the supported skill releases 1 additional chain lightning \\(does not target the same enemy\\). each chain lightning can only jump 1 time\\(s\\)",
  ).output("ChainLightningWebOfLightning"),
  t(
    "multiple chain lightnings released by the supported skill can target the same enemy, but will prioritize different enemies. the shotgun effect falloff coefficient of the supported skill is {value:int}%",
  ).output("ChainLightningMerge", (c) => ({
    shotgunFalloffCoefficient: c.value,
  })),
];

const parseSupportAffix = (text: string): SupportMod[] | undefined => {
  const normalized = text.trim().toLowerCase();

  // Try blob parsers first (for skills with Descript columns like Willpower)
  const willpowerMods = parseWillpowerBlob(normalized);
  if (willpowerMods !== undefined) {
    return willpowerMods.map((mod) => ({ mod }));
  }

  // Try template-based parsers
  for (const parser of allSupportParsers) {
    const mods = parser.parse(normalized);
    if (mods !== undefined) {
      return mods.map((mod) => ({ mod }));
    }
  }
  return undefined;
};

export const parseSupportAffixes = (affixes: string[]): SupportMod[][] => {
  return affixes.map((text) => parseSupportAffix(text) ?? []);
};
