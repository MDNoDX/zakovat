"use client";

import { createStore, get, set, del } from "idb-keyval";
import { useEffect, useState } from "react";
import type { MediaKind } from "@/types/quiz";

// Dedicated IndexedDB store just for binary blobs (images/audio/video).
// Metadata (name, kind, size...) lives in the Zustand-persisted quiz store
// so it can be listed instantly without touching IndexedDB.
const blobStore =
  typeof indexedDB !== "undefined" ? createStore("zakovat-media", "blobs") : undefined;

export async function saveMediaBlob(id: string, blob: Blob): Promise<void> {
  if (!blobStore) return;
  await set(id, blob, blobStore);
}

export async function getMediaBlob(id: string): Promise<Blob | undefined> {
  if (!blobStore) return undefined;
  return get<Blob>(id, blobStore);
}

export async function deleteMediaBlob(id: string): Promise<void> {
  if (!blobStore) return;
  await del(id, blobStore);
}

export function mediaKindFromMime(mime: string): MediaKind {
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "image";
}

// Simple in-memory cache so the same media item doesn't get re-read /
// re-blessed with a new object URL on every render.
const urlCache = new Map<string, string>();

export async function getMediaObjectUrl(id: string | null | undefined): Promise<string | null> {
  if (!id) return null;
  const cached = urlCache.get(id);
  if (cached) return cached;
  const blob = await getMediaBlob(id);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}

export function invalidateMediaUrl(id: string) {
  const url = urlCache.get(id);
  if (url) URL.revokeObjectURL(url);
  urlCache.delete(id);
}

/** React hook: resolves a mediaId to a usable object URL. */
export function useMediaUrl(mediaId: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    if (!mediaId) return;
    getMediaObjectUrl(mediaId).then((resolved) => {
      if (!cancelled) setUrl(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [mediaId]);

  return url;
}

export function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  });
}
