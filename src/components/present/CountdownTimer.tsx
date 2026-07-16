"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE = 108;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

/**
 * Autostarts a circular countdown whenever `resetKey` changes (typically the
 * question id). Presenter can pause/resume/restart with the small controls
 * beneath it — nothing here forces navigation.
 */
export function CountdownTimer({
  seconds,
  resetKey,
}: {
  seconds: number;
  resetKey: string;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(seconds);
    setRunning(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, seconds]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1 && intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        return Math.max(0, r - 1);
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // resetKey ensures a fresh interval starts for every new question, even
    // if the previous one already auto-cleared itself at zero.
  }, [running, resetKey]);

  const progress = seconds > 0 ? remaining / seconds : 0;
  const isLow = remaining <= 5 && remaining > 0;
  const isDone = remaining <= 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-white/10"
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
            className={cn(
              "transition-[stroke-dashoffset] duration-1000 ease-linear",
              isDone ? "text-red-500" : isLow ? "text-red-400" : "text-accent"
            )}
            stroke="currentColor"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "text-2xl font-semibold tabular-nums",
              isLow || isDone ? "text-red-400" : "text-foreground"
            )}
          >
            {remaining}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100">
        <button
          onClick={() => setRunning((r) => !r)}
          aria-label={running ? "Taymerni to'xtatish" : "Taymerni davom ettirish"}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
        >
          {running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </button>
        <button
          onClick={() => setRemaining(seconds)}
          aria-label="Taymerni qayta boshlash"
          className="rounded-full p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
