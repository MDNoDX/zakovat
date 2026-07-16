"use client";

import { useMediaUrl } from "@/lib/media";
import { isLocalizedTextEmpty, type Question, type Language } from "@/types/quiz";
import { MultipleChoiceSlide } from "@/components/present/slides/MultipleChoiceSlide";
import { MultiLangText } from "@/components/present/MultiLangText";
import { tFor } from "@/lib/i18n";

export function AnswerSlide({
  question,
  languages,
  indexInStage,
  showExplanation,
}: {
  question: Question;
  languages: Language[];
  indexInStage: number;
  showExplanation: boolean;
}) {
  if (question.type === "multiple-choice") {
    return <MultipleChoiceSlide question={question} languages={languages} revealed />;
  }

  return (
    <GenericAnswer
      question={question}
      languages={languages}
      indexInStage={indexInStage}
      showExplanation={showExplanation}
    />
  );
}

function GenericAnswer({
  question,
  languages,
  indexInStage,
  showExplanation,
}: {
  question: Question;
  languages: Language[];
  indexInStage: number;
  showExplanation: boolean;
}) {
  const url = useMediaUrl(question.answer.mediaId);
  const hasCorrect = !isLocalizedTextEmpty(question.answer.correctText);
  const hasExplanation = !isLocalizedTextEmpty(question.answer.explanation);
  const primaryLanguage = languages[0] ?? "uz";

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.4em] text-accent">
        {indexInStage + 1}-{tFor("questionWord", primaryLanguage)} &middot;{" "}
        {tFor("correctAnswerLabel", primaryLanguage)}
      </p>
      {hasCorrect ? (
        <MultiLangText
          text={question.answer.correctText}
          languages={languages}
          size="hero"
          weight="font-bold"
        />
      ) : (
        <p className="text-2xl text-muted-foreground">{tFor("answerNotProvided", primaryLanguage)}</p>
      )}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="max-h-[40vh] max-w-[60vw] rounded-2xl border border-white/10 object-contain"
        />
      )}
      {hasExplanation && showExplanation && (
        <MultiLangText
          text={question.answer.explanation}
          languages={languages}
          size="small"
          weight="font-normal"
          proseClassName="max-w-2xl text-muted-foreground"
        />
      )}
      {hasExplanation && !showExplanation && (
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/50">
          {tFor("pressEForExplanation", primaryLanguage)}
        </p>
      )}
    </div>
  );
}
