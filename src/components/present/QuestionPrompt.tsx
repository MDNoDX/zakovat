"use client";

import { resolveText, type LocalizedText, type Language } from "@/types/quiz";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize-html";

export function QuestionPrompt({
  prompt,
  language,
  size = "large",
  className,
}: {
  prompt: LocalizedText;
  language: Language;
  size?: "large" | "medium";
  className?: string;
}) {
  const html = resolveText(prompt, language);
  if (!html) return null;

  return (
    <div
      className={cn(
        "editor-content prose prose-invert max-w-4xl text-center font-semibold leading-tight tracking-tight",
        size === "large" ? "text-5xl md:text-6xl" : "text-3xl md:text-4xl",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
