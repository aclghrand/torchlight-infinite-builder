import type { SupportSkillName } from "@/src/data/skill";
import type { Mod } from "../mod";

export type ModWithoutValue = Mod extends infer M
  ? M extends Mod
    ? Omit<M, "value">
    : never
  : never;

export type SkillModTemplate = {
  levelMods?: ModWithoutValue[];
};

export const skillModTemplates: Partial<
  Record<SupportSkillName, SkillModTemplate>
> = {
  Willpower: {
    levelMods: [
      { type: "MaxWillpowerStacks" },
      { type: "DmgPct", modType: "global", addn: false, per: "willpower" },
    ],
  },
  Haunt: {
    levelMods: [
      { type: "ShadowQuant" },
      { type: "DmgPct", modType: "global", addn: true },
    ],
  },
  Steamroll: {
    levelMods: [
      { type: "AspdPct", addn: false },
      { type: "DmgPct", modType: "melee", addn: true },
      { type: "DmgPct", modType: "ailment", addn: true },
    ],
  },
  "Quick Decision": {
    levelMods: [{ type: "AspdAndCspdPct", addn: true }],
  },
};
