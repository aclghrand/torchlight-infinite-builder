import {
  type BaseCoreTalent,
  type CoreTalentName,
  CoreTalentNames,
  CoreTalents,
} from "@/src/data/core_talent";
import { isGodGoddessTree } from "@/src/tli/talent_tree";

export type TreeSlot = "tree1" | "tree2" | "tree3" | "tree4";

/**
 * Check if the given text matches a core talent name and return it.
 * Returns undefined if not a core talent.
 */
export const getCoreTalentNameFromText = (
  text: string,
): CoreTalentName | undefined => {
  const normalized = text.trim();
  return CoreTalentNames.find((name) => name === normalized) as
    | CoreTalentName
    | undefined;
};

export const getCoreTalentsForTree = (treeName: string): BaseCoreTalent[] => {
  const normalizedName = treeName.replace(/_/g, " ");
  return CoreTalents.filter((ct) => ct.tree === normalizedName);
};

export const getAvailableGodGoddessCoreTalents = (
  treeName: string,
  alreadySelected: string[],
): { firstSlot: BaseCoreTalent[]; secondSlot: BaseCoreTalent[] } => {
  const allTalents = getCoreTalentsForTree(treeName);
  const firstThree = allTalents.slice(0, 3);
  const lastThree = allTalents.slice(3, 6);

  const filterSelected = (talents: BaseCoreTalent[]) =>
    talents.filter((ct) => !alreadySelected.includes(ct.name));

  return {
    firstSlot: filterSelected(firstThree),
    secondSlot: filterSelected(lastThree),
  };
};

export const getAvailableProfessionCoreTalents = (
  treeName: string,
  alreadySelected: string[],
): BaseCoreTalent[] => {
  return getCoreTalentsForTree(treeName).filter(
    (ct) => !alreadySelected.includes(ct.name),
  );
};

export const getMaxCoreTalentSlots = (slot: TreeSlot): number =>
  slot === "tree1" ? 2 : 1;

export { isGodGoddessTree };
