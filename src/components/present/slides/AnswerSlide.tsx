"use client";

import { useMediaUrl } from "@/lib/media";
import type { Question, Language } from "@/types/quiz";
import { MultipleChoiceSlide } from "@/components/present/slides/MultipleChoiceSlide";

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
  const correct =
    question.answer.correctText[language] ||
    question.answer.correctText.uz ||
    question.answer.correctText.ru ||
    question.answer.correctText.en;
  const explanation =
    question.answer.explanation?.[language] || question.answer.explanation?.uz;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.4em] text-accent">
        {indexInStage + 1}-savol &middot; To&apos;g&apos;ri javob
      </p>
      {correct ? (
        <div
          className="editor-content prose prose-invert max-w-3xl text-5xl font-bold leading-tight md:text-6xl"
          dangerouslySetInnerHTML={{ __html: correct }}
        />
      ) : (
        <p className="text-2xl text-muted-foreground">Javob kiritilmagan</p>
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
