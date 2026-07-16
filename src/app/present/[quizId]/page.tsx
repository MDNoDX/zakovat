"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { useQuizStore } from "@/lib/store";
import { PresentationShell } from "@/components/present/PresentationShell";

export default function PresentPage({ params }: { params: { quizId: string } }) {
  const [mounted, setMounted] = useState(false);
  const [started, setStarted] = useState(false);
  const quiz = useQuizStore((s) => s.quizzes.find((q) => q.id === params.quizId));

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
        <p className="text-sm text-muted-foreground">Zakovat topilmadi.</p>
        <Link href="/" className="text-sm text-accent hover:underline">
          Bosh sahifaga qaytish
        </Link>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-8 bg-background text-foreground">
        <div className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.4em] text-accent">
            Zakovat
          </p>
          <h1 className="text-4xl font-bold tracking-tight">{quiz.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {quiz.stages.length} ta bosqich &middot;{" "}
            {quiz.stages.reduce((n, s) => n + s.questions.length, 0)} ta savol
          </p>
        </div>
        <button
          onClick={() => {
            document.documentElement.requestFullscreen?.().catch(() => {});
            setStarted(true);
          }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-soft transition-transform hover:scale-105 active:scale-95"
        >
          <Play className="ml-1 h-7 w-7" />
        </button>
        <p className="text-xs text-muted-foreground">
          Taqdimotni boshlash uchun bosing &middot; keyin tugmalar: → keyingi, ← orqaga, Space
          javob, F to&apos;liq ekran
        </p>
      </div>
    );
  }

  return <PresentationShell quiz={quiz} />;
}
