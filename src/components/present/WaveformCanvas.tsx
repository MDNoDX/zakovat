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

    if (shape === "dots") {
      const stepX = rect.width / bins.length;
      const r = Math.max(1.5, Math.min(4, stepX / 3));
      bins.forEach((p, i) => {
        const x = i * stepX + stepX / 2;
        const half = p * (rect.height / 2 - r);
        const color = i < activeCount ? ACTIVE_COLOR : INACTIVE_COLOR;
        ctx.fillStyle = color;
        [rect.height / 2 - half, rect.height / 2 + half].forEach((y) => {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      return;
    }

    if (shape === "stroke") {
      // A single oscilloscope-style line tracing the top of each peak only
      // (no mirrored fill) — thinner and quieter than the "line" silhouette.
      const midY = rect.height / 2;
      const stepX = rect.width / Math.max(bins.length - 1, 1);
      const drawStroke = (from: number, to: number, color: string) => {
        if (to <= from) return;
        ctx.beginPath();
        for (let i = from; i < to; i++) {
          const x = i * stepX;
          const y = midY - bins[i] * midY;
          if (i === from) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
      };
      drawStroke(0, bins.length, INACTIVE_COLOR);
      drawStroke(0, activeCount, ACTIVE_COLOR);
      return;
    }

    if (shape === "blocks") {
      // Coarser, chunkier bars (fewer, wider) — a retro equalizer look.
      const blockCount = Math.max(1, Math.round(bins.length / 4));
      const perBlock = bins.length / blockCount;
      const gap = 4;
      const blockWidth = Math.max(2, rect.width / blockCount - gap);
      const activeBlocks = Math.floor(blockCount * Math.min(Math.max(progress, 0), 1));
      for (let b = 0; b < blockCount; b++) {
        const start = Math.floor(b * perBlock);
        const end = Math.max(start + 1, Math.floor((b + 1) * perBlock));
        let max = 0;
        for (let i = start; i < end && i < bins.length; i++) max = Math.max(max, bins[i]);
        const h = Math.max(3, max * rect.height);
        const x = b * (blockWidth + gap);
        const y = (rect.height - h) / 2;
        ctx.fillStyle = b < activeBlocks ? ACTIVE_COLOR : INACTIVE_COLOR;
        ctx.fillRect(x, y, blockWidth, h);
      }
      return;
    }

    const gap = 2;
    const barWidth = Math.max(1, rect.width / bins.length - gap);
    const rounded = shape === "rounded";
    bins.forEach((p, i) => {
      const h = Math.max(2, p * rect.height);
      const x = i * (barWidth + gap);
      const y = (rect.height - h) / 2;
      ctx.fillStyle = i < activeCount ? ACTIVE_COLOR : INACTIVE_COLOR;
      if (rounded && "roundRect" in ctx) {
        ctx.beginPath();
        (ctx as CanvasRenderingContext2D & {
          roundRect: (x: number, y: number, w: number, h: number, r: number) => void;
        }).roundRect(x, y, barWidth, h, Math.min(barWidth / 2, 6));
        ctx.fill();
      } else {
        ctx.fillRect(x, y, barWidth, h);
      }
    });
  }, [peaks, progress, shape]);

  return <canvas ref={canvasRef} className={className} style={{ width: "100%", height: "100%" }} />;
}
