"use client";

import type { ImageQuestion, Language } from "@/types/quiz";
import { useMediaUrl } from "@/lib/media";
import { QuestionPrompt } from "@/components/present/QuestionPrompt";
import { MediaCaption, useMediaCaption } from "@/components/present/MediaCaption";

export function ImageQuestionSlide({
  question,
  languages,
}: {
  question: ImageQuestion;
  languages: Language[];
}) {
  const url = useMediaUrl(question.mediaId);
  const caption = useMediaCaption(question.mediaId);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 px-16">
      <QuestionPrompt prompt={question.prompt} languages={languages} size="medium" />
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="max-h-[60vh] max-w-[70vw] rounded-2xl border border-white/10 object-contain shadow-soft"
        />
      )}
      <MediaCaption text={caption} />
    </div>
  );
}
