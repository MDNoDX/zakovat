// Core domain types for Zakovat presentation quizzes.
// Every user-facing text field can hold 1-3 language variants, freely
// chosen by the presenter (not forced into always filling uz+ru+en).

export type Language = "uz" | "ru" | "en";

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "uz", label: "O'zbekcha" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

/** One language's worth of rich-text HTML content (produced by the Tiptap editor). */
export interface TextVariant {
  language: Language;
  content: string;
}

/**
 * An ordered list of language variants for a single piece of text. Always
 * has at least one entry; can grow up to one entry per supported language.
 * The presenter picks which language each entry represents and can add
 * more languages on demand — nothing is force-filled.
 */
export type LocalizedText = TextVariant[];

export function emptyLocalizedText(language: Language = "uz"): LocalizedText {
  return [{ language, content: "" }];
}

export function isLocalizedTextEmpty(t: LocalizedText | undefined): boolean {
  if (!t || t.length === 0) return true;
  return t.every((v) => !v.content || v.content.replace(/<[^>]*>/g, "").trim() === "");
}

/**
 * Resolves what to actually show for a given presentation/UI language:
 * the exact variant if it exists and has content, otherwise the first
 * variant that does have content, otherwise an empty string. This keeps
 * Presentation Mode looking intentional even when a question has only
 * been written in one or two languages.
 */
export function resolveText(t: LocalizedText | undefined, language: Language): string {
  if (!t || t.length === 0) return "";
  const exact = t.find((v) => v.language === language);
  if (exact && exact.content && exact.content.trim() !== "") return exact.content;
  const anyFilled = t.find((v) => v.content && v.content.trim() !== "");
  return anyFilled?.content ?? t[0]?.content ?? "";
}

export function usedLanguages(t: LocalizedText | undefined): Language[] {
  return (t ?? []).map((v) => v.language);
}

export function unusedLanguages(t: LocalizedText | undefined): Language[] {
  const used = new Set(usedLanguages(t));
  return LANGUAGES.map((l) => l.code).filter((code) => !used.has(code));
}

/** Case-insensitive substring search across every language variant of a field. */
export function localizedTextMatches(t: LocalizedText | undefined, query: string): boolean {
  if (!query.trim()) return true;
  if (!t) return false;
  const needle = query.trim().toLowerCase();
  return t.some((v) => v.content.replace(/<[^>]*>/g, " ").toLowerCase().includes(needle));
}

/** How answers are revealed within a stage. */
export type RevealMode = "after-each" | "end-of-stage" | "manual";

export const REVEAL_MODES: { value: RevealMode; label: string; description: string }[] = [
  {
    value: "after-each",
    label: "Har savoldan keyin",
    description: "Savol → Javob → Keyingi savol",
  },
  {
    value: "end-of-stage",
    label: "Bosqich oxirida",
    description: "Barcha savollar → keyin barcha javoblar",
  },
  {
    value: "manual",
    label: "Qo'lda boshqarish",
    description: "Taqdimotchi o'zi qachon ochishni hal qiladi",
  },
];

export type QuestionType =
  | "text"
  | "multiple-choice"
  | "image"
  | "multi-image"
  | "music"
  | "video";

export type TimerSeconds = 15 | 20 | 30 | 45 | 60 | null;

export const TIMER_OPTIONS: TimerSeconds[] = [15, 20, 30, 45, 60, null];

export interface MultipleChoiceOption {
  id: string;
  text: LocalizedText;
}

/** How a piece of media fills its frame during presentation: "contain" keeps
 * the whole picture visible inside a bordered player (safe for any aspect
 * ratio); "cover" fills the entire screen edge-to-edge, cropping whatever
 * doesn't fit — for full-screen impact. Applies to image and video media;
 * audio has no visual frame to size (its waveform styling is separate). */
export type MediaDisplaySize = "contain" | "cover";

/** Answer media gets its own 3-tier size system rather than reusing
 * MediaDisplaySize's plain contain/cover: "small" and "medium" both render
 * at a fixed, predictable box (so two different source photos/clips always
 * look the same size on stage regardless of their own pixel dimensions —
 * previously the display size silently tracked whatever resolution the
 * file happened to be), and "fit" is the existing full-screen treatment. */
export type AnswerMediaSize = "small" | "medium" | "fit";
export const ANSWER_MEDIA_SIZES: AnswerMediaSize[] = ["small", "medium", "fit"];

