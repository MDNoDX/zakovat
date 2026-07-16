"use client";

import { useMediaUrl } from "@/lib/media";
import { resolveText, type Question, type Language } from "@/types/quiz";
import { MultipleChoiceSlide } from "@/components/present/slides/MultipleChoiceSlide";
import { tFor } from "@/lib/i18n";

export function AnswerSlide({
  question,
  language,
  indexInStage,
}: {
  question: Question;
  language: Language;
  indexInStage: number;
}) {
  if (question.type === "multiple-choice") {
    return <MultipleChoiceSlide question={question} language={language} revealed />;
  }

  return <GenericAnswer question={question} language={language} indexInStage={indexInStage} />;
}

function GenericAnswer({
  question,
  language,
  indexInStage,
}: {
  question: Question;
  language: Language;
  indexInStage: number;
}) {
  const url = useMediaUrl(question.answer.mediaId);
  const correct = resolveText(question.answer.correctText, language);
  const explanation = resolveText(question.answer.explanation, language);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.4em] text-accent">
        {indexInStage + 1}-{tFor("questionWord", language)} &middot; {tFor("correctAnswerLabel", language)}
      </p>
      {correct ? (
        <div
          className="editor-content prose prose-invert max-w-3xl text-5xl font-bold leading-tight md:text-6xl"
          dangerouslySetInnerHTML={{ __html: correct }}
        />
      ) : (
        <p className="text-2xl text-muted-foreground">{tFor("answerNotProvided", language)}</p>
      )}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="max-h-[40vh] max-w-[60vw] rounded-2xl border border-white/10 object-contain"
        />
      )}
      {explanation && (
        <div
          className="editor-content prose prose-invert max-w-2xl text-lg text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: explanation }}
        />
      )}
    </div>
  );
}
