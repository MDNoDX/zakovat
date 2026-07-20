"use client";

import { useRef, useState } from "react";
import { Pause, Play, Waves } from "lucide-react";
import { useMediaUrl } from "@/lib/media";
import { useQuizStore } from "@/lib/store";
import { formatTime } from "@/lib/utils";
import { useWaveformStyleStore, WAVEFORM_SHAPE_LABEL } from "@/lib/use-waveform-style";
import { WaveformCanvas } from "@/components/present/WaveformCanvas";
import { MediaCaption, useMediaCaption } from "@/components/present/MediaCaption";
import { isLocalizedTextEmpty, type Question, type Language } from "@/types/quiz";
import { MultipleChoiceSlide } from "@/components/present/slides/MultipleChoiceSlide";
import { Collage } from "@/components/present/slides/MultiImageSlide";
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
  if (question.type === "multiple-choice" && question.answerRevealMode !== "announce") {
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
  const mediaKind = useQuizStore(
    (s) => s.media.find((m) => m.id === question.answer.mediaId)?.kind
  );
  const mediaCaption = useMediaCaption(question.answer.mediaId);
  // Multiple-choice questions in "announce" mode may never have had a
  // separate answer text written — fall back to the correct option's own
  // text so there's still something to announce.
  const mcFallbackText =
    question.type === "multiple-choice"
      ? question.options.find((o) => o.id === question.correctOptionId)?.text
      : undefined;
  const correctText =
    isLocalizedTextEmpty(question.answer.correctText) && mcFallbackText
      ? mcFallbackText
      : question.answer.correctText;
  const hasCorrect = !isLocalizedTextEmpty(correctText);
  const hasExplanation = !isLocalizedTextEmpty(question.answer.explanation);
  const primaryLanguage = languages[0] ?? "uz";
  const answerMediaSize = question.answer.mediaDisplaySize ?? "medium";
  const isCover = answerMediaSize === "fit" && (mediaKind === "image" || mediaKind === "video");
  // Fixed height (not a max-height cap) so object-contain always scales the
  // media up or down to exactly this box — two photos of wildly different
  // native resolutions end up the same displayed size instead of one
  // showing tiny just because its source file happened to be smaller.
  const sizeBoxClass =
    answerMediaSize === "small" ? "h-[28vh] max-w-[55vw]" : "h-[52vh] max-w-[82vw]";
  const collageIds = question.answer.mediaIds ?? [];
  const hasCollage = collageIds.length > 0;
  // Media of any kind IS the answer when there's no separate text for it —
  // only say "no answer provided" when there's truly nothing to show.
  const hasAnyMedia = hasCollage || !!url;

  const textContent = (
    <>
      <p className="text-sm font-semibold uppercase tracking-[0.4em] text-accent">
        {indexInStage + 1}-{tFor("questionWord", primaryLanguage)} &middot;{" "}
        {tFor("correctAnswerLabel", primaryLanguage)}
      </p>
      {hasCorrect ? (
        <MultiLangText
          text={correctText}
          languages={languages}
          size="hero"
          weight="font-bold"
        />
      ) : hasAnyMedia ? null : (
        <p className="text-2xl text-muted-foreground">{tFor("answerNotProvided", primaryLanguage)}</p>
      )}
    </>
  );

  const explanationContent = (
    <>
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
    </>
  );

  if (hasCollage) {
    // A collage answer stands in for the single mediaId slot entirely —
    // shown fully revealed at once, same tile layouts as a collage question.
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-16 py-8 text-center">
        {textContent}
        <div className="h-[50vh] w-full max-w-4xl">
          <Collage mediaIds={collageIds} count={collageIds.length} revealCount={collageIds.length} />
        </div>
        {explanationContent}
      </div>
    );
  }

  if (isCover) {
    // Full-bleed media behind everything, with the answer text/explanation
    // overlaid on gradient scrims — mirrors the question-side "cover" slides
    // for a consistent full-screen-impact option on the answer too.
    return (
      <div className="relative h-full w-full overflow-hidden bg-black">
        {url && mediaKind === "video" && (
          <video key={question.answer.mediaId} src={url} controls className="h-full w-full object-cover" />
        )}
        {url && mediaKind === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-4 bg-gradient-to-b from-black/75 to-transparent px-16 pb-20 pt-8 text-center">
          <div className="pointer-events-auto flex flex-col items-center gap-4">{textContent}</div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 bg-gradient-to-t from-black/75 to-transparent px-16 pb-6 pt-24 text-center">
          <MediaCaption text={mediaCaption} />
          <div className="pointer-events-auto">{explanationContent}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-16 text-center">
      {textContent}
      {url && mediaKind === "video" && (
        <video
          key={question.answer.mediaId}
          src={url}
          controls
          className={`w-auto rounded-2xl border border-white/10 bg-black object-contain shadow-soft ${sizeBoxClass}`}
        />
      )}
      {url && mediaKind === "audio" && (
        <AnswerAudioPlayer key={question.answer.mediaId} url={url} />
      )}
      {url && (mediaKind === "image" || mediaKind === undefined) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className={`w-auto rounded-2xl border border-white/10 object-contain ${sizeBoxClass}`}
        />
      )}
      <MediaCaption text={mediaCaption} />
      {explanationContent}
    </div>
  );
}

/** Compact play/pause + waveform player for an audio answer clip. */
function AnswerAudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const waveformShape = useWaveformStyleStore((s) => s.shape);
  const toggleWaveformShape = useWaveformStyleStore((s) => s.toggle);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
    setPlaying(!playing);
  }

  return (
    <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
      />
      <button
        onClick={toggle}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-transform hover:scale-105 active:scale-95"
      >
        {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
      </button>
      <div className="flex-1">
        <div className="h-9 w-full overflow-hidden rounded-md">
          <WaveformCanvas
            url={url}
            progress={duration ? progress / duration : 0}
            shape={waveformShape}
            className="h-full w-full"
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs tabular-nums text-muted-foreground">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <button
        onClick={toggleWaveformShape}
        title={`To'lqin shakli: ${WAVEFORM_SHAPE_LABEL[waveformShape]}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
      >
        <Waves className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
