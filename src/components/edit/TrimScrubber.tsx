"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { computeWaveformPeaks } from "@/lib/waveform";
import { formatTime } from "@/lib/utils";

const MIN_SPAN = 0.2;

/**
 * A mobile-audio-editor-style trim control: a waveform strip with two
 * draggable handles (start/end) you can slide independently from either
 * side, with the selected range highlighted and the trimmed-out portions
 * dimmed. Drag is implemented with pointer capture on the track itself, so
 * a handle keeps following the pointer even if it strays outside the
 * (fairly narrow) strip while dragging.
 */
export function TrimScrubber({
  url,
  duration,
  start,
  end,
  onChange,
}: {
  url: string | null;
  duration: number;
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
}) {
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<"start" | "end" | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPeaks(null);
    if (!url) return;
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => computeWaveformPeaks(blob))
      .then((p) => {
        if (!cancelled) setPeaks(p.length > 0 ? p : null);
      })
      .catch(() => {
        if (!cancelled) setPeaks(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  function timeAt(clientX: number): number {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || duration <= 0) return 0;
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return ratio * duration;
  }

  function beginDrag(which: "start" | "end") {
    return (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      draggingRef.current = which;
      trackRef.current?.setPointerCapture(e.pointerId);
    };
  }

  function handleMove(e: ReactPointerEvent<HTMLDivElement>) {
    const which = draggingRef.current;
    if (!which) return;
    const t = timeAt(e.clientX);
    if (which === "start") {
      onChange(Math.min(t, end - MIN_SPAN), end);
    } else {
      onChange(start, Math.max(t, start + MIN_SPAN));
    }
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    draggingRef.current = null;
    trackRef.current?.releasePointerCapture(e.pointerId);
  }

  const startPct = duration > 0 ? (start / duration) * 100 : 0;
  const endPct = duration > 0 ? (end / duration) * 100 : 100;
  const bins = peaks && peaks.length > 0 ? peaks : new Array(64).fill(0.12);

  return (
    <div className="select-none">
      <div
        ref={trackRef}
        onPointerMove={handleMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative h-16 w-full touch-none overflow-hidden rounded-lg bg-white/5"
      >
        {/* Waveform bars, drawn directly so the dimmed/selected overlays can sit cleanly on top. */}
        <div className="absolute inset-0 flex items-center gap-px px-0.5">
          {bins.map((p, i) => (
            <div
              key={i}
              className="flex-1 rounded-full bg-white/25"
              style={{ height: `${Math.max(8, p * 100)}%` }}
            />
          ))}
        </div>

        {/* Dimmed (trimmed-away) regions */}
        <div className="absolute inset-y-0 left-0 bg-black/70" style={{ width: `${startPct}%` }} />
        <div className="absolute inset-y-0 right-0 bg-black/70" style={{ width: `${100 - endPct}%` }} />

        {/* Selected range outline */}
        <div
          className="pointer-events-none absolute inset-y-0 border-y-2 border-accent"
          style={{ left: `${startPct}%`, width: `${Math.max(endPct - startPct, 0)}%` }}
        />

        {/* Start handle */}
        <div
          onPointerDown={beginDrag("start")}
          className="absolute inset-y-0 z-10 flex w-6 -translate-x-1/2 cursor-ew-resize items-center justify-center"
          style={{ left: `${startPct}%` }}
        >
          <div className="h-full w-1.5 rounded-full bg-accent shadow-soft" />
        </div>

        {/* End handle */}
        <div
          onPointerDown={beginDrag("end")}
          className="absolute inset-y-0 z-10 flex w-6 -translate-x-1/2 cursor-ew-resize items-center justify-center"
          style={{ left: `${endPct}%` }}
        >
          <div className="h-full w-1.5 rounded-full bg-accent shadow-soft" />
        </div>
      </div>
      <div className="mt-1.5 flex justify-between text-xs tabular-nums text-muted-foreground">
        <span>{formatTime(start)}</span>
        <span className="text-foreground/70">{formatTime(Math.max(end - start, 0))}</span>
        <span>{formatTime(end)}</span>
      </div>
    </div>
  );
}
