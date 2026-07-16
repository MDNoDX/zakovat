"use client";

import { useEffect, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useQuizStore } from "@/lib/store";
import { QuizCard } from "@/components/dashboard/QuizCard";
import { NewQuizDialog } from "@/components/dashboard/NewQuizDialog";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const quizzes = useQuizStore((s) => s.quizzes);

  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-8 py-16">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              <Sparkles className="h-3.5 w-3.5" /> Zakovat
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Sizning viktorinalaringiz</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Yangi Zakovat
            </Button>
          </div>
        </div>

        {!mounted ? null : quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-24 text-center">
            <p className="text-sm text-muted-foreground">
              Hali hech qanday Zakovat yaratilmagan.
            </p>
            <Button variant="secondary" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Birinchisini yarating
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {quizzes
                .slice()
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} />
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <NewQuizDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
