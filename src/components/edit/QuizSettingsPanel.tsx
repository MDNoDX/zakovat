"use client";

import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuizStore } from "@/lib/store";
import {
  DEFAULT_CLOSING_SLIDE,
  emptyLocalizedText,
  LANGUAGES,
  type ClosingSlideSettings,
  type ClosingWinners,
  type Quiz,
} from "@/types/quiz";
import { LocalizedRichTextEditor } from "@/components/editor/LocalizedRichTextEditor";
import { BackgroundImageField } from "@/components/edit/BackgroundImageField";
import { useWaveformStyleStore, WAVEFORM_SHAPES, WAVEFORM_SHAPE_LABEL } from "@/lib/use-waveform-style";
import { useT, rulesTemplateHtml, useUiLanguageStore } from "@/lib/i18n";
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
  const uiLanguage = useUiLanguageStore((s) => s.language);
  const totalQuestions = quiz.stages.reduce((n, s) => n + s.questions.length, 0);
  const waveformShape = useWaveformStyleStore((s) => s.shape);
  const setWaveformShape = useWaveformStyleStore((s) => s.setShape);
  const closing = quiz.closingSlide ?? DEFAULT_CLOSING_SLIDE;

  function updateClosing(patch: Partial<ClosingSlideSettings>) {
    updateQuiz(quiz.id, { closingSlide: { ...closing, ...patch } });
  }

  function updateWinner(key: keyof ClosingWinners, value: string) {
    updateClosing({ winners: { ...closing.winners, [key]: value } });
  }

  function applyTemplate() {
    const current = quiz.description ?? emptyLocalizedText();
    const lang = current[0]?.language ?? uiLanguage;
    const rest = current.slice(1);
    updateQuiz(quiz.id, { description: [{ language: lang, content: rulesTemplateHtml(lang) }, ...rest] });
  }

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
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-xs font-medium text-muted-foreground">
            {t("descriptionLabel")} <span className="text-muted-foreground/50">{t("optional")}</span>
          </label>
          <button
            type="button"
            onClick={applyTemplate}
            className="flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
          >
            <Sparkles className="h-3 w-3" /> {t("useRulesTemplate")}
          </button>
        </div>
        <LocalizedRichTextEditor
          value={quiz.description ?? emptyLocalizedText()}
          placeholder={t("descriptionPlaceholder")}
          onChange={(description) => updateQuiz(quiz.id, { description })}
          minimal
        />
        <p className="mt-1.5 text-[11px] text-muted-foreground/70">{t("quizDescriptionHint")}</p>
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

      <BackgroundImageField
        label={t("quizBackgroundLabel")}
        hint={t("quizBackgroundHint")}
        mediaId={quiz.backgroundImageId}
        onChange={(backgroundImageId) => updateQuiz(quiz.id, { backgroundImageId })}
      />

      <BackgroundImageField
        label={t("answerBackgroundLabel")}
        hint={t("answerBackgroundHint")}
        mediaId={quiz.answerBackgroundImageId}
        onChange={(answerBackgroundImageId) => updateQuiz(quiz.id, { answerBackgroundImageId })}
      />

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">{t("closingSlideLabel")}</p>
        <label className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
          <input
            type="checkbox"
            checked={closing.enabled}
            onChange={(e) => updateClosing({ enabled: e.target.checked })}
            className="accent-accent"
          />
          {t("closingSlideEnableLabel")}
        </label>
        <p className="mb-3 text-[11px] text-muted-foreground/70">{t("closingSlideEnableHint")}</p>

        {closing.enabled && (
          <div className="flex flex-col gap-6 rounded-xl border border-border bg-surface-2/40 p-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t("closingTitleLabel")} <span className="text-muted-foreground/50">{t("optional")}</span>
              </label>
              <LocalizedRichTextEditor
                value={closing.title ?? emptyLocalizedText()}
                placeholder={t("closingDefaultTitle")}
                onChange={(title) => updateClosing({ title })}
                minimal
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t("closingMessageLabel")} <span className="text-muted-foreground/50">{t("optional")}</span>
              </label>
              <LocalizedRichTextEditor
                value={closing.message ?? emptyLocalizedText()}
                placeholder={t("closingMessagePlaceholder")}
                onChange={(message) => updateClosing({ message })}
                minimal
              />
            </div>

            <BackgroundImageField
              label={t("closingBackgroundLabel")}
              hint={t("closingBackgroundHint")}
              mediaId={closing.backgroundImageId}
              onChange={(backgroundImageId) => updateClosing({ backgroundImageId })}
            />

            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <input
                  type="checkbox"
                  checked={closing.showRanking}
                  onChange={(e) => updateClosing({ showRanking: e.target.checked })}
                  className="accent-accent"
                />
                {t("closingShowRankingLabel")}
              </label>

              {closing.showRanking && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
                      {t("firstPlaceLabel")}
                    </label>
                    <Input
                      value={closing.winners?.first ?? ""}
                      onChange={(e) => updateWinner("first", e.target.value)}
                      placeholder={t("teamNamePlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
                      {t("secondPlaceLabel")}
                    </label>
                    <Input
                      value={closing.winners?.second ?? ""}
                      onChange={(e) => updateWinner("second", e.target.value)}
                      placeholder={t("teamNamePlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
                      {t("thirdPlaceLabel")}
                    </label>
                    <Input
                      value={closing.winners?.third ?? ""}
                      onChange={(e) => updateWinner("third", e.target.value)}
                      placeholder={t("teamNamePlaceholder")}
                    />
                  </div>
                </div>
              )}
              <p className="mt-1.5 text-[11px] text-muted-foreground/70">{t("closingShowRankingHint")}</p>
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">{t("waveformStyleLabel")}</p>
        <div className="flex flex-wrap gap-1.5">
          {WAVEFORM_SHAPES.map((shape) => (
            <button
              key={shape}
              onClick={() => setWaveformShape(shape)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                waveformShape === shape
                  ? "border-accent/60 bg-accent/10 text-foreground"
                  : "border-border bg-surface-2 text-muted-foreground hover:bg-foreground/5"
              )}
            >
              {WAVEFORM_SHAPE_LABEL[shape]}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground/70">{t("waveformStyleHint")}</p>
      </div>

      <div className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground/80">{t("quizOverviewLabel")}</p>
        {quiz.stages.length} {t("stageWord")} &middot; {totalQuestions} {t("questionWord")}
      </div>
    </div>
  );
}
