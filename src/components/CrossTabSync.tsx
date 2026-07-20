"use client";

import { useEffect } from "react";
import { useQuizStore } from "@/lib/store";

const STORAGE_KEY = "zakovat-store";

/**
 * Presentation Mode always opens in its own browser tab (so it can go
 * fullscreen on a projector while Edit Mode/Quiz Settings stays open
 * elsewhere) — but zustand's localStorage persistence only writes from the
 * tab that made the change; an already-open tab never sees it on its own.
 * Without this, a winner's name typed into Quiz Settings would never show
 * up on an already-open closing slide (and a name typed live on the
 * closing slide itself would never show back up in Settings) until a
 * manual reload.
 *
 * The browser fires a native `storage` event in every OTHER tab whenever
 * localStorage changes, so listening for it and re-reading the persisted
 * state keeps every open tab of the app in sync automatically — both
 * directions, no reload needed.
 */
export function CrossTabSync() {
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      useQuizStore.persist.rehydrate();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return null;
}
