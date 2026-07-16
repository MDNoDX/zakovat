"use client";

import { Plus, X } from "lucide-react";
import { LANGUAGES, type Language, type LocalizedText } from "@/types/quiz";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

interface LocalizedRichTextEditorProps {
  label?: string;
  value: LocalizedText;
  onChange: (next: LocalizedText) => void;
  placeholder?: string;
  minimal?: boolean;
}

/**
 * One language variant at a time, but the presenter controls which
 * language each row is and can add up to two more below it. Nothing is
 * force-filled — a question can stay Uzbek-only forever if that's all
 * that's needed, or grow to all three languages on demand.
 */
export function LocalizedRichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  minimal,
}: LocalizedRichTextEditorProps) {
  const variants = value.length > 0 ? value : [{ language: "uz" as Language, content: "" }];
  const canAddMore = variants.length < LANGUAGES.length;
  const t = useT();

  function languageOptionsFor(rowIndex: number) {
    const usedByOthers = new Set(
      variants.filter((_, i) => i !== rowIndex).map((v) => v.language)
    );
    return LANGUAGES.filter((l) => !usedByOthers.has(l.code));
  }

  function setLanguageAt(index: number, language: Language) {
    onChange(variants.map((v, i) => (i === index ? { ...v, language } : v)));
  }

  function setContentAt(index: number, content: string) {
    onChange(variants.map((v, i) => (i === index ? { ...v, content } : v)));
  }

  function removeAt(index: number) {
    if (variants.length <= 1) return;
    onChange(variants.filter((_, i) => i !== index));
  }

  function addLanguage() {
    const used = new Set(variants.map((v) => v.language));
    const next = LANGUAGES.find((l) => !used.has(l.code));
    if (!next) return;
    onChange([...variants, { language: next.code, content: "" }]);
  }

  return (
    <div>
      {label && (
        <span className="mb-2 block text-xs font-medium text-muted-foreground">{label}</span>
      )}
      <div className="flex flex-col gap-2.5">
        {variants.map((variant, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface-2/40 p-2.5">
            <div className="mb-2 flex items-center justify-between">
              <select
                value={variant.language}
                onChange={(e) => setLanguageAt(i, e.target.value as Language)}
                className="h-6 rounded-md border border-border bg-surface-2 px-1.5 text-[11px] font-bold uppercase tracking-wide text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                {languageOptionsFor(i).map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                  title={t("removeLanguageTitle")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <RichTextEditor
              value={variant.content}
              onChange={(html) => setContentAt(i, html)}
              placeholder={placeholder}
              minimal={minimal}
            />
          </div>
        ))}
      </div>
      {canAddMore && (
        <button
          type="button"
          onClick={addLanguage}
          className={cn(
            "mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          )}
        >
          <Plus className="h-3 w-3" /> {t("addLanguageAction")}
        </button>
      )}
    </div>
  );
}
