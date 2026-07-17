"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuizStore } from "@/lib/store";
import { LANGUAGES, type Quiz } from "@/types/quiz";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The quiz's own title/description/default-language could previously only
 * be set once, in the New Quiz dialog, with no way to come back and change
 * them — this is that missing "settings" screen, reachable any time by
 * clicking the quiz name at the top of the sidebar.
 */
export function QuizSettingsPanel({ quiz }: { quiz: Quiz }) {
  const updateQuiz = useQuizStore((s) => s.updateQuiz);
  const t = useT();
  const totalQuestions = quiz.stages.reduce((n, s) => n + s.questions.length, 0);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-10 py-10">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-accent">
          {t("quizSettingsLabel")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("quizSettingsHeading")}</h1>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          {t("nameLabel")}
        </label>
        <Input
          value={quiz.title}
          onChange={(e) => updateQuiz(quiz.id, { title: e.target.value })}
          placeholder={t("nameLabel")}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          {t("descriptionLabel")} <span className="text-muted-foreground/50">{t("optional")}</span>
        </label>
        <Textarea
          value={quiz.description ?? ""}
          onChange={(e) => updateQuiz(quiz.id, { description: e.target.value })}
          placeholder={t("descriptionPlaceholder")}
          rows={3}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">{t("defaultLanguageLabel")}</p>
        <div className="flex gap-1.5">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => updateQuiz(quiz.id, { defaultLanguage: l.code })}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                quiz.defaultLanguage === l.code
                  ? "border-accent/60 bg-accent/10 text-foreground"
                  : "border-border bg-surface-2 text-muted-foreground hover:bg-foreground/5"
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground/70">{t("defaultLanguageHint")}</p>
      </div>

      <div className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground/80">{t("quizOverviewLabel")}</p>
        {quiz.stages.length} {t("stageWord")} &middot; {totalQuestions} {t("questionWord")}
      </div>
    </div>
  );
}
