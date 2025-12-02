"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useBuilderStore } from "../stores/builderStore";
import { BuilderLayout } from "../components/builder/BuilderLayout";
import { EquipmentSection } from "../components/builder/EquipmentSection";
import { TalentsSection } from "../components/builder/TalentsSection";
import { SkillsSection } from "../components/builder/SkillsSection";
import { HeroSection } from "../components/builder/HeroSection";
import { PactspiritSection } from "../components/builder/PactspiritSection";
import { DivinitySection } from "../components/builder/DivinitySection";
import { ActivePage } from "../lib/types";

const BuilderPageContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const saveId = searchParams.get("id");

  const loadFromSave = useBuilderStore((state) => state.loadFromSave);
  const [mounted, setMounted] = useState(false);
  const [activePage, setActivePage] = useState<ActivePage>("equipment");

  useEffect(() => {
    setMounted(true);

    if (!saveId) {
      router.replace("/");
      return;
    }

    const success = loadFromSave(saveId);
    if (!success) {
      router.replace("/");
    }
  }, [saveId, router, loadFromSave]);

  if (!mounted) {
    return null;
  }

  return (
    <BuilderLayout activePage={activePage} setActivePage={setActivePage}>
      {activePage === "equipment" && <EquipmentSection />}
      {activePage === "talents" && <TalentsSection />}
      {activePage === "skills" && <SkillsSection />}
      {activePage === "hero" && <HeroSection />}
      {activePage === "pactspirit" && <PactspiritSection />}
      {activePage === "divinity" && <DivinitySection />}
    </BuilderLayout>
  );
};

const BuilderPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
          <div className="text-zinc-400">Loading...</div>
        </div>
      }
    >
      <BuilderPageContent />
    </Suspense>
  );
};

export default BuilderPage;
