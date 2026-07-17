import type { Question, Quiz, Stage } from "@/types/quiz";

export type Slide =
  | { kind: "stage-intro"; stage: Stage }
  | { kind: "question"; stage: Stage; question: Question; indexInStage: number; total: number }
  // Shown only in "end-of-stage" (bulk reveal) mode: re-displays the full
  // question immediately before its answer, once all questions have already
  // been asked, so the audience is reminded what was asked before the
  // correct answer appears.
  | { kind: "recap"; stage: Stage; question: Question; indexInStage: number; total: number }
  | { kind: "answer"; stage: Stage; question: Question; indexInStage: number; total: number }
  | { kind: "stage-end"; stage: Stage };

export function buildSlides(quiz: Quiz): Slide[] {
  const slides: Slide[] = [];

  for (const stage of quiz.stages) {
    slides.push({ kind: "stage-intro", stage });

    if (stage.revealMode === "end-of-stage") {
      stage.questions.forEach((question, i) => {
        slides.push({
          kind: "question",
          stage,
          question,
          indexInStage: i,
          total: stage.questions.length,
        });
      });
      if (stage.questions.length > 0) {
        slides.push({ kind: "stage-end", stage });
      }
      stage.questions.forEach((question, i) => {
        slides.push({
          kind: "recap",
          stage,
          question,
          indexInStage: i,
          total: stage.questions.length,
        });
        slides.push({
          kind: "answer",
          stage,
          question,
          indexInStage: i,
          total: stage.questions.length,
        });
      });
    } else {
      // after-each & manual share the same physical slide order;
      // manual mode differs only in how navigation skips the answer slides.
      stage.questions.forEach((question, i) => {
        slides.push({
          kind: "question",
          stage,
          question,
          indexInStage: i,
          total: stage.questions.length,
        });
        slides.push({
          kind: "answer",
          stage,
          question,
          indexInStage: i,
          total: stage.questions.length,
        });
      });
    }
  }

  return slides;
}

export function isManualSkippable(slide: Slide, revealed: Set<string>): boolean {
  if (slide.kind !== "answer") return false;
  if (slide.stage.revealMode !== "manual") return false;
  return !revealed.has(slide.question.id);
}
