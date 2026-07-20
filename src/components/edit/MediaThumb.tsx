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
        {!(previewable && url) && <Music className="h-6 w-6" />}
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
            {/* Only the small circle itself intercepts the click (and stops
             * it from reaching the grid cell's onClick) — everywhere else on
             * the tile still bubbles up and selects it like before. A
             * preview button that covered the whole tile silently broke
             * picking audio/video items entirely. */}
            <button
              type="button"
              onClick={togglePlay}
              className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition-transform hover:scale-110 hover:bg-black/80"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            </button>
          </>
        )}
      </div>
    );
  }

  if (item.externalEmbed?.provider === "youtube") {
    // No blob to preview-play inline here -- a static thumbnail (YouTube's
    // own public, CORS-friendly thumbnail image, no API key needed) plus a
    // badge is enough to identify it in the grid; the real player shows up
    // wherever it's actually attached to a question/answer.
    return (
      <div className={cn("relative overflow-hidden bg-black", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://img.youtube.com/vi/${item.externalEmbed.videoId}/hqdefault.jpg`}
          alt={item.name}
          className="h-full w-full object-cover"
        />
        <span className="absolute bottom-1 right-1 rounded bg-red-600 px-1 py-0.5 text-[9px] font-bold uppercase leading-none text-white">
          YouTube
        </span>
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
          // Same "only the circle is clickable" fix as the audio case above —
          // an inset-0 button here silently blocked picking video items too.
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={togglePlay}
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-all hover:scale-110 hover:bg-black/80 group-hover:opacity-100"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            </button>
          </div>
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
