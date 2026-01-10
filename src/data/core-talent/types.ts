import type { Tree } from "../talent";
import { CoreTalents } from "./core-talents";

export interface BaseCoreTalent {
  name: string;
  tree: Tree;
  affix: string;
}

export const CoreTalentNames = CoreTalents.map((t) => t.name);
export type CoreTalentName = (typeof CoreTalentNames)[number];
