"use client";

import { useState } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import { useMediaUrl } from "@/lib/media";
import { MediaLibraryDialog } from "@/components/edit/MediaLibraryDialog";
import { useT } from "@/lib/i18n";

/**
 * Shared preview/replace/clear UI for a single full-bleed background image
 * setting — used by the quiz's own background, the quiz's answer-reveal
 * background, and a stage's background. Kept as one component so all three
 * look and behave identically instead of drifting apart over time.
 */
export function BackgroundImageField({
  label,
  hint,
  mediaId,
  onChange,
}: {
  label: string;
  hint: string;
  mediaId: string | null | undefined;
  onChange: (mediaId: string | null) => void;
}) {
  const [picking, setPicking] = useState(false);
  const url = useMediaUrl(mediaId);
  const t = useT();

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      {mediaId && url ? (
        <div className="group relative w-full max-w-xs overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="max-h-40 w-full object-cover" />
          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => setPicking(true)}
              className="rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              title={t("replaceMedia")}
              aria-label={t("replaceMedia")}
            >
              <ImageIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onChange(null)}
              className="rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              title={t("delete")}
              aria-label={t("delete")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setPicking(true)}
          className="flex w-full max-w-xs flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-surface-2 py-8 text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
        >
          <ImageIcon className="h-5 w-5" />
          <span className="text-xs">{t("chooseFile")}</span>
        </button>
      )}
      <p className="mt-1.5 text-[11px] text-muted-foreground/70">{hint}</p>
      <MediaLibraryDialog
        open={picking}
        onOpenChange={setPicking}
        filterKind="image"
        onSelect={(ids) => onChange(ids[0] ?? null)}
      />
    </div>
  );
}
