// Core domain types for Zakovat presentation quizzes.
// Every user-facing text field is localized across three languages.

export type Language = "uz" | "ru" | "en";

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "uz", label: "O'zbekcha" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

/** Rich text stored as sanitized HTML per language (produced by the Tiptap editor). */
export type LocalizedText = Record<Language, string>;

export function emptyLocalizedText(): LocalizedText {
  return { uz: "", ru: "", en: "" };
}

export function isLocalizedTextEmpty(t: LocalizedText | undefined): boolean {
  if (!t) return true;
  return Object.values(t).every((v) => !v || v.replace(/<[^>]*>/g, "").trim() === "");
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

export interface Answer {
  correctText: LocalizedText;
  explanation?: LocalizedText;
  mediaId?: string | null;
}

interface QuestionBase {
  id: string;
  type: QuestionType;
  prompt: LocalizedText;
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

export interface MultipleChoiceQuestion extends QuestionBase {
  type: "multiple-choice";
  options: MultipleChoiceOption[];
  correctOptionId: string | null;
}

export interface ImageQuestion extends QuestionBase {
  type: "image";
  mediaId: string | null;
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
}

export interface VideoQuestion extends QuestionBase {
  type: "video";
  mediaId: string | null;
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
}

export interface Stage {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  revealMode: RevealMode;
  questions: Question[];
  createdAt: number;
  updatedAt: number;
}

export interface Quiz {
  id: string;
  title: string;
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
