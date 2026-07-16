"use client";

import type { Stage, Language } from "@/types/quiz";

export function StageIntroSlide({ stage, language }: { stage: Stage; language: Language }) {
  const name = stage.name[language] || stage.name.uz || stage.name.ru || stage.name.en;
  const description = stage.description[language] || stage.description.uz;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-16 text-center">
      <p className="mb-6 text-sm font-semibold uppercase tracking-[0.4em] text-accent">
        {stage.questions.length > 0 ? `${stage.questions.length} ta savol` : "Yangi bosqich"}
      </p>
      <h1 className="max-w-5xl text-6xl font-bold leading-tight tracking-tight text-foreground md:text-7xl">
        {name || "Nomsiz bosqich"}
      </h1>
      {description && (
        <div
          className="editor-content prose prose-invert mt-8 max-w-2xl text-lg text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}
    </div>
  );
}
