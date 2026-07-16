"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usedLanguages, type Language, type LocalizedText } from "@/types/quiz";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { cn } from "@/lib/utils";

const FLAG: Record<Language, string> = { uz: "🇺🇿", ru: "🇷🇺", en: "🇬🇧" };
const LABEL: Record<Language, string> = { uz: "O'zbekcha", ru: "Русский", en: "English" };

export type PromptSize = "hero" | "large" | "medium" | "small";

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
  className,
  proseClassName,
  weight = "font-semibold",
}: {
  text: LocalizedText | undefined;
  languages: Language[];
  size?: PromptSize;
  layout?: "stack" | "inline";
  className?: string;
  proseClassName?: string;
  weight?: string;
}) {
  const used = usedLanguages(text);
  const toShow = languages.filter((l) => used.includes(l));
  const finalLangs = toShow.length > 0 ? toShow : used;

  if (finalLangs.length === 0) return null;

  const showLabels = finalLangs.length > 1;

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
                <div className="flex items-start gap-2">
                  {showLabels && (
                    <span className="mt-0.5 shrink-0 text-sm leading-none opacity-80">
                      {FLAG[lang]}
                    </span>
                  )}
                  <div
                    className={cn(
                      "editor-content prose prose-invert",
                      weight,
                      SIZE_CLASS[size],
                      proseClassName
                    )}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(variant.content) }}
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
    <div className={cn("flex w-full flex-col items-center gap-5", className)}>
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
              className="flex w-full flex-col items-center gap-3"
            >
              {showLabels && (
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground/70">
                  <span className="text-base leading-none">{FLAG[lang]}</span>
                  {LABEL[lang]}
                </span>
              )}
              <div
                className={cn(
                  "editor-content prose prose-invert max-w-4xl text-center leading-tight tracking-tight",
                  weight,
                  SIZE_CLASS[size],
                  proseClassName
                )}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(variant.content) }}
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
