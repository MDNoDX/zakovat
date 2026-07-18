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
  Plus,
} from "lucide-react";
import { emptyLocalizedText, isLocalizedTextEmpty, type LocalizedText, type QuestionType } from "@/types/quiz";
import { questionTypeLabel, useUiLanguageStore, useT } from "@/lib/i18n";
import { LocalizedTextInput } from "@/components/editor/LocalizedTextInput";
import { cn } from "@/lib/utils";

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
 *
 * The add flow leads with the question's actual text (and its language),
 * not an abstract type card — you type the question first, then pick what
 * kind of question it is. The type only decides which extra fields
 * (media/options/answer) show up next in the full editor; it never blocks
 * getting the words down first.
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
  const uiLanguage = useUiLanguageStore((s) => s.language);
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

            <p className="mb-1.5 mt-3 text-xs font-medium text-muted-foreground">
              {t("quickAddTypeLabel")}
            </p>
            <div className="flex flex-wrap gap-1">
              {ORDER.map((opt) => {
                const Icon = TYPE_ICON[opt];
                const active = type === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    title={questionTypeLabel(opt, uiLanguage)}
                    aria-label={questionTypeLabel(opt, uiLanguage)}
                    aria-pressed={active}
                    onClick={() => setType(opt)}
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors",
                      active
                        ? "border-accent/60 bg-accent/15 text-accent"
                        : "border-border text-muted-foreground hover:bg-foreground/5"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
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
