"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type WaveformShape = "bars" | "line" | "dots" | "stroke" | "rounded" | "blocks";

/** The fixed order variants cycle through via the player's shape button —
 * matches the order they're presented in wherever a picker lists them. */
export const WAVEFORM_SHAPES: WaveformShape[] = [
  "bars",
  "line",
  "dots",
  "stroke",
  "rounded",
  "blocks",
];

/** Short label for each shape, shown in the player's tooltip when cycling. */
export const WAVEFORM_SHAPE_LABEL: Record<WaveformShape, string> = {
  bars: "Ustunlar",
  line: "To'lqin chizig'i",
  dots: "Nuqtalar",
  stroke: "Ingichka chiziq",
  rounded: "Yumaloq ustunlar",
  blocks: "Bloklar",
};

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
      toggle: () => {
        const i = WAVEFORM_SHAPES.indexOf(get().shape);
        set({ shape: WAVEFORM_SHAPES[(i + 1) % WAVEFORM_SHAPES.length] });
      },
    }),
    { name: "zakovat-waveform-style", storage: createJSONStorage(() => localStorage) }
  )
);
