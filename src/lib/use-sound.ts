"use client";

// Tiny synthesized UI sound effects for Presentation Mode transitions —
// generated on the fly with the Web Audio API (a couple of short sine/
// triangle tones), so there's no audio asset to fetch or bundle. The
// presenter can mute/unmute at any time; the preference is remembered.

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "zakovat-sound-enabled";

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx) sharedCtx = new Ctor();
  return sharedCtx;
}

function tone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  peakGain = 0.05,
  type: OscillatorType = "sine"
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  gain.gain.setValueAtTime(0, ctx.currentTime + start);
  gain.gain.linearRampToValueAtTime(peakGain, ctx.currentTime + start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.05);
}

export function useSound() {
  const [enabled, setEnabled] = useState(true);
  const readyRef = useRef(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setEnabled(stored === null ? true : stored === "1");
    readyRef.current = true;
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  /** Unlocks the AudioContext — call from within a real user-gesture handler (e.g. the Start button). */
  const unlock = useCallback(() => {
    const ctx = getCtx();
    if (ctx && ctx.state === "suspended") ctx.resume();
  }, []);

  const withCtx = useCallback(
    (fn: (ctx: AudioContext) => void) => {
      if (!enabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      fn(ctx);
    },
    [enabled]
  );

  const playSlide = useCallback(() => {
    withCtx((ctx) => {
      tone(ctx, 720, 0, 0.09, 0.045, "sine");
      tone(ctx, 980, 0.03, 0.08, 0.03, "sine");
    });
  }, [withCtx]);

  const playStage = useCallback(() => {
    withCtx((ctx) => {
      tone(ctx, 523.25, 0, 0.14, 0.045, "triangle");
      tone(ctx, 659.25, 0.08, 0.16, 0.045, "triangle");
      tone(ctx, 784.0, 0.16, 0.22, 0.045, "triangle");
    });
  }, [withCtx]);

  const playReveal = useCallback(() => {
    withCtx((ctx) => {
      tone(ctx, 440, 0, 0.1, 0.04, "sine");
      tone(ctx, 660, 0.05, 0.14, 0.045, "sine");
    });
  }, [withCtx]);

  return { enabled, toggle, unlock, playSlide, playStage, playReveal };
}
