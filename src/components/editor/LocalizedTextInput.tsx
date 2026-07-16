"use client";

import { LANGUAGES, type LocalizedText } from "@/types/quiz";
import { Input } from "@/components/ui/input";

interface LocalizedTextInputProps {
  label?: string;
  value: LocalizedText;
  onChange: (next: LocalizedText) => void;
  placeholder?: string;
}

/**
 * Compact single-line localized field — all three languages stacked and
 * visible at once (no tabs), matching LocalizedRichTextEditor's layout.
 */
export function LocalizedTextInput({
  label,
  value,
  onChange,
  placeholder,
}: LocalizedTextInputProps) {
  return (
    <div>
      {label && (
        <span className="mb-2 block text-xs font-medium text-muted-foreground">{label}</span>
      )}
      <div className="flex flex-col gap-2">
        {LANGUAGES.map((l) => (
          <div key={l.code} className="flex items-center gap-2.5">
            <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded-md bg-surface-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {l.code}
            </span>
            <Input
              value={value[l.code]}
              placeholder={placeholder ? `${placeholder} (${l.label})` : l.label}
              onChange={(e) => onChange({ ...value, [l.code]: e.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
