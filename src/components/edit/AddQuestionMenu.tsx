"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Type, LayoutGrid, Plus } from "lucide-react";
import { emptyLocalizedText, isLocalizedTextEmpty, type LocalizedText, type QuestionType } from "@/types/quiz";
import { useT } from "@/lib/i18n";
import { LocalizedTextInput } from "@/components/editor/LocalizedTextInput";
import { cn } from "@/lib/utils";

/**
 * Renders its dropdown through a portal into <body>, positioned by the
 * trigger's bounding rect. This matters because the sidebar's collapsible
 * stage list uses `overflow-hidden` for the expand/collapse animation —
 * anything absolutely positioned *inside* that container gets visually
 * clipped, which made "Savol qo'shish" look broken (the menu opened but was
 * invisible). Rendering into <body> escapes that clipping entirely.
 *
 * The add flow leads with the question's actual text (and its language),
 * not an abstract type card. There are only two real shapes left to choose
 * between: a standard question (text, and its one media slot freely becomes
 * image/audio/video/multiple-choice afterward in the full editor — never a
 * type picked up front) or a collage (several images at once, structurally
 * different so it still needs its own starting point).
 */
export function AddQuestionMenu({
  onPick,
  children,
}: {
  onPick: (type: QuestionType, prompt: LocalizedText) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [prompt, setPrompt] = useState<LocalizedText>(emptyLocalizedText());
  const [type, setType] = useState<QuestionType>("text");
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useT();

  function openMenu() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const menuWidth = 300;
      const left = Math.min(rect.left, window.innerWidth - menuWidth - 12);
      setPosition({ top: rect.bottom + 6, left: Math.max(12, left) });
    }
    setPrompt(emptyLocalizedText());
    setType("text");
    setOpen(true);
  }

  function submit() {
    onPick(type, isLocalizedTextEmpty(prompt) ? emptyLocalizedText() : prompt);
    setOpen(false);
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
            className="z-[100] w-[300px] rounded-xl border border-border bg-surface p-3 shadow-soft animate-scale-in"
          >
            <LocalizedTextInput
              label={t("questionTextLabel")}
              value={prompt}
              placeholder={t("questionTextPlaceholder")}
              onChange={setPrompt}
            />

            <div className="mt-3 grid grid-cols-2 gap-1">
              {(
                [
                  { value: "text" as QuestionType, icon: Type, labelKey: "quickAddStandard" as const },
                  { value: "multi-image" as QuestionType, icon: LayoutGrid, labelKey: "quickAddCollage" as const },
                ]
              ).map(({ value, icon: Icon, labelKey }) => {
                const active = type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setType(value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-left transition-colors",
                      active
                        ? "border-accent/60 bg-accent/15 text-accent"
                        : "border-border text-muted-foreground hover:bg-foreground/5"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate text-[11px] font-medium">{t(labelKey)}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={submit}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" /> {t("quickAddSubmit")}
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
