"use client";

import { useQuizStore } from "@/lib/store";
import { useMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

/**
 * Drop-in replacement for a plain `<video>` tag anywhere a question/answer
 * plays a video media item: transparently renders a YouTube iframe instead
 * of a native player when the item is an embedded YouTube source (no blob
 * exists for those — see MediaItem.externalEmbed), otherwise behaves like
 * a normal `<video src=... controls>`.
 */
export function EmbeddableVideo({
  mediaId,
  className,
  controls = true,
}: {
  mediaId: string | null | undefined;
  className?: string;
  controls?: boolean;
}) {
  const item = useQuizStore((s) => s.media.find((m) => m.id === mediaId));
  const url = useMediaUrl(mediaId);

  if (item?.externalEmbed?.provider === "youtube") {
    const { videoId } = item.externalEmbed;
    return (
      <iframe
        key={mediaId}
        className={cn("border-0", className)}
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={item.name || "YouTube video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (!url) return null;
  return <video key={mediaId} src={url} controls={controls} className={className} />;
}
