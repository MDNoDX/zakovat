"use client";

// Full backup export/import. Everything in this app lives only in one
// browser's localStorage + IndexedDB (no cloud backend), so clearing site
// data, switching browsers, or moving to a new machine would otherwise mean
// total data loss. This lets a presenter download everything (quizzes +
// media files, base64-encoded) as one portable .json file, and restore it
// later — on this machine or a different one.
//
// Imported content is treated as untrusted: every rich-text field is passed
// through sanitizeHtml(), every quiz/stage/question/option gets a fresh id
// (so importing the same backup twice, or into a browser that already has
// data, never collides), and media blobs are re-saved under fresh ids with
// every reference remapped to match.

import { uid } from "@/lib/utils";
import { useQuizStore } from "@/lib/store";
import { saveMediaBlob } from "@/lib/media";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type {
  LocalizedText,
  MediaItem,
  Question,
  Quiz,
  Stage,
} from "@/types/quiz";

const BACKUP_VERSION = 1;

interface BackupFile {
  app: "zakovat";
  version: number;
  exportedAt: number;
  quizzes: Quiz[];
  media: MediaItem[];
  /** mediaId -> base64 data URL */
  mediaBlobs: Record<string, string>;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function exportBackup(): Promise<void> {
  const { quizzes, media } = useQuizStore.getState();
  const { getMediaBlob } = await import("@/lib/media");

  const mediaBlobs: Record<string, string> = {};
  for (const item of media) {
    const blob = await getMediaBlob(item.id);
    if (blob) mediaBlobs[item.id] = await blobToDataUrl(blob);
  }

  const payload: BackupFile = {
    app: "zakovat",
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    quizzes,
    media,
    mediaBlobs,
  };

  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `zakovat-zaxira-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** A never-before-migrated plain string — split on the line breaks the
 * presenter actually typed into one paragraph per line, instead of
 * collapsing them into one run-on block. */
function plainTextToParagraphs(raw: string): string {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const toUse = lines.length > 0 ? lines : [raw.trim()];
  return toUse.map((l) => `<p>${l}</p>`).join("");
}

/** Tiptap-authored HTML never contains a literal newline character, so
 * finding one inside already-migrated content is an unambiguous sign it
 * came from the old plain-text field and (due to a bug in an earlier
 * migration) is still sitting in one flattened paragraph. Re-splits it. */
function repairFlattenedParagraph(html: string): string {
  if (!html.includes("\n")) return html;
  const inner = html.replace(/^<p>/i, "").replace(/<\/p>\s*$/i, "");
  const lines = inner
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return lines.map((l) => `<p>${l}</p>`).join("");
}

function sanitizeLocalizedText(value: unknown): LocalizedText {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (v): v is { language: unknown; content: unknown } =>
        isPlainObject(v) && typeof v.content === "string"
    )
    .map((v) => ({
      language: (["uz", "ru", "en"].includes(v.language as string) ? v.language : "uz") as
        | "uz"
        | "ru"
        | "en",
      content: repairFlattenedParagraph(sanitizeHtml(v.content as string)),
    }));
}

function sanitizeQuizDescription(value: unknown): LocalizedText | undefined {
  if (Array.isArray(value)) {
    const result = sanitizeLocalizedText(value);
    return result.length > 0 ? result : undefined;
  }
  // Backups exported before the quiz-level description became rich text
  // stored it as a plain string — wrap it so older backups still import.
  if (typeof value === "string" && value.trim() !== "") {
    return [{ language: "uz", content: sanitizeHtml(plainTextToParagraphs(value)) }];
  }
  return undefined;
}

export interface ImportResult {
  quizzesAdded: number;
  mediaAdded: number;
}

export async function importBackup(file: File): Promise<ImportResult> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("invalid-json");
  }
  if (!isPlainObject(parsed) || parsed.app !== "zakovat" || !Array.isArray(parsed.quizzes)) {
    throw new Error("invalid-format");
  }

  // Deliberately kept as `unknown[]`/`Record<string, unknown>` all the way
  // through this function — this is untrusted file content, not a value we
  // already know matches our own types. Every field is read defensively and
  // only assembled into a real Quiz/Stage/Question at the very end.
  const rawQuizList: unknown[] = parsed.quizzes;
  const rawMediaList: unknown[] = Array.isArray(parsed.media) ? parsed.media : [];
  const rawBlobs: Record<string, unknown> = isPlainObject(parsed.mediaBlobs) ? parsed.mediaBlobs : {};

  // 1. Re-save every media blob under a fresh id, building an old->new map.
  const mediaIdMap = new Map<string, string>();
  let mediaAdded = 0;

  for (const item of rawMediaList) {
    if (!isPlainObject(item) || typeof item.id !== "string") continue;
    const dataUrl = rawBlobs[item.id];
    if (typeof dataUrl !== "string") continue;
    const newId = uid();
    try {
      const blob = await dataUrlToBlob(dataUrl);
      await saveMediaBlob(newId, blob);
      useQuizStore.getState().addMedia({
        id: newId,
        kind: (item.kind as MediaItem["kind"]) ?? "image",
        name: typeof item.name === "string" ? item.name : "Import qilingan fayl",
        mimeType: typeof item.mimeType === "string" ? item.mimeType : blob.type,
        size: typeof item.size === "number" ? item.size : blob.size,
        createdAt: Date.now(),
        width: typeof item.width === "number" ? item.width : undefined,
        height: typeof item.height === "number" ? item.height : undefined,
      });
      mediaIdMap.set(item.id, newId);
      mediaAdded++;
    } catch {
      // Skip any single corrupt media entry rather than aborting the whole import.
    }
  }

  const remapMediaId = (id: unknown): string | null => {
    if (typeof id !== "string") return null;
    return mediaIdMap.get(id) ?? null;
  };

  // 2. Rebuild every quiz with fresh ids, sanitized text, and remapped media.
  let quizzesAdded = 0;
  for (const rawQuizUnknown of rawQuizList) {
    if (!isPlainObject(rawQuizUnknown)) continue;
    const rawQuiz: Record<string, unknown> = rawQuizUnknown;
    const now = Date.now();
    const rawStages: unknown[] = Array.isArray(rawQuiz.stages) ? rawQuiz.stages : [];

    const stages: Stage[] = rawStages
      .filter(isPlainObject)
      .map((rawStage: Record<string, unknown>) => {
        const rawQuestions: unknown[] = Array.isArray(rawStage.questions) ? rawStage.questions : [];
        const questions: Question[] = rawQuestions
          .filter(isPlainObject)
          .map((rawQ: Record<string, unknown>) => {
            const type = rawQ.type as Question["type"];
            const answerRaw: Record<string, unknown> = isPlainObject(rawQ.answer) ? rawQ.answer : {};
            const base = {
              id: uid(),
              prompt: sanitizeLocalizedText(rawQ.prompt),
              timerSeconds: (rawQ.timerSeconds ?? null) as Question["timerSeconds"],
              answer: {
                correctText: sanitizeLocalizedText(answerRaw.correctText),
                explanation:
                  answerRaw.explanation !== undefined
                    ? sanitizeLocalizedText(answerRaw.explanation)
                    : undefined,
                mediaId: remapMediaId(answerRaw.mediaId),
              },
              backgroundImageId: remapMediaId(rawQ.backgroundImageId),
              createdAt: now,
              updatedAt: now,
            };

            switch (type) {
              case "multiple-choice": {
                const rawOptions = Array.isArray(rawQ.options) ? rawQ.options : [];
                const options = rawOptions.filter(isPlainObject).map((o) => ({
                  id: uid(),
                  text: sanitizeLocalizedText(o.text),
                }));
                const oldCorrectIdx = rawOptions.findIndex(
                  (o) => isPlainObject(o) && o.id === rawQ.correctOptionId
                );
                return {
                  ...base,
                  type: "multiple-choice",
                  options,
                  correctOptionId: oldCorrectIdx >= 0 ? options[oldCorrectIdx]?.id ?? null : null,
                } as Question;
              }
              case "image":
                return { ...base, type: "image", mediaId: remapMediaId(rawQ.mediaId) } as Question;
              case "multi-image": {
                const ids = Array.isArray(rawQ.mediaIds) ? rawQ.mediaIds : [];
                const mediaIds = ids.map(remapMediaId).filter((id): id is string => Boolean(id));
                return {
                  ...base,
                  type: "multi-image",
                  mediaIds,
                  revealStyle: rawQ.revealStyle === "sequential" ? "sequential" : "all-at-once",
                } as Question;
              }
              case "music":
                return { ...base, type: "music", mediaId: remapMediaId(rawQ.mediaId) } as Question;
              case "video":
                return { ...base, type: "video", mediaId: remapMediaId(rawQ.mediaId) } as Question;
              default:
                return { ...base, type: "text" } as Question;
            }
          });

        return {
          id: uid(),
          name: sanitizeLocalizedText(rawStage.name),
          description: sanitizeLocalizedText(rawStage.description),
          revealMode:
            rawStage.revealMode === "end-of-stage" || rawStage.revealMode === "manual"
              ? rawStage.revealMode
              : "after-each",
          questions,
          createdAt: now,
          updatedAt: now,
        };
      });

    const quiz: Quiz = {
      id: uid(),
      title: typeof rawQuiz.title === "string" ? rawQuiz.title : "Import qilingan Zakovat",
      description: sanitizeQuizDescription(rawQuiz.description),
      defaultLanguage:
        rawQuiz.defaultLanguage === "ru" || rawQuiz.defaultLanguage === "en"
          ? rawQuiz.defaultLanguage
          : "uz",
      stages,
      createdAt: now,
      updatedAt: now,
    };

    useQuizStore.getState().installQuiz(quiz);
    quizzesAdded++;
  }

  return { quizzesAdded, mediaAdded };
}
