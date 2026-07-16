"use client";

import { resolveText, type MultipleChoiceQuestion, type Language } from "@/types/quiz";
import { QuestionPrompt } from "@/components/present/QuestionPrompt";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function MultipleChoiceSlide({
  question,
  language,
  revealed,
}: {
  question: MultipleChoiceQuestion;
  language: Language;
  revealed?: boolean;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-12 px-16">
      <QuestionPrompt prompt={question.prompt} language={language} size="medium" />
      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
        {question.options.map((opt, i) => {
          const isCorrect = revealed && question.correctOptionId === opt.id;
          const text = resolveText(opt.text, language);
          return (
            <div
              key={opt.id}
              className={cn(
                "flex items-center gap-4 rounded-2xl border px-6 py-5 text-left transition-all duration-300",
                isCorrect
                  ? "border-emerald-400/60 bg-emerald-400/10"
                  : "border-white/10 bg-white/5"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold",
                  isCorrect ? "bg-emerald-400 text-black" : "bg-white/10 text-foreground/80"
                )}
              >
                {LETTERS[i]}
              </span>
              <span
                className="editor-content prose prose-invert text-xl"
                dangerouslySetInnerHTML={{ __html: text }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
