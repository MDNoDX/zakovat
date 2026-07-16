"use client";

import { useMediaUrl } from "@/lib/media";
import { resolveText, type VideoQuestion, type Language } from "@/types/quiz";
import { QuestionPrompt } from "@/components/present/QuestionPrompt";

export function VideoQuestionSlide({
  question,
  language,
}: {
  question: VideoQuestion;
  language: Language;
}) {
  const url = useMediaUrl(question.mediaId);
  const hasPrompt = Boolean(resolveText(question.prompt, language));

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-10">
      {hasPrompt && <QuestionPrompt prompt={question.prompt} language={language} size="medium" />}
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
