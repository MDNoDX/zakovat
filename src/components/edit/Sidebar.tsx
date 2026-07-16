"use client";

import { useState } from "react";
import { Plus, Image as ImageIcon, ArrowLeft, Search, X } from "lucide-react";
import Link from "next/link";
import { useQuizStore } from "@/lib/store";
import { StageItem } from "@/components/edit/StageItem";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { localizedTextMatches } from "@/types/quiz";

export function Sidebar({
  quizId,
  selection,
  onSelectStage,
  onSelectQuestion,
  onOpenMediaLibrary,
}: {
  quizId: string;
  selection: { stageId: string | null; questionId: string | null };
  onSelectStage: (stageId: string) => void;
  onSelectQuestion: (stageId: string, questionId: string) => void;
  onOpenMediaLibrary: () => void;
}) {
  const quiz = useQuizStore((s) => s.quizzes.find((q) => q.id === quizId));
  const addStage = useQuizStore((s) => s.addStage);
  const t = useT();
  const [query, setQuery] = useState("");

  if (!quiz) return null;

  const trimmed = query.trim();
  // Instant, type-as-you-go filter across every stage name and question
  // prompt — built for quizzes with hundreds of questions where scrolling
  // to find one by hand isn't practical.
  const visibleStages = trimmed
    ? quiz.stages.filter(
        (stage) =>
          localizedTextMatches(stage.name, trimmed) ||
          stage.questions.some((q) => localizedTextMatches(q.prompt, trimmed))
      )
    : quiz.stages;

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-surface/60">
      <div className="flex items-center gap-2 border-b border-border px-3 py-3">
        <Link
          href="/"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="truncate text-sm font-semibold">{quiz.title}</span>
      </div>

      <div className="border-b border-border p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Savol qidirish..."
            aria-label="Savol qidirish"
            className="h-8 w-full rounded-lg border border-border bg-surface-2 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Qidiruvni tozalash"
              className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="flex flex-col gap-0.5">
          {visibleStages.map((stage, i) => (
            <StageItem
              key={stage.id}
              quizId={quizId}
              stage={stage}
              index={i}
              selection={selection}
              onSelectStage={onSelectStage}
              onSelectQuestion={onSelectQuestion}
              searchQuery={trimmed}
            />
          ))}
          {trimmed && visibleStages.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              Hech narsa topilmadi.
            </p>
          )}
        </div>
        {!trimmed && (
          <button
            onClick={() => onSelectStage(addStage(quizId))}
            className="mt-2 flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> {t("addStage")}
          </button>
        )}
      </div>

      <div className="border-t border-border p-2">
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onOpenMediaLibrary}>
          <ImageIcon className="h-3.5 w-3.5" /> {t("mediaLibrary")}
        </Button>
      </div>
    </aside>
  );
}
