"use client";

import { RotateCcw } from "lucide-react";
import type { Language } from "@/types/quiz";
import { tFor } from "@/lib/i18n";

export function StageEndSlide({
  language,
  onReviewQuestions,
}: {
  language: Language;
  /** Presenter-triggered: jump back to the first question of this stage to
   * go through them once more (at their own pace) before revealing answers. */
  onReviewQuestions: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.4em] text-accent">
        {tFor("stageComplete", language)}
      </p>
      <h1 className="text-5xl font-bold tracking-tight">{tFor("seeAnswers", language)}</h1>
      <button
        onClick={onReviewQuestions}
        className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
      >
        <RotateCcw className="h-4 w-4" />
        {tFor("reviewQuestionsAgain", language)}
      </button>
    </div>
  );
}
