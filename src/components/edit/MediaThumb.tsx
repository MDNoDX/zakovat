"use client";

import { useRef, useState } from "react";
import { Music, Video, Play, Pause } from "lucide-react";
import { useMediaUrl } from "@/lib/media";
import type { MediaItem } from "@/types/quiz";
import { pauseOthersAndTrack, untrack } from "@/lib/media-preview-coordinator";
import { cn } from "@/lib/utils";

export function MediaThumb({
  item,
  className,
  previewable,
}: {
  item: MediaItem;
  className?: string;
  /** Adds a play/pause overlay so audio and video can be previewed right in
   * the grid, before committing to picking/trimming it — audio in
   * particular otherwise has nothing but a static icon to go on. */
  previewable?: boolean;
}) {
  const url = useMediaUrl(item.id);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  function togglePlay(e: React.MouseEvent) {
    e.stopPropagation();
    const el = item.kind === "audio" ? audioRef.current : videoRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      // Only one preview should ever be audible at once — stop whatever
      // else was playing (anywhere in the editor) before starting this one.
      pauseOthersAndTrack(el);
      el.currentTime = 0;
      el.play();
    }
  }

  function handleStopped(el: HTMLMediaElement) {
    setPlaying(false);
    untrack(el);
  }

  if (item.kind === "audio") {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center bg-surface-2 text-muted-foreground",
          className
        )}
      >
        <Music className="h-6 w-6" />
        {previewable && url && (
          <>
            <audio
              ref={audioRef}
              src={url}
              className="hidden"
              onPlay={() => setPlaying(true)}
              onPause={(e) => handleStopped(e.currentTarget)}
              onEnded={(e) => handleStopped(e.currentTarget)}
            />
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity hover:bg-black/40 hover:opacity-100"
            >
              {playing ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white" />}
            </button>
          </>
        )}
      </div>
    );
  }

  if (item.kind === "video") {
    return (
      <div className={cn("relative overflow-hidden bg-black", className)}>
        {url ? (
          <video
            ref={videoRef}
            src={url}
            className="h-full w-full object-cover"
            muted={!playing}
            onPlay={() => setPlaying(true)}
            onPause={(e) => handleStopped(e.currentTarget)}
            onEnded={(e) => handleStopped(e.currentTarget)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Video className="h-6 w-6" />
          </div>
        )}
        <Video className="absolute bottom-1 right-1 h-4 w-4 text-white drop-shadow" />
        {previewable && url && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity hover:bg-black/30 hover:opacity-100"
          >
            {playing ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white" />}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden bg-surface-2", className)}>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={item.name} className="h-full w-full object-cover" />
      )}
    </div>
  );
}
