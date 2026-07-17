"use client";

import { useQuizStore } from "@/lib/store";
import { LocalizedTextInput } from "@/components/editor/LocalizedTextInput";
import { LocalizedRichTextEditor } from "@/components/editor/LocalizedRichTextEditor";
import {
  DEFAULT_INTRO_STYLE,
  PROMPT_SIZES,
  REVEAL_MODES,
  type PromptSize,
  type Stage,
  type StageIntroStyle,
  type TextAlign,
} from "@/types/quiz";
import {
  useT,
  stageQuestionInfoParts,
  useUiLanguageStore,
  revealModeLabel,
  revealModeDescription,
  promptSizeLabel,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";

const COLOR_SWATCHES = ["#F8FAFC", "#3B82F6", "#F87171", "#FBBF24", "#34D399", "#A78BFA", "#F472B6"];
const ALIGN_OPTIONS: TextAlign[] = ["left", "center", "right"];
const ALIGN_LABEL_KEY: Record<TextAlign, "alignLeft" | "alignCenter" | "alignRight"> = {
  left: "alignLeft",
  center: "alignCenter",
  right: "alignRight",
};

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
  const introStyle = stage.introStyle ?? DEFAULT_INTRO_STYLE;

  function patchIntroStyle(patch: Partial<StageIntroStyle>) {
    updateStage(quizId, stage.id, { introStyle: { ...introStyle, ...patch } });
  }

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

      <div className="rounded-2xl border border-border bg-surface-2/50 p-5">
        <p className="mb-4 text-sm font-semibold text-foreground/90">{t("introStyleLabel")}</p>
        <div className="flex flex-col gap-5">
          <SizeField
            label={t("nameSizeLabel")}
            value={introStyle.nameSize}
            onChange={(nameSize) => patchIntroStyle({ nameSize })}
            uiLanguage={uiLanguage}
          />
          <SizeField
            label={t("descriptionSizeLabel")}
            value={introStyle.descriptionSize}
            onChange={(descriptionSize) => patchIntroStyle({ descriptionSize })}
            uiLanguage={uiLanguage}
          />

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t("textAlignLabel")}</p>
            <div className="flex gap-1.5">
              {ALIGN_OPTIONS.map((align) => (
                <button
                  key={align}
                  onClick={() => patchIntroStyle({ align })}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    introStyle.align === align
                      ? "border-accent/60 bg-accent/10 text-foreground"
                      : "border-border bg-surface-2 text-muted-foreground hover:bg-foreground/5"
                  )}
                >
                  {t(ALIGN_LABEL_KEY[align])}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t("textColorLabel")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => patchIntroStyle({ textColor: null })}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                  introStyle.textColor === null
                    ? "border-accent/60 bg-accent/10 text-foreground"
                    : "border-border bg-surface-2 text-muted-foreground hover:bg-foreground/5"
                )}
              >
                {t("useThemeColor")}
              </button>
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  title={c}
                  onClick={() => patchIntroStyle({ textColor: c })}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                    introStyle.textColor === c ? "border-accent" : "border-border"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {t("backgroundStyleLabel")}
            </p>
            <div className="flex gap-1.5">
              {(["none", "gradient", "solid"] as const).map((bg) => (
                <button
                  key={bg}
                  onClick={() => patchIntroStyle({ background: bg })}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    introStyle.background === bg
                      ? "border-accent/60 bg-accent/10 text-foreground"
                      : "border-border bg-surface-2 text-muted-foreground hover:bg-foreground/5"
                  )}
                >
                  {t(bg === "none" ? "bgNone" : bg === "gradient" ? "bgGradient" : "bgSolid")}
                </button>
              ))}
            </div>
          </div>

          {introStyle.background !== "none" && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {t("backgroundColorLabel")}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    title={c}
                    onClick={() => patchIntroStyle({ backgroundColor: c })}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                      introStyle.backgroundColor === c ? "border-accent" : "border-border"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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

function SizeField({
  label,
  value,
  onChange,
  uiLanguage,
}: {
  label: string;
  value: PromptSize;
  onChange: (size: PromptSize) => void;
  uiLanguage: Parameters<typeof promptSizeLabel>[1];
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {PROMPT_SIZES.map((size) => (
          <button
            key={size}
            onClick={() => onChange(size)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              value === size
                ? "border-accent/60 bg-accent/10 text-foreground"
                : "border-border bg-surface-2 text-muted-foreground hover:bg-foreground/5"
            )}
          >
            {promptSizeLabel(size, uiLanguage)}
          </button>
        ))}
      </div>
    </div>
  );
}
