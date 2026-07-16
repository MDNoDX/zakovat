"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";
import type { Quiz, Language } from "@/types/quiz";
import { buildSlides, isManualSkippable, type Slide } from "@/lib/slides";
import { useFullscreen } from "@/lib/use-fullscreen";
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

export function PresentationShell({ quiz }: { quiz: Quiz }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle } = useFullscreen(shellRef);

  const slides = useMemo(() => buildSlides(quiz), [quiz]);
  const [index, setIndex] = useState(0);
  const [language, setLanguage] = useState<Language>(quiz.defaultLanguage);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [controlsVisible, setControlsVisible] = useState(true);
  // How many collage images are currently visible on a "sequential" multi-image
  // slide. Resets to 1 whenever the slide changes.
  const [imageRevealStep, setImageRevealStep] = useState(1);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slide = slides[index];

  useEffect(() => {
    setImageRevealStep(1);
  }, [index]);

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

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      showControls();
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.code === "Space") {
        e.preventDefault();
        reveal();
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
        <p className="text-muted-foreground">Ushbu zakovatda hali savollar yo&apos;q.</p>
        <Link href={`/edit/${quiz.id}`} className="text-accent hover:underline">
          Tahrirlashga qaytish
        </Link>
      </div>
    );
  }

  const stageName =
    slide.stage.name[language] || slide.stage.name.uz || slide.stage.name.ru || slide.stage.name.en;

  const questionMeta =
    slide.kind === "question" || slide.kind === "answer"
      ? `${slide.indexInStage + 1} / ${slide.total}`
      : null;

  const timerSeconds =
    slide.kind === "question" ? slide.question.timerSeconds : null;

  const backgroundImageId =
    slide.kind === "question" || slide.kind === "answer"
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
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-white/40">
              {stageName}
            </span>
            <div className="flex items-center gap-4">
              {questionMeta && (
                <span className="text-sm font-medium tabular-nums text-white/40">
                  {questionMeta}
                </span>
              )}
              <Link
                href={`/edit/${quiz.id}`}
                className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white"
                title="Tahrirlashga qaytish"
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
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-10"
          >
            <SlideRenderer slide={slide} language={language} imageRevealStep={imageRevealStep} />
          </motion.div>
        </AnimatePresence>
      </div>

      <PresenterControls
        visible={controlsVisible}
        current={index}
        total={slides.length}
        language={language}
        onLanguageChange={setLanguage}
        onPrev={goPrev}
        onNext={goNext}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggle}
      />
    </div>
  );
}

function SlideRenderer({
  slide,
  language,
  imageRevealStep,
}: {
  slide: Slide;
  language: Language;
  imageRevealStep: number;
}) {
  switch (slide.kind) {
    case "stage-intro":
      return <StageIntroSlide stage={slide.stage} language={language} />;
    case "stage-end":
      return <StageEndSlide />;
    case "answer":
      return (
        <AnswerSlide question={slide.question} language={language} indexInStage={slide.indexInStage} />
      );
    case "question": {
      const { question } = slide;
      switch (question.type) {
        case "text":
          return <TextQuestionSlide question={question} language={language} />;
        case "multiple-choice":
          return <MultipleChoiceSlide question={question} language={language} />;
        case "image":
          return <ImageQuestionSlide question={question} language={language} />;
        case "multi-image":
          return (
            <MultiImageSlide
              question={question}
              language={language}
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
          return <VideoQuestionSlide question={question} language={language} />;
      }
    }
  }
}
