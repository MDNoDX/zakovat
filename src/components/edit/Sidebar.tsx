"use client";

import { Plus, Image as ImageIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useQuizStore } from "@/lib/store";
import { StageItem } from "@/components/edit/StageItem";
import { Button } from "@/components/ui/button";

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

  if (!quiz) return null;

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

      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="flex flex-col gap-0.5">
          {quiz.stages.map((stage, i) => (
            <StageItem
              key={stage.id}
              quizId={quizId}
              stage={stage}
              index={i}
              selection={selection}
              onSelectStage={onSelectStage}
              onSelectQuestion={onSelectQuestion}
            />
          ))}
        </div>
        <button
          onClick={() => onSelectStage(addStage(quizId))}
          className="mt-2 flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Bosqich qo&apos;shish
        </button>
      </div>

      <div className="border-t border-border p-2">
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onOpenMediaLibrary}>
          <ImageIcon className="h-3.5 w-3.5" /> Media kutubxona
        </Button>
      </div>
    </aside>
  );
}
