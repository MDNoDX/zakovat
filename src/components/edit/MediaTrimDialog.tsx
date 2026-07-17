"use client";

import { useEffect, useState, type SyntheticEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuizStore } from "@/lib/store";
import { useMediaUrl, saveMediaBlob } from "@/lib/media";
import { isTrimSupported, trimMedia, TrimError } from "@/lib/media-trim";
import { uid, formatTime } from "@/lib/utils";
import type { MediaItem } from "@/types/quiz";
import { useT } from "@/lib/i18n";

export function MediaTrimDialog({
  item,
  open,
  onOpenChange,
}: {
  item: MediaItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  const supported = isTrimSupported();

  useEffect(() => {
    setStart(0);
    setEnd(0);
    setDuration(0);
    setAudioOnly(false);
    setError(false);
    setProcessing(false);
  }, [item?.id, open]);

  if (!item) return null;

  function handleLoadedMetadata(e: SyntheticEvent<HTMLVideoElement | HTMLAudioElement>) {
    const d = e.currentTarget.duration || 0;
    setDuration(d);
    setEnd(d);
  }

  async function handleSave() {
    if (!url || !item) return;
    setProcessing(true);
    setError(false);
    try {
      const blob = await trimMedia(url, item.kind === "video" ? "video" : "audio", {
        start,
        end,
        audioOnly,
      });
      const id = uid();
      await saveMediaBlob(id, blob);
      const kind = audioOnly || item.kind === "audio" ? "audio" : "video";
      const newItem: MediaItem = {
        id,
        kind,
        name: `${item.name} (trim)`,
        mimeType: blob.type,
        size: blob.size,
        createdAt: Date.now(),
      };
      addMedia(newItem);
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
              <video
                src={url}
                controls
                className="w-full rounded-xl border border-border bg-black"
                onLoadedMetadata={handleLoadedMetadata}
              />
            )}
            {url && item.kind === "audio" && (
              <audio src={url} controls className="w-full" onLoadedMetadata={handleLoadedMetadata} />
            )}

            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>{t("trimStartLabel")}</span>
                <span className="tabular-nums">{formatTime(start)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={start}
                onChange={(e) => setStart(Math.min(Number(e.target.value), Math.max(end - 0.2, 0)))}
                className="w-full accent-accent"
              />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>{t("trimEndLabel")}</span>
                <span className="tabular-nums">{formatTime(end)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={end}
                onChange={(e) => setEnd(Math.max(Number(e.target.value), start + 0.2))}
                className="w-full accent-accent"
              />
            </div>

            {item.kind === "video" && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={audioOnly}
                  onChange={(e) => setAudioOnly(e.target.checked)}
                  className="accent-accent"
                />
                {t("extractAudioOnly")}
              </label>
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
            <Button disabled={processing || !(end > start) || duration === 0} onClick={handleSave}>
              {processing ? t("processingTrim") : t("saveTrimAsNew")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
