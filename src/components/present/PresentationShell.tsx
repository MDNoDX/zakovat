"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";
import { resolveText, type Quiz, type Language } from "@/types/quiz";
import { buildSlides, isManualSkippable, type Slide } from "@/lib/slides";
import { useFullscreen } from "@/lib/use-fullscreen";
import { useSound } from "@/lib/use-sound";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { CountdownTimer } from "@/components/present/CountdownTimer";
import { PresenterControls } from "@/components/present/PresenterControls";
import { SlideBackground } from "@/components/present/SlideBackground";
import { StageIntroSlide } from "@/components/present/slides/StageIntroSlide";
import { StageEndSlide } from "@/components/present/slides/StageEndSlide";
import { TextQuestionSlide } from "@/components/present/slides/TextQuestionSlide";
import { MultipleChoiceSlide } from "@/components/present/slides/MultipleChoiceSlide";
import { ImageQuestionSlide } from "@/components/present/slides/ImageQuestionSlide";
import { MultiImageSlide } from "@/components/present/slides/MultiImageSlide";
import { MusicQuestionSlide } from "@/components/present/slides/MusicQuestionSlide";
import { VideoQuestionSlide } from "@/components/present/slides/VideoQuestionSlide";
import { AnswerSlide } from "@/components/present/slides/AnswerSlide";
import { tFor } from "@/lib/i18n";

