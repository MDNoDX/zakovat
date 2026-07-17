"use client";

import { useEffect, useRef, useState } from "react";
import { Music, Play, Pause, AudioLines, BarChart3 } from "lucide-react";
import { useMediaUrl } from "@/lib/media";
import { formatTime } from "@/lib/utils";
import { useWaveformStyleStore } from "@/lib/use-waveform-style";
import { WaveformCanvas } from "@/components/present/WaveformCanvas";
import type { MusicQuestion } from "@/types/quiz";

// Per spec: music slides show only the music icon, progress bar, play/pause
// and the timer — no question text, to keep the guessing element intact.
export function MusicQuestionSlide({ question }: { question: MusicQuestion }) {
  const url = useMediaUrl(question.mediaId);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const waveformShape = useWaveformStyleStore((s) => s.shape);
  const toggleWaveformShape = useWaveformStyleStore((s) => s.toggle);

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
  }, [question.id]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-10 px-16">
      <div
        className={`flex h-40 w-40 items-center justify-center rounded-full bg-accent/10 text-accent ${
          playing ? "pulse-ring" : ""
        }`}
      >
        <Music className="h-16 w-16" />
      </div>

      {url && (
        <audio
          ref={audioRef}
          src={url}
          onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={() => setPlaying(false)}
        />
      )}

      <div className="flex w-full max-w-xl items-center gap-4">
        <button
          onClick={toggle}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-transform hover:scale-105 active:scale-95"
        >
          {playing ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
        </button>
        <div className="flex-1">
          <div className="h-12 w-full overflow-hidden rounded-lg">
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
          title="Tolqin shakli"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          {waveformShape === "bars" ? (
            <BarChart3 className="h-4 w-4" />
          ) : (
            <AudioLines className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
