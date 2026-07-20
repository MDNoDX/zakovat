"use client";

import { useEffect } from "react";
import { useQuizStore } from "@/lib/store";

/** True while focus is inside something that has its own text-editing undo
 * (a native input/textarea, or a Tiptap contenteditable field — StarterKit
 * ships its own History extension bound to the same Ctrl/Cmd-Z shortcut).
 * The app's structural undo (bring back a deleted question/stage/etc.)
 * should stay out of the way there, so typing a paragraph and hitting
 * Ctrl-Z undoes the last few characters, not the last few edits anywhere
 * else in the whole quiz. */
function isInsideTextEditor(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest('input, textarea, [contenteditable="true"]');
}

/**
 * Global Ctrl/Cmd-Z (undo) and Ctrl/Cmd-Shift-Z or Ctrl-Y (redo) for the
 * structural edit history — deleting a question/stage/media item and
 * everything else tracked in the store's own past/future stacks. Mount
 * once near the root of Edit Mode.
 */
export function useUndoRedoShortcut() {
  const undo = useQuizStore((s) => s.undo);
  const redo = useQuizStore((s) => s.redo);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (isInsideTextEditor(e.target)) return;

      const key = e.key.toLowerCase();
      if (key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (key === "z") {
        e.preventDefault();
        undo();
      } else if (key === "y") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);
}
