"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, HelpCircle, Play } from "lucide-react";
import { useQuizStore } from "@/lib/store";
import { isLocalizedTextEmpty, resolveText } from "@/types/quiz";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { PresentationShell } from "@/components/present/PresentationShell";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useT } from "@/lib/i18n";
import { useSound } from "@/lib/use-sound";

export default function PresentPage({ params }: { params: { quizId: string } }) {
  const [mounted, setMounted] = useState(false);
  const [started, setStarted] = useState(false);
  const quiz = useQuizStore((s) => s.quizzes.find((q) => q.id === params.quizId));
  const t = useT();
  const sound = useSound();

  useEffect(() => setMounted(true), []);

  // Presentation Mode always renders dark, on purpose — this is what shows
  // on the projector, and a bright screen would hurt legibility and look
  // out of place in a dim room, regardless of the presenter's own light/dark
  // preference for editing. Restore their preference when leaving this page.
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      const stored = window.localStorage.getItem("zakovat-theme");
      if (stored === "light") document.documentElement.classList.remove("dark");
    };
  }, []);

  if (!mounted) return <div className="h-screen w-screen bg-background" />;

  if (!quiz) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-background text-foreground">
        <p className="text-sm text-muted-foreground">{t("quizNotFound")}</p>
        <Link href="/" className="text-sm text-accent hover:underline">
          {t("backToHome")}
        </Link>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="relative flex h-screen w-screen flex-col items-center justify-center gap-8 bg-background text-foreground">
        <Link
          href={`/edit/${quiz.id}`}
          className="absolute left-6 top-6 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t("back")}
        </Link>

        <Tooltip>
          <TooltipTrigger asChild>
            <button className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground">
              <HelpCircle className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-[220px]">
            <p className="mb-1 font-medium">{t("shortcutsTitle")}</p>
            <p>→ keyingi &middot; ← orqaga</p>
            <p>Space — javob / davom etish</p>
            <p>F — to&apos;liq ekran &middot; Esc — chiqish</p>
            <p>1-9 — savolga o&apos;tish</p>
          </TooltipContent>
        </Tooltip>

        <div className="max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.5em] text-accent">
            Zakovat
          </p>
          <h1 className="text-6xl font-bold tracking-tight md:text-7xl">{quiz.title}</h1>
          {!isLocalizedTextEmpty(quiz.description) && (
            <div
              className="editor-content prose prose-lg mx-auto mt-5 max-w-xl text-foreground/80"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(resolveText(quiz.description, quiz.defaultLanguage)),
              }}
            />
          )}
          <p className="mt-4 text-base text-muted-foreground/70">
            {quiz.stages.length} {t("stageWord")} &middot;{" "}
            {quiz.stages.reduce((n, s) => n + s.questions.length, 0)} {t("questionWord")}
          </p>
        </div>
        <button
          onClick={() => {
            document.documentElement.requestFullscreen?.().catch(() => {});
            sound.unlock();
            setStarted(true);
          }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-white shadow-soft transition-transform hover:scale-105 active:scale-95"
        >
          <Play className="ml-1 h-8 w-8" />
        </button>
      </div>
    );
  }

  return <PresentationShell quiz={quiz} />;
}
