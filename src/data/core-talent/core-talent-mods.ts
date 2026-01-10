import type { Affix } from "../../tli/core";
import type { CoreTalentName } from "./types";

export const CoreTalentMods: Record<CoreTalentName, Affix> = {
  Elimination: {
    affixLines: [{ text: "Attacks eliminate enemies under 18% Life on hit" }],
  },
  Momentum: {
    affixLines: [
      {
        text: "+30% additional Attack Damage for the next Main Skill every 0.5 s. Refreshes the interval on defeat.",
      },
    ],
  },
  Tenacity: {
    affixLines: [
      {
        text: "+100% chance to gain 1 stack(s) of Tenacity Blessing when hitting an enemy",
      },
      {
        text: "Max Tenacity Blessing Stacks +1",
        mods: [{ type: "MaxTenacityBlessing", value: 1 }],
      },
    ],
  },
  "Great Strength": {
    affixLines: [
      {
        text: "-10% Attack Speed",
        mods: [{ type: "AspdPct", value: -10, addn: false }],
      },
      {
        text: "+30% additional Attack Damage",
        mods: [{ type: "DmgPct", value: 30, dmgModType: "attack", addn: true }],
      },
      { text: "+30% additional Ailment Damage dealt by attacks" },
    ],
  },
  "Hidden Mastery": {
    affixLines: [
      { text: "Unable to evade" },
      { text: "Gains Attack Aggression when casting an Attack Skill" },
      {
        text: "+15% Attack Speed and +15% additional Attack Damage when having Attack Aggression",
      },
    ],
  },
  Judgment: {
    affixLines: [
      { text: "+100% chance for Attacks to inflict Paralysis on hit" },
      {
        text: "+25% additional Critical Strike Damage against Paralyzed enemies",
      },
    ],
  },
  Static: {
    affixLines: [
      {
        text: "+12% additional damage every 0.25s while standing still, up to +48% additional damage",
      },
      { text: "Removes the effect when no longer standing still" },
    ],
  },
  Formless: {
    affixLines: [
      { text: "Doubles Max Warcry Skill Effects" },
      { text: "+66% Warcry Skill Area" },
    ],
  },
  Resolve: {
    affixLines: [
      { text: "+4% additional Armor per stack of Tenacity Blessing owned" },
    ],
  },
  "Ember Armor": {
    affixLines: [{ text: "+25% Armor Effective Rate for Non-Physical Damage" }],
  },
  Sweep: {
    affixLines: [
      {
        text: "+25% additional Attack Damage when holding a Two-Handed Weapon",
      },
      { text: "+25% Attack Skill Area when holding a Two-Handed Weapon" },
    ],
  },
  "Focused Strike": {
    affixLines: [
      {
        text: "Area Skills deal up to +32% additional damage to enemies at the center",
      },
      {
        text: "Minions' Area Skills deal up to 32% additional damage to enemies at the center",
      },
    ],
  },
  Sacrifice: {
    affixLines: [
      {
        text: "Changes the base effect of Tenacity Blessing to: +8% additional damage",
      },
    ],
  },
  "Well Matched": {
    affixLines: [
      {
        text: "Deals up to +25% additional Attack Damage to enemies in proximity, and this damage reduces as the distance from the enemy grows",
        mods: [
          {
            type: "DmgPct",
            value: 25,
            dmgModType: "attack",
            addn: true,
            cond: "target_enemy_is_in_proximity",
          },
        ],
      },
      {
        text: "-15% additional damage taken from enemies in proximity, and this damage reduces as the distance from the enemy grows",
      },
    ],
  },
  Starfire: {
    affixLines: [{ text: "+1 Ignite limit" }, { text: "+30% Ignite Duration" }],
  },
  Fueling: {
    affixLines: [
      { text: "The Fire Resistance of enemies within 10m is fixed at 0" },
    ],
  },
  Rock: {
    affixLines: [
      {
        text: "Converts 3% of Physical Damage taken to Fire Damage for every stack of Tenacity Blessing you have",
      },
    ],
  },
  "True Flame": {
    affixLines: [
      {
        text: "When an enemy is Ignited, 60% of the additional bonus to Damage Over Time taken from Affliction is also applied to your Fire Hit Damage",
      },
    ],
  },
  Arcane: {
    affixLines: [
      { text: "Converts 100% of Mana Cost to Life Cost" },
      {
        text: "+25% additional Max Life",
        mods: [{ type: "MaxLifePct", value: 25, addn: true }],
      },
    ],
  },
  "No Lose Ends": {
    affixLines: [
      { text: "+50% additional Attack Damage at Low Life" },
      { text: "Your Max Energy Shield is fixed at 0" },
    ],
  },
  "Life Path": {
    affixLines: [
      { text: "Double Life Regain" },
      { text: "Life Regain is only effective when Life is lower than 50%" },
    ],
  },
  "Survival Will": {
    affixLines: [
      { text: "+30% additional Attack Damage when not at Low Life" },
      { text: "Restores 40% Max Life at Low Life. Interval: 10 s" },
    ],
  },
  Perception: {
    affixLines: [
      { text: "+100% chance to gain 1 stacks of Agility Blessing on hit" },
      {
        text: "Max Agility Blessing Stacks +1",
        mods: [{ type: "MaxAgilityBlessing", value: 1 }],
      },
    ],
  },
  "Third time's a charm": {
    affixLines: [
      {
        text: "+45% Attack and Cast Speed after using the Main Skill 3 consecutive times. Lasts for 2 s",
      },
    ],
  },
  Impermanence: {
    affixLines: [
      {
        text: "-90% additional Min Physical Damage, and +80% additional Max Physical Damage",
        mods: [
          { type: "AddnMinDmgPct", value: -90, addn: true },
          { type: "AddnMaxDmgPct", value: 80, addn: true },
        ],
      },
      {
        text: "-40% additional min damage",
        mods: [{ type: "AddnMinDmgPct", value: -40, addn: true }],
      },
      {
        text: "+40% additional max damage",
        mods: [{ type: "AddnMaxDmgPct", value: 40, addn: true }],
      },
    ],
  },
  Rushed: {
    affixLines: [
      {
        text: "+30% additional damage if you have recently moved more than 5 m",
        mods: [
          {
            type: "DmgPct",
            value: 30,
            dmgModType: "global",
            addn: true,
            cond: "has_moved_recently",
          },
        ],
      },
    ],
  },
  "Three Birds with One Stone": {
    affixLines: [
      { text: "Projectile Quantity +2" },
      { text: "Parabolic Projectile Splits quantity +2" },
      { text: "+10% additional Projectile Damage" },
    ],
  },
  "Steady Accumulation": {
    affixLines: [
      { text: "+15% Combo Finisher Amplification" },
      { text: "+1 Combo Points gained from Combo Starters" },
    ],
  },
  Gale: {
    affixLines: [
      {
        text: "60% of the Projectile Speed bonus is also applied to the additional bonus for Projectile Damage",
      },
    ],
  },
  Euphoria: {
    affixLines: [
      { text: "+4% additional Evasion for every stack of Agility Blessing" },
    ],
  },
  "Close Range Fire": {
    affixLines: [
      {
        text: "Projectiles deal up to +35% additional damage to enemies in Proximity, and this damage reduces with the distance traveled by the Projectiles",
      },
    ],
  },
  "Master Escapist": {
    affixLines: [
      { text: "+1 Max Deflection stacks" },
      { text: "Gains 1 stacks of Deflection on Evasion" },
    ],
  },
  "Waiting Attack": {
    affixLines: [
      {
        text: "Consumes all Agility Blessing every 8s. For each stack consumed, +5% additional damage in the next 8s",
      },
    ],
  },
  "Joined Force": {
    affixLines: [
      {
        text: "Off-Hand Weapons do not participate in Attacks while Dual Wielding",
        mods: [{ type: "JoinedForceDisableOffhand" }],
      },
      {
        text: "Adds 60% of the damage of the Off-Hand Weapon to the final damage of the Main-Hand Weapon",
        mods: [{ type: "JoinedForceAddOffhandToMainhandPct", value: 60 }],
      },
    ],
  },
  "Quick Advancement": {
    affixLines: [
      {
        text: "Multistrikes deal 55% increasing damage",
        mods: [{ type: "MultistrikeIncDmgPct", value: 55 }],
      },
      { text: "Minions' Multistrikes deal 55% increasing damage" },
    ],
  },
  "Preemptive Strike": {
    affixLines: [
      { text: "+1 initial Multistrike Count" },
      { text: "-20% Attack Speed when performing Multistrikes" },
    ],
  },
  Cultivation: {
    affixLines: [
      {
        text: "+4% Cast Speed for each skill recently used, stacking up to 15 times",
      },
    ],
  },
  Acquaintance: {
    affixLines: [
      {
        text: "+30% chance to trigger the Main Spell Skill 1 additional time when using it",
      },
    ],
  },
  Rebirth: {
    affixLines: [
      {
        text: "Converts 50% of Life Regain and Energy Shield Regain to Restoration Over Time",
      },
      { text: "-50% additional Regain Interval" },
    ],
  },
  "Poisoned Relief": {
    affixLines: [
      { text: "+25% injury buffer" },
      { text: "-15% additional damage taken at Low Life" },
    ],
  },
  Conductive: {
    affixLines: [
      {
        text: "Changes the base effect of Numbed to: +11% additional Lightning Damage taken",
        mods: [{ type: "Conductive", value: 11 }],
      },
    ],
  },
  Transition: {
    affixLines: [
      {
        text: "50% chance for this skill to deal +16% additional damage when casting a skill",
      },
      {
        text: "25% chance for this skill to deal +32% additional damage when casting a skill",
      },
      {
        text: "10% chance for this skill to deal +80% additional damage when casting a skill",
      },
    ],
  },
  "Queer Angle": {
    affixLines: [
      {
        text: "You and Minions deal Lucky Damage against Numbed enemies",
        mods: [{ type: "LuckyDmg", cond: "enemy_numbed" }],
      },
    ],
  },
  Thunderclap: {
    affixLines: [
      {
        text: "If you have Agility Blessing stacks when casting the Main Skill, consumes 1 stack(s) of Agility Blessing to make this skill deal +30% additional Lightning Damage",
      },
    ],
  },
  Beacon: {
    affixLines: [
      {
        text: "+2 Max Spell Burst",
        mods: [{ type: "MaxSpellBurst", value: 2 }],
      },
    ],
  },
  Chilly: {
    affixLines: [
      { text: "+100% chance to gain 1 stack of Focus Blessing on hit" },
      {
        text: "Max Focus Blessing Stacks +1",
        mods: [{ type: "MaxFocusBlessing", value: 1 }],
      },
    ],
  },
  "Peculiar Vibe": {
    affixLines: [
      { text: "+50% chance to inflict Elemental Ailments" },
      {
        text: "+25% additional damage against enemies with Elemental Ailments",
        mods: [
          {
            type: "DmgPct",
            value: 25,
            dmgModType: "global",
            addn: true,
            cond: "enemy_has_ailment",
          },
        ],
      },
    ],
  },
  Insight: {
    affixLines: [
      {
        text: "+30% additional Spell Damage",
        mods: [{ type: "DmgPct", value: 30, dmgModType: "spell", addn: true }],
      },
      {
        text: "+25% additional Skill Cost",
        mods: [{ type: "SkillCostPct", value: 25, addn: true }],
      },
    ],
  },
  "Burning Touch": {
    affixLines: [
      { text: "Has Spell Aggression" },
      {
        text: "+10% Spell Aggression Effect for every Main Spell Skill cast recently. Stacks up to 10 times",
      },
    ],
  },
  Winter: {
    affixLines: [
      {
        text: "Deals +1% additional damage to an enemy for every 2 points of Frostbite Rating the enemy has",
        mods: [
          {
            type: "DmgPct",
            value: 1,
            dmgModType: "global",
            addn: true,
            per: { stackable: "frostbite_rating", amt: 2 },
          },
        ],
      },
    ],
  },
  Bunch: {
    affixLines: [
      {
        text: "Max Focus Blessing Stacks +1",
        mods: [{ type: "MaxFocusBlessing", value: 1 }],
      },
      {
        text: "+3% additional Spell Damage per stack of Focus Blessing owned",
        mods: [
          {
            type: "DmgPct",
            value: 3,
            dmgModType: "spell",
            addn: true,
            per: { stackable: "focus_blessing" },
          },
        ],
      },
    ],
  },
  "Play Safe": {
    affixLines: [
      {
        text: "100% of the bonuses and additional bonuses to Cast Speed is also applied to Spell Burst Charge Speed",
        mods: [{ type: "PlaySafe", value: 100 }],
      },
    ],
  },
  Shell: {
    affixLines: [
      {
        text: "+35% additional Max Energy Shield",
        mods: [{ type: "MaxEnergyShieldPct", value: 35, addn: true }],
      },
      { text: "Your Max Life is set to 100" },
    ],
  },
  "Barrier of Radiance": {
    affixLines: [
      {
        text: "Energy Shield Charge started recently cannot be interrupted by damage",
      },
      {
        text: "+50% Energy Shield Charge Speed",
        mods: [{ type: "EnergyShieldChargeSpeedPct", value: 50 }],
      },
    ],
  },
  Mana: {
    affixLines: [
      { text: "20% of damage is taken from Mana before life" },
      {
        text: "+12% additional Max Mana",
        mods: [{ type: "MaxManaPct", value: 12, addn: true }],
      },
    ],
  },
  "Mind Focus": {
    affixLines: [
      {
        text: "Changes the base effect of Focus Blessing to: Adds Physical Damage equal to 1% of Max Mana to Attacks and Spells",
      },
    ],
  },
  "Full Load": {
    affixLines: [
      {
        text: "+40% additional damage for the next skill when Mana reaches the max",
        mods: [
          {
            type: "DmgPct",
            value: 40,
            dmgModType: "global",
            addn: true,
            cond: "has_full_mana",
          },
        ],
      },
    ],
  },
  Preparation: {
    affixLines: [
      { text: "Adds 1 Max Energy Shield for every 50 Mana consumed recently" },
    ],
  },
  Translucent: {
    affixLines: [
      {
        text: "+25% additional Lightning Damage if you have dealt Fire Damage recently",
      },
      {
        text: "+25% additional Cold Damage if you have dealt Lightning Damage recently",
      },
      {
        text: "+25% additional Fire Damage if you have dealt Cold Damage recently",
      },
    ],
  },
  Penetrating: {
    affixLines: [
      {
        text: "When inflicting Ignite, Numbed, Frostbite/Freeze, inflicts Fire Infiltration, Lightning Infiltration, or Cold Infiltration respectively.",
      },
      {
        text: "Upon inflicting damage, +8% additional Elemental Damage for each type of Infiltration Effect the enemy has",
      },
    ],
  },
  Focus: {
    affixLines: [
      {
        text: "Max Channeled Stacks +1",
        mods: [{ type: "MaxChannel", value: 1 }],
      },
      {
        text: "+6% additional damage for every +1 additional Max Channeled Stack(s)",
        mods: [
          {
            type: "DmgPct",
            value: 6,
            dmgModType: "global",
            addn: true,
            per: { stackable: "additional_max_channel_stack", amt: 1 },
          },
        ],
      },
    ],
  },
  "Quick Ritual": {
    affixLines: [
      { text: "Min Channeled Stacks +1" },
      { text: "+20% additional damage Channeled Skills" },
    ],
  },
  Frostbitten: {
    affixLines: [
      { text: "+25% additional damage against Frozen enemies" },
      {
        text: "Inflicts Frostbite and 100 Frostbite Rating when dealing Cold Damage to an enemy for the first time",
      },
    ],
  },
  "Extreme Coldness": {
    affixLines: [
      {
        text: "Frostbite and Frostbite Rating will continue to be inflicted on Frozen enemies",
      },
      {
        text: "After Freeze ends, Frostbite and all Frostbite Rating will no longer be removed. +20% of the retained Frostbite Rating",
      },
      { text: "+25% additional Freeze Duration when an Elite is nearby" },
    ],
  },
  "Mind Blade": {
    affixLines: [
      {
        text: "Adds 30% Physical Damage as Cold Damage when not wielding a Wand or Tin Staff",
      },
      { text: "+25% additional Cold Damage when wielding a Wand or Tin Staff" },
    ],
  },
  "Frozen Lotus": {
    affixLines: [
      {
        text: "+25% additional Cold Damage",
        mods: [{ type: "DmgPct", value: 25, dmgModType: "cold", addn: true }],
      },
      {
        text: "+25% additional Minion Cold Damage",
        mods: [
          {
            type: "MinionDmgPct",
            value: 25,
            addn: true,
            minionDmgModType: "cold",
          },
        ],
      },
      { text: "Skills no longer cost Mana" },
    ],
  },
  Cohesion: {
    affixLines: [
      {
        text: "+50% additional Critical Strike Rating for the next Main Skill used every 1 s",
      },
    ],
  },
  Blunt: {
    affixLines: [
      {
        text: "+30% additional Physical Damage",
        mods: [
          { type: "DmgPct", value: 30, dmgModType: "physical", addn: true },
        ],
      },
      { text: "Enemies +20% Injury Buffer" },
    ],
  },
  Determined: {
    affixLines: [
      {
        text: "Upon taking fatal damage, you have a 50% chance to keep at least 1 Life",
      },
    ],
  },
  Ambition: {
    affixLines: [
      { text: "+100% chance to gain 10 Fervor rating on hit" },
      { text: "Gains Fervor when there are enemies Nearby" },
    ],
  },
  Gravity: {
    affixLines: [
      {
        text: "+25% additional Melee Damage",
        mods: [{ type: "DmgPct", value: 25, dmgModType: "melee", addn: true }],
      },
      { text: "Melee Skill has reversed knockback direction" },
    ],
  },
  "Shooting Arrows": {
    affixLines: [
      { text: "+25% additional Projectile Damage" },
      { text: "+50% Knockback distance" },
    ],
  },
  Brutality: {
    affixLines: [
      {
        text: "+33% additional Physical Damage",
        mods: [
          { type: "DmgPct", value: 33, dmgModType: "physical", addn: true },
        ],
      },
      {
        text: "+30% additional Minion Physical Damage",
        mods: [
          {
            type: "MinionDmgPct",
            value: 30,
            addn: true,
            minionDmgModType: "physical",
          },
        ],
      },
      { text: "-1% additional Elemental Damage for every 3 level(s)." },
    ],
  },
  "Hair-trigger": {
    affixLines: [
      {
        text: "+2% additional damage of a skill for every 7 points of Fervor Rating when the skill is triggered",
      },
    ],
  },
  "Instant Smash": {
    affixLines: [
      { text: "+80% additional Trauma Damage dealt by Critical Strikes" },
    ],
  },
  "Open Wounds": {
    affixLines: [
      { text: "+50% Trauma Duration when inflicting Trauma on Trauma enemies" },
      { text: "+125% Critical Strike Damage against Traumatized enemies" },
      {
        text: "Minions +125% Critical Strike Damage against Traumatized enemies",
      },
    ],
  },
  "Falling Leaves": {
    affixLines: [
      { text: "-20% additional damage for Weapons" },
      {
        text: "+40% additional Attack Damage",
        mods: [{ type: "DmgPct", value: 40, dmgModType: "attack", addn: true }],
      },
    ],
  },
  Tradeoff: {
    affixLines: [
      {
        text: "+20% additional Attack Speed when Dexterity is no less than Strength",
        mods: [{ type: "TradeoffDexGteStrAspdPct", value: 20 }],
      },
      {
        text: "+25% additional Attack Damage when Strength is no less than Dexterity",
        mods: [{ type: "TradeoffStrGteDexDmgPct", value: 25 }],
      },
    ],
  },
  Centralize: {
    affixLines: [
      {
        text: "Gains additional Fervor Rating equal to 25% of the current Fervor Rating on hit. Cooldown: 0.3 s",
      },
      {
        text: "Consumes half of current Fervor Rating when hit. -0.8% additional damage per 1 point consumed",
      },
    ],
  },
  "Endless Fervor": {
    affixLines: [
      { text: "Have Fervor", mods: [{ type: "HaveFervor" }] },
      {
        text: "+12% Fervor effect",
        mods: [{ type: "FervorEffPct", value: 12 }],
      },
    ],
  },
  Fluke: { affixLines: [{ text: "Lucky Critical Strike" }] },
  "Keep It Up": {
    affixLines: [
      {
        text: "When triggering a Critical Strike, gains the following buff for the next 4s: +7% additional damage and -25% Critical Strike Rating on Critical Strike. Interval: 0.5s",
      },
    ],
  },
  Impending: {
    affixLines: [
      {
        text: "Every 0.25 s, +6% additional damage taken for enemies within 10 m. Stacks up to 5 times",
      },
    ],
  },
  "Rapid Shots": {
    affixLines: [
      {
        text: "Projectile Damage increases with the distance traveled, dealing up to +35% additional damage to Distant enemies",
      },
    ],
  },
  "Automatic Upgrade": {
    affixLines: [
      {
        text: "Gains a stack of Fortitude when using a Melee Skill",
        mods: [{ type: "GeneratesFortitude" }],
      },
      { text: "+4% additional damage per 1 stack(s) of Fortitude" },
    ],
  },
  Defensiveness: {
    affixLines: [
      {
        text: "+25% Block Ratio",
        mods: [{ type: "BlockRatioPct", value: 25 }],
      },
    ],
  },
  "Full Defense": {
    affixLines: [
      { text: "+25% additional Defense gained from Shield" },
      {
        text: "-1% additional Damage Over Time taken for every 1% Block Ratio",
      },
    ],
  },
  "Last Stand": {
    affixLines: [
      { text: "Block Ratio is set to 0%" },
      {
        text: "For every +3% Attack or Spell Block Chance, +2% additional damage, up to +90%",
      },
    ],
  },
  Plague: {
    affixLines: [
      { text: "+20% Movement Speed when defeating Wilted enemies recently" },
      { text: "+15% additional Wilt Damage" },
    ],
  },
  Mixture: { affixLines: [{ text: "+50% Deterioration Chance" }] },
  Affliction: {
    affixLines: [
      {
        text: "+30 Affliction inflicted per second",
        mods: [{ type: "AfflictionInflictedPerSec", value: 30 }],
      },
      {
        text: "+30% additional Affliction effect",
        mods: [{ type: "AfflictionEffectPct", value: 30, addn: true }],
      },
    ],
  },
  "Subtle Impact": {
    affixLines: [
      {
        text: "Blur gains an additional effect: +25% additional Damage Over Time",
        mods: [
          {
            type: "DmgPct",
            value: 25,
            dmgModType: "damage_over_time",
            addn: true,
            cond: "has_blur",
          },
        ],
      },
    ],
  },
  "Forbidden Power": {
    affixLines: [
      {
        text: "+35% additional Erosion Damage",
        mods: [
          { type: "DmgPct", value: 35, dmgModType: "erosion", addn: true },
        ],
      },
      {
        text: "-10% Elemental Resistance",
        mods: [{ type: "ResistancePct", value: -10, resType: "elemental" }],
      },
    ],
  },
  "Deceiver's Might": {
    affixLines: [
      {
        text: "+1 to Max Tenacity Blessing Stacks if you have taken damage in the last 8s",
      },
      {
        text: "+1 to Max Agility Blessing Stacks if you have used a Mobility Skill in the last 8s",
      },
      {
        text: "+1 to Max Focus Blessing Stacks if you have landed a Critical Strike or Reaped in the last 8s",
      },
    ],
  },
  Dirt: {
    affixLines: [
      {
        text: "+15% additional Erosion Damage",
        mods: [
          { type: "DmgPct", value: 15, dmgModType: "erosion", addn: true },
        ],
      },
      {
        text: "15% additional damage applied to Life",
        mods: [{ type: "DmgPct", value: 15, dmgModType: "global", addn: true }],
      },
    ],
  },
  "Stealth Stab": {
    affixLines: [
      { text: "-25% additional damage taken while Blur is active" },
      {
        text: "+25% additional damage for 3 s after Blur ends",
        mods: [
          {
            type: "DmgPct",
            value: 25,
            dmgModType: "global",
            addn: true,
            cond: "blur_ended_recently",
          },
        ],
      },
    ],
  },
  "Beyond Cure": {
    affixLines: [
      {
        text: "Upon inflicting damage, +6% additional Erosion Damage for every stack of Wilt or Deterioration the enemy has, up to an additional +30%",
      },
    ],
  },
  "Twisted Belief": {
    affixLines: [
      {
        text: "+3 Erosion Skill Level",
        mods: [{ type: "SkillLevel", value: 3, skillLevelType: "erosion" }],
      },
      {
        text: "-5% Max Erosion Resistance",
        mods: [{ type: "MaxResistancePct", value: -5, resType: "erosion" }],
      },
    ],
  },
  Windwalk: {
    affixLines: [
      {
        text: "+80% additional Reaping Duration against enemies with Max Affliction. Lasts for 4 s. Only takes effect once on each enemy",
      },
    ],
  },
  Holiness: {
    affixLines: [
      { text: "-95% Cursed Effect" },
      {
        text: "-25% additional damage taken from Cursed enemies",
        mods: [{ type: "DmgTakenPct", value: -25, cond: "enemy_is_cursed" }],
      },
    ],
  },
  "More With Less": {
    affixLines: [
      {
        text: "+30% additional Damage Over Time",
        mods: [
          {
            type: "DmgPct",
            value: 30,
            dmgModType: "damage_over_time",
            addn: true,
          },
        ],
      },
      { text: "-10% additional Damage Over Time Duration" },
    ],
  },
  "Reap Purification": {
    affixLines: [
      {
        text: "Additionally settles 25% of the remaining total damage when Reaping, then removes all Damage Over Time acting on the target",
        mods: [{ type: "ReapPurificationPct", value: 25 }],
      },
    ],
  },
  "Verbal Abuse": {
    affixLines: [
      { text: "You can cast 1 additional Curses" },
      {
        text: "+10% curse effect",
        mods: [{ type: "CurseEffPct", value: 10, addn: false }],
      },
    ],
  },
  Vile: {
    affixLines: [
      { text: "Duration of Ailments caused by Critical Strikes is doubled" },
      {
        text: "For every +3% Critical Strike Damage, +1% additional Ailment Damage",
      },
    ],
  },
  "Dirty Tricks": {
    affixLines: [
      { text: "Guaranteed to inflict all types of Ailment on hit" },
      {
        text: "Upon inflicting damage, +6% additional damage for every type of Ailment the enemy has (multiplies)",
      },
      {
        text: "When Minions deal damage, +6% additional damage for every type of Ailment the enemy has (multiplies)",
      },
    ],
  },
  Daze: {
    affixLines: [
      {
        text: "Blur gains an additional effect: +40% crowd control effect and +25% additional Ailment Damage",
      },
    ],
  },
  Indifference: {
    affixLines: [
      {
        text: "+1% additional damage and +1% additional Minion Damage for every 5 remaining Energy, up to +50% additional damage",
      },
    ],
  },
  Ward: {
    affixLines: [
      { text: "Adds 13% of Sealed Mana as Energy Shield" },
      { text: "Adds 13% of Sealed Life as Energy Shield" },
    ],
  },
  "Off The Beaten Track": {
    affixLines: [
      {
        text: "+4 Support Skill Level",
        mods: [{ type: "SkillLevel", value: 4, skillLevelType: "support" }],
      },
      { text: "Support Skill's Mana Multiplier is fixed at 95%." },
    ],
  },
  "Stab In The Back": {
    affixLines: [
      {
        text: "While Blur is active, loses Blur after casting a Main Skill, and the skill deals +35% additional damage",
      },
    ],
  },
  Orders: {
    affixLines: [
      {
        text: "+25% additional Minion Damage",
        mods: [{ type: "MinionDmgPct", value: 25, addn: true }],
      },
      { text: "+50% additional Summon Skill Cast Speed" },
    ],
  },
  Sentry: {
    affixLines: [
      { text: "Max Sentry Quantity +1" },
      { text: "+100% additional Cast Speed for Sentry Skills" },
    ],
  },
  "Shrink Back": {
    affixLines: [
      { text: "Gains Barrier every 1s" },
      { text: "+50% Barrier Shield" },
    ],
  },
  "Mighty Guard": {
    affixLines: [
      { text: "+2 Minion Skill Level" },
      { text: "+ 4 Command per second" },
      { text: "+40 initial Growth for Spirit Magi" },
    ],
  },
  "Overly Modified": {
    affixLines: [
      {
        text: "+30% additional Sentry Damage, -50% non-Sentry Active Skill damage",
      },
    ],
  },
  "Isomorphic Arms": {
    affixLines: [
      { text: "Minions gain the Main-Hand Weapon's bonuses." },
      {
        text: "+30% additional Spell Damage for Minions when wielding a Wand or Tin Staff",
      },
    ],
  },
  Boss: {
    affixLines: [
      { text: "+1 to Max Summonable Synthetic Troops" },
      {
        text: "+15% additional Minion Damage",
        mods: [{ type: "MinionDmgPct", value: 15, addn: true }],
      },
    ],
  },
  Rally: {
    affixLines: [
      { text: "Synthetic Troop Minions summoned at a time +1" },
      {
        text: "+25% additional Minion Damage",
        mods: [{ type: "MinionDmgPct", value: 25, addn: true }],
      },
    ],
  },
  "Burning Aggression": {
    affixLines: [
      {
        text: "Gains 30 point(s) of Command every 2 s when there is an Elite within 10 m",
      },
    ],
  },
  "United Stand": {
    affixLines: [
      {
        text: "-5% additional damage taken for every nearby Synthetic Troop Minion within 10m",
      },
      { text: "-10% Minion aggressiveness" },
    ],
  },
  Reflection: {
    affixLines: [
      {
        text: "+6% additional damage for each type of Aura you are affected by",
      },
      {
        text: "Minions +6% additional damage for each type of Aura they are affected by",
      },
    ],
  },
  Resistance: {
    affixLines: [
      {
        text: "+1% chance to avoidElemental Ailments for every 1% effective Erosion Resistance",
      },
    ],
  },
  Knowledgeable: {
    affixLines: [
      { text: "+100% additional Focus Skill Damage" },
      { text: "+50% Sealed Mana Compensation for Focus Skills" },
      { text: "Focus Skills can be equipped to Active Skill slots" },
    ],
  },
  Panacea: {
    affixLines: [
      { text: "Restoration Skills: +100% restoration effect" },
      { text: "Restoration Effect from Restoration Skills cannot be removed" },
    ],
  },
  Source: {
    affixLines: [
      { text: "+50% Sealed Mana Compensation for Spirit Magus Skills" },
      {
        text: "+30% additional Origin of Spirit Magus Effect",
        mods: [{ type: "SpiritMagusOriginEffPct", value: 30, addn: true }],
      },
      { text: "Spirit Magi +30% additional Empower Skill Effect" },
    ],
  },
  Empower: {
    affixLines: [
      { text: "The number of Max Spirit Magi In Map is 1" },
      { text: "+100% additional Spirit Magus Skill Damage" },
    ],
  },
  "Battle Trumpet": {
    affixLines: [
      {
        text: "-10% additional Minion Attack and Cast Speed",
        mods: [
          { type: "MinionAspdPct", value: -10, addn: true },
          { type: "MinionCspdPct", value: -10, addn: true },
        ],
      },
      { text: "Spirit Magi +50% chance to use an Enhanced Skill" },
    ],
  },
  "Talons of Abyss": {
    affixLines: [
      {
        text: "For every 20 Growth a Spirit Magus has, it deals +1% additional damage",
      },
      {
        text: "For every 40 Growth a Spirit Magus has, it +1% additional Ultimate Attack and Cast Speed",
      },
    ],
  },
  "Heat Up": {
    affixLines: [
      {
        text: "+30% additional Sentry Damage if Sentry Skill has been cast recently",
      },
      { text: "-30% additional Sentry Start Time" },
    ],
  },
  "Co-resonance": {
    affixLines: [
      { text: "+25% additional Sentry Damage" },
      {
        text: "Attack Speed bonus and 100% of additional bonus are also applied to Attack Sentries' Cast Frequency",
      },
      {
        text: "Cast Speed bonus and 100% of additional bonus are also applied to Spell Sentries' Cast Frequency",
      },
    ],
  },
  "Kinetic Conversion": {
    affixLines: [
      {
        text: "100% chance to gain a Barrier for every 5 m you move",
        mods: [{ type: "GeneratesBarrier" }],
      },
      { text: "Refreshes Barrier when gaining Barrier" },
      { text: "-40% additional Barrier Shield" },
    ],
  },
  "Shared Fate": {
    affixLines: [
      {
        text: "Triggers the Sentry Main Skill when there are no Sentries within 10 m. Interval: 1 s",
      },
      {
        text: "The number of Sentries that can be deployed at a time is equal to the Max Sentry Quantity",
      },
      { text: "+25% additional Sentry Damage" },
    ],
  },
};
