"use client";

import type { Language } from "@/types/quiz";
import { tFor } from "@/lib/i18n";

export function StageEndSlide({ language }: { language: Language }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.4em] text-accent">
        {tFor("stageComplete", language)}
      </p>
      <h1 className="text-5xl font-bold tracking-tight">{tFor("seeAnswers", language)}</h1>
    </div>
  );
}
