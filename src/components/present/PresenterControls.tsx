"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize, Minimize, Volume2, VolumeX } from "lucide-react";
import { LANGUAGES, type Language } from "@/types/quiz";
import { cn } from "@/lib/utils";
import { tFor } from "@/lib/i18n";

export function PresenterControls({
  visible,
  current,
  total,
  language,
  onLanguageChange,
  onPrev,
  onNext,
  isFullscreen,
  onToggleFullscreen,
  soundEnabled,
  onToggleSound,
}: {
  visible: boolean;
  current: number;
  total: number;
  language: Language;
  onLanguageChange: (l: Language) => void;
  onPrev: () => void;
  onNext: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2 py-2 backdrop-blur-md"
        >
          <button
            onClick={onPrev}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="min-w-[3.5rem] select-none text-center text-xs tabular-nums text-white/60">
            {current + 1} / {total}
          </span>

          <button
            onClick={onNext}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="mx-1 h-4 w-px bg-white/10" />

          <div className="flex items-center gap-0.5 rounded-full bg-white/5 p-0.5">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => onLanguageChange(l.code)}
                className={cn(
                  "rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors",
                  language === l.code
                    ? "bg-accent text-white"
                    : "text-white/50 hover:text-white"
                )}
              >
                {l.code}
              </button>
            ))}
          </div>

          <div className="mx-1 h-4 w-px bg-white/10" />

          <button
            onClick={onToggleSound}
            title={tFor(soundEnabled ? "muteSounds" : "unmuteSounds", language)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>

          <div className="mx-1 h-4 w-px bg-white/10" />

          <button
            onClick={onToggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
