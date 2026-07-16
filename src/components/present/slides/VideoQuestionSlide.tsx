"use client";

import { useMediaUrl } from "@/lib/media";
import { isLocalizedTextEmpty, type VideoQuestion, type Language } from "@/types/quiz";
import { QuestionPrompt } from "@/components/present/QuestionPrompt";

export function VideoQuestionSlide({
  question,
  languages,
}: {
  question: VideoQuestion;
  languages: Language[];
}) {
  const url = useMediaUrl(question.mediaId);
  const hasPrompt = !isLocalizedTextEmpty(question.prompt);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-10">
      {hasPrompt && <QuestionPrompt prompt={question.prompt} languages={languages} size="medium" />}
      {url && (
        <video
          key={question.id}
          src={url}
          controls
          className="max-h-[70vh] w-full max-w-5xl rounded-2xl border border-white/10 bg-black shadow-soft"
        />
      )}
    </div>
  );
}
