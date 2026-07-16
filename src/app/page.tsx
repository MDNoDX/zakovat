"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Clapperboard, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useQuizStore } from "@/lib/store";
import { QuizCard } from "@/components/dashboard/QuizCard";
import { NewQuizDialog } from "@/components/dashboard/NewQuizDialog";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BackupControls } from "@/components/dashboard/BackupControls";
import { installDemoQuiz } from "@/lib/demo-quiz";
import { useT } from "@/lib/i18n";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [installingDemo, setInstallingDemo] = useState(false);
  const quizzes = useQuizStore((s) => s.quizzes);
  const router = useRouter();
  const t = useT();

  useEffect(() => setMounted(true), []);

  async function handleLoadDemo() {
    if (installingDemo) return;
    setInstallingDemo(true);
    try {
      const quizId = await installDemoQuiz();
      router.push(`/edit/${quizId}`);
    } finally {
      setInstallingDemo(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-8 py-16">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              <Sparkles className="h-3.5 w-3.5" /> Zakovat
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">{t("yourQuizzes")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <BackupControls />
            <Button variant="secondary" onClick={handleLoadDemo} disabled={installingDemo}>
              {installingDemo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Clapperboard className="h-4 w-4" />
              )}
              {t("loadDemo")}
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> {t("newQuiz")}
            </Button>
          </div>
        </div>

        {mounted && quizzes.length > 0 && (
          <p className="-mt-8 mb-8 text-xs text-muted-foreground/60">{t("backupHint")}</p>
        )}

        {!mounted ? null : quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-24 text-center">
            <p className="text-sm text-muted-foreground">{t("noQuizzesYet")}</p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" /> {t("createFirst")}
              </Button>
              <Button variant="secondary" onClick={handleLoadDemo} disabled={installingDemo}>
                {installingDemo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Clapperboard className="h-4 w-4" />
                )}
                {t("viewDemo")}
              </Button>
            </div>
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
