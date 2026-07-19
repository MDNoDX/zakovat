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
  const isCover = question.displaySize === "cover";

  if (isCover) {
    // Full-bleed edge-to-edge image with the prompt/caption overlaid on a
    // dark scrim so text stays legible over whatever's underneath —
    // mirrors VideoQuestionSlide's "cover" treatment for consistency.
    return (
      <div className="relative h-full w-full overflow-hidden bg-black">
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-3 bg-gradient-to-b from-black/70 to-transparent px-10 pb-16 pt-8">
          <div className="pointer-events-auto">
            <QuestionPrompt prompt={question.prompt} languages={languages} size={question.promptSize ?? "medium"} />
          </div>
        </div>
        {caption && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-10 pb-6 pt-16">
            <MediaCaption text={caption} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 px-16">
      <QuestionPrompt prompt={question.prompt} languages={languages} size={question.promptSize ?? "medium"} />
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="max-h-[75vh] max-w-[85vw] rounded-2xl border border-white/10 object-contain shadow-soft"
        />
      )}
      <MediaCaption text={caption} />
    </div>
  );
}