export interface Answer {
  correctText: LocalizedText;
  explanation?: LocalizedText;
  mediaId?: string | null;
  /** Falls back to "medium" when absent. Only meaningful when the answer
   * media is an image or video. */
  mediaDisplaySize?: AnswerMediaSize;
  /** An alternative to the single `mediaId` slot: a collage of several
   * images revealed together as the answer (e.g. "here's the whole set").
   * When this has entries it takes over from `mediaId` for what's shown. */
  mediaIds?: string[];
  /** Reuses the same reveal styles as multi-image questions; only relevant
   * when `mediaIds` is in use. Falls back to "all-at-once". */
  collageRevealStyle?: CollageRevealStyle;
}

interface QuestionBase {
  id: string;
  type: QuestionType;
  prompt: LocalizedText;
  /** How large the question text itself renders. Falls back to each slide's
   * own sensible default (e.g. "hero" for a plain text question, "medium"
   * once media is sharing the screen with it) when absent. */
  promptSize?: PromptSize;
  timerSeconds: TimerSeconds;
  answer: Answer;
  /** Optional full-bleed background photo shown behind the slide during presentation. */
  backgroundImageId?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface TextQuestion extends QuestionBase {
  type: "text";
}

/** How a multiple-choice question's correct answer gets revealed:
 * "highlight" just marks the correct option in place among the others
 * (the original behavior); "announce" instead shows the full standard
 * answer treatment (big text, media, explanation) like every other
 * question type — using the correct option's own text automatically if
 * no separate answer text was written. Falls back to "highlight". */
export type McAnswerRevealMode = "highlight" | "announce";

export interface MultipleChoiceQuestion extends QuestionBase {
  type: "multiple-choice";
  options: MultipleChoiceOption[];
  correctOptionId: string | null;
  /** Optional media shown alongside the options — same free-form slot as
   * every other question type. */
  mediaId?: string | null;
  /** Falls back to "contain" when absent (only meaningful for image/video). */
  displaySize?: MediaDisplaySize;
  answerRevealMode?: McAnswerRevealMode;
}

export interface ImageQuestion extends QuestionBase {
  type: "image";
  mediaId: string | null;
  /** Falls back to "contain" when absent (older questions). */
  displaySize?: MediaDisplaySize;
}

export type CollageLayout = 2 | 3 | 4 | 6 | 9;

/** How a multi-image slide reveals its pictures during presentation. */
export type CollageRevealStyle = "all-at-once" | "sequential";

export const COLLAGE_REVEAL_STYLES: {
  value: CollageRevealStyle;
  label: string;
  description: string;
}[] = [
  {
    value: "all-at-once",
    label: "Barchasi birdan",
    description: "Kollaj to'liq holda darhol ko'rinadi",
  },
  {
    value: "sequential",
    label: "Ketma-ket",
    description: "Har bosishda navbatdagi rasm ochiladi",
  },
];

export interface MultiImageQuestion extends QuestionBase {
  type: "multi-image";
  mediaIds: string[];
  revealStyle: CollageRevealStyle;
}

export interface MusicQuestion extends QuestionBase {
  type: "music";
  mediaId: string | null;
  /** Seconds into the clip where playback should begin (e.g. to skip a
   * silent intro on a guess-the-song clip) — a lightweight playback offset,
   * not a destructive edit of the file itself. Falls back to 0. */
  startAt?: number;
}

export interface VideoQuestion extends QuestionBase {
  type: "video";
  mediaId: string | null;
  /** Falls back to "contain" when absent (older questions). */
  displaySize?: MediaDisplaySize;
}

export type Question =
  | TextQuestion
  | MultipleChoiceQuestion
  | ImageQuestion
  | MultiImageQuestion
  | MusicQuestion
  | VideoQuestion;

/**
 * A loose "patch" shape used for partial updates against the store.
 * `Partial<Question>` alone would only expose fields common to every
 * variant (TS resolves `keyof` over a union as an intersection of keys),
 * dropping type-specific fields like `mediaId`/`options` entirely.
 * A plain intersection of each variant's Partial doesn't work either,
 * since the `type` literal differs per variant and those literals
 * conflict with each other under intersection. Instead we hand-list every
 * field across every variant once, with `type` widened back to
 * `QuestionType` — every concrete `Partial<XQuestion>` is then safely
 * assignable to this single flat shape.
 */
export interface QuestionPatch {
  id?: string;
  type?: QuestionType;
  prompt?: LocalizedText;
  promptSize?: PromptSize;
  timerSeconds?: TimerSeconds;
  answer?: Answer;
  createdAt?: number;
  updatedAt?: number;
  options?: MultipleChoiceOption[];
  correctOptionId?: string | null;
  mediaId?: string | null;
  mediaIds?: string[];
  revealStyle?: CollageRevealStyle;
  backgroundImageId?: string | null;
  displaySize?: MediaDisplaySize;
  startAt?: number;
  answerRevealMode?: McAnswerRevealMode;
}

/** Text sizing tiers used throughout Presentation Mode. */
export type PromptSize = "hero" | "large" | "medium" | "small";
export const PROMPT_SIZES: PromptSize[] = ["small", "medium", "large", "hero"];

export type TextAlign = "left" | "center" | "right";
export type IntroBackgroundStyle = "none" | "gradient" | "solid";

/** How a stage's intro slide (name + description) is styled — fully
 * presenter-customizable so it can match whatever the stage is about. */
export interface StageIntroStyle {
  nameSize: PromptSize;
  descriptionSize: PromptSize;
  align: TextAlign;
  /** Hex color override for the intro text; null keeps the app's own theme color. */
  textColor: string | null;
  background: IntroBackgroundStyle;
  /** Hex color used when background is "gradient" or "solid". */
  backgroundColor: string;
}

export const DEFAULT_INTRO_STYLE: StageIntroStyle = {
  nameSize: "hero",
  descriptionSize: "small",
  align: "center",
  textColor: null,
  background: "none",
  backgroundColor: "#3B82F6",
};

export interface Stage {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  revealMode: RevealMode;
  questions: Question[];
  /** Optional — falls back to DEFAULT_INTRO_STYLE when absent (older quizzes). */
  introStyle?: StageIntroStyle;
  /** Background photo for this stage's own slides — sits between a
   * question's own `backgroundImageId` (always wins) and the quiz-wide
   * `backgroundImageId` (the final fallback) in the resolution chain, so a
   * single round can have its own look without setting it question by
   * question or changing the whole show's default. */
  backgroundImageId?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Quiz {
  id: string;
  title: string;
  /**
   * Rich, multi-language intro text shown on the presenter's start screen
   * before the show begins — the natural place for a brief explanation of
   * the rules and how scoring works. Same free-form model as every other
   * text field: 1-3 language variants, real formatting (bold/lists/etc).
   */
  description?: LocalizedText;
  /** Fallback full-bleed background photo used by every question/answer
   * slide that doesn't set its own `backgroundImageId` — a quick way to
   * give a whole show a consistent look without setting it question by
   * question. A question's own background always wins when both are set. */
  backgroundImageId?: string | null;
  /** Fallback background used specifically for ANSWER-reveal slides across
   * the whole quiz (e.g. a distinct "reveal" look, different from the
   * question backdrop) — only takes effect when the question itself has no
   * `backgroundImageId` of its own. Falls back to the stage's and then the
   * quiz's regular `backgroundImageId` when unset. */
  answerBackgroundImageId?: string | null;
  stages: Stage[];
  defaultLanguage: Language;
  createdAt: number;
  updatedAt: number;
}

export type MediaKind = "image" | "video" | "audio";

export interface MediaItem {
  id: string;
  kind: MediaKind;
  name: string;
  mimeType: string;
  size: number;
  createdAt: number;
  /** width/height for images, useful for collage layout */
  width?: number;
  height?: number;
  /** Optional short caption shown alongside this clip during presentation. */
  caption?: string;
}

export const QUESTION_TYPE_META: Record<
  QuestionType,
  { label: string; description: string }
> = {
  text: { label: "Matnli savol", description: "Faqat savol matni" },
  "multiple-choice": { label: "Variantli savol", description: "4 ta variant, biri to'g'ri" },
  image: { label: "Rasmli savol", description: "Bitta rasm yuklanadi" },
  "multi-image": { label: "Kollaj savol", description: "Bir nechta rasm, avto-kollaj" },
  music: { label: "Musiqa savoli", description: "Audio fayl, pleer bilan" },
  video: { label: "Video savol", description: "To'liq ekranli video pleer" },
};

export function collageLayoutFor(count: number): CollageLayout {
  if (count <= 2) return 2;
  if (count === 3) return 3;
  if (count <= 4) return 4;
  if (count <= 6) return 6;
  return 9;
}
