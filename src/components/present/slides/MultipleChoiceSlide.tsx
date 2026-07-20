"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import type { MultipleChoiceQuestion, Language } from "@/types/quiz";
import { QuestionPrompt } from "@/components/present/QuestionPrompt";
import { MultiLangText } from "@/components/present/MultiLangText";
import { useMediaUrl } from "@/lib/media";
import { useQuizStore } from "@/lib/store";
import { MediaCaption, useMediaCaption } from "@/components/present/MediaCaption";
import { EmbeddableVideo } from "@/components/present/EmbeddableVideo";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function MultipleChoiceSlide({
  question,
  languages,
  revealed,
}: {
  question: MultipleChoiceQuestion;
  languages: Language[];
  revealed?: boolean;
}) {
  const url = useMediaUrl(question.mediaId);
  const mediaKind = useQuizStore((s) => s.media.find((m) => m.id === question.mediaId)?.kind);
  const caption = useMediaCaption(question.mediaId);
  const isCover = question.displaySize === "cover" && (mediaKind === "image" || mediaKind === "video");

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 px-16">
      <QuestionPrompt prompt={question.prompt} languages={languages} size={question.promptSize ?? "medium"} />
      {url && mediaKind === "audio" && (
        <audio key={question.mediaId} src={url} controls className="w-full max-w-md" />
      )}
      {mediaKind === "video" && (
        <EmbeddableVideo
          mediaId={question.mediaId}
          className={cn(
            "aspect-video rounded-2xl border border-white/10 bg-black shadow-soft",
            isCover ? "h-[38vh] w-full max-w-4xl object-cover" : "max-h-[35vh] w-full max-w-3xl"
          )}
        />
      )}
      {url && mediaKind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className={cn(
            "rounded-2xl border border-white/10",
            isCover ? "h-[38vh] w-full max-w-4xl object-cover" : "max-h-[35vh] max-w-[60vw] object-contain"
          )}
        />
      )}
      {url && (mediaKind === "image" || mediaKind === "video") && <MediaCaption text={caption} />}
      <div className="grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
        {question.options.map((opt, i) => {
          const isCorrect = revealed && question.correctOptionId === opt.id;
          return (
            <div
              key={opt.id}
              className={cn(
                "relative flex items-center gap-4 overflow-hidden rounded-2xl border px-6 py-6 text-left transition-all duration-500",
                isCorrect
                  ? "border-emerald-400/60 bg-emerald-400/10 shadow-[0_0_40px_-8px_rgba(52,211,153,0.5)]"
                  : "border-white/10 bg-white/5"
              )}
            >
              <AnimatePresence>
                {isCorrect && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-transparent to-transparent"
                  />
                )}
              </AnimatePresence>
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold transition-all duration-300",
                  isCorrect ? "bg-emerald-400 text-black" : "bg-white/10 text-foreground/80"
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isCorrect ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <Check className="h-5 w-5" />
                    </motion.span>
                  ) : (
                    <motion.span key="letter">{LETTERS[i]}</motion.span>
                  )}
                </AnimatePresence>
              </span>
              <MultiLangText
                text={opt.text}
                languages={languages}
                size="medium"
                layout="joined"
                weight="font-semibold"
                className="flex-1"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
