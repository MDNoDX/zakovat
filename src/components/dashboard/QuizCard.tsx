"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Pencil, Copy, Trash2, Layers } from "lucide-react";
import { isLocalizedTextEmpty, resolveText, type Quiz } from "@/types/quiz";
import { useQuizStore } from "@/lib/store";
import { useT, confirmDeleteQuizMessage, useUiLanguageStore } from "@/lib/i18n";

/** Card preview needs a short, plain-text snippet — rich formatting (lists,
 * headings) would look broken clamped to two lines in a small card. */
function plainTextPreview(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function QuizCard({ quiz }: { quiz: Quiz }) {
  const deleteQuiz = useQuizStore((s) => s.deleteQuiz);
  const duplicateQuiz = useQuizStore((s) => s.duplicateQuiz);
  const questionCount = quiz.stages.reduce((n, s) => n + s.questions.length, 0);
  const t = useT();
  const uiLanguage = useUiLanguageStore((s) => s.language);
  const descriptionPreview = !isLocalizedTextEmpty(quiz.description)
    ? plainTextPreview(resolveText(quiz.description, quiz.defaultLanguage))
    : "";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="group relative flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/40"
    >
      <Link href={`/edit/${quiz.id}`} className="flex-1">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Layers className="h-5 w-5" />
        </div>
        <h3 className="mb-1 truncate text-base font-semibold">{quiz.title}</h3>
        {descriptionPreview && (
          <p className="mb-1.5 line-clamp-2 text-xs text-muted-foreground/80">
            {descriptionPreview}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {quiz.stages.length} {t("stageWord")} &middot; {questionCount} {t("questionWord")}
        </p>
      </Link>

      <div className="mt-5 flex items-center justify-between">
        <Link
          href={`/present/${quiz.id}`}
          target="_blank"
          className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
        >
          <Play className="h-3 w-3" /> {t("start")}
        </Link>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Link
            href={`/edit/${quiz.id}`}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => duplicateQuiz(quiz.id)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirm(confirmDeleteQuizMessage(quiz.title, uiLanguage))) deleteQuiz(quiz.id);
            }}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
