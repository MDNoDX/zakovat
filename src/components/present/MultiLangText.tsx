"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usedLanguages, type Language, type LocalizedText, type PromptSize } from "@/types/quiz";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { useFitScale } from "@/lib/use-fit-scale";
import { cn } from "@/lib/utils";

const FLAG: Record<Language, string> = { uz: "🇺🇿", ru: "🇷🇺", en: "🇬🇧" };
const LABEL: Record<Language, string> = { uz: "O'zbekcha", ru: "Русский", en: "English" };
// Compact form used in tighter spaces (e.g. multiple-choice option rows)
// where the full language name would crowd out the option text itself.
const LABEL_SHORT: Record<Language, string> = { uz: "UZ", ru: "RU", en: "EN" };

// Re-exported for existing importers (@/types/quiz is now the canonical
// source, since Stage-level intro styling also needs this type).
export type { PromptSize };

const SIZE_CLASS: Record<PromptSize, string> = {
  hero: "text-5xl md:text-6xl",
  large: "text-4xl md:text-5xl",
  medium: "text-2xl md:text-3xl",
  small: "text-lg md:text-xl",
};

/**
 * Renders every language variant a piece of content actually has among the
 * moderator's currently-selected set — all inside the same slide, at once.
 * No page navigation, no reload: this is the "show RU and EN stacked
 * together" requirement. If the moderator's selection doesn't overlap with
 * what this particular field has (e.g. they picked EN+RU but this question
 * was only ever written in Uzbek), everything the field *does* have is
 * shown instead, so a slide is never left blank.
 */
export function MultiLangText({
  text,
  languages,
  size = "large",
  layout = "stack",
  separator = " / ",
  align = "center",
  className,
  proseClassName,
  weight = "font-semibold",
  stripFontSize = false,
}: {
  text: LocalizedText | undefined;
  languages: Language[];
  size?: PromptSize;
  layout?: "stack" | "inline" | "joined";
  /** Only used by the "joined" layout — every available language's text on
   * one flowing line, separated by this (e.g. multiple-choice options,
   * where a full stacked flag/label treatment per option would crowd out
   * the actual answer text on a projector). */
  separator?: string;
  /** Only affects the "stack" layout — inline (MC options etc.) is always left-led. */
  align?: "left" | "center" | "right";
  className?: string;
  proseClassName?: string;
  weight?: string;
  /** Strips any inline font-size a language variant's rich text may carry,
   * so this field's size is controlled solely by `size` above — uniform
   * across every language, unaffected by old per-run formatting marks. */
  stripFontSize?: boolean;
}) {
  // Sanitizing is a real DOM-parse, not a free string op — memoized by the
  // `text` array reference so re-renders that don't touch this content
  // (toggling the explanation, stepping a collage reveal, switching
  // languages on-screen) don't re-run it for every language variant.
  const sanitizedByLang = useMemo(() => {
    const map: Partial<Record<Language, string>> = {};
    for (const variant of text ?? []) {
      map[variant.language] = sanitizeHtml(variant.content, { stripFontSize });
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, stripFontSize]);

  const used = usedLanguages(text);
  const toShow = languages.filter((l) => used.includes(l));
  const finalLangs = toShow.length > 0 ? toShow : used;

  // Slides are a fixed, clipped viewport -- long text at a big size (XL
  // especially) has no scrollbar to fall back on, so it needs to actively
  // shrink to stay on screen instead of silently running off the edge.
  // Only the "stack" layout (the big centered prompt/answer treatment)
  // needs this; options grids and inline layouts are already constrained
  // by their own grid/card sizing.
  const { ref: fitRef, scale } = useFitScale<HTMLDivElement>([
    text,
    size,
    finalLangs.join(","),
  ]);

  if (finalLangs.length === 0) return null;

  const showLabels = finalLangs.length > 1;
  const alignItems = align === "left" ? "items-start" : align === "right" ? "items-end" : "items-center";
  const textAlignClass = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";

  if (layout === "joined") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-baseline gap-x-2",
          textAlignClass,
          className
        )}
      >
        {finalLangs.map((lang, i) => (
          <span key={lang} className="flex items-baseline gap-2">
            {i > 0 && <span className="text-muted-foreground/40">{separator}</span>}
            <span
              className={cn("editor-content prose", weight, SIZE_CLASS[size], proseClassName)}
              dangerouslySetInnerHTML={{ __html: sanitizedByLang[lang] ?? "" }}
            />
          </span>
        ))}
      </div>
    );
  }

  if (layout === "inline") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <AnimatePresence mode="popLayout" initial={false}>
          {finalLangs.map((lang, i) => {
            const variant = text?.find((v) => v.language === lang);
            if (!variant) return null;
            return (
              <motion.div
                key={lang}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(i > 0 && "border-t border-white/10 pt-2")}
              >
                <div className="flex items-start gap-2.5">
                  {showLabels && (
                    <span className="mt-0.5 flex shrink-0 items-center gap-1.5 text-sm font-bold leading-none tracking-wide text-muted-foreground/90">
                      <span className="text-lg leading-none">{FLAG[lang]}</span>
                      {LABEL_SHORT[lang]}
                    </span>
                  )}
                  <div
                    className={cn(
                      "editor-content prose",
                      weight,
                      SIZE_CLASS[size],
                      proseClassName
                    )}
                    dangerouslySetInnerHTML={{ __html: sanitizedByLang[lang] ?? "" }}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div
      ref={fitRef}
      className={cn("flex w-full flex-col gap-5", alignItems, className)}
      style={scale !== 1 ? { transform: `scale(${scale})`, transformOrigin: "center center" } : undefined}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {finalLangs.map((lang, i) => {
          const variant = text?.find((v) => v.language === lang);
          if (!variant) return null;
          return (
            <motion.div
              key={lang}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className={cn("flex w-full flex-col gap-3", alignItems)}
            >
              {showLabels && (
                <span className="flex items-center gap-2 text-base font-bold uppercase tracking-[0.2em] text-muted-foreground/90 md:text-lg">
                  <span className="text-2xl leading-none">{FLAG[lang]}</span>
                  {LABEL[lang]}
                </span>
              )}
              <div
                className={cn(
                  "editor-content prose max-w-4xl leading-tight tracking-tight",
                  textAlignClass,
                  weight,
                  SIZE_CLASS[size],
                  proseClassName
                )}
                dangerouslySetInnerHTML={{ __html: sanitizedByLang[lang] ?? "" }}
              />
              {showLabels && i < finalLangs.length - 1 && (
                <div className="mt-2 h-px w-32 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
