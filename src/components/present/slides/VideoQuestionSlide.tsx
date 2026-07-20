"use client";

import { isLocalizedTextEmpty, type VideoQuestion, type Language } from "@/types/quiz";
import { QuestionPrompt } from "@/components/present/QuestionPrompt";
import { MediaCaption, useMediaCaption } from "@/components/present/MediaCaption";
import { EmbeddableVideo } from "@/components/present/EmbeddableVideo";

export function VideoQuestionSlide({
  question,
  languages,
}: {
  question: VideoQuestion;
  languages: Language[];
}) {
  const caption = useMediaCaption(question.mediaId);
  const hasPrompt = !isLocalizedTextEmpty(question.prompt);
  const isCover = question.displaySize === "cover";

  if (isCover) {
    // Full-bleed edge-to-edge video with the prompt/caption overlaid on a
    // dark scrim so text stays legible over whatever's playing underneath.
    // Note: a YouTube embed can't truly crop-to-fill the way a native video
    // file can with object-cover -- YouTube's own player always letterboxes
    // inside whatever box it's given, so this is as close as an iframe gets.
    return (
      <div className="relative h-full w-full overflow-hidden bg-black">
        <EmbeddableVideo mediaId={question.mediaId} className="h-full w-full object-cover" />
        {(hasPrompt || caption) && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-3 bg-gradient-to-b from-black/70 to-transparent px-10 pb-16 pt-8">
            {hasPrompt && (
              <div className="pointer-events-auto">
                <QuestionPrompt prompt={question.prompt} languages={languages} size={question.promptSize ?? "medium"} />
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
      <EmbeddableVideo
        mediaId={question.mediaId}
        className="aspect-video max-h-[78vh] w-full max-w-6xl rounded-2xl border border-white/10 bg-black shadow-soft"
      />
      <MediaCaption text={caption} />
    </div>
  );
}
