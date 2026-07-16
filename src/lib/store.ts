"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createQuestion, createQuiz, createStage } from "@/lib/factories";
import { uid } from "@/lib/utils";
import type {
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
  createQuiz: (title: string) => string;
  deleteQuiz: (quizId: string) => void;
  duplicateQuiz: (quizId: string) => string | undefined;
  updateQuizTitle: (quizId: string, title: string) => void;
  getQuiz: (quizId: string) => Quiz | undefined;

  // Stage-level
  addStage: (quizId: string) => string;
  updateStage: (quizId: string, stageId: string, patch: Partial<Stage>) => void;
  deleteStage: (quizId: string, stageId: string) => void;
  reorderStages: (quizId: string, fromIndex: number, toIndex: number) => void;
  duplicateStage: (quizId: string, stageId: string) => void;

  // Question-level
  addQuestion: (quizId: string, stageId: string, type: QuestionType) => string;
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
}

function touch<T extends { updatedAt: number }>(obj: T): T {
  return { ...obj, updatedAt: Date.now() };
}

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      quizzes: [],
      media: [],

      createQuiz: (title) => {
        const quiz = createQuiz(title);
        set((s) => ({ quizzes: [...s.quizzes, quiz] }));
        return quiz.id;
      },

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

      updateQuizTitle: (quizId, title) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id === quizId ? touch({ ...q, title }) : q
          ),
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

      addQuestion: (quizId, stageId, type) => {
        const question = createQuestion(type);
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
    }),
    {
      name: "zakovat-store",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
