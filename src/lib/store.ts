"use client";

import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { createQuestion, createQuiz, createStage } from "@/lib/factories";
import { uid } from "@/lib/utils";
import type {
  Language,
  LocalizedText,
  MediaItem,
  Question,
  QuestionPatch,
  QuestionType,
  Quiz,
  Stage,
} from "@/types/quiz";

interface QuizStore {
  quizzes: Quiz[];
  media: MediaItem[];

  // Quiz-level
  createQuiz: (title: string, description?: LocalizedText) => string;
  /** Inserts an already-fully-built quiz object as-is (used by the demo-quiz installer). */
  installQuiz: (quiz: Quiz) => void;
  deleteQuiz: (quizId: string) => void;
  duplicateQuiz: (quizId: string) => string | undefined;
  updateQuiz: (
    quizId: string,
    patch: Partial<Pick<Quiz, "title" | "description" | "defaultLanguage">>
  ) => void;
  getQuiz: (quizId: string) => Quiz | undefined;

  // Stage-level
  addStage: (quizId: string) => string;
  updateStage: (quizId: string, stageId: string, patch: Partial<Stage>) => void;
  deleteStage: (quizId: string, stageId: string) => void;
  reorderStages: (quizId: string, fromIndex: number, toIndex: number) => void;
  duplicateStage: (quizId: string, stageId: string) => void;

  // Question-level
  addQuestion: (
    quizId: string,
    stageId: string,
    type: QuestionType,
    prompt?: LocalizedText
  ) => string;
  updateQuestion: (
    quizId: string,
    stageId: string,
    questionId: string,
    patch: QuestionPatch
  ) => void;
  deleteQuestion: (quizId: string, stageId: string, questionId: string) => void;
  reorderQuestions: (
    quizId: string,
    stageId: string,
    fromIndex: number,
    toIndex: number
  ) => void;
  duplicateQuestion: (quizId: string, stageId: string, questionId: string) => void;

  // Media metadata
  addMedia: (item: MediaItem) => void;
  deleteMedia: (mediaId: string) => void;
  updateMediaCaption: (mediaId: string, caption: string) => void;
}

function touch<T extends { updatedAt: number }>(obj: T): T {
  return { ...obj, updatedAt: Date.now() };
}

// Every keystroke in a question/answer editor runs through this store, and
// zustand's persist middleware writes the *entire* app state to
// localStorage on every single `set()` by default — for a quiz with many
// stages/questions that meant a full JSON.stringify of everything on every
// character typed, which is real, measurable typing lag. This wraps
// localStorage so writes are coalesced into one every 500ms, while still
// flushing immediately on tab-hide/unload so nothing is lost if the page
// closes mid-debounce. Reads stay synchronous and untouched.
function createDebouncedLocalStorage(delayMs = 500): StateStorage {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { name: string; value: string } | null = null;

  function flush() {
    if (typeof window === "undefined") return;
    if (pending) {
      window.localStorage.setItem(pending.name, pending.value);
      pending = null;
    }
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
  }

  return {
    getItem: (name) => (typeof window === "undefined" ? null : window.localStorage.getItem(name)),
    setItem: (name, value) => {
      if (typeof window === "undefined") return;
      pending = { name, value };
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, delayMs);
    },
    removeItem: (name) => {
      if (typeof window === "undefined") return;
      pending = null;
      if (timer) clearTimeout(timer);
      window.localStorage.removeItem(name);
    },
  };
}

// A single shared instance so the debounce timer/pending-write state
// actually persists across calls (createJSONStorage invokes this factory
// on every access, so it must not create a fresh closure each time).
const debouncedStorageEngine = createDebouncedLocalStorage(500);

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

// --- Legacy data migration -------------------------------------------------
// Versions before 2 stored every text field as a fixed { uz, ru, en } object.
// Version 2 switched to an ordered array of { language, content } variants
// that the presenter builds up freely. Version 3 brought the quiz-level
// `description` field into that same rich, multi-language model (it used to
// be a single plain string). This converts old persisted data on load so a
// quiz created before either change keeps working instead of crashing.

function isLegacyLocalizedText(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    ("uz" in value || "ru" in value || "en" in value)
  );
}

