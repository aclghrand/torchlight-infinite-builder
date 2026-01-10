import type { BaseHeroTrait } from "./types";

export const HeroTraits = [
  {
    hero: "Escapist Bing: Blast Nova (#1)",
    name: "Blast Nova",
    level: 1,
    affix:
      "When using a Non-channeling Projectile Skill, throw 1 bomb instead\nThe bomb automatically detonates 1 s after landing, firing Projectiles in all directions\nThere can be up to 10 undetonated bombs at the same time. Exceeding the limit will detonate the bomb that landed first\nBomb throwing speed is 1.5 time(s) per second\nFor every +100% Attack Speed, +1 bombs thrown upon using an Attack Projectile Skill.\nFor every +100% Cast Speed, +1 bombs thrown upon using a Spell Projectile Skill.\nThe amount less than +100% has a chance to grant +1 bombs thrown upon using an Attack or Spell Projectile Skill.\n+1% additional Attack Bomb Damage for every +1% additional Attack Speed\n+1% additional Spell Bomb Damage for every +1% additional Cast Speed\n+30% additional Bomb Damage\nProjectile Quantity +2\nReduces Max Spell Burst Stacks to 1/2\n-40% additional Sentry Damage",
  },
  {
    hero: "Escapist Bing: Blast Nova (#1)",
    name: "Dangerous Runaway",
    level: 45,
    affix:
      "+1 Bomb Quantity when throwing bombs next time after moving at least (20/17/14/11/8) m\n+1% Movement Speed for every 4 m of movement made recently, up to +15%",
  },
  {
    hero: "Escapist Bing: Blast Nova (#1)",
    name: "Firepower Coverage",
    level: 45,
    affix:
      "Projectile Quantity (+2/+2/+3/+3/+4)\n+50% Projectile Size\n(+10/+14/+18/+22/+26)% additional Bomb Damage",
  },
  {
    hero: "Escapist Bing: Blast Nova (#1)",
    name: "Blast Barrage",
    level: 60,
    affix:
      "Bombs explode immediately after landing\n+20% additional Projectile Speed\n(+22/+28/+34/+41/+48)% additional Bomb Damage when there are no enemies nearby",
  },
  {
    hero: "Escapist Bing: Blast Nova (#1)",
    name: "Phantom Delivery",
    level: 60,
    affix:
      "Doubles the bombs thrown.\nBombs have a (40/37/34/31/28)% chance to become duds that deal (-95/-95/-95/-95/-90)% additional damage",
  },
  {
    hero: "Escapist Bing: Blast Nova (#1)",
    name: "Frenzy Hound",
    level: 75,
    affix:
      "Bombs do not automatically explode when the upper limit is not reached\nClick the Trait Skill to manually detonate all bombs on the ground\n(+4/4.8/5.5/6.3/+7)% additional damage for every bomb on the battlefield when the bombs detonate, up to (+48/57.6/+66/75.6/+84)% additional damage.",
  },
  {
    hero: "Escapist Bing: Blast Nova (#1)",
    name: "Radiation Effect",
    level: 75,
    affix:
      "When the bombs detonate, for every +1% Projectile Speed, deals (0.35/0.42/0.48/0.53/0.6)% additional damage to enemies in proximity to them, up to an additional (+35/+42/+48/+53/+60)%",
  },
  {
    hero: "Escapist Bing: Creative Genius (#2)",
    name: "Creative Genius",
    level: 1,
    affix:
      "+1 Max Spell Burst\nGains 2 Inspiration Machines that can be powered by Whimsy Essence and Ingenuity Essence respectively. Starts with 0 Whimsy Essence and Ingenuity Essence with an upper limit of 100. Restores 20 Whimsy Essence per second\nWhen Whimsy Essence reaches 100, dealing Spell Damage to an enemy causes Inspiration Machines to use a Whimsy Explosion, inflicting Whimsy Signal on affected enemies\nWhen Ingenuity Essence reaches 100, clicking the Trait Skill causes Inspiration Machines to use Ingenuity Overload\nBing's ingenious ideas allow him to possess more Traits. In addition to Base Traits, an additional Trait can be selected at each level threshold.",
  },
  {
    hero: "Escapist Bing: Creative Genius (#2)",
    name: "Inspiration Overflow",
    level: 45,
    affix:
      "Instantly restores 5 Whimsy Essence when consuming Spell Burst Charge, and restores 6 additional Whimsy Essence for every 3 stacks of Spell Burst Charge consumed. Interval: 1s\n(+20/+25/+30/+35/+40)% additional Hit Damage for skills cast by Spell Burst\nInstantly restores 80 Ingenuity Essence after entering a stage or reviving",
  },
  {
    hero: "Escapist Bing: Creative Genius (#2)",
    name: "Over-Shield Module",
    level: 45,
    affix:
      "- (60/62.5/65/67.5/70)% additional damage taken when casting Ingenuity Overload for 1s",
  },
  {
    hero: "Escapist Bing: Creative Genius (#2)",
    name: "Super Sonic Protocol",
    level: 45,
    affix:
      "(+80/+85/+90/+95/+100)% Movement Speed when casting Ingenuity Overload. The bonus falls off to 0 within 4s",
  },
  {
    hero: "Escapist Bing: Creative Genius (#2)",
    name: "Auto-Ingenuity Program",
    level: 60,
    affix:
      "When Ingenuity Essence reaches 100, triggers Ingenuity Overload\n-10% Whimsy Essence Recovery Speed\nWhen Ingenuity Essence reaches 100, triggers Ingenuity Overload\n-5% Whimsy Essence Recovery Speed\nWhen Ingenuity Essence reaches 100, triggers Ingenuity Overload\nWhen Ingenuity Essence reaches 100, triggers Ingenuity Overload\n+5% Whimsy Essence Recovery Speed\nWhen Ingenuity Essence reaches 100, triggers Ingenuity Overload\n+10% Whimsy Essence Recovery Speed",
  },
  {
    hero: "Escapist Bing: Creative Genius (#2)",
    name: "Ingenious Chaos Principle",
    level: 60,
    affix:
      "(+4/+6/+8/+10/+12)% Ingenuity Essence restoration per Max Spell Burst",
  },
  {
    hero: "Escapist Bing: Creative Genius (#2)",
    name: "Law of Ingenuity",
    level: 60,
    affix:
      "Ingenuity Overload has a (20/25/30/35/40)% chance to not consume Ingenuity Essence",
  },
  {
    hero: "Escapist Bing: Creative Genius (#2)",
    name: "Mind Domain",
    level: 60,
    affix:
      "Whimsy Explosion spawns an energy field. Gains 1 stack of Whimsy for every 0.5s staying in the energy field. Stacks up to (4/5/6/7/8) time(s)",
  },
  {
    hero: "Escapist Bing: Creative Genius (#2)",
    name: "Trouble Maker",
    level: 60,
    affix:
      "Loses (20/15/15/10/10)% Max Life and Energy Shield when Whimsy Explosion hits yourself\nEffect of Whimsy Signal enhanced to: (+60/+60/+75/+75/+90)% additional Spell Damage taken",
  },
  {
    hero: "Escapist Bing: Creative Genius (#2)",
    name: "Brainstorm",
    level: 75,
    affix:
      "After a 1s delay, Whimsy Explosion creates an additional Energy Explosion that eliminates enemies with less than (15/15/18/18/21)% Life within 12m\nRestores (5/6/6/7/7) additional Whimsy Essence for each enemy affected by Whimsy Signal defeated",
  },
  {
    hero: "Escapist Bing: Creative Genius (#2)",
    name: "Contingency Inspiration Delivery",
    level: 75,
    affix:
      "Summons 3 Contingency Inspiration Machines when casting Ingenuity Overload. Their Skill Interval: (0.9/0.8/0.7/0.6/0.5) s",
  },
  {
    hero: "Escapist Bing: Creative Genius (#2)",
    name: "Flash of Brilliance",
    level: 75,
    affix:
      "Casting a Main Skill has a (20/25/25/30/30)% chance to trigger Whimsy Explosion without consuming Whimsy Essence. Interval: (3.5/3.5/3/3/2.5) s",
  },
  {
    hero: "Escapist Bing: Creative Genius (#2)",
    name: "Hyper-Resonance Hypothesis",
    level: 75,
    affix:
      "When casting Ingenuity Overload, gains Buff Effect: (+15/+19/+23/+27/+31)% additional Spell Burst Charge Speed for 10s",
  },
  {
    hero: "Escapist Bing: Creative Genius (#2)",
    name: "Multi-Coupling Equation",
    level: 75,
    affix:
      "For every 2 Empower or Defensive Skill(s) affecting you, +1 Max Spell Burst. Stacks up to 1 time(s)\nFor every 2 Empower or Defensive Skill(s) affecting you, +1 Max Spell Burst. Stacks up to 1 time(s)\n+15% Empower and Defensive Skill Effect Duration\nFor every 2 Empower or Defensive Skill(s) affecting you, +1 Max Spell Burst. Stacks up to 2 time(s)\n+15% Empower and Defensive Skill Effect Duration\nFor every 2 Empower or Defensive Skill(s) affecting you, +1 Max Spell Burst. Stacks up to 2 time(s)\n+30% Empower and Defensive Skill Effect Duration\nFor every 2 Empower or Defensive Skill(s) affecting you, +1 Max Spell Burst. Stacks up to 3 time(s)\n+30% Empower and Defensive Skill Effect Duration",
  },
  {
    hero: "Divineshot Carino: Ranger of Glory (#1)",
    name: "Ranger of Glory",
    level: 1,
    affix:
      "Projectile Skills consume ammo\n+35% additional Projectile Damage when consuming ammo\n+6 initial magazine capacity\nClick the Trait Skill to reload the magazine. Base reloading time is 0.6 s\nProjectile Skills are unavailable while reloading\n150% of the max bonus to Attack Speed or Cast Speed is also applied to Reload Speed\nWhile reloading, +45% Movement Speed\nAlways auto-reloading ammo; Reloading can be interrupted.",
  },
  {
    hero: "Divineshot Carino: Ranger of Glory (#1)",
    name: "Ammo Expert",
    level: 45,
    affix:
      "+2 Special Ammo slot(s)\n+30% chance to reload special ammo\n(+15/+23/+31/+39/+47)% additional damage dealt by this Projectile Skill if a Special Ammo is consumed\n50% chance to gain Magic Shot for 4 s when consuming a Special Ammo. Interval: 8 s.",
  },
  {
    hero: "Divineshot Carino: Ranger of Glory (#1)",
    name: "Crushing Gale Trigger",
    level: 60,
    affix:
      "(15/19/23/27/31)% of the increase/decrease on Attack and Cast Speed is also applied to reload chance of special ammo\nReload Special Ammo slots in order",
  },
  {
    hero: "Divineshot Carino: Ranger of Glory (#1)",
    name: "Landslide",
    level: 60,
    affix:
      "While Magic Shot is active, using or triggering Projectile Skills consume all ammo in the magazine\n(+5/+8/+11/+14/+17)% additional damage for every Special Ammo consumed",
  },
  {
    hero: "Divineshot Carino: Ranger of Glory (#1)",
    name: "Never Stopping",
    level: 75,
    affix:
      "While Magic Shot is active, for every Special Ammo consumed, extends Magic Shot's Duration by (0.04/0.05/0.06/0.08/0.1) s",
  },
  {
    hero: "Divineshot Carino: Ranger of Glory (#1)",
    name: "Well Prepared",
    level: 75,
    affix:
      "+1 Special Ammo slot(s). These slots can be installed with Projectile exclusive Noble Support Skills\n(+15/+20/+25/+30/+35)% additional damage dealt by this Projectile Skill if a Special Ammo is consumed",
  },
  {
    hero: "Divineshot Carino: Lethal Flash (#2)",
    name: "Lethal Flash",
    level: 1,
    affix:
      "Projectile Skills consume ammo\n+6 initial magazine capacity\nAlways auto-reload ammo, reloading 2 ammo each time. Reload Time: 0.6 s\nProjectile Skills can be cast while reloading, but will interrupt the reloading process\nProjectile Quantity +2\nProjectile Skills have the Shotgun Effect",
  },
  {
    hero: "Divineshot Carino: Lethal Flash (#2)",
    name: "Dart Shot",
    level: 45,
    affix:
      "When casting a Projectile Skill, for every ammo consumed, - (20/20/25/25/30)% current cooldown for Mobility Skills\n(+15/+20/+25/+30/+35)% additional damage for 4 s after using Mobility Skills",
  },
  {
    hero: "Divineshot Carino: Lethal Flash (#2)",
    name: "Shadow Magazine",
    level: 45,
    affix:
      "(-0.2/-0.25/-0.3/-0.35/-0.4) s reloading time\n25% chance for Projectile Skills to not consume ammo",
  },
  {
    hero: "Divineshot Carino: Lethal Flash (#2)",
    name: "Evil Ouroboros",
    level: 60,
    affix:
      "Normal Projectiles will return after reaching their max range and will hit enemies on their path again\n-50% Projectile Range\n(-70/-64/-58/-52/-46)% additional Returning Projectile Damage",
  },
  {
    hero: "Divineshot Carino: Lethal Flash (#2)",
    name: "Lethal Interval",
    level: 60,
    affix:
      "For every ammo consumed recently, -3 ° Projectile Spreading Angle\nHorizontal Projectiles cannot Penetrate but have (+1/+1/+2/+2/+3) Jump(s)\n(+10/+16/+22/+28/+34)% additional damage dealt by Projectile Skills",
  },
  {
    hero: "Divineshot Carino: Lethal Flash (#2)",
    name: "Desperate Measure",
    level: 75,
    affix:
      "Your Projectile Skills will consume all ammo\nWhen casting a Projectile Skill, the skill (+9/+10/+11/+12/+13)% additional damage for every 1 ammo it consumes. Stacks up to 8 times",
  },
  {
    hero: "Divineshot Carino: Lethal Flash (#2)",
    name: "Malice Charge",
    level: 75,
    affix:
      "Reloads all ammo when using Mobility Skills\nFor every ammo consumed recently, (0.6/+1/1.4/1.8/2.2)% base damage coefficient for subsequent Projectiles of Shotgun Effect. Stacks up to 10 time(s)",
  },
  {
    hero: "Divineshot Carino: Zealot of War (#3)",
    name: "Zealot of War",
    level: 1,
    affix:
      "No longer reload when switching shooting modes\nProjectile Skills consume ammo\n+6 initial Magazine Capacity\nBase reloading time is 0.8 s\nProjectile Quantity +2\nFor every +1 Projectile Quantity or +1 Split Quantity, +3 Magazine Capacity (excludes the Projectile Quantity and Split Quantity provided by the skill itself and linked Support Skills)\n+20% additional damage",
  },
  {
    hero: "Divineshot Carino: Zealot of War (#3)",
    name: "Incinerated Glory",
    level: 45,
    affix:
      "Allows Blank Firing\nWhile having ammo, for every ammo consumed, gains 1 stack of Heat Up\nDuring Blank Firing, gains Overheated when casting a Projectile Skill\nHeat Up: For every stack of Heat Up, (1.6/+2/2.3/2.6/+3)% additional Projectile Skill Damage and 0.1 Projectile Max Deviation Angle\nForced to reload once Overheated has been active for 10 s\nAfter reloading, loses all stacks of Heat Up and Overheated",
  },
  {
    hero: "Divineshot Carino: Zealot of War (#3)",
    name: "Ceasefire",
    level: 60,
    affix:
      "Starts with max stacks of Heat Up but does not reload ammo at the beginning\nWhile active, Overheated can last without forcing reload\nStarts with max stacks of Heat Up but does not reload ammo at the beginning\nWhile active, Overheated can last without forcing reload\n+5% additional damage\nStarts with max stacks of Heat Up but does not reload ammo at the beginning\nWhile active, Overheated can last without forcing reload\n+10% additional damage\nStarts with max stacks of Heat Up but does not reload ammo at the beginning\nWhile active, Overheated can last without forcing reload\n+16% additional damage\nStarts with max stacks of Heat Up but does not reload ammo at the beginning\nWhile active, Overheated can last without forcing reload\n+21% additional damage",
  },
  {
    hero: "Divineshot Carino: Zealot of War (#3)",
    name: "Extreme Heat",
    level: 60,
    affix:
      "At Max Heat Up Stacks, enter Burning Red instead of Overheated\nReload immediately when Burning Red ends\nExtends the duration of Burning Red by 3 s and restores 3% Max Life and Energy Shield when defeating an Elite\nAt Max Heat Up Stacks, enter Burning Red instead of Overheated\nReload immediately when Burning Red ends\nExtends the duration of Burning Red by 4 s and restores 3% Max Life and Energy Shield when defeating an Elite\n+5% additional damage\nAt Max Heat Up Stacks, enter Burning Red instead of Overheated\nReload immediately when Burning Red ends\nExtends the duration of Burning Red by 5 s and restores 3% Max Life and Energy Shield when defeating an Elite\n+5% additional damage\nAt Max Heat Up Stacks, enter Burning Red instead of Overheated\nReload immediately when Burning Red ends\nExtends the duration of Burning Red by 5 s and restores 3% Max Life and Energy Shield when defeating an Elite\n+10% additional damage\nAt Max Heat Up Stacks, enter Burning Red instead of Overheated\nReload immediately when Burning Red ends\nExtends the duration of Burning Red by 5 s and restores 3% Max Life and Energy Shield when defeating an Elite\n+16% additional damage",
  },
  {
    hero: "Divineshot Carino: Zealot of War (#3)",
    name: "Endless Frenzy",
    level: 75,
    affix:
      "For every +1% Knockback distance, (0.2/0.3/0.4/0.5/0.6)% additional damage and -0.1 Projectile Max Deviation Angle. Stacks up to 100 time(s)",
  },
  {
    hero: "Divineshot Carino: Zealot of War (#3)",
    name: "Eternal Flames",
    level: 75,
    affix:
      "Heat Up gains an additional effect: For every stack of Heat Up, 0.6% additional Attack and Cast Speed\nHeat Up gains an additional effect: For every stack of Heat Up, 0.6% additional Attack and Cast Speed\n+5% additional damage\nHeat Up gains an additional effect: For every stack of Heat Up, 0.6% additional Attack and Cast Speed\n+10% additional damage\nHeat Up gains an additional effect: For every stack of Heat Up, 0.6% additional Attack and Cast Speed\n+16% additional damage\nHeat Up gains an additional effect: For every stack of Heat Up, 0.6% additional Attack and Cast Speed\n+21% additional damage",
  },
  {
    hero: "Cateye Erika: Wind Stalker (#1)",
    name: "Wind Stalker",
    level: 1,
    affix:
      "+20% Movement Speed\nGains 1 stack of Stalker for every 1 m of movement\nYour Multistrike Count will not be interrupted during Stalker",
  },
  {
    hero: "Cateye Erika: Wind Stalker (#1)",
    name: "Have Fun",
    level: 45,
    affix:
      "The Main Skill is supported by Lv. 10 Multistrike\n(+2/+6/+12/+18/+24)% additional Attack Speed",
  },
  {
    hero: "Cateye Erika: Wind Stalker (#1)",
    name: "Interest",
    level: 45,
    affix:
      "(20/24/28/32/36)% of the increase/decrease on Movement Speed is also applied to additional Attack Damage, up to (+30/+36/+42/+48/+54)% additional Attack Damage",
  },
  {
    hero: "Cateye Erika: Wind Stalker (#1)",
    name: "Cat's Scratch",
    level: 60,
    affix:
      "(+27/+34/+41/+48/+55)% additional Multistrike damage increment for 4 s when the Max Multistrike Count is reached",
  },
  {
    hero: "Cateye Erika: Wind Stalker (#1)",
    name: "Cat's Vision",
    level: 60,
    affix:
      "At Max Multistrike Count, +1 to Max Stalker Stacks, up to +3 , until Stalker ends\n(-4/+2/+8/+14/+20)% additional damage",
  },
  {
    hero: "Cateye Erika: Wind Stalker (#1)",
    name: "Cat Dive",
    level: 75,
    affix:
      "During Multistrike, there is a (0.24/0.27/0.3/0.33/0.36)% chance for this attack to deal damage equal to the Max Multistrike Count for every +1% Movement Speed you have",
  },
  {
    hero: "Cateye Erika: Wind Stalker (#1)",
    name: "Cat's Punches",
    level: 75,
    affix:
      "At Max Multistrike Count, gains 1 stack of Stalker\n+1 to the initial Multistrike Count for every 3 stack(s) of Stalker\n-18% additional damage\nAt Max Multistrike Count, gains 1 stack of Stalker\n+1 to the initial Multistrike Count for every 3 stack(s) of Stalker\n-12% additional damage\nAt Max Multistrike Count, gains 1 stack of Stalker\n+1 to the initial Multistrike Count for every 3 stack(s) of Stalker\n-6% additional damage\nAt Max Multistrike Count, gains 1 stack of Stalker\n+1 to the initial Multistrike Count for every 3 stack(s) of Stalker\nAt Max Multistrike Count, gains 1 stack of Stalker\n+1 to the initial Multistrike Count for every 3 stack(s) of Stalker\n+6% additional damage",
  },
  {
    hero: "Cateye Erika: Lightning Shadow (#2)",
    name: "Lightning Shadow",
    level: 1,
    affix:
      "Start moving or click a Trait Skill to gain 1 Electrify stack for every 3 m of movement made within the next 1 s, up to 3 stack(s). Lasts for 10 s. Electrify is affected by Skill Effect Duration\nClick the Trait Skill again to reset the effect\nWhen Electrify is owned, triggers Feline Figure on up to 3 enemy(ies) within 10 m. Cooldown: 0.4 s. Can only be triggered once on each enemy\nFor every 1 stack(s) of Electrify, Feline Figure inflicts 1 stack(s) of Numbed on enemies within the area\n+18% additional Numbed Effect",
  },
  {
    hero: "Cateye Erika: Lightning Shadow (#2)",
    name: "Dazzling Lightning",
    level: 45,
    affix:
      "(+2/+2/+3/+3/+4) to Max Electrify Stacks\n(+3/+5/+5/+7/+7)% Movement Speed for every stack of Electrify",
  },
  {
    hero: "Cateye Erika: Lightning Shadow (#2)",
    name: "Electroplated Motif",
    level: 45,
    affix:
      "+1% chance to double the duration of Numbed inflicted by Feline Figure for every +1% Numbed chance\n(+20/+25/+30/+35/+40)% additional Numbed Effect",
  },
  {
    hero: "Cateye Erika: Lightning Shadow (#2)",
    name: "Wild Lightning",
    level: 60,
    affix:
      "0.4% Numbed Effect for every +1% Movement Speed, up to (+80/+90/+100/+110/+120)%",
  },
  {
    hero: "Cateye Erika: Lightning Shadow (#2)",
    name: "Charging Equation",
    level: 75,
    affix:
      "Feline Figure is triggered when inflicting Numbed on enemies. Cooldown for each enemy: 1 s\nWhen Feline Figure inflicts Numbed, for every stack of Numbed enemies have, (+3/3.5/+4/4.5/+5)% additional Numbed Effect for Erika. Stacks up to 10 time(s). This is refreshed when Feline Figure is cast again",
  },
  {
    hero: "Cateye Erika: Lightning Shadow (#2)",
    name: "Swift as Lightning",
    level: 75,
    affix:
      "For every 4 stack(s) of Numbed inflicted on the enemy, +2% Movement Speed, (+1/1.5/+2/2.5/+3)% additional damage, and (+3/+4/+5/+6/+7)% Feline Figure Area. Stacks up to 10 time(s). Lasts for 10 s",
  },
  {
    hero: "Frostfire Gemma: Ice-Fire Fusion (#1)",
    name: "Ice-Fire Fusion",
    level: 1,
    affix:
      "Enters Frostfire Rampage after casting Fire or Cold Skills 5 time(s)\n+20% additional Fire Damage and Cold Damage during Frostfire Rampage\nFrostfire Rampage lasts for 5 s and has a cooldown of 10 s",
  },
  {
    hero: "Frostfire Gemma: Ice-Fire Fusion (#1)",
    name: "Ice-Fire Embrace",
    level: 45,
    affix:
      "(+10/+13/+16/+19/+22)% additional Cold Damage if you have dealt Fire Damage recently\n(+10/+13/+16/+19/+22)% additional Fire Damage if you have dealt Cold Damage recently\n+10% Fire and Cold Resistance",
  },
  {
    hero: "Frostfire Gemma: Ice-Fire Fusion (#1)",
    name: "Ice-Fire Radiance",
    level: 60,
    affix:
      "-50% Frostfire Rampage Duration\nRegenerates 10% Life and Mana per second when entering Frostfire Rampage. The effect gradually falls off to 0 within 3 s.\n(+60/+70/+80/+90/+100)% additional Fire Damage and Cold Damage when Frostfire Rampage ends. The effect gradually falls off to 0 within 3 s",
  },
  {
    hero: "Frostfire Gemma: Ice-Fire Fusion (#1)",
    name: "Restless Ice-Fire",
    level: 60,
    affix:
      "(+12/+15/+18/+21/+24)% Elemental Penetration and +20% Movement Speed during Frostfire Rampage\n(+20/+30/+40/+50/+60)% Frostfire Rampage Cooldown Recovery Speed",
  },
  {
    hero: "Frostfire Gemma: Ice-Fire Fusion (#1)",
    name: "Bone-piercing Heat",
    level: 75,
    affix: "Adds (30/36/42/48/54)% of Cold Damage as Fire Damage",
  },
  {
    hero: "Frostfire Gemma: Ice-Fire Fusion (#1)",
    name: "Ice to Blaze",
    level: 75,
    affix:
      "Converts 99% of Cold Damage to Fire Damage\nThe Fire Resistance of Frostbitten enemies is fixed at (15/10/5/0/-5)%",
  },
  {
    hero: "Frostfire Gemma: Frostbitten Heart (#2)",
    name: "Frostbitten Heart",
    level: 1,
    affix:
      "When dealing Cold Damage, casts Cold Pulse. Interval: 4 s\nCold Pulse inflicts Frostbite on target with 20 Frostbite Rating.\nThe Freeze you inflict gains an additional effect: +45% additional Cold Damage taken",
  },
  {
    hero: "Frostfire Gemma: Frostbitten Heart (#2)",
    name: "Frost Tides",
    level: 45,
    affix:
      "Inflicts 100 additional Frostbite Rating when an enemy is hit by Cold Pulse for the first time\n(-2/-2.1/-2.2/-2.3/-2.4) s Cold Pulse Interval",
  },
  {
    hero: "Frostfire Gemma: Frostbitten Heart (#2)",
    name: "Glacial Night",
    level: 60,
    affix:
      "+100% additional Freeze Duration upon Freezing an enemy for the first time\n(+50/+58/+65/+74/+82)% additional damage against Frozen enemies",
  },
  {
    hero: "Frostfire Gemma: Frostbitten Heart (#2)",
    name: "Wintry Slumber",
    level: 60,
    affix:
      "Eliminates Frozen non-Elite enemies who have less than (30/35/40/45/50)% Life\nEliminates Frozen Elite enemies who have less than (6/7/8/9/10)% Life",
  },
  {
    hero: "Frostfire Gemma: Frostbitten Heart (#2)",
    name: "Blooming Frost Flower",
    level: 75,
    affix:
      "Upon inflicting Freeze, additionally casts Cold Pulse at the Frozen target once. Interval: 0.1s\n(+4/+5/+6/+7/+8)% additional Cold Damage taken by the enemy for each time it has been hit with Cold Pulse recently. Lasts for 5 seconds and stacks up to (5/6/7/8/9) times",
  },
  {
    hero: "Frostfire Gemma: Frostbitten Heart (#2)",
    name: "Frigid Infusion",
    level: 75,
    affix:
      "When Cold Pulse hits a Frozen enemy, extends the Base Duration of Freeze by (6/7/8/9/10)% and restores (3/4/4/5/5)% Missing Life and Energy Shield\n(-0.9/-1/-1.1/-1.2/-1.3) s Cold Pulse Interval\n(-25/-20/-15/-10/-5)% Cold Pulse Skill Area",
  },
  {
    hero: "Frostfire Gemma: Flame of Pleasure (#3)",
    name: "Flame of Pleasure",
    level: 1,
    affix:
      "Click the Trait Skill to unleash Purgatory.\nPurgatory has an initial radius of 8 m, lasts for 5 s, and has a cooldown of 8 s\nPurgatory's upper limit becomes 1 . Purgatory follows the player while it is active\nAttempts to auto-cast Purgatory when you are not in Purgatory and enemies are present within 15m. Interval: 1s\n+45% additional damage taken by enemies within the range of Purgatory",
  },
  {
    hero: "Frostfire Gemma: Flame of Pleasure (#3)",
    name: "Groaning Echo",
    level: 45,
    affix:
      "+1 Max Purgatory Charges\n(+1/1.25/1.5/1.75/+2) s Purgatory Duration\n(+40/+55/+70/+85/+100)% Purgatory Skill Area",
  },
  {
    hero: "Frostfire Gemma: Flame of Pleasure (#3)",
    name: "Flames of Desire",
    level: 60,
    affix:
      "Eliminates enemies with less than (6/7/8/9/10)% Life within the range of Purgatory\nRestores (1/1.25/1.5/1.75/2)% of Max Life and Energy Shield when defeating enemies within the range of Purgatory",
  },
  {
    hero: "Frostfire Gemma: Flame of Pleasure (#3)",
    name: "Infernal Damnation",
    level: 60,
    affix:
      "For every second Purgatory is active, (+6/+7/+8/+9/+10)% additional damage until Purgatory is lost or a new Purgatory is cast",
  },
  {
    hero: "Frostfire Gemma: Flame of Pleasure (#3)",
    name: "Banquet of Bliss",
    level: 75,
    affix:
      "-30% additional damage taken by enemies within (4/3/2/1/1) m\nEnemies within range of Purgatory are cursed by Lv. (10/15/20/30/40) Scorch\nYou can cast 1 additional Curses",
  },
  {
    hero: "Frostfire Gemma: Flame of Pleasure (#3)",
    name: "Dress Licker",
    level: 75,
    affix:
      "Converts 20% of Physical Damage taken to Fire Damage\nConverts 100% of Physical Damage taken by enemies within the range of Purgatory to Fire Damage\n(+30/+35/+40/+45/+50)% additional Fire Damage taken by enemies within the range of Purgatory\n+30% additional Fire Damage against enemies within the range of Purgatory",
  },
  {
    hero: "The Forsaken Iris: Growing Breeze (#1)",
    name: "Growing Breeze",
    level: 1,
    affix:
      "When a Spirit Magus Skill is set as an Active Skill, casting the Active Skill is considered as casting the Trait Skill as well\nGrants 4 stack(s) of Nourishment to all Spirit Magi when using Trait Skills. Cooldown: 5 s\nWithin 1 s of Spirit Magi gaining Nourishment, if there are no enemies within 5 m, +70% Movement Speed\nWhen a Spirit Magus casts a skill, +30% chance for it to lose 1 stack of Nourishment\nFor every stack of Nourishment a Spirit Magus has, when it uses a skill, +8% chance for it to lose a stack of Nourishment\nNourishment: When using a skill, +30% additional damage dealt by this skill. Lasts 15 s and stacks up to 10 time(s).\n100% of your Empower Skill Effect bonus is also applied to Spirit Magi's Nourishment",
  },
  {
    hero: "The Forsaken Iris: Growing Breeze (#1)",
    name: "Embrace the World",
    level: 45,
    affix:
      "For every 2% Fire, Cold, or Lightning Resistance, +1% chance for the corresponding Spirit Magi to use an Enhanced Skill, up to (+15/+20/+25/+30/+35)%",
  },
  {
    hero: "The Forsaken Iris: Growing Breeze (#1)",
    name: "Struggle Free",
    level: 45,
    affix:
      "+100% Sealed Mana Compensation for Spirit Magus Skills\nSpirit Magi's Skill Cooldown Recovery Speed (+50/+65/+80/+95/+110)%",
  },
  {
    hero: "The Forsaken Iris: Growing Breeze (#1)",
    name: "Amazing Friends",
    level: 60,
    affix:
      "Spirit Magi -20% chance to use an Enhanced Skill\nAfter gaining a total of (40/35/30/24/18) stacks of Nourishment, Spirit Magi enter Full Bloom for 12 s\nWhen a Spirit Magus casts the Ultimate while having Full Bloom, (+10/+11/+12/+13/+14)% additional Ultimate Cooldown Recovery Speed for every stack of Nourishment",
  },
  {
    hero: "The Forsaken Iris: Growing Breeze (#1)",
    name: "Socialite",
    level: 60,
    affix:
      "+1 to Max Spirit Magi In Map\nMax Summonable Spirit Magi of Spirit Magus Skills +1\nWhen a Spirit Magus casts a skill, (+15/+12/+8/+4/+2)% chance for it to lose 1 stack of Nourishment",
  },
  {
    hero: "The Forsaken Iris: Growing Breeze (#1)",
    name: "Grow With It",
    level: 75,
    affix:
      "Always attempts to auto-trigger the Trait Skill, Growing Breeze\nWhen a Spirit Magus casts a skill, for every +1 skill level of the corresponding skil, the Spirit Magus gains -4% chance to lose 1 stack of Nourishment, up to (-20/-24/-28/-36/-40)%",
  },
  {
    hero: "The Forsaken Iris: Growing Breeze (#1)",
    name: "Run With the Wind",
    level: 75,
    affix:
      "Changes the Base Trait to Holding a Trait Skill or Spirit Magus Skill to use Windrider\nAllows movement while channeling Windrider\n(+30/+20/+15/+10/+5)% additional damage taken while channeling Windrider",
  },
  {
    hero: "The Forsaken Iris: Vigilant Breeze (#2)",
    name: "Vigilant Breeze",
    level: 1,
    affix:
      "When a Spirit Magus Skill is set as an Active Skill, casting the Active Skill is considered as casting the Trait Skill as well\nMerges with Spirit Magi after casting the Trait Skill, entering the Vigilant state. Merged Spirit Magi gain 5 stack(s) of Breeze. Casting the Trait Skill again will remove the Vigilant state\nDuring Vigilant, Merged Spirit Magi consume 20% of Max Life per second when not Reconjuring\nWhile in the Vigilant state, Merged Spirit Magi gain 1 stack of Breeze every 1 s when not Reconjuring, up to 10 stack(s)\nWhen Reconjuring or not Merged, Spirit Magi lose 2 stack(s) of Breeze every 1 s",
  },
  {
    hero: "The Forsaken Iris: Vigilant Breeze (#2)",
    name: "Breeze's Whisper",
    level: 45,
    affix:
      "Spirit Magi +30% chance to use an Enhanced Skill\nWhenever a Merged Spirit Magus casts an Enhanced Skill, restores (2.5/3/3.5/4/5)% of Max Life and +1 to Max Breeze Stacks. Interval: (0.9/0.5/0.2/0.1/0.03) s\nUp to (+4/+5/+6/+7/+8) to Max Breeze Stacks, lasting until Reconjuring",
  },
  {
    hero: "The Forsaken Iris: Vigilant Breeze (#2)",
    name: "Whirlwind Tango",
    level: 45,
    affix:
      "The Ultimate of Merged Spirit Magi has no cooldown\nEvery time a Merged Spirit Magus casts its Ultimate, it consumes (15/14/13/12/11)% of Max Life and gains (2/3/3/4/4) stack(s) of Breeze\n-40% additional Spirit Magus Skill Damage",
  },
  {
    hero: "The Forsaken Iris: Vigilant Breeze (#2)",
    name: "Happiest Reunion",
    level: 60,
    affix:
      "+1 to Max Spirit Magi In Map\nWhile in the Vigilant state, all Spirit Magi are considered Merged Spirit Magi\nWhile in the Vigilant state, for every Spirit Magus there is, (+1/+2/+3/+4/+5)% additional damage (multiplies) for Merged Spirit Magi. (+8/+7/+7/+6/+6)% to the amount of Max Life they consume per second when not Reconjuring",
  },
  {
    hero: "The Forsaken Iris: Vigilant Breeze (#2)",
    name: "Warmest Vigilance",
    level: 60,
    affix:
      "+1 to the Max Breeze Stacks for every (5/4.5/4.1/3.8/3.5)% Max Life consumed by Merged Spirit Magi, up to (+15/+17/+19/+21/+23)\nMerged Spirit Magi gain 1 stack of Breeze when defeating an enemy",
  },
  {
    hero: "The Forsaken Iris: Vigilant Breeze (#2)",
    name: "Merging Stream",
    level: 75,
    affix:
      "Iris is not affected by Origin of Spirit Magus Effects, and all basic Origin of Spirit Magus Effects will be applied to all Spirit Magi\nFor every 2 Growth a Spirit Magus has, it (0.1/0.15/0.2/0.25/0.3)% additional Origin of Spirit Magus Effect received",
  },
  {
    hero: "The Forsaken Iris: Vigilant Breeze (#2)",
    name: "Nurturing Breeze",
    level: 75,
    affix:
      "While in Vigilant, Iris (-20/-24/-28/-32/-36)% additional damage taken\n(50/60/70/80/100)% of the bonus and additional bonus to Life Regeneration Speed and Life Regeneration Per Second is also applied to Merged Spirit Magi\n(100/120/140/160/200)% of the bonus and additional bonus to Life Regain, Shield Regain, Life Regain Interval, and Shield Regain Interval is also applied to Merged Spirit Magi",
  },
  {
    hero: "Commander Moto: Order Calling (#1)",
    name: "Order Calling",
    level: 1,
    affix:
      "Within 4 s after a Summon Skill is cast, all your Minions will gain Overload. Cooldown: 12 s\nOverload grants +60% additional damage\nThe Effect and Duration of Overload are refreshed when a Minion that already has Overload gains Overload again",
  },
  {
    hero: "Commander Moto: Order Calling (#1)",
    name: "All In",
    level: 45,
    affix:
      "(+120/+155/+190/+225/+270)% additional Overload Effect when a Minion gains Overload for the first time",
  },
  {
    hero: "Commander Moto: Order Calling (#1)",
    name: "Veteran",
    level: 45,
    affix:
      "(+80/+105/+130/+155/+180)% additional Overload Duration\nMinions +20% Attack and Cast Speed when they have Overload",
  },
  {
    hero: "Commander Moto: Order Calling (#1)",
    name: "Last Stand",
    level: 60,
    affix:
      "Minions won't be defeated when they have Overload\n-100% Life Restoration Speed for Minions when they have Overload\nMinions deal additional damage based on their Missing Life when they have Overload, up to (+25/+32/+40/+50/+60)% additional damage",
  },
  {
    hero: "Commander Moto: Order Calling (#1)",
    name: "Tough as Nails",
    level: 60,
    affix:
      "(+9/+11/+13/+15/+18)% Overload Effect for every 5 Command owned\nMinions with Overload regenerate 1% Max Life per second for every 5 Command owned",
  },
  {
    hero: "Commander Moto: Order Calling (#1)",
    name: "Charge Forward",
    level: 75,
    affix:
      "For every +5% Max Life a Minion has, +1% Physique and (+2/+3/+4/+5/+6)% Overload Effect received",
  },
  {
    hero: "Commander Moto: Order Calling (#1)",
    name: "Go for Broke",
    level: 75,
    affix:
      "For every 5% Life lost by a Synthetic Troop Minion in the last second, (+10/+11/+12/+14/+15)% Overload Effect received. Stacks up to 20 time(s)",
  },
  {
    hero: "Commander Moto: Charge Calling (#2)",
    name: "Charge Calling",
    level: 1,
    affix:
      "Synthetic Troop Minions will initiate the Self-Destruct Protocol when they lose Overload\nAfter the Self-Destruct Protocol is active, Synthetic Troop Minions will charge at the enemies and self-destruct upon hitting an enemy or being defeated\nTheir Charge Speed is affected by Minion Attack Speed\nThe self-destruction deals Physical Attack Damage to enemies within the area\nAfter Self-Destruct Protocol is initiated, Synthetic Troop Minions will Self-Destruct when they are defeated. Self-Destruct deals Physical Damage to enemies within the skill area\nAllows you to click the Trait Skill to gain Charge Calling for 6 s. Cooldown: 6 s\nDuring Charge Calling, Synthetic Troop Minions summoned at a time +1 . All Synthetic Troop Minions will activate Self-Destruct Protocol and Charge at the enemy in the next 1 s, self-destructing upon colliding with an enemy or being defeated to deal Physical Attack Damage to enemies within the area\n+20% additional Self-Destruct Damage triggered by Self-Destruct Protocol",
  },
  {
    hero: "Commander Moto: Charge Calling (#2)",
    name: "Unstoppable Wave",
    level: 45,
    affix:
      "+30% chance for a Synthetic Troop Minion to drop 1 Mechanical Part When it initiates Self-Destruct Protocol. Mechanical Parts last 1 s\nPlayer will automatically pick up nearby Mechanical Parts\n(+3/3.5/+4/4.5/+5)% additional Minion Damage for each Mechanical Part picked up recently. Stacks up to 10 time(s)\nGains a Skill Slot, in which a Support Skill or Activation Medium Support Skill can be installed to support Trait Skill Charge Calling",
  },
  {
    hero: "Commander Moto: Charge Calling (#2)",
    name: "Guerilla Tactics",
    level: 60,
    affix:
      "+50% Mechanical Part Pick-Up Radius\n+2% additional Self-Destruct Protocol Charge Speed and +3% additional Self-Destruct Protocol Damage for each Mechanical Part collected recently. Stacks up to (10/12/15/18/20) time(s)",
  },
  {
    hero: "Commander Moto: Charge Calling (#2)",
    name: "Heroic Sacrifice",
    level: 60,
    affix:
      "For every (+70/+60/+50/+45/+40) Max Life or Energy Shield a Synthetic Troop Minion has, Self-Destruct triggered by Self-Destruct Protocol deals +1% additional damage",
  },
  {
    hero: "Commander Moto: Charge Calling (#2)",
    name: "Essential Speed",
    level: 75,
    affix:
      "(25/30/35/40/45)% of the bonus and additional bonus to Minion Attack Speed is also applied to the bonus and additional bonus of Self-Destruct Protocol Damage",
  },
  {
    hero: "Commander Moto: Charge Calling (#2)",
    name: "Fuel War with War",
    level: 75,
    affix:
      "Triggers the Main Summon Skill on the closest enemy within 20m every (0.2/0.18/0.15/0.12/0.1) s\n-30% Movement Speed",
  },
  {
    hero: "Berserker Rehan: Anger (#1)",
    name: "Anger",
    level: 1,
    affix:
      "When not in the Berserk state, each Melee Attack Skill generates 10 Rage\nWhen not in the Berserk state, each stack of Melee Attack Skill channeled generates 5 Rage\n0.22% additional damage and 0.1% Movement Speed for every 1 Rage you have\nEnter Berserk automatically at Max Rage\nWhile Berserk is active, 15 Rage is consumed per second\nAttacks trigger Burst once on hit while Berserk is active. Cooldown: 0.3 s\n2.9% additional Burst Damage per 1 levels",
  },
  {
    hero: "Berserker Rehan: Anger (#1)",
    name: "Frenzy Furious",
    level: 45,
    affix:
      "(0.3/0.5/0.7/0.9/1.1)% Critical Strike Rating for every 1 Rage\nWhen Burst lands a Critical Strike, generates 3 Rage. Interval: 0.03 s",
  },
  {
    hero: "Berserker Rehan: Anger (#1)",
    name: "Righteous Fury",
    level: 45,
    affix:
      "Generates (18/23/28/33/40) Rage per second instead of consuming Rage while Berserk is active\nWhen triggering Burst, consumes (8/7/6/5/4) Rage",
  },
  {
    hero: "Berserker Rehan: Anger (#1)",
    name: "Tunnel Vision",
    level: 60,
    affix:
      "-80% additional damage for non-Burst skills\n(+66/+77/+88/+99/+110)% additional Burst Damage",
  },
  {
    hero: "Berserker Rehan: Anger (#1)",
    name: "Rampaging",
    level: 75,
    affix:
      "(70/80/90/100/110)% of the bonus and additional bonus to Attack Speed is also applied to Burst's Cooldown Recovery Speed",
  },
  {
    hero: "Berserker Rehan: Anger (#1)",
    name: "Uncontrolled Anger",
    level: 75,
    affix:
      "+200% additional Burst Area\nFor every +2% Skill Area, +1% additional Burst Damage, up to (+40/+51/+63/+76/+90)%",
  },
  {
    hero: "Berserker Rehan: Seething Silhouette (#2)",
    name: "Seething Silhouette",
    level: 1,
    affix:
      "At Max Rage, click the Trait Skill to enter Berserk\nWhen not in the Berserk state, each stack of Melee Attack Skill channeled generates 5 Rage\nChanneling Melee Attack Skills no longer generates Rage and consumes 5 Rage instead while Berserk is active\nWhen not in the Berserk state, each Melee Attack Skill generates 10 Rage\n+1% Attack Speed for every 5 Rage\nEnter Berserk automatically at Max Rage\n+20% Movement Speed while Berserk is active\nGains bonuses twice the Max Rage while Berserk is active\nWhile Berserk is active, 10 Rage is consumed per second\nCasting Melee Attack Skills no longer generates Rage and consumes 10 points of Rage instead while Berserk is active. The mode ends when Rage runs out\n+30% additional Skill Area while Berserk is active\n+20% additional damage while Berserk is active",
  },
  {
    hero: "Berserker Rehan: Seething Silhouette (#2)",
    name: "Fury's Onslaught",
    level: 45,
    affix:
      "Own Seething Spirit\nWhen a Melee Main Skill is used while Berserk is active, Seething Spirit appears and automatically attacks for (1/1.5/2/2/2) s. Using the Melee Main Skill again will refresh the Seething Spirit's duration\nRage will no longer be naturally consumed while Berserk is active. The Rage consumed by Melee Attack Skills will be halved. (+20/+27/+34/+41/+48)% additional damage dealt by the player",
  },
  {
    hero: "Berserker Rehan: Seething Silhouette (#2)",
    name: "Ritual of Offering",
    level: 45,
    affix:
      "Own Seething Spirit\nSeething Spirit will always exist and attack automatically while Berserk is active\nYou are Disarmed while Berserk is active\n(+20/+25/+30/+35/+40)% additional Seething Spirit Damage\nWhile Berserk is active, takes Secondary Physical Damage equal to 1% of current Life every 0.2 s. This damage is not affected by bonuses\n-30% Movement Speed",
  },
  {
    hero: "Berserker Rehan: Seething Silhouette (#2)",
    name: "Growing Anger",
    level: 60,
    affix:
      "Gains (9/10/11/12/13) additional Rage when Seething Spirit uses a skill. The Rage gained is doubled when Seething Spirit deals Double Damage. Interval: 0.03s",
  },
  {
    hero: "Berserker Rehan: Seething Silhouette (#2)",
    name: "Hysteria",
    level: 60,
    affix:
      "Generates 1 points of Rage when taking damage equal to 3% of the sum of Max Life and Max Energy Shield\nGenerate 1 Rage for every 3% Max Life consumed\n(0.3/0.4/0.5/0.6/0.7)% additional Attack Damage for every 1% Missing Life",
  },
  {
    hero: "Berserker Rehan: Seething Silhouette (#2)",
    name: "Rage Infusion",
    level: 75,
    affix:
      "+5% additional damage per 25 points of Rage gained recently. Stacks up to (6/7/8/9/10) times\nYou will no longer be Disarmed after Berserk has been active for 5s. +40% Rage gained",
  },
  {
    hero: "Berserker Rehan: Seething Silhouette (#2)",
    name: "Split Form",
    level: 75,
    affix:
      "Life Regain no longer requires a hit to activate\n(+20/+25/+30/+35/+40)% additional Max Life\n(+1/+1/+2/+2/+2)% Rage gained for every 40 Max Life",
  },
  {
    hero: "Lightbringer Rosa: High Court Chariot (#1)",
    name: "High Court Chariot",
    level: 1,
    affix:
      "+30% Attack and Spell Block Chance\nRestores 4 Murderous Intent per second\nRestores 10 Murderous Intent when Blocking\nWhen having at least 15 Murderous Intent, you can cast the Trait Skill and consume 15 Murderous Intent to create a Holy Domain centered around you and pull enemies within 8 m inside\nWhile inside the Holy Domain, +20% additional damage",
  },
  {
    hero: "Lightbringer Rosa: High Court Chariot (#1)",
    name: "Unbreakable Stand",
    level: 45,
    affix:
      "(+7/+8/+9/9.5/+10)% additional damage for each enemy in the Holy Domain, up to +100%",
  },
  {
    hero: "Lightbringer Rosa: High Court Chariot (#1)",
    name: "Whirlwind Advance",
    level: 45,
    affix:
      "(+20/+30/+40/+40/+50)% Movement Speed for (4/5/6/8/8) s after entering or leaving the Holy Domain\nRestores (4/5/6/7/8) Murderous Intent upon defeating an enemy in the Holy Domain",
  },
  {
    hero: "Lightbringer Rosa: High Court Chariot (#1)",
    name: "Divine Intervention",
    level: 60,
    affix:
      "For every 1 Murderous Intent you currently have, (0.3/0.37/0.44/0.51/0.58)% additional damage dealt to enemies in the Holy Domain and +1% Murderous Intent restoration\nGains a Skill Slot, in which a Support Skill or Activation Medium Support Skill can be installed to support Trait Skill Holy Domain",
  },
  {
    hero: "Lightbringer Rosa: High Court Chariot (#1)",
    name: "Invulnerability",
    level: 60,
    affix:
      "While inside the Holy Domain, (+7/+9/+11/+13/+15)% Block Ratio and Block Ratio Upper Limit\n(+1/+1/+2/+2/+2)% Murderous Intent restoration for every 1% Block Ratio\nGains a Skill Slot, in which a Support Skill or Activation Medium Support Skill can be installed to support Trait Skill Holy Domain",
  },
  {
    hero: "Lightbringer Rosa: High Court Chariot (#1)",
    name: "Desperation",
    level: 75,
    affix:
      "Trait Skills can be continuously channeled. During this time, the Holy Domain moves with the player, and no Murderous Intent is consumed while channeling. Max channeled stacks: 4\nAt max channeled stacks, loses all channeled stacks and casts Holy Domain again. Based on the number of channeled stacks lost, inflicts a corresponding number of stacks of No Guard on all units in the Holy Domain. No Guard lasts for 8s\nFor every 1% Block Ratio, (0.8/0.9/+1/1.2/1.2)% additional No Guard Effect for enemies and (-0.67/-0.8/-1/-1/-1.2)% additional No Guard Effect on you\n-50% Holy Domain radius",
  },
  {
    hero: "Lightbringer Rosa: High Court Chariot (#1)",
    name: "Improvision",
    level: 75,
    affix:
      "When Blocking in the Holy Domain, +20% additional damage for 2s, up to (+40/+50/+60/+70/+80)%",
  },
  {
    hero: "Lightbringer Rosa: Unsullied Blade (#2)",
    name: "Unsullied Blade",
    level: 1,
    affix:
      "Gains Mystic Mercury\nWhile Mystic Mercury is active, using non-Channeled Attack Skills grants Mercury Pts\nUpon reaching max Mercury Pts, Mystic Mercury becomes Realm of Mercury. Realm of Mercury consumes 30 Mercury Pts every second. When Mercury Pt is 0, Realm of Mercury becomes Mystic Mercury again\nMana can only be consumed by Mystic Mercury. At the same time, Mana can only be restored by Realm of Mercury\nBonus and additional bonus to Spell Damage and also apply to Attack Damage",
  },
  {
    hero: "Lightbringer Rosa: Unsullied Blade (#2)",
    name: "Baptism of Purity",
    level: 45,
    affix:
      "+20% additional Max Mana\nInside Realm of Mercury, selects the enemy with the highest rarity that took damage from you recently and records (12/20/28/36/44)% of the non-Channeled Attack Elemental Hit Damage dealt to this enemy. Every 0.5 s, it casts Mercury Baptism on all enemies within it and gains (5/5/6/6/7) Mercury Pts\nMercury Baptism inflicts an Elemental Ailment of the same type as the highest recorded damage. If the highest recorded damage type is Fire, it inflicts Scorch. If the highest recorded damage type is Lightning, it inflicts 1 stack(s) of Numbed. If the highest recorded damage type is Cold, it inflicts Frostbite and 20 Frostbite Rating",
  },
  {
    hero: "Lightbringer Rosa: Unsullied Blade (#2)",
    name: "Boundless Sanctuary",
    level: 60,
    affix:
      "For every (150/130/110/100/90) Max Mana you have, +10% Area for Realm of Mercury, up to (+60/+70/+80/+90/+100)%\nFor every enemy inside Realm of Mercury, (+6/+7/+8/+9/+10)% additional Elemental Damage, up to (+60/+70/+80/+90/+100)% additional damage\nGains (3/3/4/4/4) Mercury Pts upon defeating an enemy within Realm of Mercury",
  },
  {
    hero: "Lightbringer Rosa: Unsullied Blade (#2)",
    name: "Cleanse Filth",
    level: 60,
    affix:
      "While Realm of Mercury is in effect, 25% of damage is taken from Mana before Life\nFor every 1000 Max Mana you have, (+3/3.5/+4/4.5/+5)% additional Elemental Damage, up to (+60/+70/+80/+90/+100)%",
  },
  {
    hero: "Lightbringer Rosa: Unsullied Blade (#2)",
    name: "Born to Cleanse",
    level: 75,
    affix:
      "- 30% additional Mana restoration for Realm of Mercury\nMystic Mercury gains an additional effect: +25% additional Elemental Damage\nMystic Mercury still exists when it becomes Realm of Mercury and retains 40% effect\nWhile Mystic Mercury is active, (+20/+27/+34/+41/+48)% additional damage for Weapons",
  },
  {
    hero: "Lightbringer Rosa: Unsullied Blade (#2)",
    name: "Utmost Devotion",
    level: 75,
    affix:
      "Mana can be consumed via methods other than Mystic Mercury. Gains 10% Mercury Pts for every (3000/2900/2800/2700/2600) Mana consumed\nThe cost is fixed at 0 when Mana is lower than 10%\nFor every 1000 Max Mana you have, +10% Max Mercury Pts, up to (+200/+250/+300/+350/+400)%\n(0.12/0.16/0.2/0.24/0.28)% additional Elemental Damage for every Mercury Pt you have",
  },
  {
    hero: "Tide Whisper Selena: Sing with the Tide",
    name: "Sing with the Tide",
    level: 1,
    affix:
      "Click the Trait Slot to switch between Bard and Loud Song\nIn the Bard state, Attack Channeled Skills and Attack Mobility Skills cannot be used\nIn the Bard state, it is possible to move while casting Spell Channeled Skills, and -20% additional Channeled Skill Damage\nIn the Bard state, the Main Skill is auto channeled while moving\nIn the Bard state, all non-instant and non-Mobility Skills will channel Bard Song instead. Bard Song loses all channeled stacks after reaching max stacks and casts a bubble. This bubble bursts upon making contact with an enemy or reaching the maximum distance, using the corresponding skill once at the location.\nThe bubble leaves a Tide where it bursts and at the feet of enemies it collides with, lasting for 6 s\nIn the Loud Song state, -20% additional Attack and Cast Speed, -20% additional Movement Speed, and +50% additional Tide Effect\nWhen contacting a Tide, gains the following Tide Effect: Ignore physical collisions with enemies and +15% additional damage for 4 s",
  },
  {
    hero: "Tide Whisper Selena: Sing with the Tide",
    name: "Undersea Ballad",
    level: 45,
    affix:
      "Tide's area is no longer affected by Skill Area\n100% of the increase/decrease on Skill Area is also applied to Tide Effect, up to (+90/+100/+110/+120/+130)%",
  },
  {
    hero: "Tide Whisper Selena: Sing with the Tide",
    name: "Wave Aria",
    level: 45,
    affix:
      "Tide grants an additional effect: (+10/+13/+16/+19/+22)% additional damage against enemies on the Tide\nIn the Bard state, the bubble no longer leaves a Tide; instead, you will leave a Tide along your path and at the feet of enemies you collide with. Lasts for 4 s",
  },
  {
    hero: "Tide Whisper Selena: Sing with the Tide",
    name: "Idyll of the Tide",
    level: 60,
    affix:
      "Tide grants the following additional effects: For every 1 m moved in the Tide, (+1/1.3/1.6/1.9/2.2)% additional damage while in the Tide. Stacks up to 15 time(s) and lasts until Tide is completely lost\nAfter losing all Tides, automatically switch to Bard",
  },
  {
    hero: "Tide Whisper Selena: Sing with the Tide",
    name: "Sea Foam Nocturne",
    level: 60,
    affix:
      "For every +1 max or min Channeled Stacks, (+12/+14/+16/+18/+20)% bubble flying speed and (+16/+18/+20/+22/+24)% additional Tide Effect. Stacks up to 5 time(s)\nMin Channeled Stacks takes effect twice on Bard Song",
  },
  {
    hero: "Tide Whisper Selena: Sing with the Tide",
    name: "Chantey of Sinking",
    level: 75,
    affix:
      "For every 1 s in the Loud Song state, (+25/+35/+45/+55/+65)% Tide Area and (+25/+35/+45/+55/+65)% Tide Effect. Stacks up to 2 time(s) and lasts until all Tides are lost or you exit the Loud Song state",
  },
  {
    hero: "Tide Whisper Selena: Sing with the Tide",
    name: "Murmurs of the Distant Tide",
    level: 75,
    affix:
      "In the Bard state, (-50/-50/-50/-50/-40)% Tide Duration and (+60/+70/+80/+90/+100)% additional Tide Effect",
  },
  {
    hero: "Oracle Thea: Incarnation of The Gods (#1)",
    name: "Incarnation of the Gods",
    level: 1,
    affix:
      "Gain a Divine Blessing every 2s in the following order: Focus Blessing - Agility Blessing - Tenacity Blessing\nClick the Trait Skill to use Divine Realm on the closest enemy for 8 s. Cooldown: 8 s\nDeals +7% additional damage to Full-Life enemies for every stack of Agility Blessing. Stacks up to 20 times.\n+7% additional damage against enemies at Low-Life for every stack of Tenacity Blessing. Stacks up to 20 times.\nConverts all Tenacity Blessing to Agility Blessing when outside the Divine Realm\nConverts all Agility Blessing to Tenacity Blessing when within the Divine Realm",
  },
  {
    hero: "Oracle Thea: Incarnation of The Gods (#1)",
    name: "Divinity",
    level: 45,
    affix:
      "(+10/+12/+14/+16/+19)% additional damage (multiplies) each time a Blessing reaches its max stacks\nThe increase/decrease of max Tenacity Blessing stacks is also applied to Agility Blessing when you're outside of the Divine Realm.\nThe increase/decrease of max Agility Blessing stacks is also applied to Tenacity Blessing when you're within the Divine Realm.\nGains a Skill Slot, in which a Support Skill or Activation Medium Support Skill can be installed to support Trait Skill Divine Realm",
  },
  {
    hero: "Oracle Thea: Incarnation of The Gods (#1)",
    name: "Divine Realm Power",
    level: 60,
    affix:
      "(+20/+26/+32/+38/+45)% additional damage to enemies in the Divine Realm\n+1% Movement Speed for 30 s upon defeating an enemy in the Divine Realm. Stacks up to 20 time(s)\nWhen there are no enemies in the Divine Realm, refreshes the cooldown of Divine Realm",
  },
  {
    hero: "Oracle Thea: Incarnation of The Gods (#1)",
    name: "Might Flow",
    level: 60,
    affix:
      "0.75% additional Attack and Cast Speed for every stack of any Blessing owned when outside the Divine Realm, up to an additional +15%\n(0.5/0.8/1.1/1.4/1.7)% additional damage for every stack of any Blessing owned when outside the Divine Realm, up to an additional (+10/+16/+22/+28/+34)%\n(-1/-1.2/-1.4/-1.6/-1.8)% additional damage taken for every stack of any blessing owned while within area of Divine Realm, up to (-20/-24/-28/-32/-38)%",
  },
  {
    hero: "Oracle Thea: Incarnation of The Gods (#1)",
    name: "Divine Spirit",
    level: 75,
    affix:
      "-70% Divine Realm skill radius\n(1.7/1.5/1.3/1.1/0.8)% additional damage taken for every 4% of Missing Life when outside the Divine Realm\nWhen dealing damage outside the Divine Realm, enemies with a higher percentage of Life than you will be considered Full-Life enemies",
  },
  {
    hero: "Oracle Thea: Incarnation of The Gods (#1)",
    name: "Incarnation",
    level: 75,
    affix:
      "The Divine Realm will follow you\nFor (1/1/2/2/2) s after inflicting damage to an enemy for the first time, this enemy is deemed to be at Low Life\nWhen casting a Divine Realm, for every 1 stack(s) of Blessings, (+1/1.25/1.5/1.75/+2)% additional damage dealt inside the Divine Realm until the Divine Realm ends",
  },
  {
    hero: "Oracle Thea: Wisdom of The Gods (#2)",
    name: "Wisdom of The Gods",
    level: 1,
    affix:
      "Gain a Divine Blessing every 2s in the following order: Focus Blessing - Agility Blessing - Tenacity Blessing\nClick the Trait Skill to cast God's Boon\nGod's Boon: Consumes all Focus Blessings to grant self God's Boon. Cooldown: 15 s\n+6% additional damage for each stack of Focus Blessing that God's Boon consumes. Lasts for 10 s. Stacks up to 8 time(s)",
  },
  {
    hero: "Oracle Thea: Wisdom of The Gods (#2)",
    name: "Finale Prophecy",
    level: 45,
    affix:
      "0.8 to the radius of God's Boon for each stack of blessing consumed by God's Boon\nFor each enemy within range of God's Boon, (+3/3.7/4.4/5.1/+6)% additional damage after granting God's Boon. Lasts for 10 s. Stacks up to 10 time(s)",
  },
  {
    hero: "Oracle Thea: Wisdom of The Gods (#2)",
    name: "Predicted Harvest",
    level: 45,
    affix:
      "Automatically try to use God's Boon when Focus Blessing is at max stacks\n(30/35/40/45/50)% chance to gain an additional stack of Focus Blessing when Tenacity Blessing, Agility Blessing or Focus Blessing is gained",
  },
  {
    hero: "Oracle Thea: Wisdom of The Gods (#2)",
    name: "Predicted Hope",
    level: 60,
    affix:
      "God's Boon will now consume all Tenacity Blessing and Agility Blessing stacks\n(+2/2.3/2.6/2.9/3.2)% additional All Damage for each stack of Blessing that God's Boon consumes. Lasts for 10 s. Stacks up to 20 time(s)",
  },
  {
    hero: "Oracle Thea: Wisdom of The Gods (#2)",
    name: "Predicted Reincarnation",
    level: 60,
    affix:
      "(+3/+4/+5/+6/+7)% additional God's Boon Cooldown Recovery Speed for every stack of Focus Blessing consumed by God's Boon\n(+20/+24/+28/+32/+36)% additional damage if God's Boon consumes max stacks of Focus Blessing. Lasts for 10 s",
  },
  {
    hero: "Oracle Thea: Wisdom of The Gods (#2)",
    name: "Farewell Prophecy",
    level: 75,
    affix:
      "(+4/4.5/+5/5.5/+6)% Double Damage Chance for each stack of Focus Blessing that God's Boon consumes. Lasts for 10 s. Stacks up to 10 time(s)\nFor every 1% overflown Double Damage Chance, there is a 1% chance to deal Quadruple Damage instead",
  },
  {
    hero: "Oracle Thea: Wisdom of The Gods (#2)",
    name: "Predicted Justice",
    level: 75,
    affix:
      "The biggest max stack bonus of Agility Blessing or Tenacity Blessing is also applied to the max stack bonus of Focus Blessing\n(-25/-22.5/-20/-17.5/-15)% additional Cooldown Recovery Speed",
  },
  {
    hero: "Oracle Thea: Blasphemer (#3)",
    name: "Blasphemer",
    level: 1,
    affix:
      "Gain a Divine Blessing every 2s in the following order: Focus Blessing - Agility Blessing - Tenacity Blessing\nClick the Trait Skill to inflict Desecration on the enemy with the highest rarity within 15m. Cooldown: 5s. Inflicts one-third of the max stacks each time (rounded up)\nConverts the effects of affixes that increase Max Blessings Stacks into effects that reduce Max Blessings Stacks and increase Max Desecration Stacks. Increases Max Desecration Stacks by up to 4 for each type of Blessings\nTriggers the Trait Skill and ignores its cooldown when gaining any Blessing. Interval: 0.3s",
  },
  {
    hero: "Oracle Thea: Blasphemer (#3)",
    name: "Unholy Baptism",
    level: 45,
    affix:
      "(+5/+10/+15/+20/+25)% additional Erosion Damage\nEnemies within 6m of a Desecrated target have a (30/40/40/50/50)% chance to explode when defeated, dealing Erosion Damage equal to 10% of their Max Life to enemies within a (3/4/4/5/5) m radius",
  },
  {
    hero: "Oracle Thea: Blasphemer (#3)",
    name: "Disgraced Minister",
    level: 60,
    affix:
      "Desecration only affects Elites\nWhen there are no other enemies within 6m of the Desecrated target, the target gains Sacrificial Pawn\n(+10/+15/+20/+25/+30)% Erosion Resistance\n(+3/+4/+4/+5/+5)% Max Erosion Resistance",
  },
  {
    hero: "Oracle Thea: Blasphemer (#3)",
    name: "Tarnished Sage",
    level: 60,
    affix:
      "Up to 2 Elites within 6m of a Desecrated target will also be inflicted with Desecration\nInstantly restores (5/6/7/8/9)% of Max Life, Energy Shield, and Mana when defeating a Desecrated target.\n+ (10/15/20/25/30)% Attack, Movement, and Cast Speed when dealing damage to a Desecrated target. Lasts for 5s. This effect cannot stack",
  },
  {
    hero: "Oracle Thea: Blasphemer (#3)",
    name: "Extreme Desecration",
    level: 75,
    affix:
      "If the Max Blessings Stacks are further increased when the max stacks of all Blessings are 0, converts the effects of their affixes into effects that increase Max Desecration Stacks. Desecration stacks up to 25 times\nDesecration gains an additional base effect: (0.2/0.25/0.3/0.35/0.4)% additional Erosion Damage taken for every 5% of Life the target loses",
  },
  {
    hero: "Oracle Thea: Blasphemer (#3)",
    name: "Onset of Depravity",
    level: 75,
    affix:
      "When inflicting Desecration on an Elite for the first time, deals True Damage equal to (3/6/9/12/15)% of their Max Life. (30/40/50/60/70)% of the max Desecration stacks is also applied to this value to deal True Damage equal to up to 25% of their Max Life\nWhen a Desecrated target is under a crowd control effect, the target gains Mountain of Sins",
  },
  {
    hero: "Spacetime Witness Youga: Spacetime Illusion (#1)",
    name: "Spacetime Illusion",
    level: 1,
    affix:
      "-50 Spacetime Energy consumption\nImmediately gains Spacetime Illusion\nOwn Spacetime Illusion\nThe Spacetime Illusion uses your Main Skill once every 1.5 s. The Spacetime Illusion's castings are considered your castings\nWhile having Spacetime Illusion, click the Trait Skill to recall Spacetime Illusion",
  },
  {
    hero: "Spacetime Witness Youga: Spacetime Illusion (#1)",
    name: "Me and Myself",
    level: 45,
    affix:
      "+30% Spacetime Illusion Cast Frequency\nFor every +5% Cooldown Recovery Speed or 2.5% additional Cooldown Recovery Speed, (+5/+7/+9/+11/+13)% Spacetime Illusion Cast Frequency",
  },
  {
    hero: "Spacetime Witness Youga: Spacetime Illusion (#1)",
    name: "Eeeendless Mana",
    level: 60,
    affix:
      "Seals 35% Max Mana. Spacetime Illusion no longer has Cast Frequency limitations\n(+1/1.15/1.3/1.45/1.6)% additional Spacetime Illusion Damage for every +4% Spacetime Illusion Cast Frequency",
  },
  {
    hero: "Spacetime Witness Youga: Spacetime Illusion (#1)",
    name: "Make it Quick",
    level: 60,
    affix:
      "Spacetime Illusion no longer has casting actions and is only limited by cast frequency.\n(20/23/26/29/33)% of the bonuses and additional bonuses for Cast Speed is also applied to additional Spacetime Illusion Damage.",
  },
  {
    hero: "Spacetime Witness Youga: Spacetime Illusion (#1)",
    name: "I'm an Illusion",
    level: 75,
    affix:
      "Unable to cast the Main Skill\n+1 Spacetime Illusion upper limit\n(-5/-1/+3/+7/+11)% additional Spacetime Illusion Damage\n-30% Movement Speed",
  },
  {
    hero: "Spacetime Witness Youga: Spacetime Illusion (#1)",
    name: "I'm Out of Mana",
    level: 75,
    affix:
      "Casting of Spacetime Illusion will consume your Mana, equal to the Mana Cost of your Main Skill\n(+5/6.3/7.5/8.8/+10)% additional damage for you and Spacetime Illusion for each time Spacetime Illusion consumed Mana recently. Stacks up to 10 time(s)",
  },
  {
    hero: "Spacetime Witness Youga: Spacetime Elapse (#2)",
    name: "Spacetime Elapse",
    level: 1,
    affix:
      "Clicking the Trait Skill or dealing Damage Over Time to an enemy casts Twisted Spacetime. Interval: 4 s. Lasts for 6 s\nWhile Twisted Spacetime is active, cast Twisted Spacetime again to move it and extend its Duration by 4\nRecords 40% of Damage Over Time dealt to enemies while Twisted Spacetime is active\nAfter moving, Twisted Spacetime inflicts Turbulence on enemies within, having them share the damage it records equally and clearing the records",
  },
  {
    hero: "Spacetime Witness Youga: Spacetime Elapse (#2)",
    name: "Spacetime Speed-up",
    level: 45,
    affix:
      "Reduces the casting interval of Twisted Spacetime by 1 s on defeat\nFor every 1 s Twisted Spacetime lasts, (+5/6.5/+8/9.5/+11)% recorded Damage Over Time for Twisted Spacetime. Stacks up to 10 time(s)",
  },
  {
    hero: "Spacetime Witness Youga: Spacetime Elapse (#2)",
    name: "Spacetime Upheaval",
    level: 45,
    affix:
      "(+30/+37/+44/+51/+58)% additional Damage Over Time while Twisted Spacetime lasts\nTwisted Spacetime only inflicts Spacetime Turbulence on Elites within its area. Records are not cleared when there are no Elites within its area",
  },
  {
    hero: "Spacetime Witness Youga: Spacetime Elapse (#2)",
    name: "Spacetime Cutting",
    level: 60,
    affix:
      "For every 1% Twisted Spacetime-recording Damage Over Time dealt to enemies, adds (0.4/0.45/0.5/0.55/0.6)% of the Reaping and Reap Purification damage dealt to enemies to damage recorded by Twisted Spacetime",
  },
  {
    hero: "Spacetime Witness Youga: Spacetime Elapse (#2)",
    name: "Spacetime Expansion",
    level: 75,
    affix:
      "(+50/+62/+74/+86/+98)% additional Duration for Twisted Spacetime and Spacetime Turbulence\nEnemies with Spacetime Turbulence are deemed as being within Twisted Spacetime",
  },
  {
    hero: "Spacetime Witness Youga: Spacetime Elapse (#2)",
    name: "Spacetime Pause",
    level: 75,
    affix:
      "(-40/-43/-46/-49/-50)% additional Spacetime Turbulence Duration\n(+125/+160/+195/+230/+265)% Twisted Spacetime-recording Damage Over Time",
  },
] as const satisfies readonly BaseHeroTrait[];
