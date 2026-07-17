"use client";

import { useRef, useState } from "react";
import { Music, Pause, Play } from "lucide-react";
import { useMediaUrl } from "@/lib/media";
import { useQuizStore } from "@/lib/store";
import { formatTime } from "@/lib/utils";
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
  const mediaKind = useQuizStore(
    (s) => s.media.find((m) => m.id === question.answer.mediaId)?.kind
  );
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
      {url && mediaKind === "video" && (
        <video
          key={question.answer.mediaId}
          src={url}
          controls
          className="max-h-[45vh] w-full max-w-3xl rounded-2xl border border-white/10 bg-black shadow-soft"
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

/** Compact play/pause + progress player for an audio answer clip. */
function AnswerAudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

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
        <div className="flex items-center gap-2">
          <Music className="h-3.5 w-3.5 shrink-0 text-accent" />
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-200"
              style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }}
            />
          </div>
        </div>
        <div className="mt-1.5 flex justify-between text-xs tabular-nums text-muted-foreground">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
