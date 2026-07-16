"use client";

import { useEffect, useState } from "react";
import { LANGUAGES } from "@/types/quiz";
import { useUiLanguageStore } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** App interface language switcher (uz/ru/en) — for the surrounding chrome, not quiz content. */
export function LanguageSwitcher() {
  const language = useUiLanguageStore((s) => s.language);
  const setLanguage = useUiLanguageStore((s) => s.setLanguage);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-surface-2 p-0.5">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLanguage(l.code)}
          className={cn(
            "rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors",
            mounted && language === l.code
              ? "bg-accent text-white"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l.code}
        </button>
      ))}
    </div>
  );
}
