import type { BasePassiveSkill } from "./types";

export const PassiveSkills = [
  {
    type: "Passive",
    name: "Acuteness Focus",
    tags: ["Area", "Focus", "Physical", "Attack"],
    description: [
      "Activates Focus and gains a buff:\n13.5% additional Physical Damage\n+25% chance to inflict Trauma\nAdds 5 Base Trauma Damage\nThis skill gains 25 Focus Pts on Melee hits. Interval: 1/5s. Upon reaching 100 Focus Pts, the next Melee hit consumes all Focus Pts and casts Acute Strike on the enemy, dealing 479% Weapon Attack Damage to all enemies within a certain area",
      "Activates Focus and gains a buff:\n13.5% additional Physical Damage\n+25% chance to inflict Trauma\nAdds 5 Base Trauma Damage\nThis skill gains 25 Focus Pts on Melee hits. Interval: 0.2 s\nAfter this skill reaches 100 Focus Pts, the next Melee hit consumes 100 Focus Pts and triggers this skill on up to 4 enemies within 5m of the target hit. Generates Spikes within a rectangular area, dealing Physical Attack Damage",
      "Acute Strike:\nDeals 479% Weapon Attack Damage.",
    ],
    mainStats: ["str"],
  },
  {
    type: "Passive",
    name: "Charged Flames",
    tags: ["Aura", "Area", "Fire"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n16% additional Fire Damage.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+35% additional Fire Damage",
    ],
  },
  {
    type: "Passive",
    name: "Corrosion Focus",
    tags: ["Area", "Focus", "Erosion", "Persistent", "Spell", "Projectile"],
    description: [
      "Activates Focus and gains a buff:\n13.5% additional Erosion Damage\n+25% Wilt chance\nAdds 2 Base Wilt Damage\nEvery 1/10s, this skill gains 13/2 Focus Pts. Upon reaching 100 Focus Pts, casting other skills will launch a Corrosion Orb that tracks enemies. When the Corrosion Orb is active, casting other skills will consume 50 Focus Pts and make the orb explode once, dealing 648 - 648 Spell Erosion Damage to enemies. Interval: 3/20s.",
      "The orb is destroyed when Focus Pts drop to 0, its duration expires (2s), or it is 30m away from the character. Orb Quantity is not affected by Projectile Quantity.",
      "Activates Focus and gains a buff:\n13.5% additional Erosion Damage\n+25% Wilt chance\nAdds 2 Base Wilt Damage",
      "Corrosion Focus:\nEvery 0.1 s, the skill gains 6.5 Focus Pts\nAfter this skill reaches 100 Focus Pts, if the Corrosion Orb no longer exists, using an Active Skill will trigger this skill on an enemy\nWhen Corrosion Orb is active, casting other skills will consume 50 Focus Pts and make it deal Area Damage once. Interval: 0.15 s",
      "Corrosion Orb:\nDeals 648-648 Spell Erosion Damage\nProjectile Duration: 2s",
    ],
    mainStats: ["int"],
    levelValues: {
      erosionDmgPct: [
        7.8, 8.1, 8.4, 8.7, 9, 9.3, 9.6, 9.9, 10.2, 10.5, 10.8, 11.1, 11.4,
        11.7, 12, 12.3, 12.6, 12.9, 13.2, 13.5, 13.8, 14.1, 14.4, 14.7, 15,
        15.3, 15.6, 15.9, 16.2, 16.5, 16.8, 17.1, 17.4, 17.7, 18, 18.3, 18.6,
        18.9, 19.2, 19.5,
      ],
      inflictWiltPct: [
        15.5, 16, 16.5, 17, 17.5, 18, 18.5, 19, 19.5, 20, 20.5, 21, 21.5, 22,
        22.5, 23, 23.5, 24, 24.5, 25, 25.5, 26, 26.5, 27, 27.5, 28, 28.5, 29,
        29.5, 30, 30.5, 31, 31.5, 32, 32.5, 33, 33.5, 34, 34.5, 35,
      ],
      BaseWiltFlatDmg: [
        2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
        2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      ],
    },
  },
  {
    type: "Passive",
    name: "Cruelty",
    tags: ["Aura", "Area", "Attack"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n9.5% additional Attack Damage.\nGains 1 stack(s) of buffs upon defeating an enemy. 40% chance to gain 5 stack(s) of buffs when hitting an Elite, 5/2% additional Aura Effect per stack of the buff for 4s. Stacks up to 40 time(s) (Not affected by Aura Effects).",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+19% additional Attack Damage\nGains 1 stack(s) of buffs upon defeating an enemy. +40% chance to gain 5 stack(s) of buffs when hitting an Elite\n2.5% additional Aura Effect per stack of the buff for 4 s. Stacks up to 40 time(s) (Not affected by Aura Effects)",
    ],
  },
  {
    type: "Passive",
    name: "Deep Pain",
    tags: ["Aura", "Area"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n15% additional Damage Over Time.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+34% additional Damage Over Time",
    ],
    levelValues: {
      dotDmgPct: [
        15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
        33, 34, 35, 35.5, 36, 36.5, 37, 37.5, 38, 38.5, 39, 39.5, 40, 40.5, 41,
        41.5, 42, 42.5, 43, 43.5, 44, 44.5,
      ],
    },
  },
  {
    type: "Passive",
    name: "Domain Expansion",
    tags: ["Aura", "Area"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n14% additional Area Damage and Ailment Damage dealt by Area Skills. 20% Skill Area when at least 8 enemies are within 10m.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+33% additional Area Damage\n+33% additional Ailment Damage dealt by Area Skills\n+20% Skill Area when there are at least 8 enemies within 10 m",
    ],
  },
  {
    type: "Passive",
    name: "Electric Conversion",
    tags: ["Aura", "Area", "Lightning"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n15% additional Lightning Damage.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+34% additional Lightning Damage",
    ],
    levelValues: {
      lightningDmgPct: [
        15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
        33, 34, 35, 35.5, 36, 36.5, 37, 37.5, 38, 38.5, 39, 39.5, 40, 40.5, 41,
        41.5, 42, 42.5, 43, 43.5, 44, 44.5,
      ],
    },
  },
  {
    type: "Passive",
    name: "Elemental Resistance",
    tags: ["Aura", "Area", "Fire", "Cold", "Lightning"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n-12% additional Elemental Damage taken and 8.1% Elemental Resistance.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+10% Elemental Resistance\n-12% additional Elemental Damage taken",
    ],
  },
  {
    type: "Passive",
    name: "Energy Fortress",
    tags: ["Aura", "Area"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n67 Max Energy Shield, and 3.2% additional Max Energy Shield.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n319.7 Max Energy Shield\n13.37% additional Max Energy Shield",
    ],
  },
  {
    type: "Passive",
    name: "Erosion Amplification",
    tags: ["Aura", "Area", "Erosion"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n15% additional Erosion Damage.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+34% additional Erosion Damage",
    ],
    levelValues: {
      erosionDmgPct: [
        15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
        33, 34, 35, 35.5, 36, 36.5, 37, 37.5, 38, 38.5, 39, 39.5, 40, 40.5, 41,
        41.5, 42, 42.5, 43, 43.5, 44, 44.5,
      ],
    },
  },
  {
    type: "Passive",
    name: "Fearless",
    tags: ["Aura", "Area", "Melee"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\nMelee Skills 60% Critical Strike Rating, and 10% additional damage.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+79% Critical Strike Rating for Melee Skills\n+29% additional Melee Skill Damage",
    ],
  },
  {
    type: "Passive",
    name: "Flame Focus",
    tags: ["Area", "Focus", "Fire", "Spell"],
    description: [
      "Activates Focus and gains a buff:\n+7% additional Fire Damage\n+25% chance to Ignite targets\nAdds 2 Base Ignite Damage\nThis skill gains 12 Focus Pts when inflicting Ignite. Upon defeating an enemy, there is a 100% chance to consume 40 Focus Pts and trigger this skill on the enemy, dealing Secondary Fire Damage equal to 4% of their Max Life to enemies within 3m (not affected by bonuses).\nAdditionally increases this skill's area for each time Ignite has been inflicted recently.",
      "Activates Focus and gains a buff:\n+7% additional Fire Damage\n+25% chance to Ignite targets\nAdds 2 Base Ignite Damage",
      "Flame Focus:\nThis skill gains 12 Focus Pts when inflicting Ignite. This skill can be triggered up to 3 time(s) every 0.5 s\nUpon defeating an enemy, there is a 100% chance to consume 40 Focus Pts of the skill and trigger this skill at the location of the defeated enemy, dealing Secondary Fire Damage equal to 4% of the defeated enemy's Max Life (not affected by bonuses)\n+10% additional Skill Area for every time Ignite was inflicted recently. Stacks up to 6 time(s)",
    ],
    mainStats: ["str", "int"],
  },
  {
    type: "Passive",
    name: "Frigid Domain",
    tags: ["Aura", "Area", "Cold"],
    description: [
      "Activates the Aura, and enemies within 12m gain the following debuff:\n18% additional Cold Damage taken.",
      "Activates the Aura, and enemies within 12m gain the following debuff:\n+37% additional Cold Damage against enemies affected by the skill",
    ],
    levelValues: {
      coldDmgPct: [
        18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
        36, 37, 38, 38.5, 39, 39.5, 40, 40.5, 41, 41.5, 42, 42.5, 43, 43.5, 44,
        44.5, 45, 45.5, 46, 46.5, 47, 47.5,
      ],
    },
  },
  {
    type: "Passive",
    name: "Ice Focus",
    tags: ["Area", "Spell", "Focus", "Cold"],
    description: [
      "Activates Focus and gains a buff:\n13.5% additional Cold Damage\n+45% chance to inflict Frostbite\nGains 30 Focus Pts when dealing damage to Frostbitten enemies. Interval: 0.4 s.\nUpon reaching 100 Focus Pts, creates an Ice Storm that follows the character, inflicting Frostbite on enemies caught within it. When there are enemies inside the storm, consumes 45 Focus Pts and generates Glacial Spikes that deal Spell Cold Damage to the enemies every 0.5 s.\nFor every 1% Focus Speed, +1% Focus Pts gained, up to +200%. The Ice Storm ends when Focus Pts drop to 0.",
      "Activates Focus and gains a buff:\n13.5% additional Cold Damage\n+45% chance to inflict Frostbite\nGains 30 Focus Pts when dealing damage to Frostbitten enemies. Interval: 0.4 s.\nUpon reaching 100 Focus Pts, creates an Ice Storm that follows the character, inflicting Frostbite on enemies caught within it. When there are enemies inside the storm, consumes 45 Focus Pts and generates Glacial Spikes that deal Spell Cold Damage to the enemies every 0.5 s.\nFor every 1% Focus Speed, +1% Focus Pts gained, up to +200%. The Ice Storm ends when Focus Pts drop to 0.",
      "Glacial Spike:\nDeals 467-701 Spell Cold Damage.",
    ],
    mainStats: ["int"],
  },
  {
    type: "Passive",
    name: "Magical Source",
    tags: ["Aura", "Area"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n5 Mana Regeneration per Second.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+140 Mana regeneration per second",
    ],
  },
  {
    type: "Passive",
    name: "Nimbleness",
    tags: ["Aura", "Area"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n2200 Evasion. 0.5% additional Evasion.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+6000 Evasion\n+10% additional Evasion",
    ],
  },
  {
    type: "Passive",
    name: "Precise: Acuteness Focus",
    tags: ["Area", "Focus", "Physical", "Attack"],
    description: [
      "Activates Focus and gains a buff:\n15.6% additional Physical Damage\n+35% chance to inflict Trauma\nAdds 5 Base Trauma Damage\nThis skill gains 25 Focus Pts on Melee hits. Interval: 1/5s. Upon reaching 100 Focus Pts, the next Melee hit consumes all Focus Pts and casts Acute Strike on the enemy, dealing 479% Weapon Attack Damage to all enemies within a certain area",
      "Activates Focus and gains a buff:\n15.6% additional Physical Damage\n+35% chance to inflict Trauma\nAdds 5 Base Trauma Damage\nThis skill gains 25 Focus Pts on Melee hits. Interval: 0.2 s\nAfter this skill reaches 100 Focus Pts, the next Melee hit consumes 100 Focus Pts and triggers this skill on up to 4 enemies within 5m of the target hit. Generates Spikes within a rectangular area, dealing Physical Attack Damage\n+4% additional damage for this skill",
      "Acute Strike:\nDeals 479% Weapon Attack Damage.",
    ],
    mainStats: ["str"],
  },
  {
    type: "Passive",
    name: "Precise: Charged Flames",
    tags: ["Aura", "Area", "Fire"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n20% additional Fire Damage.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+39% additional Fire Damage",
    ],
  },
  {
    type: "Passive",
    name: "Precise: Corrosion Focus",
    tags: ["Area", "Focus", "Erosion", "Persistent", "Spell", "Projectile"],
    description: [
      "Activates Focus and gains a buff:\n15.6% additional Erosion Damage\n+35% Wilt chance\nAdds 2 Base Wilt Damage\nEvery 1/10s, this skill gains 13/2 Focus Pts. Upon reaching 100 Focus Pts, casting other skills will launch a Corrosion Orb that tracks enemies. When the Corrosion Orb is active, casting other skills will consume 50 Focus Pts and make the orb explode once, dealing 648 - 648 Spell Erosion Damage to enemies. Interval: 3/20s.",
      "The orb is destroyed when Focus Pts drop to 0, its duration expires (2s), or it is 30m away from the character. Orb Quantity is not affected by Projectile Quantity.",
      "Activates Focus and gains a buff:\n15.6% additional Erosion Damage\n+35% Wilt chance\nAdds 2 Base Wilt Damage",
      "Corrosion Focus:\nEvery 0.1 s, the skill gains 6.5 Focus Pts\nAfter this skill reaches 100 Focus Pts, if the Corrosion Orb no longer exists, using an Active Skill will trigger this skill on an enemy\nWhen Corrosion Orb is active, casting other skills will consume 50 Focus Pts and make it deal Area Damage once. Interval: 0.15 s\n+4% additional damage for this skill",
      "Corrosion Orb:\nDeals 648-648 Spell Erosion Damage\nProjectile Duration: 2s",
    ],
    mainStats: ["int"],
  },
  {
    type: "Passive",
    name: "Precise: Cruelty",
    tags: ["Aura", "Area", "Attack"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n12.5% additional Attack Damage.\nGains 1 stack(s) of buffs upon defeating an enemy. 40% chance to gain 5 stack(s) of buffs when hitting an Elite, 5/2% additional Aura Effect per stack of the buff for 8s. Stacks up to 40 time(s) (Not affected by Aura Effects).",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+22% additional Attack Damage\nGains 1 stack(s) of buffs upon defeating an enemy. +40% chance to gain 5 stack(s) of buffs when hitting an Elite\n2.5% additional Aura Effect per stack of the buff for 8 s. Stacks up to 40 time(s) (Not affected by Aura Effects)",
    ],
    levelValues: {
      attackDmgPct: [
        12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18, 18.5, 19,
        19.5, 20, 20.5, 21, 21.5, 22, 22.5, 22.75, 23, 23.25, 23.5, 23.75, 24,
        24.25, 24.5, 24.75, 25, 25.25, 25.5, 25.75, 26, 26.25, 26.5, 26.75, 27,
        27.25,
      ],
      auraEffPctPerCrueltyStack: [
        2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5,
        2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5,
        2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5,
      ],
    },
  },
  {
    type: "Passive",
    name: "Precise: Deep Pain",
    tags: ["Aura", "Area"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n21% additional Damage Over Time and 30 Affliction Per Second.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+40% additional Damage Over Time\n+30 Affliction inflicted per second",
    ],
    levelValues: {
      dotDmgPct: [
        21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
        39, 40, 41, 41.5, 42, 42.5, 43, 43.5, 44, 44.5, 45, 45.5, 46, 46.5, 47,
        47.5, 48, 48.5, 49, 49.5, 50, 50.5,
      ],
      afflictionPerSec: [
        30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
        30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
        30, 30, 30, 30,
      ],
    },
  },
  {
    type: "Passive",
    name: "Precise: Domain Expansion",
    tags: ["Aura", "Area"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n14% additional Area Damage and Ailment Damage dealt by Area Skills. 20% Skill Area and 4% additional Area Damage when at least 5 enemies are within 10m.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+33% additional Area Damage\n+33% additional Ailment Damage dealt by Area Skills\n+20% Skill Area when there are at least 5 enemies within 10 m\n+4% additional Area Damage when there are at least 5 enemies within 10 m\n+4% additional Ailment Damage dealt by Area Skills when there are at least 5 enemies within 10 m",
    ],
  },
  {
    type: "Passive",
    name: "Precise: Electric Conversion",
    tags: ["Aura", "Area", "Lightning"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n21% additional Lightning Damage.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+40% additional Lightning Damage",
    ],
  },
  {
    type: "Passive",
    name: "Precise: Elemental Resistance",
    tags: ["Aura", "Area", "Fire", "Cold", "Lightning"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n-14% additional Elemental Damage taken, 8.1% Elemental Resistance, and 15% chance to avoid Elemental Ailment.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+10% Elemental Resistance\n-14% additional Elemental Damage taken\n+15% chance to avoid Elemental Ailments",
    ],
  },
  {
    type: "Passive",
    name: "Precise: Energy Fortress",
    tags: ["Aura", "Area"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n67 Max Energy Shield, and 7.9% additional Max Energy Shield.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n319.7 Max Energy Shield\n17.97% additional Max Energy Shield",
    ],
  },
  {
    type: "Passive",
    name: "Precise: Erosion Amplification",
    tags: ["Aura", "Area", "Erosion"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n21% additional Erosion Damage.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+40% additional Erosion Damage",
    ],
    levelValues: {
      erosionDmgPct: [
        21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
        39, 40, 41, 41.5, 42, 42.5, 43, 43.5, 44, 44.5, 45, 45.5, 46, 46.5, 47,
        47.5, 48, 48.5, 49, 49.5, 50, 50.5,
      ],
    },
  },
  {
    type: "Passive",
    name: "Precise: Fearless",
    tags: ["Aura", "Area", "Melee"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\nMelee Skills 60% Critical Strike Rating, 10% additional damage, and 8% Attack Speed.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+79% Critical Strike Rating for Melee Skills\n+29% additional Melee Skill Damage\n+8% Melee Attack Speed",
    ],
  },
  {
    type: "Passive",
    name: "Precise: Flame Focus",
    tags: ["Area", "Focus", "Fire", "Spell"],
    description: [
      "Activates Focus and gains a buff:\n+9% additional Fire Damage\n+35% chance to Ignite targets\nAdds 2 Base Ignite Damage\nThis skill gains 12 Focus Pts when inflicting Ignite. Upon defeating an enemy, there is a 100% chance to consume 40 Focus Pts and trigger this skill on the enemy, dealing Secondary Fire Damage equal to 4% of their Max Life to enemies within 3m (not affected by bonuses).\nAdditionally increases this skill's area for each time Ignite has been inflicted recently.",
      "Activates Focus and gains a buff:\n+9% additional Fire Damage\n+35% chance to Ignite targets\nAdds 2 Base Ignite Damage",
      "Flame Focus:\nThis skill gains 12 Focus Pts when inflicting Ignite. This skill can be triggered up to 3 time(s) every 0.5 s\nUpon defeating an enemy, there is a 100% chance to consume 40 Focus Pts of the skill and trigger this skill at the location of the defeated enemy, dealing Secondary Fire Damage equal to 4% of the defeated enemy's Max Life (not affected by bonuses)\n+10% additional Skill Area for every time Ignite was inflicted recently. Stacks up to 6 time(s)\n+4% additional damage for this skill",
    ],
    mainStats: ["str", "int"],
  },
  {
    type: "Passive",
    name: "Precise: Frigid Domain",
    tags: ["Aura", "Area", "Cold"],
    description: [
      "Activates the Aura, and enemies within 12m gain the following debuff:\n25% additional Cold Damage taken.",
      "Activates the Aura, and enemies within 12m gain the following debuff:\n+44% additional Cold Damage against enemies affected by the skill",
    ],
    levelValues: {
      coldDmgPct: [
        25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42,
        43, 44, 45, 45.5, 46, 46.5, 47, 47.5, 48, 48.5, 49, 49.5, 50, 50.5, 51,
        51.5, 52, 52.5, 53, 53.5, 54, 54.5,
      ],
    },
  },
  {
    type: "Passive",
    name: "Precise: Ice Focus",
    tags: ["Area", "Spell", "Focus", "Cold"],
    description: [
      "Activates Focus and gains a buff:\n15.6% additional Cold Damage\n+55% chance to inflict Frostbite\nGains 30 Focus Pts when dealing damage to Frostbitten enemies. Interval: 0.4 s.\nUpon reaching 100 Focus Pts, creates an Ice Storm that follows the character, inflicting Frostbite on enemies caught within it. When there are enemies inside the storm, consumes 45 Focus Pts and generates Glacial Spikes that deal Spell Cold Damage to the enemies every 0.5 s.\nFor every 1% Focus Speed, +1% Focus Pts gained, up to +200%. The Ice Storm ends when Focus Pts drop to 0.\n+4% additional damage for this skill",
      "Activates Focus and gains a buff:\n15.6% additional Cold Damage\n+55% chance to inflict Frostbite\nGains 30 Focus Pts when dealing damage to Frostbitten enemies. Interval: 0.4 s.\nUpon reaching 100 Focus Pts, creates an Ice Storm that follows the character, inflicting Frostbite on enemies caught within it. When there are enemies inside the storm, consumes 45 Focus Pts and generates Glacial Spikes that deal Spell Cold Damage to the enemies every 0.5 s.\nFor every 1% Focus Speed, +1% Focus Pts gained, up to +200%. The Ice Storm ends when Focus Pts drop to 0.\n+4% additional damage for this skill",
      "Glacial Spike:\nDeals 467-701 Spell Cold Damage.",
    ],
    mainStats: ["int"],
  },
  {
    type: "Passive",
    name: "Precise: Magical Source",
    tags: ["Aura", "Area"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n5 Mana Regeneration per Second. 15% Mana Regeneration Speed.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+140 Mana regeneration per second\n+15% Mana Regeneration Speed",
    ],
  },
  {
    type: "Passive",
    name: "Precise: Nimbleness",
    tags: ["Aura", "Area"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n2200 Evasion. 10.5% additional Evasion.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+6000 Evasion\n+20% additional Evasion",
    ],
  },
  {
    type: "Passive",
    name: "Precise: Precise Projectiles",
    tags: ["Aura", "Area", "Projectile"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n20% additional Projectile Damage, 20% additional Ailment Damage by Projectiles, and 10% Projectile Speed.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+39% additional Projectile Damage\n+39% additional Ailment Damage dealt by Projectiles\n+10% Projectile Speed",
    ],
  },
  {
    type: "Passive",
    name: "Precise: Radical Order",
    tags: ["Aura", "Area", "Summon"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n21% additional Minion Damage, 50% Minion Aggressiveness and 10% additional Minion Max Life (Not affected by Aura Effects).",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+40% additional Minion Damage\n+50% Minion Aggressiveness (Not affected by Aura Effects)\n+10% additional Minion Max Life (Not affected by Aura Effects)",
    ],
  },
  {
    type: "Passive",
    name: "Precise: Rejuvenation",
    tags: ["Aura", "Area"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n2 Life Restoration per Second, and 5% Life Restoration Speed",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+95 Life Regeneration per second\n+5% life restoration speed",
    ],
  },
  {
    type: "Passive",
    name: "Precise: Spell Amplification",
    tags: ["Aura", "Area", "Spell"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n21% additional damage for Spell Skills.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+40% additional Spell Damage",
    ],
  },
  {
    type: "Passive",
    name: "Precise: Steadfast",
    tags: ["Aura", "Area"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n2200 Armor and 10.5% additional Armor.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+6000 Armor\n+20% additional Armor",
    ],
  },
  {
    type: "Passive",
    name: "Precise: Swiftness",
    tags: ["Aura", "Area"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n11% Movement Speed.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n20.5% Movement Speed",
    ],
  },
  {
    type: "Passive",
    name: "Precise: Thunder Focus",
    tags: ["Area", "Focus", "Lightning", "Attack"],
    description: [
      "Activates Focus and gains a buff:\n15.6% additional Lightning Damage\n+35% Numbed chance\nFor every 2m moved, this skill gains 5 Focus Pts. Upon reaching 100 Focus Pts, using a non-Mobility Attack Skill will consume all Focus Pts and trigger this skill, summoning a Thunderstrike that deals 1109% Weapon Attack Damage to all enemies within a certain area.\nWhen triggered by a Melee Skill, the Thunderstrike attacks a fan-shaped area. When triggered by a Ranged Skill, the Thunderstrike attacks a square-shaped area.",
      "Activates Focus and gains a buff:\n15.6% additional Lightning Damage\n+35% Numbed chance",
      "Thunder Focus:\nConverts 100% of the skill's Physical Damage to Lightning Damage\nFor every 2 m moved, the skill gains 5 Focus Pts\nAfter this skill reaches 100 Focus Pts, using a non-Mobility Attack Skill will consume 100 Focus Pts and trigger this skill in front of you\n+4% additional damage for this skill\n-60% additional Ailment Damage for the skill",
      "Thunderstrike:\nDeals 1109% Weapon Attack Damage.",
    ],
    mainStats: ["dex"],
  },
  {
    type: "Passive",
    name: "Precise: Weapon Amplification",
    tags: ["Aura", "Area", "Physical"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n15% additional Physical Damage. 30% chance to inflict Paralysis on hit.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+34% additional Physical Damage\n+30% chance to inflict Paralysis on hit",
    ],
  },
  {
    type: "Passive",
    name: "Precise Projectiles",
    tags: ["Aura", "Area", "Projectile"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n16% additional Projectile Damage, 16% additional Ailment Damage by Projectiles, and 10% Projectile Speed.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+35% additional Projectile Damage\n+35% additional Ailment Damage dealt by Projectiles\n+10% Projectile Speed",
    ],
  },
  {
    type: "Passive",
    name: "Radical Order",
    tags: ["Aura", "Area", "Summon"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n16% additional Minion Damage and 25% Minion Aggressiveness.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+35% additional Minion Damage\n+25% Minion Aggressiveness (Not affected by Aura Effects)",
    ],
  },
  {
    type: "Passive",
    name: "Rejuvenation",
    tags: ["Aura", "Area"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n2 Life Regeneration per Second.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+95 Life Regeneration per second",
    ],
  },
  {
    type: "Passive",
    name: "Spell Amplification",
    tags: ["Aura", "Area", "Spell"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n15% additional damage for Spell Skills.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+34% additional Spell Damage",
    ],
    levelValues: {
      spellDmgPct: [
        15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
        33, 34, 35, 35.5, 36, 36.5, 37, 37.5, 38, 38.5, 39, 39.5, 40, 40.5, 41,
        41.5, 42, 42.5, 43, 43.5, 44, 44.5,
      ],
    },
  },
  {
    type: "Passive",
    name: "Steadfast",
    tags: ["Aura", "Area"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n2200 Armor and 0.5% additional Armor.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+6000 Armor\n+10% additional Armor",
    ],
  },
  {
    type: "Passive",
    name: "Summon Erosion Magus",
    tags: ["Spell", "Summon", "Erosion", "Spirit Magus"],
    description: [
      "Activates the skill and summons 1 Erosion Magus.\nActivating the skill grants the character Origin of Spirit Magus: -6.3% additional Damage Over Time taken (Up to additional -50%).",
      "Summon Erosion Magus:\nSummons 1 Erosion Magus\nThis skill summons up to 1 Minions\nSpirit Magi become undefeatable\nWhen Spirit Magi become undefeatable, they gain Reconjuring\nConverts 100% of Physical Damage to Erosion Damage for Spirit Magi",
      "Origin of Spirit Magus:\n-9.15% additional Damage Over Time taken, up to -50% additional damage",
      "Erosion Magus:\nBase Skill: Scattered Mud\nEmpower Skill: Withering Payback\nEnhanced Skill: Bleak Grass\nUltimate: World of Thorns",
    ],
    mainStats: ["int"],
  },
  {
    type: "Passive",
    name: "Summon Fire Magus",
    tags: ["Spell", "Summon", "Fire", "Spirit Magus"],
    description: [
      "Activates the skill and summons 1 Fire Magus.\nActivating the skill grants the character Origin of Spirit Magus: 58 Critical Strike Rating.",
      "Summon Fire Magus:\nSummons 1 Fire Magus\nThis skill summons up to 1 Minions\nSpirit Magi become undefeatable\nWhen Spirit Magi become undefeatable, they gain Reconjuring",
      "Origin of Spirit Magus:\nGains Origin of Fire, giving the summoner +115 Attack and Spell Critical Strike Rating",
      "Fire Magus:\nBase Skill: Blazing Dance.\nEmpower Skill: Blazing Spin.\nEnhanced Skill: Blazing Incineration.\nUltimate: Rising Molten.",
    ],
    mainStats: ["str", "int"],
  },
  {
    type: "Passive",
    name: "Summon Frost Magus",
    tags: ["Spell", "Summon", "Cold", "Spirit Magus"],
    description: [
      "Activates the skill and summons 1 Frost Magus.\nActivating the skill grants the character Origin of Spirit Magus: Restores 2.4% Max Life and Max Energy Shield every second.",
      "Summon Frost Magus:\nSummons 1 Frost Magus\nThis skill summons up to 1 Minions\nSpirit Magi become undefeatable\nWhen Spirit Magi become undefeatable, they gain Reconjuring",
      "Origin of Spirit Magus:\nGains Origin of Ice, restoring 3.825% of Max Life and Max Energy Shield per second to the summoner",
      "Frost Magus:\nBase Skill: Glacier Ripples.\nEmpower Skill: Frost Release.\nEnhanced Skill: Permafrost Cast.\nUltimate: Ice Earthshaker.",
    ],
    mainStats: ["int"],
  },
  {
    type: "Passive",
    name: "Summon Rock Magus",
    tags: ["Spell", "Summon", "Physical", "Spirit Magus"],
    description: [
      "Activates the skill and summons 1 Rock Magus.\nActivating the skill grants the character Origin of Spirit Magus: -5.2% additional Hit Damage taken (Up to additional -50%).",
      "Summon Rock Magus:\nSummons 1 Rock Magus\nThis skill summons up to 1 Minions\nSpirit Magi become undefeatable\nWhen Spirit Magi become undefeatable, they gain Reconjuring",
      "Origin of Spirit Magus:\n-8.05% additional Hit Damage taken, up to -50% additional damage",
      "Rock Magus:\nBase Skill: Shattered Stone\nEmpower Skill: Gold Rush\nEnhanced Skill: Rock Blast\nUltimate: Towering Mountains",
    ],
    mainStats: ["str", "int"],
  },
  {
    type: "Passive",
    name: "Summon Thunder Magus",
    tags: ["Spell", "Summon", "Lightning", "Spirit Magus"],
    description: [
      "Activates the skill and summons 1 Thunder Magus.\nActivating the skill grants the character Origin of Spirit Magus: 6% additional Attack and Cast Speed and 2.5% additional damage.",
      "Summon Thunder Magus:\nSummons 1 Thunder Magus.\nThis skill summons up to 1 Minions\nSpirit Magi become undefeatable\nWhen Spirit Magi become undefeatable, they gain Reconjuring\nConverts 100% of Spirit Magi's Physical Damage to Lightning Damage.",
      "Origin of Spirit Magus:\nGains Origin of Thunder: +6% additional Attack and Cast Speed and 7.25% additional damage to the summoner",
      "Thunder Magus:\nBase Skill: Lightning Star.\nEmpower Skill: Thundercloud Surge.\nEnhanced Skill: Thunderlight Arrow.\nUltimate: Lightning Surge.",
    ],
    mainStats: ["dex", "int"],
    levelValues: {
      aspdAndCspdPct: [
        6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
        6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
      ],
      dmgPct: [
        2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 4.75, 5, 5.25, 5.5, 5.75,
        6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25,
        9.5, 9.75, 10, 10.25, 10.5, 10.75, 11, 11.25, 11.5, 11.75, 12, 12.25,
      ],
    },
  },
  {
    type: "Passive",
    name: "Swiftness",
    tags: ["Aura", "Area"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n5% Movement Speed.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n14.5% Movement Speed",
    ],
  },
  {
    type: "Passive",
    name: "Thunder Focus",
    tags: ["Area", "Focus", "Lightning", "Attack"],
    description: [
      "Activates Focus and gains a buff:\n13.5% additional Lightning Damage\n+25% Numbed chance\nFor every 2m moved, this skill gains 5 Focus Pts. Upon reaching 100 Focus Pts, using a non-Mobility Attack Skill will consume all Focus Pts and trigger this skill, summoning a Thunderstrike that deals 1109% Weapon Attack Damage to all enemies within a certain area.\nWhen triggered by a Melee Skill, the Thunderstrike attacks a fan-shaped area. When triggered by a Ranged Skill, the Thunderstrike attacks a square-shaped area.",
      "Activates Focus and gains a buff:\n13.5% additional Lightning Damage\n+25% Numbed chance",
      "Thunder Focus:\nConverts 100% of the skill's Physical Damage to Lightning Damage\nFor every 2 m moved, the skill gains 5 Focus Pts\nAfter this skill reaches 100 Focus Pts, using a non-Mobility Attack Skill will consume 100 Focus Pts and trigger this skill in front of you\n-60% additional Ailment Damage for the skill",
      "Thunderstrike:\nDeals 1109% Weapon Attack Damage.",
    ],
    mainStats: ["dex"],
  },
  {
    type: "Passive",
    name: "Weapon Amplification",
    tags: ["Aura", "Area", "Physical"],
    description: [
      "Activates the Aura, you and allies within a certain area gain the following buff:\n15% additional Physical Damage.",
      "Activates the Aura, you and allies within a certain area gain the following buff:\n+34% additional Physical Damage",
    ],
  },
] as const satisfies readonly BasePassiveSkill[];