function migrateLocalizedText(value: unknown): LocalizedText {
  if (Array.isArray(value) && value.every((v) => v && typeof v === "object" && "language" in v)) {
    return value as LocalizedText;
  }
  if (isLegacyLocalizedText(value)) {
    const legacy = value as Record<string, string>;
    const variants = (["uz", "ru", "en"] as Language[])
      .filter((lang) => typeof legacy[lang] === "string" && legacy[lang].trim() !== "")
      .map((lang) => ({ language: lang, content: legacy[lang] }));
    return variants.length > 0 ? variants : [{ language: "uz" as Language, content: "" }];
  }
  return [{ language: "uz" as Language, content: "" }];
}

/** Plain string (pre-v3) -> a single-paragraph rich-text variant; already-migrated
 * arrays pass through untouched; anything else/empty collapses to undefined. */
function migrateQuizDescription(value: unknown): LocalizedText | undefined {
  if (Array.isArray(value)) return value.length > 0 ? migrateLocalizedText(value) : undefined;
  if (typeof value === "string" && value.trim() !== "") {
    return [{ language: "uz" as Language, content: `<p>${escapeHtml(value.trim())}</p>` }];
  }
  return undefined;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function migrateQuizzes(quizzes: unknown): Quiz[] {
  if (!Array.isArray(quizzes)) return [];
  return quizzes.map((rawQuiz) => {
    const q = rawQuiz as Record<string, unknown>;
    const stages = Array.isArray(q.stages) ? q.stages : [];
    return {
      ...(q as object),
      description: migrateQuizDescription(q.description),
      stages: stages.map((rawStage) => {
        const st = rawStage as Record<string, unknown>;
        const questions = Array.isArray(st.questions) ? st.questions : [];
        return {
          ...(st as object),
          name: migrateLocalizedText(st.name),
          description: migrateLocalizedText(st.description),
          questions: questions.map((rawQuestion) => {
            const que = rawQuestion as Record<string, unknown>;
            const answer = (que.answer ?? {}) as Record<string, unknown>;
            const migrated: Record<string, unknown> = {
              ...que,
              prompt: migrateLocalizedText(que.prompt),
              answer: {
                ...answer,
                correctText: migrateLocalizedText(answer.correctText),
                explanation:
                  answer.explanation !== undefined
                    ? migrateLocalizedText(answer.explanation)
                    : undefined,
              },
            };
            if (que.type === "multiple-choice" && Array.isArray(que.options)) {
              migrated.options = que.options.map((rawOpt) => {
                const opt = rawOpt as Record<string, unknown>;
                return { ...opt, text: migrateLocalizedText(opt.text) };
              });
            }
            if (que.type === "multi-image" && !que.revealStyle) {
              migrated.revealStyle = "all-at-once";
            }
            return migrated;
          }),
        };
      }),
    } as unknown as Quiz;
  });
}

export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      quizzes: [],
      media: [],

      createQuiz: (title, description) => {
        const quiz = createQuiz(title, description);
        set((s) => ({ quizzes: [...s.quizzes, quiz] }));
        return quiz.id;
      },

      installQuiz: (quiz) => set((s) => ({ quizzes: [...s.quizzes, quiz] })),

      deleteQuiz: (quizId) =>
        set((s) => ({ quizzes: s.quizzes.filter((q) => q.id !== quizId) })),

      duplicateQuiz: (quizId) => {
        const source = get().quizzes.find((q) => q.id === quizId);
        if (!source) return undefined;
        const now = Date.now();
        const cloned: Quiz = {
          ...JSON.parse(JSON.stringify(source)),
          id: uid(),
          title: `${source.title} (nusxa)`,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ quizzes: [...s.quizzes, cloned] }));
        return cloned.id;
      },

      updateQuiz: (quizId, patch) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) => (q.id === quizId ? touch({ ...q, ...patch }) : q)),
        })),

      getQuiz: (quizId) => get().quizzes.find((q) => q.id === quizId),

      addStage: (quizId) => {
        const quiz = get().quizzes.find((q) => q.id === quizId);
        const stage = createStage(quiz ? quiz.stages.length : 0);
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id === quizId ? touch({ ...q, stages: [...q.stages, stage] }) : q
          ),
        }));
        return stage.id;
      },

      updateStage: (quizId, stageId, patch) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id !== quizId
              ? q
              : touch({
                  ...q,
                  stages: q.stages.map((st) =>
                    st.id === stageId ? touch({ ...st, ...patch }) : st
                  ),
                })
          ),
        })),

      deleteStage: (quizId, stageId) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id !== quizId
              ? q
              : touch({ ...q, stages: q.stages.filter((st) => st.id !== stageId) })
          ),
        })),

      reorderStages: (quizId, fromIndex, toIndex) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id !== quizId
              ? q
              : touch({ ...q, stages: moveItem(q.stages, fromIndex, toIndex) })
          ),
        })),

      duplicateStage: (quizId, stageId) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) => {
            if (q.id !== quizId) return q;
            const source = q.stages.find((st) => st.id === stageId);
            if (!source) return q;
            const now = Date.now();
            const cloned: Stage = {
              ...JSON.parse(JSON.stringify(source)),
              id: uid(),
              questions: source.questions.map((que) => ({
                ...JSON.parse(JSON.stringify(que)),
                id: uid(),
              })),
              createdAt: now,
              updatedAt: now,
            };
            const idx = q.stages.findIndex((st) => st.id === stageId);
            const stages = q.stages.slice();
            stages.splice(idx + 1, 0, cloned);
            return touch({ ...q, stages });
          }),
        })),

      addQuestion: (quizId, stageId, type, prompt) => {
        const question = prompt ? { ...createQuestion(type), prompt } : createQuestion(type);
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id !== quizId
              ? q
              : touch({
                  ...q,
                  stages: q.stages.map((st) =>
                    st.id === stageId
                      ? touch({ ...st, questions: [...st.questions, question] })
                      : st
                  ),
                })
          ),
        }));
        return question.id;
      },

      updateQuestion: (quizId, stageId, questionId, patch) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id !== quizId
              ? q
              : touch({
                  ...q,
                  stages: q.stages.map((st) =>
                    st.id !== stageId
                      ? st
                      : touch({
                          ...st,
                          questions: st.questions.map((que) =>
                            que.id === questionId
                              ? touch({ ...que, ...patch } as unknown as Question)
                              : que
                          ),
                        })
                  ),
                })
          ),
        })),

      deleteQuestion: (quizId, stageId, questionId) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id !== quizId
              ? q
              : touch({
                  ...q,
                  stages: q.stages.map((st) =>
                    st.id !== stageId
                      ? st
                      : touch({
                          ...st,
                          questions: st.questions.filter((que) => que.id !== questionId),
                        })
                  ),
                })
          ),
        })),

      reorderQuestions: (quizId, stageId, fromIndex, toIndex) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id !== quizId
              ? q
              : touch({
                  ...q,
                  stages: q.stages.map((st) =>
                    st.id !== stageId
                      ? st
                      : touch({ ...st, questions: moveItem(st.questions, fromIndex, toIndex) })
                  ),
                })
          ),
        })),

      duplicateQuestion: (quizId, stageId, questionId) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) => {
            if (q.id !== quizId) return q;
            return touch({
              ...q,
              stages: q.stages.map((st) => {
                if (st.id !== stageId) return st;
                const idx = st.questions.findIndex((que) => que.id === questionId);
                if (idx === -1) return st;
                const now = Date.now();
                const cloned = {
                  ...JSON.parse(JSON.stringify(st.questions[idx])),
                  id: uid(),
                  createdAt: now,
                  updatedAt: now,
                };
                const questions = st.questions.slice();
                questions.splice(idx + 1, 0, cloned);
                return touch({ ...st, questions });
              }),
            });
          }),
        })),

      addMedia: (item) => set((s) => ({ media: [item, ...s.media] })),

      deleteMedia: (mediaId) =>
        set((s) => ({ media: s.media.filter((m) => m.id !== mediaId) })),

      updateMediaCaption: (mediaId, caption) =>
        set((s) => ({
          media: s.media.map((m) => (m.id === mediaId ? { ...m, caption } : m)),
        })),
    }),
    {
      name: "zakovat-store",
      storage: createJSONStorage(() => debouncedStorageEngine),
      version: 3,
      migrate: (persistedState, version) => {
        const state = persistedState as { quizzes?: unknown; media?: unknown } | undefined;
        if (!state) return state;
        if (version < 3) {
          return {
            ...state,
            quizzes: migrateQuizzes(state.quizzes),
          };
        }
        return state;
      },
    }
  )
);
