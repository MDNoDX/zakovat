"use client";

import { useQuizStore } from "@/lib/store";
import { LocalizedTextInput } from "@/components/editor/LocalizedTextInput";
import { LocalizedRichTextEditor } from "@/components/editor/LocalizedRichTextEditor";
import { REVEAL_MODES, type Stage } from "@/types/quiz";
import { useT, stageQuestionInfoParts, useUiLanguageStore, revealModeLabel, revealModeDescription } from "@/lib/i18n";

export function StageSettingsPanel({
  quizId,
  stage,
}: {
  quizId: string;
  stage: Stage;
}) {
  const updateStage = useQuizStore((s) => s.updateStage);
  const t = useT();
  const uiLanguage = useUiLanguageStore((s) => s.language);
  const infoParts = stageQuestionInfoParts(uiLanguage);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-10 py-10">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-accent">
          {t("stageSettingsLabel")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("introAndRules")}</h1>
      </div>

      <LocalizedTextInput
        label={t("stageNameLabel")}
        value={stage.name}
        placeholder={t("stageNamePlaceholder")}
        onChange={(name) => updateStage(quizId, stage.id, { name })}
      />

      <LocalizedRichTextEditor
        label={t("descRulesLabel")}
        value={stage.description}
        placeholder={t("descRulesPlaceholder")}
        onChange={(description) => updateStage(quizId, stage.id, { description })}
      />

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">{t("revealOrderLabel")}</p>
        <div className="flex flex-col gap-2">
          {REVEAL_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => updateStage(quizId, stage.id, { revealMode: mode.value })}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                stage.revealMode === mode.value
                  ? "border-accent/60 bg-accent/10"
                  : "border-border bg-surface-2 hover:bg-foreground/5"
              }`}
            >
              <div className="text-sm font-medium">{revealModeLabel(mode.value, uiLanguage)}</div>
              <div className="text-xs text-muted-foreground">
                {revealModeDescription(mode.value, uiLanguage)}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
        {infoParts.before} <span className="text-foreground">{stage.questions.length}</span>{" "}
        {infoParts.after}
      </div>
    </div>
  );
}
