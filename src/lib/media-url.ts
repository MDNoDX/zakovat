"use client";

// Adding media by pasting a URL instead of only ever uploading a file.
// Two completely different paths depending on what the URL points to:
//
//  - YouTube links can never be *downloaded* into a real file from inside a
//    browser (no server, no yt-dlp, and doing so would violate YouTube's
//    terms anyway) -- so these become an embedded MediaItem instead: no
//    blob in IndexedDB, just a `videoId` that every video-playing render
//    site turns into a live YouTube iframe. isYouTubeUrl()/parseYouTubeId()
//    detect this case first, before falling through to a generic fetch.
//
//  - Any other URL is assumed to point straight at a media file (a .jpg,
//    .mp4, .mp3 link, etc.) and gets fetched client-side into a real blob,
//    stored exactly like an upload. This only works when the source site
//    sends permissive CORS headers -- most ordinary file hosts do, many
//    social/video platforms deliberately don't, which surfaces as a clear
//    "couldn't fetch this" error rather than a silent failure.

import type { MediaKind } from "@/types/quiz";
import { mediaKindFromMime } from "@/lib/media";

const YOUTUBE_HOST_RE = /(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/i;

export function isYouTubeUrl(url: string): boolean {
  try {
    return YOUTUBE_HOST_RE.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Extracts the 11-character video id from any common YouTube URL shape
 * (watch?v=, youtu.be/, /shorts/, /embed/, /live/). Returns null for
 * anything that isn't recognizably a single-video YouTube URL (playlists
 * without a `v` param, channel links, etc.). */
export function parseYouTubeId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!YOUTUBE_HOST_RE.test(parsed.hostname)) return null;

  const idFromParam = parsed.searchParams.get("v");
  if (idFromParam && /^[\w-]{11}$/.test(idFromParam)) return idFromParam;

  const pathMatch = parsed.pathname.match(/\/(?:shorts|embed|live)\/([\w-]{11})/);
  if (pathMatch) return pathMatch[1];

  if (parsed.hostname.replace(/^www\./, "") === "youtu.be") {
    const id = parsed.pathname.slice(1).split("/")[0];
    if (/^[\w-]{11}$/.test(id)) return id;
  }

  return null;
}

/** Best-effort real title via YouTube's public oEmbed endpoint (no API key
 * needed, sends permissive CORS). Falls back to a generic name on any
 * failure -- this is a nice-to-have, never something worth blocking on. */
export async function fetchYouTubeTitle(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${videoId}`
      )}&format=json`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string };
    return typeof data.title === "string" ? data.title : null;
  } catch {
    return null;
  }
}

export type MediaUrlErrorCode = "INVALID_URL" | "FETCH_FAILED" | "UNSUPPORTED_TYPE" | "EMPTY_RESPONSE";

export class MediaUrlError extends Error {
  code: MediaUrlErrorCode;
  constructor(code: MediaUrlErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

/** Fetches a direct media URL client-side and returns a blob ready to be
 * saved exactly like an uploaded file. Only succeeds when the source
 * allows cross-origin reads (`fetch` throws/opaques otherwise, which
 * surfaces here as FETCH_FAILED). */
export async function fetchExternalMediaBlob(
  url: string
): Promise<{ blob: Blob; kind: MediaKind; mimeType: string; name: string }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new MediaUrlError("INVALID_URL");
  }

  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new MediaUrlError("FETCH_FAILED");
  }
  if (!res.ok) throw new MediaUrlError("FETCH_FAILED");

  const blob = await res.blob();
  if (blob.size === 0) throw new MediaUrlError("EMPTY_RESPONSE");

  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() || blob.type;
  const kind = mediaKindFromMime(contentType);
  if (!contentType.startsWith("image/") && !contentType.startsWith("video/") && !contentType.startsWith("audio/")) {
    throw new MediaUrlError("UNSUPPORTED_TYPE");
  }

  const nameFromPath = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() ?? "");
  const name = nameFromPath || parsed.hostname;

  return { blob, kind, mimeType: contentType, name };
}
