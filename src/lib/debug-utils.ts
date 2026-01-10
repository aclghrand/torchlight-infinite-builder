import type { HeroTraitName } from "@/src/data/hero-trait/types";
import {
  ActiveSkills,
  type BaseSkill,
  PassiveSkills,
  SupportSkills,
} from "@/src/data/skill";
import type {
  Affix,
  BaseSupportSkillSlot,
  Loadout,
  SkillSlot,
} from "@/src/tli/core";
import { isHeroTraitImplemented } from "@/src/tli/hero/hero-trait-mods";
import { isSkillImplemented } from "@/src/tli/skills/is-implemented";

export interface UnparseableAffix {
  text: string;
  src: string;
}

export const collectUnparseableAffixes = (
  allAffixes: Affix[],
): UnparseableAffix[] => {
  const result: UnparseableAffix[] = [];
  for (const affix of allAffixes) {
    const src = affix.src ?? "unknown";
    for (const line of affix.affixLines) {
      if (line.mods === undefined) {
        result.push({ text: line.text, src });
      }
    }
  }
  return result;
};

export interface UnimplementedItem {
  name: string;
  type: "Active Skill" | "Passive Skill" | "Support Skill" | "Hero Trait";
}

const findSkillByName = (name: string): BaseSkill | undefined => {
  return (
    ActiveSkills.find((s) => s.name === name) ??
    PassiveSkills.find((s) => s.name === name) ??
    SupportSkills.find((s) => s.name === name)
  );
};

export const collectUnimplementedItems = (
  loadout: Loadout,
): UnimplementedItem[] => {
  const result: UnimplementedItem[] = [];
  const seen = new Set<string>();

  const addIfUnimplemented = (
    name: string,
    type: UnimplementedItem["type"],
  ): void => {
    const key = `${type}:${name}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push({ name, type });
  };

  // Collect skills from skill page
  const processSkillSlot = (
    slot: SkillSlot | undefined,
    expectedType: "Active Skill" | "Passive Skill",
  ): void => {
    if (slot === undefined || slot.skillName === undefined) return;
    const skill = findSkillByName(slot.skillName);
    if (skill !== undefined && !isSkillImplemented(skill)) {
      addIfUnimplemented(slot.skillName, expectedType);
    }
  };

  const processSupportSlot = (slot: BaseSupportSkillSlot | undefined): void => {
    if (slot === undefined) return;
    const skill = findSkillByName(slot.name);
    if (skill !== undefined && !isSkillImplemented(skill)) {
      addIfUnimplemented(slot.name, "Support Skill");
    }
  };

  // Active skills and their supports
  const activeSlots = loadout.skillPage.activeSkills;
  for (const slotKey of [1, 2, 3, 4, 5] as const) {
    const slot = activeSlots[slotKey];
    if (slot?.enabled === true) {
      processSkillSlot(slot, "Active Skill");
      for (const supportKey of [1, 2, 3, 4, 5] as const) {
        processSupportSlot(slot.supportSkills[supportKey]);
      }
    }
  }

  // Passive skills and their supports
  const passiveSlots = loadout.skillPage.passiveSkills;
  for (const slotKey of [1, 2, 3, 4] as const) {
    const slot = passiveSlots[slotKey];
    if (slot?.enabled === true) {
      processSkillSlot(slot, "Passive Skill");
      for (const supportKey of [1, 2, 3, 4, 5] as const) {
        processSupportSlot(slot.supportSkills[supportKey]);
      }
    }
  }

  // Hero traits
  const traits = loadout.heroPage.traits;
  for (const traitSlot of [
    "level1",
    "level45",
    "level60",
    "level75",
  ] as const) {
    const trait = traits[traitSlot];
    if (trait !== undefined) {
      if (!isHeroTraitImplemented(trait.name as HeroTraitName)) {
        addIfUnimplemented(trait.name, "Hero Trait");
      }
    }
  }

  return result;
};
