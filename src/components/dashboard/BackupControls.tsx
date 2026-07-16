"use client";

import { useRef, useState } from "react";
import { Download, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportBackup, importBackup } from "@/lib/backup";
import { useT } from "@/lib/i18n";

/**
 * Everything in this app lives only in this browser's storage — there is no
 * cloud backend. These two buttons are the presenter's safety net: a single
 * portable .json file with every quiz and every media file, downloadable
 * any time and restorable later (same machine or a different one).
 */
export function BackupControls() {
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"export" | "import" | null>(null);

  async function handleExport() {
    if (busy) return;
    setBusy("export");
    try {
      await exportBackup();
    } finally {
      setBusy(null);
    }
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    setBusy("import");
    try {
      const result = await importBackup(file);
      alert(`${result.quizzesAdded} ta zakovat, ${result.mediaAdded} ta fayl ${t("importSuccess")}.`);
    } catch {
      alert(t("importFailed"));
    } finally {
      setBusy(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <Button
        variant="ghost"
        size="icon"
        title={t("downloadBackup")}
        aria-label={t("downloadBackup")}
        onClick={handleExport}
        disabled={busy !== null}
      >
        {busy === "export" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title={t("restoreBackup")}
        aria-label={t("restoreBackup")}
        onClick={() => fileInputRef.current?.click()}
        disabled={busy !== null}
      >
        {busy === "import" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      </Button>
    </div>
  );
}
