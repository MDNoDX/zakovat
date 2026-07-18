"use client";

import { useMediaUrl } from "@/lib/media";
import { isLocalizedTextEmpty, type VideoQuestion, type Language } from "@/types/quiz";
import { QuestionPrompt } from "@/components/present/QuestionPrompt";
import { MediaCaption, useMediaCaption } from "@/components/present/MediaCaption";

export function VideoQuestionSlide({
  question,
  languages,
}: {
  question: VideoQuestion;
  languages: Language[];
}) {
  const url = useMediaUrl(question.mediaId);
  const caption = useMediaCaption(question.mediaId);
  const hasPrompt = !isLocalizedTextEmpty(question.prompt);
  const isCover = question.displaySize === "cover";

  if (isCover) {
    // Full-bleed edge-to-edge video with the prompt/caption overlaid on a
    // dark scrim so text stays legible over whatever's playing underneath.
    return (
      <div className="relative h-full w-full overflow-hidden bg-black">
        {url && (
          <video key={question.id} src={url} controls className="h-full w-full object-cover" />
        )}
        {(hasPrompt || caption) && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-3 bg-gradient-to-b from-black/70 to-transparent px-10 pb-16 pt-8">
            {hasPrompt && (
              <div className="pointer-events-auto">
                <QuestionPrompt prompt={question.prompt} languages={languages} size="medium" />
              </div>
            )}
          </div>
        )}
        {caption && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-10 pb-6 pt-16">
            <MediaCaption text={caption} />
          </div>
        )}
      </div>
    );
  }

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
      <MediaCaption text={caption} />
    </div>
  );
}
