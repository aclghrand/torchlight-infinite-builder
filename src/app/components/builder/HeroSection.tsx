"use client";

import { useCallback } from "react";
import { useBuilderStore } from "../../stores/builderStore";
import { HeroTab } from "../hero/HeroTab";
import { HeroMemory, HeroMemorySlot } from "../../lib/save-data";
import { getBaseTraitForHero } from "../../lib/hero-utils";
import { createEmptyHeroPage, generateItemId } from "../../lib/storage";

export const HeroSection = () => {
  const loadout = useBuilderStore((state) => state.loadout);
  const updateLoadout = useBuilderStore((state) => state.updateLoadout);

  const handleHeroChange = useCallback(
    (hero: string | undefined) => {
      updateLoadout((prev) => {
        if (!hero) {
          return {
            ...prev,
            heroPage: createEmptyHeroPage(),
          };
        }

        const baseTrait = getBaseTraitForHero(hero);

        return {
          ...prev,
          heroPage: {
            selectedHero: hero,
            traits: {
              level1: baseTrait?.name,
              level45: undefined,
              level60: undefined,
              level75: undefined,
            },
            memorySlots: {
              slot45: undefined,
              slot60: undefined,
              slot75: undefined,
            },
          },
        };
      });
    },
    [updateLoadout],
  );

  const handleTraitSelect = useCallback(
    (level: 45 | 60 | 75, traitName: string | undefined) => {
      const traitKey = `level${level}` as "level45" | "level60" | "level75";
      updateLoadout((prev) => ({
        ...prev,
        heroPage: {
          ...prev.heroPage,
          traits: {
            ...prev.heroPage.traits,
            [traitKey]: traitName,
          },
        },
      }));
    },
    [updateLoadout],
  );

  const handleMemoryEquip = useCallback(
    (slot: HeroMemorySlot, memoryId: string | undefined) => {
      updateLoadout((prev) => {
        const memory = memoryId
          ? prev.heroMemoryList.find((m) => m.id === memoryId)
          : undefined;

        return {
          ...prev,
          heroPage: {
            ...prev.heroPage,
            memorySlots: {
              ...prev.heroPage.memorySlots,
              [slot]: memory,
            },
          },
        };
      });
    },
    [updateLoadout],
  );

  const handleMemorySave = useCallback(
    (memory: HeroMemory) => {
      updateLoadout((prev) => ({
        ...prev,
        heroMemoryList: [...prev.heroMemoryList, memory],
      }));
    },
    [updateLoadout],
  );

  const handleMemoryCopy = useCallback(
    (memory: HeroMemory) => {
      const newMemory: HeroMemory = { ...memory, id: generateItemId() };
      updateLoadout((prev) => ({
        ...prev,
        heroMemoryList: [...prev.heroMemoryList, newMemory],
      }));
    },
    [updateLoadout],
  );

  const handleMemoryDelete = useCallback(
    (memoryId: string) => {
      updateLoadout((prev) => {
        const newMemoryList = prev.heroMemoryList.filter(
          (m) => m.id !== memoryId,
        );
        const newMemorySlots = { ...prev.heroPage.memorySlots };
        if (newMemorySlots.slot45?.id === memoryId) {
          newMemorySlots.slot45 = undefined;
        }
        if (newMemorySlots.slot60?.id === memoryId) {
          newMemorySlots.slot60 = undefined;
        }
        if (newMemorySlots.slot75?.id === memoryId) {
          newMemorySlots.slot75 = undefined;
        }

        return {
          ...prev,
          heroMemoryList: newMemoryList,
          heroPage: {
            ...prev.heroPage,
            memorySlots: newMemorySlots,
          },
        };
      });
    },
    [updateLoadout],
  );

  return (
    <HeroTab
      heroPage={loadout.heroPage}
      heroMemoryList={loadout.heroMemoryList}
      onHeroChange={handleHeroChange}
      onTraitSelect={handleTraitSelect}
      onMemoryEquip={handleMemoryEquip}
      onMemorySave={handleMemorySave}
      onMemoryCopy={handleMemoryCopy}
      onMemoryDelete={handleMemoryDelete}
    />
  );
};
