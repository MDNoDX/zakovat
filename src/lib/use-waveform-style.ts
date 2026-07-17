"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type WaveformShape = "bars" | "line";

interface WaveformStyleState {
  shape: WaveformShape;
  setShape: (shape: WaveformShape) => void;
  toggle: () => void;
}

// A single app-wide preference (not per-question) for how audio waveforms
// are drawn — kept simple on purpose, changeable any time from the audio
// player itself, remembered across sessions.
export const useWaveformStyleStore = create<WaveformStyleState>()(
  persist(
    (set, get) => ({
      shape: "bars",
      setShape: (shape) => set({ shape }),
      toggle: () => set({ shape: get().shape === "bars" ? "line" : "bars" }),
    }),
    { name: "zakovat-waveform-style", storage: createJSONStorage(() => localStorage) }
  )
);
