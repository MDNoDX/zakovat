"use client";

import { useRef, useState } from "react";
import { UploadCloud, Trash2, Check, Pencil, Scissors } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuizStore } from "@/lib/store";
import { mediaKindFromMime, readImageDimensions, saveMediaBlob, deleteMediaBlob } from "@/lib/media";
import { uid } from "@/lib/utils";
import type { MediaItem, MediaKind } from "@/types/quiz";
import { MediaThumb } from "@/components/edit/MediaThumb";
import { MediaTrimDialog } from "@/components/edit/MediaTrimDialog";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

interface MediaLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Restrict uploads/selection to one or more kinds (image | video | audio) or allow all. */
  filterKind?: MediaKind | MediaKind[];
  /** Allow picking more than one item in a single session (used for multi-image questions). */
  multiple?: boolean;
  onSelect?: (mediaIds: string[]) => void;
  /** The field being filled must end up as audio, but a video is an
   * acceptable source (e.g. a music question's clip pulled from a movie
   * scene). When true, any video the user clicks or uploads is routed
   * through the trim dialog with "extract audio only" forced on, instead
   * of ever being attached to the field as-is. */
  forceAudioExtraction?: boolean;
}

export function MediaLibraryDialog({
  open,
  onOpenChange,
  filterKind,
  multiple,
  onSelect,
  forceAudioExtraction,
}: MediaLibraryDialogProps) {
  const media = useQuizStore((s) => s.media);
  const addMedia = useQuizStore((s) => s.addMedia);
  const deleteMedia = useQuizStore((s) => s.deleteMedia);
  const updateMediaCaption = useQuizStore((s) => s.updateMediaCaption);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [trimTarget, setTrimTarget] = useState<MediaItem | null>(null);
  const [lockAudioOnly, setLockAudioOnly] = useState(false);
  const t = useT();

  function openExtractionTrim(item: MediaItem) {
    setLockAudioOnly(true);
    setTrimTarget(item);
  }

  const allowedKinds = filterKind ? (Array.isArray(filterKind) ? filterKind : [filterKind]) : null;
  const items = allowedKinds ? media.filter((m) => allowedKinds.includes(m.kind)) : media;

  const MIME_BY_KIND: Record<MediaKind, string> = {
    image: "image/*",
    video: "video/*",
    audio: "audio/*",
  };
  const accept = allowedKinds
    ? allowedKinds.map((k) => MIME_BY_KIND[k]).join(",")
    : "image/*,video/*,audio/*";

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const kind = mediaKindFromMime(file.type);
      if (allowedKinds && !allowedKinds.includes(kind)) continue;
      const id = uid();
      await saveMediaBlob(id, file);
      let dims: { width: number; height: number } | undefined;
      if (kind === "image") dims = await readImageDimensions(file);
      const item: MediaItem = {
        id,
        kind,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        createdAt: Date.now(),
        ...dims,
      };
      addMedia(item);
      if (forceAudioExtraction && kind === "video") {
        openExtractionTrim(item);
      } else if (multiple) {
        setPicked((p) => [...p, id]);
      } else {
        setPicked([id]);
      }
    }
    setUploading(false);
  }

  function togglePick(item: MediaItem) {
    if (forceAudioExtraction && item.kind === "video") {
      openExtractionTrim(item);
      return;
    }
    if (multiple) {
      setPicked((p) => (p.includes(item.id) ? p.filter((x) => x !== item.id) : [...p, item.id]));
    } else {
      setPicked([item.id]);
    }
  }

  function confirmSelection() {
    onSelect?.(picked);
    setPicked([]);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("mediaLibrary")}</DialogTitle>
          <DialogDescription>{t("mediaLibraryDescription")}</DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="mb-4 flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-surface-2 py-6 text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
        >
          <UploadCloud className="h-5 w-5" />
          <span className="text-xs">{uploading ? t("uploading") : t("clickToUpload")}</span>
        </button>

        <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto">
          {items.length === 0 && (
            <p className="col-span-4 py-6 text-center text-xs text-muted-foreground">
              {t("noMediaYet")}
            </p>
          )}
          {items.map((item) => {
            const isPicked = picked.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => togglePick(item)}
                className={cn(
                  "group relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 transition-all",
                  isPicked ? "border-accent" : "border-transparent hover:border-border"
                )}
              >
                <MediaThumb item={item} className="h-full w-full" />
                {isPicked && (
                  <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                <div className="absolute left-1 top-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(t("confirmDeleteMedia"))) {
                        deleteMediaBlob(item.id);
                        deleteMedia(item.id);
                        setPicked((p) => p.filter((x) => x !== item.id));
                      }
                    }}
                    aria-label={t("delete")}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = window.prompt(t("captionPromptMessage"), item.caption ?? "");
                      if (next !== null) updateMediaCaption(item.id, next);
                    }}
                    aria-label={t("editCaption")}
                    title={t("editCaption")}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  {(item.kind === "video" || item.kind === "audio") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLockAudioOnly(!!forceAudioExtraction && item.kind === "video");
                        setTrimTarget(item);
                      }}
                      aria-label={t("trimMedia")}
                      title={t("trimMedia")}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                    >
                      <Scissors className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {item.caption && (
                  <div className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-1.5 py-1 text-[10px] text-white">
                    {item.caption}
                  </div>
                )}
                {forceAudioExtraction && item.kind === "video" && !item.caption && (
                  <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 truncate bg-black/70 px-1.5 py-1 text-[10px] text-white">
                    <Scissors className="h-2.5 w-2.5 shrink-0" /> {t("audioOnlyBadge")}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button disabled={picked.length === 0} onClick={confirmSelection}>
            {t("select")}{picked.length > 1 ? ` (${picked.length})` : ""}
          </Button>
        </div>
      </DialogContent>

      <MediaTrimDialog
        item={trimTarget}
        open={trimTarget !== null}
        forceAudioOnly={lockAudioOnly}
        onOpenChange={(o) => {
          if (!o) {
            setTrimTarget(null);
            setLockAudioOnly(false);
          }
        }}
        onSaved={(newItem) => {
          // If this library session is picking media for a specific field
          // (onSelect exists), the trimmed clip IS what the user wants
          // attached — apply it immediately instead of leaving them to find
          // and re-select the new "(trim)" copy by hand. Otherwise (plain
          // library management) just highlight it as picked.
          if (onSelect) {
            onSelect([newItem.id]);
            setPicked([]);
            onOpenChange(false);
          } else {
            setPicked([newItem.id]);
          }
        }}
      />
    </Dialog>
  );
}
