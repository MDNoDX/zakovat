"use client";

import { LANGUAGES, type LocalizedText } from "@/types/quiz";
import { RichTextEditor } from "@/components/editor/RichTextEditor";

interface LocalizedRichTextEditorProps {
  label?: string;
  value: LocalizedText;
  onChange: (next: LocalizedText) => void;
  placeholder?: string;
  minimal?: boolean;
}

/**
 * Shows all three languages stacked, one below another, at the same time —
 * no tabs, no separate screens. Each row is labeled with its language so
 * the presenter can fill in translations side by side without losing
 * context of what they already wrote in the other languages.
 */
export function LocalizedRichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  minimal,
}: LocalizedRichTextEditorProps) {
  return (
    <div>
      {label && (
        <span className="mb-2 block text-xs font-medium text-muted-foreground">{label}</span>
      )}
      <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface-2/40 p-2.5">
        {LANGUAGES.map((l, i) => (
          <div key={l.code}>
            <div className="flex items-start gap-2.5">
              <span className="mt-2 flex h-5 w-9 shrink-0 items-center justify-center rounded-md bg-surface-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {l.code}
              </span>
              <div className="flex-1">
                <RichTextEditor
                  value={value[l.code]}
                  onChange={(html) => onChange({ ...value, [l.code]: html })}
                  placeholder={placeholder ? `${placeholder} (${l.label})` : l.label}
                  minimal={minimal}
                />
              </div>
            </div>
            {i < LANGUAGES.length - 1 && <div className="mx-2 mt-2.5 border-t border-border/60" />}
          </div>
        ))}
      </div>
    </div>
  );
}
