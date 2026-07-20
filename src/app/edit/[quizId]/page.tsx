"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Undo2, Redo2 } from "lucide-react";
import { useQuizStore } from "@/lib/store";
import { useUndoRedoShortcut } from "@/lib/use-undo-shortcut";
import { DndRoot } from "@/components/edit/DndRoot";
import { Sidebar } from "@/components/edit/Sidebar";
import { StageSettingsPanel } from "@/components/edit/StageSettingsPanel";
import { QuestionEditorPanel } from "@/components/edit/QuestionEditorPanel";
import { QuizSettingsPanel } from "@/components/edit/QuizSettingsPanel";
import { MediaLibraryDialog } from "@/components/edit/MediaLibraryDialog";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n";

export default function EditPage({ params }: { params: { quizId: string } }) {
  const t = useT();
  const [mounted, setMounted] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [showQuizSettings, setShowQuizSettings] = useState(false);
  const [selection, setSelection] = useState<{
    stageId: string | null;
    questionId: string | null;
  }>({ stageId: null, questionId: null });

  const quiz = useQuizStore((s) => s.quizzes.find((q) => q.id === params.quizId));
  const canUndo = useQuizStore((s) => s.past.length > 0);
  const canRedo = useQuizStore((s) => s.future.length > 0);
  const undo = useQuizStore((s) => s.undo);
  const redo = useQuizStore((s) => s.redo);
  useUndoRedoShortcut();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (quiz && !selection.stageId && quiz.stages.length > 0) {
      setSelection({ stageId: quiz.stages[0].id, questionId: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz?.id, quiz?.stages.length]);

  if (!mounted) {
    return <div className="h-screen w-screen bg-background" />;
  }

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

  const activeStage = quiz.stages.find((s) => s.id === selection.stageId) ?? null;
  const activeQuestion =
    activeStage?.questions.find((q) => q.id === selection.questionId) ?? null;

  return (
    <DndRoot>
      <div className="flex h-screen w-screen bg-background text-foreground">
        <Sidebar
          quizId={quiz.id}
          selection={selection}
          quizSettingsActive={showQuizSettings}
          onSelectStage={(stageId) => {
            setShowQuizSettings(false);
            setSelection({ stageId, questionId: null });
          }}
          onSelectQuestion={(stageId, questionId) => {
            setShowQuizSettings(false);
            setSelection({ stageId, questionId });
          }}
          onOpenMediaLibrary={() => setMediaLibraryOpen(true)}
          onOpenQuizSettings={() => setShowQuizSettings(true)}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
            <div className="text-xs text-muted-foreground">{t("editModeAutosave")}</div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                title={t("undoAction")}
                aria-label={t("undoAction")}
                disabled={!canUndo}
                onClick={undo}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title={t("redoAction")}
                aria-label={t("redoAction")}
                disabled={!canRedo}
                onClick={redo}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <LanguageSwitcher />
              <ThemeToggle />
              <Link href={`/present/${quiz.id}`} target="_blank">
                <Button size="sm">
                  <Play className="h-3.5 w-3.5" /> {t("startPresentation")}
                </Button>
              </Link>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            {showQuizSettings ? (
              <QuizSettingsPanel quiz={quiz} />
            ) : activeQuestion && activeStage ? (
              <QuestionEditorPanel
                quizId={quiz.id}
                stageId={activeStage.id}
                question={activeQuestion}
              />
            ) : activeStage ? (
              <StageSettingsPanel quizId={quiz.id} stage={activeStage} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <p className="text-sm">{t("createStagePrompt")}</p>
              </div>
            )}
          </main>
        </div>

        <MediaLibraryDialog open={mediaLibraryOpen} onOpenChange={setMediaLibraryOpen} />
      </div>
    </DndRoot>
  );
}