export function PresentationShell({ quiz }: { quiz: Quiz }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle } = useFullscreen(shellRef);

  const slides = useMemo(() => buildSlides(quiz), [quiz]);
  const [index, setIndex] = useState(0);
  // Which language(s) the moderator wants shown right now — any combination,
  // changeable at any time with no reload. A question written in only one
  // language always still shows (see MultiLangText's fallback), so this
  // never produces a blank slide.
  const [visibleLanguages, setVisibleLanguages] = useState<Language[]>([quiz.defaultLanguage]);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  // How many collage images are currently visible on a "sequential" multi-image
  // slide. Resets to 1 whenever the slide changes.
  const [imageRevealStep, setImageRevealStep] = useState(1);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sound = useSound();
  const isFirstSlideRender = useRef(true);
  const reducedMotion = usePrefersReducedMotion();

  const slide = slides[index];
  const primaryLanguage = visibleLanguages[0] ?? quiz.defaultLanguage;

  useEffect(() => {
    setImageRevealStep(1);
    setShowExplanation(false);
  }, [index]);

  // Play a short transition tone whenever the slide changes — a distinct
  // one for stage intros vs. answer reveals vs. ordinary question slides.
  // Skipped on first mount since nothing actually "transitioned" yet.
  useEffect(() => {
    if (isFirstSlideRender.current) {
      isFirstSlideRender.current = false;
      return;
    }
    if (!slide) return;
    if (slide.kind === "stage-intro") sound.playStage();
    else if (slide.kind === "answer") sound.playReveal();
    else sound.playSlide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const toggleLanguage = useCallback((lang: Language) => {
    setVisibleLanguages((prev) => {
      if (prev.includes(lang)) {
        const next = prev.filter((l) => l !== lang);
        return next.length > 0 ? next : prev; // never allow an empty selection
      }
      return [...prev, lang];
    });
  }, []);

  function sequentialImagesRemaining(target: Slide | undefined, step: number) {
    if (!target || target.kind !== "question" || target.question.type !== "multi-image") {
      return null;
    }
    if (target.question.revealStyle !== "sequential") return null;
    const total = target.question.mediaIds.length;
    return step < total ? total : null;
  }

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    showControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [showControls]);

  const goNext = useCallback(() => {
    const current = slides[index];
    if (sequentialImagesRemaining(current, imageRevealStep) !== null) {
      setImageRevealStep((s) => s + 1);
      return;
    }
    setIndex((i) => {
      let next = i + 1;
      while (next < slides.length && isManualSkippable(slides[next], revealed)) next++;
      return next < slides.length ? next : i;
    });
  }, [slides, revealed, index, imageRevealStep]);

  const goPrev = useCallback(() => {
    const current = slides[index];
    if (
      current?.kind === "question" &&
      current.question.type === "multi-image" &&
      current.question.revealStyle === "sequential" &&
      imageRevealStep > 1
    ) {
      setImageRevealStep((s) => s - 1);
      return;
    }
    setIndex((i) => {
      let prev = i - 1;
      while (prev >= 0 && isManualSkippable(slides[prev], revealed)) prev--;
      return prev >= 0 ? prev : i;
    });
  }, [slides, revealed, index, imageRevealStep]);

  const reveal = useCallback(() => {
    const current = slides[index];
    if (!current) return;
    if (sequentialImagesRemaining(current, imageRevealStep) !== null) {
      setImageRevealStep((s) => s + 1);
      return;
    }
    if (current.kind === "question" && current.stage.revealMode === "manual") {
      setRevealed((r) => new Set(r).add(current.question.id));
      setIndex((i) => Math.min(i + 1, slides.length - 1));
    } else {
      goNext();
    }
  }, [slides, index, goNext, imageRevealStep]);

  const jumpToQuestionInStage = useCallback(
    (n: number) => {
      const current = slides[index];
      if (!current) return;
      const target = slides.findIndex(
        (s) => s.stage.id === current.stage.id && s.kind === "question" && s.indexInStage === n - 1
      );
      if (target >= 0) setIndex(target);
    },
    [slides, index]
  );

  // Presenter-controlled "review the questions again" pass for end-of-stage
  // (bulk reveal) stages: from the stage-end slide, jump back to the first
  // question and let the presenter step through Q1..Qn once more at their
  // own pace (using the normal prev/next controls) before moving on to
  // reveal answers. jumpBackToStageEnd is the matching way back.
  const jumpToFirstQuestion = useCallback(() => {
    const current = slides[index];
    if (!current) return;
    const target = slides.findIndex((s) => s.stage.id === current.stage.id && s.kind === "question");
    if (target >= 0) setIndex(target);
  }, [slides, index]);

  const jumpBackToStageEnd = useCallback(() => {
    const current = slides[index];
    if (!current) return;
    const target = slides.findIndex((s) => s.stage.id === current.stage.id && s.kind === "stage-end");
    if (target >= 0) setIndex(target);
  }, [slides, index]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      showControls();
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        reveal();
      } else if (e.key.toLowerCase() === "e") {
        setShowExplanation((v) => !v);
      } else if (e.key.toLowerCase() === "r") {
        goPrev();
      } else if (e.key.toLowerCase() === "f") {
        toggle();
      } else if (e.key === "Escape") {
        if (document.fullscreenElement) document.exitFullscreen();
      } else if (/^[1-9]$/.test(e.key)) {
        jumpToQuestionInStage(parseInt(e.key, 10));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, reveal, toggle, jumpToQuestionInStage, showControls]);

  if (!slide) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <p className="text-muted-foreground">{tFor("noQuestionsYet", primaryLanguage)}</p>
        <Link href={`/edit/${quiz.id}`} className="text-accent hover:underline">
          {tFor("backToEditing", primaryLanguage)}
        </Link>
      </div>
    );
  }

  const stageName = resolveText(slide.stage.name, primaryLanguage);

  const questionMeta =
    slide.kind === "question" || slide.kind === "answer" || slide.kind === "recap"
      ? `${slide.indexInStage + 1} / ${slide.total}`
      : null;

  const timerSeconds =
    slide.kind === "question" ? slide.question.timerSeconds : null;

  const backgroundImageId =
    slide.kind === "question" || slide.kind === "answer" || slide.kind === "recap"
      ? slide.question.backgroundImageId
      : null;

  return (
    <div
      ref={shellRef}
      onMouseMove={showControls}
      className="relative flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground"
    >
      {/* Top bar */}
      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-8 py-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-white/40">
                {stageName}
              </span>
              {slide.kind === "recap" && (
                <span className="rounded-full bg-accent/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  {tFor("recapLabel", primaryLanguage)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {questionMeta && (
                <span className="text-sm font-medium tabular-nums text-white/40">
                  {questionMeta}
                </span>
              )}
              <Link
                href={`/edit/${quiz.id}`}
                className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white"
                title={tFor("backToEditing", primaryLanguage)}
              >
                <X className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer overlay */}
      {timerSeconds && (
        <div className="absolute right-8 top-20 z-30">
          <CountdownTimer seconds={timerSeconds} resetKey={slide.kind === "question" ? slide.question.id : index.toString()} />
        </div>
      )}

      {/* Slide content */}
      <div className="relative flex-1">
        <SlideBackground mediaId={backgroundImageId} />
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.01 }}
            transition={{ duration: reducedMotion ? 0.05 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-10"
          >
            <SlideRenderer
              slide={slide}
              languages={visibleLanguages}
              imageRevealStep={imageRevealStep}
              showExplanation={showExplanation}
              onReviewQuestions={jumpToFirstQuestion}
              onBackToAnswers={jumpBackToStageEnd}
              onShowAnswer={goNext}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <PresenterControls
        visible={controlsVisible}
        current={index}
        total={slides.length}
        visibleLanguages={visibleLanguages}
        onToggleLanguage={toggleLanguage}
        onPrev={goPrev}
        onNext={goNext}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggle}
        soundEnabled={sound.enabled}
        onToggleSound={sound.toggle}
      />
    </div>
  );
}

