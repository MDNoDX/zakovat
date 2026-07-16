"use client";

import { useRef, useState } from "react";
import { UploadCloud, Trash2, Check } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

interface MediaLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Restrict uploads/selection to a single kind (image | video | audio) or allow all. */
  filterKind?: MediaKind;
  /** Allow picking more than one item in a single session (used for multi-image questions). */
  multiple?: boolean;
  onSelect?: (mediaIds: string[]) => void;
}

export function MediaLibraryDialog({
  open,
  onOpenChange,
  filterKind,
  multiple,
  onSelect,
}: MediaLibraryDialogProps) {
  const media = useQuizStore((s) => s.media);
  const addMedia = useQuizStore((s) => s.addMedia);
  const deleteMedia = useQuizStore((s) => s.deleteMedia);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const t = useT();

  const items = filterKind ? media.filter((m) => m.kind === filterKind) : media;

  const accept =
    filterKind === "image"
      ? "image/*"
      : filterKind === "video"
      ? "video/*"
      : filterKind === "audio"
      ? "audio/*"
      : "image/*,video/*,audio/*";

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const kind = mediaKindFromMime(file.type);
      if (filterKind && kind !== filterKind) continue;
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
      if (multiple) setPicked((p) => [...p, id]);
      else setPicked([id]);
    }
    setUploading(false);
  }

  function togglePick(id: string) {
    if (multiple) {
      setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    } else {
      setPicked([id]);
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
                onClick={() => togglePick(item.id)}
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
                  className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
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
    </Dialog>
  );
}
