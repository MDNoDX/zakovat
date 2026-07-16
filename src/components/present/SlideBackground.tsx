"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMediaUrl } from "@/lib/media";

/**
 * Optional full-bleed background photo behind a question/answer slide.
 * Kept as its own component so the media-url hook always runs
 * unconditionally, while the parent only mounts it when relevant.
 */
export function SlideBackground({ mediaId }: { mediaId: string | null | undefined }) {
  const url = useMediaUrl(mediaId);

  return (
    <AnimatePresence>
      {url && (
        <motion.div
          key={mediaId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 z-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/40" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
