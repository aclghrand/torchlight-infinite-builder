import type { BaseActivationMediumSkill } from "./types";

export const ActivationMediumSkills = [
  {
    type: "Activation Medium",
    name: "Activation Medium: Boss",
    tags: [],
    description: [
      "Supports Empower, Defensive, Restoration, Curse, and Warcry Skills.\nCannot support Channeled Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Always attempts to trigger the supported skill when there is a boss within (6–20) m. Interval: 0.1s",
      "<Cooldown Recovery Speed or Duration Bonus>",
    ],
    supportTargets: [
      { tags: ["Empower"] },
      { tags: ["Defensive"] },
      { tags: ["Restoration"] },
      { tags: ["Curse"] },
      { tags: ["Warcry"] },
    ],
    cannotSupportTargets: [{ tags: ["Channeled"] }],
    affixDefs: {
      0: [
        {
          affix:
            "The supported skill +(20-25)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(20-25)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Always attempts to trigger the supported skill when there is a boss within (6-20) m. Interval: 0.1s",
        },
      ],
      1: [
        {
          affix:
            "The supported skill +(12-19)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(12-19)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Always attempts to trigger the supported skill when there is a boss within (6-20) m. Interval: 0.1s",
        },
      ],
      2: [
        {
          affix:
            "The supported skill +(7-11)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(7-11)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Always attempts to trigger the supported skill when there is a boss within (6-20) m. Interval: 0.1s",
        },
      ],
      3: [
        {
          affix:
            "The supported skill (-25--15)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "(-25--15)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Always attempts to trigger the supported skill when there is a boss within (6-20) m. Interval: 0.1s",
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Burst Activation",
    tags: [],
    description: [
      "Supports Spell Skills that deal damage or skills that can activate Spell Burst.\nCannot support Passive Skills and Channeled Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "When Spell Burst is fully charged, triggers the supported skill on the nearest enemy within 25m and attempts to trigger the supported skill's Spell Burst",
      "(-15–-1)% additional Hit Damage for skills cast by Spell Burst when Spell Burst is activated by the supported skill",
      "-40% Movement Speed for 2 s when the supported skill activates Spell Burst",
    ],
    supportTargets: [
      { tags: ["Spell"], requiredKind: "deal_damage" },
      "spell_burst",
    ],
    cannotSupportTargets: [{ skillType: "passive" }, { tags: ["Channeled"] }],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Channel",
    tags: [],
    description: [
      "Supports Channeled Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "When channeling the supported skill, sends 1 Instruction for every 2 stack(s) channeled.",
    ],
    supportTargets: [{ tags: ["Channeled"] }],
    cannotSupportTargets: [],
    affixDefs: {
      0: [
        {
          affix:
            "When channeling the supported skill, sends 1 Instruction for every 1 stack(s) channeled.",
        },
      ],
      1: [
        {
          affix:
            "When channeling the supported skill, sends 1 Instruction for every 2 stack(s) channeled.",
        },
      ],
      2: [
        {
          affix:
            "When channeling the supported skill, sends 1 Instruction for every 3 stack(s) channeled.",
        },
      ],
      3: [
        {
          affix:
            "When channeling the supported skill, sends 1 Instruction for every 4 stack(s) channeled.",
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Critical Strike",
    tags: [],
    description: [
      "Supports skills that hit the enemy.\nThis skill cannot support Summon Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "When the supported skill lands a Critical Strike, sends (2–3) Instruction(s). Interval: 0.03 s.",
    ],
    supportTargets: ["hit_enemies"],
    cannotSupportTargets: [{ tags: ["Summon"] }],
    affixDefs: {
      0: [
        {
          affix:
            "When the supported skill lands a Critical Strike, sends 4 Instruction(s). Interval: 0.03 s.",
        },
      ],
      1: [
        {
          affix:
            "When the supported skill lands a Critical Strike, sends (2-3) Instruction(s). Interval: 0.03 s.",
        },
      ],
      2: [
        {
          affix:
            "When the supported skill lands a Critical Strike, sends (2-3) Instruction(s). Interval: 0.06 s.",
        },
      ],
      3: [
        {
          affix:
            "When the supported skill lands a Critical Strike, sends (1-3) Instruction(s). Interval: 0.09 s.",
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Demolisher",
    tags: [],
    description: [
      "Supports Empower, Defensive, Restoration, Curse, and Warcry Skills.\nCannot support Channeled Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Triggers the supported skill upon gaining Demolisher Charge. Interval: 0.1s",
      "<Cooldown Recovery Speed or Duration Bonus>",
    ],
    supportTargets: [
      { tags: ["Empower"] },
      { tags: ["Defensive"] },
      { tags: ["Restoration"] },
      { tags: ["Curse"] },
      { tags: ["Warcry"] },
    ],
    cannotSupportTargets: [{ tags: ["Channeled"] }],
    affixDefs: {
      0: [
        {
          affix:
            "The supported skill +(20-25)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(20-25)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            'Triggers the supported skill upon gaining Using a Demolisher Skill will consume its charges and convert the skill into a stronger form">Demolisher Charge. Interval: 0.1s',
        },
      ],
      1: [
        {
          affix:
            "The supported skill +(12-19)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(12-19)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            'Triggers the supported skill upon gaining Using a Demolisher Skill will consume its charges and convert the skill into a stronger form">Demolisher Charge. Interval: 0.1s',
        },
      ],
      2: [
        {
          affix:
            "The supported skill +(7-11)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(7-11)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            'Triggers the supported skill upon gaining Using a Demolisher Skill will consume its charges and convert the skill into a stronger form">Demolisher Charge. Interval: 0.1s',
        },
      ],
      3: [
        {
          affix:
            "The supported skill (-25--15)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "(-25--15)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            'Triggers the supported skill upon gaining Using a Demolisher Skill will consume its charges and convert the skill into a stronger form">Demolisher Charge. Interval: 0.1s',
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Elite",
    tags: [],
    description: [
      "Supports Empower, Defensive, Restoration, Curse, and Warcry Skills.\nCannot support Channeled Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Always attempts to trigger the supported skill when there is an Elite within (6–20) m. Interval: 0.2 s",
      "<Cooldown Recovery Speed or Duration Bonus>",
    ],
    supportTargets: [
      { tags: ["Empower"] },
      { tags: ["Defensive"] },
      { tags: ["Restoration"] },
      { tags: ["Curse"] },
      { tags: ["Warcry"] },
    ],
    cannotSupportTargets: [{ tags: ["Channeled"] }],
    affixDefs: {
      0: [
        {
          affix:
            "The supported skill +(20-25)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(20-25)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Always attempts to trigger the supported skill when there is an Elite within (6-20) m. Interval: 0.2 s",
        },
      ],
      1: [
        {
          affix:
            "The supported skill +(12-19)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(12-19)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Always attempts to trigger the supported skill when there is an Elite within (6-20) m. Interval: 0.2 s",
        },
      ],
      2: [
        {
          affix:
            "The supported skill +(7-11)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(7-11)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Always attempts to trigger the supported skill when there is an Elite within (6-20) m. Interval: 0.2 s",
        },
      ],
      3: [
        {
          affix:
            "The supported skill (-25--15)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "(-25--15)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Always attempts to trigger the supported skill when there is an Elite within (6-20) m. Interval: 0.2 s",
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Energy Shield",
    tags: [],
    description: [
      "Supports Empower, Defensive, Restoration, and Curse Skills.\nCannot support Channeled Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Always attempts to trigger the supported skill when Energy Shield is lower than (20–95)% . Interval: 0.1s",
      "<Cooldown Recovery Speed or Duration Bonus>",
    ],
    supportTargets: [
      { tags: ["Empower"] },
      { tags: ["Defensive"] },
      { tags: ["Restoration"] },
      { tags: ["Curse"] },
    ],
    cannotSupportTargets: [{ tags: ["Channeled"] }],
    affixDefs: {
      0: [
        {
          affix:
            "The supported skill +(20-25)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(20-25)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Always attempts to trigger the supported skill when Energy Shield is lower than (20-95)% . Interval: 0.1s",
        },
      ],
      1: [
        {
          affix:
            "The supported skill +(12-19)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(12-19)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Always attempts to trigger the supported skill when Energy Shield is lower than (20-95)% . Interval: 0.1s",
        },
      ],
      2: [
        {
          affix:
            "The supported skill +(7-11)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(7-11)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Always attempts to trigger the supported skill when Energy Shield is lower than (20-95)% . Interval: 0.1s",
        },
      ],
      3: [
        {
          affix:
            "The supported skill (-25--15)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "(-25--15)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Always attempts to trigger the supported skill when Energy Shield is lower than (20-95)% . Interval: 0.1s",
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Instruction",
    tags: [],
    description: [
      "Supports Active Skill that deal damage.\nCannot support Channeled Skills and Attack Mobility Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Triggers the supported skill on the closest enemy within 20m every (0.4–1.0)s.",
      "The next skill triggered by the supported skill deals +(6–7)% additional damage for every Instruction received during the trigger interval, up to +(54–63)% additional damage.",
      "Manually used supported skills -80% additional damage",
    ],
    supportTargets: [{ skillType: "active", requiredKind: "deal_damage" }],
    cannotSupportTargets: [
      { tags: ["Channeled"] },
      { tags: ["Attack", "Mobility"] },
    ],
    affixDefs: {
      0: [
        {
          affix:
            "The next skill triggered by the supported skill deals +(8-10)% additional damage for every Instruction received during the trigger interval, up to +(72-90)% additional damage.",
        },
        { affix: "Manually used supported skills -80% additional damage" },
      ],
      1: [
        {
          affix:
            "Triggers the supported skill on the closest enemy within 20m every (0.4-1.0)s.",
        },
        {
          affix:
            "The next skill triggered by the supported skill deals +(6-7)% additional damage for every Instruction received during the trigger interval, up to +(54-63)% additional damage.",
        },
        { affix: "Manually used supported skills -80% additional damage" },
      ],
      2: [
        {
          affix:
            "Triggers the supported skill on the closest enemy within 20m every (1.1-2.0)s.",
        },
        {
          affix:
            "The next skill triggered by the supported skill deals +(4-5)% additional damage for every Instruction received during the trigger interval, up to +(36-45)% additional damage.",
        },
        { affix: "Manually used supported skills -80% additional damage" },
      ],
      3: [
        {
          affix:
            "Triggers the supported skill on the closest enemy within 20m every (1.0-2.0)s.",
        },
        {
          affix:
            "The next skill triggered by the supported skill deals +(4-5)% additional damage for every Instruction received during the trigger interval, up to +(36-45)% additional damage.",
        },
        { affix: "Manually used supported skills -80% additional damage" },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Life",
    tags: [],
    description: [
      "Supports Restoration Skills.\nCannot support Channeled Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "When HP is lower than (20–95)% , always attempts to trigger the supported skill. This effect will be invalid while a Restoration Skill Effect is active.",
      "<Cooldown Recovery Speed or Duration Bonus>",
    ],
    supportTargets: [{ tags: ["Restoration"] }],
    cannotSupportTargets: [{ tags: ["Channeled"] }],
    affixDefs: {
      0: [
        {
          affix:
            "The supported skill +(20-25)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(20-25)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "When HP is lower than (20-95)% , always attempts to trigger the supported skill. This effect will be invalid while a Restoration Skill Effect is active.",
        },
      ],
      1: [
        {
          affix:
            "The supported skill +(12-19)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(12-19)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "When HP is lower than (20-95)% , always attempts to trigger the supported skill. This effect will be invalid while a Restoration Skill Effect is active.",
        },
      ],
      2: [
        {
          affix:
            "The supported skill +(7-11)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(7-11)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "When HP is lower than (20-95)% , always attempts to trigger the supported skill. This effect will be invalid while a Restoration Skill Effect is active.",
        },
      ],
      3: [
        {
          affix:
            "The supported skill (-25--15)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "(-25--15)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "When HP is lower than (20-95)% , always attempts to trigger the supported skill. This effect will be invalid while a Restoration Skill Effect is active.",
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Lock On",
    tags: [],
    description: [
      "Supports Active Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Locks On enemies within 25 m when you use the supported skill",
    ],
    supportTargets: [{ skillType: "active" }],
    cannotSupportTargets: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Minion",
    tags: [],
    description: [
      "Supports Synthetic Troop Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Triggers the supported skill and replenishes the Minions of the supported skill to the maximum upon entering the stage",
      "+(30–36)% additional damage for Minions summoned by the supported skill",
    ],
    supportTargets: [{ tags: ["Synthetic Troop"] }],
    cannotSupportTargets: [],
    affixDefs: {
      0: [
        {
          affix:
            "+(36-42)% additional damage for Minions summoned by the supported skill",
        },
        {
          affix:
            "Triggers the supported skill and replenishes the Minions of the supported skill to the maximum upon entering the stage",
        },
      ],
      1: [
        {
          affix:
            "+(30-36)% additional damage for Minions summoned by the supported skill",
        },
        {
          affix:
            "Triggers the supported skill and replenishes the Minions of the supported skill to the maximum upon entering the stage",
        },
      ],
      2: [
        {
          affix:
            "+(24-30)% additional damage for Minions summoned by the supported skill",
        },
        {
          affix:
            "Triggers the supported skill and replenishes the Minions of the supported skill to the maximum upon entering the stage",
        },
      ],
      3: [
        {
          affix:
            "+(18-24)% additional damage for Minions summoned by the supported skill",
        },
        {
          affix:
            "Triggers the supported skill and replenishes the Minions of the supported skill to the maximum upon entering the stage",
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Motionless",
    tags: [],
    description: [
      "Supports Attack Skills and Spell Skills that deal damage.\nCannot support Passive Skills and Channeled Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Automatically and continuously cast the supported skill at the nearest enemy within 25m while standing still",
      "Auto-used supported skills +10% additional damage",
    ],
    supportTargets: [
      { tags: ["Attack"], requiredKind: "deal_damage" },
      { tags: ["Spell"], requiredKind: "deal_damage" },
    ],
    cannotSupportTargets: [{ skillType: "passive" }, { tags: ["Channeled"] }],
    affixDefs: {
      0: [
        { affix: "Auto-used supported skills +(12-15)% additional damage" },
        {
          affix:
            "Automatically and continuously cast the supported skill at the nearest enemy within 25m while standing still",
        },
      ],
      1: [
        { affix: "Auto-used supported skills +10% additional damage" },
        {
          affix:
            "Automatically and continuously cast the supported skill at the nearest enemy within 25m while standing still",
        },
      ],
      2: [
        { affix: "Auto-used supported skills (-15--4)% additional damage" },
        {
          affix:
            "Automatically and continuously cast the supported skill at the nearest enemy within 25m while standing still",
        },
      ],
      3: [
        { affix: "Auto-used supported skills (-15--4)% additional damage" },
        {
          affix:
            "Automatically and continuously cast the supported skill at the nearest enemy within 25m while standing still",
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Multistrike",
    tags: [],
    description: [
      "Supports Empower, Defensive, Restoration, Curse, Mobility, and Warcry Skills.\nCannot support Channeled Skills and Active Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Triggers the supported skill upon reaching the max Multistrike Count. Interval: 0.1s",
      "<Cooldown Recovery Speed or Duration Bonus>",
    ],
    supportTargets: [
      { tags: ["Empower"] },
      { tags: ["Defensive"] },
      { tags: ["Restoration"] },
      { tags: ["Curse"] },
      { tags: ["Mobility"] },
      { tags: ["Warcry"] },
    ],
    cannotSupportTargets: [{ tags: ["Channeled"] }, { skillType: "active" }],
    affixDefs: {
      0: [
        {
          affix:
            "The supported skill +(20-25)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(20-25)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Triggers the supported skill upon reaching the max Multistrike Count. Interval: 0.1s",
        },
      ],
      1: [
        {
          affix:
            "The supported skill +(12-19)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(12-19)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Triggers the supported skill upon reaching the max Multistrike Count. Interval: 0.1s",
        },
      ],
      2: [
        {
          affix:
            "The supported skill +(7-11)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(7-11)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Triggers the supported skill upon reaching the max Multistrike Count. Interval: 0.1s",
        },
      ],
      3: [
        {
          affix:
            "The supported skill (-25--15)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "(-25--15)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Triggers the supported skill upon reaching the max Multistrike Count. Interval: 0.1s",
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Perpetual Motion",
    tags: [],
    description: [
      "Supports Empower, Defensive, Restoration, Curse, and Warcry Skills.\nCannot support Channeled Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Always attempts to trigger the supported skill. Interval: 0.2s",
      "<Cooldown Recovery Speed or Duration Bonus>",
    ],
    supportTargets: [
      { tags: ["Empower"] },
      { tags: ["Defensive"] },
      { tags: ["Restoration"] },
      { tags: ["Curse"] },
      { tags: ["Warcry"] },
    ],
    cannotSupportTargets: [{ tags: ["Channeled"] }],
    affixDefs: {
      0: [
        {
          affix:
            "The supported skill +(20-25)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(20-25)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Always attempts to trigger the supported skill. Interval: 0.2s",
        },
      ],
      1: [
        {
          affix:
            "The supported skill +(12-19)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(12-19)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Always attempts to trigger the supported skill. Interval: 0.2s",
        },
      ],
      2: [
        {
          affix:
            "The supported skill +(7-11)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(7-11)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Always attempts to trigger the supported skill. Interval: 0.2s",
        },
      ],
      3: [
        {
          affix:
            "The supported skill (-25--15)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "(-25--15)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Always attempts to trigger the supported skill. Interval: 0.2s",
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Preparation",
    tags: [],
    description: [
      "Supports Active Skills.\nCannot support Channeled Skills and Attack Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Prepares the supported skill every (4–5) s",
      "<Cooldown Recovery Speed or Duration Bonus>",
    ],
    supportTargets: [{ skillType: "active" }],
    cannotSupportTargets: [{ tags: ["Channeled"] }, { tags: ["Attack"] }],
    affixDefs: {
      0: [
        {
          affix:
            "The supported skill +(20-25)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(20-25)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
      ],
      1: [
        { affix: "Prepares the supported skill every (4-5) s" },
        {
          affix:
            "The supported skill +(12-19)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(12-19)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
      ],
      2: [
        { affix: "Prepares the supported skill every (6-7) s" },
        {
          affix:
            "The supported skill +(7-11)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(7-11)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
      ],
      3: [
        { affix: "Prepares the supported skill every 8 s" },
        {
          affix:
            "The supported skill (-25--15)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "(-25--15)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Resonance",
    tags: [],
    description: [
      "Supports Empower, Defensive, Restoration, Curse, and Warcry Skills.\nCannot support Channeled Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Triggers the supported skill when Resonance is activated",
      "<Cooldown Recovery Speed or Duration Bonus>",
    ],
    supportTargets: [
      { tags: ["Empower"] },
      { tags: ["Defensive"] },
      { tags: ["Restoration"] },
      { tags: ["Curse"] },
      { tags: ["Warcry"] },
    ],
    cannotSupportTargets: [{ tags: ["Channeled"] }],
    affixDefs: {
      0: [
        {
          affix:
            "The supported skill +(20-25)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(20-25)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        { affix: "Triggers the supported skill when Resonance is activated" },
      ],
      1: [
        {
          affix:
            "The supported skill +(12-19)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(12-19)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        { affix: "Triggers the supported skill when Resonance is activated" },
      ],
      2: [
        {
          affix:
            "The supported skill +(7-11)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(7-11)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        { affix: "Triggers the supported skill when Resonance is activated" },
      ],
      3: [
        {
          affix:
            "The supported skill (-25--15)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "(-25--15)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        { affix: "Triggers the supported skill when Resonance is activated" },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Resonance Activation",
    tags: [],
    description: [
      "Supports Empower, Defensive, Restoration, Curse, and Warcry Skills.\nCannot support Channeled Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Activates Resonance when you use the supported skill",
      "<Cooldown Recovery Speed or Duration Bonus>",
    ],
    supportTargets: [
      { tags: ["Empower"] },
      { tags: ["Defensive"] },
      { tags: ["Restoration"] },
      { tags: ["Curse"] },
      { tags: ["Warcry"] },
    ],
    cannotSupportTargets: [{ tags: ["Channeled"] }],
    affixDefs: {
      0: [
        {
          affix:
            "The supported skill +(20-25)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(20-25)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        { affix: "Activates Resonance when you use the supported skill" },
      ],
      1: [
        {
          affix:
            "The supported skill +(12-19)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(12-19)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        { affix: "Activates Resonance when you use the supported skill" },
      ],
      2: [
        {
          affix:
            "The supported skill +(7-11)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(7-11)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        { affix: "Activates Resonance when you use the supported skill" },
      ],
      3: [
        {
          affix:
            "The supported skill (-25--15)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "(-25--15)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        { affix: "Activates Resonance when you use the supported skill" },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Rhythm",
    tags: [],
    description: [
      "Supports Active Skill that deal damage.\nCannot support Channeled Skills and Attack Mobility Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Triggers the supported skill on the closest enemy within 20m every (0.3–0.5)s.",
      "The next skill triggered by the supported skill +3% additional damage for every 1m of movement made during the trigger interval, up to +(18–21)%.",
      "Manually used supported skills -80% additional damage",
    ],
    supportTargets: [{ skillType: "active", requiredKind: "deal_damage" }],
    cannotSupportTargets: [
      { tags: ["Channeled"] },
      { tags: ["Attack", "Mobility"] },
    ],
    affixDefs: {
      0: [
        {
          affix:
            "The next skill triggered by the supported skill +3% additional damage for every 1m of movement made during the trigger interval, up to +(24-27)%.",
        },
        { affix: "Manually used supported skills -80% additional damage" },
      ],
      1: [
        {
          affix:
            "Triggers the supported skill on the closest enemy within 20m every (0.3-0.5)s.",
        },
        {
          affix:
            "The next skill triggered by the supported skill +3% additional damage for every 1m of movement made during the trigger interval, up to +(18-21)%.",
        },
        { affix: "Manually used supported skills -80% additional damage" },
      ],
      2: [
        {
          affix:
            "Triggers the supported skill on the closest enemy within 20m every (0.6-1.0)s.",
        },
        {
          affix:
            "The next skill triggered by the supported skill +2% additional damage for every 1m of movement made during the trigger interval, up to +(14-16)%.",
        },
        { affix: "Manually used supported skills -80% additional damage" },
      ],
      3: [
        {
          affix:
            "Triggers the supported skill on the closest enemy within 20m every (1.1-1.5)s.",
        },
        {
          affix:
            "The next skill triggered by the supported skill +2% additional damage for every 1m of movement made during the trigger interval, up to +(10-12)%.",
        },
        { affix: "Manually used supported skills -80% additional damage" },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Root",
    tags: [],
    description: [
      "Supports Empower, Defensive, Restoration, Curse, and Warcry Skills.\nCannot support Channeled Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Triggers the supported skill upon stopping moving. Interval: 0.1s",
      "<Cooldown Recovery Speed or Duration Bonus>",
    ],
    supportTargets: [
      { tags: ["Empower"] },
      { tags: ["Defensive"] },
      { tags: ["Restoration"] },
      { tags: ["Curse"] },
      { tags: ["Warcry"] },
    ],
    cannotSupportTargets: [{ tags: ["Channeled"] }],
    affixDefs: {
      0: [
        {
          affix:
            "The supported skill +(20-25)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(20-25)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Triggers the supported skill upon stopping moving. Interval: 0.1s",
        },
      ],
      1: [
        {
          affix:
            "The supported skill +(12-19)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(12-19)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Triggers the supported skill upon stopping moving. Interval: 0.1s",
        },
      ],
      2: [
        {
          affix:
            "The supported skill +(7-11)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(7-11)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Triggers the supported skill upon stopping moving. Interval: 0.1s",
        },
      ],
      3: [
        {
          affix:
            "The supported skill (-25--15)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "(-25--15)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Triggers the supported skill upon stopping moving. Interval: 0.1s",
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Root Attack",
    tags: [],
    description: [
      "Supports Attack Skills that deal damage.\nCannot support Passive Skills and Channeled Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Automatically attempts to use a supported Attack Skill on the closest enemy when stopping moving. Interval: (0.2–0.3) s",
      "The next time when a skill is automatically used, the supported skill +(10–20)% additional damage for every 1m of movement made, up to +(46–65)% . When performing a Multistrike, the bonus will last until the Multistrike ends.",
    ],
    supportTargets: [{ tags: ["Attack"], requiredKind: "deal_damage" }],
    cannotSupportTargets: [{ skillType: "passive" }, { tags: ["Channeled"] }],
    affixDefs: {
      0: [
        {
          affix:
            "Automatically attempts to use a supported Attack Skill on the closest enemy when stopping moving. Interval: (0.1-0.2) s",
        },
        {
          affix:
            "The next time when a skill is automatically used, the supported skill +(12-24)% additional damage for every 1m of movement made, up to +(66-78)% . When performing a Multistrike, the bonus will last until the Multistrike ends.",
        },
      ],
      1: [
        {
          affix:
            "Automatically attempts to use a supported Attack Skill on the closest enemy when stopping moving. Interval: (0.2-0.3) s",
        },
        {
          affix:
            "The next time when a skill is automatically used, the supported skill +(10-20)% additional damage for every 1m of movement made, up to +(46-65)% . When performing a Multistrike, the bonus will last until the Multistrike ends.",
        },
      ],
      2: [
        {
          affix:
            "Automatically attempts to use a supported Attack Skill on the closest enemy when stopping moving. Interval: (0.4-0.5) s",
        },
        {
          affix:
            "The next time when a skill is automatically used, the supported skill +(8-16)% additional damage for every 1m of movement made, up to +(36-55)% . When performing a Multistrike, the bonus will last until the Multistrike ends.",
        },
      ],
      3: [
        {
          affix:
            "Automatically attempts to use a supported Attack Skill on the closest enemy when stopping moving. Interval: (0.6-0.7) s",
        },
        {
          affix:
            "The next time when a skill is automatically used, the supported skill +(6-12)% additional damage for every 1m of movement made, up to +(26-45)% . When performing a Multistrike, the bonus will last until the Multistrike ends.",
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Sentry",
    tags: [],
    description: [
      "Supports Sentry Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Always attempts to trigger the supported skill when there are no Sentries within (10–20) m. Interval: 0.3 s.",
      "+(16–19)% additional damage for the supported skill",
      "+2 Sentries that can be deployed at a time by the supported skill",
    ],
    supportTargets: [{ tags: ["Sentry"] }],
    cannotSupportTargets: [],
    affixDefs: {
      0: [
        { affix: "+(20-25)% additional damage for the supported skill" },
        {
          affix:
            "Always attempts to trigger the supported skill when there are no Sentries within (10-20) m. Interval: 0.3 s.",
        },
      ],
      1: [
        { affix: "+(16-19)% additional damage for the supported skill" },
        {
          affix:
            "+2 Sentries that can be deployed at a time by the supported skill",
        },
        {
          affix:
            "Always attempts to trigger the supported skill when there are no Sentries within (10-20) m. Interval: 0.3 s.",
        },
      ],
      2: [
        { affix: "+(12-15)% additional damage for the supported skill" },
        {
          affix:
            "+1 Sentries that can be deployed at a time by the supported skill",
        },
        {
          affix:
            "Always attempts to trigger the supported skill when there are no Sentries within (10-20) m. Interval: 0.3 s.",
        },
      ],
      3: [
        { affix: "+(9-11)% additional damage for the supported skill" },
        {
          affix:
            "-1 Sentries that can be deployed at a time by the supported skill",
        },
        {
          affix:
            "Always attempts to trigger the supported skill when there are no Sentries within (10-20) m. Interval: 0.3 s.",
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Severe Injury",
    tags: [],
    description: [
      "Supports Empower, Defensive, Restoration, and Curse Skills.\nCannot support Channeled Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Triggers the supported skill when suffering a Severe Injury",
      "<Cooldown Recovery Speed or Duration Bonus>",
    ],
    supportTargets: [
      { tags: ["Empower"] },
      { tags: ["Defensive"] },
      { tags: ["Restoration"] },
      { tags: ["Curse"] },
    ],
    cannotSupportTargets: [{ tags: ["Channeled"] }],
    affixDefs: {
      0: [
        {
          affix:
            "The supported skill +(20-25)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(20-25)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "Triggers the supported skill when suffering a Severe Injury",
        },
      ],
      1: [
        {
          affix:
            "The supported skill +(12-19)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(12-19)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "Triggers the supported skill when suffering a Severe Injury",
        },
      ],
      2: [
        {
          affix:
            "The supported skill +(7-11)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(7-11)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "Triggers the supported skill when suffering a Severe Injury",
        },
      ],
      3: [
        {
          affix:
            "The supported skill (-25--15)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "(-25--15)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "Triggers the supported skill when suffering a Severe Injury",
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Spell Burst",
    tags: [],
    description: [
      "Supports Empower, Defensive, Restoration, and Curse Skills.\nCannot support Channeled Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Triggers the supported skill when activating Spell Burst. Interval: 0.1s",
      "<Cooldown Recovery Speed or Duration Bonus>",
    ],
    supportTargets: [
      { tags: ["Empower"] },
      { tags: ["Defensive"] },
      { tags: ["Restoration"] },
      { tags: ["Curse"] },
    ],
    cannotSupportTargets: [{ tags: ["Channeled"] }],
    affixDefs: {
      0: [
        {
          affix:
            "The supported skill +(20-25)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(20-25)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            'Triggers the supported skill when activating When Spell Burst is fully charged, the next Spell Skill used will activate Spell Burst, which will consume all stacks charged and automatically use the Spell Skill the same number of times.Skills that have a cooldown, Triggered Skills, Sentry Skills, Channeled Skills, and Combo Skills cannot activate Spell Burst.">Spell Burst. Interval: 0.1s',
        },
      ],
      1: [
        {
          affix:
            "The supported skill +(12-19)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(12-19)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            'Triggers the supported skill when activating When Spell Burst is fully charged, the next Spell Skill used will activate Spell Burst, which will consume all stacks charged and automatically use the Spell Skill the same number of times.Skills that have a cooldown, Triggered Skills, Sentry Skills, Channeled Skills, and Combo Skills cannot activate Spell Burst.">Spell Burst. Interval: 0.1s',
        },
      ],
      2: [
        {
          affix:
            "The supported skill +(7-11)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(7-11)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            'Triggers the supported skill when activating When Spell Burst is fully charged, the next Spell Skill used will activate Spell Burst, which will consume all stacks charged and automatically use the Spell Skill the same number of times.Skills that have a cooldown, Triggered Skills, Sentry Skills, Channeled Skills, and Combo Skills cannot activate Spell Burst.">Spell Burst. Interval: 0.1s',
        },
      ],
      3: [
        {
          affix:
            "The supported skill (-25--15)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "(-25--15)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            'Triggers the supported skill when activating When Spell Burst is fully charged, the next Spell Skill used will activate Spell Burst, which will consume all stacks charged and automatically use the Spell Skill the same number of times.Skills that have a cooldown, Triggered Skills, Sentry Skills, Channeled Skills, and Combo Skills cannot activate Spell Burst.">Spell Burst. Interval: 0.1s',
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Start",
    tags: [],
    description: [
      "Supports Empower, Defensive, Restoration, Curse, and Warcry Skills.\nCannot support Channeled Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Triggers the supported skill upon starting to move. Interval: 0.1s",
      "<Cooldown Recovery Speed or Duration Bonus>",
    ],
    supportTargets: [
      { tags: ["Empower"] },
      { tags: ["Defensive"] },
      { tags: ["Restoration"] },
      { tags: ["Curse"] },
      { tags: ["Warcry"] },
    ],
    cannotSupportTargets: [{ tags: ["Channeled"] }],
    affixDefs: {
      0: [
        {
          affix:
            "The supported skill +(20-25)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(20-25)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Triggers the supported skill upon starting to move. Interval: 0.1s",
        },
      ],
      1: [
        {
          affix:
            "The supported skill +(12-19)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(12-19)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Triggers the supported skill upon starting to move. Interval: 0.1s",
        },
      ],
      2: [
        {
          affix:
            "The supported skill +(7-11)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "+(7-11)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Triggers the supported skill upon starting to move. Interval: 0.1s",
        },
      ],
      3: [
        {
          affix:
            "The supported skill (-25--15)% additional Cooldown Recovery Speed",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix: "(-25--15)% additional Duration for the supported skill",
          exclusiveGroup: "cooldown_duration",
        },
        {
          affix:
            "Triggers the supported skill upon starting to move. Interval: 0.1s",
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Still Attack",
    tags: [],
    description: [
      "Supports Attack Skills that deal damage.\nCannot support Passive Skills and Channeled Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Automatically attacks the closest enemy within 25m continuously with the supported Attack Skill while standing still.",
      "The supported skill is supported by Lv. (16–20) Willpower",
    ],
    supportTargets: [{ tags: ["Attack"], requiredKind: "deal_damage" }],
    cannotSupportTargets: [{ skillType: "passive" }, { tags: ["Channeled"] }],
    affixDefs: {
      0: [
        { affix: "The supported skill is supported by Lv. (20-30) Willpower" },
        {
          affix:
            "Automatically attacks the closest enemy within 25m continuously with the supported Attack Skill while standing still.",
        },
      ],
      1: [
        { affix: "The supported skill is supported by Lv. (16-20) Willpower" },
        {
          affix:
            "Automatically attacks the closest enemy within 25m continuously with the supported Attack Skill while standing still.",
        },
      ],
      2: [
        { affix: "The supported skill is supported by Lv. (11-15) Willpower" },
        {
          affix:
            "Automatically attacks the closest enemy within 25m continuously with the supported Attack Skill while standing still.",
        },
      ],
      3: [
        { affix: "The supported skill is supported by Lv. (6-10) Willpower" },
        {
          affix:
            "Automatically attacks the closest enemy within 25m continuously with the supported Attack Skill while standing still.",
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Track",
    tags: [],
    description: [
      "Supports Active Skill that deal damage.\nCannot support Channeled Skills and Attack Mobility Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Triggers the supported skill once on up to 3 Locked-On enemy(ies) within (10–20) m every (0.7–0.8) s",
      "Always Locks On enemies within 20m.",
    ],
    supportTargets: [{ skillType: "active", requiredKind: "deal_damage" }],
    cannotSupportTargets: [
      { tags: ["Channeled"] },
      { tags: ["Attack", "Mobility"] },
    ],
    affixDefs: {
      0: [
        {
          affix:
            "Triggers the supported skill once on up to 3 Locked-On enemy(ies) within (10-20) m every (0.5-0.6) s",
        },
      ],
      1: [
        {
          affix:
            "Triggers the supported skill once on up to 3 Locked-On enemy(ies) within (10-20) m every (0.7-0.8) s",
        },
        { affix: "Always Locks On enemies within 20m." },
      ],
      2: [
        {
          affix:
            "Triggers the supported skill once on up to 2 Locked-On enemy(ies) within (10-20) m every (0.9-1.0) s",
        },
        { affix: "Removes Lock On when the supported skill deals damage" },
      ],
      3: [
        {
          affix:
            "Triggers the supported skill once on up to 2 Locked-On enemy(ies) within (10-20) m every (0.9-1.0) s",
        },
      ],
    },
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Wind Rhythm",
    tags: [],
    description: [
      "Supports Spell Skills that deal damage.\nCannot support Passive Skills and Channeled Skills.\nThis skill can only be installed in the first Support Skill Slot of each Active Skill.",
      "Always attempts to trigger the supported skill on the closest enemy within 25m. Cooldown: 0.6 s",
      "(80–85)% of the bonuses and additional bonuses for Cast Speed is also applied to the Cooldown Recovery Speed of this Support Skill and the supported skill",
      "Manually used supported skills -80% additional damage",
    ],
    supportTargets: [{ tags: ["Spell"], requiredKind: "deal_damage" }],
    cannotSupportTargets: [{ skillType: "passive" }, { tags: ["Channeled"] }],
    affixDefs: {
      0: [
        {
          affix:
            "Always attempts to trigger the supported skill on the closest enemy within 25m. Cooldown: 0.5 s",
        },
        {
          affix:
            "(90-100)% of the bonuses and additional bonuses for Cast Speed is also applied to the Cooldown Recovery Speed of this Support Skill and the supported skill",
        },
        { affix: "Manually used supported skills -80% additional damage" },
      ],
      1: [
        {
          affix:
            "Always attempts to trigger the supported skill on the closest enemy within 25m. Cooldown: 0.6 s",
        },
        {
          affix:
            "(80-85)% of the bonuses and additional bonuses for Cast Speed is also applied to the Cooldown Recovery Speed of this Support Skill and the supported skill",
        },
        { affix: "Manually used supported skills -80% additional damage" },
      ],
      2: [
        {
          affix:
            "Always attempts to trigger the supported skill on the closest enemy within 25m. Cooldown: 0.7 s",
        },
        {
          affix:
            "(60-70)% of the bonuses and additional bonuses for Cast Speed is also applied to the Cooldown Recovery Speed of this Support Skill and the supported skill",
        },
        { affix: "Manually used supported skills -80% additional damage" },
      ],
      3: [
        {
          affix:
            "Always attempts to trigger the supported skill on the closest enemy within 25m. Cooldown: 0.8 s",
        },
        {
          affix:
            "(40-50)% of the bonuses and additional bonuses for Cast Speed is also applied to the Cooldown Recovery Speed of this Support Skill and the supported skill",
        },
        { affix: "Manually used supported skills -80% additional damage" },
      ],
    },
  },
] as const satisfies readonly BaseActivationMediumSkill[];
