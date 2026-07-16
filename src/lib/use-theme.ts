"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "zakovat-theme";

function applyThemeClass(theme: ThemeMode) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/**
 * App-wide light/dark preference for Edit Mode & the dashboard.
 * Presentation Mode intentionally ignores this and always renders dark,
 * since it's meant for a projector/big screen where a bright background
 * would hurt legibility and look unprofessional in a dim room.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial: ThemeMode = stored === "light" ? "light" : "dark";
    setThemeState(initial);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyThemeClass(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
