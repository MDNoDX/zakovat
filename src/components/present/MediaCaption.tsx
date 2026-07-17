"use client";

import { useQuizStore } from "@/lib/store";

/** Looks up the optional caption stored on a media library item. */
export function useMediaCaption(mediaId: string | null | undefined): string | undefined {
  return useQuizStore((s) => (mediaId ? s.media.find((m) => m.id === mediaId)?.caption : undefined));
}

/** Small caption line shown under an image/video/audio clip during presentation. */
export function MediaCaption({ text }: { text: string | undefined }) {
  if (!text) return null;
  return <p className="max-w-2xl text-center text-sm text-muted-foreground">{text}</p>;
}