function SlideRenderer({
  slide,
  languages,
  imageRevealStep,
  showExplanation,
  onReviewQuestions,
  onBackToAnswers,
  onShowAnswer,
}: {
  slide: Slide;
  languages: Language[];
  imageRevealStep: number;
  showExplanation: boolean;
  /** Jumps from the stage-end slide back to Q1 for a presenter-paced re-review. */
  onReviewQuestions: () => void;
  /** Jumps from a question/recap slide straight back to the stage-end slide. */
  onBackToAnswers: () => void;
  /** Advances from a recap slide into its answer. */
  onShowAnswer: () => void;
}) {
  const primaryLanguage = languages[0] ?? "uz";
  switch (slide.kind) {
    case "stage-intro":
      return <StageIntroSlide stage={slide.stage} languages={languages} />;
    case "stage-end":
      return <StageEndSlide language={primaryLanguage} onReviewQuestions={onReviewQuestions} />;
    case "answer":
      return (
        <AnswerSlide
          question={slide.question}
          languages={languages}
          indexInStage={slide.indexInStage}
          showExplanation={showExplanation}
        />
      );
    case "question": {
      const { question } = slide;
      const body = (() => {
        switch (question.type) {
          case "text":
            return <TextQuestionSlide question={question} languages={languages} />;
          case "multiple-choice":
            return <MultipleChoiceSlide question={question} languages={languages} />;
          case "image":
            return <ImageQuestionSlide question={question} languages={languages} />;
          case "multi-image":
            return (
              <MultiImageSlide
                question={question}
                languages={languages}
                revealCount={
                  question.revealStyle === "sequential"
                    ? imageRevealStep
                    : question.mediaIds.length
                }
              />
            );
          case "music":
            return <MusicQuestionSlide question={question} />;
          case "video":
            return <VideoQuestionSlide question={question} languages={languages} />;
        }
      })();
      // Only end-of-stage stages ever have a stage-end slide to jump back
      // to, so the shortcut only makes sense there — it lets a presenter
      // who used "review questions again" hop straight back to the answers
      // instead of clicking Next through every question a second time.
      if (slide.stage.revealMode === "end-of-stage") {
        return (
          <div className="relative h-full w-full">
            {body}
            <button
              onClick={onBackToAnswers}
              className="absolute bottom-8 right-8 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs font-medium text-white/70 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
            >
              {tFor("backToAnswers", primaryLanguage)}
            </button>
          </div>
        );
      }
      return body;
    }
    // Recap: the same question body as above, but always fully revealed
    // (no partial collage reveal, no re-running timer) — this is a reminder
    // shown right before the answer in bulk-reveal mode, not a re-ask. The
    // presenter gets an explicit on-screen control to move into the answer
    // rather than relying only on the generic next-slide arrow.
    case "recap": {
      const { question } = slide;
      const body = (() => {
        switch (question.type) {
          case "text":
            return <TextQuestionSlide question={question} languages={languages} />;
          case "multiple-choice":
            return <MultipleChoiceSlide question={question} languages={languages} />;
          case "image":
            return <ImageQuestionSlide question={question} languages={languages} />;
          case "multi-image":
            return (
              <MultiImageSlide
                question={question}
                languages={languages}
                revealCount={question.mediaIds.length}
              />
            );
          case "music":
            return <MusicQuestionSlide question={question} />;
          case "video":
            return <VideoQuestionSlide question={question} languages={languages} />;
        }
      })();
      return (
        <div className="relative h-full w-full">
          {body}
          <button
            onClick={onShowAnswer}
            className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-105 active:scale-95"
          >
            {tFor("showAnswerCta", primaryLanguage)}
          </button>
        </div>
      );
    }
  }
}
