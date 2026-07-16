"use client";

import type { TextQuestion, Language } from "@/types/quiz";
import { QuestionPrompt } from "@/components/present/QuestionPrompt";

export function TextQuestionSlide({
  question,
  languages,
}: {
  question: TextQuestion;
  languages: Language[];
}) {
  return (
    <div className="flex h-full w-full items-center justify-center px-16">
      <QuestionPrompt prompt={question.prompt} languages={languages} />
    </div>
  );
}
