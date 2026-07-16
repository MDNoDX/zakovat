"use client";

import { Music, Video } from "lucide-react";
import { useMediaUrl } from "@/lib/media";
import type { MediaItem } from "@/types/quiz";
import { cn } from "@/lib/utils";

export function MediaThumb({ item, className }: { item: MediaItem; className?: string }) {
  const url = useMediaUrl(item.id);

  if (item.kind === "audio") {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-surface-2 text-muted-foreground",
          className
        )}
      >
        <Music className="h-6 w-6" />
      </div>
    );
  }

  if (item.kind === "video") {
    return (
      <div className={cn("relative overflow-hidden bg-black", className)}>
        {url ? (
          <video src={url} className="h-full w-full object-cover" muted />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Video className="h-6 w-6" />
          </div>
        )}
        <Video className="absolute bottom-1 right-1 h-4 w-4 text-white drop-shadow" />
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden bg-surface-2", className)}>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={item.name} className="h-full w-full object-cover" />
      )}
    </div>
  );
}
