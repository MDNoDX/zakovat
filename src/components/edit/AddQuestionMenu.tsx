"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Type,
  ListChecks,
  Image as ImageIcon,
  LayoutGrid,
  Music,
  Video,
} from "lucide-react";
import { QUESTION_TYPE_META, type QuestionType } from "@/types/quiz";

const TYPE_ICON: Record<QuestionType, React.ElementType> = {
  text: Type,
  "multiple-choice": ListChecks,
  image: ImageIcon,
  "multi-image": LayoutGrid,
  music: Music,
  video: Video,
};

const ORDER: QuestionType[] = [
  "text",
  "multiple-choice",
  "image",
  "multi-image",
  "music",
  "video",
];

/**
 * Renders its dropdown through a portal into <body>, positioned by the
 * trigger's bounding rect. This matters because the sidebar's collapsible
 * stage list uses `overflow-hidden` for the expand/collapse animation —
 * anything absolutely positioned *inside* that container gets visually
 * clipped, which made "Savol qo'shish" look broken (the menu opened but was
 * invisible). Rendering into <body> escapes that clipping entirely.
 */
export function AddQuestionMenu({
  onPick,
  children,
}: {
  onPick: (type: QuestionType) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const menuWidth = 256;
      const left = Math.min(rect.left, window.innerWidth - menuWidth - 12);
      setPosition({ top: rect.bottom + 6, left: Math.max(12, left) });
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;

    function handlePointer(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleDismiss() {
      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    // Any scroll (including the sidebar's own scroll container) invalidates
    // the computed position, so just close instead of drifting.
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
    };
  }, [open]);

  return (
    <>
      <div ref={triggerRef} onClick={() => (open ? setOpen(false) : openMenu())}>
        {children}
      </div>
      {open &&
        position &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: position.top, left: position.left }}
            className="z-[100] w-64 rounded-xl border border-border bg-surface p-1.5 shadow-soft animate-scale-in"
          >
            {ORDER.map((type) => {
              const Icon = TYPE_ICON[type];
              const meta = QUESTION_TYPE_META[type];
              return (
                <button
                  key={type}
                  onClick={() => {
                    onPick(type);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-foreground/5"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{meta.label}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {meta.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
