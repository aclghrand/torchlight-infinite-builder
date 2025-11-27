import { BaseSkill } from "./types";

export const ActivationMediumSkills = [
  {
    type: "Activation Medium",
    name: "Activation Medium: Boss",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Burst Activation",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Channel",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Critical Strike",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Demolisher",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Elite",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Energy Shield",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Instruction",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Life",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Lock On",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Minion",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Motionless",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Multistrike",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Perpetual Motion",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Preparation",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Resonance",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Resonance Activation",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Rhythm",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Root",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Root Attack",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Sentry",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Severe Injury",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Spell Burst",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Start",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Still Attack",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Track",
    tags: [],
  },
  {
    type: "Activation Medium",
    name: "Activation Medium: Wind Rhythm",
    tags: [],
  },
] as const satisfies readonly BaseSkill[];

export type ActivationMediumSkill = (typeof ActivationMediumSkills)[number];
