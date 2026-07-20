"use client";

import { useCallback, useRef } from "react";
import type { CropRect } from "@/lib/media-crop";
import { cn } from "@/lib/utils";

const MIN_SIZE = 0.08;

type DragMode = "move" | "nw" | "ne" | "sw" | "se";

function clampRect(r: CropRect): CropRect {
  let { x, y, width, height } = r;
  width = Math.max(MIN_SIZE, Math.min(1, width));
  height = Math.max(MIN_SIZE, Math.min(1, height));
  x = Math.max(0, Math.min(1 - width, x));
  y = Math.max(0, Math.min(1 - height, y));
  return { x, y, width, height };
}

/**
 * Freeform draggable/resizable crop rectangle, drawn on top of an image or
 * video preview. All coordinates are 0-1 relative to the overlay's own box
 * (which the caller sizes to exactly match the media's rendered box), so
 * this has no notion of pixels or aspect ratio -- "crop however you want"
 * rather than a fixed-ratio tool.
 */
export function CropOverlay({
  value,
  onChange,
}: {
  value: CropRect;
  onChange: (rect: CropRect) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ mode: DragMode; startX: number; startY: number; startRect: CropRect } | null>(null);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const state = dragRef.current;
      const container = containerRef.current;
      if (!state || !container) return;
      const bounds = container.getBoundingClientRect();
      const dx = (e.clientX - state.startX) / bounds.width;
      const dy = (e.clientY - state.startY) / bounds.height;
      const next = { ...state.startRect };

      if (state.mode === "move") {
        next.x = state.startRect.x + dx;
        next.y = state.startRect.y + dy;
      } else {
        if (state.mode.includes("w")) {
          next.x = state.startRect.x + dx;
          next.width = state.startRect.width - dx;
        }
        if (state.mode.includes("e")) {
          next.width = state.startRect.width + dx;
        }
        if (state.mode.includes("n")) {
          next.y = state.startRect.y + dy;
          next.height = state.startRect.height - dy;
        }
        if (state.mode.includes("s")) {
          next.height = state.startRect.height + dy;
        }
      }
      onChange(clampRect(next));
    },
    [onChange]
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }, [onPointerMove]);

  function startDrag(mode: DragMode) {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = { mode, startX: e.clientX, startY: e.clientY, startRect: value };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    };
  }

  const pct = (n: number) => `${n * 100}%`;

  const CORNER_CLASS: Record<"nw" | "ne" | "sw" | "se", string> = {
    nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
    ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
    sw: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
    se: "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
  };

  return (
    <div ref={containerRef} className="absolute inset-0 select-none">
      <div
        className="absolute cursor-move border-2 border-white"
        style={{
          left: pct(value.x),
          top: pct(value.y),
          width: pct(value.width),
          height: pct(value.height),
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
        }}
        onPointerDown={startDrag("move")}
      >
        {(["nw", "ne", "sw", "se"] as const).map((corner) => (
          <div
            key={corner}
            onPointerDown={startDrag(corner)}
            className={cn(
              "absolute h-4 w-4 rounded-full border-2 border-accent bg-white shadow-md",
              CORNER_CLASS[corner]
            )}
          />
        ))}
      </div>
    </div>
  );
}
