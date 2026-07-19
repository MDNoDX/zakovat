"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMediaUrl } from "@/lib/media";
import type { MultiImageQuestion, Language } from "@/types/quiz";
import { QuestionPrompt } from "@/components/present/QuestionPrompt";
import { cn } from "@/lib/utils";

export function MultiImageSlide({
  question,
  languages,
  revealCount,
}: {
  question: MultiImageQuestion;
  languages: Language[];
  /** How many images (in order) should currently be visible. */
  revealCount: number;
}) {
  const count = question.mediaIds.length;
  const sequential = question.revealStyle === "sequential" && count > 1;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-12 py-8">
      <QuestionPrompt prompt={question.prompt} languages={languages} size="medium" />
      <div className="h-[62vh] w-full max-w-5xl">
        <Collage mediaIds={question.mediaIds} count={count} revealCount={revealCount} />
      </div>
      {sequential && (
        <div className="flex items-center gap-1.5">
          {question.mediaIds.map((id, i) => (
            <span
              key={id}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i < revealCount ? "w-6 bg-accent" : "w-1.5 bg-white/15"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Collage({
  mediaIds,
  count,
  revealCount,
}: {
  mediaIds: string[];
  count: number;
  revealCount: number;
}) {
  if (count === 0) return null;

  if (count === 1) {
    return (
      <div className="h-full w-full overflow-hidden rounded-2xl">
        <Tile id={mediaIds[0]} revealed={revealCount > 0} />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid h-full w-full grid-cols-2 gap-2">
        {mediaIds.map((id, i) => (
          <div key={id} className="overflow-hidden rounded-2xl">
            <Tile id={id} revealed={i < revealCount} />
          </div>
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div
        className="grid h-full w-full gap-2"
        style={{
          gridTemplateColumns: "1.3fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gridTemplateAreas: `"a b" "a c"`,
        }}
      >
        <div style={{ gridArea: "a" }} className="overflow-hidden rounded-2xl">
          <Tile id={mediaIds[0]} revealed={0 < revealCount} />
        </div>
        <div style={{ gridArea: "b" }} className="overflow-hidden rounded-2xl">
          <Tile id={mediaIds[1]} revealed={1 < revealCount} />
        </div>
        <div style={{ gridArea: "c" }} className="overflow-hidden rounded-2xl">
          <Tile id={mediaIds[2]} revealed={2 < revealCount} />
        </div>
      </div>
    );
  }

  if (count === 4) {
    return (
      <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-2">
        {mediaIds.map((id, i) => (
          <div key={id} className="overflow-hidden rounded-2xl">
            <Tile id={id} revealed={i < revealCount} />
          </div>
        ))}
      </div>
    );
  }

  if (count <= 6) {
    return (
      <div className="grid h-full w-full grid-cols-3 grid-rows-2 gap-2">
        {mediaIds.map((id, i) => (
          <div key={id} className="overflow-hidden rounded-2xl">
            <Tile id={id} revealed={i < revealCount} />
          </div>
        ))}
      </div>
    );
  }

  // 7-9 images
  return (
    <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-2">
      {mediaIds.slice(0, 9).map((id, i) => (
        <div key={id} className="overflow-hidden rounded-2xl">
          <Tile id={id} revealed={i < revealCount} />
        </div>
      ))}
    </div>
  );
}

function Tile({ id, revealed }: { id: string; revealed: boolean }) {
  const url = useMediaUrl(id);
  return (
    <div className="relative h-full w-full bg-surface-2">
      <AnimatePresence>
        {revealed && url && (
          <motion.img
            key="img"
            src={url}
            alt=""
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
