import { uid } from "@/lib/utils";
import {
  emptyLocalizedText,
  isLocalizedTextEmpty,
  type LocalizedText,
  type Question,
  type QuestionType,
  type Quiz,
  type Stage,
} from "@/types/quiz";

export function createEmptyAnswer() {
  return {
    correctText: emptyLocalizedText(),
    explanation: emptyLocalizedText(),
    mediaId: null,
  };
}

export function createQuestion(type: QuestionType): Question {
  const now = Date.now();
  const base = {
    id: uid(),
    prompt: emptyLocalizedText(),
    timerSeconds: 30 as const,
    answer: createEmptyAnswer(),
    backgroundImageId: null,
    createdAt: now,
    updatedAt: now,
  };

  switch (type) {
    case "text":
      return { ...base, type: "text" };
    case "multiple-choice":
      return {
        ...base,
        type: "multiple-choice",
        options: [
          { id: uid(), text: emptyLocalizedText() },
          { id: uid(), text: emptyLocalizedText() },
          { id: uid(), text: emptyLocalizedText() },
          { id: uid(), text: emptyLocalizedText() },
        ],
        correctOptionId: null,
      };
    case "image":
      return { ...base, type: "image", mediaId: null };
    case "multi-image":
      return { ...base, type: "multi-image", mediaIds: [], revealStyle: "all-at-once" };
    case "music":
      return { ...base, type: "music", mediaId: null };
    case "video":
      return { ...base, type: "video", mediaId: null };
  }
}

export function createStage(index: number): Stage {
  const now = Date.now();
  return {
    id: uid(),
    name: [{ language: "uz", content: `${index + 1}-bosqich` }],
    description: emptyLocalizedText(),
    revealMode: "after-each",
    questions: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createQuiz(title: string, description?: LocalizedText): Quiz {
  const now = Date.now();
  return {
    id: uid(),
    title: title || "Nomsiz Zakovat",
    description: description && !isLocalizedTextEmpty(description) ? description : undefined,
    stages: [],
    defaultLanguage: "uz",
    createdAt: now,
    updatedAt: now,
  };
}
