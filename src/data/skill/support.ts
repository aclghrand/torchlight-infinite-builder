import { BaseSkill } from "./types";

export const SupportSkills: readonly BaseSkill[] = [
  {
    type: "Support",
    name: "Added Cold Damage",
    tags: ["Cold"],
    description: [
      "Supports skills that hit enemies.\nAdds 2 - 3 Cold Damage to the supported skill",
      "Adds 2 - 3 Cold Damage to the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Added Erosion Damage",
    tags: ["Erosion"],
    description: [
      "Supports skills that hit enemies.\nAdds 2 - 2 Erosion Damage to the supported skill\nThe supported skill gains 11% of its damage as Base Wilt Damage\nAdds 7.7% of Main-Hand Weapon Damage to Base Wilt Damage for the supported skill",
      "Adds 2 - 2 Erosion Damage to the supported skill\nThe supported skill gains 11% of its damage as Base Wilt Damage\nAdds 7.7% of Main-Hand Weapon Damage to Base Wilt Damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Added Fire Damage",
    tags: ["Fire"],
    description: [
      "Supports skills that hit enemies.\nThe supported skill adds 1 - 3 Fire Damage\nThe supported skill gains 13.4% of its damage as Base Ignite Damage\nAdds 8.7% of Main-Hand Weapon Damage to Base Ignite Damage for the supported skill",
      "The supported skill adds 1 - 3 Fire Damage\nThe supported skill gains 13.4% of its damage as Base Ignite Damage\nAdds 8.7% of Main-Hand Weapon Damage to Base Ignite Damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Added Lightning Damage",
    tags: ["Lightning"],
    description: [
      "Supports skills that hit enemies.\nThe supported skill adds 1 - 4 Lightning Damage",
      "The supported skill adds 1 - 4 Lightning Damage",
    ],
  },
  {
    type: "Support",
    name: "Added Physical Damage",
    tags: ["Physical"],
    description: [
      "Supports skills that hit enemies.\nSupported skills add 2 - 3 physical damage\nThe supported skill gains 23.5% of its damage as Base Trauma Damage\nAdds 12.4% of the Main-Hand Weapon's damage to Base Trauma Damage for the supported skill",
      "Supported skills add 2 - 3 physical damage\nThe supported skill gains 23.5% of its damage as Base Trauma Damage\nAdds 12.4% of the Main-Hand Weapon's damage to Base Trauma Damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Additional Ignite",
    tags: ["Fire"],
    description: [
      "Supports skills that hit enemies.\nThe supported skill inflicts 1 additional stack(s) of Ignite\nFor each stack of Ignite an enemy has, the supported skill deals 6.2% additional Ignite Damage to the enemy, up to 24.8% .\n20.5% Ignite chance for the supported skill",
      "The supported skill inflicts 1 additional stack(s) of Ignite\nFor each stack of Ignite an enemy has, the supported skill deals 6.2% additional Ignite Damage to the enemy, up to 24.8% .\n20.5% Ignite chance for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Ailment Termination",
    tags: [],
    description: [
      "Supports skills that hit enemies.\n-10% additional damage for the supported skill\nThe supported skill deals 6.7% additional damage for every type of Ailment on enemy (multiplies)",
      "-10% additional damage for the supported skill\nThe supported skill deals 6.7% additional damage for every type of Ailment on enemy (multiplies)",
    ],
  },
  {
    type: "Support",
    name: "All In",
    tags: ["Defensive"],
    description: [
      "Supports Defensive Skills.\nWhen casting the supported skill, gains the buff:\n29.5% additional Evasion. It drops to 0 gradually within 4s.",
      "When casting the supported skill, gains the buff:",
    ],
  },
  {
    type: "Support",
    name: "Assault Command",
    tags: ["Summon", "Synthetic Troop"],
    description: [
      "Supports skills that summon Synthetic Troops.\n15.5% additional damage for Minions summoned by the supported skill\n+56 Critical Strike Rating for Minions summoned by the supported skill when having at least 40 Command",
      "15.5% additional damage for Minions summoned by the supported skill\n+56 Critical Strike Rating for Minions summoned by the supported skill when having at least 40 Command",
    ],
  },
  {
    type: "Support",
    name: "Attack Focus",
    tags: ["Attack"],
    description: [
      "Supports Attack Skills.\nGains 2 Fervor Rating when the supported skill hits an enemy\nThe supported skill 1.65% additional damage for every 10 Fervor Rating\nFor every 10 Fervor Rating, the supported skill +3% Critical Strike Rating",
      "Gains 2 Fervor Rating when the supported skill hits an enemy\nThe supported skill 1.65% additional damage for every 10 Fervor Rating\nFor every 10 Fervor Rating, the supported skill +3% Critical Strike Rating",
    ],
  },
  {
    type: "Support",
    name: "Aura Amplification",
    tags: ["Aura"],
    description: [
      "Supports Aura Skills.\n5.25% Aura effect for the supported skill\n+100% Skill Area for the supported skill",
      "5.25% Aura effect for the supported skill\n+100% Skill Area for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Auto-Charge",
    tags: ["Restoration"],
    description: [
      "Supports Restoration Skills.\nThe supported skill gains 0.5 Charging Progress every second.",
      "The supported skill gains 0.5 Charging Progress every second.",
    ],
  },
  {
    type: "Support",
    name: "Blinding",
    tags: [],
    description: [
      "Supports skills that hit enemies.\n+10% chance to inflict Blind when the supported skill hits targets\n+5% Blinding Duration caused by the supported skill",
      "+10% chance to inflict Blind when the supported skill hits targets\n+5% Blinding Duration caused by the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Carpet Bombardment",
    tags: ["Barrage"],
    description: [
      "Supports Barrage Skills.\n9.3% additional damage for the supported skill\nThe supported skill 8.6% damage increase per wave\n-10% Wave Interval for the supported skill",
      "9.3% additional damage for the supported skill\nThe supported skill 8.6% damage increase per wave\n-10% Wave Interval for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Cataclysm",
    tags: ["Persistent"],
    description: [
      "Supports skills that deal Damage Over Time or inflict Ailments.\nWhen the supported skill deals Damage Over Time, it inflicts 8 Affliction on the enemy. Effect Cooldown: 1 s\nAffliction grants an additional 26.5% effect to the supported skill",
      "When the supported skill deals Damage Over Time, it inflicts 8 Affliction on the enemy. Effect Cooldown: 1 s\nAffliction grants an additional 26.5% effect to the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Channel Preparation",
    tags: ["Channeled"],
    description: [
      "Supports Channeled Skills.\n+4% additional damage for the supported skill\n+1 to the Min Channeled Stacks for the supported skill",
      "+4% additional damage for the supported skill\n+1 to the Min Channeled Stacks for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Charge",
    tags: ["Mobility"],
    description: [
      "Support Mobility Skills.\nWhen casting the supported skill, gains a buff\nBuffs grant +118% Warcry Cast Speed for the next Warcry",
      "When casting the supported skill, gains a buff",
    ],
  },
  {
    type: "Support",
    name: "Concentration Warcry",
    tags: ["Warcry"],
    description: [
      "Supports Warcry Skills.\n-15% Skill Area for the supported skill\n+10% Cooldown Recovery Speed for the supported skill",
      "-15% Skill Area for the supported skill\n+10% Cooldown Recovery Speed for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Control Spell",
    tags: ["Spell"],
    description: [
      "Supports Spell Skills.\n-100% Critical Strike Rating for the supported skill\n+28% additional damage for the supported skill",
      "-100% Critical Strike Rating for the supported skill\n+28% additional damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Cooldown Reduction",
    tags: [],
    description: [
      "Supports any skill.\n+13% Cooldown Recovery Speed for the supported skill",
      "+13% Cooldown Recovery Speed for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Cost Conversion",
    tags: [],
    description: [
      "Supports Active Skills.\nReplace Mana Cost from the supported skill with Life cost",
      "Replace Mana Cost from the supported skill with Life cost",
    ],
  },
  {
    type: "Support",
    name: "Critical Charge",
    tags: ["Restoration"],
    description: [
      "Supports Restoration Skills.\nThe supported skill gains 10 Charging Progress when suffering Severe Injury. Interval: 4s",
      "The supported skill gains 10 Charging Progress when suffering Severe Injury. Interval: 4s",
    ],
  },
  {
    type: "Support",
    name: "Critical Strike Damage Increase",
    tags: [],
    description: [
      "Supports skills that hit enemies.\n+26% additional damage for the supported skill when it lands a Critical Strike",
      "+26% additional damage for the supported skill when it lands a Critical Strike",
    ],
  },
  {
    type: "Support",
    name: "Critical Strike Rating Increase",
    tags: [],
    description: [
      "Supports skills that hit enemies.\n+135% Critical Strike Rating for the supported skill",
      "+135% Critical Strike Rating for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Deep Wounds",
    tags: ["Physical"],
    description: [
      "Supports skills that hit enemies.\n15.5% additional Trauma Damage for the supported skill\n20.5% chance for the supported skill to inflict Trauma",
      "15.5% additional Trauma Damage for the supported skill\n20.5% chance for the supported skill to inflict Trauma",
    ],
  },
  {
    type: "Support",
    name: "Defense Form",
    tags: ["Summon", "Synthetic Troop"],
    description: [
      "Supports skills that summon Synthetic Troops.\n+10% additional Life for Minions summoned by the supported skill\n-5% additional damage taken for Minions summoned by the supported skill\n+10% chance to Weaken the enemy for every 20 Command when hit by a Minion summoned by the supported skill",
      "+10% additional Life for Minions summoned by the supported skill\n-5% additional damage taken for Minions summoned by the supported skill\n+10% chance to Weaken the enemy for every 20 Command when hit by a Minion summoned by the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Defense Layers",
    tags: ["Defensive"],
    description: [
      "Supports Defensive Skills.\nWhen casting the supported skill, Energy Shield cannot be interrupted by damage for 1 s\n3.25% Energy Shield Charge Speed while the supported skill lasts",
      "When casting the supported skill, Energy Shield cannot be interrupted by damage for 1 s\n3.25% Energy Shield Charge Speed while the supported skill lasts",
    ],
  },
  {
    type: "Support",
    name: "Electric Overload",
    tags: ["Lightning"],
    description: [
      "Supports skills that deal damage.\n10.25% additional Lightning Damage for the supported skill\nThe supported skill gains a buff on Critical Strike. The buff lasts 2 s.\nBuffs grant +15% additional Lightning Damage to this skill",
      "10.25% additional Lightning Damage for the supported skill\nThe supported skill gains a buff on Critical Strike. The buff lasts 2 s.",
    ],
  },
  {
    type: "Support",
    name: "Electric Punishment",
    tags: ["Lightning"],
    description: [
      "Supports skills that hit enemies.\nThe supported skill deals 10.5% additional damage to Numbed enemies. For every stack of Numbed the enemy has, the supported skill deals +1% additional damage",
      "The supported skill deals 10.5% additional damage to Numbed enemies. For every stack of Numbed the enemy has, the supported skill deals +1% additional damage",
    ],
  },
  {
    type: "Support",
    name: "Elemental Duo",
    tags: ["Summon", "Spirit Magus"],
    description: [
      "Supports skills that summon Spirit Magus.\n+1 to Max Summonable Minions for the supported skill\n15.5% additional damage for Minions summoned by the supported skill",
      "+1 to Max Summonable Minions for the supported skill\n15.5% additional damage for Minions summoned by the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Elemental Fusion",
    tags: ["Fire", "Lightning", "Cold"],
    description: [
      "Supports skills that deal damage.\nThe supported skill cannot inflict Ignite, Frostbite or Numbed\n25.5% additional Elemental Damage for the supported skill",
      "The supported skill cannot inflict Ignite, Frostbite or Numbed\n25.5% additional Elemental Damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Elemental Impact",
    tags: ["Attack"],
    description: [
      "Supports Attack Skills.\nIf a hit of the supported skill deal at least 2 types of Elemental Damage, the next use of the supported skill deals 17.5% additional Elemental Damage",
      "If a hit of the supported skill deal at least 2 types of Elemental Damage, the next use of the supported skill deals 17.5% additional Elemental Damage",
    ],
  },
  {
    type: "Support",
    name: "Emergency Avoidance",
    tags: ["Mobility"],
    description: [
      "Support Mobility Skills.\nGains a stack of buff when you use the supported skill: 4.5% Evasion per stack of buffs\nThe buff lasts 4s, stacking up to 4 times.",
      "Gains 1 stack of buff when you use the supported skill.\nThe buff lasts 4 s, stacking up to 4 times",
    ],
  },
  {
    type: "Support",
    name: "Emergency restoration",
    tags: ["Restoration"],
    description: [
      "Supports Restoration Skills.\n45.5% restoration effect at Low Life for the supported skill\n+10% Restoration Effect for the supported skill at Low Mana",
      "45.5% restoration effect at Low Life for the supported skill\n+10% Restoration Effect for the supported skill at Low Mana",
    ],
  },
  {
    type: "Support",
    name: "Enhanced Ailment",
    tags: [],
    description: [
      "Supports skills that hit enemies.\n15.5% additional Ailment Damage for the supported skill",
      "15.5% additional Ailment Damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Extended Duration",
    tags: ["Persistent"],
    description: [
      "Supports DoT Skills.\n+13% Duration for the supported skill",
      "+13% Duration for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Fire Explosion",
    tags: ["Fire"],
    description: [
      "Supports skills that deal damage.\n12.5% additional Fire Damage for the supported skill\n+4% additional Ignite Damage for the supported skill",
      "12.5% additional Fire Damage for the supported skill\n+4% additional Ignite Damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Focus Acceleration",
    tags: ["Focus"],
    description: [
      "Supports Focus Skills.\n46.5% Focus Speed for the supported skill",
      "46.5% Focus Speed for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Focus Buff",
    tags: ["Focus"],
    description: [
      "Supports Focus Skills.\n45.5% buff effect for the supported skill\n-30% Sealed Mana Compensation for the supported skill",
      "45.5% buff effect for the supported skill\n-30% Sealed Mana Compensation for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Focused Beam",
    tags: ["Spell", "Beam"],
    description: [
      "Supports Beam Skills.\n+15% additional Beam Length for the supported Beam Skill\n15.5% additional damage for the supported skill",
      "+15% additional Beam Length for the supported Beam Skill\n15.5% additional damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Fragile Resurrection",
    tags: ["Restoration"],
    description: [
      "Supports Restoration Skills.\n+40% Restoration effect for the supported skill\n-20% Restoration Duration for the supported skill\n+10% additional damage taken during the supported skill's restoration effect",
      "+40% Restoration effect for the supported skill\n-20% Restoration Duration for the supported skill\n+10% additional damage taken during the supported skill's restoration effect",
    ],
  },
  {
    type: "Support",
    name: "Freeze Chance",
    tags: ["Cold"],
    description: [
      "Supports skills that deal damage.\n15.5% additional Cold Damage for the supported skill\n+50% Frostbite chance for the supported skill",
      "15.5% additional Cold Damage for the supported skill\n+50% Frostbite chance for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Friend of Spirit Magi",
    tags: ["Summon", "Spirit Magus"],
    description: [
      "Supports Spirit Magus Skills.\nWhen having at least 2 type(s) of Spirit Magus at the same time, Origin of Spirit Magus provided by the supported skill 51.2% Effect\n-30% Sealed Mana Compensation for the supported skill",
      "When having at least 2 type(s) of Spirit Magus at the same time, Origin of Spirit Magus provided by the supported skill 51.2% Effect\n-30% Sealed Mana Compensation for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Gladiator's Roar",
    tags: ["Warcry"],
    description: [
      "Supports Warcry Skills.\n+40% Skill Area for the supported skill\nWhen casting the supported skill, Reverse Knocks Back nearby enemies with a Knockback Distance of 2 m\nThe effective area of this effect is affected by Skill Area bonuses",
      "+40% Skill Area for the supported skill\nWhen casting the supported skill, Reverse Knocks Back nearby enemies with a Knockback Distance of 2 m\nThe effective area of this effect is affected by Skill Area bonuses",
    ],
  },
  {
    type: "Support",
    name: "Ground Divide",
    tags: ["Terra"],
    description: [
      "Supports Terra Skills.\n+1 Max Terra Charge stacks for the supported skill\n55.5% Terra Charge Restoration Speed for the supported skill\n1.5% additional damage for the supported skill",
      "+1 Max Terra Charge stacks for the supported skill\n55.5% Terra Charge Restoration Speed for the supported skill\n1.5% additional damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Grudge",
    tags: ["Spell"],
    description: [
      "Supports Spell Skills.\nThe supported skill deals 10.5% additional damage to Cursed enemies\nWhen the supported skill deals damage to a Cursed target, there is a +31% chance to Paralyze it",
      "The supported skill deals 10.5% additional damage to Cursed enemies\nWhen the supported skill deals damage to a Cursed target, there is a +31% chance to Paralyze it",
    ],
  },
  {
    type: "Support",
    name: "Guard",
    tags: ["Channeled"],
    description: [
      "Supports Channeled Skills.\n15.5% additional damage for the supported skill\nEvery 5 time(s) the supported skill is used, gains a Barrier if there's no Barrier. Interval: 6 s",
      "15.5% additional damage for the supported skill\nEvery 5 time(s) the supported skill is used, gains a Barrier if there's no Barrier. Interval: 6 s",
    ],
  },
  {
    type: "Support",
    name: "Harvest Time",
    tags: ["Summon", "Spirit Magus"],
    description: [
      "Supports skills that summon Spirit Magus.\nMinions summoned by the supported skill prepare the Empower Skill every 5 s\nWhen Minions summoned by the supported skill are at Stage 2 or higher, +15% chance to use an Enhanced Skill\nWhen Minions summoned by the supported skill are at Stage 3 or higher, +15% additional Empower Duration for them\nWhen Minions summoned by the supported skill are at Stage 3 or higher and Empowered, +8% additional damage for them",
      "Minions summoned by the supported skill prepare the Empower Skill every 5 s\nWhen Minions summoned by the supported skill are at Stage 2 or higher, +15% chance to use an Enhanced Skill\nWhen Minions summoned by the supported skill are at Stage 3 or higher, +15% additional Empower Duration for them\nWhen Minions summoned by the supported skill are at Stage 3 or higher and Empowered, +8% additional damage for them",
    ],
  },
  {
    type: "Support",
    name: "Haunt",
    tags: ["Attack", "Melee", "Shadow Strike"],
    description: [
      "Supports Shadow Strike Skills.\n+2 Shadow Quantity for the supported skill\n-3% additional damage for the supported skill",
      "+2 Shadow Quantity for the supported skill\n-3% additional damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "High Voltage",
    tags: ["Lightning"],
    description: [
      "Supports skills that hit enemies.\n15.5% additional Lightning Damage for the supported skill\n20.5% Numbed chance for the supported skill",
      "15.5% additional Lightning Damage for the supported skill\n20.5% Numbed chance for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Hunting Tempo",
    tags: ["Attack", "Projectile"],
    description: [
      "Supports Attack Projectile Skills.\nGains 3 stacks of buffs after moving for more than 2 s. Stacks up to 3 times\nWhile this buff is in effect, 30.5% additional damage for the skill when using the supported skill\nWhile this buff is in effect, +40% Knockback Chance when using the supported skill\nWhile this buff is in effect, +15% Knockback Distance when using the supported skill\nLose 1 stack of this buff when using the supported skill",
      "Gains 3 stacks of buffs after moving for more than 2 s. Stacks up to 3 times\nWhile this buff is in effect, 30.5% additional damage for the skill when using the supported skill\nWhile this buff is in effect, +40% Knockback Chance when using the supported skill\nWhile this buff is in effect, +15% Knockback Distance when using the supported skill\nLose 1 stack of this buff when using the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Improved Corrosion",
    tags: ["Erosion"],
    description: [
      "Supports skills that hit enemies.\n29.5% chance for the supported skill to inflict 1 additional stacks of Wilt\n20.5% Wilt chance for the supported skill\n-10% additional Wilt Damage for the supported skill",
      "29.5% chance for the supported skill to inflict 1 additional stacks of Wilt\n20.5% Wilt chance for the supported skill\n-10% additional Wilt Damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Increased Area",
    tags: ["Area"],
    description: [
      "Supports Area Skills.\n+20% Skill Area for the supported skill\n+16% additional damage for the supported skill",
      "+20% Skill Area for the supported skill\n+16% additional damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Instant restoration",
    tags: ["Restoration"],
    description: [
      "Supports Restoration Skills.\nThe supported skill's Restoration effect becomes instant\n-20% additional Restoration Effect from the supported skill",
      "The supported skill's Restoration effect becomes instant\n-20% additional Restoration Effect from the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Iron Fortification",
    tags: ["Defensive"],
    description: [
      "Supports Defensive Skills.\n+220 Armor while the supported skill lasts\n+2% Armor Effective Rate against non-Physical Damage while the supported skill lasts",
      "+220 Armor while the supported skill lasts\n+2% Armor Effective Rate against non-Physical Damage while the supported skill lasts",
    ],
  },
  {
    type: "Support",
    name: "Jump",
    tags: ["Projectile", "Chain", "Horizontal"],
    description: [
      "Supports Horizontal Projectile Skills or Chain Skills.\n+2 Jumps for the supported skill\n+4% additional damage for the supported skill",
      "+2 Jumps for the supported skill\n+4% additional damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Lightning to Cold",
    tags: ["Lightning", "Cold"],
    description: [
      "Supports skills that hit enemies.\nConverts 100% of the supported skill's Lightning Damage to Cold Damage\n15.5% additional Lightning Damage for the supported skill",
      "Converts 100% of the supported skill's Lightning Damage to Cold Damage\n15.5% additional Lightning Damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Lion's Roars",
    tags: ["Warcry"],
    description: [
      "Support Warcry Skills.\n+20% Warcry Cast Speed for the supported skill\n+2 Max Charges for the supported skill\n-15% Cooldown Recovery Speed for the supported skill\nGains a stack of buff when you use the supported skill. The buff lasts 5 s, stacking up to 5 times\nThis skill +10% Skill Area for each stack of buff",
      "+20% Warcry Cast Speed for the supported skill\n+2 Max Charges for the supported skill\n-15% Cooldown Recovery Speed for the supported skill\nGains a stack of buff when you use the supported skill. The buff lasts 5 s, stacking up to 5 times",
    ],
  },
  {
    type: "Support",
    name: "Magic Dash",
    tags: ["Mobility"],
    description: [
      "Supports Mobility Skills.\n+1 Max Charges for the supported skill\nGains the following buff upon casting the supported skill: 1% Movement Speed\nThe buff lasts 2s.",
      "+1 Max Charges for the supported skill\nGains a 2 s buff after casting the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Maniacal Army",
    tags: ["Summon", "Synthetic Troop"],
    description: [
      "Supports skills that summon Synthetic Troops.\n+1 to Max Summonable Minions for the supported skill\nGains a buff when Minions summoned by the supported skill land a Critical Strike. Lasts 4 s. Interval per Minion: 8 s\nWhile the buff lasts, 6.25% additional Damage, stacking up to 37.5% , for every 10 point(s) of Command the Summoner has\nWhile the buff is active, 3.5% Attack and Cast Speed for every 10 Command the summoner has, up to +21%",
      "Gains a buff when Minions summoned by the supported skill land a Critical Strike. Lasts 4 s. Interval per Minion: 8 s\n+1 to Max Summonable Minions for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Mass Effect",
    tags: ["Empower"],
    description: [
      "Supports Empower Skills.\n+1 Max Charges for the supported skill\n10.5% effect for the status provided by the skill per Charge when you use the supported skill",
      "+1 Max Charges for the supported skill\n10.5% effect for the status provided by the skill per Charge when you use the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Mechanical Modification",
    tags: ["Summon", "Synthetic Troop"],
    description: [
      "Supports skills that summon Synthetic Troops.\n+40% Physique for Minions summoned by the supported skill\n+40% additional Skill Area for Minions summoned by the supported skill\n+131% additional damage for Minions summoned by the supported skill\n+10% additional Life for Minions summoned by the supported skill\nHalve the max number of Synthetic Troop Minions that can be summoned by you, rounding up to at least 1. This effect will take effect once",
      "+40% Physique for Minions summoned by the supported skill\n+40% additional Skill Area for Minions summoned by the supported skill\n+131% additional damage for Minions summoned by the supported skill\n+10% additional Life for Minions summoned by the supported skill\nHalve the max number of Synthetic Troop Minions that can be summoned by you, rounding up to at least 1. This effect will take effect once",
    ],
  },
  {
    type: "Support",
    name: "Melee Knockback",
    tags: ["Attack", "Melee"],
    description: [
      "Supports Melee Attack Skills.\n+20% Knockback chance for the supported skill\n15.5% additional damage for the supported skill\n+40% Knockback distance for the supported skill",
      "+20% Knockback chance for the supported skill\n15.5% additional damage for the supported skill\n+40% Knockback distance for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Multifaceted Guard",
    tags: ["Spell", "Sentry"],
    description: [
      "Supports Sentry Skills.\n+1 Max Sentries that can be deployed at the same time by the supported skill\n+1% additional damage for the supported skill",
      "+1 Max Sentries that can be deployed at the same time by the supported skill\n+1% additional damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Multiple Projectiles",
    tags: ["Projectile"],
    description: [
      "Supports Projectile Skills.\nProjectile Quantity of the supported skill +2\n7.4% additional damage for the supported skill",
      "Projectile Quantity of the supported skill +2\n7.4% additional damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Multistrike",
    tags: ["Attack"],
    description: [
      "Supports Attack Skills. Cannot support Mobility or Channeled Skills.\n+101% chance for the supported skill to trigger Multistrike\nMultistrikes of the supported skill deal 27% increasing damage",
      "+101% chance for the supported skill to trigger Multistrike\nMultistrikes of the supported skill deal 27% increasing damage",
    ],
  },
  {
    type: "Support",
    name: "Nova Shot",
    tags: ["Projectile", "Vertical"],
    description: [
      "Supports Vertical Projectile Skills.\n17.5% additional damage for the supported skill\n-15% Skill Area for the supported skill\n+15% additional Projectile Speed for the supported skill",
      "17.5% additional damage for the supported skill\n-15% Skill Area for the supported skill\n+15% additional Projectile Speed for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Overload",
    tags: ["Spell"],
    description: [
      "Supports Spell Skills.\n3.05% additional damage for the supported skill for every stack of Focus Blessing, stacking up to 8 times",
      "3.05% additional damage for the supported skill for every stack of Focus Blessing, stacking up to 8 times",
    ],
  },
  {
    type: "Support",
    name: "Pain Amplification",
    tags: ["Persistent"],
    description: [
      "Supports DoT Skills and skills that can inflict Ailment.\n12.5% additional Damage Over Time against enemies with Max Affliction for the supported skill",
      "12.5% additional Damage Over Time against enemies with Max Affliction for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Passivation",
    tags: ["Erosion"],
    description: [
      "Supports skills that deal damage.\nThe supported skill cannot inflict Wilt\nThe supported skill deals more damage to enemies with more Life, up to +41% additional Erosion Damage",
      "The supported skill cannot inflict Wilt\nThe supported skill deals more damage to enemies with more Life, up to +41% additional Erosion Damage",
    ],
  },
  {
    type: "Support",
    name: "Periodic Burst",
    tags: ["Mobility"],
    description: [
      "Support Mobility Skills.\nGains a stack of buff when using the supported skill every 6s: 20.5 % Attack and Cast Speed after using a Mobility Skill\nThe buff lasts 2s",
      "Gains a stack of buff when using the supported skill every 6 s. The buff lasts 2s",
    ],
  },
  {
    type: "Support",
    name: "Physical to Fire",
    tags: ["Physical", "Fire"],
    description: [
      "Supports skills that hit enemies.\nConverts 100% of the supported skill's Physical Damage to Fire Damage\nAdds 15.5% of Physical Damage as Fire Damage to the supported skill",
      "Converts 100% of the supported skill's Physical Damage to Fire Damage\nAdds 15.5% of Physical Damage as Fire Damage to the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Precise Restrain",
    tags: [],
    description: [
      "Supports Passive Skill.\n15.5% Sealed Mana Compensation for the supported skill",
      "15.5% Sealed Mana Compensation for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Precise: Concentrated",
    tags: ["Aura"],
    description: [
      "Supports Aura Skills.\nThe supported skill 25.5% Aura Effect when the character is affected by no more than 2 Auras",
      "The supported skill 25.5% Aura Effect when the character is affected by no more than 2 Auras",
    ],
  },
  {
    type: "Support",
    name: "Precise: Disciplined",
    tags: ["Aura"],
    description: [
      "Supports Aura Skills.\n+35% Sealed Mana Compensation for the supported skill\nThe supported skill -20.9% additional Aura Effect",
      "+35% Sealed Mana Compensation for the supported skill\nThe supported skill -20.9% additional Aura Effect",
    ],
  },
  {
    type: "Support",
    name: "Precise: Focus Buff",
    tags: ["Focus"],
    description: [
      "Supports Focus Skills.\n45.5% buff effect for the supported skill\n-18% Sealed Mana Compensation for the supported skill",
      "45.5% buff effect for the supported skill\n-18% Sealed Mana Compensation for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Precise: Friend of Spirit Magi",
    tags: ["Summon", "Spirit Magus"],
    description: [
      "Supports Spirit Magus Skills.\nWhen having at least 3 type(s) of Spirit Magus at the same time, Origin of Spirit Magus provided by the supported skill +109% Effect\n-30% Sealed Mana Compensation for the supported skill",
      "When having at least 3 type(s) of Spirit Magus at the same time, Origin of Spirit Magus provided by the supported skill +109% Effect\n-30% Sealed Mana Compensation for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Precise: Harmony",
    tags: ["Restoration"],
    description: [
      "Supports Restoration Skills.\nThis skill can only be installed in the fifth Support Skill Slot of each Active Skill.\nGains immunity to Elemental Ailment for 2.1 s after casting the supported skill",
      "Gains immunity to Elemental Ailment for 2.1 s after casting the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Precise: Malleable",
    tags: ["Aura"],
    description: [
      "Supports Aura Skills.\nThe supported skill 20.5% Aura Effect if there is an Elite within 10 m. Otherwise, -15% additional Aura Effect\n-15% Sealed Mana Compensation for the supported skill",
      "The supported skill 20.5% Aura Effect if there is an Elite within 10 m. Otherwise, -15% additional Aura Effect\n-15% Sealed Mana Compensation for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Precise: Protection Field",
    tags: ["Summon", "Spirit Magus"],
    description: [
      "Supports Spirit Magus Skills.\nTransfers 8% of damage taken to the Minions summoned by the supported skill\n-30% Sealed Mana Compensation for the supported skill\nMinions summoned by the supported skill Taunt nearby enemies every 6 s.",
      "Transfers 8% of damage taken to the Minions summoned by the supported skill\n-30% Sealed Mana Compensation for the supported skill\nMinions summoned by the supported skill Taunt nearby enemies every 6 s.",
    ],
  },
  {
    type: "Support",
    name: "Precise: Purify",
    tags: ["Restoration"],
    description: [
      "Supports Restoration Skills.\nThis skill can only be installed in the fifth Support Skill Slot of each Active Skill.\nGains immunity to Wilt and Trauma for 2.1 s after casting the supported skill",
      "Gains immunity to Wilt and Trauma for 2.1 s after casting the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Precise: Safety in Numbers",
    tags: ["Aura"],
    description: [
      "Supports Aura Skills.\n3.1% Aura Effect for each ally affected by the supported skill, up to 7 time(s)\n-12% Sealed Mana Compensation for the supported skill",
      "3.1% Aura Effect for each ally affected by the supported skill, up to 7 time(s)\n-12% Sealed Mana Compensation for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Precise: Seal Conversion",
    tags: [],
    description: [
      "Supports Passive Skill.\nReplaces Sealed Mana of the supported skill with Sealed Life\n-60% additional Sealed Mana Compensation for the supported skill",
      "Replaces Sealed Mana of the supported skill with Sealed Life\n-60% additional Sealed Mana Compensation for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Precise: Selfishness",
    tags: ["Aura"],
    description: [
      "Supports Aura Skills.\nThe supported skill does not take effect on other allies\n20.2% Aura effect for the supported skill\n-12% Sealed Mana Compensation for the supported skill",
      "The supported skill does not take effect on other allies\n20.2% Aura effect for the supported skill\n-12% Sealed Mana Compensation for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Precise: Selfless",
    tags: ["Aura"],
    description: [
      "Supports Aura Skills.\n-90% additional Aura Effect received from the supported skill.\n22.2% Aura effect for the supported skill\n-12% Sealed Mana Compensation for the supported skill",
      "-90% additional Aura Effect received from the supported skill.\n22.2% Aura effect for the supported skill\n-12% Sealed Mana Compensation for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Precise: Stand as One",
    tags: ["Aura"],
    description: [
      "Supports Aura Skills.\nFor every Aura that affects you, the supported skill 4.1% Aura Effect, up to 5 time(s)",
      "For every Aura that affects you, the supported skill 4.1% Aura Effect, up to 5 time(s)",
    ],
  },
  {
    type: "Support",
    name: "Precise: Superpower",
    tags: ["Summon", "Spirit Magus"],
    description: [
      "Supports Spirit Magus Skills.\n48.2% Origin of Spirit Magus effect for the supported skill\n-20% Sealed Mana Compensation for the supported skill",
      "48.2% Origin of Spirit Magus effect for the supported skill\n-20% Sealed Mana Compensation for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Precision Strike",
    tags: ["Area", "Attack", "Melee"],
    description: [
      "Supports Melee Attack Skills.\n-30% Skill Area for the supported skill\n11.5% additional Area Damage for the supported skill\n11.5% additional Ailment Damage for the supported skill\n+10% Attack Speed for the supported skill",
      "-30% Skill Area for the supported skill\n11.5% additional Area Damage for the supported skill\n11.5% additional Ailment Damage for the supported skill\n+10% Attack Speed for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Preparation",
    tags: [],
    description: [
      "Supports Active Skills. Cannot support Channeled Skills or Attack Skills.\nPrepares the supported skill every 9.9 s",
      "Prepares the supported skill every 9.9 s",
    ],
  },
  {
    type: "Support",
    name: "Projectile Penetration",
    tags: ["Projectile", "Horizontal"],
    description: [
      "Supports Horizontal Projectile Skills.\n+2 Horizontal Projectile Penetration(s) of the supported skill\n5.5% additional damage for the supported skill",
      "+2 Horizontal Projectile Penetration(s) of the supported skill\n5.5% additional damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Projectile Split",
    tags: ["Projectile", "Parabolic"],
    description: [
      "Supports Parabolic Projectile Skills.\nWhen casting the supported skill, +50% chance to +2 Split Quantity for the skill\n8.2% additional damage for the supported skill",
      "When casting the supported skill, +50% chance to +2 Split Quantity for the skill\n8.2% additional damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Protection Field",
    tags: ["Summon", "Spirit Magus"],
    description: [
      "Supports Spirit Magus Skills.\nTransfers 5% of damage taken to the Minions summoned by the supported skill\n-30% Sealed Mana Compensation for the supported skill",
      "Transfers 5% of damage taken to the Minions summoned by the supported skill\n-30% Sealed Mana Compensation for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Psychic Burst",
    tags: ["Spell"],
    description: [
      "Supports Spell Skills or skills that can activate Spell Burst.\n+26% additional Hit Damage for skills cast by Spell Burst when Spell Burst is activated by the supported skill\n+16% Cast Speed for the supported skill",
      "+26% additional Hit Damage for skills cast by Spell Burst when Spell Burst is activated by the supported skill\n+16% Cast Speed for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Psychic Surge",
    tags: ["Spell", "Mobility"],
    description: [
      "Supports Mobility Skills.\n0.5% additional Hit Damage for skills cast by Spell Burst during the next 1 Spell Burst(s) activated after casting the supported skill",
      "0.5% additional Hit Damage for skills cast by Spell Burst during the next 1 Spell Burst(s) activated after casting the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Quick Decision",
    tags: [],
    description: [
      "Supports Attack Skills or Spell Skills.\nCannot support Mobility Skills.\n+15% additional Attack and Cast Speed for the supported skill",
      "+15% additional Attack and Cast Speed for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Quick Mobility",
    tags: ["Mobility"],
    description: [
      "Supports Mobility Skills.\n10.5% Attack and Cast Speed for the supported skill\n20.5% Cooldown Recovery Speed for the supported skill",
      "10.5% Attack and Cast Speed for the supported skill\n20.5% Cooldown Recovery Speed for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Quick Return",
    tags: ["Attack", "Melee", "Demolisher"],
    description: [
      "Supports Melee Demolisher Skills.\n+82% Demolisher Charge Restoration Speed for the supported skill\n15.5% additional damage for the supported skill",
      "+82% Demolisher Charge Restoration Speed for the supported skill\n15.5% additional damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Raging Slash",
    tags: ["Attack", "Melee", "Slash-Strike"],
    description: [
      "Supports Melee Slash Strike Skills.\nThe supported skill +21% Steep Strike chance.",
      "The supported skill +21% Steep Strike chance.",
    ],
  },
  {
    type: "Support",
    name: "Reaping Agony",
    tags: [],
    description: [
      "Supports skills that hit enemies or deal Damage Over Time.\nReaps 0.61 s of Damage Over Time when the supported skill deals damage. The effect has a 4 s cooldown against the same target",
      "Reaps 0.61 s of Damage Over Time when the supported skill deals damage. The effect has a 4 s cooldown against the same target",
    ],
  },
  {
    type: "Support",
    name: "Recklessness",
    tags: ["Attack"],
    description: [
      "Supports Attack Skills.\n1% of current Life will be consumed when the supported skill is cast\n+5% Attack Speed for the supported skill\nAdds 5% of Missing Life as Physical Damage to the supported skill; Only has 40% effect on Minion Skills",
      "1% of current Life will be consumed when the supported skill is cast\n+5% Attack Speed for the supported skill\nAdds 5% of Missing Life as Physical Damage to the supported skill; Only has 40% effect on Minion Skills",
    ],
  },
  {
    type: "Support",
    name: "Reclusion",
    tags: ["Defensive"],
    description: [
      "Supports Defensive Skills.\n-50% Duration for the supported skill\nGains a buff: Does not lose Deflection when you are hit while the supported skill lasts. Loses the buff after taking 1 hit(s)",
      "-50% Duration for the supported skill\nGains a buff: Does not lose Deflection when you are hit while the supported skill lasts. Loses the buff after taking 1 hit(s)",
    ],
  },
  {
    type: "Support",
    name: "Recuperation",
    tags: ["Combo"],
    description: [
      "Supports Combo Skills.\n+1 Combo Points gained from Combo Starters for the supported skill\n4.4% additional damage for the supported skill",
      "+1 Combo Points gained from Combo Starters for the supported skill\n4.4% additional damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Refracted Prism",
    tags: ["Spell", "Beam"],
    description: [
      "Supports Beam Skills.\n+2 additional refractions for the supported Beam Skill\n12.5% additional damage for the supported skill\n-10% additional Beam Length for the supported Beam Skill",
      "+2 additional refractions for the supported Beam Skill\n12.5% additional damage for the supported skill\n-10% additional Beam Length for the supported Beam Skill",
    ],
  },
  {
    type: "Support",
    name: "Residues",
    tags: ["Restoration"],
    description: [
      "Supports Restoration Skills.\n+70% Restoration Duration for the supported skill\nThe Restoration Effect from supported skills cannot be removed",
      "+70% Restoration Duration for the supported skill\nThe Restoration Effect from supported skills cannot be removed",
    ],
  },
  {
    type: "Support",
    name: "Restoration Charge",
    tags: ["Restoration"],
    description: [
      "Supports Restoration Skills.\n+1 Max Charges for the supported skill\nWhen casting the supported skill, gains 5% of the skill's Charging Progress",
      "+1 Max Charges for the supported skill\nWhen casting the supported skill, gains 5% of the skill's Charging Progress",
    ],
  },
  {
    type: "Support",
    name: "Restrain",
    tags: [],
    description: [
      "Supports Passive Skill.\n0.5% Sealed Mana Compensation for the supported skill",
      "0.5% Sealed Mana Compensation for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Savage Growth",
    tags: ["Summon", "Spirit Magus"],
    description: [
      "Supports skills that summon Spirit Magus.\n0.012% additional damage for every 1 point(s) of Growth Minions summoned by the supported skill have\nGains a buff when Minions summoned by the supported skill cast skills 8 time(s). Lasts 5 s. You will not receive another buff while the buff is active\nWhile a buff is active, Spirit Magi +150 initial Growth. The buff will reduce to +60 in 5s",
      "0.012% additional damage for every 1 point(s) of Growth Minions summoned by the supported skill have\nGains a buff when Minions summoned by the supported skill cast skills 8 time(s). Lasts 5 s. You will not receive another buff while the buff is active",
    ],
  },
  {
    type: "Support",
    name: "Scattershot Beam",
    tags: ["Spell", "Beam"],
    description: [
      "Supports Beam Skills.\n+2 additional Beams for the supported Beam Skill\n+2% additional damage for the supported skill",
      "+2 additional Beams for the supported Beam Skill\n+2% additional damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Seal Conversion",
    tags: [],
    description: [
      "Supports Passive Skill.\nReplaces Sealed Mana of the supported skill with Sealed Life\n-70% additional Sealed Mana Compensation for the supported skill",
      "Replaces Sealed Mana of the supported skill with Sealed Life\n-70% additional Sealed Mana Compensation for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Sentry Modification",
    tags: ["Spell", "Sentry"],
    description: [
      "Supports Sentry Skills.\n+1 Sentries that can be deployed at a time by the supported skill\n15.5% additional Cast Frequency for Sentries deployed by the supported skill",
      "+1 Sentries that can be deployed at a time by the supported skill\n15.5% additional Cast Frequency for Sentries deployed by the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Servant Damage",
    tags: ["Summon"],
    description: [
      "Supports skills that summon Minions.\n15.5% additional damage for Minions summoned by the supported skill",
      "15.5% additional damage for Minions summoned by the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Servant Life",
    tags: ["Summon"],
    description: [
      "Supports skills that summon Minions.\n42.5% additional Life for Minions summoned by the supported skill",
      "42.5% additional Life for Minions summoned by the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Shortened Duration",
    tags: ["Persistent"],
    description: [
      "Supports DoT Skills and skills that can inflict Ailment.\n-10% Duration for the supported skill\n+20% additional Damage Over Time for the supported skill",
      "-10% Duration for the supported skill\n+20% additional Damage Over Time for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Slow Projectile",
    tags: ["Projectile"],
    description: [
      "Supports Projectile Skills.\n-30% additional Projectile Speed for the supported skill\n19.5% additional damage for the supported skill",
      "-30% additional Projectile Speed for the supported skill\n19.5% additional damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Spell Concentration",
    tags: ["Spell", "Area"],
    description: [
      "Supports Area Spell Skills.\n-30% Skill Area for the supported skill\n22.5% additional damage for the supported skill",
      "-30% Skill Area for the supported skill\n22.5% additional damage for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Steamroll",
    tags: ["Attack", "Melee", "Area"],
    description: [
      "Supports Melee Attack Skills.\n+31% additional Melee Damage for the supported skill\n+31% additional Ailment Damage for the supported skill\n-15% Attack Speed for the supported skill",
      "+31% additional Melee Damage for the supported skill\n+31% additional Ailment Damage for the supported skill\n-15% Attack Speed for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Tendonslicer",
    tags: ["Physical"],
    description: [
      "Supports skills that deal damage.\n7.5% additional Physical Damage for the supported skill\nWhen the supported skill deals damage, there is a 40% chance to inflict a debuff: +10% damage taken by the enemy from the supported skill for 2 s",
      "7.5% additional Physical Damage for the supported skill\nWhen the supported skill deals damage, there is a 40% chance to inflict a debuff: +10% damage taken by the enemy from the supported skill for 2 s",
    ],
  },
  {
    type: "Support",
    name: "Terrain of Malice",
    tags: ["Curse"],
    description: [
      "Supports Curse Skills.\nThe supported Curse Skill becomes an instant-cast skill. Upon being cast, it inflicts its Curse Effect persistently on enemies within an area centered around the caster. The Duration of the area is equal to the Duration of the Curse Effect of the supported skill. CD of the supported skill is changed to 8s\n+210% additional Skill Area for the supported skill",
      "The supported Curse Skill becomes an instant-cast skill. Upon being cast, it inflicts its Curse Effect persistently on enemies within an area centered around the caster. The Duration of the area is equal to the Duration of the Curse Effect of the supported skill. CD of the supported skill is changed to 8s\n+210% additional Skill Area for the supported skill",
    ],
  },
  {
    type: "Support",
    name: "Well-Fought Battle",
    tags: ["Empower"],
    description: [
      "Supports Empower Skills. Cannot support Summon Skills.\nThe supported skill 5.25% Effect every time it is cast, up to 3 time(s)",
      "The supported skill 5.25% Effect every time it is cast, up to 3 time(s)",
    ],
  },
  {
    type: "Support",
    name: "Willpower",
    tags: [],
    description: [
      "Supports Attack and Spell Skills.\nWhile standing still, gains 1 stack of buff when using the supported skill. Stacks up to 6 time(s)\nThe buff lasts for another 0.5 s after you start moving\n+6% additional damage for the supported skill for every stack of buffs while standing still (multiplies)",
      "While standing still, gains 1 stack of buff when using the supported skill. Stacks up to 6 time(s)\nThe buff lasts for another 0.5 s after you start moving",
    ],
  },
  {
    type: "Support",
    name: "Wind Projectiles",
    tags: ["Projectile"],
    description: [
      "Supports Projectile Skills.\n+20% Projectile Speed for the supported skill\n15.5% additional damage for the supported skill",
      "+20% Projectile Speed for the supported skill\n15.5% additional damage for the supported skill",
    ],
  },
];
