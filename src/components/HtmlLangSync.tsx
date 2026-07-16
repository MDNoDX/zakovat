"use client";

import { useEffect } from "react";
import { useUiLanguageStore } from "@/lib/i18n";

/** Keeps <html lang="..."> in sync with the chosen app interface language. */
export function HtmlLangSync() {
  const language = useUiLanguageStore((s) => s.language);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
