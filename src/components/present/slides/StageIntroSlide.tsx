"use client";

import { isLocalizedTextEmpty, type Stage, type Language } from "@/types/quiz";
import { tFor } from "@/lib/i18n";
import { MultiLangText } from "@/components/present/MultiLangText";

export function StageIntroSlide({ stage, languages }: { stage: Stage; languages: Language[] }) {
  const hasName = !isLocalizedTextEmpty(stage.name);
  const hasDescription = !isLocalizedTextEmpty(stage.description);
  const primaryLanguage = languages[0] ?? "uz";

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-16 text-center">
      <p className="mb-6 text-sm font-semibold uppercase tracking-[0.4em] text-accent">
        {stage.questions.length > 0
          ? `${stage.questions.length} ${tFor("questionWord", primaryLanguage)}`
          : tFor("newStage", primaryLanguage)}
      </p>
      {hasName ? (
        <MultiLangText
          text={stage.name}
          languages={languages}
          size="hero"
          weight="font-bold"
          proseClassName="text-foreground"
        />
      ) : (
        <h1 className="max-w-5xl text-6xl font-bold leading-tight tracking-tight text-foreground md:text-7xl">
          {tFor("untitledStage", primaryLanguage)}
        </h1>
      )}
      {hasDescription && (
        <MultiLangText
          text={stage.description}
          languages={languages}
          size="small"
          weight="font-normal"
          className="mt-8"
          proseClassName="max-w-2xl text-muted-foreground"
        />
      )}
    </div>
  );
}
