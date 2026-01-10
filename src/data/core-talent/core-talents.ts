import type { BaseCoreTalent } from "./types";

export const CoreTalents = [
  {
    name: "Elimination",
    tree: "God of Might",
    affix: "Attacks eliminate enemies under 18% Life on hit",
  },
  {
    name: "Momentum",
    tree: "God of Might",
    affix:
      "+30% additional Attack Damage for the next Main Skill every 0.5 s. Refreshes the interval on defeat.",
  },
  {
    name: "Tenacity",
    tree: "God of Might",
    affix:
      "+100% chance to gain 1 stack(s) of Tenacity Blessing when hitting an enemy\nMax Tenacity Blessing Stacks +1",
  },
  {
    name: "Great Strength",
    tree: "God of Might",
    affix:
      "-10% Attack Speed\n+30% additional Attack Damage\n+30% additional Ailment Damage dealt by attacks",
  },
  {
    name: "Hidden Mastery",
    tree: "God of Might",
    affix:
      "Unable to evade\nGains Attack Aggression when casting an Attack Skill\n+15% Attack Speed and +15% additional Attack Damage when having Attack Aggression",
  },
  {
    name: "Judgment",
    tree: "God of Might",
    affix:
      "+100% chance for Attacks to inflict Paralysis on hit\n+25% additional Critical Strike Damage against Paralyzed enemies",
  },
  {
    name: "Static",
    tree: "The Brave",
    affix:
      "+12% additional damage every 0.25s while standing still, up to +48% additional damage\nRemoves the effect when no longer standing still",
  },
  {
    name: "Formless",
    tree: "The Brave",
    affix: "Doubles Max Warcry Skill Effects\n+66% Warcry Skill Area",
  },
  {
    name: "Resolve",
    tree: "The Brave",
    affix: "+4% additional Armor per stack of Tenacity Blessing owned",
  },
  {
    name: "Ember Armor",
    tree: "The Brave",
    affix: "+25% Armor Effective Rate for Non-Physical Damage",
  },
  {
    name: "Sweep",
    tree: "Onslaughter",
    affix:
      "+25% additional Attack Damage when holding a Two-Handed Weapon\n+25% Attack Skill Area when holding a Two-Handed Weapon",
  },
  {
    name: "Focused Strike",
    tree: "Onslaughter",
    affix:
      "Area Skills deal up to +32% additional damage to enemies at the center\nMinions' Area Skills deal up to 32% additional damage to enemies at the center",
  },
  {
    name: "Sacrifice",
    tree: "Onslaughter",
    affix:
      "Changes the base effect of Tenacity Blessing to: +8% additional damage",
  },
  {
    name: "Well Matched",
    tree: "Onslaughter",
    affix:
      "Deals up to +25% additional Attack Damage to enemies in proximity, and this damage reduces as the distance from the enemy grows\n-15% additional damage taken from enemies in proximity, and this damage reduces as the distance from the enemy grows",
  },
  {
    name: "Starfire",
    tree: "Warlord",
    affix: "+1 Ignite limit\n+30% Ignite Duration",
  },
  {
    name: "Fueling",
    tree: "Warlord",
    affix: "The Fire Resistance of enemies within 10m is fixed at 0",
  },
  {
    name: "Rock",
    tree: "Warlord",
    affix:
      "Converts 3% of Physical Damage taken to Fire Damage for every stack of Tenacity Blessing you have",
  },
  {
    name: "True Flame",
    tree: "Warlord",
    affix:
      "When an enemy is Ignited, 60% of the additional bonus to Damage Over Time taken from Affliction is also applied to your Fire Hit Damage",
  },
  {
    name: "Arcane",
    tree: "Warrior",
    affix: "Converts 100% of Mana Cost to Life Cost\n+25% additional Max Life",
  },
  {
    name: "No Lose Ends",
    tree: "Warrior",
    affix:
      "+50% additional Attack Damage at Low Life\nYour Max Energy Shield is fixed at 0",
  },
  {
    name: "Life Path",
    tree: "Warrior",
    affix:
      "Double Life Regain\nLife Regain is only effective when Life is lower than 50%",
  },
  {
    name: "Survival Will",
    tree: "Warrior",
    affix:
      "+30% additional Attack Damage when not at Low Life\nRestores 40% Max Life at Low Life. Interval: 10 s",
  },
  {
    name: "Perception",
    tree: "Goddess of Hunting",
    affix:
      "+100% chance to gain 1 stacks of Agility Blessing on hit\nMax Agility Blessing Stacks +1",
  },
  {
    name: "Third time's a charm",
    tree: "Goddess of Hunting",
    affix:
      "+45% Attack and Cast Speed after using the Main Skill 3 consecutive times. Lasts for 2 s",
  },
  {
    name: "Impermanence",
    tree: "Goddess of Hunting",
    affix:
      "-90% additional Min Physical Damage, and +80% additional Max Physical Damage\n-40% additional min damage\n+40% additional max damage",
  },
  {
    name: "Rushed",
    tree: "Goddess of Hunting",
    affix: "+30% additional damage if you have recently moved more than 5 m",
  },
  {
    name: "Three Birds with One Stone",
    tree: "Goddess of Hunting",
    affix:
      "Projectile Quantity +2\nParabolic Projectile Splits quantity +2\n+10% additional Projectile Damage",
  },
  {
    name: "Steady Accumulation",
    tree: "Goddess of Hunting",
    affix:
      "+15% Combo Finisher Amplification\n+1 Combo Points gained from Combo Starters",
  },
  {
    name: "Gale",
    tree: "Marksman",
    affix:
      "60% of the Projectile Speed bonus is also applied to the additional bonus for Projectile Damage",
  },
  {
    name: "Euphoria",
    tree: "Marksman",
    affix: "+4% additional Evasion for every stack of Agility Blessing",
  },
  {
    name: "Close Range Fire",
    tree: "Marksman",
    affix:
      "Projectiles deal up to +35% additional damage to enemies in Proximity, and this damage reduces with the distance traveled by the Projectiles",
  },
  {
    name: "Master Escapist",
    tree: "Marksman",
    affix: "+1 Max Deflection stacks\nGains 1 stacks of Deflection on Evasion",
  },
  {
    name: "Waiting Attack",
    tree: "Bladerunner",
    affix:
      "Consumes all Agility Blessing every 8s. For each stack consumed, +5% additional damage in the next 8s",
  },
  {
    name: "Joined Force",
    tree: "Bladerunner",
    affix:
      "Off-Hand Weapons do not participate in Attacks while Dual Wielding\nAdds 60% of the damage of the Off-Hand Weapon to the final damage of the Main-Hand Weapon",
  },
  {
    name: "Quick Advancement",
    tree: "Bladerunner",
    affix:
      "Multistrikes deal 55% increasing damage\nMinions' Multistrikes deal 55% increasing damage",
  },
  {
    name: "Preemptive Strike",
    tree: "Bladerunner",
    affix:
      "+1 initial Multistrike Count\n-20% Attack Speed when performing Multistrikes",
  },
  {
    name: "Cultivation",
    tree: "Druid",
    affix:
      "+4% Cast Speed for each skill recently used, stacking up to 15 times",
  },
  {
    name: "Acquaintance",
    tree: "Druid",
    affix:
      "+30% chance to trigger the Main Spell Skill 1 additional time when using it",
  },
  {
    name: "Rebirth",
    tree: "Druid",
    affix:
      "Converts 50% of Life Regain and Energy Shield Regain to Restoration Over Time\n-50% additional Regain Interval",
  },
  {
    name: "Poisoned Relief",
    tree: "Druid",
    affix: "+25% injury buffer\n-15% additional damage taken at Low Life",
  },
  {
    name: "Conductive",
    tree: "Assassin",
    affix:
      "Changes the base effect of Numbed to: +11% additional Lightning Damage taken",
  },
  {
    name: "Transition",
    tree: "Assassin",
    affix:
      "50% chance for this skill to deal +16% additional damage when casting a skill\n25% chance for this skill to deal +32% additional damage when casting a skill\n10% chance for this skill to deal +80% additional damage when casting a skill",
  },
  {
    name: "Queer Angle",
    tree: "Assassin",
    affix: "You and Minions deal Lucky Damage against Numbed enemies",
  },
  {
    name: "Thunderclap",
    tree: "Assassin",
    affix:
      "If you have Agility Blessing stacks when casting the Main Skill, consumes 1 stack(s) of Agility Blessing to make this skill deal +30% additional Lightning Damage",
  },
  { name: "Beacon", tree: "Goddess of Knowledge", affix: "+2 Max Spell Burst" },
  {
    name: "Chilly",
    tree: "Goddess of Knowledge",
    affix:
      "+100% chance to gain 1 stack of Focus Blessing on hit\nMax Focus Blessing Stacks +1",
  },
  {
    name: "Peculiar Vibe",
    tree: "Goddess of Knowledge",
    affix:
      "+50% chance to inflict Elemental Ailments\n+25% additional damage against enemies with Elemental Ailments",
  },
  {
    name: "Insight",
    tree: "Goddess of Knowledge",
    affix: "+30% additional Spell Damage\n+25% additional Skill Cost",
  },
  {
    name: "Burning Touch",
    tree: "Goddess of Knowledge",
    affix:
      "Has Spell Aggression\n+10% Spell Aggression Effect for every Main Spell Skill cast recently. Stacks up to 10 times",
  },
  {
    name: "Winter",
    tree: "Goddess of Knowledge",
    affix:
      "Deals +1% additional damage to an enemy for every 2 points of Frostbite Rating the enemy has",
  },
  {
    name: "Bunch",
    tree: "Magister",
    affix:
      "Max Focus Blessing Stacks +1\n+3% additional Spell Damage per stack of Focus Blessing owned",
  },
  {
    name: "Play Safe",
    tree: "Magister",
    affix:
      "100% of the bonuses and additional bonuses to Cast Speed is also applied to Spell Burst Charge Speed",
  },
  {
    name: "Shell",
    tree: "Magister",
    affix: "+35% additional Max Energy Shield\nYour Max Life is set to 100",
  },
  {
    name: "Barrier of Radiance",
    tree: "Magister",
    affix:
      "Energy Shield Charge started recently cannot be interrupted by damage\n+50% Energy Shield Charge Speed",
  },
  {
    name: "Mana",
    tree: "Arcanist",
    affix:
      "20% of damage is taken from Mana before life\n+12% additional Max Mana",
  },
  {
    name: "Mind Focus",
    tree: "Arcanist",
    affix:
      "Changes the base effect of Focus Blessing to: Adds Physical Damage equal to 1% of Max Mana to Attacks and Spells",
  },
  {
    name: "Full Load",
    tree: "Arcanist",
    affix:
      "+40% additional damage for the next skill when Mana reaches the max",
  },
  {
    name: "Preparation",
    tree: "Arcanist",
    affix: "Adds 1 Max Energy Shield for every 50 Mana consumed recently",
  },
  {
    name: "Translucent",
    tree: "Elementalist",
    affix:
      "+25% additional Lightning Damage if you have dealt Fire Damage recently\n+25% additional Cold Damage if you have dealt Lightning Damage recently\n+25% additional Fire Damage if you have dealt Cold Damage recently",
  },
  {
    name: "Penetrating",
    tree: "Elementalist",
    affix:
      "When inflicting Ignite, Numbed, Frostbite/Freeze, inflicts Fire Infiltration, Lightning Infiltration, or Cold Infiltration respectively.\nUpon inflicting damage, +8% additional Elemental Damage for each type of Infiltration Effect the enemy has",
  },
  {
    name: "Focus",
    tree: "Elementalist",
    affix:
      "Max Channeled Stacks +1\n+6% additional damage for every +1 additional Max Channeled Stack(s)",
  },
  {
    name: "Quick Ritual",
    tree: "Elementalist",
    affix: "Min Channeled Stacks +1\n+20% additional damage Channeled Skills",
  },
  {
    name: "Frostbitten",
    tree: "Prophet",
    affix:
      "+25% additional damage against Frozen enemies\nInflicts Frostbite and 100 Frostbite Rating when dealing Cold Damage to an enemy for the first time",
  },
  {
    name: "Extreme Coldness",
    tree: "Prophet",
    affix:
      "Frostbite and Frostbite Rating will continue to be inflicted on Frozen enemies\nAfter Freeze ends, Frostbite and all Frostbite Rating will no longer be removed. +20% of the retained Frostbite Rating\n+25% additional Freeze Duration when an Elite is nearby",
  },
  {
    name: "Mind Blade",
    tree: "Prophet",
    affix:
      "Adds 30% Physical Damage as Cold Damage when not wielding a Wand or Tin Staff\n+25% additional Cold Damage when wielding a Wand or Tin Staff",
  },
  {
    name: "Frozen Lotus",
    tree: "Prophet",
    affix:
      "+25% additional Cold Damage\n+25% additional Minion Cold Damage\nSkills no longer cost Mana",
  },
  {
    name: "Cohesion",
    tree: "God of War",
    affix:
      "+50% additional Critical Strike Rating for the next Main Skill used every 1 s",
  },
  {
    name: "Blunt",
    tree: "God of War",
    affix: "+30% additional Physical Damage\nEnemies +20% Injury Buffer",
  },
  {
    name: "Determined",
    tree: "God of War",
    affix:
      "Upon taking fatal damage, you have a 50% chance to keep at least 1 Life",
  },
  {
    name: "Ambition",
    tree: "God of War",
    affix:
      "+100% chance to gain 10 Fervor rating on hit\nGains Fervor when there are enemies Nearby",
  },
  {
    name: "Gravity",
    tree: "God of War",
    affix:
      "+25% additional Melee Damage\nMelee Skill has reversed knockback direction",
  },
  {
    name: "Shooting Arrows",
    tree: "God of War",
    affix: "+25% additional Projectile Damage\n+50% Knockback distance",
  },
  {
    name: "Brutality",
    tree: "Shadowdancer",
    affix:
      "+33% additional Physical Damage\n+30% additional Minion Physical Damage\n-1% additional Elemental Damage for every 3 level(s).",
  },
  {
    name: "Hair-trigger",
    tree: "Shadowdancer",
    affix:
      "+2% additional damage of a skill for every 7 points of Fervor Rating when the skill is triggered",
  },
  {
    name: "Instant Smash",
    tree: "Shadowdancer",
    affix: "+80% additional Trauma Damage dealt by Critical Strikes",
  },
  {
    name: "Open Wounds",
    tree: "Shadowdancer",
    affix:
      "+50% Trauma Duration when inflicting Trauma on Trauma enemies\n+125% Critical Strike Damage against Traumatized enemies\nMinions +125% Critical Strike Damage against Traumatized enemies",
  },
  {
    name: "Falling Leaves",
    tree: "Ronin",
    affix: "-20% additional damage for Weapons\n+40% additional Attack Damage",
  },
  {
    name: "Tradeoff",
    tree: "Ronin",
    affix:
      "+20% additional Attack Speed when Dexterity is no less than Strength\n+25% additional Attack Damage when Strength is no less than Dexterity",
  },
  {
    name: "Centralize",
    tree: "Ronin",
    affix:
      "Gains additional Fervor Rating equal to 25% of the current Fervor Rating on hit. Cooldown: 0.3 s\nConsumes half of current Fervor Rating when hit. -0.8% additional damage per 1 point consumed",
  },
  {
    name: "Endless Fervor",
    tree: "Ronin",
    affix: "Have Fervor\n+12% Fervor effect",
  },
  { name: "Fluke", tree: "Ranger", affix: "Lucky Critical Strike" },
  {
    name: "Keep It Up",
    tree: "Ranger",
    affix:
      "When triggering a Critical Strike, gains the following buff for the next 4s: +7% additional damage and -25% Critical Strike Rating on Critical Strike. Interval: 0.5s",
  },
  {
    name: "Impending",
    tree: "Ranger",
    affix:
      "Every 0.25 s, +6% additional damage taken for enemies within 10 m. Stacks up to 5 times",
  },
  {
    name: "Rapid Shots",
    tree: "Ranger",
    affix:
      "Projectile Damage increases with the distance traveled, dealing up to +35% additional damage to Distant enemies",
  },
  {
    name: "Automatic Upgrade",
    tree: "Sentinel",
    affix:
      "Gains a stack of Fortitude when using a Melee Skill\n+4% additional damage per 1 stack(s) of Fortitude",
  },
  { name: "Defensiveness", tree: "Sentinel", affix: "+25% Block Ratio" },
  {
    name: "Full Defense",
    tree: "Sentinel",
    affix:
      "+25% additional Defense gained from Shield\n-1% additional Damage Over Time taken for every 1% Block Ratio",
  },
  {
    name: "Last Stand",
    tree: "Sentinel",
    affix:
      "Block Ratio is set to 0%\nFor every +3% Attack or Spell Block Chance, +2% additional damage, up to +90%",
  },
  {
    name: "Plague",
    tree: "Goddess of Deception",
    affix:
      "+20% Movement Speed when defeating Wilted enemies recently\n+15% additional Wilt Damage",
  },
  {
    name: "Mixture",
    tree: "Goddess of Deception",
    affix: "+50% Deterioration Chance",
  },
  {
    name: "Affliction",
    tree: "Goddess of Deception",
    affix:
      "+30 Affliction inflicted per second\n+30% additional Affliction effect",
  },
  {
    name: "Subtle Impact",
    tree: "Goddess of Deception",
    affix: "Blur gains an additional effect: +25% additional Damage Over Time",
  },
  {
    name: "Forbidden Power",
    tree: "Goddess of Deception",
    affix: "+35% additional Erosion Damage\n-10% Elemental Resistance",
  },
  {
    name: "Deceiver's Might",
    tree: "Goddess of Deception",
    affix:
      "+1 to Max Tenacity Blessing Stacks if you have taken damage in the last 8s\n+1 to Max Agility Blessing Stacks if you have used a Mobility Skill in the last 8s\n+1 to Max Focus Blessing Stacks if you have landed a Critical Strike or Reaped in the last 8s",
  },
  {
    name: "Dirt",
    tree: "Shadowmaster",
    affix:
      "+15% additional Erosion Damage\n15% additional damage applied to Life",
  },
  {
    name: "Stealth Stab",
    tree: "Shadowmaster",
    affix:
      "-25% additional damage taken while Blur is active\n+25% additional damage for 3 s after Blur ends",
  },
  {
    name: "Beyond Cure",
    tree: "Shadowmaster",
    affix:
      "Upon inflicting damage, +6% additional Erosion Damage for every stack of Wilt or Deterioration the enemy has, up to an additional +30%",
  },
  {
    name: "Twisted Belief",
    tree: "Shadowmaster",
    affix: "+3 Erosion Skill Level\n-5% Max Erosion Resistance",
  },
  {
    name: "Windwalk",
    tree: "Psychic",
    affix:
      "+80% additional Reaping Duration against enemies with Max Affliction. Lasts for 4 s. Only takes effect once on each enemy",
  },
  {
    name: "Holiness",
    tree: "Psychic",
    affix:
      "-95% Cursed Effect\n-25% additional damage taken from Cursed enemies",
  },
  {
    name: "More With Less",
    tree: "Psychic",
    affix:
      "+30% additional Damage Over Time\n-10% additional Damage Over Time Duration",
  },
  {
    name: "Reap Purification",
    tree: "Psychic",
    affix:
      "Additionally settles 25% of the remaining total damage when Reaping, then removes all Damage Over Time acting on the target",
  },
  {
    name: "Verbal Abuse",
    tree: "Warlock",
    affix: "You can cast 1 additional Curses\n+10% curse effect",
  },
  {
    name: "Vile",
    tree: "Warlock",
    affix:
      "Duration of Ailments caused by Critical Strikes is doubled\nFor every +3% Critical Strike Damage, +1% additional Ailment Damage",
  },
  {
    name: "Dirty Tricks",
    tree: "Warlock",
    affix:
      "Guaranteed to inflict all types of Ailment on hit\nUpon inflicting damage, +6% additional damage for every type of Ailment the enemy has (multiplies)\nWhen Minions deal damage, +6% additional damage for every type of Ailment the enemy has (multiplies)",
  },
  {
    name: "Daze",
    tree: "Warlock",
    affix:
      "Blur gains an additional effect: +40% crowd control effect and +25% additional Ailment Damage",
  },
  {
    name: "Indifference",
    tree: "Lich",
    affix:
      "+1% additional damage and +1% additional Minion Damage for every 5 remaining Energy, up to +50% additional damage",
  },
  {
    name: "Ward",
    tree: "Lich",
    affix:
      "Adds 13% of Sealed Mana as Energy Shield\nAdds 13% of Sealed Life as Energy Shield",
  },
  {
    name: "Off The Beaten Track",
    tree: "Lich",
    affix:
      "+4 Support Skill Level\nSupport Skill's Mana Multiplier is fixed at 95%.",
  },
  {
    name: "Stab In The Back",
    tree: "Lich",
    affix:
      "While Blur is active, loses Blur after casting a Main Skill, and the skill deals +35% additional damage",
  },
  {
    name: "Orders",
    tree: "God of Machines",
    affix:
      "+25% additional Minion Damage\n+50% additional Summon Skill Cast Speed",
  },
  {
    name: "Sentry",
    tree: "God of Machines",
    affix:
      "Max Sentry Quantity +1\n+100% additional Cast Speed for Sentry Skills",
  },
  {
    name: "Shrink Back",
    tree: "God of Machines",
    affix: "Gains Barrier every 1s\n+50% Barrier Shield",
  },
  {
    name: "Mighty Guard",
    tree: "God of Machines",
    affix:
      "+2 Minion Skill Level\n+ 4 Command per second\n+40 initial Growth for Spirit Magi",
  },
  {
    name: "Overly Modified",
    tree: "God of Machines",
    affix: "+30% additional Sentry Damage, -50% non-Sentry Active Skill damage",
  },
  {
    name: "Isomorphic Arms",
    tree: "God of Machines",
    affix:
      "Minions gain the Main-Hand Weapon's bonuses.\n+30% additional Spell Damage for Minions when wielding a Wand or Tin Staff",
  },
  {
    name: "Boss",
    tree: "Machinist",
    affix:
      "+1 to Max Summonable Synthetic Troops\n+15% additional Minion Damage",
  },
  {
    name: "Rally",
    tree: "Machinist",
    affix:
      "Synthetic Troop Minions summoned at a time +1\n+25% additional Minion Damage",
  },
  {
    name: "Burning Aggression",
    tree: "Machinist",
    affix:
      "Gains 30 point(s) of Command every 2 s when there is an Elite within 10 m",
  },
  {
    name: "United Stand",
    tree: "Machinist",
    affix:
      "-5% additional damage taken for every nearby Synthetic Troop Minion within 10m\n-10% Minion aggressiveness",
  },
  {
    name: "Reflection",
    tree: "Steel Vanguard",
    affix:
      "+6% additional damage for each type of Aura you are affected by\nMinions +6% additional damage for each type of Aura they are affected by",
  },
  {
    name: "Resistance",
    tree: "Steel Vanguard",
    affix:
      "+1% chance to avoidElemental Ailments for every 1% effective Erosion Resistance",
  },
  {
    name: "Knowledgeable",
    tree: "Steel Vanguard",
    affix:
      "+100% additional Focus Skill Damage\n+50% Sealed Mana Compensation for Focus Skills\nFocus Skills can be equipped to Active Skill slots",
  },
  {
    name: "Panacea",
    tree: "Steel Vanguard",
    affix:
      "Restoration Skills: +100% restoration effect\nRestoration Effect from Restoration Skills cannot be removed",
  },
  {
    name: "Source",
    tree: "Alchemist",
    affix:
      "+50% Sealed Mana Compensation for Spirit Magus Skills\n+30% additional Origin of Spirit Magus Effect\nSpirit Magi +30% additional Empower Skill Effect",
  },
  {
    name: "Empower",
    tree: "Alchemist",
    affix:
      "The number of Max Spirit Magi In Map is 1\n+100% additional Spirit Magus Skill Damage",
  },
  {
    name: "Battle Trumpet",
    tree: "Alchemist",
    affix:
      "-10% additional Minion Attack and Cast Speed\nSpirit Magi +50% chance to use an Enhanced Skill",
  },
  {
    name: "Talons of Abyss",
    tree: "Alchemist",
    affix:
      "For every 20 Growth a Spirit Magus has, it deals +1% additional damage\nFor every 40 Growth a Spirit Magus has, it +1% additional Ultimate Attack and Cast Speed",
  },
  {
    name: "Heat Up",
    tree: "Artisan",
    affix:
      "+30% additional Sentry Damage if Sentry Skill has been cast recently\n-30% additional Sentry Start Time",
  },
  {
    name: "Co-resonance",
    tree: "Artisan",
    affix:
      "+25% additional Sentry Damage\nAttack Speed bonus and 100% of additional bonus are also applied to Attack Sentries' Cast Frequency\nCast Speed bonus and 100% of additional bonus are also applied to Spell Sentries' Cast Frequency",
  },
  {
    name: "Kinetic Conversion",
    tree: "Artisan",
    affix:
      "100% chance to gain a Barrier for every 5 m you move\nRefreshes Barrier when gaining Barrier\n-40% additional Barrier Shield",
  },
  {
    name: "Shared Fate",
    tree: "Artisan",
    affix:
      "Triggers the Sentry Main Skill when there are no Sentries within 10 m. Interval: 1 s\nThe number of Sentries that can be deployed at a time is equal to the Max Sentry Quantity\n+25% additional Sentry Damage",
  },
] as const satisfies readonly BaseCoreTalent[];
