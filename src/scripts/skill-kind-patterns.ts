import type { BaseSkill, InferredSkillKind } from "../data/skill/types";

// Regex patterns for each InferredSkillKind
// These provide deterministic classification without LLM calls
export const SKILL_KIND_PATTERNS: Record<InferredSkillKind, RegExp[]> = {
  deal_damage: [
    // Weapon/Base damage patterns
    /\d+%?\s*(Weapon Attack|Base|Spell \w+)\s*Damage/i,
    // "deals X Damage" or "dealing X Damage"
    /deal(s|ing)?\s+\d+[-\d]*\s*\w*\s*Damage/i,
    // Secondary damage
    /Secondary \w+ Damage/i,
    // Persistent damage (DoT but still damage)
    /Persistent \w+ Damage/i,
    // Counterattack damage
    /Counterattack.*Damage/i,
  ],
  dot: [
    // Persistent damage is always DoT
    /Persistent \w+ Damage/i,
    // Explicit DoT language
    /Damage Over Time/i,
    // Per second damage
    /damage\s+(every|per)\s+second/i,
  ],
  hit_enemies: [
    // Weapon attack damage is a hit
    /Weapon Attack Damage/i,
    // "on hit" language
    /on hit/i,
    // Attack damage
    /Attack \w+ Damage/i,
    // Secondary damage is always a hit
    /Secondary \w+ Damage/i,
    // Spell damage (but not persistent/DoT)
    /Spell \w+ Damage(?!.*Persistent)/i,
    // Base Damage is typically a hit
    /Base Damage/i,
  ],
  inflict_ailment: [
    // Chance to inflict specific ailments
    /chance to (Ignite|Frostbite|Shock|Poison|Wilt)/i,
    // Frostbitten variant
    /chance to be Frostbitten/i,
    // Inflict language
    /inflicts?\s+\w*\s*(Ignite|Frostbite|Shock|Poison|Wilt)/i,
    // Ailment damage bonuses suggest skill can inflict ailments
    /\+\d+%?\s+(Ignite|Frostbite|Shock|Poison|Wilt)\s+Damage/i,
  ],
  summon_minions: [
    // Summon minion(s)
    /summons?\s+(a\s+)?Minions?/i,
    // Minion + summon anywhere
    /Minion.*summon/i,
    /summon.*Minion/i,
  ],
  summon_spirit_magus: [
    // Spirit Magus or Spirit Magi (plural)
    /Spirit Mag(us|i)/i,
  ],
  summon_synthetic_troops: [
    // Synthetic Troop(s)
    /Synthetic Troops?/i,
  ],
};

// Classify a skill using regex patterns only
export const classifyWithRegex = (skill: BaseSkill): InferredSkillKind[] => {
  const text = `${skill.description.join(" ")} ${skill.tags.join(" ")}`;
  const matches: InferredSkillKind[] = [];

  for (const [kind, patterns] of Object.entries(SKILL_KIND_PATTERNS)) {
    if (patterns.some((p) => p.test(text))) {
      matches.push(kind as InferredSkillKind);
    }
  }

  return matches;
};

// Check if a skill has tags that suggest it might need LLM review
// even if regex found some matches (for improved accuracy)
export const isAmbiguous = (skill: BaseSkill): boolean => {
  const text = skill.description.join(" ");

  // Skills with complex mechanics might need LLM review
  const ambiguousPatterns = [
    /if.*then/i, // Conditional effects
    /when.*trigger/i, // Triggered effects
    /converts?/i, // Conversion mechanics
  ];

  return ambiguousPatterns.some((p) => p.test(text));
};
