"use client";

import type { LocalizedText, Language } from "@/types/quiz";
import { MultiLangText, type PromptSize } from "@/components/present/MultiLangText";

export function QuestionPrompt({
  prompt,
  languages,
  size = "hero",
  className,
}: {
  prompt: LocalizedText;
  languages: Language[];
  size?: PromptSize;
  className?: string;
}) {
  return (
    <MultiLangText
      text={prompt}
      languages={languages}
      size={size}
      className={className}
      layout="stack"
      stripFontSize
    />
  );
}
