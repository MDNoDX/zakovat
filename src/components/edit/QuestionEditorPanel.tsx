"use client";

import { useState } from "react";
import {
  Image as ImageIcon,
  Music,
  Video,
  Trash2,
  Copy,
  Plus,
  X,
  Check,
  Timer as TimerIcon,
  MessageSquare,
  Images,
  Sparkles,
} from "lucide-react";
import { useQuizStore } from "@/lib/store";
import { uid } from "@/lib/utils";
import { useMediaUrl } from "@/lib/media";
import {
  COLLAGE_REVEAL_STYLES,
  emptyLocalizedText,
  TIMER_OPTIONS,
  type CollageRevealStyle,
  type ImageQuestion,
  type MultiImageQuestion,
  type MultipleChoiceQuestion,
  type MusicQuestion,
  type Question,
  type QuestionPatch,
  type VideoQuestion,
} from "@/types/quiz";
import { LocalizedRichTextEditor } from "@/components/editor/LocalizedRichTextEditor";
import { LocalizedTextInput } from "@/components/editor/LocalizedTextInput";
import { Button } from "@/components/ui/button";
import { MediaLibraryDialog } from "@/components/edit/MediaLibraryDialog";
import { MediaThumb } from "@/components/edit/MediaThumb";
import { cn } from "@/lib/utils";
import { useT, questionTypeLabel, collageRevealLabel, collageRevealDescription, useUiLanguageStore } from "@/lib/i18n";

type MediaTarget = null | "primary" | "answer" | "multi-add" | "background";

