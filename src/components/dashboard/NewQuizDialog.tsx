"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuizStore } from "@/lib/store";
import { emptyLocalizedText, type LocalizedText } from "@/types/quiz";
import { LocalizedRichTextEditor } from "@/components/editor/LocalizedRichTextEditor";
import { useT, rulesTemplateHtml, useUiLanguageStore } from "@/lib/i18n";

export function NewQuizDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState<LocalizedText>(emptyLocalizedText());
  const createQuiz = useQuizStore((s) => s.createQuiz);
  const router = useRouter();
  const t = useT();
  const uiLanguage = useUiLanguageStore((s) => s.language);

  function reset() {
    setTitle("");
    setDescription(emptyLocalizedText());
  }

  function handleCreate() {
    const id = createQuiz(title.trim() || "Nomsiz Zakovat", description);
    reset();
    onOpenChange(false);
    router.push(`/edit/${id}`);
  }

  function applyTemplate() {
    setDescription((prev) => {
      const lang = prev[0]?.language ?? uiLanguage;
      const rest = prev.slice(1);
      return [{ language: lang, content: rulesTemplateHtml(lang) }, ...rest];
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("newQuizDialogTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {t("nameLabel")}
            </label>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("nameLabel")}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-medium text-muted-foreground">
                {t("descriptionLabel")} <span className="text-muted-foreground/50">{t("optional")}</span>
              </label>
              <button
                type="button"
                onClick={applyTemplate}
                className="flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
              >
                <Sparkles className="h-3 w-3" /> {t("useRulesTemplate")}
              </button>
            </div>
            <LocalizedRichTextEditor
              value={description}
              placeholder={t("descriptionPlaceholder")}
              onChange={setDescription}
              minimal
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground/70">{t("quizDescriptionHint")}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleCreate}>{t("create")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
