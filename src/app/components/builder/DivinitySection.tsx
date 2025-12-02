"use client";

import { useCallback } from "react";
import { useBuilderStore } from "../../stores/builderStore";
import { DivinityTab } from "../divinity/DivinityTab";
import { DivinitySlate, PlacedSlate } from "../../lib/save-data";
import { generateItemId } from "../../lib/storage";

export const DivinitySection = () => {
  const loadout = useBuilderStore((state) => state.loadout);
  const updateLoadout = useBuilderStore((state) => state.updateLoadout);

  const handleSaveSlate = useCallback(
    (slate: DivinitySlate) => {
      updateLoadout((prev) => ({
        ...prev,
        divinitySlateList: [...prev.divinitySlateList, slate],
      }));
    },
    [updateLoadout],
  );

  const handleUpdateSlate = useCallback(
    (slate: DivinitySlate) => {
      updateLoadout((prev) => ({
        ...prev,
        divinitySlateList: prev.divinitySlateList.map((s) =>
          s.id === slate.id ? slate : s,
        ),
      }));
    },
    [updateLoadout],
  );

  const handleCopySlate = useCallback(
    (slate: DivinitySlate) => {
      const newSlate = { ...slate, id: generateItemId() };
      updateLoadout((prev) => ({
        ...prev,
        divinitySlateList: [...prev.divinitySlateList, newSlate],
      }));
    },
    [updateLoadout],
  );

  const handleDeleteSlate = useCallback(
    (slateId: string) => {
      updateLoadout((prev) => ({
        ...prev,
        divinitySlateList: prev.divinitySlateList.filter(
          (s) => s.id !== slateId,
        ),
        divinityPage: {
          ...prev.divinityPage,
          placedSlates: prev.divinityPage.placedSlates.filter(
            (p) => p.slateId !== slateId,
          ),
        },
      }));
    },
    [updateLoadout],
  );

  const handlePlaceSlate = useCallback(
    (placement: PlacedSlate) => {
      updateLoadout((prev) => ({
        ...prev,
        divinityPage: {
          ...prev.divinityPage,
          placedSlates: [...prev.divinityPage.placedSlates, placement],
        },
      }));
    },
    [updateLoadout],
  );

  const handleRemovePlacedSlate = useCallback(
    (slateId: string) => {
      updateLoadout((prev) => ({
        ...prev,
        divinityPage: {
          ...prev.divinityPage,
          placedSlates: prev.divinityPage.placedSlates.filter(
            (p) => p.slateId !== slateId,
          ),
        },
      }));
    },
    [updateLoadout],
  );

  const handleMoveSlate = useCallback(
    (slateId: string, position: { row: number; col: number }) => {
      updateLoadout((prev) => ({
        ...prev,
        divinityPage: {
          ...prev.divinityPage,
          placedSlates: prev.divinityPage.placedSlates.map((p) =>
            p.slateId === slateId ? { ...p, position } : p,
          ),
        },
      }));
    },
    [updateLoadout],
  );

  return (
    <DivinityTab
      divinityPage={loadout.divinityPage}
      divinitySlateList={loadout.divinitySlateList}
      onSaveSlate={handleSaveSlate}
      onUpdateSlate={handleUpdateSlate}
      onCopySlate={handleCopySlate}
      onDeleteSlate={handleDeleteSlate}
      onPlaceSlate={handlePlaceSlate}
      onRemovePlacedSlate={handleRemovePlacedSlate}
      onMoveSlate={handleMoveSlate}
    />
  );
};
