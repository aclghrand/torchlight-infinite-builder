import { createFileRoute } from "@tanstack/react-router";
import { HeroTab } from "../../components/hero/HeroTab";
import type { HeroMemory, HeroMemorySlot } from "../../lib/save-data";
import { useBuilderActions, useLoadout } from "../../stores/builderStore";

export const Route = createFileRoute("/builder/hero")({ component: HeroPage });

function HeroPage(): React.ReactNode {
  const loadout = useLoadout();
  const {
    resetHeroPage,
    setTrait,
    equipHeroMemoryById,
    addHeroMemory,
    copyHeroMemory,
    deleteHeroMemory,
  } = useBuilderActions();

  return (
    <HeroTab
      heroPage={loadout.heroPage}
      heroMemoryList={loadout.heroPage.memoryInventory}
      onHeroChange={resetHeroPage}
      onTraitSelect={(
        level: 45 | 60 | 75,
        group: "a" | "b",
        traitName: string | undefined,
      ) => {
        const key =
          group === "a"
            ? (`level${level}` as "level45" | "level60" | "level75")
            : (`level${level}b` as "level45b" | "level60b" | "level75b");
        setTrait(key, traitName);
      }}
      onMemoryEquip={(slot: HeroMemorySlot, memoryId: string | undefined) =>
        equipHeroMemoryById(slot, memoryId)
      }
      onMemorySave={(memory: HeroMemory) => addHeroMemory(memory)}
      onMemoryCopy={copyHeroMemory}
      onMemoryDelete={deleteHeroMemory}
    />
  );
}
