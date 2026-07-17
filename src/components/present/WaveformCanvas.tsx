"use client";

import { useEffect, useRef, useState } from "react";
import { computeWaveformPeaks } from "@/lib/waveform";
import type { WaveformShape } from "@/lib/use-waveform-style";

const ACTIVE_COLOR = "#3B82F6";
const INACTIVE_COLOR = "rgba(255,255,255,0.18)";

/**
 * Draws an audio clip's waveform on a canvas, with everything already
 * played (up to `progress`, 0..1) highlighted in the accent color. Falls
 * back to a plain flat line if peak decoding isn't available (older
 * browsers, or a source the Web Audio API can't decode) so the player
 * never ends up with empty space where the waveform should be.
 */
export function WaveformCanvas({
  url,
  progress,
  shape = "bars",
  className,
}: {
  url: string | null;
  /** 0..1 playback position. */
  progress: number;
  shape?: WaveformShape;
  className?: string;
}) {
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const bins = peaks && peaks.length > 0 ? peaks : new Array(48).fill(0.06);
    const activeCount = Math.floor(bins.length * Math.min(Math.max(progress, 0), 1));

    if (shape === "line") {
      const midY = rect.height / 2;
      const stepX = rect.width / Math.max(bins.length - 1, 1);
      const drawWavePath = () => {
        ctx.beginPath();
        bins.forEach((p, i) => {
          const x = i * stepX;
          const y = midY - p * midY;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        for (let i = bins.length - 1; i >= 0; i--) {
          const x = i * stepX;
          const y = midY + bins[i] * midY;
          ctx.lineTo(x, y);
        }
        ctx.closePath();
      };

      drawWavePath();
      ctx.fillStyle = INACTIVE_COLOR;
      ctx.fill();

      // Redraw the same silhouette clipped to the "already played" width so
      // only that portion gets the accent color.
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, rect.width * Math.min(Math.max(progress, 0), 1), rect.height);
      ctx.clip();
      drawWavePath();
      ctx.fillStyle = ACTIVE_COLOR;
      ctx.fill();
      ctx.restore();
      return;
    }

    const gap = 2;
    const barWidth = Math.max(1, rect.width / bins.length - gap);
    bins.forEach((p, i) => {
      const h = Math.max(2, p * rect.height);
      const x = i * (barWidth + gap);
      const y = (rect.height - h) / 2;
      ctx.fillStyle = i < activeCount ? ACTIVE_COLOR : INACTIVE_COLOR;
      ctx.fillRect(x, y, barWidth, h);
    });
  }, [peaks, progress, shape]);

  return <canvas ref={canvasRef} className={className} style={{ width: "100%", height: "100%" }} />;
}