export function QuestionEditorPanel({
  quizId,
  stageId,
  question,
}: {
  quizId: string;
  stageId: string;
  question: Question;
}) {
  const updateQuestion = useQuizStore((s) => s.updateQuestion);
  const deleteQuestion = useQuizStore((s) => s.deleteQuestion);
  const duplicateQuestion = useQuizStore((s) => s.duplicateQuestion);
  const answerMediaItem = useQuizStore((s) =>
    s.media.find((m) => m.id === question.answer.mediaId)
  );
  const [mediaTarget, setMediaTarget] = useState<MediaTarget>(null);
  const t = useT();
  const uiLanguage = useUiLanguageStore((s) => s.language);

  const supportsBackground = question.type !== "music";

  function patch(p: QuestionPatch) {
    updateQuestion(quizId, stageId, question.id, p);
  }

  const mediaKindForTarget =
    question.type === "music" ? "audio" : question.type === "video" ? "video" : "image";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-10 py-10">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-accent">
            {questionTypeLabel(question.type, uiLanguage)}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{t("editQuestion")}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            title={t("duplicate")}
            aria-label={t("duplicate")}
            onClick={() => duplicateQuestion(quizId, stageId, question.id)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={t("delete")}
            aria-label={t("delete")}
            onClick={() => {
              if (confirm(t("confirmDeleteQuestion"))) deleteQuestion(quizId, stageId, question.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      </div>

      <EditorSection icon={MessageSquare} title={t("questionTextLabel")}>
        <LocalizedRichTextEditor
          value={question.prompt}
          placeholder={t("questionTextPlaceholder")}
          onChange={(prompt) => patch({ prompt })}
        />
      </EditorSection>

      {question.type === "multiple-choice" && (
        <EditorSection icon={Check} title={t("optionsLabel")} hint={t("optionsHint")}>
          <MultipleChoiceEditor question={question} onChange={(p) => patch(p)} />
        </EditorSection>
      )}

      {question.type === "image" && (
        <EditorSection icon={ImageIcon} title={t("imageLabel")}>
          <SingleMediaField
            mediaId={(question as ImageQuestion).mediaId}
            kind="image"
            onPick={() => setMediaTarget("primary")}
            onClear={() => patch({ mediaId: null } as Partial<ImageQuestion>)}
          />
        </EditorSection>
      )}

      {question.type === "music" && (
        <EditorSection icon={Music} title={t("audioFileLabel")}>
          <SingleMediaField
            mediaId={(question as MusicQuestion).mediaId}
            kind="audio"
            onPick={() => setMediaTarget("primary")}
            onClear={() => patch({ mediaId: null } as Partial<MusicQuestion>)}
          />
        </EditorSection>
      )}

      {question.type === "video" && (
        <EditorSection icon={Video} title={t("videoFileLabel")}>
          <SingleMediaField
            mediaId={(question as VideoQuestion).mediaId}
            kind="video"
            onPick={() => setMediaTarget("primary")}
            onClear={() => patch({ mediaId: null } as Partial<VideoQuestion>)}
          />
        </EditorSection>
      )}

      {question.type === "multi-image" && (
        <EditorSection icon={Images} title={t("imagesLabel")}>
          <MultiImageEditor
            question={question as MultiImageQuestion}
            onAdd={() => setMediaTarget("multi-add")}
            onChangeIds={(mediaIds) => patch({ mediaIds } as Partial<MultiImageQuestion>)}
            onChangeRevealStyle={(revealStyle) => patch({ revealStyle })}
          />
        </EditorSection>
      )}

      {supportsBackground && (
        <EditorSection
          icon={Sparkles}
          title={t("backgroundImageLabel")}
          hint={t("backgroundImageHint")}
        >
          <SingleMediaField
            mediaId={question.backgroundImageId}
            kind="image"
            onPick={() => setMediaTarget("background")}
            onClear={() => patch({ backgroundImageId: null })}
          />
        </EditorSection>
      )}

      <EditorSection icon={TimerIcon} title={t("timerLabel")}>
        <div className="flex flex-wrap gap-1.5">
          {TIMER_OPTIONS.map((opt) => (
            <button
              key={String(opt)}
              onClick={() => patch({ timerSeconds: opt })}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                question.timerSeconds === opt
                  ? "border-accent/60 bg-accent/10 text-foreground"
                  : "border-border bg-surface-2 text-muted-foreground hover:bg-foreground/5"
              )}
            >
              {opt === null ? t("timerOff") : `${opt}s`}
            </button>
          ))}
        </div>
      </EditorSection>

      <div className="rounded-2xl border border-border bg-surface-2/50 p-5">
        <p className="mb-4 text-sm font-semibold text-foreground/90">{t("answerSlideLabel")}</p>
        <div className="flex flex-col gap-5">
          <LocalizedRichTextEditor
            label={t("correctAnswerFieldLabel")}
            value={question.answer.correctText}
            placeholder={t("correctAnswerPlaceholder")}
            minimal
            onChange={(correctText) =>
              patch({ answer: { ...question.answer, correctText } })
            }
          />
          <LocalizedRichTextEditor
            label={t("explanationLabel")}
            value={question.answer.explanation ?? emptyLocalizedText()}
            placeholder={t("explanationPlaceholder")}
            minimal
            onChange={(explanation) =>
              patch({ answer: { ...question.answer, explanation } })
            }
          />
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {t("answerImageLabel")}
            </p>
            <SingleMediaField
              mediaId={question.answer.mediaId}
              kind={answerMediaItem?.kind ?? "image"}
              onPick={() => setMediaTarget("answer")}
              onClear={() => patch({ answer: { ...question.answer, mediaId: null } })}
            />
          </div>
        </div>
      </div>

      <MediaLibraryDialog
        open={mediaTarget !== null}
        onOpenChange={(o) => !o && setMediaTarget(null)}
        filterKind={
          mediaTarget === "primary"
            ? mediaKindForTarget
            : mediaTarget === "answer"
            ? ["image", "video", "audio"]
            : "image"
        }
        multiple={mediaTarget === "multi-add"}
        onSelect={(ids) => {
          if (mediaTarget === "primary") {
            patch({ mediaId: ids[0] ?? null });
          } else if (mediaTarget === "answer") {
            patch({ answer: { ...question.answer, mediaId: ids[0] ?? null } });
          } else if (mediaTarget === "background") {
            patch({ backgroundImageId: ids[0] ?? null });
          } else if (mediaTarget === "multi-add" && question.type === "multi-image") {
            const existing = (question as MultiImageQuestion).mediaIds;
            patch({ mediaIds: [...existing, ...ids] } as Partial<MultiImageQuestion>);
          }
        }}
      />
    </div>
  );
}

function EditorSection({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ElementType;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
      </div>
      {children}
      {hint && <p className="mt-1.5 text-[11px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

function MultipleChoiceEditor({
  question,
  onChange,
}: {
  question: MultipleChoiceQuestion;
  onChange: (p: Partial<MultipleChoiceQuestion>) => void;
}) {
  const letters = ["A", "B", "C", "D", "E", "F"];
  const t = useT();

  function updateOption(id: string, text: MultipleChoiceQuestion["options"][number]["text"]) {
    onChange({
      options: question.options.map((o) => (o.id === id ? { ...o, text } : o)),
    });
  }

  function removeOption(id: string) {
    if (question.options.length <= 2) return;
    onChange({
      options: question.options.filter((o) => o.id !== id),
      correctOptionId: question.correctOptionId === id ? null : question.correctOptionId,
    });
  }

  function addOption() {
    if (question.options.length >= 6) return;
    onChange({
      options: [...question.options, { id: uid(), text: emptyLocalizedText() }],
    });
  }

  return (
    <div>
      <div className="flex flex-col gap-2.5">
        {question.options.map((opt, i) => (
          <div key={opt.id} className="flex items-start gap-2">
            <button
              title={t("markCorrectTitle")}
              onClick={() => onChange({ correctOptionId: opt.id })}
              className={cn(
                "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-colors",
                question.correctOptionId === opt.id
                  ? "border-emerald-400 bg-emerald-400/15 text-emerald-400"
                  : "border-border text-muted-foreground hover:border-accent/50"
              )}
            >
              {question.correctOptionId === opt.id ? <Check className="h-3 w-3" /> : letters[i]}
            </button>
            <div className="flex-1">
              <LocalizedTextInput
                value={opt.text}
                placeholder={`${letters[i]} varianti`}
                onChange={(text) => updateOption(opt.id, text)}
              />
            </div>
            {question.options.length > 2 && (
              <button
                onClick={() => removeOption(opt.id)}
                className="mt-1 rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
      {question.options.length < 6 && (
        <button
          onClick={addOption}
          className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3 w-3" /> {t("addOption")}
        </button>
      )}
    </div>
  );
}

function SingleMediaField({
  mediaId,
  kind,
  onPick,
  onClear,
}: {
  mediaId: string | null | undefined;
  kind: "image" | "audio" | "video";
  onPick: () => void;
  onClear: () => void;
}) {
  const url = useMediaUrl(mediaId);
  const Icon = kind === "audio" ? Music : kind === "video" ? Video : ImageIcon;
  const t = useT();

  return (
    <div>
      {mediaId && url ? (
        <div className="group relative w-full max-w-xs overflow-hidden rounded-xl border border-border">
          {kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="max-h-52 w-full object-cover" />
          )}
          {kind === "video" && <video src={url} className="max-h-52 w-full" controls />}
          {kind === "audio" && (
            <div className="flex items-center gap-2 p-3">
              <Music className="h-4 w-4 text-accent" />
              <audio src={url} controls className="h-8 flex-1" />
            </div>
          )}
          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={onPick}
              className="rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              title={t("replaceMedia")}
              aria-label={t("replaceMedia")}
            >
              <ImageIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onClear}
              className="rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              title={t("delete")}
              aria-label={t("delete")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onPick}
          className="flex w-full max-w-xs flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-surface-2 py-8 text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
        >
          <Icon className="h-5 w-5" />
          <span className="text-xs">{t("chooseFile")}</span>
        </button>
      )}
    </div>
  );
}

function MultiImageEditor({
  question,
  onAdd,
  onChangeIds,
  onChangeRevealStyle,
}: {
  question: MultiImageQuestion;
  onAdd: () => void;
  onChangeIds: (ids: string[]) => void;
  onChangeRevealStyle: (style: CollageRevealStyle) => void;
}) {
  const media = useQuizStore((s) => s.media);
  const t = useT();
  const uiLanguage = useUiLanguageStore((s) => s.language);

  function removeAt(index: number) {
    const next = question.mediaIds.slice();
    next.splice(index, 1);
    onChangeIds(next);
  }

  return (
    <div>
      <p className="mb-2 text-[11px] text-muted-foreground/70">
        {question.mediaIds.length} {t("collageImagesInfoSuffix")}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {question.mediaIds.map((id, i) => {
          const item = media.find((m) => m.id === id);
          if (!item) return null;
          return (
            <div key={id} className="group relative aspect-square overflow-hidden rounded-lg">
              <MediaThumb item={item} className="h-full w-full" />
              {question.revealStyle === "sequential" && (
                <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
              )}
              <button
                onClick={() => removeAt(i)}
                aria-label={t("delete")}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
        <button
          onClick={onAdd}
          className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:border-accent/50 hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {question.mediaIds.length > 1 && (
        <div className="mt-3 flex gap-1.5">
          {COLLAGE_REVEAL_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={() => onChangeRevealStyle(style.value)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-left transition-colors",
                question.revealStyle === style.value
                  ? "border-accent/60 bg-accent/10"
                  : "border-border bg-surface-2 hover:bg-foreground/5"
              )}
            >
              <div className="text-xs font-medium">{collageRevealLabel(style.value, uiLanguage)}</div>
              <div className="text-[10px] text-muted-foreground">
                {collageRevealDescription(style.value, uiLanguage)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
