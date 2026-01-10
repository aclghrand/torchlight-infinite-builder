import { type BaseCoreTalent, CoreTalents } from "@/src/data/core-talent";
import { isGodGoddessTree } from "@/src/tli/talent-tree";

export type TreeSlot = "tree1" | "tree2" | "tree3" | "tree4";

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

  // For each slot, filter out talents selected in the OTHER slot only
  // so the current slot's selection remains visible
  const slot1Selected = alreadySelected[0];
  const slot2Selected = alreadySelected[1];

  return {
    firstSlot: firstThree.filter(
      (ct) => ct.name === slot1Selected || ct.name !== slot2Selected,
    ),
    secondSlot: lastThree.filter(
      (ct) => ct.name === slot2Selected || ct.name !== slot1Selected,
    ),
  };
};

export const getAvailableProfessionCoreTalents = (
  treeName: string,
  _alreadySelected: string[],
): BaseCoreTalent[] => {
  // With only one slot, show all talents including the selected one
  return getCoreTalentsForTree(treeName);
};

export const getMaxCoreTalentSlots = (slot: TreeSlot): number =>
  slot === "tree1" ? 2 : 1;

export { isGodGoddessTree };
