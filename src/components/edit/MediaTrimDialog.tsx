"use client";

import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuizStore } from "@/lib/store";
import { Crop, Music } from "lucide-react";
import { useMediaUrl, saveMediaBlob } from "@/lib/media";
import { isTrimSupported, trimMedia } from "@/lib/media-trim";
import { cropMedia, isCropSupported, type CropRect } from "@/lib/media-crop";
import { uid, cn } from "@/lib/utils";
import type { MediaItem } from "@/types/quiz";
import { useT } from "@/lib/i18n";
import { TrimScrubber } from "@/components/edit/TrimScrubber";
import { CropOverlay } from "@/components/edit/CropOverlay";
import { pauseOthersAndTrack, untrack } from "@/lib/media-preview-coordinator";

const FULL_RECT: CropRect = { x: 0, y: 0, width: 1, height: 1 };

function isRectCropped(rect: CropRect): boolean {
  return (
    Math.abs(rect.x) > 0.001 ||
    Math.abs(rect.y) > 0.001 ||
    Math.abs(rect.width - 1) > 0.001 ||
    Math.abs(rect.height - 1) > 0.001
  );
}

export function MediaTrimDialog({
  item,
  open,
  onOpenChange,
  onSaved,
  forceAudioOnly,
}: {
  item: MediaItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the newly-created trimmed clip right after it's saved to the
   * library, so the caller can apply it directly to whatever field is
   * currently being edited instead of leaving the user to hunt for the
   * "(trim)" copy and re-select it by hand. */
  onSaved?: (item: MediaItem) => void;
  /** The calling field only accepts audio (e.g. a music question's clip) —
   * "extract audio only" is locked on instead of being an optional checkbox. */
  forceAudioOnly?: boolean;
}) {
  const url = useMediaUrl(item?.id);
  const addMedia = useQuizStore((s) => s.addMedia);
  const t = useT();
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [audioOnly, setAudioOnly] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(false);
  // Crop is opt-in for video (a toggle over the existing trim scrubber) but
  // the *only* thing on offer for images, which have no time dimension.
  const [cropRect, setCropRect] = useState<CropRect>(FULL_RECT);
  const [cropOpen, setCropOpen] = useState(false);
  const isImage = item?.kind === "image";
  const cropUiActive = isImage || cropOpen;
  const supported = isImage ? isCropSupported() : isTrimSupported();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setStart(0);
    setEnd(0);
    setDuration(0);
    setAudioOnly(!!forceAudioOnly);
    setError(false);
    setProcessing(false);
    setCropRect(FULL_RECT);
    setCropOpen(false);
  }, [item?.id, open, forceAudioOnly]);

  if (!item) return null;

  function handleLoadedMetadata(e: SyntheticEvent<HTMLVideoElement | HTMLAudioElement>) {
    const d = e.currentTarget.duration || 0;
    setDuration(d);
    setEnd(d);
  }

  // Preview playback stays inside the selected range: starting playback
  // before `start` jumps forward to it, and reaching `end` pauses — so
  // scrubbing the handles and hitting play always previews exactly what
  // will be saved, like a mobile audio/video trimmer.
  function handlePreviewTimeUpdate(e: SyntheticEvent<HTMLVideoElement | HTMLAudioElement>) {
    const el = e.currentTarget;
    if (el.currentTime < start) el.currentTime = start;
    if (el.currentTime >= end) el.pause();
  }

  function handlePreviewPlay(e: SyntheticEvent<HTMLVideoElement | HTMLAudioElement>) {
    const el = e.currentTarget;
    if (el.currentTime < start || el.currentTime >= end) el.currentTime = start;
    pauseOthersAndTrack(el);
  }

  function handlePreviewStopped(e: SyntheticEvent<HTMLVideoElement | HTMLAudioElement>) {
    untrack(e.currentTarget);
  }

  // Dragging a handle should feel like scrubbing a real trimmer: the
  // preview jumps live to wherever the handle currently is (paused, so it
  // doesn't keep running past what you're looking at) — not just update a
  // number that you only see reflected once you separately press play.
  function handleScrubberChange(s: number, e: number, which: "start" | "end") {
    setStart(s);
    setEnd(e);
    const el = item?.kind === "video" ? videoRef.current : audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = which === "start" ? s : e;
    }
  }

  async function handleSave() {
    if (!url || !item) return;
    setProcessing(true);
    setError(false);
    try {
      const cropped = isRectCropped(cropRect);
      let blob: Blob;
      let suffix: string;
      if (item.kind === "image") {
        blob = await cropMedia(url, "image", cropRect);
        suffix = "crop";
      } else if (item.kind === "video" && cropped && !audioOnly) {
        // One combined export instead of two separate passes when both a
        // crop and a trim range are set.
        blob = await cropMedia(url, "video", cropRect, { start, end });
        suffix = "crop";
      } else {
        blob = await trimMedia(url, item.kind === "video" ? "video" : "audio", {
          start,
          end,
          audioOnly,
        });
        suffix = "trim";
      }
      const id = uid();
      await saveMediaBlob(id, blob);
      const kind = item.kind === "image" ? "image" : audioOnly || item.kind === "audio" ? "audio" : "video";
      const newItem: MediaItem = {
        id,
        kind,
        name: `${item.name} (${suffix})`,
        mimeType: blob.type,
        size: blob.size,
        createdAt: Date.now(),
      };
      addMedia(newItem);
      onSaved?.(newItem);
      onOpenChange(false);
    } catch {
      setError(true);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("trimMediaTitle")}</DialogTitle>
          <DialogDescription>{t("trimMediaDescription")}</DialogDescription>
        </DialogHeader>

        {!supported ? (
          <p className="rounded-xl border border-dashed border-border bg-surface-2 p-4 text-xs text-muted-foreground">
            {t("trimUnsupported")}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {url && item.kind === "video" && (
              <div className="relative overflow-hidden rounded-xl border border-border bg-black">
                <video
                  ref={videoRef}
                  src={url}
                  controls={!cropOpen}
                  className="w-full"
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handlePreviewTimeUpdate}
                  onPlay={handlePreviewPlay}
                  onPause={handlePreviewStopped}
                  onEnded={handlePreviewStopped}
                />
                {cropOpen && <CropOverlay value={cropRect} onChange={setCropRect} />}
              </div>
            )}
            {url && item.kind === "image" && (
              <div className="relative overflow-hidden rounded-xl border border-border bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="block w-full" />
                <CropOverlay value={cropRect} onChange={setCropRect} />
              </div>
            )}
            {url && item.kind === "audio" && (
              <audio
                ref={audioRef}
                src={url}
                controls
                className="w-full"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handlePreviewTimeUpdate}
                onPlay={handlePreviewPlay}
                onPause={handlePreviewStopped}
                onEnded={handlePreviewStopped}
              />
            )}

            {cropUiActive && (
              <p className="text-center text-[11px] text-muted-foreground">{t("cropHint")}</p>
            )}

            {item.kind !== "image" && (
              <TrimScrubber
                url={url}
                duration={duration}
                start={start}
                end={end}
                onChange={handleScrubberChange}
              />
            )}

            {item.kind === "video" && forceAudioOnly && (
              <p className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-foreground/80">
                <Music className="h-3.5 w-3.5 shrink-0 text-accent" />
                {t("audioOnlyForcedHint")}
              </p>
            )}
            {item.kind === "video" && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {!forceAudioOnly && (
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={audioOnly}
                      onChange={(e) => {
                        setAudioOnly(e.target.checked);
                        if (e.target.checked) setCropOpen(false);
                      }}
                      className="accent-accent"
                    />
                    {t("extractAudioOnly")}
                  </label>
                )}
                {!audioOnly && (
                  <button
                    type="button"
                    onClick={() => setCropOpen((v) => !v)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                      cropOpen
                        ? "border-accent/60 bg-accent/10 text-foreground"
                        : "border-border bg-surface-2 text-muted-foreground hover:bg-foreground/5"
                    )}
                  >
                    <Crop className="h-3.5 w-3.5" />
                    {t("cropToggleLabel")}
                  </button>
                )}
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {t("trimFailed")}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          {supported && (
            <Button
              disabled={
                processing || (item.kind !== "image" && (!(end > start) || duration === 0))
              }
              onClick={handleSave}
            >
              {processing ? t("processingTrim") : t("saveTrimAsNew")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
